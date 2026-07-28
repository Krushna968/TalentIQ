import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres@localhost:5432/talentiq",
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
      update: candidate,
    });
  }

  console.log(`Seeded ${candidates.length} candidates`);
  await prisma.$disconnect();
  await pool.end();
};

seed().catch((err) => {
  console.error("Seed failed", err);
  process.exit(1);
});