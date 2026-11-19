import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import type { Expense, ExpenseCategory, PaymentMethod } from '../types/crm';
import { formatCompactRs, formatRs, formatShortDate } from '../utils/format';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Shop Rent',
  'Electricity',
  'Internet',
  'Salaries',
  'Transport',
  'Maintenance',
  'Marketing',
  'Other',
];

const BAR_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#64748B', '#14B8A6'];

export function ExpensesPage() {
  const { state, addExpense, updateExpense, deleteExpense } = useCrm();
  const { notify } = useToast();
  const currency = state.settings.currency;

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Shop Rent' as ExpenseCategory,
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Bank Transfer' as PaymentMethod,
    notes: '',
  });

  const filtered = useMemo(
    () =>
      state.expenses.filter((e) => categoryFilter === 'ALL' || e.category === categoryFilter),
    [state.expenses, categoryFilter],
  );

  const totalExpenses = useMemo(
    () => state.expenses.reduce((sum, e) => sum + e.amount, 0),
    [state.expenses],
  );

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of state.expenses) {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [state.expenses]);

  const monthlyTrend = useMemo(
    () => [
      { month: 'Jun', amount: 162000 },
      { month: 'Jul', amount: 171000 },
      { month: 'Aug', amount: 178000 },
      { month: 'Sep', amount: 174000 },
      { month: 'Oct', amount: 181000 },
      { month: 'Nov', amount: totalExpenses },
    ],
    [totalExpenses],
  );

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: '',
      category: 'Shop Rent',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Cash',
      notes: '',
    });
    setFormOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      title: e.title,
      category: e.category,
      amount: String(e.amount),
      date: e.date,
      paymentMethod: e.paymentMethod,
      notes: e.notes || '',
    });
    setFormOpen(true);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Math.max(0, Math.round(Number(form.amount) || 0));
    if (!form.title.trim() || amount <= 0) {
      notify('error', 'Enter a valid title and expense amount');
      return;
    }
    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount,
      date: form.date,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim() || undefined,
    };
    if (editing) {
      updateExpense(editing.id, payload);
      notify('success', 'Expense updated', `${payload.title} saved.`);
    } else {
      addExpense(payload);
      notify('success', 'Expense recorded', `${formatRs(amount, currency)} added to expenses.`);
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Monthly Expense Trend</h2>
              <p className="text-xs text-slate-500">Operating overhead across the past 6 months</p>
            </div>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {formatRs(totalExpenses, currency)}
            </span>
          </div>
          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => formatCompactRs(Number(v))}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatRs(Number(value ?? 0), currency), 'Expenses']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#F43F5E" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Expense Breakdown by Category</h2>
            <p className="text-xs text-slate-500">Current month cost distribution</p>
          </div>
          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBreakdown}
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
                  width={96}
                  tick={{ fontSize: 12, fill: '#334155' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatRs(Number(value ?? 0), currency), 'Spent']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                  {categoryBreakdown.map((_, idx) => (
                    <Cell key={`exp-cat-${idx}`} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter + Add Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', ...EXPENSE_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
        <Button type="button" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Expense
        </Button>
      </div>

      {/* Expenses Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                <th className="px-4 py-3 font-semibold">Expense</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Paid Via</th>
                <th className="px-3 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{exp.title}</p>
                    {exp.notes && <p className="text-[11px] text-slate-500">{exp.notes}</p>}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{formatShortDate(exp.date)}</td>
                  <td className="px-3 py-3 text-slate-600">{exp.paymentMethod}</td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">
                    {formatRs(exp.amount, currency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(exp)}
                        aria-label={`Edit ${exp.title}`}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(exp)}
                        aria-label={`Delete ${exp.title}`}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={formOpen} title={editing ? 'Edit Expense' : 'Record Shop Expense'} onClose={() => setFormOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Title</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Monthly Electricity Bill"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Amount ({currency})</label>
              <input
                required
                type="number"
                min={1}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Expense'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Expense"
        message={`Delete expense entry "${deleting?.title}"?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteExpense(deleting.id);
            notify('success', 'Expense deleted');
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
