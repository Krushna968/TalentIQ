import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as githubController from '../controllers/github.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/security.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, validate('register'), authController.register);
router.post('/login', authRateLimiter, validate('login'), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authRateLimiter, authController.refresh);

router.post('/verify-email', authRateLimiter, validate('verifyEmail'), authController.verifyEmail);
router.post('/resend-verification', authRateLimiter, validate('resendVerification'), authController.resendVerification);
router.post('/forgot-password', authRateLimiter, validate('forgotPassword'), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate('resetPassword'), authController.resetPassword);

router.get('/me', requireAuth, authController.getMe);
router.put('/me', requireAuth, validate('updateMe'), authController.updateMe);

router.get('/github', githubController.initiateOAuth);
router.get('/github/callback', githubController.handleCallback);

export default router;

