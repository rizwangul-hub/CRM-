import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ICustomer extends Document {
  fullName: string;
  mobileNumber: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  totalPurchasesPaisa: number;
  outstandingBalancePaisa: number;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    fullName: { type: String, required: true, trim: true, index: true },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    whatsappNumber: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    notes: { type: String, trim: true },
    totalPurchasesPaisa: { type: Number, default: 0, min: 0 },
    outstandingBalancePaisa: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);
