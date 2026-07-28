import "dotenv/config";
import app from './app.js';
import { env } from './config/env.js';
import { db } from './config/database.js';

const start = async () => {
  await db.connect();

  app.listen(env.PORT, () => {
    console.log(`TalentIQ API running on port ${env.PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.disconnect();
  process.exit(0);
});
