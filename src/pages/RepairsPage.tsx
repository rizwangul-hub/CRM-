import { useMemo, useState } from 'react';
import { Pencil, Plus, Printer, Search, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import type { RepairStatus, RepairTicket } from '../types/crm';
import { formatRs, formatShortDate } from '../utils/format';

const REPAIR_STATUSES: RepairStatus[] = [
  'Received',
  'Diagnosing',
  'Waiting for Parts',
  'In Progress',
  'Ready for Delivery',
  'Delivered',
];

function badgeStyle(status: RepairStatus): string {
  switch (status) {
    case 'Ready for Delivery':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'Delivered':
      return 'border-slate-200 bg-slate-100 text-slate-700';
    case 'In Progress':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case 'Waiting for Parts':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'Diagnosing':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

export function RepairsPage() {
  const { state, addRepair, updateRepair, updateRepairStatus, deleteRepair } = useCrm();
  const { notify } = useToast();
  const currency = state.settings.currency;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RepairTicket | null>(null);
  const [receipt, setReceipt] = useState<RepairTicket | null>(null);
  const [deleting, setDeleting] = useState<RepairTicket | null>(null);

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    brand: 'Apple',
    model: '',
    imei: '',
    problem: '',
    technician: 'Salman Raza',
    estimatedCost: '',
    finalCost: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    status: 'Received' as RepairStatus,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.repairs.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.ticketNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.imei.toLowerCase().includes(q)
      );
    });
  }, [state.repairs, search, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      customerName: '',
      phone: '',
      brand: 'Samsung',
      model: '',
      imei: '',
      problem: '',
      technician: 'Salman Raza',
      estimatedCost: '',
      finalCost: '',
      receivedDate: new Date().toISOString().slice(0, 10),
      deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      status: 'Received',
    });
    setFormOpen(true);
  };

  const openEdit = (r: RepairTicket) => {
    setEditing(r);
    setForm({
      customerName: r.customerName,
      phone: r.phone,
      brand: r.brand,
      model: r.model,
      imei: r.imei,
      problem: r.problem,
      technician: r.technician,
      estimatedCost: String(r.estimatedCost),
      finalCost: String(r.finalCost),
      receivedDate: r.receivedDate,
      deliveryDate: r.deliveryDate,
      status: r.status,
    });
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      imei: form.imei.trim() || 'N/A',
      problem: form.problem.trim(),
      technician: form.technician.trim(),
      estimatedCost: Math.max(0, Number(form.estimatedCost) || 0),
      finalCost: Math.max(0, Number(form.finalCost) || Number(form.estimatedCost) || 0),
      receivedDate: form.receivedDate,
      deliveryDate: form.deliveryDate,
      status: form.status,
    };
    if (editing) {
      updateRepair(editing.id, payload);
      notify('success', 'Repair ticket updated', `${editing.ticketNumber} saved.`);
    } else {
      const created = addRepair(payload);
      notify('success', `Ticket ${created.ticketNumber} created`, `${payload.brand} ${payload.model} logged.`);
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
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
              placeholder="Search ticket #, customer, model, IMEI..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <select
            aria-label="Filter by repair status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            {REPAIR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <Button type="button" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Repair Ticket
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                <th className="px-4 py-3 font-semibold">Ticket #</th>
                <th className="px-3 py-3 font-semibold">Customer</th>
                <th className="px-3 py-3 font-semibold">Device & IMEI</th>
                <th className="px-3 py-3 font-semibold">Problem / Tech</th>
                <th className="px-3 py-3 text-right font-semibold">Est / Final</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-slate-900">{ticket.ticketNumber}</p>
                    <p className="text-[11px] text-slate-500">Due {formatShortDate(ticket.deliveryDate)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">{ticket.customerName}</p>
                    <p className="text-[11px] text-slate-500 tabular-nums">{ticket.phone}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">
                      {ticket.brand} {ticket.model}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500">{ticket.imei}</p>
                  </td>
                  <td className="px-3 py-3 max-w-[200px]">
                    <p className="truncate font-medium text-slate-800">{ticket.problem}</p>
                    <p className="text-[11px] text-slate-500">Tech: {ticket.technician}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <p className="font-semibold text-slate-900">
                      {formatRs(ticket.finalCost || ticket.estimatedCost, currency)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Est: {formatRs(ticket.estimatedCost, currency)}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      aria-label={`Update status for ${ticket.ticketNumber}`}
                      value={ticket.status}
                      onChange={(e) => {
                        const nextStatus = e.target.value as RepairStatus;
                        updateRepairStatus(ticket.id, nextStatus);
                        notify('info', `${ticket.ticketNumber} status updated`, `Marked as ${nextStatus}.`);
                      }}
                      className={`rounded-md border px-2 py-1 text-[11px] font-medium cursor-pointer ${badgeStyle(
                        ticket.status,
                      )}`}
                    >
                      {REPAIR_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-white text-slate-900">
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setReceipt(ticket)}
                        aria-label={`Print receipt for ${ticket.ticketNumber}`}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                      >
                        <Printer className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(ticket)}
                        aria-label={`Edit ${ticket.ticketNumber}`}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(ticket)}
                        aria-label={`Delete ${ticket.ticketNumber}`}
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

      {/* Add / Edit Ticket Modal */}
      <Modal
        open={formOpen}
        title={editing ? `Edit ${editing.ticketNumber}` : 'New Repair Ticket'}
        onClose={() => setFormOpen(false)}
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
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
              <label className="block text-xs font-medium text-slate-700">Brand</label>
              <input
                required
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Model</label>
              <input
                required
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">IMEI</label>
              <input
                type="text"
                value={form.imei}
                onChange={(e) => setForm({ ...form, imei: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Assigned Technician</label>
              <input
                type="text"
                value={form.technician}
                onChange={(e) => setForm({ ...form, technician: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Problem Description</label>
              <input
                required
                type="text"
                value={form.problem}
                onChange={(e) => setForm({ ...form, problem: e.target.value })}
                placeholder="e.g. OLED screen replacement, charging IC issue"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Estimated Cost ({currency})</label>
              <input
                required
                type="number"
                min={0}
                value={form.estimatedCost}
                onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Final Cost ({currency})</label>
              <input
                type="number"
                min={0}
                value={form.finalCost}
                onChange={(e) => setForm({ ...form, finalCost: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Delivery Date</label>
              <input
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as RepairStatus })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {REPAIR_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Create Ticket'}</Button>
          </div>
        </form>
      </Modal>

      {/* Printable Repair Job Receipt Modal */}
      <Modal
        open={Boolean(receipt)}
        title={receipt ? `Repair Job Card — ${receipt.ticketNumber}` : 'Repair Receipt'}
        onClose={() => setReceipt(null)}
        maxWidthClass="max-w-md"
      >
        {receipt && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg border border-slate-200 p-4 space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <div>
                  <p className="font-bold text-slate-900">{state.settings.shopName}</p>
                  <p className="text-[11px] text-slate-500">{state.settings.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-900">{receipt.ticketNumber}</p>
                  <p className="text-[11px] text-slate-500">{formatShortDate(receipt.receivedDate)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-slate-500">Customer</p>
                  <p className="font-semibold text-slate-900">{receipt.customerName}</p>
                  <p className="text-slate-600 tabular-nums">{receipt.phone}</p>
                </div>
                <div>
                  <p className="text-slate-500">Device</p>
                  <p className="font-semibold text-slate-900">
                    {receipt.brand} {receipt.model}
                  </p>
                  <p className="font-mono text-[11px] text-slate-600">{receipt.imei}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2">
                <p className="text-slate-500">Reported Issue</p>
                <p className="font-medium text-slate-900">{receipt.problem}</p>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900 tabular-nums">
                <span>Estimated / Final Charge</span>
                <span>{formatRs(receipt.finalCost || receipt.estimatedCost, currency)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 print:hidden">
              <Button type="button" variant="secondary" onClick={() => setReceipt(null)}>
                Close
              </Button>
              <Button type="button" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                Print Job Card
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Repair Ticket"
        message={`Delete repair ticket ${deleting?.ticketNumber}?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteRepair(deleting.id);
            notify('success', 'Ticket deleted');
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
