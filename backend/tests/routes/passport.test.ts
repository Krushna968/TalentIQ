import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Proof-to-Hire Passport API', () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  it('protects the Passport from unauthenticated and candidate access', async () => {
    const unauthenticated = await request(app).get('/api/passports/featured');
    expect(unauthenticated.status).toBe(401);

    const registration = await request(app).post('/api/auth/register').send({
      email: `passport-candidate-${suffix}@talentiq.test`, password: 'SecurePassword123!', name: 'Passport Candidate', role: 'CANDIDATE',
    });
    const candidateAccess = await request(app).get('/api/passports/featured').set('Authorization', `Bearer ${registration.body.data.accessToken}`);
    expect(candidateAccess.status).toBe(403);
  });

  it('returns an explainable, complete Passport to an organization recruiter and queues evaluation', async () => {
    const registration = await request(app).post('/api/auth/register').send({
      email: `passport-recruiter-${suffix}@talentiq.test`, password: 'SecurePassword123!', name: 'Passport Recruiter', role: 'RECRUITER', organizationName: 'Passport Test Org',
    });
    expect(registration.status).toBe(201);
    const token = registration.body.data.accessToken;

    const response = await request(app).get('/api/passports/featured').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.metrics.readiness).toBeGreaterThan(0);
    expect(response.body.data.evidence).toHaveLength(5);
    expect(response.body.data.competencyResults).toHaveLength(5);
    expect(response.body.data.nextBestEvaluation.prompt).toBeTruthy();

    const queueResponse = await request(app).post('/api/passports/aarav-mehta/targeted-interview').set('Authorization', `Bearer ${token}`);
    expect(queueResponse.status).toBe(202);
    expect(queueResponse.body.data.status).toBe('queued');
  });
});
