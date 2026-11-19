import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { UserRole } from '../middleware/auth';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, maxlength: 30 },
    passwordHash: { type: String, required: false, select: false },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'STAFF'],
      default: 'STAFF',
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);
