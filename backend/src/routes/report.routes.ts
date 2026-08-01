import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/talent/:id', reportController.getTalentReport);
router.get('/talent/:id/pdf', reportController.exportTalentReportPdf);
router.post('/talent/:id/share', reportController.shareReport);

export default router;
