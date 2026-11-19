import { useMemo, useState } from 'react';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import type { PaymentMethod, Purchase } from '../types/crm';
import { formatRs, formatShortDate } from '../utils/format';

interface DraftLine {
  productId: string;
  quantity: number;
  unitCost: number;
}

export function PurchasesPage() {
  const { state, createPurchase } = useCrm();
  const { notify } = useToast();
  const currency = state.settings.currency;

  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<Purchase | null>(null);

  const [supplierId, setSupplierId] = useState(state.suppliers[0]?.id || '');
  const [lines, setLines] = useState<DraftLine[]>(() =>
    state.products[0]
      ? [{ productId: state.products[0].id, quantity: 3, unitCost: state.products[0].purchasePrice }]
      : [],
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [paidInput, setPaidInput] = useState('');
  const [notes, setNotes] = useState('');

  const totalAmount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0),
    [lines],
  );
  const paidAmount =
    paidInput.trim() === '' ? totalAmount : Math.min(Math.max(0, Number(paidInput) || 0), totalAmount);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const addLine = () => {
    const prod = state.products[0];
    if (!prod) return;
    setLines((prev) => [
      ...prev,
      { productId: prod.id, quantity: 2, unitCost: prod.purchasePrice },
    ]);
  };

  const updateLine = (idx: number, patch: Partial<DraftLine>) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const next = { ...l, ...patch };
        if (patch.productId) {
          const prod = state.products.find((p) => p.id === patch.productId);
          if (prod) next.unitCost = prod.purchasePrice;
        }
        return next;
      }),
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const po = createPurchase({
        supplierId,
        items: lines,
        paidAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      notify(
        'success',
        `Purchase ${po.invoiceNumber} recorded`,
        `Inventory restocked and supplier balance updated.`,
      );
      setCreateOpen(false);
      setPaidInput('');
      setNotes('');
    } catch (err) {
      notify('error', 'Failed to record purchase', err instanceof Error ? err.message : 'Check fields');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Stock Purchase Orders</h2>
          <p className="text-xs text-slate-500">
            Recording a purchase automatically increments product stock and updates supplier balances.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Purchase Order
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                <th className="px-4 py-3 font-semibold">PO #</th>
                <th className="px-3 py-3 font-semibold">Supplier</th>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Items</th>
                <th className="px-3 py-3 text-right font-semibold">Total</th>
                <th className="px-3 py-3 text-right font-semibold">Paid</th>
                <th className="px-3 py-3 text-right font-semibold">Remaining</th>
                <th className="px-4 py-3 text-right font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.purchases.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                    {po.invoiceNumber}
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-800">{po.supplierName}</td>
                  <td className="px-3 py-3 text-slate-600">{formatShortDate(po.date)}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {po.items.reduce((s, i) => s + i.quantity, 0)} units ({po.items.length} SKUs)
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">
                    {formatRs(po.totalAmount, currency)}
                  </td>
                  <td className="px-3 py-3 text-right text-emerald-700 tabular-nums">
                    {formatRs(po.paidAmount, currency)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">
                    <span className={po.remainingAmount > 0 ? 'text-amber-700' : 'text-slate-500'}>
                      {formatRs(po.remainingAmount, currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setViewing(po)}
                      aria-label={`View ${po.invoiceNumber}`}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      <Modal
        open={createOpen}
        title="Create Stock Purchase Order"
        description="Select supplier and products to restock inventory immediately."
        onClose={() => setCreateOpen(false)}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {state.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Products</span>
              <Button type="button" size="sm" variant="secondary" onClick={addLine}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add Product Row
              </Button>
            </div>
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5"
              >
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-[11px] text-slate-500">Product</label>
                  <select
                    value={line.productId}
                    onChange={(e) => updateLine(idx, { productId: e.target.value })}
                    className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
                  >
                    {state.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-[11px] text-slate-500">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs tabular-nums"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-[11px] text-slate-500">Unit Cost ({currency})</label>
                  <input
                    type="number"
                    min={0}
                    value={line.unitCost}
                    onChange={(e) => updateLine(idx, { unitCost: Math.max(0, Number(e.target.value) || 0) })}
                    className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs tabular-nums"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 text-right">
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Remove row"
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3.5 sm:grid-cols-3 text-xs">
            <div>
              <p className="text-slate-500">Total Order Value</p>
              <p className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                {formatRs(totalAmount, currency)}
              </p>
            </div>
            <div>
              <label className="block text-slate-500">Paid Now ({currency})</label>
              <input
                type="number"
                min={0}
                value={paidInput}
                onChange={(e) => setPaidInput(e.target.value)}
                placeholder={String(totalAmount)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs tabular-nums"
              />
            </div>
            <div>
              <p className="text-slate-500">Remaining Payable</p>
              <p className="mt-1 text-base font-bold text-amber-700 tabular-nums">
                {formatRs(remainingAmount, currency)}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Purchase & Restock</Button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        open={Boolean(viewing)}
        title={viewing ? `Purchase Order ${viewing.invoiceNumber}` : 'Purchase Details'}
        description={viewing ? `${viewing.supplierName} · ${formatShortDate(viewing.date)}` : ''}
        onClose={() => setViewing(null)}
      >
        {viewing && (
          <div className="space-y-4 text-xs">
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {viewing.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3.5 py-2.5">
                  <div>
                    <p className="font-semibold text-slate-900">{item.productName}</p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {item.quantity} × {formatRs(item.unitCost, currency)}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900 tabular-nums">
                    {formatRs(item.lineTotal, currency)}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 rounded-lg bg-slate-50 p-3.5 tabular-nums">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Total Amount</span>
                <span>{formatRs(viewing.totalAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Paid ({viewing.paymentMethod})</span>
                <span>{formatRs(viewing.paidAmount, currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-amber-700">
                <span>Remaining Balance</span>
                <span>{formatRs(viewing.remainingAmount, currency)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
