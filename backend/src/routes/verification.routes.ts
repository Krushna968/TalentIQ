import { Router } from 'express';
import * as verificationController from '../controllers/verification.controller.js';

const router = Router();

router.post('/github', verificationController.verifyGithub);
router.post('/certification', verificationController.verifyCertification);
router.post('/hackathon', verificationController.verifyHackathon);
router.post('/presentation', verificationController.verifyPresentation);
router.get('/status/:id', verificationController.getVerificationStatus);
router.get('/badges', verificationController.getBadges);

export default router;
