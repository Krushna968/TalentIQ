import { Router } from 'express';
import * as candidateController from '../controllers/candidate.controller.js';
import { authenticate, requireOwnership } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', candidateController.getAllCandidates);
router.get('/dashboard', candidateController.getDashboard);
router.get('/profile', candidateController.getProfile);
router.put('/profile', candidateController.updateProfile);
router.get('/roadmap', candidateController.getRoadmap);
router.put('/roadmap', candidateController.updateRoadmap);
router.get('/resume-builder', candidateController.getResume);
router.post('/resume-builder/generate', candidateController.generateResume);
router.get('/jobs', candidateController.getJobRecommendations);
router.put('/jobs/:id/apply', candidateController.applyToJob);

router.get('/:id', candidateController.getCandidateById);
router.patch('/:id/status', requireOwnership('id'), validate('candidateStatus'), candidateController.updateStatus);

export default router;

