import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma/client';
import { SKILL_TAXONOMY } from '../src/services/skills.service.js';

/**
 * Seeds a working demo environment: taxonomy, users for every role, candidates
 * with real evidence, jobs, salary benchmarks and learning resources.
 *
 * Safe to run repeatedly — everything is keyed and upserted, and existing
 * candidate scores and evidence are never overwritten.
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://talentiq:talentiq_local_dev_pw@localhost:5432/talentiq',
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'talentiq2026';

const candidates = [
  {
    id: 'aditi-rao',
    name: 'Aditi Rao',
    email: 'aditi@talentiq.ai',
    title: 'Full-Stack Engineer',
    location: 'Bengaluru, India',
    bio: 'Builds evidence-heavy web platforms. Cares about API design and shipping.',
    skills: ['react', 'typescript', 'node-js', 'graphql', 'aws', 'python', 'postgresql'],
  },
  {
    id: 'elena-rodriguez',
    name: 'Elena Rodriguez',
    email: 'elena@talentiq.ai',
    title: 'Senior Backend Engineer',
    location: 'Madrid, Spain',
    bio: 'Distributed systems engineer working mostly in Rust and Go.',
    skills: ['rust', 'go', 'kafka', 'kubernetes', 'system-design', 'grpc', 'observability'],
  },
  {
    id: 'david-chen',
    name: 'David Chen',
    email: 'david@talentiq.ai',
    title: 'Systems Architect',
    location: 'Singapore',
    bio: 'Twelve years of infrastructure work across C++, Go and Terraform.',
    skills: ['go', 'kubernetes', 'aws', 'terraform', 'system-design', 'linux', 'docker'],
  },
  {
    id: 'sarah-jenkins',
    name: 'Sarah Jenkins',
    email: 'sarah@talentiq.ai',
    title: 'Backend Engineer II',
    location: 'Manchester, United Kingdom',
    bio: 'Python and GraphQL developer with a strong hackathon record.',
    skills: ['python', 'node-js', 'graphql', 'postgresql', 'redis', 'docker', 'testing'],
  },
  {
    id: 'marcus-okafor',
    name: 'Marcus Okafor',
    email: 'marcus@talentiq.ai',
    title: 'ML Engineer',
    location: 'Lagos, Nigeria',
    bio: 'Machine-learning engineer focused on production ML and evaluation.',
    skills: ['python', 'pytorch', 'machine-learning', 'mlops', 'spark', 'nlp', 'data-science'],
  },
];

const evidenceFor: Record<string, Array<Record<string, unknown>>> = {
  'aditi-rao': [
    {
      source: 'credential',
      title: 'AWS Certified Developer - Associate',
      issuer: 'Amazon Web Services',
      referenceUrl: 'https://aws.amazon.com/verification/ABC123XYZ',
      referenceId: 'ABC123XYZ',
      issuedAt: new Date('2025-03-11'),
      status: 'VERIFIED',
      score: 88,
    },
    {
      source: 'hackathon',
      title: 'HackIndia 2025 - Runner-up',
      issuer: 'HackIndia',
      description: 'Led the backend for an AI code-review assistant. Built the diff pipeline and the review API.',
      issuedAt: new Date('2025-08-20'),
      status: 'VERIFIED',
      score: 82,
      metadata: { rank: 'Runner-up', teamSize: 4, role: 'Backend lead' },
    },
  ],
  'elena-rodriguez': [
    {
      source: 'credential',
      title: 'Certified Kubernetes Administrator',
      issuer: 'Cloud Native Computing Foundation',
      referenceUrl: 'https://training.linuxfoundation.org/certification/verify/CKA-2025-9981',
      referenceId: 'CKA-2025-9981',
      issuedAt: new Date('2025-01-15'),
      status: 'VERIFIED',
      score: 93,
    },
    {
      source: 'presentation',
      title: 'Distributed consensus in practice',
      issuer: 'KubeCon EU 2025',
      description:
        'Talk on the problem of consensus under partition. Covers the architecture we deployed, the latency trade-offs, benchmark results across three regions, and the failure modes we hit in production. Demo included.',
      issuedAt: new Date('2025-04-02'),
      status: 'VERIFIED',
      score: 87,
      metadata: { slides: 28 },
    },
  ],
  'sarah-jenkins': [
    {
      source: 'hackathon',
      title: 'PyCon Hack 2025 - Winner',
      issuer: 'PyCon',
      description: 'Built and shipped a GraphQL schema linter in 36 hours. I implemented the rule engine.',
      issuedAt: new Date('2025-05-10'),
      status: 'VERIFIED',
      score: 90,
      metadata: { rank: 'Winner', teamSize: 3, role: 'Implemented rule engine' },
    },
  ],
  'marcus-okafor': [
    {
      source: 'credential',
      title: 'Deep Learning Specialization',
      issuer: 'DeepLearning.AI',
      referenceUrl: 'https://coursera.org/verify/specialization/9KJH2LM4NPQR',
      referenceId: '9KJH2LM4NPQR',
      issuedAt: new Date('2024-11-02'),
      status: 'VERIFIED',
      score: 85,
    },
    {
      source: 'presentation',
      title: 'Why your model degrades in production',
      issuer: 'NeurIPS 2025 Workshop',
      description:
        'The problem is training-serving skew. We measured drift across six months of traffic, benchmarked three detection approaches, and deployed a monitoring pipeline. Results: 40 percent faster detection, and a clear business case for the on-call cost saved.',
      issuedAt: new Date('2025-12-08'),
      status: 'VERIFIED',
      score: 91,
      metadata: { slides: 22 },
    },
  ],
};

const jobs = [
  {
    title: 'Senior Backend Engineer',
    location: 'Bengaluru, India',
    seniority: 'senior',
    employmentType: 'full-time',
    remote: true,
    salaryMin: 3_500_000,
    salaryMax: 5_500_000,
    minTalentScore: 70,
    skills: ['go', 'kubernetes', 'postgresql', 'system-design', 'kafka'],
    description:
      'Own the services behind our matching platform. You will design APIs, run them in production on Kubernetes, and make deliberate trade-offs about consistency and latency.',
    responsibilities: ['Design and operate backend services', 'Own production reliability', 'Mentor mid-level engineers'],
  },
  {
    title: 'Full-Stack Engineer',
    location: 'Remote',
    seniority: 'mid',
    employmentType: 'full-time',
    remote: true,
    salaryMin: 1_800_000,
    salaryMax: 3_000_000,
    minTalentScore: 55,
    skills: ['react', 'typescript', 'node-js', 'postgresql', 'graphql'],
    description: 'Build candidate-facing product surfaces end to end, from the React screens to the APIs behind them.',
    responsibilities: ['Ship product features end to end', 'Improve frontend performance', 'Write tests that hold'],
  },
  {
    title: 'Machine Learning Engineer',
    location: 'Remote',
    seniority: 'senior',
    employmentType: 'full-time',
    remote: true,
    salaryMin: 4_000_000,
    salaryMax: 6_500_000,
    minTalentScore: 75,
    skills: ['python', 'pytorch', 'machine-learning', 'mlops', 'nlp'],
    description: 'Take models from notebook to production and keep them honest once they are there.',
    responsibilities: ['Productionise models', 'Build evaluation harnesses', 'Own drift monitoring'],
  },
];

const salaryBenchmarks = [
  { roleFamily: 'backend', region: 'India', seniority: 'mid', p25: 1_400_000, p50: 2_200_000, p75: 3_200_000 },
  { roleFamily: 'backend', region: 'India', seniority: 'senior', p25: 3_000_000, p50: 4_500_000, p75: 6_500_000 },
  { roleFamily: 'fullstack', region: 'India', seniority: 'mid', p25: 1_200_000, p50: 2_000_000, p75: 2_900_000 },
  { roleFamily: 'ml-ai', region: 'India', seniority: 'senior', p25: 3_500_000, p50: 5_200_000, p75: 7_500_000 },
  { roleFamily: 'infrastructure', region: 'India', seniority: 'senior', p25: 3_200_000, p50: 4_800_000, p75: 6_800_000 },
];

const learningResources = [
  { skillSlug: 'kubernetes', title: 'Kubernetes the Hard Way', provider: 'Kelsey Hightower', url: 'https://github.com/kelseyhightower/kubernetes-the-hard-way', level: 'advanced', hours: 20 },
  { skillSlug: 'system-design', title: 'System Design Primer', provider: 'Open source', url: 'https://github.com/donnemartin/system-design-primer', level: 'intermediate', hours: 40 },
  { skillSlug: 'rust', title: 'The Rust Programming Language', provider: 'Rust Foundation', url: 'https://doc.rust-lang.org/book/', level: 'beginner', hours: 30 },
  { skillSlug: 'machine-learning', title: 'Machine Learning Specialization', provider: 'DeepLearning.AI', url: 'https://www.coursera.org/specializations/machine-learning-introduction', level: 'beginner', hours: 60 },
  { skillSlug: 'go', title: 'Effective Go', provider: 'Go team', url: 'https://go.dev/doc/effective_go', level: 'intermediate', hours: 8 },
  { skillSlug: 'postgresql', title: 'Use The Index, Luke', provider: 'Markus Winand', url: 'https://use-the-index-luke.com/', level: 'intermediate', hours: 12 },
  { skillSlug: 'testing', title: 'Testing JavaScript', provider: 'Kent C. Dodds', url: 'https://testingjavascript.com/', level: 'intermediate', hours: 15 },
];

async function seedSkills() {
  for (const skill of SKILL_TAXONOMY) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      create: { slug: skill.slug, name: skill.name, category: skill.category, aliasesJson: JSON.stringify(skill.aliases) },
      update: { name: skill.name, category: skill.category, aliasesJson: JSON.stringify(skill.aliases) },
    });
  }
  return SKILL_TAXONOMY.length;
}

async function seedUsers(passwordHash: string) {
  for (const candidate of candidates) {
    await prisma.candidate.upsert({
      where: { id: candidate.id },
      create: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        title: candidate.title,
        location: candidate.location,
        bio: candidate.bio,
        role: 'candidate',
      },
      // Never clobber a live profile's scores or evidence on a re-run.
      update: {},
    });

    await prisma.user.upsert({
      where: { email: candidate.email },
      create: {
        email: candidate.email,
        name: candidate.name,
        passwordHash,
        role: 'CANDIDATE',
        candidateId: candidate.id,
        experienceYears: 4,
      },
      update: { candidateId: candidate.id },
    });
  }

  const company = await prisma.company.upsert({
    where: { name: 'TalentIQ Labs' },
    create: {
      name: 'TalentIQ Labs',
      website: 'https://talentiq.example',
      industry: 'Software',
      size: '51-200',
      location: 'Bengaluru, India',
      about: 'The demo employer used throughout the TalentIQ sample data.',
    },
    update: {},
  });

  const recruiterUser = await prisma.user.upsert({
    where: { email: 'recruiter@talentiq.ai' },
    create: { email: 'recruiter@talentiq.ai', name: 'Priya Nair', passwordHash, role: 'RECRUITER' },
    update: {},
  });
  const recruiter = await prisma.recruiterProfile.upsert({
    where: { userId: recruiterUser.id },
    create: { userId: recruiterUser.id, companyId: company.id, title: 'Head of Talent' },
    update: { companyId: company.id },
  });

  await prisma.user.upsert({
    where: { email: 'reviewer@talentiq.ai' },
    create: { email: 'reviewer@talentiq.ai', name: 'Sam Reviewer', passwordHash, role: 'REVIEWER' },
    update: {},
  });
  await prisma.user.upsert({
    where: { email: 'admin@talentiq.ai' },
    create: { email: 'admin@talentiq.ai', name: 'Admin', passwordHash, role: 'ADMIN' },
    update: {},
  });

  return { recruiter, company };
}

async function seedEvidence() {
  let created = 0;
  for (const [candidateId, records] of Object.entries(evidenceFor)) {
    for (const record of records) {
      const title = String(record.title);
      const existing = await prisma.evidence.findFirst({ where: { candidateId, title } });
      if (existing) continue;
      await prisma.evidence.create({
        data: {
          candidateId,
          source: String(record.source),
          title,
          issuer: (record.issuer as string) ?? null,
          description: (record.description as string) ?? null,
          referenceUrl: (record.referenceUrl as string) ?? null,
          referenceId: (record.referenceId as string) ?? null,
          issuedAt: (record.issuedAt as Date) ?? null,
          status: record.status as never,
          score: (record.score as number) ?? null,
          visibility: 'RECRUITERS',
          verifiedAt: record.status === 'VERIFIED' ? new Date() : null,
          submittedBy: candidateId,
          metadata: record.metadata ? JSON.stringify(record.metadata) : null,
        },
      });
      created += 1;
    }
  }
  return created;
}

async function seedCandidateSkills() {
  const rows = await prisma.skill.findMany({ select: { id: true, slug: true } });
  const bySlug = new Map(rows.map((row) => [row.slug, row.id]));
  let count = 0;

  for (const candidate of candidates) {
    for (const [index, slug] of candidate.skills.entries()) {
      const skillId = bySlug.get(slug);
      if (!skillId) continue;
      // Earlier entries are the candidate's stronger skills.
      const level = Math.max(45, 92 - index * 6);
      await prisma.candidateSkill.upsert({
        where: { candidateId_skillId: { candidateId: candidate.id, skillId } },
        create: {
          candidateId: candidate.id,
          skillId,
          level,
          evidenceCount: 1,
          verified: index < 3,
          sourcesJson: JSON.stringify(['profile']),
        },
        update: {},
      });
      count += 1;
    }
  }
  return count;
}

async function seedJobs(recruiterId: string, companyId: string, companyName: string) {
  let created = 0;
  for (const job of jobs) {
    const existing = await prisma.job.findFirst({ where: { title: job.title, companyId } });
    if (existing) continue;
    await prisma.job.create({
      data: {
        title: job.title,
        company: companyName,
        companyId,
        postedById: recruiterId,
        description: job.description,
        location: job.location,
        seniority: job.seniority,
        employmentType: job.employmentType,
        remote: job.remote,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: 'INR',
        minTalentScore: job.minTalentScore,
        skillsJson: JSON.stringify(job.skills),
        responsibilitiesJson: JSON.stringify(job.responsibilities),
      },
    });
    created += 1;
  }
  return created;
}

async function seedReferenceData() {
  for (const benchmark of salaryBenchmarks) {
    await prisma.salaryBenchmark.upsert({
      where: {
        roleFamily_region_seniority: {
          roleFamily: benchmark.roleFamily,
          region: benchmark.region,
          seniority: benchmark.seniority,
        },
      },
      create: { ...benchmark, currency: 'INR' },
      update: { p25: benchmark.p25, p50: benchmark.p50, p75: benchmark.p75 },
    });
  }
  for (const resource of learningResources) {
    await prisma.learningResource.upsert({
      where: { skillSlug_url: { skillSlug: resource.skillSlug, url: resource.url } },
      create: resource,
      update: { title: resource.title, provider: resource.provider, level: resource.level, hours: resource.hours },
    });
  }
  return { benchmarks: salaryBenchmarks.length, resources: learningResources.length };
}

const seed = async () => {
  console.log('Seeding TalentIQ...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const skills = await seedSkills();
  const { recruiter, company } = await seedUsers(passwordHash);
  const evidence = await seedEvidence();
  const candidateSkills = await seedCandidateSkills();
  const jobCount = await seedJobs(recruiter.id, company.id, company.name);
  const reference = await seedReferenceData();

  console.log(`  skills taxonomy      ${skills}`);
  console.log(`  candidates           ${candidates.length}`);
  console.log(`  candidate skills     ${candidateSkills}`);
  console.log(`  evidence records     ${evidence} new`);
  console.log(`  jobs                 ${jobCount} new`);
  console.log(`  salary benchmarks    ${reference.benchmarks}`);
  console.log(`  learning resources   ${reference.resources}`);
  console.log('');
  console.log('Demo sign-ins:');
  console.log(`  candidate  aditi@talentiq.ai      ${DEMO_PASSWORD}`);
  console.log(`  recruiter  recruiter@talentiq.ai  ${DEMO_PASSWORD}`);
  console.log(`  reviewer   reviewer@talentiq.ai   ${DEMO_PASSWORD}`);
  console.log(`  admin      admin@talentiq.ai      ${DEMO_PASSWORD}`);

  await prisma.$disconnect();
  await pool.end();
};

seed().catch(async (error) => {
  console.error('Seed failed', error);
  await prisma.$disconnect().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
