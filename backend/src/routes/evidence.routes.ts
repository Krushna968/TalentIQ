import { Router } from 'express';
import * as evidenceController from '../controllers/evidence.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.get('/', evidenceController.list);
router.post('/', evidenceController.submit);
router.put('/:evidenceId/review', authenticate, authorize('admin'), evidenceController.review);

export default router;
