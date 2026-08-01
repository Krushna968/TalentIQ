export type ResumeScoreInput = {
  resumeText?: unknown;
  targetRole?: unknown;
};

type ScoreComponent = {
  key: 'roleAlignment' | 'skillsCoverage' | 'impactEvidence' | 'structure';
  label: string;
  score: number;
  max: number;
  detail: string;
};

const SKILL_LIBRARY = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express', 'Python', 'Java', 'C#',
  'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST', 'AWS', 'Azure', 'GCP', 'Docker',
  'Kubernetes', 'Git', 'CI/CD', 'Jest', 'Vitest', 'Playwright', 'Figma', 'Agile', 'Machine Learning',
  'Data Analysis', 'Tableau', 'Power BI', 'TensorFlow', 'PyTorch', 'Linux', 'Terraform',
];

const ROLE_SKILLS: Record<string, string[]> = {
  frontend: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'HTML', 'CSS', 'Git', 'Jest'],
  backend: ['Node.js', 'Express', 'Python', 'Java', 'SQL', 'PostgreSQL', 'REST', 'Docker', 'Git'],
  fullstack: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'PostgreSQL', 'REST', 'Docker', 'Git'],
  data: ['Python', 'SQL', 'Data Analysis', 'Tableau', 'Power BI', 'Machine Learning'],
  machine: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Data Analysis'],
  devops: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Git'],
  product: ['Figma', 'Agile', 'Data Analysis', 'SQL', 'Tableau'],
};

const ACTION_VERBS = /\b(achieved|built|created|delivered|designed|developed|improved|increased|launched|led|managed|optimized|reduced|shipped|streamlined|supported)\b/gi;
const HEADINGS = ['experience', 'education', 'skills', 'projects', 'summary', 'certifications', 'achievements'];
const clamp = (value: number, max: number) => Math.max(0, Math.min(max, Math.round(value)));
const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasTerm = (text: string, term: string) => new RegExp(`(^|[^a-z0-9])${escaped(term.toLowerCase())}(?=$|[^a-z0-9])`, 'i').test(text);

function targetSkills(role: string) {
  const normalized = role.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matches = Object.entries(ROLE_SKILLS)
    .filter(([keyword]) => normalized.includes(keyword))
    .flatMap(([, skills]) => skills);
  return [...new Set(matches.length ? matches : ['JavaScript', 'TypeScript', 'Git'])];
}

export function scoreResume(input: ResumeScoreInput) {
  const resumeText = typeof input.resumeText === 'string' ? input.resumeText.trim().slice(0, 30000) : '';
  const targetRole = typeof input.targetRole === 'string' && input.targetRole.trim() ? input.targetRole.trim().slice(0, 160) : 'Target role';
  if (!resumeText) throw Object.assign(new Error('resumeText is required to score a resume.'), { status: 400 });

  const lower = resumeText.toLowerCase();
  const matchedSkills = SKILL_LIBRARY.filter((skill) => hasTerm(lower, skill));
  const expectedSkills = targetSkills(targetRole);
  const roleWords = targetRole.toLowerCase().split(/[^a-z0-9+#.]+/).filter((word) => word.length > 2 && !['senior', 'junior', 'engineer', 'developer', 'specialist', 'manager'].includes(word));
  const roleHits = roleWords.filter((word) => hasTerm(lower, word)).length;
  const expectedHits = expectedSkills.filter((skill) => matchedSkills.includes(skill)).length;
  const missingSkills = expectedSkills.filter((skill) => !matchedSkills.includes(skill));
  const metricMatches = resumeText.match(/(?:\b\d+(?:\.\d+)?\s?(?:%|x|k|m|users|clients|hours|days|weeks|months|years)|\$\s?\d[\d,]*(?:\.\d+)?)/gi) || [];
  const actionMatches = resumeText.match(ACTION_VERBS) || [];
  const headingHits = HEADINGS.filter((heading) => new RegExp(`(^|\\n)\\s*${heading}\\b`, 'im').test(resumeText)).length;
  const hasContact = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(resumeText);
  const hasLink = /(?:linkedin\.com|github\.com|https?:\/\/)/i.test(resumeText);
  const wordCount = resumeText.split(/\s+/).filter(Boolean).length;

  const components: ScoreComponent[] = [
    { key: 'roleAlignment', label: 'Role alignment', max: 35, score: clamp((expectedHits / expectedSkills.length) * 27 + Math.min(roleHits, 3) * 3, 35), detail: `${expectedHits}/${expectedSkills.length} target-role skills are evidenced` },
    { key: 'skillsCoverage', label: 'Skills coverage', max: 30, score: clamp((matchedSkills.length / 12) * 30, 30), detail: `${matchedSkills.length} recognised skills found` },
    { key: 'impactEvidence', label: 'Impact evidence', max: 20, score: clamp(Math.min(metricMatches.length, 5) * 2.4 + Math.min(actionMatches.length, 8) * 1, 20), detail: `${metricMatches.length} measurable outcomes and ${actionMatches.length} action verbs found` },
    { key: 'structure', label: 'Resume structure', max: 15, score: clamp(headingHits * 2 + (hasContact ? 2 : 0) + (hasLink ? 1 : 0) + (wordCount >= 180 && wordCount <= 1400 ? 2 : 0), 15), detail: `${headingHits} standard sections found${hasContact ? ', contact details included' : ''}` },
  ];
  const score = components.reduce((total, component) => total + component.score, 0);
  const suggestions = [
    ...missingSkills.slice(0, 4).map((skill) => `Add ${skill} only if you can support it with a real project, role, or credential.`),
    ...(metricMatches.length < 2 ? ['Turn key achievements into measurable outcomes (for example: time saved, adoption, revenue, quality, or scale).'] : []),
    ...(headingHits < 3 ? ['Use clear Experience, Skills, Projects, and Education headings so recruiters and ATS tools can scan the resume.'] : []),
    ...(wordCount < 180 ? ['Add enough evidence for each role or project; the current resume is very brief.'] : []),
  ].slice(0, 5);

  return { score, targetRole, components, matchedSkills, missingSkills, suggestions, evidence: { wordCount, metrics: metricMatches.length, actionVerbs: actionMatches.length, headings: headingHits }, disclaimer: 'This is an evidence-based screening score, not a hiring decision. It reflects only the text supplied.' };
}