import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IShopSettings extends Document {
  shopName: string;
  logoUrl?: string;
  address: string;
  phone: string;
  whatsapp: string;
  currency: string;
  dateFormat: string;
  taxEnabled: boolean;
  taxRatePercent: number;
  invoicePrefix: string;
  receiptFooter: string;
  lowStockThreshold: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const shopSettingsSchema = new Schema<IShopSettings>(
  {
    shopName: { type: String, required: true, trim: true, default: 'CellTrack Mobile Hub' },
    logoUrl: { type: String, trim: true },
    address: {
      type: String,
      trim: true,
      default: 'Shop 14, Hall Road Mobile Plaza, Lahore',
    },
    phone: { type: String, trim: true, default: '+92 42 3724 8810' },
    whatsapp: { type: String, trim: true, default: '+92 300 8451290' },
    currency: { type: String, trim: true, default: 'PKR' },
    dateFormat: { type: String, trim: true, default: 'DD MMM YYYY' },
    taxEnabled: { type: Boolean, default: false },
    taxRatePercent: { type: Number, default: 0, min: 0, max: 100 },
    invoicePrefix: { type: String, trim: true, default: 'INV' },
    receiptFooter: {
      type: String,
      trim: true,
      default: 'Warranty valid only with original invoice & intact IMEI seal.',
    },
    lowStockThreshold: { type: Number, default: 5, min: 1 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const ShopSettings: Model<IShopSettings> =
  mongoose.models.ShopSettings ||
  mongoose.model<IShopSettings>('ShopSettings', shopSettingsSchema);
