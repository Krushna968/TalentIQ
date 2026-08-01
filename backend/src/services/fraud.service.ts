import { createHash } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { checkCertificate } from '../agents/certificate.agent.js';
import { parseResume } from '../agents/resume.agent.js';
import { clamp, safeJsonParse, unique } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Verification layer.
 *
 * Six detectors run over a candidate's evidence and produce an authenticity
 * score plus persisted, reviewable flags. Every detector reports the concrete
 * signal that triggered it, so a recruiter can judge the finding rather than
 * trust a number.
 */

export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FraudFinding {
  type: string;
  severity: FraudSeverity;
  detail: string;
  signals: string[];
  evidenceId?: string;
  /** Points deducted from the authenticity score. */
  penalty: number;
}

// ---------------------------------------------------------------------------
// Detector 1 — fake or unverifiable certificates
// ---------------------------------------------------------------------------

async function detectFakeCertificates(candidateId: string): Promise<FraudFinding[]> {
  const rows = await prisma.evidence.findMany({ where: { candidateId, source: 'credential' } });
  const findings: FraudFinding[] = [];

  for (const row of rows) {
    const check = checkCertificate({
      id: row.id,
      title: row.title,
      issuer: row.issuer,
      referenceUrl: row.referenceUrl,
      referenceId: row.referenceId,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      status: String(row.status),
      metadata: safeJsonParse<Record<string, unknown>>(row.metadata, {}),
    });

    // A link that points somewhere the issuer does not control is the single
    // strongest indicator of a fabricated credential.
    if (row.referenceUrl && !check.hostVerified && check.knownIssuer) {
      findings.push({
        type: 'certificate_host_mismatch',
        severity: 'HIGH',
        detail: `"${row.title}" claims ${row.issuer} but its verification link is not on an issuer-controlled domain.`,
        signals: check.concerns,
        evidenceId: row.id,
        penalty: 18,
      });
    } else if (check.authenticity < 35) {
      findings.push({
        type: 'certificate_unverifiable',
        severity: 'MEDIUM',
        detail: `"${row.title}" cannot be independently verified (authenticity ${check.authenticity}/100).`,
        signals: check.concerns,
        evidenceId: row.id,
        penalty: 8,
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Detector 2 — resume claims not backed by evidence
// ---------------------------------------------------------------------------

async function detectResumeInconsistencies(candidateId: string, resumeText: string): Promise<FraudFinding[]> {
  if (!resumeText) return [];
  const findings: FraudFinding[] = [];
  const parsed = parseResume(resumeText);

  // A resume that claims GitHub links while no GitHub account is connected is a
  // claim the platform cannot corroborate.
  const githubLinks = parsed.links.filter((link) => /github\.com/i.test(link));
  const connection = await prisma.githubConnection.findUnique({ where: { candidateId }, select: { githubUsername: true } });

  if (githubLinks.length && !connection) {
    findings.push({
      type: 'resume_unlinked_github',
      severity: 'LOW',
      detail: 'The resume references GitHub profiles or repositories, but no GitHub account is connected for verification.',
      signals: githubLinks.slice(0, 5),
      penalty: 4,
    });
  }

  if (connection) {
    const claimedUsers = unique(
      githubLinks
        .map((link) => link.match(/github\.com\/([A-Za-z0-9-]+)/i)?.[1])
        .filter((user): user is string => Boolean(user)),
    );
    const mismatched = claimedUsers.filter((user) => user.toLowerCase() !== connection.githubUsername.toLowerCase());
    if (claimedUsers.length && mismatched.length === claimedUsers.length) {
      findings.push({
        type: 'resume_github_identity_mismatch',
        severity: 'MEDIUM',
        detail: `The resume links GitHub account(s) ${mismatched.join(', ')}, but the connected account is ${connection.githubUsername}.`,
        signals: mismatched,
        penalty: 10,
      });
    }
  }

  // Certifications listed on the resume but never submitted as evidence.
  const submittedCredentials = await prisma.evidence.count({ where: { candidateId, source: 'credential' } });
  if (parsed.certifications.length >= 3 && submittedCredentials === 0) {
    findings.push({
      type: 'resume_unsubstantiated_credentials',
      severity: 'LOW',
      detail: `The resume lists ${parsed.certifications.length} credentials, none of which have been submitted for verification.`,
      signals: parsed.certifications.slice(0, 5),
      penalty: 5,
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Detector 3 — AI-generated resume text
// ---------------------------------------------------------------------------

/** Phrases that are strongly over-represented in LLM-written resume prose. */
const AI_PHRASES = [
  /\bleverag(?:e|ing|ed)\b/gi,
  /\bspearhead(?:ed|ing)?\b/gi,
  /\bseamless(?:ly)?\b/gi,
  /\bcutting[- ]edge\b/gi,
  /\bstate[- ]of[- ]the[- ]art\b/gi,
  /\brobust and scalable\b/gi,
  /\bin today's [a-z-]+ (?:world|landscape)\b/gi,
  /\bdelve[sd]? into\b/gi,
  /\bplays? a (?:crucial|pivotal|vital) role\b/gi,
  /\bit is worth noting\b/gi,
  /\bcomprehensive (?:suite|understanding|solution)\b/gi,
  /\bdemonstrat(?:e|ed|ing) a strong\b/gi,
];

export interface AiTextAnalysis {
  score: number;
  phraseHits: string[];
  sentenceCount: number;
  averageSentenceLength: number;
  lengthUniformity: number;
  vocabularyRichness: number;
}

/** Heuristic AI-authorship signal. Not proof — it is surfaced for human review. */
export function analyseAiAuthorship(text: string): AiTextAnalysis {
  const sentences = text.split(/[.!?]\s+/).map((line) => line.trim()).filter((line) => line.split(/\s+/).length > 3);
  const lengths = sentences.map((sentence) => sentence.split(/\s+/).length);
  const average = lengths.length ? lengths.reduce((total, value) => total + value, 0) / lengths.length : 0;
  const variance = lengths.length
    ? lengths.reduce((total, value) => total + (value - average) ** 2, 0) / lengths.length
    : 0;
  const deviation = Math.sqrt(variance);

  const words = text.toLowerCase().match(/[a-z']{3,}/g) || [];
  const vocabularyRichness = words.length ? unique(words).length / words.length : 0;

  const phraseHits: string[] = [];
  for (const pattern of AI_PHRASES) {
    const matches = text.match(pattern);
    if (matches) phraseHits.push(...matches.map((match) => match.toLowerCase()));
  }

  // Machine-written prose tends to have unusually even sentence lengths.
  const lengthUniformity = average > 0 ? clamp(100 - (deviation / average) * 100, 0, 100) : 0;

  let score = 0;
  score += Math.min(45, phraseHits.length * 9);
  if (sentences.length >= 6 && lengthUniformity > 70) score += 25;
  if (average > 22) score += 12;
  if (vocabularyRichness < 0.38 && words.length > 150) score += 18;

  return {
    score: clamp(score, 0, 100),
    phraseHits: unique(phraseHits),
    sentenceCount: sentences.length,
    averageSentenceLength: Math.round(average * 10) / 10,
    lengthUniformity: Math.round(lengthUniformity),
    vocabularyRichness: Math.round(vocabularyRichness * 1000) / 1000,
  };
}

function detectAiGeneratedResume(resumeText: string): FraudFinding[] {
  if (resumeText.split(/\s+/).length < 120) return [];
  const analysis = analyseAiAuthorship(resumeText);
  if (analysis.score < 55) return [];

  return [
    {
      type: 'resume_ai_generated',
      severity: analysis.score >= 75 ? 'MEDIUM' : 'LOW',
      detail: `Resume prose shows AI-authorship characteristics (confidence ${analysis.score}/100). This is a prompt for human review, not a determination.`,
      signals: [
        ...analysis.phraseHits.slice(0, 8).map((phrase) => `Phrase: "${phrase}"`),
        `Sentence-length uniformity ${analysis.lengthUniformity}%`,
        `Vocabulary richness ${analysis.vocabularyRichness}`,
      ],
      penalty: analysis.score >= 75 ? 8 : 4,
    },
  ];
}

// ---------------------------------------------------------------------------
// Detector 4 — fake or hollow projects
// ---------------------------------------------------------------------------

async function detectFakeProjects(candidateId: string): Promise<FraudFinding[]> {
  const connection = await prisma.githubConnection.findUnique({
    where: { candidateId },
    include: { repos: { include: { commits: true } } },
  });
  if (!connection) return [];

  const findings: FraudFinding[] = [];
  const substantial = connection.repos.filter((repo) => !repo.isFork && repo.size > 0);

  // A repository with a single commit and no content is a placeholder, not a project.
  const hollow = substantial.filter((repo) => repo.commits.length <= 1 && repo.size < 30);
  if (hollow.length >= 3 && hollow.length / Math.max(substantial.length, 1) > 0.5) {
    findings.push({
      type: 'project_hollow_repositories',
      severity: 'LOW',
      detail: `${hollow.length} of ${substantial.length} original repositories contain almost no code or commit history.`,
      signals: hollow.slice(0, 6).map((repo) => `${repo.fullName} (${repo.commits.length} commit(s), ${repo.size}KB)`),
      penalty: 6,
    });
  }

  // Everything created in one burst suggests backfilled history.
  const creationDays = substantial
    .map((repo) => repo.repoCreatedAt?.toISOString().slice(0, 10))
    .filter((day): day is string => Boolean(day));
  const byDay = new Map<string, number>();
  for (const day of creationDays) byDay.set(day, (byDay.get(day) || 0) + 1);
  const burst = [...byDay.entries()].find(([, count]) => count >= 5 && count / Math.max(creationDays.length, 1) > 0.6);
  if (burst) {
    findings.push({
      type: 'project_bulk_creation',
      severity: 'MEDIUM',
      detail: `${burst[1]} repositories were created on the same day (${burst[0]}), which is unusual for organically built projects.`,
      signals: [`${burst[1]} of ${creationDays.length} repositories share a creation date`],
      penalty: 9,
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Detector 5 — duplicate profiles
// ---------------------------------------------------------------------------

async function detectDuplicateProfile(candidateId: string): Promise<FraudFinding[]> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { githubConnection: { select: { githubId: true, githubUsername: true } }, linkedInConnection: { select: { linkedInId: true } } },
  });
  if (!candidate) return [];

  const findings: FraudFinding[] = [];

  if (candidate.githubConnection?.githubId) {
    const others = await prisma.githubConnection.findMany({
      where: { githubId: candidate.githubConnection.githubId, candidateId: { not: candidateId } },
      select: { candidateId: true },
    });
    if (others.length) {
      findings.push({
        type: 'duplicate_github_identity',
        severity: 'HIGH',
        detail: `The same GitHub account (${candidate.githubConnection.githubUsername}) is connected to ${others.length} other candidate profile(s).`,
        signals: others.map((row) => `Candidate ${row.candidateId}`),
        penalty: 20,
      });
    }
  }

  // Same person, different email: identical name plus identical title.
  if (candidate.name && candidate.title) {
    const namesakes = await prisma.candidate.findMany({
      where: { id: { not: candidateId }, name: candidate.name, title: candidate.title },
      select: { id: true, email: true },
      take: 5,
    });
    if (namesakes.length) {
      findings.push({
        type: 'duplicate_profile_suspected',
        severity: 'LOW',
        detail: `${namesakes.length} other profile(s) share this candidate's exact name and title.`,
        signals: namesakes.map((row) => row.email),
        penalty: 5,
      });
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Detector 6 — plagiarised evidence descriptions
// ---------------------------------------------------------------------------

const shingles = (text: string, size = 5) => {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let index = 0; index + size <= words.length; index += 1) {
    out.add(createHash('sha1').update(words.slice(index, index + size).join(' ')).digest('hex').slice(0, 12));
  }
  return out;
};

/** Jaccard similarity over word shingles — cheap, order-insensitive, and good enough to flag copies. */
export function textSimilarity(a: string, b: string): number {
  const left = shingles(a);
  const right = shingles(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const value of left) if (right.has(value)) shared += 1;
  return shared / (left.size + right.size - shared);
}

async function detectPlagiarism(candidateId: string): Promise<FraudFinding[]> {
  const mine = await prisma.evidence.findMany({
    where: { candidateId, description: { not: null } },
    select: { id: true, title: true, description: true },
  });
  const substantial = mine.filter((row) => (row.description || '').split(/\s+/).length >= 25);
  if (!substantial.length) return [];

  const others = await prisma.evidence.findMany({
    where: { candidateId: { not: candidateId }, description: { not: null } },
    select: { candidateId: true, title: true, description: true },
    take: 500,
  });

  const findings: FraudFinding[] = [];
  for (const row of substantial) {
    for (const other of others) {
      const similarity = textSimilarity(row.description!, other.description!);
      if (similarity >= 0.6) {
        findings.push({
          type: 'evidence_plagiarism',
          severity: similarity >= 0.85 ? 'HIGH' : 'MEDIUM',
          detail: `"${row.title}" is ${Math.round(similarity * 100)}% identical to evidence submitted by another candidate.`,
          signals: [`Matches "${other.title}" from candidate ${other.candidateId}`],
          evidenceId: row.id,
          penalty: similarity >= 0.85 ? 22 : 12,
        });
        break;
      }
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

export interface AuthenticityReport {
  candidateId: string;
  authenticityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  findings: FraudFinding[];
  checksRun: string[];
  evaluatedAt: Date;
}

const CHECKS = [
  'fake_certificate_detection',
  'fake_resume_detection',
  'ai_generated_resume_detection',
  'fake_project_detection',
  'duplicate_profile_detection',
  'plagiarism_detection',
];

/** Runs every detector, persists the flags, and returns the authenticity report. */
export async function evaluateAuthenticity(candidateId: string, resumeText = ''): Promise<AuthenticityReport> {
  const [certificates, resumeIssues, projects, duplicates, plagiarism] = await Promise.all([
    detectFakeCertificates(candidateId),
    detectResumeInconsistencies(candidateId, resumeText),
    detectFakeProjects(candidateId),
    detectDuplicateProfile(candidateId),
    detectPlagiarism(candidateId),
  ]);

  const findings = [...certificates, ...resumeIssues, ...detectAiGeneratedResume(resumeText), ...projects, ...duplicates, ...plagiarism];

  const penalty = findings.reduce((total, finding) => total + finding.penalty, 0);
  const authenticityScore = clamp(100 - penalty, 0, 100);
  const riskLevel =
    findings.some((finding) => finding.severity === 'CRITICAL') || authenticityScore < 40
      ? 'critical'
      : findings.some((finding) => finding.severity === 'HIGH') || authenticityScore < 60
        ? 'high'
        : findings.length
          ? 'medium'
          : 'low';

  await persistFindings(candidateId, findings);

  return { candidateId, authenticityScore, riskLevel, findings, checksRun: CHECKS, evaluatedAt: new Date() };
}

/**
 * Writes findings to the flag table. Flags a detector no longer raises are
 * auto-resolved so the queue reflects the current state rather than history.
 */
async function persistFindings(candidateId: string, findings: FraudFinding[]) {
  try {
    // Every system flag is loaded, not just open ones: a resolved flag whose
    // detector fires again must be reopened rather than duplicated, and the
    // compound unique would reject a duplicate anyway.
    const existingFlags = await prisma.fraudFlag.findMany({ where: { candidateId, detectedBy: 'system' } });

    const key = (type: string, evidenceId?: string | null) => `${type}::${evidenceId || ''}`;
    const current = new Set(findings.map((finding) => key(finding.type, finding.evidenceId)));

    // evidenceId is nullable, so the compound unique cannot be used directly in
    // an upsert; match on the existing open flag instead.
    for (const finding of findings) {
      const existing = existingFlags.find((flag) => key(flag.type, flag.evidenceId) === key(finding.type, finding.evidenceId));
      const data = {
        severity: finding.severity as never,
        detail: finding.detail,
        signalsJson: JSON.stringify(finding.signals),
      };
      if (existing) {
        // Reopen anything a reviewer had closed but the detector still sees.
        const reopen = String(existing.status) === 'RESOLVED' || String(existing.status) === 'DISMISSED';
        await prisma.fraudFlag.update({
          where: { id: existing.id },
          data: reopen ? { ...data, status: 'OPEN', resolvedAt: null, resolvedBy: null } : data,
        });
      } else {
        await prisma.fraudFlag.create({
          data: { candidateId, type: finding.type, evidenceId: finding.evidenceId ?? null, detectedBy: 'system', ...data },
        });
      }
    }

    const stale = existingFlags.filter(
      (flag) => !current.has(key(flag.type, flag.evidenceId)) && ['OPEN', 'INVESTIGATING'].includes(String(flag.status)),
    );
    if (stale.length) {
      await prisma.fraudFlag.updateMany({
        where: { id: { in: stale.map((flag) => flag.id) } },
        data: { status: 'RESOLVED', resolvedBy: 'system', resolvedAt: new Date() },
      });
    }
  } catch (error) {
    // A flag-persistence failure must not break scoring.
    logger.error('Failed to persist fraud flags', { candidateId, error });
  }
}

export async function listFlags(filter: { candidateId?: string; status?: string } = {}) {
  return prisma.fraudFlag.findMany({
    where: {
      ...(filter.candidateId ? { candidateId: filter.candidateId } : {}),
      ...(filter.status ? { status: filter.status as never } : {}),
    },
    include: { candidate: { select: { id: true, name: true, email: true } } },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });
}

export async function reportFlag(input: {
  candidateId: string;
  type: string;
  detail?: string;
  severity?: FraudSeverity;
  reporterId: string;
}) {
  const existing = await prisma.fraudFlag.findFirst({
    where: { candidateId: input.candidateId, type: input.type, evidenceId: null },
  });
  const data = {
    detail: input.detail || null,
    severity: (input.severity || 'MEDIUM') as never,
    signalsJson: JSON.stringify(['Reported manually']),
  };

  if (existing) {
    return prisma.fraudFlag.update({
      where: { id: existing.id },
      data: { ...data, status: 'OPEN', resolvedAt: null, resolvedBy: null },
    });
  }
  return prisma.fraudFlag.create({
    data: { candidateId: input.candidateId, type: input.type, detectedBy: input.reporterId, ...data },
  });
}

export async function resolveFlag(id: string, resolverId: string, status: 'RESOLVED' | 'DISMISSED' = 'RESOLVED') {
  return prisma.fraudFlag.update({
    where: { id },
    data: { status: status as never, resolvedBy: resolverId, resolvedAt: new Date() },
  });
}
