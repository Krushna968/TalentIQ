import { Router } from 'express';
import * as c from '../controllers/candidate.controller.js';
import * as talentScore from '../controllers/talent-score.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', c.getDashboard);
router.get('/profile', c.getProfile);
router.put('/profile', c.updateProfile);

router.get('/roadmap', c.getRoadmap);
router.post('/roadmap', c.createRoadmap);
router.patch('/roadmap/:roadmapId', c.updateRoadmap);
router.delete('/roadmap/:roadmapId', c.deleteRoadmap);

router.get('/resume-builder', c.getResume);
router.post('/resume-builder', c.saveResume);
router.post('/resume-builder/generate', c.generateResume);
router.get('/portfolio', c.getPortfolio);

router.get('/jobs', c.getJobRecommendations);
router.put('/jobs/:id/apply', c.applyToJob);

router.get('/salary', c.getSalaryPrediction);
router.get('/learning', c.getLearningRecommendations);
router.get('/badges', c.getBadges);

// Scoring for the signed-in candidate, without needing their id in the path.
router.get('/me/talent-score', talentScore.getTalentScore);
router.post('/me/talent-score/recalculate', talentScore.recalculate);
router.get('/me/agents', talentScore.getAgentRuns);
router.get('/me/timeline', talentScore.getTimeline);

export default router;
