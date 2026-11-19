import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type RepairStatus =
  | 'Received'
  | 'Diagnosing'
  | 'Waiting for Parts'
  | 'In Progress'
  | 'Ready for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface IRepair extends Document {
  ticketNumber: string;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  phoneNumber: string;
  deviceBrand: string;
  deviceModel: string;
  imei?: string;
  problemDescription: string;
  physicalCondition?: string;
  accessoriesReceived?: string;
  estimatedCostPaisa: number;
  finalCostPaisa: number;
  paidAmountPaisa: number;
  technicianName?: string;
  receivedDate: Date;
  expectedDeliveryDate?: Date;
  status: RepairStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const repairSchema = new Schema<IRepair>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    customerName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    deviceBrand: { type: String, required: true, trim: true },
    deviceModel: { type: String, required: true, trim: true },
    imei: { type: String, trim: true, index: true },
    problemDescription: { type: String, required: true, trim: true },
    physicalCondition: { type: String, trim: true },
    accessoriesReceived: { type: String, trim: true },
    estimatedCostPaisa: { type: Number, required: true, min: 0, default: 0 },
    finalCostPaisa: { type: Number, min: 0, default: 0 },
    paidAmountPaisa: { type: Number, min: 0, default: 0 },
    technicianName: { type: String, trim: true },
    receivedDate: { type: Date, required: true, default: Date.now, index: true },
    expectedDeliveryDate: { type: Date },
    status: {
      type: String,
      enum: [
        'Received',
        'Diagnosing',
        'Waiting for Parts',
        'In Progress',
        'Ready for Delivery',
        'Delivered',
        'Cancelled',
      ],
      default: 'Received',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Repair: Model<IRepair> =
  mongoose.models.Repair || mongoose.model<IRepair>('Repair', repairSchema);
