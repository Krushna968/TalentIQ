import { Router } from 'express';
import * as recruiter from '../controllers/recruiter.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();
router.use(authenticate, authorize('recruiter', 'admin'));

router.get('/search', recruiter.searchCandidates);

router.get('/company', recruiter.getCompany);
router.put('/company', recruiter.saveCompany);

router.get('/jobs', recruiter.listJobs);
router.post('/jobs', validate('job'), recruiter.createJob);
router.get('/jobs/:jobId', recruiter.getJob);
router.patch('/jobs/:jobId', recruiter.updateJob);
router.delete('/jobs/:jobId', recruiter.closeJob);

router.get('/pipeline', recruiter.getPipeline);
router.put('/pipeline/:candidateId', validate('pipelineUpdate'), recruiter.updatePipelineStatus);
router.delete('/pipeline/entry/:entryId', recruiter.removeFromPipeline);

router.post('/compare', recruiter.compareCandidates);

export default router;
