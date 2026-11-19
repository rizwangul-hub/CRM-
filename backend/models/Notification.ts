import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type NotificationType =
  | 'LOW_STOCK'
  | 'NEW_SALE'
  | 'PAYMENT_DUE'
  | 'SUPPLIER_DUE'
  | 'WARRANTY_EXPIRING'
  | 'REPAIR_READY'
  | 'SYSTEM';

export interface INotification extends Document {
  type: NotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  linkModule?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: [
        'LOW_STOCK',
        'NEW_SALE',
        'PAYMENT_DUE',
        'SUPPLIER_DUE',
        'WARRANTY_EXPIRING',
        'REPAIR_READY',
        'SYSTEM',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    isRead: { type: Boolean, default: false, index: true },
    linkModule: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);
