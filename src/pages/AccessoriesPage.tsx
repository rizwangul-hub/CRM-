import { useMemo, useState } from 'react';
import { PackagePlus, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ProductImage } from '../components/ProductImage';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useRole } from '../context/RoleContext';
import { useToast } from '../context/ToastContext';
import { IMG_ACC_CHARGER, IMG_ACC_EARBUDS } from '../data/seedData';
import { useCrm } from '../store/crmStore';
import type { AccessoryCategory, Product } from '../types/crm';
import { formatRs } from '../utils/format';

const ACCESSORY_CATEGORIES: AccessoryCategory[] = [
  'Chargers',
  'Earbuds',
  'Mobile Covers',
  'Screen Protectors',
  'Cables',
  'Power Banks',
  'Headphones',
];

export function AccessoriesPage() {
  const { state, addProduct, updateProduct, deleteProduct, adjustStock } = useCrm();
  const { role } = useRole();
  const { notify } = useToast();

  const canManage = role === 'ADMIN' || role === 'MANAGER';
  const currency = state.settings.currency;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    brand: 'Anker',
    category: 'Chargers' as AccessoryCategory,
    sku: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '15',
    minStock: '5',
    warrantyMonths: '6',
  });

  const accessories = useMemo(
    () => state.products.filter((p) => p.kind === 'ACCESSORY'),
    [state.products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accessories.filter((item) => {
      if (category !== 'ALL' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q)
      );
    });
  }, [accessories, search, category]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      brand: 'Anker',
      category: 'Chargers',
      sku: `ACC-${Date.now().toString().slice(-4)}`,
      purchasePrice: '',
      sellingPrice: '',
      quantity: '15',
      minStock: '5',
      warrantyMonths: '6',
    });
    setFormOpen(true);
  };

  const openEdit = (item: Product) => {
    setEditing(item);
    setForm({
      name: item.name,
      brand: item.brand,
      category: item.category as AccessoryCategory,
      sku: item.sku || '',
      purchasePrice: String(item.purchasePrice),
      sellingPrice: String(item.sellingPrice),
      quantity: String(item.quantity),
      minStock: String(item.minStock),
      warrantyMonths: String(item.warrantyMonths),
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isAudio = form.category === 'Earbuds' || form.category === 'Headphones';
    const payload = {
      kind: 'ACCESSORY' as const,
      name: form.name.trim(),
      brand: form.brand.trim() || 'Generic',
      model: form.sku.trim() || 'Standard',
      category: form.category,
      sku: form.sku.trim(),
      condition: 'New' as const,
      purchasePrice: Math.max(0, Number(form.purchasePrice) || 0),
      sellingPrice: Math.max(0, Number(form.sellingPrice) || 0),
      quantity: Math.max(0, Math.round(Number(form.quantity) || 0)),
      minStock: Math.max(1, Math.round(Number(form.minStock) || 4)),
      warrantyMonths: Math.max(0, Math.round(Number(form.warrantyMonths) || 0)),
      imageUrl: isAudio ? IMG_ACC_EARBUDS : IMG_ACC_CHARGER,
    };

    if (editing) {
      updateProduct(editing.id, payload);
      notify('success', 'Accessory updated', `${payload.name} saved.`);
    } else {
      addProduct(payload);
      notify('success', 'Accessory added', `${payload.name} added to catalog.`);
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chargers, earbuds, covers, SKU..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          {canManage && (
            <Button type="button" size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Accessory
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['ALL', ...ACCESSORY_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                category === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'All Accessories' : cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No accessories match your filter"
          description="Try another category or add a new mobile accessory item."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const low = item.quantity <= item.minStock;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-indigo-300"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.name}
                      kind="ACCESSORY"
                      className="h-16 w-16"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {item.category}
                      </span>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {item.brand} · <span className="font-mono">{item.sku}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-slate-900 tabular-nums">
                        {formatRs(item.sellingPrice, currency)}
                      </p>
                      {canManage && (
                        <p className="text-[11px] text-slate-400 tabular-nums">
                          Cost: {formatRs(item.purchasePrice, currency)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                        low
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {item.quantity} in stock
                    </span>
                  </div>

                  {canManage && (
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          adjustStock(item.id, 10);
                          notify('success', 'Restocked +10', `${item.name} stock increased by 10.`);
                        }}
                      >
                        <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                        +10 Stock
                      </Button>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        aria-label={`Edit ${item.name}`}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(item)}
                        aria-label={`Delete ${item.name}`}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        title={editing ? 'Edit Accessory' : 'Add Accessory'}
        onClose={() => setFormOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Accessory Name</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Anker 65W GaN Fast Charger"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Category</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as AccessoryCategory })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {ACCESSORY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">SKU Code</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Quantity</label>
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
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Accessory'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Accessory"
        message={`Remove ${deleting?.name} from accessories catalog?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteProduct(deleting.id);
            notify('success', 'Accessory deleted', `${deleting.name} removed.`);
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
