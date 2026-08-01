import { Router } from 'express';
import * as hackathon from '../controllers/hackathon.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/leaderboard', authorize('recruiter', 'reviewer', 'admin'), hackathon.getTopPerformers);
router.post('/verify', hackathon.verifyHackathonParticipation);
router.get('/:userId', hackathon.getHackathonProfile);
router.get('/:userId/achievements', hackathon.getAchievements);

export default router;
