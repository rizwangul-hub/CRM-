import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import type { Supplier } from '../types/crm';
import { formatRs, formatShortDate } from '../utils/format';

export function SuppliersPage() {
  const { state, addSupplier, updateSupplier, deleteSupplier } = useCrm();
  const { notify } = useToast();
  const currency = state.settings.currency;

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [viewing, setViewing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const [form, setForm] = useState({
    name: '',
    company: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.suppliers.filter((s) => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
      );
    });
  }, [state.suppliers, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', company: '', contactPerson: '', phone: '', email: '', address: '' });
    setFormOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      company: s.company,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      address: s.address,
    });
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      updateSupplier(editing.id, form);
      notify('success', 'Supplier updated', `${form.name} details saved.`);
    } else {
      addSupplier(form);
      notify('success', 'Supplier added', `${form.name} added to suppliers.`);
    }
    setFormOpen(false);
  };

  const linkedPurchases = useMemo(
    () => (viewing ? state.purchases.filter((p) => p.supplierId === viewing.id) : []),
    [viewing, state.purchases],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search distributor, contact person, or phone..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <Button type="button" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Supplier
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No suppliers found" description="Add wholesale suppliers to track stock purchases and payables." />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-3 py-3 font-semibold">Contact Person</th>
                  <th className="px-3 py-3 font-semibold">Phone</th>
                  <th className="px-3 py-3 text-right font-semibold">Total Purchases</th>
                  <th className="px-3 py-3 text-right font-semibold">Paid Amount</th>
                  <th className="px-3 py-3 text-right font-semibold">Outstanding</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-[11px] text-slate-500">{s.address}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{s.contactPerson}</td>
                    <td className="px-3 py-3 text-slate-700 tabular-nums">{s.phone}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      {formatRs(s.totalPurchases, currency)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-700 tabular-nums">
                      {formatRs(s.paidAmount, currency)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      <span className={s.outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-600'}>
                        {formatRs(s.outstandingBalance, currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewing(s)}
                          aria-label={`View ${s.name}`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          aria-label={`Edit ${s.name}`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(s)}
                          aria-label={`Delete ${s.name}`}
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
      )}

      <Modal open={formOpen} title={editing ? 'Edit Supplier' : 'Add Supplier'} onClose={() => setFormOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Supplier Name</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Company</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Contact Person</label>
              <input
                required
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Phone</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Supplier'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(viewing)}
        title={viewing?.name || 'Supplier Profile'}
        description={viewing ? `${viewing.contactPerson} · ${viewing.phone}` : ''}
        onClose={() => setViewing(null)}
        maxWidthClass="max-w-xl"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-4 text-xs">
              <div>
                <p className="text-slate-500">Total Purchases</p>
                <p className="mt-1 font-bold text-slate-900 tabular-nums">
                  {formatRs(viewing.totalPurchases, currency)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Total Paid</p>
                <p className="mt-1 font-bold text-emerald-700 tabular-nums">
                  {formatRs(viewing.paidAmount, currency)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Payable Balance</p>
                <p className="mt-1 font-bold text-amber-700 tabular-nums">
                  {formatRs(viewing.outstandingBalance, currency)}
                </p>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold text-slate-700">Purchase Orders</h3>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-xs">
                {linkedPurchases.length === 0 ? (
                  <p className="p-4 text-center text-slate-500">No purchase orders logged yet.</p>
                ) : (
                  linkedPurchases.map((po) => (
                    <div key={po.id} className="flex items-center justify-between px-3.5 py-2.5">
                      <div>
                        <p className="font-mono font-semibold text-slate-900">{po.invoiceNumber}</p>
                        <p className="text-[11px] text-slate-500">{formatShortDate(po.date)}</p>
                      </div>
                      <div className="text-right tabular-nums">
                        <p className="font-semibold text-slate-900">
                          {formatRs(po.totalAmount, currency)}
                        </p>
                        <p className="text-[11px] text-amber-700">
                          Due: {formatRs(po.remainingAmount, currency)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Supplier"
        message={`Remove ${deleting?.name} from suppliers?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteSupplier(deleting.id);
            notify('success', 'Supplier removed', `${deleting.name} deleted.`);
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
