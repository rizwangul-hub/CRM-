import { useMemo, useState } from 'react';
import { Printer, Search } from 'lucide-react';
import { InvoicePreviewModal } from '../components/InvoicePreviewModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useCrm } from '../store/crmStore';
import type { Sale } from '../types/crm';
import { formatRs, formatShortDate } from '../utils/format';

const PAGE_SIZE = 10;

export function SalesHistoryPage() {
  const { state } = useCrm();
  const currency = state.settings.currency;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.sales.filter((s) => {
      if (statusFilter !== 'ALL' && s.paymentStatus !== statusFilter) return false;
      if (methodFilter !== 'ALL' && s.paymentMethod !== methodFilter) return false;
      if (!q) return true;
      return (
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.items.some(
          (i) =>
            i.productName.toLowerCase().includes(q) ||
            (i.imei || '').toLowerCase().includes(q),
        )
      );
    });
  }, [state.sales, search, statusFilter, methodFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoice #, customer, product, or IMEI..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <select
            aria-label="Filter by payment status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <select
            aria-label="Filter by payment method"
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="JazzCash">JazzCash</option>
            <option value="EasyPaisa">EasyPaisa</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
          </select>
        </div>
        <p className="text-xs font-medium text-slate-500 tabular-nums">
          {filtered.length} invoices · {formatRs(filtered.reduce((s, x) => s + x.grandTotal, 0), currency)}
        </p>
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          title="No matching invoices"
          description="Try clearing your search or status filters."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                  <th className="px-4 py-3 font-semibold">Invoice #</th>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Products</th>
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 text-right font-semibold">Paid</th>
                  <th className="px-3 py-3 text-right font-semibold">Balance</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{sale.customerName}</p>
                      <p className="text-[11px] text-slate-500">{sale.paymentMethod}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{formatShortDate(sale.date)}</td>
                    <td className="px-3 py-3 max-w-[220px]">
                      <p className="truncate font-medium text-slate-800">
                        {sale.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      {formatRs(sale.grandTotal, currency)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-700 tabular-nums">
                      {formatRs(sale.paidAmount, currency)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span
                        className={
                          sale.remainingBalance > 0
                            ? 'font-semibold text-amber-700'
                            : 'text-slate-400'
                        }
                      >
                        {formatRs(sale.remainingBalance, currency)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
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
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <InvoicePreviewModal
        sale={selectedSale}
        settings={state.settings}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
}
