import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type PaymentMethod =
  | 'Cash'
  | 'Bank Transfer'
  | 'JazzCash'
  | 'EasyPaisa'
  | 'Card'
  | 'Other';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  category: string;
  imei?: string;
  quantity: number;
  unitPricePaisa: number;
  unitCostPaisa: number;
  discountPaisa: number;
  lineTotalPaisa: number;
}

export interface ISale extends Document {
  invoiceNumber: string;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  items: ISaleItem[];
  subtotalPaisa: number;
  discountPaisa: number;
  taxPaisa: number;
  grandTotalPaisa: number;
  totalCostPaisa: number;
  paidAmountPaisa: number;
  remainingBalancePaisa: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  soldBy: mongoose.Types.ObjectId;
  soldAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    imei: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPricePaisa: { type: Number, required: true, min: 0 },
    unitCostPaisa: { type: Number, required: true, min: 0 },
    discountPaisa: { type: Number, default: 0, min: 0 },
    lineTotalPaisa: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const saleSchema = new Schema<ISale>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    customerName: { type: String, required: true, trim: true, default: 'Walk-in Customer' },
    customerPhone: { type: String, trim: true },
    items: { type: [saleItemSchema], required: true },
    subtotalPaisa: { type: Number, required: true, min: 0 },
    discountPaisa: { type: Number, default: 0, min: 0 },
    taxPaisa: { type: Number, default: 0, min: 0 },
    grandTotalPaisa: { type: Number, required: true, min: 0 },
    totalCostPaisa: { type: Number, required: true, min: 0 },
    paidAmountPaisa: { type: Number, required: true, min: 0 },
    remainingBalancePaisa: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Card', 'Other'],
      required: true,
      default: 'Cash',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      required: true,
      default: 'PAID',
      index: true,
    },
    soldBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    soldAt: { type: Date, required: true, default: Date.now, index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

saleSchema.index({ soldAt: -1 });

export const Sale: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>('Sale', saleSchema);
