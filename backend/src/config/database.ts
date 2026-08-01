import { prisma, pool } from '../lib/prisma.js';
import { env } from './env.js';

export const db = {
  url: env.DATABASE_URL,
  connect: async () => {
    await prisma.$connect();
    await pool.query('SELECT 1');
    console.log('Database connected');
  },
  disconnect: async () => {
    await prisma.$disconnect();
    console.log('Database disconnected');
  },
};

