export type EvidenceType = 'github' | 'hackathon' | 'presentation' | 'team' | 'interview';

export interface PassportEvidence {
  id: string;
  type: EvidenceType;
  label: string;
  source: string;
  collectedAt: string;
  authority: number;
  depth: number;
  consistency: number;
  competencies: Record<string, number>;
  summary: string;
  verificationStatus: 'verified' | 'review';
}

interface Competency { id: string; label: string; weight: number; }

const role = {
  id: 'junior-ai-fullstack-engineer',
  title: 'Junior AI / Full-stack Engineer',
  competencies: [
    { id: 'engineering', label: 'Software engineering', weight: 0.30 },
    { id: 'ai', label: 'Applied AI', weight: 0.25 },
    { id: 'delivery', label: 'Product delivery', weight: 0.20 },
    { id: 'collaboration', label: 'Collaboration', weight: 0.15 },
    { id: 'communication', label: 'Communication', weight: 0.10 },
  ] satisfies Competency[],
};

const evidence: PassportEvidence[] = [
  { id: 'github-talentlens', type: 'github', label: 'TalentLens — AI evidence extraction', source: 'github.com/aarav/talentlens', collectedAt: '2026-07-28', authority: .95, depth: .88, consistency: .90, competencies: { engineering: .91, ai: .86, delivery: .76 }, summary: '428 commits, tests, deployed API, and architecture documentation.', verificationStatus: 'verified' },
  { id: 'hackathon-bharat', type: 'hackathon', label: 'Build for Bharat 2026 — finalist', source: 'Build for Bharat organizer result', collectedAt: '2026-07-18', authority: .90, depth: .80, consistency: .84, competencies: { ai: .78, delivery: .89, collaboration: .80 }, summary: 'Team of four; project shortlisted from 180 submissions.', verificationStatus: 'verified' },
  { id: 'deck-talentlens', type: 'presentation', label: 'TalentLens product presentation', source: 'Uploaded PDF · SHA-256 recorded', collectedAt: '2026-07-18', authority: .72, depth: .79, consistency: .77, competencies: { communication: .83, delivery: .76, ai: .70 }, summary: 'Clear problem framing and technical trade-offs; similarity check passed.', verificationStatus: 'review' },
  { id: 'team-delivery', type: 'team', label: 'Hackathon delivery record', source: 'Pull requests + team attestations', collectedAt: '2026-07-18', authority: .78, depth: .73, consistency: .86, competencies: { engineering: .74, collaboration: .88, delivery: .81 }, summary: 'Owned backend integration and reviewed six pull requests.', verificationStatus: 'verified' },
  { id: 'interview-208', type: 'interview', label: 'System-design practice session', source: 'TalentIQ verified session #INT-208', collectedAt: '2026-07-30', authority: .76, depth: .68, consistency: .74, competencies: { engineering: .76, communication: .70 }, summary: 'Strong API trade-offs; deeper model-monitoring evaluation recommended.', verificationStatus: 'verified' },
];

const risks = [
  { label: 'Credential verification', severity: 'review', detail: 'One course certificate has not yet been issuer-verified.' },
  { label: 'Production ML operations', severity: 'gap', detail: 'No independent evidence of monitoring or model evaluation in production.' },
];

const confidence = (item: PassportEvidence) => Math.round((item.authority * .45 + item.depth * .30 + item.consistency * .15 + .10) * 100);

export const passportService = {
  getPassport(candidateId = 'aarav-mehta') {
    const competencyResults = role.competencies.map((competency) => {
      const supporting = evidence.filter((item) => item.competencies[competency.id] !== undefined);
      const totalWeight = supporting.reduce((sum, item) => sum + confidence(item), 0) || 1;
      const score = Math.round(supporting.reduce((sum, item) => sum + item.competencies[competency.id] * confidence(item), 0) / totalWeight * 100);
      return { ...competency, score, evidenceIds: supporting.map((item) => item.id) };
    });
    const readiness = Math.round(competencyResults.reduce((sum, item) => sum + item.score * item.weight, 0));
    const evidenceConfidence = Math.round(evidence.reduce((sum, item) => sum + confidence(item), 0) / evidence.length);
    const trustRisk = risks.reduce((sum, risk) => sum + (risk.severity === 'gap' ? 12 : 6), 0);
    const recommendation = readiness >= 75 && evidenceConfidence >= 70 && trustRisk <= 20 ? 'Ready to interview' : 'Develop / targeted interview';
    const weakestCompetency = [...competencyResults].sort((a, b) => a.score - b.score)[0];

    return {
      candidate: { id: candidateId, name: 'Aarav Mehta', location: 'Pune, India', headline: 'Full-stack builder focused on practical AI products' },
      role, metrics: { readiness, evidenceConfidence, trustRisk, evidenceCount: evidence.length }, recommendation,
      competencyResults, evidence: evidence.map((item) => ({ ...item, confidence: confidence(item) })), risks,
      nextBestEvaluation: { competency: weakestCompetency.label, prompt: 'Ask the candidate to explain how they would monitor an AI feature after launch: quality metrics, drift, privacy, and rollback.' },
      disclosure: 'Demo evidence is seeded. Source integrations and issuer verification must be connected before production use.',
    };
  },
};
