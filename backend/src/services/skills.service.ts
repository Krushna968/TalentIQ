import { prisma } from '../lib/prisma.js';
import { slugify, unique } from '../utils/helpers.js';

/**
 * Shared skill vocabulary.
 *
 * Every agent maps its findings onto these slugs so the talent score, the
 * knowledge graph, and the matching engine all reason over one vocabulary
 * instead of raw free text.
 */

export interface SkillDefinition {
  slug: string;
  name: string;
  category: string;
  aliases: string[];
}

const define = (name: string, category: string, aliases: string[] = []): SkillDefinition => ({
  slug: slugify(name),
  name,
  category,
  aliases,
});

export const SKILL_TAXONOMY: SkillDefinition[] = [
  // Languages
  define('JavaScript', 'language', ['js', 'ecmascript', 'node.js', 'nodejs']),
  define('TypeScript', 'language', ['ts']),
  define('Python', 'language', ['py', 'python3']),
  define('Java', 'language'),
  define('Kotlin', 'language'),
  define('Go', 'language', ['golang']),
  define('Rust', 'language'),
  define('C++', 'language', ['cpp', 'c plus plus']),
  define('C#', 'language', ['csharp', 'c sharp', '.net']),
  define('Ruby', 'language'),
  define('PHP', 'language'),
  define('Swift', 'language'),
  define('Scala', 'language'),
  define('SQL', 'language'),
  define('R', 'language'),
  define('Dart', 'language'),
  define('Shell', 'language', ['bash', 'zsh', 'shell scripting']),

  // Frontend
  define('React', 'frontend', ['react.js', 'reactjs']),
  define('Next.js', 'frontend', ['nextjs', 'next js']),
  define('Vue', 'frontend', ['vue.js', 'vuejs']),
  define('Angular', 'frontend', ['angularjs']),
  define('Svelte', 'frontend', ['sveltekit']),
  define('Tailwind CSS', 'frontend', ['tailwind', 'tailwindcss']),
  define('HTML', 'frontend', ['html5']),
  define('CSS', 'frontend', ['css3', 'sass', 'scss']),
  define('React Native', 'mobile', ['react-native']),
  define('Flutter', 'mobile'),
  define('Android', 'mobile'),
  define('iOS', 'mobile'),

  // Backend and data
  define('Node.js', 'backend', ['node', 'express', 'express.js', 'nestjs']),
  define('Django', 'backend'),
  define('Flask', 'backend'),
  define('FastAPI', 'backend', ['fast api']),
  define('Spring Boot', 'backend', ['spring']),
  define('GraphQL', 'backend', ['apollo']),
  define('REST APIs', 'backend', ['rest', 'restful']),
  define('gRPC', 'backend'),
  define('PostgreSQL', 'data', ['postgres', 'psql']),
  define('MySQL', 'data', ['mariadb']),
  define('MongoDB', 'data', ['mongo', 'mongoose']),
  define('Redis', 'data'),
  define('Elasticsearch', 'data', ['elastic search', 'opensearch']),
  define('Neo4j', 'data', ['graph database']),
  define('Kafka', 'data', ['apache kafka']),
  define('Spark', 'data', ['apache spark', 'pyspark']),
  define('Airflow', 'data', ['apache airflow']),

  // Cloud and platform
  define('AWS', 'cloud', ['amazon web services', 'ec2', 's3', 'lambda']),
  define('Google Cloud', 'cloud', ['gcp', 'google cloud platform', 'bigquery']),
  define('Azure', 'cloud', ['microsoft azure']),
  define('Docker', 'devops', ['containers', 'containerisation', 'containerization']),
  define('Kubernetes', 'devops', ['k8s', 'kubectl']),
  define('Terraform', 'devops', ['infrastructure as code', 'iac']),
  define('CI/CD', 'devops', ['continuous integration', 'github actions', 'jenkins', 'gitlab ci']),
  define('Linux', 'devops', ['unix']),
  define('Git', 'devops', ['github', 'version control']),
  define('Observability', 'devops', ['prometheus', 'grafana', 'monitoring', 'datadog']),

  // AI and ML
  define('Machine Learning', 'ai', ['ml', 'supervised learning']),
  define('Deep Learning', 'ai', ['neural networks', 'cnn', 'rnn']),
  define('PyTorch', 'ai', ['torch']),
  define('TensorFlow', 'ai', ['keras']),
  define('NLP', 'ai', ['natural language processing', 'transformers']),
  define('Computer Vision', 'ai', ['opencv', 'image recognition']),
  define('LLM Engineering', 'ai', ['langchain', 'langgraph', 'rag', 'prompt engineering', 'llm']),
  define('MLOps', 'ai', ['ml ops', 'model deployment', 'mlflow']),
  define('Data Science', 'ai', ['pandas', 'numpy', 'scikit-learn', 'sklearn']),

  // Engineering practice
  define('System Design', 'practice', ['architecture', 'distributed systems', 'scalability']),
  define('Testing', 'practice', ['unit testing', 'jest', 'pytest', 'vitest', 'tdd']),
  define('Security', 'practice', ['appsec', 'cybersecurity', 'penetration testing', 'owasp']),
  define('Performance', 'practice', ['optimisation', 'optimization', 'profiling']),
  define('Accessibility', 'practice', ['a11y', 'wcag']),
  define('Technical Writing', 'communication', ['documentation', 'blogging']),
  define('Mentoring', 'leadership', ['coaching', 'teaching']),
  define('Product Thinking', 'leadership', ['product management', 'roadmapping']),
  define('Team Leadership', 'leadership', ['tech lead', 'engineering manager', 'team lead']),
];

const BY_SLUG = new Map(SKILL_TAXONOMY.map((skill) => [skill.slug, skill]));

/** Longest alias first so "react native" wins over "react". */
const LOOKUP: Array<{ token: string; slug: string }> = SKILL_TAXONOMY.flatMap((skill) => [
  { token: skill.name.toLowerCase(), slug: skill.slug },
  ...skill.aliases.map((alias) => ({ token: alias.toLowerCase(), slug: skill.slug })),
]).sort((a, b) => b.token.length - a.token.length);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getSkill = (slug: string) => BY_SLUG.get(slug);

/** Finds every taxonomy skill mentioned in a block of text. */
export function extractSkills(text: string): string[] {
  if (!text) return [];
  const haystack = ` ${text.toLowerCase().replace(/[\n\r\t]/g, ' ')} `;
  const found: string[] = [];
  for (const { token, slug } of LOOKUP) {
    if (found.includes(slug)) continue;
    // Word boundaries fail on tokens like "c++" and ".net", so match on
    // surrounding non-alphanumerics instead.
    const pattern = new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(token)}([^a-z0-9+#.]|$)`, 'i');
    if (pattern.test(haystack)) found.push(slug);
  }
  return found;
}

/** Maps arbitrary labels (GitHub languages, job requirements) onto taxonomy slugs. */
export function normalizeSkill(label: string): string | null {
  const value = String(label || '').trim().toLowerCase();
  if (!value) return null;
  const direct = BY_SLUG.get(slugify(value));
  if (direct) return direct.slug;
  const alias = LOOKUP.find((entry) => entry.token === value);
  return alias ? alias.slug : null;
}

export function normalizeSkills(labels: string[]): string[] {
  return unique(labels.map(normalizeSkill).filter((slug): slug is string => Boolean(slug)));
}

/** Creates any missing taxonomy rows and returns slug -> id. */
export async function ensureSkillRows(slugs: string[]): Promise<Map<string, string>> {
  const wanted = unique(slugs).filter((slug) => BY_SLUG.has(slug));
  if (!wanted.length) return new Map();

  const existing = await prisma.skill.findMany({ where: { slug: { in: wanted } }, select: { id: true, slug: true } });
  const map = new Map(existing.map((row) => [row.slug, row.id]));

  for (const slug of wanted) {
    if (map.has(slug)) continue;
    const definition = BY_SLUG.get(slug)!;
    const created = await prisma.skill.upsert({
      where: { slug },
      create: { slug, name: definition.name, category: definition.category, aliasesJson: JSON.stringify(definition.aliases) },
      update: {},
      select: { id: true, slug: true },
    });
    map.set(created.slug, created.id);
  }
  return map;
}

export interface SkillSignal {
  slug: string;
  /** 0-100 strength contributed by this source. */
  level: number;
  source: string;
  verified?: boolean;
}

/**
 * Merges skill signals from every agent into the candidate's skill graph.
 * A skill seen by several independent sources scores higher than the same skill
 * claimed once, which is what makes the graph evidence-weighted.
 */
export async function upsertCandidateSkills(candidateId: string, signals: SkillSignal[]) {
  const grouped = new Map<string, SkillSignal[]>();
  for (const signal of signals) {
    if (!BY_SLUG.has(signal.slug)) continue;
    const bucket = grouped.get(signal.slug) || [];
    bucket.push(signal);
    grouped.set(signal.slug, bucket);
  }
  if (!grouped.size) return 0;

  const ids = await ensureSkillRows([...grouped.keys()]);

  for (const [slug, entries] of grouped) {
    const skillId = ids.get(slug);
    if (!skillId) continue;

    const best = Math.max(...entries.map((entry) => entry.level));
    const sources = unique(entries.map((entry) => entry.source));
    // Corroboration bonus: each additional independent source adds 5 points.
    const level = Math.min(100, Math.round(best + (sources.length - 1) * 5));
    const verified = entries.some((entry) => entry.verified);

    await prisma.candidateSkill.upsert({
      where: { candidateId_skillId: { candidateId, skillId } },
      create: {
        candidateId,
        skillId,
        level,
        evidenceCount: entries.length,
        verified,
        sourcesJson: JSON.stringify(sources),
        lastSeenAt: new Date(),
      },
      update: {
        level,
        evidenceCount: entries.length,
        verified,
        sourcesJson: JSON.stringify(sources),
        lastSeenAt: new Date(),
      },
    });
  }
  return grouped.size;
}

export async function listCandidateSkills(candidateId: string) {
  const rows = await prisma.candidateSkill.findMany({
    where: { candidateId },
    include: { skill: true },
    orderBy: [{ level: 'desc' }],
  });
  return rows.map((row) => ({
    slug: row.skill.slug,
    name: row.skill.name,
    category: row.skill.category,
    level: row.level,
    verified: row.verified,
    evidenceCount: row.evidenceCount,
    sources: JSON.parse(row.sourcesJson || '[]') as string[],
  }));
}
