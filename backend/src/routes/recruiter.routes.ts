import { Router } from 'express';
import * as recruiterController from '../controllers/recruiter.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/search', recruiterController.searchCandidates);
router.get('/pipeline', recruiterController.getPipeline);
router.put('/pipeline/:candidateId', recruiterController.updatePipelineStatus);
router.post('/compare', recruiterController.compareCandidates);

export default router;
