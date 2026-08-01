import { Router } from 'express';
import * as interview from '../controllers/interview.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/questions', interview.getQuestions);
router.post('/sessions', validate('interviewStart'), interview.startSession);
router.get('/sessions', interview.getSessions);
router.get('/sessions/:id', interview.getSession);
router.post('/sessions/:id/answer', validate('interviewAnswer'), interview.submitAnswer);
router.post('/sessions/:id/complete', interview.completeSession);
router.get('/report/:sessionId', interview.getInterviewReport);

export default router;
