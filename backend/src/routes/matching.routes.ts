import { Router } from 'express';
import * as matchingController from '../controllers/matching.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/match', matchingController.matchCandidate);
router.get('/scores/:candidateId', matchingController.getMatchScores);
router.get('/recommendations', matchingController.getRecommendations);

export default router;
