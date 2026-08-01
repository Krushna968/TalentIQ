import { Router } from 'express';
import * as teamController from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/:userId', teamController.getTeamContributions);
router.get('/:userId/impact', teamController.getImpactScore);

export default router;
