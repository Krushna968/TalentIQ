import { Router } from 'express';
import * as trustController from '../controllers/trust.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/flags', authorize('admin'), trustController.getFraudFlags);
router.post('/report', trustController.reportFraud);
router.put('/flags/:id/resolve', authorize('admin'), trustController.resolveFlag);
router.get('/score/:userId', trustController.getTrustScore);

export default router;
