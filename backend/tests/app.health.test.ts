import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = await new Promise<Server>((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('operational endpoints', () => {
  it('reports process liveness without requiring a database query', async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });

  it('reports ready when the database responds', async () => {
    vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([]);

    const response = await fetch(`${baseUrl}/ready`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ready' });
  });

  it('reports unavailable when the database query fails', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('database unavailable'));

    const response = await fetch(`${baseUrl}/ready`);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: 'unavailable' });
  });
});
