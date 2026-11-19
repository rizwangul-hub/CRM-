import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useRole } from '../context/RoleContext';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import type { Customer } from '../types/crm';
import { formatRs, formatShortDate } from '../utils/format';

export function CustomersPage() {
  const { state, addCustomer, updateCustomer, deleteCustomer } = useCrm();
  const { role } = useRole();
  const { notify } = useToast();

  const canDelete = role === 'ADMIN' || role === 'MANAGER';
  const currency = state.settings.currency;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [profileCustomer, setProfileCustomer] = useState<Customer | null>(null);
  const [profileTab, setProfileTab] = useState<'purchases' | 'payments' | 'repairs'>('purchases');
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Lahore',
    address: '',
    status: 'Active' as Customer['status'],
    notes: '',
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.customers.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
  }, [state.customers, search, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      phone: '',
      email: '',
      city: 'Lahore',
      address: '',
      status: 'Active',
      notes: '',
    });
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      city: c.city,
      address: c.address,
      status: c.status,
      notes: c.notes || '',
    });
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      notify('error', 'Name and phone are required');
      return;
    }
    if (editing) {
      updateCustomer(editing.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        status: form.status,
        notes: form.notes.trim(),
      });
      notify('success', 'Customer updated', `${form.name.trim()} profile saved.`);
    } else {
      addCustomer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        status: form.status,
        notes: form.notes.trim(),
      });
      notify('success', 'Customer added', `${form.name.trim()} registered in CRM.`);
    }
    setFormOpen(false);
  };

  const customerSales = useMemo(
    () =>
      profileCustomer
        ? state.sales.filter((s) => s.customerId === profileCustomer.id)
        : [],
    [profileCustomer, state.sales],
  );
  const customerPayments = useMemo(
    () =>
      profileCustomer
        ? state.payments.filter((p) => p.customerId === profileCustomer.id)
        : [],
    [profileCustomer, state.payments],
  );
  const customerRepairs = useMemo(
    () =>
      profileCustomer
        ? state.repairs.filter(
            (r) => r.customerId === profileCustomer.id || r.phone === profileCustomer.phone,
          )
        : [],
    [profileCustomer, state.repairs],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email, or city..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <select
            aria-label="Filter customer status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="VIP">VIP</option>
            <option value="Credit Hold">Credit Hold</option>
          </select>
        </div>

        <Button type="button" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Customer
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Try another search query or register a new customer."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Contact</th>
                  <th className="px-3 py-3 text-right font-semibold">Total Purchases</th>
                  <th className="px-3 py-3 text-right font-semibold">Outstanding</th>
                  <th className="px-3 py-3 font-semibold">Registered</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{customer.name}</p>
                      <p className="text-[11px] text-slate-500">{customer.city}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-800 tabular-nums">{customer.phone}</p>
                      <p className="text-[11px] text-slate-500">{customer.email || '—'}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      {formatRs(customer.totalPurchases, currency)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span
                        className={
                          customer.outstandingBalance > 0
                            ? 'font-semibold text-amber-700'
                            : 'text-emerald-600'
                        }
                      >
                        {formatRs(customer.outstandingBalance, currency)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatShortDate(customer.registeredAt)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                          customer.status === 'VIP'
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                            : customer.status === 'Credit Hold'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileCustomer(customer);
                            setProfileTab('purchases');
                          }}
                          aria-label={`View profile for ${customer.name}`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(customer)}
                          aria-label={`Edit ${customer.name}`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleting(customer)}
                            aria-label={`Delete ${customer.name}`}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        open={formOpen}
        title={editing ? 'Edit Customer' : 'Register New Customer'}
        onClose={() => setFormOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Full Name</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Phone Number</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0300-1234567"
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
            <div>
              <label className="block text-xs font-medium text-slate-700">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Customer['status'] })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Active">Active</option>
                <option value="VIP">VIP</option>
                <option value="Credit Hold">Credit Hold</option>
              </select>
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
            <Button type="submit">{editing ? 'Save Changes' : 'Add Customer'}</Button>
          </div>
        </form>
      </Modal>

      {/* Customer Profile Modal */}
      <Modal
        open={Boolean(profileCustomer)}
        title={profileCustomer ? `${profileCustomer.name} — Customer Profile` : 'Customer Profile'}
        description={
          profileCustomer ? `${profileCustomer.phone} · ${profileCustomer.email || profileCustomer.city}` : ''
        }
        onClose={() => setProfileCustomer(null)}
        maxWidthClass="max-w-2xl"
      >
        {profileCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-4 text-xs">
              <div>
                <p className="text-slate-500">Total Purchases</p>
                <p className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                  {formatRs(profileCustomer.totalPurchases, currency)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Total Paid</p>
                <p className="mt-1 text-base font-bold text-emerald-700 tabular-nums">
                  {formatRs(profileCustomer.totalPaid, currency)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Outstanding Balance</p>
                <p className="mt-1 text-base font-bold text-amber-700 tabular-nums">
                  {formatRs(profileCustomer.outstandingBalance, currency)}
                </p>
              </div>
            </div>

            <div className="flex gap-1.5 border-b border-slate-200 pb-2">
              {(
                [
                  ['purchases', `Purchases (${customerSales.length})`],
                  ['payments', `Payments (${customerPayments.length})`],
                  ['repairs', `Repairs (${customerRepairs.length})`],
                ] as const
              ).map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setProfileTab(tabId)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer ${
                    profileTab === tabId
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {profileTab === 'purchases' && (
              <div className="divide-y divide-slate-100 text-xs">
                {customerSales.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">No invoices recorded yet.</p>
                ) : (
                  customerSales.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="font-mono font-semibold text-slate-900">{s.invoiceNumber}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatShortDate(s.date)} · {s.items.map((i) => i.productName).join(', ')}
                        </p>
                      </div>
                      <div className="text-right tabular-nums">
                        <p className="font-semibold text-slate-900">{formatRs(s.grandTotal, currency)}</p>
                        <p className="text-[11px] text-slate-500">{s.paymentStatus}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {profileTab === 'payments' && (
              <div className="divide-y divide-slate-100 text-xs">
                {customerPayments.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">No payment receipts logged.</p>
                ) : (
                  customerPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="font-semibold text-slate-900">{p.method}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatShortDate(p.date)} {p.invoiceNumber ? `· ${p.invoiceNumber}` : ''}
                        </p>
                      </div>
                      <p className="font-semibold text-emerald-700 tabular-nums">
                        +{formatRs(p.amount, currency)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {profileTab === 'repairs' && (
              <div className="divide-y divide-slate-100 text-xs">
                {customerRepairs.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">No repair tickets for this customer.</p>
                ) : (
                  customerRepairs.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {r.brand} {r.model} ({r.ticketNumber})
                        </p>
                        <p className="text-[11px] text-slate-500">{r.problem}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900 tabular-nums">
                          {formatRs(r.finalCost || r.estimatedCost, currency)}
                        </p>
                        <p className="text-[11px] text-indigo-600">{r.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Customer"
        message={`Remove ${deleting?.name} from the customer directory?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteCustomer(deleting.id);
            notify('success', 'Customer removed', `${deleting.name} deleted.`);
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
