import { useMemo, useState } from 'react';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import type { WarrantyStatus } from '../types/crm';
import { daysUntil, formatShortDate } from '../utils/format';

export function WarrantyPage() {
  const { state, addWarranty, updateWarrantyStatus } = useCrm();
  const { notify } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [openAdd, setOpenAdd] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    productName: '',
    imei: '',
    invoiceNumber: '',
    provider: 'Official Brand Warranty',
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  });

  const expiringSoonCount = useMemo(
    () =>
      state.warranties.filter((w) => {
        const d = daysUntil(w.expiryDate);
        return d > 0 && d <= 30 && w.status !== 'Expired';
      }).length,
    [state.warranties],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.warranties.filter((w) => {
      if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;
      if (!q) return true;
      return (
        w.imei.toLowerCase().includes(q) ||
        w.customerName.toLowerCase().includes(q) ||
        w.productName.toLowerCase().includes(q) ||
        w.invoiceNumber.toLowerCase().includes(q)
      );
    });
  }, [state.warranties, search, statusFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addWarranty({
      customerName: form.customerName.trim(),
      productName: form.productName.trim(),
      imei: form.imei.trim(),
      invoiceNumber: form.invoiceNumber.trim() || 'MANUAL',
      provider: form.provider.trim(),
      startDate: form.startDate,
      expiryDate: form.expiryDate,
      status: 'Active',
    });
    notify('success', 'Warranty registered', `IMEI ${form.imei} added to warranty tracker.`);
    setOpenAdd(false);
  };

  return (
    <div className="space-y-5">
      {expiringSoonCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <span>
              <strong>{expiringSoonCount} device warranties</strong> are expiring within the next 30
              days. Notify customers for extended protection or final checkups.
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Lookup by 15-digit IMEI, invoice #, or customer..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <select
            aria-label="Filter warranty status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Claimed">Claimed</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <Button type="button" size="sm" onClick={() => setOpenAdd(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Register Warranty
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                <th className="px-4 py-3 font-semibold">Customer & Invoice</th>
                <th className="px-3 py-3 font-semibold">Product</th>
                <th className="px-3 py-3 font-semibold">IMEI</th>
                <th className="px-3 py-3 font-semibold">Coverage Period</th>
                <th className="px-3 py-3 font-semibold">Remaining</th>
                <th className="px-4 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((w) => {
                const rem = daysUntil(w.expiryDate);
                return (
                  <tr key={w.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{w.customerName}</p>
                      <p className="font-mono text-[11px] text-slate-500">{w.invoiceNumber}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{w.productName}</p>
                      <p className="text-[11px] text-slate-500">{w.provider}</p>
                    </td>
                    <td className="px-3 py-3 font-mono font-medium text-slate-800">{w.imei}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatShortDate(w.startDate)} → {formatShortDate(w.expiryDate)}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <span
                        className={`font-medium ${
                          rem <= 0
                            ? 'text-red-600'
                            : rem <= 30
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                        }`}
                      >
                        {rem > 0 ? `${rem} days` : 'Expired'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        aria-label={`Warranty status for ${w.imei}`}
                        value={w.status}
                        onChange={(e) => {
                          updateWarrantyStatus(w.id, e.target.value as WarrantyStatus);
                          notify('info', 'Warranty status updated');
                        }}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Expiring Soon">Expiring Soon</option>
                        <option value="Claimed">Claimed</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={openAdd} title="Register Device Warranty" onClose={() => setOpenAdd(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">Customer Name</label>
              <input
                required
                type="text"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Invoice #</label>
              <input
                type="text"
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                placeholder="INV-2026-1042"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Product Name</label>
              <input
                required
                type="text"
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">IMEI Number</label>
              <input
                required
                type="text"
                value={form.imei}
                onChange={(e) => setForm({ ...form, imei: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Provider</label>
              <input
                type="text"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Expiry Date</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenAdd(false)}>
              Cancel
            </Button>
            <Button type="submit">Register Warranty</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
