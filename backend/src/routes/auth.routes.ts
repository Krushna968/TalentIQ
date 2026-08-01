import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as githubController from '../controllers/github.controller.js';
import * as linkedInController from '../controllers/linkedin.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', validate('register'), authController.register);
router.post('/login', validate('login'), authController.login);
router.post('/logout', optionalAuthenticate, authController.logout);
router.post('/refresh', validate('refresh'), authController.refresh);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, validate('updateMe'), authController.updateMe);

// Provider OAuth. The candidate is derived from the session, never from the query
// string, so a signed-in candidate can only connect their own account.
router.get('/github', authenticate, githubController.initiateOAuth);
router.get('/github/callback', githubController.handleCallback);
router.get('/linkedin', authenticate, linkedInController.initiateOAuth);
router.post('/linkedin/preview', authenticate, linkedInController.createPreviewConnection);
router.get('/linkedin/callback', linkedInController.handleCallback);

export default router;
