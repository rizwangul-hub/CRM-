import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type WarrantyStatus = 'ACTIVE' | 'CLAIMED' | 'EXPIRED' | 'VOID';

export interface IWarranty extends Document {
  saleId?: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  productName: string;
  imei: string;
  provider: string;
  startDate: Date;
  endDate: Date;
  status: WarrantyStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const warrantySchema = new Schema<IWarranty>(
  {
    saleId: { type: Schema.Types.ObjectId, ref: 'Sale', index: true },
    invoiceNumber: { type: String, trim: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    customerName: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    imei: { type: String, required: true, trim: true, index: true },
    provider: { type: String, required: true, trim: true, default: 'Shop Warranty' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLAIMED', 'EXPIRED', 'VOID'],
      default: 'ACTIVE',
      index: true,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const Warranty: Model<IWarranty> =
  mongoose.models.Warranty || mongoose.model<IWarranty>('Warranty', warrantySchema);
