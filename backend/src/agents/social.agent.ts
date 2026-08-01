import { prisma } from '../lib/prisma.js';
import { extractSkills } from '../services/skills.service.js';
import { unique } from '../utils/helpers.js';
import { clampScore, scoreFromComponents, type AgentComponent, type AgentResult } from './types.js';

/**
 * Social Intelligence Agent.
 *
 * The point of this agent is that it deliberately does *not* score follower
 * counts. It scores technical influence: whether the candidate publishes
 * substantive technical work, teaches, speaks, and engages across more than one
 * community. A large audience with no technical output scores near zero here.
 */

interface ChannelProfile {
  key: string;
  label: string;
  /** How much weight this channel carries as evidence of technical influence. */
  weight: number;
  hosts: string[];
  kind: 'writing' | 'community' | 'speaking' | 'social' | 'code';
}

const CHANNELS: ChannelProfile[] = [
  { key: 'personal_blog', label: 'Technical blog', weight: 10, hosts: [], kind: 'writing' },
  { key: 'devto', label: 'Dev.to', weight: 8, hosts: ['dev.to'], kind: 'writing' },
  { key: 'medium', label: 'Medium', weight: 6, hosts: ['medium.com'], kind: 'writing' },
  { key: 'hashnode', label: 'Hashnode', weight: 7, hosts: ['hashnode.com', 'hashnode.dev'], kind: 'writing' },
  { key: 'substack', label: 'Substack', weight: 7, hosts: ['substack.com'], kind: 'writing' },
  { key: 'stackoverflow', label: 'Stack Overflow', weight: 10, hosts: ['stackoverflow.com'], kind: 'community' },
  { key: 'github_discussions', label: 'GitHub', weight: 6, hosts: ['github.com'], kind: 'code' },
  { key: 'youtube', label: 'YouTube', weight: 6, hosts: ['youtube.com', 'youtu.be'], kind: 'speaking' },
  { key: 'speakerdeck', label: 'Speaker Deck', weight: 7, hosts: ['speakerdeck.com', 'slideshare.net'], kind: 'speaking' },
  { key: 'conference', label: 'Conference talk', weight: 10, hosts: ['sessionize.com', 'papercall.io'], kind: 'speaking' },
  { key: 'linkedin', label: 'LinkedIn', weight: 4, hosts: ['linkedin.com'], kind: 'social' },
  { key: 'twitter', label: 'X / Twitter', weight: 4, hosts: ['twitter.com', 'x.com'], kind: 'social' },
  { key: 'kaggle', label: 'Kaggle', weight: 8, hosts: ['kaggle.com'], kind: 'community' },
  { key: 'arxiv', label: 'Research paper', weight: 10, hosts: ['arxiv.org', 'acm.org', 'ieee.org', 'researchgate.net'], kind: 'writing' },
];

const SPEAKING_HINT = /\b(spoke|speaker|talk|keynote|session|panel|workshop|meetup|conference|webinar)\b/i;
const TEACHING_HINT = /\b(mentor|mentoring|taught|teaching|tutorial|course|workshop|guide|walkthrough|explained)\b/i;
const DEPTH_HINT = /\b(architecture|internals|deep dive|benchmark|trade[- ]?offs?|design|implementation|under the hood|postmortem|case study)\b/i;

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
};

function classifyLink(url: string): ChannelProfile {
  const host = hostOf(url);
  if (!host) return CHANNELS[0];
  const match = CHANNELS.find((channel) => channel.hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`)));
  // An unrecognised domain that the candidate published on is treated as their
  // own technical blog, which is the highest-weight writing channel.
  return match || CHANNELS[0];
}

export async function runSocialAgent(candidateId: string): Promise<AgentResult> {
  const [profile, linkedIn, evidence] = await Promise.all([
    prisma.candidateProfile.findUnique({ where: { candidateId }, include: { links: true } }),
    prisma.linkedInConnection.findUnique({ where: { candidateId } }),
    prisma.evidence.findMany({
      where: { candidateId, source: { in: ['presentation', 'project'] }, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'] } },
    }),
  ]);

  const links = [
    ...(profile?.links.map((link) => ({ url: link.url, label: link.label })) || []),
    ...evidence.filter((row) => row.referenceUrl).map((row) => ({ url: row.referenceUrl!, label: row.title })),
  ];

  if (!links.length && !linkedIn) {
    return {
      agent: 'social',
      score: 0,
      confidence: 0,
      engine: 'deterministic',
      summary: 'No public technical presence has been linked.',
      components: [],
      skills: [],
      signals: { available: false, reason: 'no_links', channels: [] },
    };
  }

  const classified = links.map((link) => ({ ...link, channel: classifyLink(link.url) }));
  const byKind = (kind: ChannelProfile['kind']) => classified.filter((entry) => entry.channel.kind === kind);

  const narrativeText = [
    ...links.map((link) => link.label),
    ...evidence.map((row) => `${row.title} ${row.description || ''}`),
  ].join(' ');

  const distinctChannels = unique(classified.map((entry) => entry.channel.key));
  const influenceWeight = distinctChannels.reduce(
    (total, key) => total + (CHANNELS.find((channel) => channel.key === key)?.weight ?? 0),
    0,
  );

  const speakingCount = byKind('speaking').length + (SPEAKING_HINT.test(narrativeText) ? 1 : 0);
  const teaching = TEACHING_HINT.test(narrativeText);
  const depth = DEPTH_HINT.test(narrativeText);

  const components: AgentComponent[] = [
    {
      key: 'knowledge_sharing',
      label: 'Knowledge sharing',
      score: Math.min(25, byKind('writing').length * 8),
      max: 25,
      evidence: `${byKind('writing').length} published writing channel(s)`,
    },
    {
      key: 'technical_influence',
      label: 'Technical influence',
      score: Math.min(25, influenceWeight),
      max: 25,
      evidence: `${distinctChannels.length} distinct channel(s) weighted by technical credibility, not audience size`,
    },
    {
      key: 'community',
      label: 'Community engagement',
      score: Math.min(20, byKind('community').length * 10),
      max: 20,
      evidence: `${byKind('community').length} developer community profile(s)`,
    },
    {
      key: 'speaking',
      label: 'Speaking and teaching',
      score: Math.min(15, speakingCount * 6 + (teaching ? 4 : 0)),
      max: 15,
      evidence: `${speakingCount} speaking signal(s)${teaching ? ', teaching or mentoring described' : ''}`,
    },
    {
      key: 'thought_leadership',
      label: 'Thought leadership',
      score: depth ? 10 : classified.length ? 3 : 0,
      max: 10,
      evidence: depth
        ? 'Linked work describes architecture, trade-offs or analysis in depth'
        : 'No in-depth technical analysis detected in linked work',
    },
    {
      key: 'identity',
      label: 'Verified professional identity',
      score: linkedIn ? 5 : 0,
      max: 5,
      evidence: linkedIn ? 'LinkedIn identity connected' : 'No verified professional identity connected',
    },
  ];

  return {
    agent: 'social',
    score: scoreFromComponents(components),
    confidence: clampScore(classified.length * 12 + distinctChannels.length * 10 + (linkedIn ? 10 : 0)),
    engine: 'deterministic',
    summary:
      `${distinctChannels.length} technical channel(s) across ${classified.length} link(s). ` +
      `Scored on technical influence and knowledge sharing, not follower counts.`,
    components,
    skills: extractSkills(narrativeText).map((slug) => ({ slug, level: 35, source: 'social' })),
    signals: {
      available: true,
      channels: classified.map((entry) => ({ url: entry.url, label: entry.label, channel: entry.channel.label, kind: entry.channel.kind })),
      distinctChannels,
      speakingSignals: speakingCount,
      teaching,
      depth,
      linkedInConnected: Boolean(linkedIn),
      note: 'Follower and connection counts are deliberately excluded from this score.',
      linkedInProfile: linkedIn ? { name: linkedIn.name, avatarUrl: linkedIn.avatarUrl } : null,
    },
  };
}
