import { Router } from 'express';
import * as githubController from '../controllers/github.controller.js';

const router = Router();

router.get('/:candidateId/github/check', githubController.checkConnection);
router.get('/:candidateId/github/profile', githubController.getProfile);
router.post('/:candidateId/github/sync', githubController.triggerSync);

export default router;