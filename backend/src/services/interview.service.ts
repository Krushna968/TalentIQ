import { prisma } from '../lib/prisma.js';
import { listCandidateSkills, getSkill, extractSkills } from './skills.service.js';
import { complete, completeJson, isLlmEnabled, engineName } from './llm.service.js';
import { clamp, round, average, safeJsonParse, unique } from '../utils/helpers.js';
import { notFound, badRequest } from '../utils/http.js';

/**
 * AI Interview Agent.
 *
 * Questions are selected against the candidate's own evidence, so a candidate
 * who claims Kubernetes gets asked about Kubernetes. Answers are scored on
 * technical substance, communication, and problem-solving structure, and the
 * completed interview is written back as evidence so it feeds the talent score.
 */

export type InterviewType = 'TECHNICAL' | 'HR' | 'BEHAVIORAL' | 'MIXED';

interface QuestionTemplate {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  /** Keywords a substantive answer is expected to touch. */
  expectedSignals: string[];
  /** Only offered when the candidate has evidence for this skill. */
  skillSlug?: string;
}

const TECHNICAL_BANK: QuestionTemplate[] = [
  {
    category: 'System Design',
    difficulty: 'hard',
    prompt: 'Design a rate limiter for a public API serving 50,000 requests per second across multiple regions. Walk through your data structures, where state lives, and how you handle a region losing connectivity.',
    expectedSignals: ['token bucket', 'sliding window', 'redis', 'distributed', 'consistency', 'partition', 'latency', 'fallback'],
  },
  {
    category: 'System Design',
    difficulty: 'medium',
    prompt: 'A read-heavy endpoint has become slow as traffic grew. Describe how you would find the cause and the order in which you would try fixes.',
    expectedSignals: ['profil', 'index', 'cache', 'query', 'n+1', 'measure', 'baseline', 'load test'],
  },
  {
    category: 'Debugging',
    difficulty: 'medium',
    prompt: 'A bug appears in production roughly once a day and never reproduces locally. Describe your approach to tracking it down.',
    expectedSignals: ['log', 'trace', 'observability', 'reproduce', 'hypothesis', 'race', 'timezone', 'instrument'],
  },
  {
    category: 'Data',
    difficulty: 'medium',
    prompt: 'You need to add a NOT NULL column to a 200-million-row table with no downtime. What is your plan?',
    expectedSignals: ['backfill', 'batch', 'default', 'lock', 'migration', 'nullable', 'rollout', 'rollback'],
    skillSlug: 'postgresql',
  },
  {
    category: 'Frontend',
    difficulty: 'medium',
    prompt: 'A React page re-renders far more than it should. How do you diagnose it, and what fixes would you consider in order?',
    expectedSignals: ['profiler', 'memo', 'usememo', 'usecallback', 'key', 'state', 'context', 'virtualis'],
    skillSlug: 'react',
  },
  {
    category: 'Infrastructure',
    difficulty: 'hard',
    prompt: 'Explain how you would roll out a breaking change to a service that a dozen other teams depend on.',
    expectedSignals: ['version', 'deprecat', 'backward', 'feature flag', 'canary', 'communicat', 'contract', 'monitor'],
    skillSlug: 'kubernetes',
  },
  {
    category: 'Machine Learning',
    difficulty: 'hard',
    prompt: 'Your model performs well offline but poorly in production. What are the likely causes and how would you confirm each?',
    expectedSignals: ['drift', 'skew', 'leakage', 'training-serving', 'distribution', 'monitor', 'feature', 'baseline'],
    skillSlug: 'machine-learning',
  },
  {
    category: 'Security',
    difficulty: 'medium',
    prompt: 'How would you design authentication for a multi-tenant API, and what would you do if a token signing key leaked?',
    expectedSignals: ['jwt', 'rotat', 'revoke', 'scope', 'tenant', 'expiry', 'refresh', 'audit'],
    skillSlug: 'security',
  },
  {
    category: 'Fundamentals',
    difficulty: 'easy',
    prompt: 'Explain the difference between a process and a thread, and give an example where choosing wrongly caused a real problem.',
    expectedSignals: ['memory', 'isolat', 'context switch', 'shared', 'concurrency', 'gil', 'race'],
  },
  {
    category: 'Code Quality',
    difficulty: 'medium',
    prompt: 'Describe a piece of code you refactored. What made it bad, what did you change, and how did you know you had not broken anything?',
    expectedSignals: ['test', 'coverage', 'incremental', 'readab', 'coupling', 'regression', 'review'],
  },
];

const BEHAVIORAL_BANK: QuestionTemplate[] = [
  {
    category: 'Collaboration',
    difficulty: 'medium',
    prompt: 'Tell me about a technical disagreement with a colleague. What was the disagreement, and how did it end?',
    expectedSignals: ['listen', 'evidence', 'compromise', 'data', 'decision', 'outcome', 'escalat'],
  },
  {
    category: 'Ownership',
    difficulty: 'medium',
    prompt: 'Describe something you shipped that did not work out. What did you do about it?',
    expectedSignals: ['responsib', 'learn', 'fix', 'root cause', 'communicat', 'follow up', 'prevent'],
  },
  {
    category: 'Growth',
    difficulty: 'easy',
    prompt: 'What is the most recent thing you learned because a project forced you to, and how did you learn it?',
    expectedSignals: ['document', 'practice', 'built', 'course', 'mentor', 'applied', 'iterat'],
  },
  {
    category: 'Leadership',
    difficulty: 'medium',
    prompt: 'Describe a time you had to bring other people along on a technical decision.',
    expectedSignals: ['explain', 'trade-off', 'buy-in', 'document', 'demo', 'stakeholder', 'align'],
  },
];

const HR_BANK: QuestionTemplate[] = [
  {
    category: 'Motivation',
    difficulty: 'easy',
    prompt: 'What kind of problems do you want to be working on two years from now, and what are you doing to get there?',
    expectedSignals: ['specific', 'plan', 'skill', 'domain', 'growth', 'because'],
  },
  {
    category: 'Working Style',
    difficulty: 'easy',
    prompt: 'Describe the working environment where you do your best work, and one where you have struggled.',
    expectedSignals: ['autonomy', 'feedback', 'focus', 'collaborat', 'process', 'clarity'],
  },
];

const BANKS: Record<InterviewType, QuestionTemplate[]> = {
  TECHNICAL: TECHNICAL_BANK,
  BEHAVIORAL: BEHAVIORAL_BANK,
  HR: HR_BANK,
  MIXED: [...TECHNICAL_BANK, ...BEHAVIORAL_BANK, ...HR_BANK],
};

/**
 * Picks questions, preferring ones tied to skills the candidate has evidence
 * for so the interview interrogates their actual claims.
 */
async function selectQuestions(candidateId: string, type: InterviewType, count: number): Promise<QuestionTemplate[]> {
  const skills = await listCandidateSkills(candidateId);
  const owned = new Set(skills.map((skill) => skill.slug));
  const bank = BANKS[type];

  const targeted = bank.filter((question) => question.skillSlug && owned.has(question.skillSlug));
  const general = bank.filter((question) => !question.skillSlug);
  const rest = bank.filter((question) => question.skillSlug && !owned.has(question.skillSlug));

  const ordered = [...targeted, ...general, ...rest];
  const chosen: QuestionTemplate[] = [];
  const seenCategories = new Set<string>();

  // One pass preferring category variety, then top up.
  for (const question of ordered) {
    if (chosen.length >= count) break;
    if (seenCategories.has(question.category)) continue;
    seenCategories.add(question.category);
    chosen.push(question);
  }
  for (const question of ordered) {
    if (chosen.length >= count) break;
    if (!chosen.includes(question)) chosen.push(question);
  }
  return chosen.slice(0, count);
}

export async function startSession(input: {
  candidateId: string;
  type?: string;
  jobId?: string;
  questionCount?: number;
}) {
  const type = (input.type?.toUpperCase() as InterviewType) || 'TECHNICAL';
  if (!BANKS[type]) throw badRequest('Unsupported interview type');

  const count = Math.min(Math.max(input.questionCount ?? 5, 1), 15);
  const questions = await selectQuestions(input.candidateId, type, count);
  if (!questions.length) throw badRequest('No interview questions are available for that type');

  const session = await prisma.interviewSession.create({
    data: {
      candidateId: input.candidateId,
      jobId: input.jobId || null,
      type: type as never,
      status: 'IN_PROGRESS',
      engine: isLlmEnabled() ? engineName() : 'deterministic',
      questions: {
        create: questions.map((question, index) => ({
          position: index + 1,
          category: question.category,
          prompt: question.prompt,
          difficulty: question.difficulty,
          expectedSignalsJson: JSON.stringify(question.expectedSignals),
        })),
      },
    },
    include: { questions: { orderBy: { position: 'asc' } } },
  });

  return shapeSession(session);
}

export interface AnswerAnalysis {
  technical: number;
  communication: number;
  confidence: number;
  problemSolving: number;
  signalsHit: string[];
  signalsMissed: string[];
  wordCount: number;
}

const HEDGE_WORDS = /\b(maybe|i guess|not sure|probably|i think|kind of|sort of|might be|possibly)\b/gi;
const STRUCTURE_MARKERS = /\b(first|second|third|then|next|finally|because|therefore|however|trade[- ]?off|the reason|for example|in practice)\b/gi;
const CONCRETE_MARKERS = /\b(\d+|ms\b|seconds?|percent|%|specifically|for instance|in my|we used|i built|i implemented)\b/gi;

/** Scores one answer from its content. Deterministic and explainable. */
export function analyseAnswer(answer: string, expectedSignals: string[]): AnswerAnalysis {
  const text = answer.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const signalsHit = expectedSignals.filter((signal) => lower.includes(signal.toLowerCase()));
  const signalsMissed = expectedSignals.filter((signal) => !lower.includes(signal.toLowerCase()));

  // Technical: how many of the expected concepts the answer actually engages.
  const coverage = expectedSignals.length ? signalsHit.length / expectedSignals.length : 0;
  const technical = clamp(coverage * 85 + Math.min(15, wordCount / 20));

  // Communication: structure and length discipline, not verbosity.
  const structureHits = (text.match(STRUCTURE_MARKERS) || []).length;
  const lengthFit = wordCount < 25 ? wordCount / 25 : wordCount > 450 ? Math.max(0.55, 450 / wordCount) : 1;
  const communication = clamp((Math.min(1, structureHits / 5) * 60 + 40) * lengthFit);

  // Confidence: hedging counts against, concrete detail counts for.
  const hedges = (text.match(HEDGE_WORDS) || []).length;
  const concrete = (text.match(CONCRETE_MARKERS) || []).length;
  const confidence = clamp(70 - hedges * 9 + Math.min(30, concrete * 5));

  // Problem solving: does the answer reason, or just name things?
  const reasoning = (lower.match(/\b(because|so that|which means|the trade[- ]?off|otherwise|this avoids|the risk)\b/g) || []).length;
  const problemSolving = clamp(coverage * 45 + Math.min(40, reasoning * 12) + (wordCount > 60 ? 15 : 0));

  return { technical, communication, confidence, problemSolving, signalsHit, signalsMissed, wordCount };
}

export async function submitAnswer(input: { sessionId: string; questionId: string; answer: string; candidateId: string }) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: input.sessionId },
    include: { questions: { orderBy: { position: 'asc' } } },
  });
  if (!session) throw notFound('Interview session not found');
  if (session.candidateId !== input.candidateId) throw badRequest('This interview belongs to another candidate');
  if (String(session.status) === 'COMPLETED') throw badRequest('This interview has already been completed');

  const question = session.questions.find((entry) => entry.id === input.questionId);
  if (!question) throw notFound('Question not found in this session');

  const expected = safeJsonParse<string[]>(question.expectedSignalsJson, []);
  const analysis = analyseAnswer(input.answer, expected);
  const score = round(average([analysis.technical, analysis.communication, analysis.confidence, analysis.problemSolving]), 1);

  let feedback =
    analysis.signalsHit.length >= Math.ceil(expected.length / 2)
      ? `Covered ${analysis.signalsHit.length} of ${expected.length} expected areas${analysis.signalsMissed.length ? `; did not address ${analysis.signalsMissed.slice(0, 4).join(', ')}` : ''}.`
      : `Covered only ${analysis.signalsHit.length} of ${expected.length} expected areas. Consider addressing ${analysis.signalsMissed.slice(0, 4).join(', ')}.`;

  const generated = await complete({
    system: 'You are an interviewer giving direct, specific feedback on one answer. Two sentences. Say what was strong and what was missing. No praise inflation.',
    prompt: `Question: ${question.prompt}\n\nExpected areas: ${expected.join(', ')}\n\nCandidate answer:\n${input.answer.slice(0, 4000)}`,
    maxTokens: 250,
  });
  if (generated) feedback = generated;

  await prisma.interviewQuestion.update({
    where: { id: question.id },
    data: { answerText: input.answer, answeredAt: new Date(), score, feedback, analysisJson: JSON.stringify(analysis) },
  });

  const remaining = session.questions.filter((entry) => entry.id !== question.id && !entry.answeredAt);
  return {
    score,
    feedback,
    analysis,
    nextQuestion: remaining.length ? { id: remaining[0].id, position: remaining[0].position, prompt: remaining[0].prompt, category: remaining[0].category } : null,
    remaining: remaining.length,
  };
}

const RECOMMENDATIONS: Array<{ min: number; value: string; label: string }> = [
  { min: 85, value: 'strong_hire', label: 'Strong hire' },
  { min: 72, value: 'hire', label: 'Hire' },
  { min: 58, value: 'lean_hire', label: 'Lean hire' },
  { min: 42, value: 'hold', label: 'Hold' },
  { min: 0, value: 'no_hire', label: 'Do not proceed' },
];

export async function completeSession(sessionId: string, candidateId: string) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: { questions: { orderBy: { position: 'asc' } } },
  });
  if (!session) throw notFound('Interview session not found');
  if (session.candidateId !== candidateId) throw badRequest('This interview belongs to another candidate');

  const answered = session.questions.filter((question) => question.answeredAt);
  if (!answered.length) throw badRequest('Answer at least one question before completing the interview');

  const analyses = answered.map((question) => safeJsonParse<AnswerAnalysis>(question.analysisJson, {
    technical: 0, communication: 0, confidence: 0, problemSolving: 0, signalsHit: [], signalsMissed: [], wordCount: 0,
  }));

  const technicalScore = round(average(analyses.map((entry) => entry.technical)), 1);
  const communicationScore = round(average(analyses.map((entry) => entry.communication)), 1);
  const confidenceScore = round(average(analyses.map((entry) => entry.confidence)), 1);
  const problemSolvingScore = round(average(analyses.map((entry) => entry.problemSolving)), 1);

  // Unanswered questions reduce the overall score — an incomplete interview is
  // not the same as a good short one.
  const completionRatio = answered.length / session.questions.length;
  const overallScore = round(
    average([technicalScore, communicationScore, confidenceScore, problemSolvingScore]) * (0.7 + 0.3 * completionRatio),
    1,
  );

  const recommendation = RECOMMENDATIONS.find((entry) => overallScore >= entry.min)!;

  const byCategory = new Map<string, number[]>();
  answered.forEach((question, index) => {
    byCategory.set(question.category, [...(byCategory.get(question.category) || []), analyses[index].technical]);
  });
  const categoryScores = [...byCategory.entries()].map(([category, scores]) => ({ category, score: round(average(scores), 1) }));

  const strengths = categoryScores.filter((entry) => entry.score >= 65).map((entry) => entry.category);
  const improvements = unique([
    ...categoryScores.filter((entry) => entry.score < 55).map((entry) => entry.category),
    ...(communicationScore < 60 ? ['Answer structure and clarity'] : []),
    ...(confidenceScore < 55 ? ['Conviction and concrete detail'] : []),
  ]);

  let summary =
    `Completed ${answered.length} of ${session.questions.length} questions. ` +
    `Technical ${technicalScore}, communication ${communicationScore}, problem solving ${problemSolvingScore}, confidence ${confidenceScore}. ` +
    `Recommendation: ${recommendation.label}.`;

  const generated = await complete({
    system: 'You write a short interview debrief for a hiring panel. Three sentences: overall performance, strongest area, clearest gap. Be direct.',
    prompt: JSON.stringify(
      {
        scores: { technicalScore, communicationScore, confidenceScore, problemSolvingScore, overallScore },
        categoryScores,
        answers: answered.map((question) => ({ category: question.category, question: question.prompt, feedback: question.feedback })),
      },
      null,
      2,
    ),
    maxTokens: 350,
  });
  if (generated) summary = generated;

  const updated = await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      technicalScore,
      communicationScore,
      confidenceScore,
      problemSolvingScore,
      overallScore,
      recommendation: recommendation.value,
      summary,
      strengthsJson: JSON.stringify(strengths),
      improvementsJson: JSON.stringify(improvements),
    },
    include: { questions: { orderBy: { position: 'asc' } } },
  });

  await recordInterviewEvidence(candidateId, sessionId, overallScore, summary, answered.map((q) => q.answerText || '').join(' '));

  return { ...shapeSession(updated), categoryScores };
}

/**
 * Writes the interview back as verified evidence so the talent score reflects
 * it. The interview is self-verifying: the platform ran it, so it is trusted.
 */
async function recordInterviewEvidence(candidateId: string, sessionId: string, score: number, summary: string, answerText: string) {
  const existing = await prisma.evidence.findFirst({ where: { candidateId, source: 'interview', referenceId: sessionId } });
  const data = {
    title: 'AI interview',
    description: summary.slice(0, 2000),
    score,
    status: 'VERIFIED' as never,
    verifiedAt: new Date(),
    metadata: JSON.stringify({ sessionId, skillsMentioned: extractSkills(answerText).slice(0, 20) }),
  };

  if (existing) {
    await prisma.evidence.update({ where: { id: existing.id }, data });
  } else {
    await prisma.evidence.create({
      data: { candidateId, source: 'interview', referenceId: sessionId, submittedBy: 'system', ...data },
    });
  }
}

function shapeSession(session: {
  id: string;
  candidateId: string;
  jobId: string | null;
  type: string;
  status: string;
  engine: string;
  startedAt: Date;
  completedAt: Date | null;
  technicalScore: number | null;
  communicationScore: number | null;
  confidenceScore: number | null;
  problemSolvingScore: number | null;
  overallScore: number | null;
  recommendation: string | null;
  summary: string | null;
  strengthsJson: string;
  improvementsJson: string;
  questions: Array<{
    id: string;
    position: number;
    category: string;
    prompt: string;
    difficulty: string;
    answerText: string | null;
    answeredAt: Date | null;
    score: number | null;
    feedback: string | null;
  }>;
}) {
  return {
    id: session.id,
    candidateId: session.candidateId,
    jobId: session.jobId,
    type: session.type,
    status: session.status,
    engine: session.engine,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    scores: {
      technical: session.technicalScore,
      communication: session.communicationScore,
      confidence: session.confidenceScore,
      problemSolving: session.problemSolvingScore,
      overall: session.overallScore,
    },
    recommendation: session.recommendation,
    summary: session.summary,
    strengths: safeJsonParse<string[]>(session.strengthsJson, []),
    improvements: safeJsonParse<string[]>(session.improvementsJson, []),
    questions: session.questions.map((question) => ({
      id: question.id,
      position: question.position,
      category: question.category,
      prompt: question.prompt,
      difficulty: question.difficulty,
      answered: Boolean(question.answeredAt),
      answer: question.answerText,
      score: question.score,
      feedback: question.feedback,
    })),
  };
}

export async function getSession(sessionId: string, candidateId?: string) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: { questions: { orderBy: { position: 'asc' } } },
  });
  if (!session) throw notFound('Interview session not found');
  if (candidateId && session.candidateId !== candidateId) throw badRequest('This interview belongs to another candidate');
  return shapeSession(session);
}

export async function listSessions(candidateId: string) {
  const sessions = await prisma.interviewSession.findMany({
    where: { candidateId },
    orderBy: { startedAt: 'desc' },
    include: { questions: { select: { id: true, answeredAt: true } } },
  });
  return sessions.map((session) => ({
    id: session.id,
    type: session.type,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    overallScore: session.overallScore,
    recommendation: session.recommendation,
    progress: { answered: session.questions.filter((q) => q.answeredAt).length, total: session.questions.length },
  }));
}

/** Full report for the interview report screen. */
export async function getReport(sessionId: string, candidateId?: string) {
  const session = await getSession(sessionId, candidateId);
  if (session.status !== 'COMPLETED') throw badRequest('This interview has not been completed yet');

  const byCategory = new Map<string, number[]>();
  for (const question of session.questions) {
    if (question.score === null) continue;
    byCategory.set(question.category, [...(byCategory.get(question.category) || []), question.score]);
  }

  return {
    session,
    categoryScores: [...byCategory.entries()].map(([category, scores]) => ({ category, score: round(average(scores), 1) })),
    recommendationLabel: RECOMMENDATIONS.find((entry) => entry.value === session.recommendation)?.label || 'Not assessed',
  };
}

/** Generates a role-specific question set without persisting a session. */
export async function previewQuestions(candidateId: string, type: InterviewType = 'TECHNICAL', count = 5) {
  const questions = await selectQuestions(candidateId, type, count);
  const skills = await listCandidateSkills(candidateId);

  const generated = await completeJson<Array<{ category: string; prompt: string }>>({
    system: 'You write technical interview questions. Return a JSON array of {category, prompt}. Questions must be answerable in prose and target the given skills.',
    prompt: `Candidate skills: ${skills.slice(0, 10).map((skill) => skill.name).join(', ') || 'unknown'}\nGenerate ${count} ${type.toLowerCase()} interview questions.`,
    maxTokens: 700,
  });

  return {
    questions: questions.map((question, index) => ({
      position: index + 1,
      category: question.category,
      prompt: question.prompt,
      difficulty: question.difficulty,
      targetedSkill: question.skillSlug ? getSkill(question.skillSlug)?.name : null,
    })),
    suggested: generated?.slice(0, count) || [],
    engine: generated ? engineName() : 'deterministic',
  };
}
