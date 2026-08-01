import { Router } from 'express';
import authRoutes from './auth.routes.js';
import candidateRoutes from './candidate.routes.js';
import recruiterRoutes from './recruiter.routes.js';
import verificationRoutes from './verification.routes.js';
import matchingRoutes from './matching.routes.js';
import analyticsRoutes from './analytics.routes.js';
import interviewRoutes from './interview.routes.js';
import reportRoutes from './report.routes.js';
import teamRoutes from './team.routes.js';
import presentationRoutes from './presentation.routes.js';
import hackathonRoutes from './hackathon.routes.js';
import trustRoutes from './trust.routes.js';
import githubRoutes from './github.routes.js';
import evidenceRoutes from './evidence.routes.js';
import organizationRoutes from './organization.routes.js';
import jobRoutes from './job.routes.js';
import pipelineRoutes from './pipeline.routes.js';

const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/candidates', candidateRoutes);
routes.use('/candidates', githubRoutes);
routes.use('/candidates/:candidateId/evidence', evidenceRoutes);
routes.use('/evidence', evidenceRoutes);
routes.use('/recruiters', recruiterRoutes);
// Owner 3 — recruiter operations
routes.use('/orgs', organizationRoutes);
routes.use('/requisitions', jobRoutes);
routes.use('/pipeline', pipelineRoutes);
routes.use('/verification', verificationRoutes);
routes.use('/matching', matchingRoutes);
routes.use('/analytics', analyticsRoutes);
routes.use('/interviews', interviewRoutes);
routes.use('/reports', reportRoutes);
routes.use('/team-contributions', teamRoutes);
routes.use('/presentations', presentationRoutes);
routes.use('/hackathons', hackathonRoutes);
routes.use('/trust', trustRoutes);

export { routes };

