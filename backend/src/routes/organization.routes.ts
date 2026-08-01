import { Router } from 'express';
import * as org from '../controllers/organization.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireOrg } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(authenticate);

// Creating/listing orgs the caller belongs to only needs authentication.
router.get('/', org.list);
router.post('/', org.create);

// Everything scoped to a specific org additionally requires membership.
router.get('/:id', requireOrg, org.get);
router.get('/:id/members', requireOrg, org.listMembers);
router.post('/:id/members', requireOrg, org.addMember);
router.patch('/members/:membershipId', requireOrg, org.updateMemberRole);

export default router;
