import { Router } from 'express';
import * as analytics from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate, authorize('recruiter', 'admin'));

router.get('/hiring', analytics.getHiringAnalytics);
router.get('/trends', analytics.getTrends);
router.get('/skills-gap', analytics.getSkillsGap);
router.get('/pipeline-metrics', analytics.getPipelineMetrics);
router.get('/skill-graph', analytics.getSkillGraph);

export default router;
