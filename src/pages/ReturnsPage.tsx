import { useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import { formatRs, formatShortDate } from '../utils/format';

export function ReturnsPage() {
  const { state, submitReturn } = useCrm();
  const { notify } = useToast();
  const currency = state.settings.currency;

  const [invoiceQuery, setInvoiceQuery] = useState(state.sales[0]?.invoiceNumber || '');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [returnType, setReturnType] = useState<'Refund' | 'Exchange'>('Refund');
  const [exchangeProductId, setExchangeProductId] = useState('');
  const [reason, setReason] = useState('Customer requested model upgrade');

  const matchedSale = useMemo(
    () =>
      state.sales.find(
        (s) => s.invoiceNumber.toLowerCase() === invoiceQuery.trim().toLowerCase(),
      ),
    [state.sales, invoiceQuery],
  );

  const activeProductId =
    matchedSale?.items.some((i) => i.productId === selectedProductId)
      ? selectedProductId
      : matchedSale?.items[0]?.productId || '';

  const inStockProducts = useMemo(
    () => state.products.filter((p) => p.quantity > 0),
    [state.products],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedSale || !activeProductId) {
      notify('error', 'Select a valid invoice and product');
      return;
    }
    try {
      const record = submitReturn({
        invoiceNumber: matchedSale.invoiceNumber,
        productId: activeProductId,
        quantity: Math.max(1, Math.round(Number(quantity) || 1)),
        type: returnType,
        reason: reason.trim() || 'Customer return',
        exchangeProductId:
          returnType === 'Exchange'
            ? exchangeProductId || inStockProducts[0]?.id
            : undefined,
      });
      notify(
        'success',
        `${record.returnNumber} processed`,
        `${record.type} completed and inventory stock updated.`,
      );
    } catch (err) {
      notify('error', 'Return failed', err instanceof Error ? err.message : 'Validation failed');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Return / Exchange Form */}
      <div className="xl:col-span-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <RotateCcw className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900">Process Return or Exchange</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Lookup Invoice #</label>
            <div className="relative mt-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                list="invoice-list"
                value={invoiceQuery}
                onChange={(e) => setInvoiceQuery(e.target.value)}
                placeholder="e.g. INV-2026-1042"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 font-mono text-sm"
              />
              <datalist id="invoice-list">
                {state.sales.map((s) => (
                  <option key={s.id} value={s.invoiceNumber}>
                    {s.customerName}
                  </option>
                ))}
              </datalist>
            </div>
            {matchedSale ? (
              <p className="mt-1.5 text-[11px] font-medium text-emerald-700">
                Matched: {matchedSale.customerName} · {formatShortDate(matchedSale.date)} ·{' '}
                {formatRs(matchedSale.grandTotal, currency)}
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-amber-700">
                Enter an existing invoice number to load sold items.
              </p>
            )}
          </div>

          {matchedSale && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700">Sold Product</label>
                <select
                  value={activeProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {matchedSale.items.map((item) => (
                    <option key={item.productId} value={item.productId}>
                      {item.productName} (Sold Qty: {item.quantity} ·{' '}
                      {formatRs(item.unitPrice, currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Return Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Resolution</label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value as 'Refund' | 'Exchange')}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Refund">Refund</option>
                    <option value="Exchange">Exchange Product</option>
                  </select>
                </div>
              </div>

              {returnType === 'Exchange' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Replacement Product
                  </label>
                  <select
                    value={exchangeProductId || inStockProducts[0]?.id || ''}
                    onChange={(e) => setExchangeProductId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {inStockProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.quantity} in stock · {formatRs(p.sellingPrice, currency)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700">Return Reason</label>
                <input
                  required
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" className="w-full">
                Confirm {returnType} & Reconcile Stock
              </Button>
            </>
          )}
        </form>
      </div>

      {/* Return History Table */}
      <div className="xl:col-span-7">
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Return & Exchange History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                  <th className="px-4 py-3 font-semibold">Return #</th>
                  <th className="px-3 py-3 font-semibold">Invoice / Customer</th>
                  <th className="px-3 py-3 font-semibold">Product</th>
                  <th className="px-3 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 text-right font-semibold">Refund / Swap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.returns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-slate-900">{r.returnNumber}</p>
                      <p className="text-[11px] text-slate-500">{formatShortDate(r.date)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-mono font-medium text-slate-800">{r.invoiceNumber}</p>
                      <p className="text-[11px] text-slate-500">{r.customerName}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">
                        {r.productName} ×{r.quantity}
                      </p>
                      <p className="text-[11px] text-slate-500">{r.reason}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                          r.type === 'Refund'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.type === 'Refund' ? (
                        <span className="font-semibold text-amber-700">
                          {formatRs(r.refundAmount, currency)}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-700">
                          → {r.exchangeProductName}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
