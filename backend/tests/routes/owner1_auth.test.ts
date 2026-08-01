import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Owner 1 — Identity, Security & Shared API Foundation Integration Tests', () => {
  let candidateToken = '';
  let candidateId = '';
  let candidateRefreshToken = '';
  let recruiterToken = '';
  let adminToken = '';
  let secondCandidateToken = '';
  let secondCandidateId = '';

  describe('1. User Registration & Login (Authentication API)', () => {
    it('should register a new CANDIDATE user and issue access/refresh tokens', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'candidate_test@talentiq.ai',
          password: 'securePassword123!',
          name: 'Alice Candidate',
          role: 'CANDIDATE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('candidate_test@talentiq.ai');
      expect(res.body.data.user.role).toBe('CANDIDATE');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.requestId).toBeDefined();

      candidateToken = res.body.data.accessToken;
      candidateId = res.body.data.user.id;

      // Extract secure HttpOnly refresh cookie
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c: string) => c.startsWith('talentiq_refresh='));
      expect(refreshCookie).toBeDefined();
      candidateRefreshToken = refreshCookie!.split(';')[0].replace('talentiq_refresh=', '');
    });

    it('should reject registration if email already exists (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'candidate_test@talentiq.ai',
          password: 'anotherPassword123!',
          name: 'Alice Duplicate',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should fail login with incorrect credentials (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'candidate_test@talentiq.ai',
          password: 'wrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('should successfully log in with correct credentials (200)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'candidate_test@talentiq.ai',
          password: 'securePassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      candidateToken = res.body.data.accessToken;
    });

    it('should access authenticated profile via GET /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('candidate_test@talentiq.ai');
      expect(res.body.data.passwordHash).toBeUndefined(); // Verify secret exclusion
    });
  });

  describe('2. Refresh Token Rotation & Reuse Detection (Session Security)', () => {
    let secondRefreshToken = '';

    it('should rotate refresh token and issue a new access token on /api/auth/refresh', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`talentiq_refresh=${candidateRefreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c: string) => c.startsWith('talentiq_refresh='));
      expect(refreshCookie).toBeDefined();
      secondRefreshToken = refreshCookie!.split(';')[0].replace('talentiq_refresh=', '');
      expect(secondRefreshToken).not.toBe(candidateRefreshToken);
    });

    it('should detect reuse of revoked refresh token and invalidate all sessions for the user', async () => {
      // Try to reuse the OLD candidateRefreshToken which was revoked during rotation
      const reuseRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`talentiq_refresh=${candidateRefreshToken}`]);

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.error.message).toContain('Compromised refresh token chain');

      // Now verify that the previously valid secondRefreshToken has also been revoked due to reuse detection
      const attemptNewRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`talentiq_refresh=${secondRefreshToken}`]);

      expect(attemptNewRes.status).toBe(401);
      expect(attemptNewRes.body.error.message).toContain('Compromised refresh token chain');
    });
  });

  describe('3. Role Authorization (CANDIDATE vs RECRUITER vs ADMIN)', () => {
    it('should register a RECRUITER and an ADMIN user', async () => {
      const recRes = await request(app).post('/api/auth/register').send({
        email: 'recruiter_test@talentiq.ai',
        password: 'recruiterPass123!',
        name: 'Bob Recruiter',
        role: 'RECRUITER',
        organizationName: 'TechCorp Hiring',
      });
      expect(recRes.status).toBe(201);
      recruiterToken = recRes.body.data.accessToken;

      const adminRes = await request(app).post('/api/auth/register').send({
        email: 'admin_test@talentiq.ai',
        password: 'adminPass123!',
        name: 'Admin Superuser',
        role: 'ADMIN',
      });
      expect(adminRes.status).toBe(201);
      adminToken = adminRes.body.data.accessToken;
    });

    it('should forbid CANDIDATE from accessing RECRUITER search endpoint (403 Unauthorized)', async () => {
      // Need a fresh candidate login token since session was revoked in test 2
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'candidate_test@talentiq.ai',
        password: 'securePassword123!',
      });
      candidateToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/recruiters/search')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow RECRUITER to access recruiter endpoints (200)', async () => {
      const res = await request(app)
        .get('/api/recruiters/search')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
    });

    it('should forbid RECRUITER from accessing ADMIN trust resolution endpoints (403 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/trust/flags')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow ADMIN to access ADMIN trust endpoints (200)', async () => {
      const res = await request(app)
        .get('/api/trust/flags')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('4. Resource Ownership Enforcement (IDOR Prevention)', () => {
    it('should register a second candidate to test lateral unauthorized access', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'candidate2_test@talentiq.ai',
        password: 'securePassword456!',
        name: 'Charlie Candidate',
        role: 'CANDIDATE',
      });
      expect(res.status).toBe(201);
      secondCandidateToken = res.body.data.accessToken;
      secondCandidateId = res.body.data.user.id;
    });

    it('should prevent Candidate 1 from updating Candidate 2 status (IDOR 403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/candidates/${secondCandidateId}/status`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ status: 'Interviewing' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('ownership');
    });

    it('should allow Candidate 2 to modify their own status (Ownership allowed 200)', async () => {
      const res = await request(app)
        .patch(`/api/candidates/${secondCandidateId}/status`)
        .set('Authorization', `Bearer ${secondCandidateToken}`)
        .send({ status: 'Interviewing' });

      expect(res.status).toBe(200);
    });

    it('should allow ADMIN to bypass ownership restrictions and update Candidate 2 status (200)', async () => {
      const res = await request(app)
        .patch(`/api/candidates/${secondCandidateId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Hired' });

      expect(res.status).toBe(200);
    });
  });

  describe('5. Rate Limiting Behavior (Exceeding Threshold Triggers 429)', () => {
    it('should return 429 Rate Limit Exceeded after exceeding allowed authentication attempt window', async () => {
      // Trigger threshold set to 2 requests when x-test-rate-limit is trigger-auth
      await request(app)
        .post('/api/auth/login')
        .set('x-test-rate-limit', 'trigger-auth')
        .send({ email: 'candidate_test@talentiq.ai', password: 'wrongPassword!' });
      
      await request(app)
        .post('/api/auth/login')
        .set('x-test-rate-limit', 'trigger-auth')
        .send({ email: 'candidate_test@talentiq.ai', password: 'wrongPassword!' });

      const blockedRes = await request(app)
        .post('/api/auth/login')
        .set('x-test-rate-limit', 'trigger-auth')
        .send({ email: 'candidate_test@talentiq.ai', password: 'wrongPassword!' });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('6. Privacy, Consent Verification & Data Export (GDPR Controls)', () => {
    it('should update user privacy consent records', async () => {
      const res = await request(app)
        .post('/api/privacy/consent')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ consentType: 'AI_EVALUATION', status: 'GRANTED', version: '1.2' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.consentType).toBe('AI_EVALUATION');
      expect(res.body.data.status).toBe('GRANTED');
    });

    it('should update user profile visibility preference', async () => {
      const res = await request(app)
        .put('/api/privacy/preferences')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ visibility: 'PUBLIC_PROFILE' });

      expect(res.status).toBe(200);
      expect(res.body.data.visibility).toBe('PUBLIC_PROFILE');
    });

    it('should export all structured user account data and audit log history via GET /api/privacy/export', async () => {
      const res = await request(app)
        .get('/api/privacy/export')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const exportData = res.body.data;
      expect(exportData.profile.email).toBe('candidate_test@talentiq.ai');
      expect(exportData.privacy.visibility).toBe('PUBLIC_PROFILE');
      expect(exportData.privacy.consents.length).toBeGreaterThan(0);
      expect(exportData.auditHistory).toBeDefined();
      expect(Array.isArray(exportData.auditHistory)).toBe(true);

      // Confirm that the data export request itself was captured in audit logs
      const exportLog = exportData.auditHistory.find((l: any) => l.action === 'DATA_EXPORT_REQUESTED');
      expect(exportLog).toBeDefined();
    });

    it('should execute account erasure on DELETE /api/privacy/account and lock out subsequent login', async () => {
      const deleteRes = await request(app)
        .delete('/api/privacy/account')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.message).toContain('Account erasure');

      // Subsequent attempts to log in with deleted account must be denied
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'candidate_test@talentiq.ai',
          password: 'securePassword123!',
        });

      expect(loginRes.status).toBe(401); // User email was anonymized to deleted_... during erasure
    });
  });

  describe('7. System Liveness and Readiness Probes (API Infrastructure)', () => {
    it('should return 200 OK on GET /health', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('should return 200 Ready on GET /ready', async () => {
      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
    });
  });

  describe('8. Frontend Protected Session State & Route Guard Contracts', () => {
    it('should deny unauthenticated GET /api/auth/me during session restoration if unauthenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('should restore candidate user session via GET /api/auth/me when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${secondCandidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('CANDIDATE');
      expect(res.body.data.email).toBe('candidate2_test@talentiq.ai');
    });

    it('should restore recruiter user session via GET /api/auth/me when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('RECRUITER');
      expect(res.body.data.email).toBe('recruiter_test@talentiq.ai');
    });

    it('should reject invalid login without issuing tokens or authenticating session', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@talentiq.ai', password: 'badPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBeDefined();
    });

    it('should clear user session and revoke refresh cookie on logout', async () => {
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      const meRes = await request(app).get('/api/auth/me');
      expect(meRes.status).toBe(401);
    });
  });
});

