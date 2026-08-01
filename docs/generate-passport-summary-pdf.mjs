import { writeFileSync } from 'node:fs';

const lines = [
  ['TalentIQ - Proof-to-Hire Passport', 22, 80],
  ['Hackathon product summary', 11, 80],
  ['', 11, 80],
  ['USP', 15, 80],
  ['TalentIQ turns scattered work into a role-specific, explainable hiring brief:', 11, 80],
  ['what a candidate can do, why the evidence is credible, and what risk remains.', 11, 80],
  ['', 11, 80],
  ['What makes it different', 15, 80],
  ['Instead of black-box scores or resume keywords, every competency is linked to', 11, 80],
  ['source evidence from code, hackathons, presentations, team delivery, and interviews.', 11, 80],
  ['', 11, 80],
  ['Implemented vertical slice', 15, 80],
  ['- Protected recruiter route: /recruiter/passport', 11, 80],
  ['- Role readiness, evidence confidence, trust risk, and source inspection', 11, 80],
  ['- Competency proof graph and a next-best targeted interview action', 11, 80],
  ['- Recruiter-only APIs with organization access: GET /api/passports/featured', 11, 80],
  ['  and POST /api/passports/:candidateId/targeted-interview', 11, 80],
  ['', 11, 80],
  ['Scale and business path', 15, 80],
  ['Use queued connector adapters for GitHub, hackathons, uploads, and interviews.', 11, 80],
  ['Keep immutable provenance, hashes, timestamps, consent, and scoring versions.', 11, 80],
  ['Sell first to organizers and campuses, then recruiter subscriptions and enterprise ATS.', 11, 80],
  ['', 11, 80],
  ['Validation', 15, 80],
  ['Frontend production build passed. Backend typecheck passed. 32 backend tests passed,', 11, 80],
  ['including Passport authorization, response completeness, and interview queue contracts.', 11, 80],
  ['', 11, 80],
  ['Important: evidence is seeded and clearly disclosed. Live provider verification requires', 10, 80],
  ['configured credentials, production data, and governance before real hiring use.', 10, 80],
];

const escape = (text) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const stream = lines.map(([text, size, x], index) => `BT /F1 ${size} Tf ${x} ${760 - index * 23} Td (${escape(text)}) Tj ET`).join('\n');
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
];

let pdf = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
writeFileSync(new URL('./PROOF_TO_HIRE_PASSPORT_SUMMARY.pdf', import.meta.url), pdf, 'binary');
