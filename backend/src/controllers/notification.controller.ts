import { type Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import * as notifications from '../services/notification.service.js';

const candidateId = (req: AuthenticatedRequest) => String(req.user?.id);
export async function preferences(req: AuthenticatedRequest, res: Response) { res.json(await notifications.getNotificationPreferences(candidateId(req))); }
export async function updatePreferences(req: AuthenticatedRequest, res: Response) { res.json(await notifications.updateNotificationPreferences(candidateId(req), req.body)); }
export async function list(req: AuthenticatedRequest, res: Response) { res.json({ notifications: await notifications.listNotifications(candidateId(req)) }); }