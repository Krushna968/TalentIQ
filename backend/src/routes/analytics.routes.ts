import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/hiring', analyticsController.getHiringAnalytics);
router.get('/trends', analyticsController.getTrends);
router.get('/skills-gap', analyticsController.getSkillsGap);
router.get('/pipeline-metrics', analyticsController.getPipelineMetrics);

export default router;
