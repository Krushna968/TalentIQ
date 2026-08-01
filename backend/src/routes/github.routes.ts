import { Router } from 'express';
import * as githubController from '../controllers/github.controller.js';
import * as talentScoreController from '../controllers/talent-score.controller.js';
import * as linkedInController from '../controllers/linkedin.controller.js';

const router = Router();

router.get('/:candidateId/github/check', githubController.checkConnection);
router.get('/:candidateId/github/profile', githubController.getProfile);
router.post('/:candidateId/github/sync', githubController.triggerSync);
router.delete('/:candidateId/github', githubController.disconnect);
router.get('/:candidateId/talent-score', talentScoreController.getTalentScore);
router.get('/:candidateId/linkedin/check', linkedInController.getConnection);

export default router;
