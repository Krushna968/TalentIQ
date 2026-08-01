import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(2, 'Name must be at least 2 characters long').trim().optional().default('TalentIQ User'),
    role: z.string().toUpperCase().refine(r => ['CANDIDATE', 'RECRUITER', 'ADMIN'].includes(r), {
      message: 'Role must be CANDIDATE, RECRUITER, or ADMIN',
    }).optional().default('CANDIDATE'),
    organizationName: z.string().trim().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
    role: z.string().optional(), // optional role hint from UI
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'New password must be at least 8 characters long'),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }).optional(),
  query: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }).optional(),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
  }),
});

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2).trim().optional(),
    avatar: z.string().url().optional(),
    title: z.string().trim().optional(),
    location: z.string().trim().optional(),
    bio: z.string().trim().optional(),
  }),
});

export const privacyConsentSchema = z.object({
  body: z.object({
    consentType: z.string().min(1),
    status: z.enum(['GRANTED', 'REVOKED']),
    version: z.string().optional().default('1.0'),
  }),
});

export const privacyPreferenceSchema = z.object({
  body: z.object({
    visibility: z.enum(['PRIVATE', 'ORGANIZATION_SHARED', 'PUBLIC_PROFILE']),
  }),
});

export const candidateStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.string().min(1),
  }),
});

export const pipelineStatusSchema = z.object({
  params: z.object({
    candidateId: z.string().min(1),
  }),
  body: z.object({
    status: z.string().min(1),
  }),
});

export const compareCandidatesSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1)).min(1, 'At least one candidate ID required'),
  }),
});

// Registry mapping route schema strings to Zod schemas
export const schemaRegistry: Record<string, z.ZodSchema> = {
  register: registerSchema,
  login: loginSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  verifyEmail: verifyEmailSchema,
  resendVerification: resendVerificationSchema,
  updateMe: updateMeSchema,
  privacyConsent: privacyConsentSchema,
  privacyPreference: privacyPreferenceSchema,
  candidateStatus: candidateStatusSchema,
  pipelineStatus: pipelineStatusSchema,
  compareCandidates: compareCandidatesSchema,
};
