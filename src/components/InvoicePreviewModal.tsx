import { useState } from 'react';
import { Printer, Smartphone } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { Sale, ShopSettings } from '../types/crm';
import { formatRs, formatShortDate } from '../utils/format';

interface InvoicePreviewModalProps {
  sale: Sale | null;
  settings: ShopSettings;
  onClose: () => void;
}

export function InvoicePreviewModal({ sale, settings, onClose }: InvoicePreviewModalProps) {
  const [format, setFormat] = useState<'A4' | 'Thermal 80mm'>(settings.receiptFormat);

  if (!sale) return null;

  const isThermal = format === 'Thermal 80mm';

  return (
    <Modal
      open={Boolean(sale)}
      title={`Invoice ${sale.invoiceNumber}`}
      description="Preview and print A4 or 80mm thermal customer receipt"
      onClose={onClose}
      maxWidthClass={isThermal ? 'max-w-md' : 'max-w-2xl'}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 print:hidden">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {(['A4', 'Thermal 80mm'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFormat(mode)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                format === mode
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <Button type="button" size="sm" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          Print Receipt
        </Button>
      </div>

      <div
        className={`mx-auto rounded-lg border border-slate-200 bg-white ${
          isThermal ? 'max-w-[320px] p-4 font-mono text-xs' : 'p-6 text-sm'
        }`}
      >
        <div
          className={`border-b border-slate-200 pb-4 ${
            isThermal ? 'text-center' : 'flex items-start justify-between gap-4'
          }`}
        >
          <div className={isThermal ? 'flex flex-col items-center' : 'flex items-start gap-3'}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Smartphone className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{settings.shopName}</h3>
              <p className="text-[11px] text-slate-500">{settings.address}</p>
              <p className="text-[11px] text-slate-500">{settings.phone}</p>
            </div>
          </div>

          <div className={isThermal ? 'mt-3' : 'text-right'}>
            <p className="font-semibold text-slate-900 tabular-nums">{sale.invoiceNumber}</p>
            <p className="text-[11px] text-slate-500">{formatShortDate(sale.date)}</p>
            <p className="text-[11px] text-slate-500">Served by: {sale.soldBy}</p>
          </div>
        </div>

        <div className="my-4 flex flex-wrap justify-between gap-2 text-xs">
          <div>
            <p className="text-slate-500">Customer</p>
            <p className="font-semibold text-slate-900">{sale.customerName}</p>
            {sale.customerPhone && <p className="text-slate-500 tabular-nums">{sale.customerPhone}</p>}
          </div>
          <div className={isThermal ? 'text-left' : 'text-right'}>
            <p className="text-slate-500">Payment</p>
            <p className="font-semibold text-slate-900">{sale.paymentMethod}</p>
            <p
              className={`text-[11px] font-medium ${
                sale.paymentStatus === 'Paid'
                  ? 'text-emerald-700'
                  : sale.paymentStatus === 'Partial'
                    ? 'text-amber-700'
                    : 'text-red-700'
              }`}
            >
              Status: {sale.paymentStatus}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border-y border-slate-200 py-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1.5 font-medium">Item</th>
                <th className="py-1.5 text-right font-medium">Qty</th>
                <th className="py-1.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <tr key={`${item.productId}-${idx}`}>
                  <td className="py-2 pr-2">
                    <p className="font-medium text-slate-900">{item.productName}</p>
                    {item.imei && (
                      <p className="font-mono text-[10px] text-slate-500">IMEI: {item.imei}</p>
                    )}
                    <p className="text-[10px] text-slate-500 tabular-nums">
                      @ {formatRs(item.unitPrice, settings.currency)}
                    </p>
                  </td>
                  <td className="py-2 text-right text-slate-700 tabular-nums">{item.quantity}</td>
                  <td className="py-2 text-right font-medium text-slate-900 tabular-nums">
                    {formatRs(item.lineTotal, settings.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatRs(sale.subtotal, settings.currency)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span className="text-emerald-700 tabular-nums">
                -{formatRs(sale.discount, settings.currency)}
              </span>
            </div>
          )}
          {sale.tax > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Tax ({settings.taxRate}%)</span>
              <span className="tabular-nums">{formatRs(sale.tax, settings.currency)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
            <span>Grand Total</span>
            <span className="tabular-nums">{formatRs(sale.grandTotal, settings.currency)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Paid ({sale.paymentMethod})</span>
            <span className="tabular-nums">{formatRs(sale.paidAmount, settings.currency)}</span>
          </div>
          {sale.remainingBalance > 0 && (
            <div className="flex justify-between font-semibold text-amber-700">
              <span>Balance Due</span>
              <span className="tabular-nums">
                {formatRs(sale.remainingBalance, settings.currency)}
              </span>
            </div>
          )}
        </div>

        <p className="mt-5 border-t border-dashed border-slate-200 pt-3 text-center text-[11px] text-slate-500">
          {settings.receiptFooter}
        </p>
      </div>
    </Modal>
  );
}
