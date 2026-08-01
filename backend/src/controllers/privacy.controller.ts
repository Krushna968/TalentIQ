import { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { privacyService } from '../services/privacy.service.js';
import { auditService } from '../services/audit.service.js';
import { AppError } from '../middleware/error.middleware.js';

export const updateConsent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
  const { consentType, status, version } = req.body;

  const result = await privacyService.updateConsent(req.user.id, consentType, status, version);
  res.status(200).json({ success: true, data: result, requestId: req.requestId });
};

export const getConsents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
  const result = await privacyService.getConsents(req.user.id);
  res.status(200).json({ success: true, data: result, requestId: req.requestId });
};

export const updatePreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
  const { visibility } = req.body;
  const result = await privacyService.updateVisibility(req.user.id, visibility);
  res.status(200).json({ success: true, data: { visibility: result }, requestId: req.requestId });
};

export const getPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
  const visibility = await privacyService.getVisibility(req.user.id);
  res.status(200).json({ success: true, data: { visibility }, requestId: req.requestId });
};

export const exportData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
  const exportPackage = await privacyService.exportUserData(req.user.id);
  res.status(200).json({ success: true, data: exportPackage, requestId: req.requestId });
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
  await privacyService.requestAccountDeletion(req.user.id);
  res.status(200).json({ success: true, data: { message: 'Account erasure request initiated and session terminated' }, requestId: req.requestId });
};

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
  const logs = await auditService.getLogsForUser(req.user.id);
  res.status(200).json({ success: true, data: logs, requestId: req.requestId });
};
