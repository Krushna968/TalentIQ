import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

// Materializes the SQLite schema into a throwaway test DB before the suite runs.
// The file is deleted first (rather than using prisma's --force-reset) so the
// push is non-destructive from prisma's perspective; per-test cleanup is handled
// by resetDb(). Uses db push to avoid replaying Postgres-only migration SQL.
export default function setup() {
  for (const f of ['test.db', 'test.db-journal', 'test.db-wal', 'test.db-shm']) {
    rmSync(f, { force: true });
  }
  execSync('node scripts/gen-sqlite-schema.mjs', { stdio: 'inherit' });
  execSync('prisma db push --schema prisma/schema.sqlite.prisma', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });
}
