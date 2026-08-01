import { Router } from 'express';
import * as trust from '../controllers/trust.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/flags', authorize('recruiter', 'reviewer', 'admin'), trust.getFraudFlags);
router.post('/report', validate('reportFraud'), trust.reportFraud);
router.put('/flags/:id/resolve', authorize('reviewer', 'admin'), trust.resolveFlag);
router.get('/score/:userId', trust.getTrustScore);
router.post('/score/:userId/rescan', trust.rescan);

export default router;
