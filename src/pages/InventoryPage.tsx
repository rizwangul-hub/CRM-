import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Eye,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { ProductImage } from '../components/ProductImage';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useRole } from '../context/RoleContext';
import { useToast } from '../context/ToastContext';
import { IMG_PHONE_ANDROID, IMG_PHONE_TITANIUM } from '../data/seedData';
import { useCrm } from '../store/crmStore';
import type { DeviceCondition, Product } from '../types/crm';
import { formatRs } from '../utils/format';

const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'Infinix', 'Tecno', 'Realme'];
const PAGE_SIZE = 8;

interface PhoneFormState {
  name: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  color: string;
  imei: string;
  condition: DeviceCondition;
  purchasePrice: string;
  sellingPrice: string;
  quantity: string;
  minStock: string;
  warrantyMonths: string;
}

const emptyForm: PhoneFormState = {
  name: '',
  brand: 'Samsung',
  model: '',
  ram: '8GB',
  storage: '256GB',
  color: 'Graphite Black',
  imei: '',
  condition: 'New',
  purchasePrice: '',
  sellingPrice: '',
  quantity: '5',
  minStock: '3',
  warrantyMonths: '12',
};

export function InventoryPage() {
  const { state, addProduct, updateProduct, deleteProduct, adjustStock } = useCrm();
  const { role } = useRole();
  const { notify } = useToast();

  const canManage = role === 'ADMIN' || role === 'MANAGER';
  const currency = state.settings.currency;

  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<'name' | 'sellingPrice' | 'quantity'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<PhoneFormState>(emptyForm);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('5');
  const [deleting, setDeleting] = useState<Product | null>(null);

  const phones = useMemo(
    () => state.products.filter((p) => p.kind === 'PHONE'),
    [state.products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return phones
      .filter((p) => {
        if (brandFilter !== 'ALL' && p.brand !== brandFilter) return false;
        if (conditionFilter !== 'ALL' && p.condition !== conditionFilter) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          (p.imei || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const cmp =
          sortKey === 'name'
            ? a.name.localeCompare(b.name)
            : a[sortKey] - b[sortKey];
        return sortAsc ? cmp : -cmp;
      });
  }, [phones, search, brandFilter, conditionFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      brand: p.brand,
      model: p.model,
      ram: p.ram || '8GB',
      storage: p.storage || '128GB',
      color: p.color || '',
      imei: p.imei || '',
      condition: p.condition,
      purchasePrice: String(p.purchasePrice),
      sellingPrice: String(p.sellingPrice),
      quantity: String(p.quantity),
      minStock: String(p.minStock),
      warrantyMonths: String(p.warrantyMonths),
    });
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      notify('error', 'Product name required');
      return;
    }
    const payload = {
      kind: 'PHONE' as const,
      name: form.name.trim(),
      brand: form.brand,
      model: form.model.trim() || 'PTA Approved',
      category: 'Smartphones',
      ram: form.ram.trim(),
      storage: form.storage.trim(),
      color: form.color.trim(),
      imei: form.imei.trim() || undefined,
      condition: form.condition,
      purchasePrice: Math.max(0, Number(form.purchasePrice) || 0),
      sellingPrice: Math.max(0, Number(form.sellingPrice) || 0),
      quantity: Math.max(0, Math.round(Number(form.quantity) || 0)),
      minStock: Math.max(1, Math.round(Number(form.minStock) || 2)),
      warrantyMonths: Math.max(0, Math.round(Number(form.warrantyMonths) || 12)),
      imageUrl: form.brand === 'Apple' ? IMG_PHONE_TITANIUM : IMG_PHONE_ANDROID,
    };

    if (editing) {
      updateProduct(editing.id, payload);
      notify('success', 'Product updated', `${payload.name} changes saved.`);
    } else {
      addProduct(payload);
      notify('success', 'Product added', `${payload.name} added to inventory.`);
    }
    setFormOpen(false);
  };

  const toggleSort = (key: 'name' | 'sellingPrice' | 'quantity') => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
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
              placeholder="Search phone, model, or IMEI..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by brand"
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Brands</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by condition"
            value={conditionFilter}
            onChange={(e) => {
              setConditionFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Conditions</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
            <option value="Refurbished">Refurbished</option>
          </select>
        </div>

        {canManage && (
          <Button type="button" size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Smartphone
          </Button>
        )}
      </div>

      {/* Inventory Table */}
      {paginated.length === 0 ? (
        <EmptyState
          title="No smartphones found"
          description="Try adjusting your search query or brand filters."
          action={
            canManage ? (
              <Button type="button" size="sm" onClick={openAdd}>
                Add Smartphone
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                  <th className="px-4 py-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('name')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Device <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </th>
                  <th className="px-3 py-3 font-semibold">Specs / IMEI</th>
                  <th className="px-3 py-3 font-semibold">Condition</th>
                  {canManage && <th className="px-3 py-3 text-right font-semibold">Cost</th>}
                  <th className="px-3 py-3 text-right font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('sellingPrice')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Selling Price <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-right font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('quantity')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      Stock <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((phone) => {
                  const statusClass =
                    phone.quantity === 0
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : phone.quantity <= phone.minStock
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700';
                  return (
                    <tr key={phone.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={phone.imageUrl}
                            alt={phone.name}
                            kind="PHONE"
                            className="h-11 w-11"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">{phone.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {phone.brand} · {phone.model}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-700">
                          {phone.ram} / {phone.storage} · {phone.color}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500">
                          IMEI: {phone.imei || 'Batch Stock'}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {phone.condition}
                        </span>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {phone.warrantyMonths}m warranty
                        </p>
                      </td>
                      {canManage && (
                        <td className="px-3 py-3 text-right text-slate-600 tabular-nums">
                          {formatRs(phone.purchasePrice, currency)}
                        </td>
                      )}
                      <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">
                        {formatRs(phone.sellingPrice, currency)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${statusClass}`}
                        >
                          {phone.quantity} units
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewing(phone)}
                            aria-label={`View ${phone.name}`}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdjusting(phone);
                                  setAdjustDelta('5');
                                }}
                                aria-label={`Adjust stock for ${phone.name}`}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                              >
                                <PackagePlus className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(phone)}
                                aria-label={`Edit ${phone.name}`}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleting(phone)}
                                aria-label={`Delete ${phone.name}`}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} smartphones
              </span>
              <div className="flex items-center gap-1.5">
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

      {/* Add / Edit Modal */}
      <Modal
        open={formOpen}
        title={editing ? 'Edit Smartphone' : 'Add Smartphone to Inventory'}
        onClose={() => setFormOpen(false)}
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Product Name</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Samsung Galaxy S24 Ultra"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Brand</label>
              <select
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Model / Variant</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g. SM-S928B (PTA Approved)"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">RAM</label>
              <input
                type="text"
                value={form.ram}
                onChange={(e) => setForm({ ...form, ram: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Storage</label>
              <input
                type="text"
                value={form.storage}
                onChange={(e) => setForm({ ...form, storage: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Color</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value as DeviceCondition })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Refurbished">Refurbished</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">IMEI Number</label>
              <input
                type="text"
                value={form.imei}
                onChange={(e) => setForm({ ...form, imei: e.target.value })}
                placeholder="15-digit IMEI"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Purchase Cost ({currency})</label>
              <input
                required
                type="number"
                min={0}
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Selling Price ({currency})</label>
              <input
                required
                type="number"
                min={0}
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Quantity in Stock</label>
              <input
                required
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Warranty (Months)</label>
              <input
                type="number"
                min={0}
                value={form.warrantyMonths}
                onChange={(e) => setForm({ ...form, warrantyMonths: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Smartphone'}</Button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        open={Boolean(viewing)}
        title={viewing?.name || 'Product Details'}
        onClose={() => setViewing(null)}
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ProductImage
                src={viewing.imageUrl}
                alt={viewing.name}
                kind="PHONE"
                className="h-20 w-20"
              />
              <div>
                <p className="text-xs font-medium text-indigo-600">{viewing.brand}</p>
                <h3 className="text-base font-bold text-slate-900">{viewing.name}</h3>
                <p className="text-xs text-slate-500">{viewing.model}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-xs">
              <div>
                <dt className="text-slate-500">Memory</dt>
                <dd className="font-semibold text-slate-900">
                  {viewing.ram} / {viewing.storage}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Color & Condition</dt>
                <dd className="font-semibold text-slate-900">
                  {viewing.color} · {viewing.condition}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">IMEI</dt>
                <dd className="font-mono font-semibold text-slate-900">
                  {viewing.imei || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Warranty</dt>
                <dd className="font-semibold text-slate-900">{viewing.warrantyMonths} Months</dd>
              </div>
              <div>
                <dt className="text-slate-500">Selling Price</dt>
                <dd className="font-semibold text-slate-900 tabular-nums">
                  {formatRs(viewing.sellingPrice, currency)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Available Stock</dt>
                <dd className="font-semibold text-slate-900 tabular-nums">
                  {viewing.quantity} units (min {viewing.minStock})
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        open={Boolean(adjusting)}
        title="Adjust Stock Level"
        description={adjusting ? `${adjusting.name} (Current: ${adjusting.quantity} units)` : ''}
        onClose={() => setAdjusting(null)}
        maxWidthClass="max-w-sm"
      >
        {adjusting && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Quantity Change (use negative value to deduct)
              </label>
              <input
                type="number"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAdjusting(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const delta = Math.round(Number(adjustDelta) || 0);
                  if (delta === 0) return;
                  adjustStock(adjusting.id, delta);
                  notify(
                    'success',
                    'Stock updated',
                    `${adjusting.name} adjusted by ${delta > 0 ? `+${delta}` : delta} units.`,
                  );
                  setAdjusting(null);
                }}
              >
                Update Stock
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Smartphone"
        message={`Remove ${deleting?.name} from inventory? Existing sales history remains unaffected.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteProduct(deleting.id);
            notify('success', 'Product removed', `${deleting.name} deleted.`);
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
