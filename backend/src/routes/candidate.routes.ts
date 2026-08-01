import { Router } from 'express';
import * as c from '../controllers/candidate.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
const router=Router();router.use(authenticate);
router.get('/',c.getDashboard);router.get('/profile',c.getProfile);router.put('/profile',c.updateProfile);
router.get('/roadmap',c.getRoadmap);router.post('/roadmap',c.createRoadmap);router.patch('/roadmap/:roadmapId',c.updateRoadmap);router.delete('/roadmap/:roadmapId',c.deleteRoadmap);
router.get('/resume-builder',c.getResume);router.post('/resume-builder',c.saveResume);
router.get('/jobs',c.getJobRecommendations);router.put('/jobs/:id/apply',c.applyToJob);
export default router;
