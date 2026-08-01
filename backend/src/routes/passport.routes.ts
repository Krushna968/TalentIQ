import { Router } from 'express';
import * as passportController from '../controllers/passport.controller.js';
import { authenticate, requireOrganizationAccess, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireRole('RECRUITER', 'ADMIN'), requireOrganizationAccess());
router.get('/featured', passportController.getPassport);
router.post('/:candidateId/targeted-interview', passportController.queueTargetedInterview);

export default router;
