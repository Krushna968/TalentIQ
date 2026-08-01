import { Router } from 'express';
import * as report from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// A shared dossier link is intentionally public; everything else needs a session.
router.get('/shared/:token', report.getSharedReport);

router.use(authenticate);
router.get('/talent/:id', report.getTalentReport);
router.get('/talent/:id/export', report.exportTalentReportPdf);
router.get('/talent/:id/graph', report.getKnowledgeGraph);
router.post('/talent/:id/share', report.shareReport);

export default router;
