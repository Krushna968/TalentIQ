import { Router } from 'express';
import * as interviewController from '../controllers/interview.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/questions', interviewController.getQuestions);
router.post('/submit', interviewController.submitAnswer);
router.get('/sessions', interviewController.getSessions);
router.get('/sessions/:id', interviewController.getSession);
router.get('/report/:sessionId', interviewController.getInterviewReport);

export default router;
