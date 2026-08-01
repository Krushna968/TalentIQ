import { Router } from 'express';
import * as presentation from '../controllers/presentation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/analyze', validate('analyzePresentation'), presentation.analyzePresentation);
router.get('/:userId/history', presentation.getPresentationHistory);

export default router;
