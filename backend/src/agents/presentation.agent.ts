import { extractSkills } from '../services/skills.service.js';
import { complete, engineName } from '../services/llm.service.js';
import { clampScore, scoreFromComponents, type AgentComponent, type AgentResult } from './types.js';

/**
 * PPT Intelligence Agent — evaluates a pitch deck or talk from its text.
 *
 * Scores the things a deck can be judged on from content alone: whether it
 * frames a problem, proposes a solution, shows technical depth, argues business
 * value, and is structured for an audience.
 */

interface Dimension {
  key: string;
  label: string;
  max: number;
  patterns: RegExp[];
  /** Minimum distinct pattern hits required to earn full marks. */
  target: number;
}

const DIMENSIONS: Dimension[] = [
  {
    key: 'problem',
    label: 'Problem framing',
    max: 15,
    target: 3,
    patterns: [/\bproblem\b/i, /\bpain\s?point/i, /\bchallenge/i, /\bgap\b/i, /\bwhy\b.{0,20}\bmatters?\b/i, /\bcurrently\b/i],
  },
  {
    key: 'solution',
    label: 'Solution clarity',
    max: 15,
    target: 3,
    patterns: [/\bsolution\b/i, /\bapproach\b/i, /\bhow it works\b/i, /\bwe built\b/i, /\bplatform\b/i, /\bworkflow\b/i],
  },
  {
    key: 'technical',
    label: 'Technical depth',
    max: 20,
    target: 4,
    patterns: [
      /\barchitecture\b/i, /\bapi\b/i, /\bdatabase\b/i, /\bpipeline\b/i, /\bmodel\b/i, /\balgorithm/i,
      /\bscalab/i, /\blatency\b/i, /\bthroughput\b/i, /\bdeploy/i, /\bstack\b/i, /\binfrastructure\b/i,
    ],
  },
  {
    key: 'innovation',
    label: 'Innovation',
    max: 15,
    target: 2,
    patterns: [/\bnovel\b/i, /\bfirst\b/i, /\bunique\b/i, /\bunlike\b/i, /\bdifferentiat/i, /\bpatent/i, /\bbreakthrough/i, /\bwe are the only\b/i],
  },
  {
    key: 'business',
    label: 'Business value',
    max: 15,
    target: 3,
    patterns: [/\bmarket\b/i, /\brevenue\b/i, /\bcustomers?\b/i, /\bpricing\b/i, /\bbusiness model\b/i, /\bgo[- ]to[- ]market\b/i, /\broi\b/i, /\bcost saving/i],
  },
  {
    key: 'evidence',
    label: 'Evidence and results',
    max: 20,
    target: 4,
    patterns: [
      /\b\d+(?:\.\d+)?\s*%/, /\b\d+(?:\.\d+)?\s*(?:x|times)\b/i, /\bbenchmark/i, /\baccuracy\b/i,
      /\busers?\b.{0,15}\b\d/i, /\bresults?\b/i, /\bdemo\b/i, /\bpilot\b/i, /\bcase stud/i,
    ],
  },
];

export interface PresentationAnalysis {
  slides: number;
  wordCount: number;
  wordsPerSlide: number;
  dimensionHits: Record<string, string[]>;
  recommendations: string[];
}

function analyse(text: string, slides: number): { components: AgentComponent[]; analysis: PresentationAnalysis } {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const effectiveSlides = slides || Math.max(1, Math.round(wordCount / 60));
  const wordsPerSlide = Math.round(wordCount / effectiveSlides);

  const dimensionHits: Record<string, string[]> = {};
  const components: AgentComponent[] = DIMENSIONS.map((dimension) => {
    const hits = dimension.patterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
    dimensionHits[dimension.key] = hits;
    const ratio = Math.min(1, hits.length / dimension.target);
    return {
      key: dimension.key,
      label: dimension.label,
      score: Math.round(dimension.max * ratio * 10) / 10,
      max: dimension.max,
      evidence: `${hits.length} of ${dimension.target} expected signal(s) present`,
    };
  });

  // Decks that are wall-to-wall text or nearly empty both present badly.
  const densityPenalty = wordsPerSlide > 140 ? 0.6 : wordsPerSlide < 12 ? 0.5 : 1;
  const structure: AgentComponent = {
    key: 'structure',
    label: 'Presentation structure',
    score: Math.round(10 * densityPenalty * 10) / 10,
    max: 10,
    evidence: `${effectiveSlides} slide(s), about ${wordsPerSlide} words per slide`,
  };

  const recommendations = DIMENSIONS.filter((dimension) => dimensionHits[dimension.key].length < dimension.target).map(
    (dimension) => `Strengthen ${dimension.label.toLowerCase()} — the deck shows ${dimensionHits[dimension.key].length} of ${dimension.target} expected signals.`,
  );
  if (wordsPerSlide > 140) recommendations.push('Reduce text density; slides average more than 140 words.');
  if (wordsPerSlide < 12 && wordCount > 0) recommendations.push('Slides carry very little text — add enough context for an offline reader.');

  return { components: [...components, structure], analysis: { slides: effectiveSlides, wordCount, wordsPerSlide, dimensionHits, recommendations } };
}

export async function runPresentationAgent(input: { text: string; slides?: number; title?: string }): Promise<AgentResult> {
  const text = String(input.text || '').trim();
  if (text.length < 40) {
    return {
      agent: 'presentation',
      score: 0,
      confidence: 0,
      engine: 'deterministic',
      summary: 'No readable presentation content was supplied.',
      components: [],
      skills: [],
      signals: { available: false, reason: 'empty' },
    };
  }

  const { components, analysis } = analyse(text, input.slides || 0);
  const score = scoreFromComponents(components);

  let summary =
    `${analysis.slides} slide(s), ${analysis.wordCount} words. ` +
    `Strongest on ${[...components].sort((a, b) => b.score / b.max - a.score / a.max)[0].label.toLowerCase()}.`;

  const narrative = await complete({
    system: 'You review a technical pitch deck for a hiring panel. Three sentences: what it argues, its strongest aspect, its weakest. No praise inflation.',
    prompt: `Deck title: ${input.title || 'Untitled'}\n\nContent:\n${text.slice(0, 6000)}`,
    maxTokens: 350,
  });
  if (narrative) summary = narrative;

  return {
    agent: 'presentation',
    score,
    confidence: clampScore(Math.min(100, analysis.wordCount / 5 + analysis.slides * 4)),
    engine: narrative ? engineName() : 'deterministic',
    summary,
    components,
    skills: extractSkills(text).map((slug) => ({ slug, level: 45, source: 'presentation' })),
    signals: { available: true, ...analysis },
  };
}
