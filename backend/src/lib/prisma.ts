import "dotenv/config";
// Type is sourced from the canonical (PostgreSQL) generated client; both
// generated clients expose identical model types, so the runtime instance
// (which may be the SQLite client) is cast to this type for full type-safety.
import type { PrismaClient as PrismaClientType } from "../../generated/prisma/client";

const url = process.env.DATABASE_URL || "postgresql://postgres@localhost:5432/talentiq";
const isSqlite = url.startsWith("file:") || url.startsWith("libsql:");

async function createPrisma(): Promise<PrismaClientType> {
  if (isSqlite) {
    const { PrismaLibSql } = await import("@prisma/adapter-libsql");
    // Non-literal specifier so tsc does not require the generated sqlite client
    // to exist at typecheck time (it is produced by `npm run db:dev:generate`).
    const sqliteClientPath = "../../generated/prisma-sqlite/client";
    const { PrismaClient } = await import(sqliteClientPath);
    const adapter = new PrismaLibSql({ url });
    return new PrismaClient({ adapter }) as unknown as PrismaClientType;
  }
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { Pool } = await import("pg");
  const { PrismaClient } = await import("../../generated/prisma/client");
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = await createPrisma();
