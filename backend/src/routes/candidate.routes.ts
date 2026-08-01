import { Router } from 'express';
import * as candidateController from '../controllers/candidate.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', candidateController.getDashboard);
router.get('/profile', candidateController.getProfile);
router.put('/profile', candidateController.updateProfile);
router.get('/roadmap', candidateController.getRoadmap);
router.put('/roadmap', candidateController.updateRoadmap);
router.get('/resume-builder', candidateController.getResume);
router.post('/resume-builder/generate', candidateController.generateResume);
router.get('/jobs', candidateController.getJobRecommendations);
router.put('/jobs/:id/apply', candidateController.applyToJob);

export default router;
