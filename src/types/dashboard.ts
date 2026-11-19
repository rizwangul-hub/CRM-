export interface DashboardSummary {
  totalSalesTodayPaisa: number;
  salesTodayCount: number;
  totalSalesMonthPaisa: number;
  salesMonthCount: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  totalOutstandingPaisa: number;
  outstandingDebtorsCount: number;
  totalExpensesMonthPaisa: number | null;
  netProfitMonthPaisa: number | null;
  profitMarginPercent: number | null;
}

export interface DailySalePoint {
  date: string;
  revenuePaisa: number;
  orders: number;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenuePaisa: number;
  expensesPaisa?: number;
  profitPaisa?: number;
}

export interface CategorySalePoint {
  category: string;
  revenuePaisa: number;
  units: number;
}

export interface PaymentMethodPoint {
  method: string;
  totalPaisa: number;
  count: number;
}

export interface RecentSaleItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  itemCount: number;
  grandTotalPaisa: number;
  paidAmountPaisa: number;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  soldAt: string;
}

export interface RecentCustomerItem {
  id: string;
  fullName: string;
  mobileNumber: string;
  city: string;
  totalPurchasesPaisa: number;
  outstandingBalancePaisa: number;
  createdAt: string;
}

export interface LowStockAlertItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  quantity: number;
  minStockLevel: number;
  sku: string;
}

export interface RecentRepairItem {
  id: string;
  ticketNumber: string;
  customerName: string;
  device: string;
  problem: string;
  status: string;
  estimatedCostPaisa: number;
  receivedDate: string;
}

export interface UpcomingWarrantyItem {
  id: string;
  productName: string;
  customerName: string;
  imei: string;
  provider: string;
  endDate: string;
  daysRemaining: number;
}

export interface DashboardOverview {
  shop: {
    shopName: string;
    currency: string;
  };
  permissions: {
    canViewFinancials: boolean;
  };
  unreadNotificationsCount: number;
  summary: DashboardSummary;
  charts: {
    dailySales: DailySalePoint[];
    monthlyRevenue: MonthlyRevenuePoint[];
    salesByCategory: CategorySalePoint[];
    paymentMethods: PaymentMethodPoint[];
  };
  widgets: {
    recentSales: RecentSaleItem[];
    recentCustomers: RecentCustomerItem[];
    lowStockAlerts: LowStockAlertItem[];
    recentRepairs: RecentRepairItem[];
    upcomingWarranties: UpcomingWarrantyItem[];
  };
}

export interface AuditLogItem {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  summary: string;
  createdAt: string;
}
