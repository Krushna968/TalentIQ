import { env } from './env.js';

export const db = {
  url: env.DATABASE_URL,
  connect: async () => {},
  disconnect: async () => {},
};
