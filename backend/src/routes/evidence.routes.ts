import { Router } from 'express';
import * as c from '../controllers/evidence.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
const router=Router({mergeParams:true});
router.use(authenticate);
router.get('/review/queue',authorize('admin','reviewer'),c.queue); router.post('/attachments/:attachmentId/complete',c.attachmentComplete); router.get('/attachments/:attachmentId/download',c.attachmentDownload); router.get('/',c.list); router.post('/',c.create); router.get('/:evidenceId',c.get); router.patch('/:evidenceId',c.update); router.delete('/:evidenceId',c.remove); router.post('/:evidenceId/submit',c.submit); router.post('/:evidenceId/appeal',c.appeal); router.post('/:evidenceId/attachments',c.attachmentIntent);
router.post('/:evidenceId/review/start',authorize('admin','reviewer'),c.startReview); router.put('/:evidenceId/review',authorize('admin','reviewer'),c.review);
export default router;



