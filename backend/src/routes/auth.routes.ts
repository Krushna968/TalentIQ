import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as githubController from '../controllers/github.controller.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

router.post('/register', validate('register'), authController.register);
router.post('/login', validate('login'), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', authController.getMe);
router.put('/me', authController.updateMe);

router.get('/github', githubController.initiateOAuth);
router.get('/github/callback', githubController.handleCallback);

export default router;
