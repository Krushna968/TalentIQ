import { prisma } from '../lib/prisma.js';
import { calculateAndStoreTalentScore } from './talent-score.service.js';

export const EVIDENCE_SOURCES = ['credential', 'hackathon', 'assessment', 'interview', 'presentation'] as const;
export type EvidenceSource = typeof EVIDENCE_SOURCES[number];

type EvidenceInput = {
  source: EvidenceSource;
  title: string;
  provider?: string;
  issuer?: string;
  referenceUrl?: string;
  referenceId?: string;
  issuedAt?: string;
  metadata?: Record<string, unknown>;
};

function validateInput(input: EvidenceInput) {
  if (!EVIDENCE_SOURCES.includes(input.source)) throw new Error('Unsupported evidence source');
  if (!input.title?.trim()) throw new Error('A title is required');
  if (input.referenceUrl) {
    try {
      const url = new URL(input.referenceUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch { throw new Error('referenceUrl must be a valid HTTP(S) URL'); }
  }
}

export async function submitEvidence(candidateId: string, input: EvidenceInput) {
  validateInput(input);
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, select: { id: true } });
  if (!candidate) throw new Error('Candidate not found');
  return prisma.evidence.create({
    data: {
      candidateId,
      source: input.source,
      title: input.title.trim(),
      provider: input.provider?.trim() || null,
      issuer: input.issuer?.trim() || null,
      referenceUrl: input.referenceUrl || null,
      referenceId: input.referenceId?.trim() || null,
      issuedAt: input.issuedAt ? new Date(input.issuedAt) : null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

export async function reviewEvidence(evidenceId: string, decision: 'verified' | 'rejected', score?: number) {
  if (decision === 'verified' && (score === undefined || !Number.isFinite(score) || score < 0 || score > 100)) {
    throw new Error('A verification score from 0 to 100 is required');
  }
  const evidence = await prisma.evidence.update({
    where: { id: evidenceId },
    data: { status: decision, score: decision === 'verified' ? score : null, verifiedAt: new Date() },
  });
  await calculateAndStoreTalentScore(evidence.candidateId);
  return evidence;
}

export async function getCandidateEvidence(candidateId: string) {
  return prisma.evidence.findMany({ where: { candidateId }, orderBy: { submittedAt: 'desc' } });
}
