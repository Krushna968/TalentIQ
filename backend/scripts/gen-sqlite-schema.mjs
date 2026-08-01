// Generates prisma/schema.sqlite.prisma from the canonical prisma/schema.prisma
// by swapping only the datasource provider and the generator output directory.
// Models are a single source of truth in schema.prisma — never hand-edit the
// generated sqlite variant. Used for zero-config local dev / tests on SQLite,
// while schema.prisma + migrations remain the PostgreSQL source for production.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const canonicalPath = join(here, "..", "prisma", "schema.prisma");
const sqlitePath = join(here, "..", "prisma", "schema.sqlite.prisma");

const canonical = readFileSync(canonicalPath, "utf8");

const sqlite = canonical
  .replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"')
  .replace(/output\s*=\s*"\.\.\/generated\/prisma"/g, 'output   = "../generated/prisma-sqlite"');

const banner =
  "// AUTO-GENERATED from schema.prisma by scripts/gen-sqlite-schema.mjs — do not edit.\n\n";

writeFileSync(sqlitePath, banner + sqlite, "utf8");
console.log("Wrote prisma/schema.sqlite.prisma (sqlite provider, output generated/prisma-sqlite)");
