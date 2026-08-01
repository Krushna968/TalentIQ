import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Local dev / tests run on SQLite (DATABASE_URL="file:..." or "libsql:..."),
// production on PostgreSQL. The schema differs only in the datasource provider;
// schema.sqlite.prisma is generated from schema.prisma by scripts/gen-sqlite-schema.mjs.
const url = process.env.DATABASE_URL ?? "";
const isSqlite = url.startsWith("file:") || url.startsWith("libsql:");

export default defineConfig({
  schema: isSqlite ? "prisma/schema.sqlite.prisma" : "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
