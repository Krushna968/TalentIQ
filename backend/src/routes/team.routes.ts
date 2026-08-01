import { Router } from 'express';
import * as team from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/:userId', team.getTeamContributions);
router.get('/:userId/impact', team.getImpactScore);

export default router;
