import { prisma } from '../lib/prisma.js';
import { runAgents, latestAgentResults, type AgentName } from '../agents/orchestrator.js';
import { evaluateAuthenticity, type AuthenticityReport } from './fraud.service.js';
import { syncCandidateGraph, refreshCandidateEmbedding, storeResearch } from './knowledge-graph.service.js';
import { listCandidateSkills } from './skills.service.js';
import { clamp, average, round, safeJsonParse } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import type { AgentResult } from '../agents/types.js';

/**
 * Talent Intelligence Engine.
 *
 * Combines every agent's output into the composite scores the product exposes.
 * Two rules keep the numbers honest:
 *
 *  1. Only sources the candidate actually has are weighted. Weights are
 *     renormalised over present sources, so nobody is penalised for a source
 *     they never connected.
 *  2. Authenticity gates the headline score. Unverifiable evidence reduces the
 *     talent score rather than quietly inflating it.
 */

interface SourceWeight {
  label: string;
  weight: number;
}

const SOURCE_WEIGHTS: Record<string, SourceWeight> = {
  github: { label: 'GitHub proof of work', weight: 26 },
  resume: { label: 'Resume', weight: 10 },
  certificate: { label: 'Verified credentials', weight: 15 },
  hackathon: { label: 'Hackathon achievements', weight: 12 },
  opensource: { label: 'Open-source contribution', weight: 14 },
  presentation: { label: 'Presentation evidence', weight: 8 },
  social: { label: 'Technical influence', weight: 5 },
  interview: { label: 'Interview performance', weight: 10 },
};

export interface TalentIntelligence {
  candidateId: string;
  talentScore: number;
  confidence: number;
  authenticityScore: number;
  riskScore: number;
  technicalScore: number;
  innovationScore: number;
  leadershipScore: number;
  growthScore: number;
  learningScore: number;
  components: Array<{ key: string; label: string; score: number; weight: number; contribution: number; evidence: string }>;
  radar: Array<{ axis: string; value: number }>;
  skills: Awaited<ReturnType<typeof listCandidateSkills>>;
  agents: Record<string, { score: number; confidence: number; summary: string; engine: string }>;
  authenticity: AuthenticityReport;
  explanation: string[];
  scoredAt: Date;
}

const scoreOf = (results: Record<string, AgentResult>, agent: string) =>
  results[agent] && (results[agent].signals as { available?: boolean }).available !== false ? results[agent].score : null;

/** Pulls a named component out of an agent result, normalised to 0-100. */
function componentRatio(result: AgentResult | undefined, key: string): number | null {
  const component = result?.components.find((item) => item.key === key);
  if (!component || !component.max) return null;
  return clamp((component.score / component.max) * 100);
}

async function interviewScore(candidateId: string): Promise<number | null> {
  const sessions = await prisma.interviewSession.findMany({
    where: { candidateId, status: 'COMPLETED', overallScore: { not: null } },
    orderBy: { completedAt: 'desc' },
    take: 3,
    select: { overallScore: true, communicationScore: true, confidenceScore: true, problemSolvingScore: true },
  });
  if (!sessions.length) return null;
  return round(average(sessions.map((session) => session.overallScore ?? 0)), 1);
}

/**
 * Runs the full pipeline for one candidate: agents, fraud checks, composite
 * scoring, knowledge graph, embedding, and a stored research snapshot.
 */
export async function computeTalentIntelligence(
  candidateId: string,
  options: { rerunAgents?: boolean; only?: AgentName[]; resumeText?: string } = {},
): Promise<TalentIntelligence> {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw new Error('Candidate not found');

  if (options.rerunAgents !== false) {
    await runAgents(candidateId, { only: options.only, resumeText: options.resumeText });
  }

  const results = await latestAgentResults(candidateId);
  const resumeSignals = results.resume?.signals as { parsed?: { wordCount?: number } } | undefined;
  const resumeText =
    options.resumeText ||
    (resumeSignals?.parsed ? JSON.stringify(results.resume.signals) : '');

  const authenticity = await evaluateAuthenticity(candidateId, resumeText);
  const interview = await interviewScore(candidateId);

  // --- Composite talent score over present sources only ---------------------
  const present: Array<{ key: string; score: number; evidence: string }> = [];
  for (const key of Object.keys(SOURCE_WEIGHTS)) {
    if (key === 'interview') {
      if (interview !== null) present.push({ key, score: interview, evidence: 'Completed AI interview sessions' });
      continue;
    }
    const score = scoreOf(results, key);
    if (score !== null) present.push({ key, score, evidence: results[key].summary });
  }

  const activeWeight = present.reduce((total, item) => total + SOURCE_WEIGHTS[item.key].weight, 0);
  const rawTalent = activeWeight
    ? present.reduce((total, item) => total + item.score * SOURCE_WEIGHTS[item.key].weight, 0) / activeWeight
    : 0;

  // Authenticity acts as a multiplier floor at 0.6 so a single low-severity
  // flag cannot erase an otherwise well-evidenced profile.
  const authenticityFactor = 0.6 + (authenticity.authenticityScore / 100) * 0.4;
  const talentScore = clamp(Math.round(rawTalent * authenticityFactor));

  const components = present.map((item) => ({
    key: item.key,
    label: SOURCE_WEIGHTS[item.key].label,
    score: round(item.score, 1),
    weight: SOURCE_WEIGHTS[item.key].weight,
    contribution: round((item.score * SOURCE_WEIGHTS[item.key].weight) / Math.max(activeWeight, 1), 1),
    evidence: item.evidence,
  }));

  // --- Dimension scores -----------------------------------------------------
  const skills = await listCandidateSkills(candidateId);
  const verifiedSkills = skills.filter((skill) => skill.verified);
  const corroborated = skills.filter((skill) => skill.sources.length > 1);

  const technicalScore = clamp(
    average(
      [
        componentRatio(results.github, 'projects'),
        componentRatio(results.github, 'breadth'),
        componentRatio(results.opensource, 'upstream'),
        scoreOf(results, 'certificate'),
        skills.length ? average(skills.slice(0, 10).map((skill) => skill.level)) : null,
      ].filter((value): value is number => value !== null),
    ),
  );

  const innovationScore = clamp(
    average(
      [
        componentRatio(results.presentation, 'innovation'),
        componentRatio(results.hackathon, 'placement'),
        componentRatio(results.github, 'impact'),
        componentRatio(results.opensource, 'adoption'),
      ].filter((value): value is number => value !== null),
    ),
  );

  const leadershipScore = clamp(
    average(
      [
        componentRatio(results.opensource, 'collaboration'),
        componentRatio(results.opensource, 'stewardship'),
        componentRatio(results.hackathon, 'contribution'),
        componentRatio(results.social, 'speaking'),
        componentRatio(results.social, 'thought_leadership'),
      ].filter((value): value is number => value !== null),
    ),
  );

  const learningScore = clamp(
    average(
      [
        componentRatio(results.certificate, 'currency'),
        componentRatio(results.github, 'activity'),
        componentRatio(results.social, 'knowledge_sharing'),
        // Breadth of corroborated skills is itself evidence of learning.
        corroborated.length ? Math.min(100, corroborated.length * 12) : null,
      ].filter((value): value is number => value !== null),
    ),
  );

  const growthScore = await computeGrowth(candidateId, talentScore, learningScore);

  const riskScore = clamp(
    100 -
      authenticity.authenticityScore * 0.7 -
      (verifiedSkills.length ? Math.min(20, verifiedSkills.length * 3) : 0) -
      (present.length >= 4 ? 10 : 0),
  );

  const radar = [
    { axis: 'Tech Depth', value: technicalScore },
    { axis: 'Innovation', value: innovationScore },
    { axis: 'Leadership', value: leadershipScore },
    { axis: 'Velocity', value: clamp(componentRatio(results.github, 'activity') ?? talentScore) },
    { axis: 'Collab', value: clamp(componentRatio(results.opensource, 'collaboration') ?? leadershipScore) },
    { axis: 'Comms', value: clamp(average([scoreOf(results, 'presentation'), scoreOf(results, 'social')].filter((v): v is number => v !== null)) || 0) },
  ];

  const confidence = clamp(
    Math.round(
      average(present.map((item) => results[item.key]?.confidence ?? 60)) * 0.7 +
        Math.min(30, present.length * 5),
    ),
  );

  const explanation = buildExplanation(present, authenticity, present.length, activeWeight);

  const intelligence: TalentIntelligence = {
    candidateId,
    talentScore,
    confidence,
    authenticityScore: authenticity.authenticityScore,
    riskScore,
    technicalScore,
    innovationScore,
    leadershipScore,
    growthScore,
    learningScore,
    components,
    radar,
    skills,
    agents: Object.fromEntries(
      Object.entries(results).map(([key, value]) => [
        key,
        { score: value.score, confidence: value.confidence, summary: value.summary, engine: value.engine },
      ]),
    ),
    authenticity,
    explanation,
    scoredAt: new Date(),
  };

  await persist(candidate.id, intelligence, results);
  return intelligence;
}

/** Growth is measured against the candidate's own history, not the cohort. */
async function computeGrowth(candidateId: string, talentScore: number, learningScore: number): Promise<number> {
  const history = await prisma.careerSnapshot.findMany({
    where: { candidateId },
    orderBy: { capturedAt: 'desc' },
    take: 6,
    select: { talentScore: true, capturedAt: true },
  });

  if (history.length < 2) {
    // With no history, growth potential is inferred from learning behaviour.
    return clamp(Math.round(learningScore * 0.6 + talentScore * 0.2 + 20));
  }

  const oldest = history[history.length - 1].talentScore ?? talentScore;
  const delta = talentScore - oldest;
  const months = Math.max(
    1,
    (Date.now() - history[history.length - 1].capturedAt.getTime()) / (30 * 86_400_000),
  );
  const trend = delta / months;

  return clamp(Math.round(50 + trend * 8 + learningScore * 0.3));
}

function buildExplanation(
  present: Array<{ key: string; score: number }>,
  authenticity: AuthenticityReport,
  sourceCount: number,
  activeWeight: number,
): string[] {
  const lines: string[] = [];
  if (!sourceCount) {
    lines.push('No evidence sources are connected yet, so no talent score can be produced.');
    return lines;
  }

  const sorted = [...present].sort((a, b) => b.score - a.score);
  lines.push(
    `Scored across ${sourceCount} connected evidence source(s) carrying ${activeWeight} of 100 available weight. Weights are renormalised so unconnected sources do not reduce the score.`,
  );
  lines.push(`Strongest source: ${SOURCE_WEIGHTS[sorted[0].key].label} at ${Math.round(sorted[0].score)}/100.`);
  if (sorted.length > 1) {
    const weakest = sorted[sorted.length - 1];
    lines.push(`Weakest source: ${SOURCE_WEIGHTS[weakest.key].label} at ${Math.round(weakest.score)}/100.`);
  }

  if (authenticity.findings.length) {
    lines.push(
      `${authenticity.findings.length} authenticity concern(s) reduced the headline score; authenticity stands at ${authenticity.authenticityScore}/100 (${authenticity.riskLevel} risk).`,
    );
  } else {
    lines.push('No authenticity concerns were detected across the six verification checks.');
  }

  const missing = Object.keys(SOURCE_WEIGHTS).filter((key) => !present.some((item) => item.key === key));
  if (missing.length) {
    lines.push(`Connect ${missing.map((key) => SOURCE_WEIGHTS[key].label).join(', ')} to raise confidence.`);
  }
  return lines;
}

/** Writes the scores back to the candidate row and appends a career snapshot. */
async function persist(candidateId: string, intelligence: TalentIntelligence, results: Record<string, AgentResult>) {
  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      talentScore: intelligence.talentScore,
      githubScore: results.github?.score ?? null,
      resumeScore: results.resume?.score ?? null,
      hackathonScore: results.hackathon?.score ?? null,
      certScore: results.certificate?.score ?? null,
      presentationScore: results.presentation?.score ?? null,
      openSourceScore: results.opensource?.score ?? null,
      socialScore: results.social?.score ?? null,
      technicalScore: intelligence.technicalScore,
      innovationScore: intelligence.innovationScore,
      leadershipScore: intelligence.leadershipScore,
      growthScore: intelligence.growthScore,
      learningScore: intelligence.learningScore,
      riskScore: intelligence.riskScore,
      authenticityScore: intelligence.authenticityScore,
      radarData: JSON.stringify(intelligence.radar),
      signals: JSON.stringify({
        components: intelligence.components,
        explanation: intelligence.explanation,
        agents: intelligence.agents,
        confidence: intelligence.confidence,
      }),
      scoredAt: intelligence.scoredAt,
    },
  });

  // A snapshot per scoring run is what makes growth measurable over time.
  await prisma.careerSnapshot.create({
    data: {
      candidateId,
      talentScore: intelligence.talentScore,
      technicalScore: intelligence.technicalScore,
      innovationScore: intelligence.innovationScore,
      leadershipScore: intelligence.leadershipScore,
      growthScore: intelligence.growthScore,
      learningScore: intelligence.learningScore,
      riskScore: intelligence.riskScore,
      authenticityScore: intelligence.authenticityScore,
      signalsJson: JSON.stringify({ components: intelligence.components }),
    },
  });

  // The graph, embedding and research artifact are what make this run reusable
  // rather than disposable. None of them are allowed to fail the scoring call.
  await Promise.all([
    syncCandidateGraph(candidateId).catch((error) => logger.warn('Graph sync failed', { candidateId, error })),
    refreshCandidateEmbedding(candidateId).catch((error) => logger.warn('Embedding refresh failed', { candidateId, error })),
    storeResearch('talent-intelligence', candidateId, intelligence, candidateId).catch((error) =>
      logger.warn('Research artifact write failed', { candidateId, error }),
    ),
  ]);
}

/** Reads the stored intelligence without recomputing. */
export async function getStoredIntelligence(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw new Error('Candidate not found');
  if (!candidate.scoredAt) return null;

  return {
    candidateId,
    talentScore: candidate.talentScore ?? 0,
    technicalScore: candidate.technicalScore ?? 0,
    innovationScore: candidate.innovationScore ?? 0,
    leadershipScore: candidate.leadershipScore ?? 0,
    growthScore: candidate.growthScore ?? 0,
    learningScore: candidate.learningScore ?? 0,
    riskScore: candidate.riskScore ?? 0,
    authenticityScore: candidate.authenticityScore ?? 0,
    radar: safeJsonParse<Array<{ axis: string; value: number }>>(candidate.radarData, []),
    signals: safeJsonParse<Record<string, unknown>>(candidate.signals, {}),
    scoredAt: candidate.scoredAt,
  };
}

/** Growth history for the candidate's continuous career intelligence view. */
export async function careerTimeline(candidateId: string) {
  const snapshots = await prisma.careerSnapshot.findMany({
    where: { candidateId },
    orderBy: { capturedAt: 'asc' },
    take: 60,
  });
  return snapshots.map((snapshot) => ({
    capturedAt: snapshot.capturedAt,
    talentScore: snapshot.talentScore,
    technicalScore: snapshot.technicalScore,
    innovationScore: snapshot.innovationScore,
    leadershipScore: snapshot.leadershipScore,
    growthScore: snapshot.growthScore,
    authenticityScore: snapshot.authenticityScore,
  }));
}
