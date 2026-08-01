import { Router } from 'express';
import * as recruiterController from '../controllers/recruiter.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireOrg } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireOrg);

// Pipeline endpoints moved to /api/requisitions/:jobId/pipeline and /api/pipeline.
router.get('/search', recruiterController.searchCandidates);
router.post('/compare', recruiterController.compareCandidates);

export default router;
