import { Router } from 'express';
import * as job from '../controllers/job.controller.js';
import * as pipeline from '../controllers/pipeline.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireOrg, requireJobPermission } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireOrg);

router.get('/', job.list);
router.post('/', job.create);
router.get('/:jobId', job.get); // viewer permission enforced in service
router.patch('/:jobId', requireJobPermission('editor'), job.update);
router.patch('/:jobId/status', requireJobPermission('editor'), job.setStatus);

router.get('/:jobId/collaborators', requireJobPermission('viewer'), job.listCollaborators);
router.post('/:jobId/collaborators', requireJobPermission('owner'), job.addCollaborator);

// Persisted hiring pipeline for a requisition.
router.get('/:jobId/pipeline', requireJobPermission('viewer'), pipeline.getBoard);
router.post('/:jobId/pipeline', requireJobPermission('editor'), pipeline.addCandidates);

export default router;
