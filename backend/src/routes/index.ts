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
import privacyRoutes from './privacy.routes.js';
import healthRoutes from './health.routes.js';
import passportRoutes from './passport.routes.js';

const routes = Router();

routes.use('/', healthRoutes);
routes.use('/auth', authRoutes);
routes.use('/privacy', privacyRoutes);
routes.use('/candidates', candidateRoutes);
routes.use('/candidates', githubRoutes);
routes.use('/recruiters', recruiterRoutes);
routes.use('/passports', passportRoutes);
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
