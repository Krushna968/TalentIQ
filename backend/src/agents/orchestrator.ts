import { prisma } from '../lib/prisma.js';
import { upsertCandidateSkills } from '../services/skills.service.js';
import { logger } from '../utils/logger.js';
import { safeJsonParse } from '../utils/helpers.js';
import type { AgentResult } from './types.js';
import { runResumeAgent } from './resume.agent.js';
import { runGithubAgent } from './github.agent.js';
import { runHackathonAgent } from './hackathon.agent.js';
import { runCertificateAgent } from './certificate.agent.js';
import { runPresentationAgent } from './presentation.agent.js';
import { runOpenSourceAgent } from './opensource.agent.js';
import { runSocialAgent } from './social.agent.js';

/**
 * Multi-agent orchestrator.
 *
 * Runs the specialist agents over a candidate's evidence, records each run for
 * auditability, and merges every agent's skill signals into the candidate's
 * skill graph. One agent failing never stops the others — a failed agent is
 * recorded and simply contributes nothing to the score.
 */

export const AGENT_NAMES = ['resume', 'github', 'hackathon', 'certificate', 'presentation', 'opensource', 'social'] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

/** Agents that read stored evidence and need no extra input. */
const STORED_EVIDENCE_AGENTS: Record<string, (candidateId: string) => Promise<AgentResult>> = {
  github: runGithubAgent,
  hackathon: runHackathonAgent,
  certificate: runCertificateAgent,
  opensource: runOpenSourceAgent,
  social: runSocialAgent,
};

async function recordRun(candidateId: string, result: AgentResult, durationMs: number) {
  await prisma.agentRun.create({
    data: {
      candidateId,
      agent: result.agent,
      status: 'completed',
      engine: result.engine,
      score: result.score,
      confidence: result.confidence,
      outputJson: JSON.stringify(result),
      durationMs,
      completedAt: new Date(),
    },
  });
}

async function recordFailure(candidateId: string, agent: string, error: unknown, durationMs: number) {
  await prisma.agentRun.create({
    data: {
      candidateId,
      agent,
      status: 'failed',
      engine: 'deterministic',
      error: error instanceof Error ? error.message : 'Agent failed',
      durationMs,
      completedAt: new Date(),
    },
  });
}

/** Runs one agent, recording success or failure, and never throwing. */
async function runSafely(candidateId: string, agent: string, fn: () => Promise<AgentResult>): Promise<AgentResult | null> {
  const started = Date.now();
  try {
    const result = await fn();
    await recordRun(candidateId, result, Date.now() - started);
    return result;
  } catch (error) {
    logger.error('Agent run failed', { candidateId, agent, error });
    await recordFailure(candidateId, agent, error, Date.now() - started);
    return null;
  }
}

/** Resume text lives on the candidate's most recent resume version. */
async function latestResumeText(candidateId: string): Promise<string> {
  const resume = await prisma.resume.findFirst({
    where: { candidateId },
    orderBy: { updatedAt: 'desc' },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });
  const version = resume?.versions[0];
  if (!version) return '';

  const content = safeJsonParse<Record<string, unknown>>(version.contentJson, {});
  if (typeof content.rawText === 'string') return content.rawText;
  // Fall back to flattening whatever structured content the builder stored.
  return JSON.stringify(content)
    .replace(/[{}[\]"]/g, ' ')
    .replace(/([a-z]):/gi, '$1: ')
    .replace(/,/g, '\n');
}

export interface OrchestrationOptions {
  /** Restricts the run to a subset of agents. */
  only?: AgentName[];
  /** Resume text supplied inline, bypassing the stored resume. */
  resumeText?: string;
  /** Presentation supplied inline for an ad-hoc analysis. */
  presentation?: { text: string; slides?: number; title?: string };
}

export interface OrchestrationOutcome {
  candidateId: string;
  results: AgentResult[];
  failed: string[];
  skillsUpdated: number;
  ranAt: Date;
}

/** Runs the agent fleet for one candidate and merges the results into their skill graph. */
export async function runAgents(candidateId: string, options: OrchestrationOptions = {}): Promise<OrchestrationOutcome> {
  const selected = new Set<AgentName>(options.only?.length ? options.only : [...AGENT_NAMES]);
  const tasks: Array<{ agent: AgentName; run: () => Promise<AgentResult> }> = [];

  for (const [agent, fn] of Object.entries(STORED_EVIDENCE_AGENTS)) {
    if (selected.has(agent as AgentName)) tasks.push({ agent: agent as AgentName, run: () => fn(candidateId) });
  }

  if (selected.has('resume')) {
    tasks.push({
      agent: 'resume',
      run: async () => runResumeAgent(options.resumeText ?? (await latestResumeText(candidateId))),
    });
  }

  if (selected.has('presentation')) {
    tasks.push({
      agent: 'presentation',
      run: async () => {
        if (options.presentation) return runPresentationAgent(options.presentation);
        // Otherwise score the best presentation evidence already on file.
        const stored = await prisma.evidence.findFirst({
          where: { candidateId, source: 'presentation', status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'] } },
          orderBy: { updatedAt: 'desc' },
        });
        if (!stored) return runPresentationAgent({ text: '' });
        const metadata = safeJsonParse<{ extractedText?: string; slides?: number }>(stored.metadata, {});
        return runPresentationAgent({
          text: metadata.extractedText || stored.description || '',
          slides: metadata.slides,
          title: stored.title,
        });
      },
    });
  }

  const settled = await Promise.all(tasks.map((task) => runSafely(candidateId, task.agent, task.run)));

  const results = settled.filter((result): result is AgentResult => result !== null);
  const failed = tasks.filter((_, index) => settled[index] === null).map((task) => task.agent);

  const skillsUpdated = await upsertCandidateSkills(
    candidateId,
    results.flatMap((result) => result.skills),
  );

  return { candidateId, results, failed, skillsUpdated, ranAt: new Date() };
}

/** Returns the newest successful run for each agent, for dashboards and reports. */
export async function latestAgentResults(candidateId: string): Promise<Record<string, AgentResult>> {
  const runs = await prisma.agentRun.findMany({
    where: { candidateId, status: 'completed' },
    orderBy: { startedAt: 'desc' },
  });

  const latest: Record<string, AgentResult> = {};
  for (const run of runs) {
    if (latest[run.agent] || !run.outputJson) continue;
    const parsed = safeJsonParse<AgentResult | null>(run.outputJson, null);
    if (parsed) latest[run.agent] = parsed;
  }
  return latest;
}
