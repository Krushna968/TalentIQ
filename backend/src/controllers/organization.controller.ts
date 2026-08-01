import { asyncHandler } from '../lib/http.js';
import * as orgs from '../services/organization.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ organizations: await orgs.listOrganizations(req) });
});

export const get = asyncHandler(async (req, res) => {
  res.json({ organization: await orgs.getOrganization(req, req.params.id as string) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ organization: await orgs.createOrganization(req, req.body) });
});

export const listMembers = asyncHandler(async (req, res) => {
  res.json({ members: await orgs.listMembers(req, req.params.id as string) });
});

export const addMember = asyncHandler(async (req, res) => {
  res.status(201).json({ member: await orgs.addMember(req, req.params.id as string, req.body) });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  res.json({ member: await orgs.updateMemberRole(req, req.params.membershipId as string, req.body?.role) });
});
