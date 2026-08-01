import { prisma } from '../lib/prisma.js';
import { extractSkills } from '../services/skills.service.js';
import { safeJsonParse, unique } from '../utils/helpers.js';
import { clampScore, scoreFromComponents, type AgentComponent, type AgentResult } from './types.js';

/**
 * Certificate Verification Agent — scores credential authenticity.
 *
 * Verification is evidence-based rather than cosmetic: a credential scores well
 * when it names a known issuer, carries a verifiable reference URL on that
 * issuer's own domain, is unexpired, and has a credential ID in the issuer's
 * documented format.
 */

interface IssuerProfile {
  name: string;
  /** Hosts that legitimately host this issuer's verification pages. */
  hosts: string[];
  /** Expected shape of the credential identifier, when the issuer publishes one. */
  idPattern?: RegExp;
  weight: number;
}

const ISSUERS: IssuerProfile[] = [
  { name: 'Amazon Web Services', hosts: ['aws.amazon.com', 'credly.com', 'aws.training'], weight: 10 },
  { name: 'Google Cloud', hosts: ['google.accredible.com', 'credential.net', 'cloud.google.com'], weight: 10 },
  { name: 'Microsoft', hosts: ['learn.microsoft.com', 'credly.com'], weight: 10 },
  { name: 'Cloud Native Computing Foundation', hosts: ['training.linuxfoundation.org', 'credly.com'], weight: 10 },
  { name: 'HashiCorp', hosts: ['credly.com', 'hashicorp.com'], weight: 9 },
  { name: 'Oracle', hosts: ['catalog-education.oracle.com', 'credly.com'], weight: 8 },
  { name: 'Coursera', hosts: ['coursera.org'], idPattern: /^[A-Z0-9]{10,14}$/, weight: 6 },
  { name: 'DeepLearning.AI', hosts: ['coursera.org', 'learn.deeplearning.ai'], weight: 7 },
  { name: 'edX', hosts: ['courses.edx.org', 'credentials.edx.org'], weight: 6 },
  { name: 'Udemy', hosts: ['udemy.com', 'ude.my'], weight: 3 },
  { name: 'NPTEL', hosts: ['nptel.ac.in'], weight: 6 },
  { name: 'MongoDB', hosts: ['learn.mongodb.com', 'credly.com'], weight: 7 },
  { name: 'Meta', hosts: ['coursera.org', 'credly.com'], weight: 7 },
  { name: 'IBM', hosts: ['credly.com', 'ibm.com'], weight: 7 },
];

const hostOf = (url: string | null) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
};

function matchIssuer(issuer: string | null, title: string): IssuerProfile | null {
  const haystack = `${issuer || ''} ${title}`.toLowerCase();
  return (
    ISSUERS.find((profile) => haystack.includes(profile.name.toLowerCase())) ||
    ISSUERS.find((profile) => profile.name.split(/\s+/).some((word) => word.length > 3 && haystack.includes(word.toLowerCase()))) ||
    null
  );
}

export interface CertificateCheck {
  id: string;
  title: string;
  issuer: string | null;
  knownIssuer: boolean;
  /** The reference URL is hosted on a domain the issuer actually controls. */
  hostVerified: boolean;
  hasReferenceId: boolean;
  idFormatValid: boolean;
  expired: boolean;
  reviewerVerified: boolean;
  authenticity: number;
  concerns: string[];
}

export function checkCertificate(record: {
  id: string;
  title: string;
  issuer: string | null;
  referenceUrl: string | null;
  referenceId: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  status: string;
  metadata: Record<string, unknown>;
}): CertificateCheck {
  const profile = matchIssuer(record.issuer, record.title);
  const host = hostOf(record.referenceUrl);
  const hostVerified = Boolean(profile && host && profile.hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`)));
  const hasReferenceId = Boolean(record.referenceId?.trim());
  const idFormatValid = !profile?.idPattern || !hasReferenceId || profile.idPattern.test(record.referenceId!.trim());
  const expired = Boolean(record.expiresAt && record.expiresAt.getTime() < Date.now());
  const reviewerVerified = record.status === 'VERIFIED';
  const hasQr = Boolean((record.metadata as { qrVerified?: unknown }).qrVerified);

  const concerns: string[] = [];
  if (!profile) concerns.push('Issuer is not in the recognised issuer registry');
  if (record.referenceUrl && !hostVerified) concerns.push(`Verification link host "${host}" is not owned by the stated issuer`);
  if (!record.referenceUrl) concerns.push('No verification link supplied');
  if (!hasReferenceId) concerns.push('No credential ID supplied');
  if (!idFormatValid) concerns.push('Credential ID does not match the issuer format');
  if (expired) concerns.push('Credential has expired');
  if (!record.issuedAt) concerns.push('No issue date supplied');

  // Authenticity is built up from independently checkable facts.
  let authenticity = 10;
  if (profile) authenticity += 20;
  if (hostVerified) authenticity += 25;
  if (hasReferenceId && idFormatValid) authenticity += 15;
  if (hasQr) authenticity += 10;
  if (record.issuedAt) authenticity += 5;
  if (reviewerVerified) authenticity += 20;
  if (expired) authenticity -= 25;

  return {
    id: record.id,
    title: record.title,
    issuer: record.issuer,
    knownIssuer: Boolean(profile),
    hostVerified,
    hasReferenceId,
    idFormatValid,
    expired,
    reviewerVerified,
    authenticity: clampScore(authenticity),
    concerns,
  };
}

export async function runCertificateAgent(candidateId: string): Promise<AgentResult> {
  const rows = await prisma.evidence.findMany({
    where: { candidateId, source: 'credential', status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'EXPIRED'] } },
    orderBy: { issuedAt: 'desc' },
  });

  if (!rows.length) {
    return {
      agent: 'certificate',
      score: 0,
      confidence: 0,
      engine: 'deterministic',
      summary: 'No credentials have been submitted.',
      components: [],
      skills: [],
      signals: { available: false, reason: 'no_evidence', certificates: [] },
    };
  }

  const checks = rows.map((row) =>
    checkCertificate({
      id: row.id,
      title: row.title,
      issuer: row.issuer,
      referenceUrl: row.referenceUrl,
      referenceId: row.referenceId,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      status: String(row.status),
      metadata: safeJsonParse<Record<string, unknown>>(row.metadata, {}),
    }),
  );

  const authentic = checks.filter((check) => check.authenticity >= 60);
  const averageAuthenticity = checks.reduce((total, check) => total + check.authenticity, 0) / checks.length;
  const weighted = checks.reduce((total, check) => {
    const profile = matchIssuer(check.issuer, check.title);
    return total + (profile?.weight ?? 2);
  }, 0);

  const components: AgentComponent[] = [
    {
      key: 'authenticity',
      label: 'Credential authenticity',
      score: (averageAuthenticity / 100) * 40,
      max: 40,
      evidence: `Average authenticity ${Math.round(averageAuthenticity)}/100 across ${checks.length} credential(s)`,
    },
    {
      key: 'issuer_quality',
      label: 'Issuer calibre',
      score: Math.min(25, weighted * 2.5),
      max: 25,
      evidence: `${checks.filter((check) => check.knownIssuer).length} credential(s) from recognised issuers`,
    },
    {
      key: 'traceability',
      label: 'Independently verifiable',
      score: Math.min(20, checks.filter((check) => check.hostVerified).length * 7),
      max: 20,
      evidence: `${checks.filter((check) => check.hostVerified).length} credential(s) link to the issuer's own domain`,
    },
    {
      key: 'currency',
      label: 'Still valid',
      score: Math.min(15, checks.filter((check) => !check.expired).length * 5),
      max: 15,
      evidence: `${checks.filter((check) => check.expired).length} expired of ${checks.length}`,
    },
  ];

  const skills = unique(rows.flatMap((row) => extractSkills(`${row.title} ${row.issuer || ''} ${row.description || ''}`))).map(
    (slug) => ({ slug, level: 55, source: 'credential', verified: authentic.length > 0 }),
  );

  return {
    agent: 'certificate',
    score: scoreFromComponents(components),
    confidence: clampScore(checks.length * 20 + checks.filter((check) => check.hostVerified).length * 15),
    engine: 'deterministic',
    summary: `${checks.length} credential(s) reviewed; ${authentic.length} passed authenticity checks, ${checks.filter((c) => c.expired).length} expired.`,
    components,
    skills,
    signals: { available: true, certificates: checks, averageAuthenticity: Math.round(averageAuthenticity) },
  };
}
