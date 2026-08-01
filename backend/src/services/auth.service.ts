import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import type { AuthPrincipal, Role } from '../types/index.js';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const BCRYPT_ROUNDS = 12;

export class AuthError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = 'AuthError';
  }
}

type DbRole = 'CANDIDATE' | 'RECRUITER' | 'REVIEWER' | 'ADMIN';

export const toRole = (value: DbRole | string): Role => String(value).toLowerCase() as Role;
export const toDbRole = (value: string): DbRole => String(value).toUpperCase() as DbRole;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Email is the login identifier, so it is always compared in one canonical form. */
const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();

export function validatePassword(password: string) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new AuthError('Password must be at least 8 characters');
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new AuthError('Password must contain at least one letter and one number');
  }
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  mobile?: string;
  education?: string;
  experienceYears?: number;
  title?: string;
  location?: string;
  company?: string;
}

type UserWithRelations = {
  id: string;
  email: string;
  name: string;
  role: string;
  candidateId: string | null;
  recruiter: { id: string } | null;
};

export function toPrincipal(user: UserWithRelations): AuthPrincipal {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: toRole(user.role),
    ...(user.candidateId ? { candidateId: user.candidateId } : {}),
    ...(user.recruiter ? { recruiterId: user.recruiter.id } : {}),
  };
}

export function signAccessToken(principal: AuthPrincipal) {
  return jwt.sign(
    {
      sub: principal.id,
      email: principal.email,
      name: principal.name,
      role: principal.role,
      candidateId: principal.candidateId,
      recruiterId: principal.recruiterId,
    },
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL_SECONDS, issuer: 'talentiq' },
  );
}

export function verifyAccessToken(token: string): AuthPrincipal {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { issuer: 'talentiq' }) as jwt.JwtPayload;
  } catch {
    throw new AuthError('Invalid or expired session', 401);
  }
  if (!payload.sub) throw new AuthError('Invalid session token', 401);
  return {
    id: String(payload.sub),
    email: String(payload.email || ''),
    name: String(payload.name || ''),
    role: toRole(String(payload.role || 'candidate')),
    ...(payload.candidateId ? { candidateId: String(payload.candidateId) } : {}),
    ...(payload.recruiterId ? { recruiterId: String(payload.recruiterId) } : {}),
  };
}

async function issueRefreshToken(userId: string) {
  const token = randomBytes(48).toString('hex');
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) },
  });
  return token;
}

async function session(user: UserWithRelations) {
  const principal = toPrincipal(user);
  const accessToken = signAccessToken(principal);
  const refreshToken = await issueRefreshToken(user.id);
  return { user: principal, token: accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

/**
 * Creates the user plus the role-specific profile. Candidates always receive a
 * Candidate record so evidence and scoring have somewhere to land immediately.
 */
export async function register(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  if (!email.includes('@')) throw new AuthError('A valid email address is required');
  if (!input.name?.trim()) throw new AuthError('Name is required');
  validatePassword(input.password);

  // Elevated roles are never self-service.
  const role: DbRole = toDbRole(input.role || 'CANDIDATE') === 'RECRUITER' ? 'RECRUITER' : 'CANDIDATE';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AuthError('An account with that email already exists', 409);

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const name = input.name.trim();

  const user = await prisma.$transaction(async (tx) => {
    let candidateId: string | null = null;

    if (role === 'CANDIDATE') {
      const existingCandidate = await tx.candidate.findUnique({ where: { email } });
      const candidate = existingCandidate
        ? existingCandidate
        : await tx.candidate.create({
            data: {
              name,
              email,
              title: input.title?.trim() || null,
              location: input.location?.trim() || null,
              role: 'candidate',
            },
          });
      candidateId = candidate.id;
    }

    const created = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        mobile: input.mobile?.trim() || null,
        education: input.education?.trim() || null,
        experienceYears: Number.isFinite(Number(input.experienceYears)) ? Number(input.experienceYears) : null,
        candidateId,
      },
    });

    if (role === 'RECRUITER') {
      let companyId: string | null = null;
      if (input.company?.trim()) {
        const companyName = input.company.trim();
        const company = await tx.company.upsert({ where: { name: companyName }, create: { name: companyName }, update: {} });
        companyId = company.id;
      }
      await tx.recruiterProfile.create({ data: { userId: created.id, companyId, title: input.title?.trim() || null } });
    }

    return tx.user.findUniqueOrThrow({
      where: { id: created.id },
      select: { id: true, email: true, name: true, role: true, candidateId: true, recruiter: { select: { id: true } } },
    });
  });

  return session(user);
}

export async function login(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, email: true, name: true, role: true, candidateId: true, passwordHash: true, isActive: true,
      recruiter: { select: { id: true } },
    },
  });

  // Always run a comparison so a missing account and a wrong password take a
  // comparable amount of time.
  const hash = user?.passwordHash || '$2a$12$0000000000000000000000.0000000000000000000000000000000000';
  const ok = await bcrypt.compare(String(password || ''), hash).catch(() => false);
  if (!user || !ok) throw new AuthError('Incorrect email or password', 401);
  if (!user.isActive) throw new AuthError('This account has been disabled', 403);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return session(user);
}

export async function refresh(refreshToken: string) {
  if (!refreshToken) throw new AuthError('A refresh token is required', 401);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: {
      user: {
        select: { id: true, email: true, name: true, role: true, candidateId: true, isActive: true, recruiter: { select: { id: true } } },
      },
    },
  });
  if (!record || record.revokedAt || record.expiresAt.getTime() < Date.now()) {
    throw new AuthError('Session expired, please sign in again', 401);
  }
  if (!record.user.isActive) throw new AuthError('This account has been disabled', 403);

  // Single-use rotation: the presented token is retired as the new one is issued.
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  return session(record.user);
}

export async function logout(refreshToken?: string, userId?: string) {
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return;
  }
  if (userId) {
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, role: true, mobile: true, education: true,
      experienceYears: true, lastLoginAt: true, createdAt: true, candidateId: true,
      candidate: { select: { id: true, title: true, location: true, bio: true, avatar: true, talentScore: true } },
      recruiter: { select: { id: true, title: true, phone: true, company: true } },
    },
  });
  if (!user) throw new AuthError('Account not found', 404);
  return { ...user, role: toRole(user.role) };
}

export async function updateProfile(userId: string, input: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  if (typeof input.name === 'string' && input.name.trim()) data.name = input.name.trim();
  if (typeof input.mobile === 'string') data.mobile = input.mobile.trim() || null;
  if (typeof input.education === 'string') data.education = input.education.trim() || null;
  if (input.experienceYears !== undefined) {
    const years = Number(input.experienceYears);
    data.experienceYears = Number.isFinite(years) ? years : null;
  }

  if (typeof input.password === 'string' && input.password) {
    validatePassword(input.password);
    data.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    // Changing the password ends every other session.
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  await prisma.user.update({ where: { id: userId }, data });
  return getProfile(userId);
}

/** Removes refresh tokens that expired, or that were revoked more than a week ago. */
export async function pruneRefreshTokens(now = new Date()) {
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const result = await prisma.refreshToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: cutoff } }] },
  });
  return result.count;
}
