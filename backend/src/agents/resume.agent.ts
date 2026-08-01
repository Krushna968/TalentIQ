import { extractSkills } from '../services/skills.service.js';
import { complete, engineName } from '../services/llm.service.js';
import { unique } from '../utils/helpers.js';
import { clampScore, scoreFromComponents, type AgentComponent, type AgentResult } from './types.js';

/**
 * Resume Agent — turns a resume into structured JSON plus a quality score.
 *
 * The parser is deliberately deterministic so the same resume always yields the
 * same structure. The optional LLM pass only rewrites the human-readable
 * summary; it never changes the score or the extracted fields.
 */

export interface ResumeSection {
  title: string;
  lines: string[];
}

export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  links: string[];
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  wordCount: number;
  /** Bullets that quantify an outcome, e.g. "cut latency by 40%". */
  quantifiedAchievements: string[];
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/;
const PHONE = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}\b/;
const URL = /https?:\/\/[^\s,)]+/g;
const QUANTIFIED = /\b\d+(?:\.\d+)?\s*(?:%|percent|x\b|k\b|m\b|million|users|requests|ms\b|seconds|hours|days)/i;

const HEADINGS: Array<{ key: keyof ParsedResume; patterns: RegExp }> = [
  { key: 'education', patterns: /^(education|academics?|qualifications?)\b/i },
  { key: 'experience', patterns: /^(experience|employment|work history|professional experience)\b/i },
  { key: 'projects', patterns: /^(projects?|personal projects?|selected work)\b/i },
  { key: 'certifications', patterns: /^(certifications?|licenses?|credentials?|courses?)\b/i },
  { key: 'skills', patterns: /^(skills?|technical skills?|technologies|tech stack)\b/i },
];

const isHeading = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 60) return false;
  if (HEADINGS.some((heading) => heading.patterns.test(trimmed))) return true;
  // ALL CAPS short lines are conventional resume headings.
  return trimmed === trimmed.toUpperCase() && /^[A-Z][A-Z\s&/-]{2,}$/.test(trimmed);
};

/** Splits a resume into labelled sections using its headings. */
export function splitSections(text: string): ResumeSection[] {
  const sections: ResumeSection[] = [];
  let current: ResumeSection = { title: 'header', lines: [] };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (isHeading(line)) {
      if (current.lines.length || current.title !== 'header') sections.push(current);
      current = { title: line.toLowerCase(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);
  return sections;
}

const sectionFor = (sections: ResumeSection[], key: keyof ParsedResume) => {
  const heading = HEADINGS.find((entry) => entry.key === key);
  if (!heading) return [];
  return sections.filter((section) => heading.patterns.test(section.title)).flatMap((section) => section.lines);
};

export function parseResume(text: string): ParsedResume {
  const sections = splitSections(text);
  const header = sections.find((section) => section.title === 'header')?.lines || [];

  // The first header line that is not contact detail is almost always the name.
  const name =
    header.find((line) => !EMAIL.test(line) && !PHONE.test(line) && !/https?:/.test(line) && /^[A-Za-z][A-Za-z .'-]{2,60}$/.test(line)) ||
    null;

  const experience = sectionFor(sections, 'experience');
  const projects = sectionFor(sections, 'projects');

  return {
    name,
    email: text.match(EMAIL)?.[0] || null,
    phone: text.match(PHONE)?.[0] || null,
    links: unique(text.match(URL) || []).slice(0, 20),
    skills: extractSkills(text),
    education: sectionFor(sections, 'education'),
    experience,
    projects,
    certifications: sectionFor(sections, 'certifications'),
    wordCount: text.split(/\s+/).filter(Boolean).length,
    quantifiedAchievements: [...experience, ...projects].filter((line) => QUANTIFIED.test(line)).slice(0, 25),
  };
}

/** Scores structure, depth and evidence quality — not writing style. */
function buildComponents(parsed: ParsedResume): AgentComponent[] {
  const contactPoints = [parsed.email, parsed.phone, parsed.links.length ? 'links' : null].filter(Boolean).length;

  return [
    {
      key: 'completeness',
      label: 'Profile completeness',
      score: Math.min(20, contactPoints * 5 + (parsed.name ? 5 : 0)),
      max: 20,
      evidence: `${contactPoints} contact channel(s)${parsed.name ? ', name detected' : ', no name detected'}`,
    },
    {
      key: 'experience',
      label: 'Experience depth',
      score: Math.min(25, parsed.experience.length * 2.5),
      max: 25,
      evidence: `${parsed.experience.length} experience line(s)`,
    },
    {
      key: 'skills',
      label: 'Recognised skills',
      score: Math.min(20, parsed.skills.length * 2),
      max: 20,
      evidence: `${parsed.skills.length} skill(s) matched to the platform taxonomy`,
    },
    {
      key: 'projects',
      label: 'Project evidence',
      score: Math.min(15, parsed.projects.length * 3),
      max: 15,
      evidence: `${parsed.projects.length} project line(s)`,
    },
    {
      key: 'impact',
      label: 'Quantified impact',
      score: Math.min(15, parsed.quantifiedAchievements.length * 3),
      max: 15,
      evidence: `${parsed.quantifiedAchievements.length} achievement(s) with a measurable outcome`,
    },
    {
      key: 'credentials',
      label: 'Education and credentials',
      score: Math.min(5, (parsed.education.length ? 3 : 0) + (parsed.certifications.length ? 2 : 0)),
      max: 5,
      evidence: `${parsed.education.length} education line(s), ${parsed.certifications.length} credential line(s)`,
    },
  ];
}

export async function runResumeAgent(text: string): Promise<AgentResult> {
  const clean = String(text || '').trim();
  if (clean.length < 40) {
    return {
      agent: 'resume',
      score: 0,
      confidence: 0,
      engine: 'deterministic',
      summary: 'No readable resume text was supplied.',
      components: [],
      skills: [],
      signals: { available: false, reason: 'empty' },
    };
  }

  const parsed = parseResume(clean);
  const components = buildComponents(parsed);
  const score = scoreFromComponents(components);
  const confidence = clampScore(
    Math.min(100, parsed.wordCount / 6 + parsed.skills.length * 3 + parsed.experience.length * 2),
  );

  let summary =
    `Parsed ${parsed.wordCount} words: ${parsed.skills.length} recognised skills, ` +
    `${parsed.experience.length} experience entries, ${parsed.projects.length} projects, ` +
    `${parsed.quantifiedAchievements.length} quantified achievements.`;

  const narrative = await complete({
    system: 'You summarise parsed resume data for a recruiter. Two sentences, factual, no praise, no invented facts.',
    prompt: `Summarise this candidate from the parsed resume data below.\n\n${JSON.stringify(
      {
        skills: parsed.skills,
        experienceLines: parsed.experience.slice(0, 12),
        projects: parsed.projects.slice(0, 8),
        education: parsed.education.slice(0, 4),
        quantifiedAchievements: parsed.quantifiedAchievements.slice(0, 6),
      },
      null,
      2,
    )}`,
    maxTokens: 300,
  });
  if (narrative) summary = narrative;

  return {
    agent: 'resume',
    score,
    confidence,
    engine: narrative ? engineName() : 'deterministic',
    summary,
    components,
    skills: parsed.skills.map((slug) => ({ slug, level: 55, source: 'resume' })),
    signals: { parsed },
  };
}
