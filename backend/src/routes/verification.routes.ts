import { Router } from 'express';
import * as verification from '../controllers/verification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/github', verification.verifyGithub);
router.post('/certification', verification.verifyCertification);
router.post('/hackathon', verification.verifyHackathon);
router.post('/presentation', verification.verifyPresentation);
router.post('/all', verification.verifyAll);

router.get('/badges', verification.getBadges);
router.get('/status/:id', verification.getVerificationStatus);
router.get('/authenticity/:id', verification.getAuthenticityReport);

export default router;
