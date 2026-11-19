import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ProductType = 'PHONE' | 'ACCESSORY';
export type DeviceCondition = 'New' | 'Used' | 'Refurbished';

export interface IProduct extends Document {
  productType: ProductType;
  name: string;
  brand: string;
  deviceModel: string;
  category: string;
  imei?: string;
  serialNumber?: string;
  sku?: string;
  ram?: string;
  storage?: string;
  color?: string;
  condition: DeviceCondition;
  purchasePricePaisa: number;
  sellingPricePaisa: number;
  quantity: number;
  minStockLevel: number;
  supplierId?: mongoose.Types.ObjectId;
  warrantyMonths: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    productType: {
      type: String,
      enum: ['PHONE', 'ACCESSORY'],
      required: true,
      default: 'PHONE',
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    brand: { type: String, required: true, trim: true, index: true },
    deviceModel: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    imei: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    sku: { type: String, trim: true, index: true },
    ram: { type: String, trim: true },
    storage: { type: String, trim: true },
    color: { type: String, trim: true },
    condition: {
      type: String,
      enum: ['New', 'Used', 'Refurbished'],
      default: 'New',
      index: true,
    },
    purchasePricePaisa: { type: Number, required: true, min: 0 },
    sellingPricePaisa: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    minStockLevel: { type: Number, required: true, min: 0, default: 3 },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    warrantyMonths: { type: Number, default: 12, min: 0 },
    imageUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

// Enforce unique IMEI across all active devices that carry an IMEI
productSchema.index(
  { imei: 1 },
  {
    unique: true,
    partialFilterExpression: { imei: { $type: 'string', $gt: '' }, isActive: true },
  },
);

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
