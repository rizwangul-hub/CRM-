import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../components/ui/Button';
import { useRole } from '../context/RoleContext';
import { useToast } from '../context/ToastContext';
import { computeDashboardMetrics } from '../store/crmEngine';
import { useCrm } from '../store/crmStore';
import { downloadCsv, formatCompactRs, formatRs } from '../utils/format';

type ReportPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

const PERIOD_MULTIPLIER: Record<ReportPeriod, number> = {
  Daily: 0.08,
  Weekly: 0.28,
  Monthly: 1,
  Yearly: 11.6,
};

export function ReportsPage() {
  const { state } = useCrm();
  const { role } = useRole();
  const { notify } = useToast();
  const currency = state.settings.currency;
  const isAdmin = role === 'ADMIN';

  const [period, setPeriod] = useState<ReportPeriod>('Monthly');

  const metrics = useMemo(() => computeDashboardMetrics(state), [state]);

  const scaled = useMemo(() => {
    if (period === 'Daily') {
      return {
        revenue: metrics.todaysSales,
        expenses: Math.round(metrics.totalExpenses / 30),
        profit: Math.round(metrics.todaysSales * 0.16),
      };
    }
    const mult = PERIOD_MULTIPLIER[period];
    return {
      revenue: Math.round(metrics.monthlySales * mult),
      expenses: Math.round(metrics.totalExpenses * mult),
      profit: Math.round(metrics.estimatedProfit * mult),
    };
  }, [metrics, period]);

  const stockValuation = useMemo(() => {
    const costValue = state.products.reduce((s, p) => s + p.purchasePrice * p.quantity, 0);
    const retailValue = state.products.reduce((s, p) => s + p.sellingPrice * p.quantity, 0);
    return { costValue, retailValue };
  }, [state.products]);

  const topSellingProducts = useMemo(() => {
    const map = new Map<string, { name: string; units: number; revenue: number }>();
    for (const sale of state.sales) {
      for (const item of sale.items) {
        const prev = map.get(item.productId) || {
          name: item.productName,
          units: 0,
          revenue: 0,
        };
        map.set(item.productId, {
          name: item.productName,
          units: prev.units + item.quantity,
          revenue: prev.revenue + item.lineTotal,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [state.sales]);

  const handleExportCsv = () => {
    downloadCsv(
      `celltrack-sales-report-${period.toLowerCase()}.csv`,
      ['Invoice #', 'Date', 'Customer', 'Payment Method', 'Grand Total', 'Paid', 'Balance', 'Status'],
      state.sales.map((s) => [
        s.invoiceNumber,
        s.date,
        s.customerName,
        s.paymentMethod,
        s.grandTotal,
        s.paidAmount,
        s.remainingBalance,
        s.paymentStatus,
      ]),
    );
    notify('success', 'CSV Report Exported', `Downloaded ${period} sales & balance ledger.`);
  };

  return (
    <div className="space-y-6">
      {/* Period Selector & Export Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                period === p
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={handleExportCsv}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export CSV
          </Button>
          <Button type="button" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print Report
          </Button>
        </div>
      </div>

      {!isAdmin && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-xs text-indigo-900">
          Manager View: Showing operational revenue, stock valuation, and balance reports. Switch to{' '}
          <strong>Admin</strong> in the top header to view net COGS profit margins.
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">{period} Revenue</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums font-display">
            {formatRs(scaled.revenue, currency)}
          </p>
          <p className="mt-1 text-xs text-emerald-600">Gross retail sales</p>
        </div>
        {isAdmin && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <p className="text-xs font-medium text-slate-500">{period} Estimated Profit</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums font-display">
              {formatRs(scaled.profit, currency)}
            </p>
            <p className="mt-1 text-xs text-slate-500">After COGS, returns & overhead</p>
          </div>
        )}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">{period} Expenses</p>
          <p className="mt-2 text-2xl font-bold text-rose-600 tabular-nums font-display">
            {formatRs(scaled.expenses, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Rent, utilities, salaries & ops</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Stock Valuation (Cost)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums font-display">
            {formatRs(stockValuation.costValue, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Retail Value: {formatRs(stockValuation.retailValue, currency)}
          </p>
        </div>
      </div>

      {/* Revenue vs Expense Comparison Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Revenue vs Operating Expenses</h2>
          <p className="text-xs text-slate-500">6-month shop performance comparison</p>
        </div>
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.monthlyRevenue} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
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
                contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
              />
              <Bar dataKey="revenue" fill="#4F46E5" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row: Top Selling Products, Customer Balances, Supplier Balances */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Top Selling Products</h3>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {topSellingProducts.map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{p.name}</p>
                  <p className="text-[11px] text-slate-500">{p.units} units sold</p>
                </div>
                <p className="shrink-0 font-semibold text-slate-900 tabular-nums">
                  {formatRs(p.revenue, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Customer Balances</h3>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {state.customers
              .filter((c) => c.outstandingBalance > 0)
              .map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{c.name}</p>
                    <p className="text-[11px] text-slate-500 tabular-nums">{c.phone}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-amber-700 tabular-nums">
                    {formatRs(c.outstandingBalance, currency)}
                  </p>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Supplier Balances</h3>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {state.suppliers.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{s.name}</p>
                  <p className="text-[11px] text-slate-500">{s.contactPerson}</p>
                </div>
                <p
                  className={`shrink-0 font-semibold tabular-nums ${
                    s.outstandingBalance > 0 ? 'text-amber-700' : 'text-emerald-600'
                  }`}
                >
                  {formatRs(s.outstandingBalance, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
