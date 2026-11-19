import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ISupplier extends Document {
  supplierName: string;
  contactPerson: string;
  phone: string;
  whatsapp?: string;
  companyName?: string;
  email?: string;
  address?: string;
  notes?: string;
  outstandingPayablePaisa: number;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    supplierName: { type: String, required: true, trim: true, index: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    whatsapp: { type: String, trim: true },
    companyName: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    outstandingPayablePaisa: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const Supplier: Model<ISupplier> =
  mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', supplierSchema);
