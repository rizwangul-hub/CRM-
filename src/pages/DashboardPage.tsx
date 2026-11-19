import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CreditCard,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../components/ui/Button';
import { useRole } from '../context/RoleContext';
import { computeDashboardMetrics } from '../store/crmEngine';
import { useCrm } from '../store/crmStore';
import type { NavSectionId, RepairStatus } from '../types/crm';
import { daysUntil, formatCompactRs, formatRs, formatShortDate } from '../utils/format';

interface DashboardPageProps {
  onNavigate: (section: NavSectionId) => void;
}

const CHART_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#64748B', '#8B5CF6'];

function getRepairBadgeClass(status: RepairStatus): string {
  switch (status) {
    case 'Ready for Delivery':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Delivered':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'In Progress':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Waiting for Parts':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Diagnosing':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { state } = useCrm();
  const { role } = useRole();
  const metrics = useMemo(() => computeDashboardMetrics(state), [state]);
  const currency = state.settings.currency;

  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'STAFF';

  const kpiCards = useMemo(() => {
    const all = [
      {
        id: 'today-sales',
        label: "Today's Sales",
        value: formatRs(metrics.todaysSales, currency),
        meta: `${metrics.todaysInvoicesCount} invoices today`,
        icon: Banknote,
        iconBg: 'bg-indigo-50 text-indigo-600',
        visible: true,
        target: 'sales' as NavSectionId,
      },
      {
        id: 'monthly-sales',
        label: 'Monthly Sales',
        value: formatRs(metrics.monthlySales, currency),
        meta: '+11.4% vs last month',
        icon: TrendingUp,
        iconBg: 'bg-sky-50 text-sky-600',
        visible: !isStaff,
        target: 'reports' as NavSectionId,
      },
      {
        id: 'total-products',
        label: 'Total Products',
        value: metrics.totalProducts.toLocaleString('en-PK'),
        meta: 'Phones & accessories',
        icon: Package,
        iconBg: 'bg-slate-100 text-slate-700',
        visible: true,
        target: 'inventory' as NavSectionId,
      },
      {
        id: 'total-customers',
        label: 'Total Customers',
        value: metrics.totalCustomers.toLocaleString('en-PK'),
        meta: 'Active retail profiles',
        icon: Users,
        iconBg: 'bg-emerald-50 text-emerald-600',
        visible: true,
        target: 'customers' as NavSectionId,
      },
      {
        id: 'low-stock',
        label: 'Low Stock',
        value: String(metrics.lowStockCount),
        meta: 'Items need reorder',
        icon: AlertTriangle,
        iconBg: 'bg-amber-50 text-amber-600',
        visible: true,
        target: 'inventory' as NavSectionId,
      },
      {
        id: 'total-expenses',
        label: 'Total Expenses',
        value: formatRs(metrics.totalExpenses, currency),
        meta: 'Monthly shop overhead',
        icon: Wallet,
        iconBg: 'bg-rose-50 text-rose-600',
        visible: !isStaff,
        target: 'expenses' as NavSectionId,
      },
      {
        id: 'outstanding',
        label: 'Outstanding Payments',
        value: formatRs(metrics.outstandingPayments, currency),
        meta: 'Customer receivables',
        icon: CreditCard,
        iconBg: 'bg-amber-50 text-amber-700',
        visible: !isStaff,
        target: 'ledger' as NavSectionId,
      },
      {
        id: 'profit',
        label: 'Estimated Profit',
        value: formatRs(metrics.estimatedProfit, currency),
        meta: 'Net after COGS & overhead',
        icon: TrendingUp,
        iconBg: 'bg-emerald-50 text-emerald-700',
        visible: isAdmin,
        target: 'reports' as NavSectionId,
      },
    ];
    return all.filter((card) => card.visible);
  }, [metrics, currency, isAdmin, isStaff]);

  const upcomingWarranties = useMemo(() => {
    return [...state.warranties]
      .filter((w) => w.status === 'Active' || w.status === 'Expiring Soon')
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
      .slice(0, 5);
  }, [state.warranties]);

  const recentSales = state.sales.slice(0, 5);
  const recentCustomers = state.customers.slice(0, 5);
  const recentRepairs = state.repairs.slice(0, 5);
  const lowStockPreview = metrics.lowStockItems.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Action Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            {isAdmin
              ? 'Full financial overview, stock movement, customer credit, and active repairs.'
              : isStaff
                ? 'Counter workspace: quick billing, customer registration, stock check, and repair intake.'
                : 'Daily store operations: sales tracking, purchasing, repairs, and stock replenishment.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button" variant="secondary" size="sm" onClick={() => onNavigate('repairs')}>
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
            New Repair
          </Button>
          <Button type="button" size="sm" onClick={() => onNavigate('pos')}>
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
            Open POS Sale
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section aria-label="Key business metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigate(card.target)}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-2xs transition-all hover:border-indigo-300 hover:shadow-sm cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums font-display">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{card.meta}</p>
              </div>
            </button>
          );
        })}
      </section>

      {/* Analytics Charts Grid */}
      <section aria-label="Sales and financial charts" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Weekly Sales */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Weekly Sales</h2>
              <p className="text-xs text-slate-500">Daily retail revenue over the past 7 days</p>
            </div>
            <span className="text-xs font-medium text-indigo-600 tabular-nums">
              {formatRs(
                metrics.weeklySales.reduce((s, d) => s + d.sales, 0),
                currency,
              )}
            </span>
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.weeklySales} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => formatCompactRs(Number(v))}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatRs(Number(value ?? 0), currency), 'Sales']}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="sales" fill="#4F46E5" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue (Admin & Manager) */}
        {!isStaff ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Monthly Revenue</h2>
                <p className="text-xs text-slate-500">6-month revenue trend against expenses</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Full Report <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.monthlyRevenue} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => formatCompactRs(Number(v))}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatRs(Number(value ?? 0), currency),
                      name === 'revenue' ? 'Revenue' : 'Expenses',
                    ]}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4F46E5"
                    strokeWidth={2.2}
                    fill="url(#revFill)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#F43F5E"
                    strokeWidth={1.8}
                    fillOpacity={0}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Counter Quick Actions</h2>
                <p className="text-xs text-slate-500">Frequently used retail floor workflows</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: 'New POS Sale', desc: 'Bill smartphones & accessories', target: 'pos' as NavSectionId, icon: ShoppingCart },
                { label: 'Register Customer', desc: 'Add buyer contact details', target: 'customers' as NavSectionId, icon: Plus },
                { label: 'Log Repair Ticket', desc: 'Intake customer handset', target: 'repairs' as NavSectionId, icon: Wrench },
                { label: 'Check IMEI Warranty', desc: 'Verify active coverage', target: 'warranties' as NavSectionId, icon: ShieldCheck },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => onNavigate(action.target)}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{action.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sales by Category */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Sales by Category</h2>
            <p className="text-xs text-slate-500">Revenue split across smartphones and accessories</p>
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.salesByCategory}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCompactRs(Number(v))}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={108}
                  tick={{ fontSize: 12, fill: '#334155' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatRs(Number(value ?? 0), currency), 'Revenue']}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                  {metrics.salesByCategory.map((_, index) => (
                    <Cell key={`cat-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Payment Methods</h2>
            <p className="text-xs text-slate-500">Collected receipts by Cash, JazzCash, EasyPaisa, Bank & Card</p>
          </div>
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
            <div className="h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.paymentMethods}
                    dataKey="amount"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {metrics.paymentMethods.map((_, index) => (
                      <Cell key={`pm-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatRs(Number(value ?? 0), currency), 'Collected']}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {metrics.paymentMethods.map((item, idx) => (
                <div key={item.method} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-xs"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="truncate font-medium text-slate-700">{item.method}</span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="font-semibold text-slate-900">
                      {formatRs(item.amount, currency)}
                    </span>
                    <span className="ml-1.5 text-slate-400">({item.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Operational Widgets Grid */}
      <section aria-label="Operational highlights" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Sales */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Recent Sales</h2>
            <button
              type="button"
              onClick={() => onNavigate('sales')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                  <th className="px-5 py-2.5 font-medium">Invoice</th>
                  <th className="px-3 py-2.5 font-medium">Customer</th>
                  <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono font-medium text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <p className="font-medium text-slate-900">{sale.customerName}</p>
                      <p className="text-[11px] text-slate-500">{formatShortDate(sale.date)}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      {formatRs(sale.grandTotal, currency)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                          sale.paymentStatus === 'Paid'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : sale.paymentStatus === 'Partial'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Low Stock Alerts</h2>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Manage Stock
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {lowStockPreview.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">{item.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {item.brand} · {item.category}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                      item.quantity === 0
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.quantity} left (min {item.minStock})
                  </span>
                </div>
              </div>
            ))}
            {lowStockPreview.length === 0 && (
              <p className="px-5 py-8 text-center text-xs text-slate-500">
                All tracked products are above minimum stock levels.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Bottom 3 Operational Widgets */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Customers */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Recent Customers</h2>
            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Directory
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentCustomers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">{customer.name}</p>
                  <p className="text-[11px] text-slate-500 tabular-nums">{customer.phone}</p>
                </div>
                <div className="shrink-0 text-right tabular-nums">
                  <p className="text-xs font-semibold text-slate-900">
                    {formatRs(customer.totalPurchases, currency)}
                  </p>
                  {customer.outstandingBalance > 0 ? (
                    <p className="text-[11px] font-medium text-amber-700">
                      Due {formatRs(customer.outstandingBalance, currency)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-600">Settled</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Repairs */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Recent Repairs</h2>
            <button
              type="button"
              onClick={() => onNavigate('repairs')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              All Tickets
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentRepairs.map((repair) => (
              <div key={repair.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {repair.brand} {repair.model}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {repair.customerName} · {repair.problem}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${getRepairBadgeClass(
                    repair.status,
                  )}`}
                >
                  {repair.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Warranty Expirations */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Warranty Expirations</h2>
            <button
              type="button"
              onClick={() => onNavigate('warranties')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Check IMEI
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingWarranties.map((w) => {
              const remaining = daysUntil(w.expiryDate);
              return (
                <div key={w.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900">{w.productName}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {w.customerName} · <span className="font-mono">{w.imei.slice(-6)}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                        remaining <= 30
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {remaining > 0 ? `${remaining}d left` : 'Expired'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
