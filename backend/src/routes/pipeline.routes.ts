import { Router } from 'express';
import * as pipeline from '../controllers/pipeline.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireOrg } from '../middleware/tenant.middleware.js';

const router = Router();

// Entry-scoped actions carry no jobId in the URL, so job-level permission is
// enforced inside the service (loadEntry -> assertJobPermission), which also
// guarantees tenant isolation.
router.use(authenticate, requireOrg);

router.patch('/entries/:entryId/stage', pipeline.moveStage);
router.post('/entries/:entryId/decision', pipeline.recordDecision);
router.post('/entries/:entryId/reopen', pipeline.reopen);
router.patch('/entries/:entryId/assignee', pipeline.assignOwner);
router.patch('/entries/:entryId/shortlist', pipeline.setShortlist);
router.post('/entries/:entryId/notes', pipeline.addNote);
router.get('/entries/:entryId/timeline', pipeline.getTimeline);
router.post('/bulk', pipeline.bulkAction);

export default router;
