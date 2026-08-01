import { Router } from 'express';
import * as presentationController from '../controllers/presentation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/analyze', presentationController.analyzePresentation);
router.get('/:userId/history', presentationController.getPresentationHistory);

export default router;
