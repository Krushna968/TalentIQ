export const role = {
  id: 'junior-ai-fullstack-engineer',
  title: 'Junior AI / Full-stack Engineer',
  competencies: [
    { id: 'engineering', label: 'Software engineering', weight: 0.30 },
    { id: 'ai', label: 'Applied AI', weight: 0.25 },
    { id: 'delivery', label: 'Product delivery', weight: 0.20 },
    { id: 'collaboration', label: 'Collaboration', weight: 0.15 },
    { id: 'communication', label: 'Communication', weight: 0.10 },
  ],
};

export const candidate = {
  name: 'Aarav Mehta',
  location: 'Pune, India',
  headline: 'Full-stack builder focused on practical AI products',
  evidence: [
    { id: 'repo', type: 'GitHub repository', title: 'TalentLens — AI evidence extraction', source: 'github.com/aarav/talentlens', collectedAt: '2026-07-28', authority: 0.95, depth: 0.88, consistency: 0.90, competencies: { engineering: 0.91, ai: 0.86, delivery: 0.76 }, note: '428 commits, tests, deployed API, and architecture documentation.' },
    { id: 'hackathon', type: 'Hackathon result', title: 'Build for Bharat 2026 — finalist', source: 'buildforbharat.org/results/aarav-mehta', collectedAt: '2026-07-18', authority: 0.90, depth: 0.80, consistency: 0.84, competencies: { ai: 0.78, delivery: 0.89, collaboration: 0.80 }, note: 'Team of four; project shortlisted from 180 submissions.' },
    { id: 'presentation', type: 'Pitch deck', title: 'TalentLens product presentation', source: 'Uploaded PDF · SHA-256 verified', collectedAt: '2026-07-18', authority: 0.72, depth: 0.79, consistency: 0.77, competencies: { communication: 0.83, delivery: 0.76, ai: 0.70 }, note: 'Clear problem framing and technical trade-offs; copied-content check passed.' },
    { id: 'contributions', type: 'Team contribution', title: 'Hackathon delivery record', source: 'GitHub pull requests + team attestations', collectedAt: '2026-07-18', authority: 0.78, depth: 0.73, consistency: 0.86, competencies: { engineering: 0.74, collaboration: 0.88, delivery: 0.81 }, note: 'Owned backend integration and reviewed 6 pull requests.' },
    { id: 'interview', type: 'AI interview', title: 'System-design practice session', source: 'TalentIQ verified session #INT-208', collectedAt: '2026-07-30', authority: 0.76, depth: 0.68, consistency: 0.74, competencies: { engineering: 0.76, communication: 0.70 }, note: 'Strong API trade-offs; needs deeper evaluation of model monitoring.' },
  ],
  risks: [
    { label: 'Credential verification', severity: 'review', detail: 'One course certificate has not yet been issuer-verified.' },
    { label: 'Production ML operations', severity: 'gap', detail: 'No independent evidence of monitoring or model evaluation in production.' },
  ],
};

const clamp = (value) => Math.max(0, Math.min(1, value));
const daysSince = (isoDate) => Math.max(0, (Date.now() - new Date(isoDate).getTime()) / 86400000);
const recency = (isoDate) => clamp(1 - daysSince(isoDate) / 365);

export function evidenceConfidence(evidence) {
  return Math.round((evidence.authority * 0.45 + evidence.depth * 0.30 + evidence.consistency * 0.15 + recency(evidence.collectedAt) * 0.10) * 100);
}

export function buildPassport(candidateData, roleData) {
  const competencyResults = roleData.competencies.map((competency) => {
    const supporting = candidateData.evidence.filter((item) => item.competencies[competency.id]);
    const totalWeight = supporting.reduce((sum, item) => sum + evidenceConfidence(item), 0) || 1;
    const score = supporting.reduce((sum, item) => sum + item.competencies[competency.id] * evidenceConfidence(item), 0) / totalWeight;
    return { ...competency, score: Math.round(score * 100), supporting };
  });

  const readiness = Math.round(competencyResults.reduce((sum, item) => sum + item.score * item.weight, 0));
  const confidence = Math.round(candidateData.evidence.reduce((sum, item) => sum + evidenceConfidence(item), 0) / candidateData.evidence.length);
  const risk = candidateData.risks.reduce((sum, item) => sum + (item.severity === 'gap' ? 12 : 6), 0);
  const decision = readiness >= 75 && confidence >= 70 && risk <= 20 ? 'Ready to interview' : readiness >= 60 ? 'Develop / targeted interview' : 'Insufficient evidence';
  const weakest = [...competencyResults].sort((a, b) => a.score - b.score)[0];

  return { competencyResults, readiness, confidence, risk, decision, weakest };
}
