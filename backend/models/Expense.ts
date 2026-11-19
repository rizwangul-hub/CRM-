import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { PaymentMethod } from './Sale';

export type ExpenseCategory =
  | 'Shop Rent'
  | 'Electricity'
  | 'Internet'
  | 'Staff Salaries'
  | 'Transportation'
  | 'Maintenance'
  | 'Marketing'
  | 'Other Expenses';

export interface IExpense extends Document {
  title: string;
  category: ExpenseCategory;
  amountPaisa: number;
  expenseDate: Date;
  paymentMethod: PaymentMethod;
  description?: string;
  attachmentUrl?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Shop Rent',
        'Electricity',
        'Internet',
        'Staff Salaries',
        'Transportation',
        'Maintenance',
        'Marketing',
        'Other Expenses',
      ],
      required: true,
      index: true,
    },
    amountPaisa: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, required: true, default: Date.now, index: true },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Card', 'Other'],
      required: true,
      default: 'Cash',
    },
    description: { type: String, trim: true },
    attachmentUrl: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', expenseSchema);
