import { useMemo, useState } from 'react';
import { Banknote, FileText, Printer, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import type { Customer, PaymentMethod } from '../types/crm';
import { formatRs, formatShortDate } from '../utils/format';

export function CustomerLedgerPage() {
  const { state, collectPayment } = useCrm();
  const { notify } = useToast();
  const currency = state.settings.currency;

  const [search, setSearch] = useState('');
  const [onlyOutstanding, setOnlyOutstanding] = useState(false);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  const [amountInput, setAmountInput] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.customers.filter((c) => {
      if (onlyOutstanding && c.outstandingBalance <= 0) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
    });
  }, [state.customers, search, onlyOutstanding]);

  const totalReceivables = useMemo(
    () => state.customers.reduce((s, c) => s + c.outstandingBalance, 0),
    [state.customers],
  );

  const openPaymentModal = (c: Customer) => {
    setPayingCustomer(c);
    setAmountInput(String(c.outstandingBalance > 0 ? c.outstandingBalance : ''));
    setMethod('Cash');
    setReference('');
    setNotes('');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer) return;
    const amount = Math.round(Number(amountInput) || 0);
    if (amount <= 0) {
      notify('error', 'Enter a payment amount greater than zero');
      return;
    }
    try {
      collectPayment({
        customerId: payingCustomer.id,
        amount,
        method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      notify(
        'success',
        'Payment recorded',
        `${formatRs(amount, currency)} credited to ${payingCustomer.name}'s account.`,
      );
      setPayingCustomer(null);
    } catch (err) {
      notify('error', 'Payment failed', err instanceof Error ? err.message : 'Unable to record');
    }
  };

  const statementPayments = useMemo(
    () =>
      statementCustomer
        ? state.payments.filter((p) => p.customerId === statementCustomer.id)
        : [],
    [statementCustomer, state.payments],
  );
  const statementSales = useMemo(
    () =>
      statementCustomer
        ? state.sales.filter((s) => s.customerId === statementCustomer.id)
        : [],
    [statementCustomer, state.sales],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer ledger by name or phone..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyOutstanding}
              onChange={(e) => setOnlyOutstanding(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Outstanding balances only
          </label>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-medium text-slate-500">Total Customer Receivables</p>
          <p className="text-base font-bold text-amber-700 tabular-nums">
            {formatRs(totalReceivables, currency)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-3 py-3 text-right font-semibold">Total Purchases</th>
                <th className="px-3 py-3 text-right font-semibold">Total Paid</th>
                <th className="px-3 py-3 text-right font-semibold">Outstanding Balance</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{customer.name}</p>
                    <p className="text-[11px] text-slate-500 tabular-nums">{customer.phone}</p>
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-slate-800 tabular-nums">
                    {formatRs(customer.totalPurchases, currency)}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-emerald-700 tabular-nums">
                    {formatRs(customer.totalPaid, currency)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums">
                    <span
                      className={
                        customer.outstandingBalance > 0 ? 'text-amber-700' : 'text-emerald-600'
                      }
                    >
                      {formatRs(customer.outstandingBalance, currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setStatementCustomer(customer)}
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        Statement
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openPaymentModal(customer)}
                      >
                        <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
                        Record Payment
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        open={Boolean(payingCustomer)}
        title={payingCustomer ? `Record Payment — ${payingCustomer.name}` : 'Record Payment'}
        description={
          payingCustomer
            ? `Current outstanding balance: ${formatRs(payingCustomer.outstandingBalance, currency)}`
            : ''
        }
        onClose={() => setPayingCustomer(null)}
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Received Amount ({currency})
            </label>
            <input
              required
              type="number"
              min={1}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="Cash">Cash</option>
              <option value="JazzCash">JazzCash</option>
              <option value="EasyPaisa">EasyPaisa</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">Reference / Trx ID</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional bank or wallet reference"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPayingCustomer(null)}>
              Cancel
            </Button>
            <Button type="submit">Apply Payment</Button>
          </div>
        </form>
      </Modal>

      {/* Customer Statement Modal */}
      <Modal
        open={Boolean(statementCustomer)}
        title={statementCustomer ? `Account Statement — ${statementCustomer.name}` : 'Statement'}
        description={statementCustomer ? `${statementCustomer.phone} · ${statementCustomer.city}` : ''}
        onClose={() => setStatementCustomer(null)}
        maxWidthClass="max-w-2xl"
      >
        {statementCustomer && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3.5 tabular-nums">
              <div>
                <p className="text-slate-500">Total Billed</p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {formatRs(statementCustomer.totalPurchases, currency)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Total Paid</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-700">
                  {formatRs(statementCustomer.totalPaid, currency)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Closing Balance</p>
                <p className="mt-0.5 text-sm font-bold text-amber-700">
                  {formatRs(statementCustomer.outstandingBalance, currency)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold text-slate-800">Invoices</h3>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {statementSales.length === 0 ? (
                  <p className="p-3 text-slate-500">No invoices found.</p>
                ) : (
                  statementSales.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-3 py-2">
                      <div>
                        <span className="font-mono font-semibold text-slate-900">{s.invoiceNumber}</span>
                        <span className="ml-2 text-slate-500">{formatShortDate(s.date)}</span>
                      </div>
                      <span className="font-semibold tabular-nums">
                        {formatRs(s.grandTotal, currency)} ({s.paymentStatus})
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold text-slate-800">Payment History</h3>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {statementPayments.length === 0 ? (
                  <p className="p-3 text-slate-500">No payments logged.</p>
                ) : (
                  statementPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2">
                      <div>
                        <span className="font-semibold text-slate-900">{p.method}</span>
                        <span className="ml-2 text-slate-500">{formatShortDate(p.date)}</span>
                      </div>
                      <span className="font-semibold text-emerald-700 tabular-nums">
                        +{formatRs(p.amount, currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 print:hidden">
              <Button type="button" variant="secondary" onClick={() => setStatementCustomer(null)}>
                Close
              </Button>
              <Button type="button" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                Print Statement
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
