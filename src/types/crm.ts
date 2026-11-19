export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export type NavSectionId =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'accessories'
  | 'customers'
  | 'suppliers'
  | 'purchases'
  | 'sales'
  | 'expenses'
  | 'repairs'
  | 'warranties'
  | 'ledger'
  | 'returns'
  | 'reports'
  | 'notifications'
  | 'users'
  | 'settings';

export type ProductKind = 'PHONE' | 'ACCESSORY';
export type DeviceCondition = 'New' | 'Used' | 'Refurbished';
export type AccessoryCategory =
  | 'Chargers'
  | 'Earbuds'
  | 'Mobile Covers'
  | 'Screen Protectors'
  | 'Cables'
  | 'Power Banks'
  | 'Headphones';

export type PaymentMethod = 'Cash' | 'JazzCash' | 'EasyPaisa' | 'Bank Transfer' | 'Card';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface Product {
  id: string;
  kind: ProductKind;
  name: string;
  brand: string;
  model: string;
  category: string;
  ram?: string;
  storage?: string;
  color?: string;
  imei?: string;
  sku?: string;
  condition: DeviceCondition;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minStock: number;
  warrantyMonths: number;
  supplierId?: string;
  imageUrl: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email: string;
  city: string;
  address: string;
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number;
  registeredAt: string;
  status: 'Active' | 'Credit Hold' | 'VIP';
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  totalPurchases: number;
  paidAmount: number;
  outstandingBalance: number;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  category: string;
  imei?: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  totalCost: number;
  paidAmount: number;
  remainingBalance: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  soldBy: string;
}

export type ExpenseCategory =
  | 'Shop Rent'
  | 'Electricity'
  | 'Internet'
  | 'Salaries'
  | 'Transport'
  | 'Maintenance'
  | 'Marketing'
  | 'Other';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export type RepairStatus =
  | 'Received'
  | 'Diagnosing'
  | 'Waiting for Parts'
  | 'In Progress'
  | 'Ready for Delivery'
  | 'Delivered';

export interface RepairTicket {
  id: string;
  ticketNumber: string;
  customerId?: string;
  customerName: string;
  phone: string;
  brand: string;
  model: string;
  imei: string;
  problem: string;
  technician: string;
  estimatedCost: number;
  finalCost: number;
  receivedDate: string;
  deliveryDate: string;
  status: RepairStatus;
  notes?: string;
}

export type WarrantyStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Claimed';

export interface WarrantyRecord {
  id: string;
  customerId?: string;
  customerName: string;
  productName: string;
  imei: string;
  invoiceNumber: string;
  provider: string;
  startDate: string;
  expiryDate: string;
  status: WarrantyStatus;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber?: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  invoiceNumber: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  type: 'Refund' | 'Exchange';
  reason: string;
  refundAmount: number;
  exchangeProductId?: string;
  exchangeProductName?: string;
  date: string;
}

export type NotificationType =
  | 'Low Stock'
  | 'New Sale'
  | 'Pending Payment'
  | 'Warranty Expiring'
  | 'Repair Ready'
  | 'Supplier Payment Due';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  targetSection: NavSectionId;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleTitle: 'Admin User' | 'Shop Manager' | 'Sales Staff' | 'Repair Technician';
  accessLevel: UserRole;
  status: 'Active' | 'Inactive';
  joinedDate: string;
  branch: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  currency: string;
  invoicePrefix: string;
  taxEnabled: boolean;
  taxRate: number;
  receiptFormat: 'A4' | 'Thermal 80mm';
  receiptFooter: string;
  lowStockThreshold: number;
  notifyLowStock: boolean;
  notifyWarrantyExpiry: boolean;
  notifyPendingPayments: boolean;
  notifyRepairReady: boolean;
  compactDensity: boolean;
  accentColor: 'indigo' | 'blue' | 'slate';
}

export interface CrmState {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  repairs: RepairTicket[];
  warranties: WarrantyRecord[];
  payments: CustomerPayment[];
  returns: ReturnRecord[];
  notifications: AppNotification[];
  users: TeamMember[];
  settings: ShopSettings;
  // Historical aggregate baselines so dashboard reflects a realistic mature retail shop
  // while every live demo action (POS sale, expense, payment, purchase, return) dynamically updates totals.
  baseline: {
    extraProductsCount: number;
    extraCustomersCount: number;
    extraMonthlySales: number;
    extraMonthlyProfit: number;
    extraLowStockCount: number;
  };
}
