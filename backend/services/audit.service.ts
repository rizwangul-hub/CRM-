import { AuditLog } from '../models/AuditLog';
import type { UserRole } from '../middleware/auth';

interface AuditEntryInput {
  actorId?: string;
  actorName: string;
  actorRole: UserRole | 'SYSTEM';
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function recordAuditLog(entry: AuditEntryInput): Promise<void> {
  try {
    await AuditLog.create({
      actorId: entry.actorId,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      summary: entry.summary,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to persist audit record:', err);
  }
}
