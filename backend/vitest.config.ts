import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Recruiter-operations tests run against a dedicated SQLite file so real
    // Prisma queries and tenant filters are exercised end-to-end.
    env: { DATABASE_URL: 'file:./test.db' },
    globalSetup: './tests/setup/globalSetup.ts',
    fileParallelism: false, // single shared sqlite file across test files
    include: ['tests/**/*.test.ts'],
  },
});
