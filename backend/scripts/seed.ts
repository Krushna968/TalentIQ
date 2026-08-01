import "dotenv/config";
// Reuse the shared adapter-selecting client so `npm run seed` works against
// SQLite (local dev) or PostgreSQL (prod) without duplicating bootstrap logic.
import { prisma } from "../src/lib/prisma.js";

const candidates = [
  {
    id: "aditi-rao",
    name: "Aditi Rao",
    email: "aditi@talentiq.ai",
    title: "Full-Stack Engineer",
    role: "candidate",
    githubConnected: false,
    talentScore: 87,
    githubScore: 91,
    hackathonScore: 82,
    certScore: 88,
    presentationScore: 76,
    openSourceScore: 84,
    socialScore: 71,
    radarData: JSON.stringify([
      { axis: "Tech Depth", value: 90 }, { axis: "Innovation", value: 82 },
      { axis: "Leadership", value: 68 }, { axis: "Velocity", value: 88 },
      { axis: "Collab", value: 74 }, { axis: "Comms", value: 70 },
    ]),
  },
  {
    id: "elena-rodriguez",
    name: "Elena Rodriguez",
    email: "elena@talentiq.ai",
    title: "Senior Backend Engineer",
    role: "candidate",
    githubConnected: false,
    talentScore: 92,
    githubScore: 96,
    hackathonScore: 88,
    certScore: 92,
    presentationScore: 85,
    openSourceScore: 94,
    socialScore: 78,
    radarData: JSON.stringify([
      { axis: "Tech Depth", value: 96 }, { axis: "Innovation", value: 88 },
      { axis: "Leadership", value: 80 }, { axis: "Velocity", value: 92 },
      { axis: "Collab", value: 82 }, { axis: "Comms", value: 78 },
    ]),
  },
  {
    id: "david-chen",
    name: "David Chen",
    email: "david@talentiq.ai",
    title: "Systems Architect",
    role: "candidate",
    githubConnected: false,
    talentScore: 91,
    githubScore: 89,
    hackathonScore: 79,
    certScore: 95,
    presentationScore: 88,
    openSourceScore: 82,
    socialScore: 84,
    radarData: JSON.stringify([
      { axis: "Tech Depth", value: 94 }, { axis: "Innovation", value: 76 },
      { axis: "Leadership", value: 90 }, { axis: "Velocity", value: 80 },
      { axis: "Collab", value: 88 }, { axis: "Comms", value: 86 },
    ]),
  },
  {
    id: "sarah-jenkins",
    name: "Sarah Jenkins",
    email: "sarah@talentiq.ai",
    title: "Backend Engineer II",
    role: "candidate",
    githubConnected: false,
    talentScore: 83,
    githubScore: 85,
    hackathonScore: 90,
    certScore: 78,
    presentationScore: 72,
    openSourceScore: 76,
    socialScore: 80,
    radarData: JSON.stringify([
      { axis: "Tech Depth", value: 82 }, { axis: "Innovation", value: 90 },
      { axis: "Leadership", value: 72 }, { axis: "Velocity", value: 86 },
      { axis: "Collab", value: 80 }, { axis: "Comms", value: 70 },
    ]),
  },
  {
    id: "marcus-okafor",
    name: "Marcus Okafor",
    email: "marcus@talentiq.ai",
    title: "ML Engineer",
    role: "candidate",
    githubConnected: false,
    talentScore: 89,
    githubScore: 88,
    hackathonScore: 86,
    certScore: 91,
    presentationScore: 93,
    openSourceScore: 90,
    socialScore: 87,
    radarData: JSON.stringify([
      { axis: "Tech Depth", value: 88 }, { axis: "Innovation", value: 94 },
      { axis: "Leadership", value: 82 }, { axis: "Velocity", value: 84 },
      { axis: "Collab", value: 90 }, { axis: "Comms", value: 92 },
    ]),
  },
];

const seed = async () => {
  console.log("Seeding database...");

  for (const candidate of candidates) {
    await prisma.candidate.upsert({
      where: { id: candidate.id },
      create: candidate,
      // Initial profile records are safe to run repeatedly. Never replace a
      // candidate's live identity, verified evidence, or calculated scores.
      update: {},
    });
  }

  console.log(`Seeded ${candidates.length} candidates`);

  // --- Owner 3: recruiter operations demo tenant ---------------------------
  // Ids match the auth-stub defaults (DEMO_ORG_ID / DEMO_USER_ID) so local dev
  // works with no headers. All upserts are idempotent.
  const ORG_ID = "demo-org";
  const USER_ID = "demo-user";
  const JOB_ID = "demo-job";
  const DEFAULT_STAGES = [
    { name: "Discovered", order: 0, isTerminal: false },
    { name: "Screened", order: 1, isTerminal: false },
    { name: "Interviewing", order: 2, isTerminal: false },
    { name: "Offered", order: 3, isTerminal: false },
    { name: "Hired", order: 4, isTerminal: true },
    { name: "Rejected", order: 5, isTerminal: true },
  ];

  await prisma.organization.upsert({
    where: { id: ORG_ID },
    create: { id: ORG_ID, name: "TalentIQ Demo Co", slug: "demo" },
    update: {},
  });
  await prisma.membership.upsert({
    where: { orgId_userId: { orgId: ORG_ID, userId: USER_ID } },
    create: { orgId: ORG_ID, userId: USER_ID, email: "demo@talentiq.ai", name: "Demo Recruiter", role: "owner" },
    update: {},
  });
  await prisma.job.upsert({
    where: { id: JOB_ID },
    create: {
      id: JOB_ID, orgId: ORG_ID, title: "Senior Backend Engineer",
      department: "Engineering", location: "Remote", employmentType: "full_time",
      status: "open", visibility: "org", createdById: USER_ID,
    },
    update: {},
  });
  await prisma.jobCollaborator.upsert({
    where: { jobId_userId: { jobId: JOB_ID, userId: USER_ID } },
    create: { jobId: JOB_ID, userId: USER_ID, role: "owner" },
    update: {},
  });
  if ((await prisma.pipelineStage.count({ where: { jobId: JOB_ID } })) === 0) {
    await prisma.pipelineStage.createMany({ data: DEFAULT_STAGES.map((s) => ({ ...s, jobId: JOB_ID })) });
  }
  const firstStage = await prisma.pipelineStage.findFirst({ where: { jobId: JOB_ID }, orderBy: { order: "asc" } });
  if (firstStage) {
    for (const candidateId of ["elena-rodriguez", "david-chen"]) {
      const existing = await prisma.pipelineEntry.findUnique({
        where: { jobId_candidateId: { jobId: JOB_ID, candidateId } },
      });
      if (!existing) {
        const entry = await prisma.pipelineEntry.create({
          data: { jobId: JOB_ID, candidateId, currentStageId: firstStage.id, addedById: USER_ID },
        });
        await prisma.pipelineEvent.create({
          data: { entryId: entry.id, type: "added", toStageId: firstStage.id, actorId: USER_ID, actorName: "Demo Recruiter" },
        });
      }
    }
  }
  console.log("Seeded demo org, requisition, stages, and pipeline entries");

  await prisma.$disconnect();
};

seed().catch((err) => {
  console.error("Seed failed", err);
  process.exit(1);
});
