import { Router } from 'express';
import * as recruiterController from '../controllers/recruiter.controller.js';
import { authenticate, requireRole, requireOrganizationAccess } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

router.use(authenticate, requireRole('RECRUITER', 'ADMIN'), requireOrganizationAccess());

router.get('/search', recruiterController.searchCandidates);
router.get('/pipeline', recruiterController.getPipeline);
router.put('/pipeline/:candidateId', validate('pipelineStatus'), recruiterController.updatePipelineStatus);
router.post('/compare', validate('compareCandidates'), recruiterController.compareCandidates);

export default router;

