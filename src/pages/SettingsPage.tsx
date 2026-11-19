import { useState } from 'react';
import { RotateCcw, Save, Smartphone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import type { ShopSettings } from '../types/crm';

type SettingsTab = 'shop' | 'invoice' | 'alerts' | 'preferences';

export function SettingsPage() {
  const { state, updateSettings, resetDemoData } = useCrm();
  const { notify } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('shop');
  const [draft, setDraft] = useState<ShopSettings>(state.settings);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(draft);
    notify('success', 'Settings saved', 'Shop profile and preferences updated.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['shop', 'Shop & Contact'],
              ['invoice', 'Invoice & Tax'],
              ['alerts', 'Notification Alerts'],
              ['preferences', 'Display & Demo Data'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setConfirmReset(true)}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset Demo Data
        </Button>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6"
      >
        {activeTab === 'shop' && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Smartphone className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{draft.shopName}</p>
                <p className="text-xs text-slate-500">{draft.tagline}</p>
                <p className="mt-0.5 text-[11px] text-indigo-600">
                  Brand mark preview shown on sidebar & printed invoices
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">Shop Name</label>
                <input
                  type="text"
                  value={draft.shopName}
                  onChange={(e) => setDraft({ ...draft, shopName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Tagline</label>
                <input
                  type="text"
                  value={draft.tagline}
                  onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Phone Number</label>
                <input
                  type="text"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">WhatsApp Business</label>
                <input
                  type="text"
                  value={draft.whatsapp}
                  onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Currency</label>
                <select
                  value={draft.currency}
                  onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="PKR">PKR (Rs.)</option>
                  <option value="USD">USD ($)</option>
                  <option value="AED">AED</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700">Shop Address</label>
                <input
                  type="text"
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">Invoice Prefix</label>
              <input
                type="text"
                value={draft.invoicePrefix}
                onChange={(e) => setDraft({ ...draft, invoicePrefix: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Default Receipt Design</label>
              <select
                value={draft.receiptFormat}
                onChange={(e) =>
                  setDraft({ ...draft, receiptFormat: e.target.value as 'A4' | 'Thermal 80mm' })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Thermal 80mm">Thermal 80mm Receipt</option>
                <option value="A4">A4 Full Invoice</option>
              </select>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3.5">
              <input
                id="tax-enabled"
                type="checkbox"
                checked={draft.taxEnabled}
                onChange={(e) => setDraft({ ...draft, taxEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <label htmlFor="tax-enabled" className="text-xs font-medium text-slate-800 cursor-pointer">
                Enable sales tax on POS checkout
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Tax Rate (%)</label>
              <input
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={draft.taxRate}
                onChange={(e) => setDraft({ ...draft, taxRate: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Receipt Footer Message</label>
              <textarea
                rows={3}
                value={draft.receiptFooter}
                onChange={(e) => setDraft({ ...draft, receiptFooter: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="max-w-xs">
              <label className="block text-xs font-medium text-slate-700">
                Default Low Stock Alert Threshold (Units)
              </label>
              <input
                type="number"
                min={1}
                value={draft.lowStockThreshold}
                onChange={(e) =>
                  setDraft({ ...draft, lowStockThreshold: Math.max(1, Number(e.target.value) || 1) })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ['notifyLowStock', 'Low stock alerts when items reach reorder threshold'],
                  ['notifyWarrantyExpiry', 'Upcoming warranty expiration reminders (30 days)'],
                  ['notifyPendingPayments', 'Overdue customer credit balance notifications'],
                  ['notifyRepairReady', 'Alert desk when repair tickets are Ready for Delivery'],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3.5 text-xs font-medium text-slate-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-xs font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.compactDensity}
                onChange={(e) => setDraft({ ...draft, compactDensity: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Use compact table and workspace spacing
            </label>

            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
              <p className="font-semibold">Interactive Demo Storage</p>
              <p className="mt-1 leading-relaxed">
                All sales, inventory updates, repairs, payments, and settings are persisted locally in
                your browser&apos;s <span className="font-mono">localStorage</span>. Use &ldquo;Reset
                Demo Data&rdquo; at any time to restore the original client presentation dataset.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end border-t border-slate-200 pt-4">
          <Button type="submit">
            <Save className="h-4 w-4" aria-hidden="true" />
            Save Settings
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmReset}
        title="Reset Demo Data"
        message="Restore all products, sales, customers, repairs, and settings to the default presentation dataset?"
        confirmLabel="Reset Everything"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          setDraft(state.settings);
          setConfirmReset(false);
          notify('success', 'Demo data restored', 'All modules have been reset to clean defaults.');
        }}
      />
    </div>
  );
}
