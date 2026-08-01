import { createHash } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { listCandidateSkills } from './skills.service.js';
import { safeJsonParse, unique } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Talent Knowledge Graph and reusable research layer.
 *
 * Instead of discarding agent output once a score is produced, every run writes
 * nodes and edges into a graph and stores a reusable embedding. That makes the
 * analysis queryable later — for similarity search, skill co-occurrence, and
 * cohort analytics — rather than a one-off computation.
 */

export type NodeType = 'candidate' | 'skill' | 'project' | 'credential' | 'hackathon' | 'presentation' | 'interview' | 'company' | 'job';
export type EdgeType = 'HAS_SKILL' | 'BUILT' | 'EARNED' | 'COMPETED_IN' | 'PRESENTED' | 'INTERVIEWED_FOR' | 'WORKED_AT' | 'REQUIRES_SKILL' | 'SIMILAR_TO';

interface NodeInput {
  type: NodeType;
  key: string;
  label: string;
  candidateId?: string;
  props?: Record<string, unknown>;
}

interface EdgeInput {
  from: NodeInput;
  to: NodeInput;
  type: EdgeType;
  weight?: number;
  props?: Record<string, unknown>;
}

const nodeKey = (type: NodeType, key: string) => `${type}:${key}`.slice(0, 200);

async function upsertNode(input: NodeInput) {
  return prisma.graphNode.upsert({
    where: { type_key: { type: input.type, key: nodeKey(input.type, input.key) } },
    create: {
      type: input.type,
      key: nodeKey(input.type, input.key),
      label: input.label.slice(0, 300),
      candidateId: input.candidateId ?? null,
      propsJson: JSON.stringify(input.props || {}),
    },
    update: { label: input.label.slice(0, 300), propsJson: JSON.stringify(input.props || {}) },
    select: { id: true },
  });
}

async function upsertEdge(edge: EdgeInput) {
  const [from, to] = await Promise.all([upsertNode(edge.from), upsertNode(edge.to)]);
  return prisma.graphEdge.upsert({
    where: { fromId_toId_type: { fromId: from.id, toId: to.id, type: edge.type } },
    create: { fromId: from.id, toId: to.id, type: edge.type, weight: edge.weight ?? 1, propsJson: JSON.stringify(edge.props || {}) },
    update: { weight: edge.weight ?? 1, propsJson: JSON.stringify(edge.props || {}) },
  });
}

/**
 * Rebuilds the graph neighbourhood for one candidate from their current
 * evidence. Skill and company nodes are shared across candidates, which is what
 * turns the graph into a talent network rather than isolated trees.
 */
export async function syncCandidateGraph(candidateId: string) {
  const [candidate, skills, evidence, github, interviews] = await Promise.all([
    prisma.candidate.findUnique({ where: { id: candidateId } }),
    listCandidateSkills(candidateId),
    prisma.evidence.findMany({ where: { candidateId, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'] } } }),
    prisma.githubConnection.findUnique({ where: { candidateId }, include: { repos: true } }),
    prisma.interviewSession.findMany({ where: { candidateId, status: 'COMPLETED' }, include: { job: true } }),
  ]);
  if (!candidate) return { nodes: 0, edges: 0 };

  const self: NodeInput = {
    type: 'candidate',
    key: candidate.id,
    label: candidate.name,
    candidateId: candidate.id,
    props: { title: candidate.title, location: candidate.location, talentScore: candidate.talentScore },
  };

  const edges: EdgeInput[] = [];

  for (const skill of skills) {
    edges.push({
      from: self,
      to: { type: 'skill', key: skill.slug, label: skill.name, props: { category: skill.category } },
      type: 'HAS_SKILL',
      weight: skill.level / 100,
      props: { verified: skill.verified, sources: skill.sources, evidenceCount: skill.evidenceCount },
    });
  }

  for (const repo of github?.repos.filter((entry) => !entry.isFork).slice(0, 50) || []) {
    edges.push({
      from: self,
      to: {
        type: 'project',
        key: `github:${repo.githubId}`,
        label: repo.fullName,
        props: { stars: repo.stars, forks: repo.forks, language: repo.language, url: repo.url },
      },
      type: 'BUILT',
      weight: Math.min(1, 0.3 + repo.stars / 100),
    });
  }

  const EVIDENCE_EDGE: Record<string, { node: NodeType; edge: EdgeType }> = {
    credential: { node: 'credential', edge: 'EARNED' },
    hackathon: { node: 'hackathon', edge: 'COMPETED_IN' },
    presentation: { node: 'presentation', edge: 'PRESENTED' },
    project: { node: 'project', edge: 'BUILT' },
  };

  for (const row of evidence) {
    const mapping = EVIDENCE_EDGE[row.source];
    if (!mapping) continue;
    edges.push({
      from: self,
      to: {
        type: mapping.node,
        key: `${row.source}:${row.id}`,
        label: row.title,
        props: { issuer: row.issuer, issuedAt: row.issuedAt, status: row.status },
      },
      type: mapping.edge,
      weight: String(row.status) === 'VERIFIED' ? 1 : 0.5,
    });

    if (row.issuer) {
      edges.push({
        from: { type: mapping.node, key: `${row.source}:${row.id}`, label: row.title },
        to: { type: 'company', key: row.issuer.toLowerCase(), label: row.issuer },
        type: 'WORKED_AT',
        weight: 0.5,
      });
    }
  }

  for (const session of interviews) {
    edges.push({
      from: self,
      to: {
        type: 'interview',
        key: session.id,
        label: `${session.type} interview`,
        props: { overallScore: session.overallScore, recommendation: session.recommendation },
      },
      type: 'INTERVIEWED_FOR',
      weight: (session.overallScore ?? 0) / 100,
    });
    if (session.job) {
      edges.push({
        from: { type: 'interview', key: session.id, label: `${session.type} interview` },
        to: { type: 'job', key: session.job.id, label: session.job.title },
        type: 'INTERVIEWED_FOR',
        weight: 1,
      });
    }
  }

  let written = 0;
  for (const edge of edges) {
    try {
      await upsertEdge(edge);
      written += 1;
    } catch (error) {
      logger.warn('Graph edge write failed', { candidateId, type: edge.type, error });
    }
  }

  return { nodes: unique(edges.flatMap((edge) => [nodeKey(edge.from.type, edge.from.key), nodeKey(edge.to.type, edge.to.key)])).length, edges: written };
}

/** Returns the candidate's immediate graph neighbourhood for visualisation. */
export async function candidateGraph(candidateId: string) {
  const nodes = await prisma.graphNode.findMany({ where: { candidateId }, take: 300 });
  const rootIds = nodes.map((node) => node.id);
  const edges = await prisma.graphEdge.findMany({
    where: { OR: [{ fromId: { in: rootIds } }, { toId: { in: rootIds } }] },
    include: { from: true, to: true },
    take: 600,
  });

  const involved = new Map<string, (typeof nodes)[number]>();
  for (const node of nodes) involved.set(node.id, node);
  for (const edge of edges) {
    involved.set(edge.from.id, edge.from);
    involved.set(edge.to.id, edge.to);
  }

  return {
    nodes: [...involved.values()].map((node) => ({
      id: node.id,
      type: node.type,
      label: node.label,
      props: safeJsonParse<Record<string, unknown>>(node.propsJson, {}),
    })),
    edges: edges.map((edge) => ({ from: edge.fromId, to: edge.toId, type: edge.type, weight: edge.weight })),
  };
}

// ---------------------------------------------------------------------------
// Reusable research layer: embeddings and stored artifacts
// ---------------------------------------------------------------------------

const EMBEDDING_DIMS = 256;
const EMBEDDING_MODEL = 'talentiq-hashed-bag-v1';

/**
 * Deterministic hashed-bag-of-features embedding.
 *
 * Chosen over a provider embedding API so similarity search works with no API
 * key and stays reproducible. Vectors are comparable only against other vectors
 * from this same model, which is why the model name is stored alongside them.
 */
export function embedFeatures(features: string[]): number[] {
  const vector = new Array<number>(EMBEDDING_DIMS).fill(0);
  for (const feature of features) {
    const token = feature.trim().toLowerCase();
    if (!token) continue;
    const digest = createHash('sha256').update(token).digest();
    // Two hashed positions per feature reduces collision damage.
    for (let pass = 0; pass < 2; pass += 1) {
      const index = digest.readUInt32BE(pass * 4) % EMBEDDING_DIMS;
      const sign = digest[8 + pass] % 2 === 0 ? 1 : -1;
      vector[index] += sign;
    }
  }
  const norm = Math.sqrt(vector.reduce((total, value) => total + value * value, 0));
  return norm ? vector.map((value) => value / norm) : vector;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let index = 0; index < a.length; index += 1) dot += a[index] * b[index];
  return Math.max(-1, Math.min(1, dot));
}

/** Builds the feature bag that represents a candidate for similarity search. */
async function candidateFeatures(candidateId: string): Promise<string[]> {
  const [skills, candidate, evidence] = await Promise.all([
    listCandidateSkills(candidateId),
    prisma.candidate.findUnique({ where: { id: candidateId }, select: { title: true, location: true, bio: true } }),
    prisma.evidence.findMany({ where: { candidateId }, select: { source: true, issuer: true } }),
  ]);

  return [
    // Strong skills are repeated so they dominate the vector.
    ...skills.flatMap((skill) => Array(Math.max(1, Math.round(skill.level / 25))).fill(`skill:${skill.slug}`)),
    ...skills.map((skill) => `category:${skill.category}`),
    ...(candidate?.title ? candidate.title.toLowerCase().split(/\s+/).map((word) => `title:${word}`) : []),
    ...(candidate?.location ? [`location:${candidate.location.toLowerCase()}`] : []),
    ...evidence.map((row) => `evidence:${row.source}`),
    ...evidence.filter((row) => row.issuer).map((row) => `issuer:${row.issuer!.toLowerCase()}`),
  ];
}

export async function refreshCandidateEmbedding(candidateId: string) {
  const features = await candidateFeatures(candidateId);
  const vector = embedFeatures(features);
  const textHash = createHash('sha256').update(features.join('|')).digest('hex');

  await prisma.candidateEmbedding.upsert({
    where: { candidateId },
    create: { candidateId, model: EMBEDDING_MODEL, dims: EMBEDDING_DIMS, vectorJson: JSON.stringify(vector), textHash },
    update: { model: EMBEDDING_MODEL, dims: EMBEDDING_DIMS, vectorJson: JSON.stringify(vector), textHash },
  });
  return vector;
}

/** Finds candidates whose evidence profile most resembles this one. */
export async function similarCandidates(candidateId: string, limit = 5) {
  const source = await prisma.candidateEmbedding.findUnique({ where: { candidateId } });
  if (!source) return [];

  const vector = safeJsonParse<number[]>(source.vectorJson, []);
  const others = await prisma.candidateEmbedding.findMany({
    where: { candidateId: { not: candidateId }, model: source.model },
    include: { candidate: { select: { id: true, name: true, title: true, talentScore: true, avatar: true } } },
    take: 500,
  });

  return others
    .map((row) => ({
      candidate: row.candidate,
      similarity: Math.round(cosineSimilarity(vector, safeJsonParse<number[]>(row.vectorJson, [])) * 1000) / 1000,
    }))
    .filter((row) => row.similarity > 0.15)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Stores an agent's analysis so future runs and future models can reuse it
 * instead of recomputing. Keyed by kind + key so a re-run overwrites in place.
 */
export async function storeResearch(kind: string, key: string, payload: unknown, candidateId?: string) {
  return prisma.researchArtifact.upsert({
    where: { kind_key: { kind, key } },
    create: { kind, key, candidateId: candidateId ?? null, payloadJson: JSON.stringify(payload) },
    update: { payloadJson: JSON.stringify(payload) },
  });
}

export async function readResearch<T>(kind: string, key: string): Promise<T | null> {
  const row = await prisma.researchArtifact.findUnique({ where: { kind_key: { kind, key } } });
  return row ? safeJsonParse<T | null>(row.payloadJson, null) : null;
}

/** Skill pairs that repeatedly appear together across the talent pool. */
export async function skillCooccurrence(limit = 25) {
  const rows = await prisma.candidateSkill.findMany({
    where: { level: { gte: 40 } },
    select: { candidateId: true, skill: { select: { slug: true, name: true } } },
    take: 5000,
  });

  const byCandidate = new Map<string, string[]>();
  const names = new Map<string, string>();
  for (const row of rows) {
    names.set(row.skill.slug, row.skill.name);
    byCandidate.set(row.candidateId, [...(byCandidate.get(row.candidateId) || []), row.skill.slug]);
  }

  const pairs = new Map<string, number>();
  for (const slugs of byCandidate.values()) {
    const sorted = [...new Set(slugs)].sort();
    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const key = `${sorted[i]}|${sorted[j]}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
  }

  return [...pairs.entries()]
    .map(([key, count]) => {
      const [a, b] = key.split('|');
      return { a: names.get(a) || a, b: names.get(b) || b, count };
    })
    .sort((x, y) => y.count - x.count)
    .slice(0, limit);
}
