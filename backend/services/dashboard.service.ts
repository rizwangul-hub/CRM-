import {
  Customer,
  Expense,
  Notification,
  Product,
  Repair,
  Sale,
  ShopSettings,
  Warranty,
} from '../models';
import { canViewSensitiveFinancials, type UserRole } from '../middleware/auth';
import { calculateNetProfit } from '../utils/money';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function formatShortDay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthLabel(year: number, monthIndexZeroBased: number): string {
  return new Date(year, monthIndexZeroBased, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  });
}

export async function getDashboardOverview(userRole: UserRole) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const fourteenDaysAgo = startOfDay(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
  const warrantyHorizon = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

  const includeFinancials = canViewSensitiveFinancials(userRole);

  const [
    settingsDoc,
    todaySalesAgg,
    monthSalesAgg,
    monthExpensesAgg,
    totalProductsCount,
    lowStockProducts,
    totalCustomersCount,
    outstandingAgg,
    dailySalesRaw,
    monthlySalesRaw,
    monthlyExpensesRaw,
    categorySalesRaw,
    paymentMethodRaw,
    recentSalesDocs,
    recentCustomersDocs,
    recentRepairsDocs,
    expiringWarrantiesDocs,
    unreadNotificationsCount,
  ] = await Promise.all([
    ShopSettings.findOne().lean(),
    Sale.aggregate([
      { $match: { soldAt: { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          totalPaisa: { $sum: '$grandTotalPaisa' },
          count: { $sum: 1 },
        },
      },
    ]),
    Sale.aggregate([
      { $match: { soldAt: { $gte: monthStart } } },
      {
        $group: {
          _id: null,
          subtotalPaisa: { $sum: '$subtotalPaisa' },
          discountPaisa: { $sum: '$discountPaisa' },
          grandTotalPaisa: { $sum: '$grandTotalPaisa' },
          totalCostPaisa: { $sum: '$totalCostPaisa' },
          count: { $sum: 1 },
        },
      },
    ]),
    includeFinancials
      ? Expense.aggregate([
          { $match: { expenseDate: { $gte: monthStart } } },
          {
            $group: {
              _id: null,
              totalPaisa: { $sum: '$amountPaisa' },
              count: { $sum: 1 },
            },
          },
        ])
      : Promise.resolve([]),
    Product.countDocuments({ isActive: true }),
    Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$minStockLevel'] },
    })
      .sort({ quantity: 1, updatedAt: -1 })
      .limit(8)
      .lean(),
    Customer.countDocuments(),
    Customer.aggregate([
      {
        $group: {
          _id: null,
          totalOutstandingPaisa: { $sum: '$outstandingBalancePaisa' },
          debtorsCount: {
            $sum: { $cond: [{ $gt: ['$outstandingBalancePaisa', 0] }, 1, 0] },
          },
        },
      },
    ]),
    Sale.aggregate([
      { $match: { soldAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$soldAt' },
            month: { $month: '$soldAt' },
            day: { $dayOfMonth: '$soldAt' },
          },
          revenuePaisa: { $sum: '$grandTotalPaisa' },
          orders: { $sum: 1 },
        },
      },
    ]),
    Sale.aggregate([
      { $match: { soldAt: { $gte: sixMonthsStart } } },
      {
        $group: {
          _id: {
            year: { $year: '$soldAt' },
            month: { $month: '$soldAt' },
          },
          revenuePaisa: { $sum: '$grandTotalPaisa' },
          costPaisa: { $sum: '$totalCostPaisa' },
        },
      },
    ]),
    includeFinancials
      ? Expense.aggregate([
          { $match: { expenseDate: { $gte: sixMonthsStart } } },
          {
            $group: {
              _id: {
                year: { $year: '$expenseDate' },
                month: { $month: '$expenseDate' },
              },
              expensesPaisa: { $sum: '$amountPaisa' },
            },
          },
        ])
      : Promise.resolve([]),
    Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          revenuePaisa: { $sum: '$items.lineTotalPaisa' },
          units: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenuePaisa: -1 } },
      { $limit: 6 },
    ]),
    Sale.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          totalPaisa: { $sum: '$paidAmountPaisa' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalPaisa: -1 } },
    ]),
    Sale.find().sort({ soldAt: -1 }).limit(6).lean(),
    Customer.find().sort({ createdAt: -1 }).limit(5).lean(),
    Repair.find().sort({ receivedDate: -1 }).limit(5).lean(),
    Warranty.find({
      status: 'ACTIVE',
      endDate: { $gte: todayStart, $lte: warrantyHorizon },
    })
      .sort({ endDate: 1 })
      .limit(5)
      .lean(),
    Notification.countDocuments({ isRead: false }),
  ]);

  const lowStockCount = await Product.countDocuments({
    isActive: true,
    $expr: { $lte: ['$quantity', '$minStockLevel'] },
  });

  // Build 14-day continuous daily sales series
  const dailyMap = new Map<string, { revenuePaisa: number; orders: number }>();
  for (const row of dailySalesRaw) {
    const key = `${row._id.year}-${row._id.month}-${row._id.day}`;
    dailyMap.set(key, { revenuePaisa: row.revenuePaisa, orders: row.orders });
  }
  const dailySalesChart = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const entry = dailyMap.get(key);
    dailySalesChart.push({
      date: formatShortDay(d),
      revenuePaisa: entry?.revenuePaisa || 0,
      orders: entry?.orders || 0,
    });
  }

  // Build 6-month revenue (and expense/profit for Admin/Manager) series
  const monthSalesMap = new Map<string, { revenuePaisa: number; costPaisa: number }>();
  for (const row of monthlySalesRaw) {
    monthSalesMap.set(`${row._id.year}-${row._id.month}`, {
      revenuePaisa: row.revenuePaisa,
      costPaisa: row.costPaisa,
    });
  }
  const monthExpenseMap = new Map<string, number>();
  for (const row of monthlyExpensesRaw) {
    monthExpenseMap.set(`${row._id.year}-${row._id.month}`, row.expensesPaisa);
  }
  const monthlyRevenueChart = [];
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const saleEntry = monthSalesMap.get(key);
    const rev = saleEntry?.revenuePaisa || 0;
    const cost = saleEntry?.costPaisa || 0;
    const exp = monthExpenseMap.get(key) || 0;
    monthlyRevenueChart.push({
      month: formatMonthLabel(d.getFullYear(), d.getMonth()),
      revenuePaisa: rev,
      ...(includeFinancials
        ? {
            expensesPaisa: exp,
            profitPaisa: rev - cost - exp,
          }
        : {}),
    });
  }

  const monthStats = monthSalesAgg[0] || {
    subtotalPaisa: 0,
    discountPaisa: 0,
    grandTotalPaisa: 0,
    totalCostPaisa: 0,
    count: 0,
  };
  const monthExpensePaisa = monthExpensesAgg[0]?.totalPaisa || 0;

  const profitCalc = includeFinancials
    ? calculateNetProfit({
        grossSalesPaisa: monthStats.subtotalPaisa,
        discountsPaisa: monthStats.discountPaisa,
        returnsPaisa: 0,
        cogsPaisa: monthStats.totalCostPaisa,
        expensesPaisa: monthExpensePaisa,
      })
    : null;

  return {
    shop: {
      shopName: settingsDoc?.shopName || 'CellTrack Mobile Hub',
      currency: settingsDoc?.currency || 'PKR',
    },
    permissions: {
      canViewFinancials: includeFinancials,
    },
    unreadNotificationsCount,
    summary: {
      totalSalesTodayPaisa: todaySalesAgg[0]?.totalPaisa || 0,
      salesTodayCount: todaySalesAgg[0]?.count || 0,
      totalSalesMonthPaisa: monthStats.grandTotalPaisa || 0,
      salesMonthCount: monthStats.count || 0,
      totalProducts: totalProductsCount,
      lowStockProducts: lowStockCount,
      totalCustomers: totalCustomersCount,
      totalOutstandingPaisa: outstandingAgg[0]?.totalOutstandingPaisa || 0,
      outstandingDebtorsCount: outstandingAgg[0]?.debtorsCount || 0,
      totalExpensesMonthPaisa: includeFinancials ? monthExpensePaisa : null,
      netProfitMonthPaisa: profitCalc ? profitCalc.netProfitPaisa : null,
      profitMarginPercent: profitCalc ? profitCalc.marginPercent : null,
    },
    charts: {
      dailySales: dailySalesChart,
      monthlyRevenue: monthlyRevenueChart,
      salesByCategory: categorySalesRaw.map((row) => ({
        category: row._id || 'Uncategorized',
        revenuePaisa: row.revenuePaisa,
        units: row.units,
      })),
      paymentMethods: paymentMethodRaw.map((row) => ({
        method: row._id || 'Cash',
        totalPaisa: row.totalPaisa,
        count: row.count,
      })),
    },
    widgets: {
      recentSales: recentSalesDocs.map((s) => ({
        id: s._id.toString(),
        invoiceNumber: s.invoiceNumber,
        customerName: s.customerName,
        itemCount: s.items.reduce((sum, item) => sum + item.quantity, 0),
        grandTotalPaisa: s.grandTotalPaisa,
        paidAmountPaisa: s.paidAmountPaisa,
        paymentMethod: s.paymentMethod,
        paymentStatus: s.paymentStatus,
        soldAt: s.soldAt.toISOString(),
      })),
      recentCustomers: recentCustomersDocs.map((c) => ({
        id: c._id.toString(),
        fullName: c.fullName,
        mobileNumber: c.mobileNumber,
        city: c.city || 'Lahore',
        totalPurchasesPaisa: c.totalPurchasesPaisa,
        outstandingBalancePaisa: c.outstandingBalancePaisa,
        createdAt: c.createdAt.toISOString(),
      })),
      lowStockAlerts: lowStockProducts.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        brand: p.brand,
        category: p.category,
        quantity: p.quantity,
        minStockLevel: p.minStockLevel,
        sku: p.sku || p.imei || '',
      })),
      recentRepairs: recentRepairsDocs.map((r) => ({
        id: r._id.toString(),
        ticketNumber: r.ticketNumber,
        customerName: r.customerName,
        device: `${r.deviceBrand} ${r.deviceModel}`,
        problem: r.problemDescription,
        status: r.status,
        estimatedCostPaisa: r.estimatedCostPaisa,
        receivedDate: r.receivedDate.toISOString(),
      })),
      upcomingWarranties: expiringWarrantiesDocs.map((w) => ({
        id: w._id.toString(),
        productName: w.productName,
        customerName: w.customerName,
        imei: w.imei,
        provider: w.provider,
        endDate: w.endDate.toISOString(),
        daysRemaining: Math.max(
          0,
          Math.ceil((w.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
        ),
      })),
    },
  };
}
