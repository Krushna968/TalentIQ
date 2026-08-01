import { Router } from 'express';
import * as matching from '../controllers/matching.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/match', authorize('recruiter', 'admin'), validate('matchRequest'), matching.matchCandidate);
router.post('/copilot', authorize('recruiter', 'admin'), validate('copilotSearch'), matching.copilotSearch);
router.get('/scores/:candidateId', matching.getMatchScores);
router.get('/recommendations', matching.getRecommendations);

export default router;
