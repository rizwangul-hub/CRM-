import type { Request, Response, NextFunction } from 'express';
import { getDashboardOverview } from '../services/dashboard.service';
import { AuditLog } from '../models/AuditLog';

export async function handleGetDashboardOverview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const overview = await getDashboardOverview(req.user!.role);
    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetAuditLogs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(limit).lean();
    res.status(200).json({
      success: true,
      data: {
        items: logs.map((l) => ({
          id: l._id.toString(),
          actorName: l.actorName,
          actorRole: l.actorRole,
          action: l.action,
          entityType: l.entityType,
          summary: l.summary,
          createdAt: l.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}
