import { Router } from 'express';
import * as privacyController from '../controllers/privacy.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

// All privacy and GDPR/erasure operations require authenticated user ownership
router.use(requireAuth);

router.post('/consent', validate('privacyConsent'), privacyController.updateConsent);
router.get('/consent', privacyController.getConsents);

router.put('/preferences', validate('privacyPreference'), privacyController.updatePreferences);
router.get('/preferences', privacyController.getPreferences);

router.get('/export', privacyController.exportData);
router.delete('/account', privacyController.deleteAccount);
router.get('/audit-logs', privacyController.getAuditLogs);

export default router;
