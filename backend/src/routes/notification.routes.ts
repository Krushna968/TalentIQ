import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/notification.controller.js';
const router = Router();
router.use(authenticate);
router.get('/', controller.list);
router.get('/preferences', controller.preferences);
router.patch('/preferences', controller.updatePreferences);
export default router;