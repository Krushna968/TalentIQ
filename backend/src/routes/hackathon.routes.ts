import { Router } from 'express';
import * as hackathonController from '../controllers/hackathon.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/:userId', hackathonController.getHackathonProfile);
router.post('/verify', hackathonController.verifyHackathonParticipation);
router.get('/:userId/achievements', hackathonController.getAchievements);

export default router;
