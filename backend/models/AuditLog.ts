import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { UserRole } from '../middleware/auth';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: UserRole | 'SYSTEM';
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorName: { type: String, required: true, trim: true },
    actorRole: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'STAFF', 'SYSTEM'],
      required: true,
    },
    action: { type: String, required: true, trim: true, index: true },
    entityType: { type: String, required: true, trim: true, index: true },
    entityId: { type: String, trim: true },
    summary: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
