import { useCallback, useEffect, useState } from 'react';
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
import { RefreshCw } from 'lucide-react';
import { fetchDashboardOverview } from '../services/dashboardService';
import type { DashboardOverview } from '../types/dashboard';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { formatCompactPKR, formatPKR, formatShortDate } from '../utils/format';
import { useRole } from '../context/RoleContext';
import type { NavSectionId } from '../config/navigation';

interface DashboardPageProps {
  onNavigate: (section: NavSectionId) => void;
  onShopNameLoaded?: (shopName: string) => void;
}

const CHART_COLORS = ['#4F46E5', '#0F172A', '#0EA5E9', '#10B981', '#F59E0B', '#64748B'];

function paymentStatusTextClass(status: string): string {
  switch (status) {
    case 'PAID':
      return 'text-emerald-700';
    case 'PARTIAL':
      return 'text-amber-700';
    default:
      return 'text-red-700';
  }
}

function repairStatusTextClass(status: string): string {
  switch (status) {
    case 'Ready for Delivery':
    case 'Delivered':
      return 'text-emerald-700';
    case 'Waiting for Parts':
      return 'text-amber-700';
    case 'Cancelled':
      return 'text-red-700';
    default:
      return 'text-indigo-700';
  }
}

export function DashboardPage({ onNavigate, onShopNameLoaded }: DashboardPageProps) {
  const { role, profile } = useRole();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(
    async (isBackgroundRefresh = false) => {
      if (isBackgroundRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const overview = await fetchDashboardOverview();
        setData(overview);
        onShopNameLoaded?.(overview.shop.shopName);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard metrics.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [onShopNameLoaded],
  );

  useEffect(() => {
    void loadOverview(Boolean(data));
    // Re-fetch cleanly whenever the active role changes without full reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Unable to load business metrics"
        description={error || 'Dashboard data could not be retrieved from the database.'}
        action={
          <Button type="button" onClick={() => void loadOverview(false)}>
            Retry Loading
          </Button>
        }
      />
    );
  }

  const { summary, charts, widgets, shop, permissions } = data;
  const currency = shop.currency;

  const kpiCards = [
    {
      label: 'Sales Today',
      value: formatPKR(summary.totalSalesTodayPaisa, currency),
      detail: `${summary.salesTodayCount} ${summary.salesTodayCount === 1 ? 'invoice' : 'invoices'} today`,
      tone: 'default' as const,
    },
    {
      label: 'Sales This Month',
      value: formatPKR(summary.totalSalesMonthPaisa, currency),
      detail: `${summary.salesMonthCount} invoices month-to-date`,
      tone: 'default' as const,
    },
    {
      label: 'Total Products',
      value: String(summary.totalProducts),
      detail: 'Active phones & accessories',
      tone: 'default' as const,
    },
    {
      label: 'Low Stock Alerts',
      value: String(summary.lowStockProducts),
      detail: summary.lowStockProducts > 0 ? 'At or below minimum level' : 'All stock healthy',
      tone: summary.lowStockProducts > 0 ? ('warning' as const) : ('success' as const),
    },
    {
      label: 'Total Customers',
      value: String(summary.totalCustomers),
      detail: 'Registered CRM profiles',
      tone: 'default' as const,
    },
    {
      label: 'Outstanding Payments',
      value: formatPKR(summary.totalOutstandingPaisa, currency),
      detail: `${summary.outstandingDebtorsCount} accounts with balance`,
      tone: summary.totalOutstandingPaisa > 0 ? ('warning' as const) : ('default' as const),
    },
    ...(permissions.canViewFinancials
      ? [
          {
            label: 'Monthly Expenses',
            value: formatPKR(summary.totalExpensesMonthPaisa, currency),
            detail: 'Rent, utilities & operations',
            tone: 'default' as const,
          },
          {
            label: 'Net Profit (MTD)',
            value: formatPKR(summary.netProfitMonthPaisa, currency),
            detail: `After COGS & expenses · ${summary.profitMarginPercent ?? 0}% margin`,
            tone:
              (summary.netProfitMonthPaisa ?? 0) >= 0
                ? ('success' as const)
                : ('danger' as const),
          },
        ]
      : []),
  ];

  const totalPaymentsReceived = charts.paymentMethods.reduce(
    (sum, item) => sum + item.totalPaisa,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Business Overview
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Live database metrics for {shop.shopName}
            {!permissions.canViewFinancials
              ? ` · Viewing ${profile.label} workspace (expenses & net profit restricted to Admin).`
              : ' · Full Admin financial & operational access.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={refreshing}
            onClick={() => void loadOverview(true)}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh Data
          </Button>
          {role === 'ADMIN' && (
            <Button
              type="button"
              size="sm"
              onClick={() => onNavigate('staff')}
            >
              User Management
            </Button>
          )}
        </div>
      </div>

      {/* KPI Summary Grid */}
      <section aria-label="Key business metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => {
            const valueColor =
              card.tone === 'success'
                ? 'text-emerald-700'
                : card.tone === 'warning'
                  ? 'text-amber-700'
                  : card.tone === 'danger'
                    ? 'text-red-700'
                    : 'text-slate-900';

            return (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
              >
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums font-mono ${valueColor}`}>
                  {card.value}
                </p>
                <p className="mt-2 text-xs text-slate-500">{card.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Primary Charts Row: Daily Sales + Monthly Revenue */}
      <section aria-label="Sales and revenue charts" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily Sales Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Daily Sales (Last 14 Days)</h3>
              <p className="mt-0.5 text-xs text-slate-500">Invoice totals aggregated by day</p>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">{currency}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={charts.dailySales}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dailySalesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={68}
                  tickFormatter={(val: number) => formatCompactPKR(val, '')}
                />
                <Tooltip
                  formatter={(value) => [
                    formatPKR(Number(value ?? 0), currency),
                    'Sales',
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenuePaisa"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fill="url(#dailySalesFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {permissions.canViewFinancials
                  ? 'Monthly Revenue vs Expenses (6 Months)'
                  : 'Monthly Revenue Trend (6 Months)'}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {permissions.canViewFinancials
                  ? 'Revenue compared against operating expenses'
                  : 'Monthly gross invoice volume'}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">{currency}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts.monthlyRevenue}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={68}
                  tickFormatter={(val: number) => formatCompactPKR(val, '')}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatPKR(Number(value ?? 0), currency),
                    name === 'revenuePaisa' ? 'Revenue' : 'Expenses',
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="revenuePaisa"
                  fill="#4F46E5"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                  isAnimationActive={false}
                />
                {permissions.canViewFinancials && (
                  <Bar
                    dataKey="expensesPaisa"
                    fill="#94A3B8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    isAnimationActive={false}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Secondary Charts Row: Category Sales + Payment Method Breakdown */}
      <section aria-label="Category and payment charts" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales by Product Category */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Sales by Product Category</h3>
            <p className="mt-0.5 text-xs text-slate-500">Revenue contribution across mobile & accessory lines</p>
          </div>
          {charts.salesByCategory.length === 0 ? (
            <EmptyState
              title="No category sales yet"
              description="Sales totals grouped by product category will appear here once invoices are recorded."
            />
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.salesByCategory}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                    tickFormatter={(val: number) => formatCompactPKR(val, '')}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={118}
                    tick={{ fontSize: 11, fill: '#334155' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatPKR(Number(value ?? 0), currency),
                      'Revenue',
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="revenuePaisa"
                    fill="#0F172A"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Payment Method Breakdown</h3>
            <p className="mt-0.5 text-xs text-slate-500">Collections by Cash, Bank Transfer, JazzCash, EasyPaisa & Card</p>
          </div>
          {charts.paymentMethods.length === 0 ? (
            <EmptyState
              title="No payments recorded"
              description="Collected payment methods will appear here after your first POS transaction."
            />
          ) : (
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
              <div className="h-52 sm:col-span-5">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.paymentMethods}
                      dataKey="totalPaisa"
                      nameKey="method"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {charts.paymentMethods.map((entry, index) => (
                        <Cell
                          key={entry.method}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        formatPKR(Number(value ?? 0), currency),
                        'Collected',
                      ]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="sm:col-span-7 divide-y divide-slate-100">
                {charts.paymentMethods.map((pm, index) => {
                  const share =
                    totalPaymentsReceived > 0
                      ? Math.round((pm.totalPaisa / totalPaymentsReceived) * 100)
                      : 0;
                  return (
                    <div
                      key={pm.method}
                      className="flex items-center justify-between gap-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          aria-hidden="true"
                        />
                        <span className="truncate font-medium text-slate-800">{pm.method}</span>
                        <span className="text-slate-400">· {pm.count}</span>
                      </div>
                      <div className="text-right font-mono tabular-nums shrink-0">
                        <span className="font-medium text-slate-900">
                          {formatPKR(pm.totalPaisa, currency)}
                        </span>
                        <span className="ml-2 text-slate-500">{share}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Operational Widgets Row 1: Recent Sales + Low Stock Alerts */}
      <section aria-label="Recent sales and stock alerts" className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Recent Sales */}
        <div className="rounded-xl border border-slate-200 bg-white xl:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Sales</h3>
              <p className="text-xs text-slate-500">Latest counter invoices from database</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('pos')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap cursor-pointer"
            >
              Open POS
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Method</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {widgets.recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <span className="block truncate max-w-[160px]">{sale.customerName}</span>
                      <span className="text-[11px] text-slate-400">
                        {formatShortDate(sale.soldAt)} · {sale.itemCount}{' '}
                        {sale.itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                      {sale.paymentMethod}
                    </td>
                    <td
                      className={`px-3 py-3 font-medium whitespace-nowrap ${paymentStatusTextClass(
                        sale.paymentStatus,
                      )}`}
                    >
                      {sale.paymentStatus === 'PAID'
                        ? 'Paid'
                        : sale.paymentStatus === 'PARTIAL'
                          ? 'Partial'
                          : 'Unpaid'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {formatPKR(sale.grandTotalPaisa, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white xl:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Low Stock Alerts</h3>
              <p className="text-xs text-slate-500">Items at or below reorder level</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap cursor-pointer"
            >
              View Stock
            </button>
          </div>
          {widgets.lowStockAlerts.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Stock levels healthy"
                description="No products are currently at or below their minimum stock threshold."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {widgets.lowStockAlerts.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-900">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {item.brand} · {item.category}
                      {item.sku ? ` · ${item.sku}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right font-mono tabular-nums">
                    <p
                      className={`text-xs font-semibold ${
                        item.quantity <= 1 ? 'text-red-700' : 'text-amber-700'
                      }`}
                    >
                      {item.quantity} left
                    </p>
                    <p className="text-[11px] text-slate-400">Min {item.minStockLevel}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Operational Widgets Row 2: Repairs + Warranties + Recent Customers */}
      <section aria-label="Repairs, warranties, and customers" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Repairs */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent Repairs</h3>
            <button
              type="button"
              onClick={() => onNavigate('repairs')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Tickets
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {widgets.recentRepairs.map((repair) => (
              <li key={repair.id} className="px-5 py-3.5 hover:bg-slate-50/70">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-slate-900">
                    {repair.ticketNumber}
                  </span>
                  <span className={`text-xs font-medium ${repairStatusTextClass(repair.status)}`}>
                    {repair.status}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-800">
                  {repair.device} · {repair.customerName}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{repair.problem}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Upcoming Warranty Expirations */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Upcoming Warranty Expirations</h3>
            <button
              type="button"
              onClick={() => onNavigate('warranties')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Lookup
            </button>
          </div>
          {widgets.upcomingWarranties.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No imminent expirations"
                description="No active warranties expire within the next 45 days."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {widgets.upcomingWarranties.map((w) => (
                <li key={w.id} className="px-5 py-3.5 hover:bg-slate-50/70">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-slate-900">
                      {w.productName}
                    </span>
                    <span
                      className={`shrink-0 font-mono text-xs font-medium tabular-nums ${
                        w.daysRemaining <= 15 ? 'text-amber-700' : 'text-slate-600'
                      }`}
                    >
                      {w.daysRemaining}d left
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {w.customerName} · {w.provider}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                    IMEI {w.imei} · Ends {formatShortDate(w.endDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Customers */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent Customers</h3>
            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Directory
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {widgets.recentCustomers.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/70"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-900">{c.fullName}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {c.mobileNumber} · {c.city}
                  </p>
                </div>
                <div className="shrink-0 text-right font-mono tabular-nums">
                  <p className="text-xs font-medium text-slate-900">
                    {formatPKR(c.totalPurchasesPaisa, currency)}
                  </p>
                  {c.outstandingBalancePaisa > 0 ? (
                    <p className="text-[11px] text-amber-700">
                      Due {formatPKR(c.outstandingBalancePaisa, currency)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-700">Settled</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
