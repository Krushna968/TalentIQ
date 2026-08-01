import 'dotenv/config';
import { db } from './config/database.js';
import { addRecurringJobs, closeQueueConnections } from './jobs/queue.js';
import { startBackgroundWorker } from './jobs/worker.js';

const start = async () => {
  await db.connect();
  await addRecurringJobs();
  const worker = startBackgroundWorker();
  console.log('TalentIQ background worker started');

  const stop = async () => {
    await worker.close();
    await closeQueueConnections();
    await db.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
};

start().catch((error) => {
  console.error('Failed to start background worker', error);
  process.exit(1);
});