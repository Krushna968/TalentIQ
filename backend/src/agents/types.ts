import type { SkillSignal } from '../services/skills.service.js';

/** A single scored dimension inside an agent's output, kept for explainability. */
export interface AgentComponent {
  key: string;
  label: string;
  score: number;
  max: number;
  evidence: string;
}

export interface AgentResult {
  /** Stable agent identifier, e.g. "resume", "github". */
  agent: string;
  /** Normalised 0-100 score for this evidence source. */
  score: number;
  /** 0-100 indication of how much evidence backed the score. */
  confidence: number;
  /** Which engine produced it: "deterministic" or "llm:<provider>". */
  engine: string;
  summary: string;
  components: AgentComponent[];
  skills: SkillSignal[];
  /** Agent-specific structured findings, persisted verbatim. */
  signals: Record<string, unknown>;
}

export const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/** Sums components and rescales to 0-100 against the total available points. */
export function scoreFromComponents(components: AgentComponent[]): number {
  const max = components.reduce((total, item) => total + item.max, 0);
  if (!max) return 0;
  const earned = components.reduce((total, item) => total + Math.min(item.score, item.max), 0);
  return clampScore((earned / max) * 100);
}

export const emptyResult = (agent: string, reason: string): AgentResult => ({
  agent,
  score: 0,
  confidence: 0,
  engine: 'deterministic',
  summary: reason,
  components: [],
  skills: [],
  signals: { available: false, reason },
});
