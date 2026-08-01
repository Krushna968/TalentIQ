import { Router } from 'express';
import * as githubController from '../controllers/github.controller.js';
import * as talentScoreController from '../controllers/talent-score.controller.js';
import * as linkedInController from '../controllers/linkedin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

/**
 * Candidate-scoped provider and scoring routes. Every handler resolves the
 * candidate through the auth middleware, so a candidate id in the path is only
 * honoured for callers permitted to use it.
 */
const router = Router();
router.use(authenticate);

router.get('/:candidateId/github/check', githubController.checkConnection);
router.get('/:candidateId/github/profile', githubController.getProfile);
router.post('/:candidateId/github/sync', githubController.triggerSync);
router.delete('/:candidateId/github', githubController.disconnect);

router.get('/:candidateId/linkedin/check', linkedInController.getConnection);

router.get('/:candidateId/talent-score', talentScoreController.getTalentScore);
router.post('/:candidateId/talent-score/recalculate', talentScoreController.recalculate);
router.get('/:candidateId/agents', talentScoreController.getAgentRuns);
router.post('/:candidateId/agents/run', talentScoreController.runAgentFleet);
router.get('/:candidateId/timeline', talentScoreController.getTimeline);
router.get('/:candidateId/similar', talentScoreController.getSimilar);

export default router;
