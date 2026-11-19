import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { InvoicePreviewModal } from '../components/InvoicePreviewModal';
import { ProductImage } from '../components/ProductImage';
import { Button } from '../components/ui/Button';
import { useRole } from '../context/RoleContext';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import type { PaymentMethod, Product, Sale } from '../types/crm';
import { formatRs } from '../utils/format';

interface CartLine {
  product: Product;
  quantity: number;
  imei: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'JazzCash',
  'EasyPaisa',
  'Bank Transfer',
  'Card',
];

export function PosPage() {
  const { state, completeSale } = useCrm();
  const { profile } = useRole();
  const { notify } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  const [walkInName, setWalkInName] = useState('Walk-in Customer');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [discount, setDiscount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paidInput, setPaidInput] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const currency = state.settings.currency;

  const categories = useMemo(() => {
    const set = new Set<string>(['ALL', 'Smartphones']);
    state.products.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [state.products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.products.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.imei || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      );
    });
  }, [state.products, search, categoryFilter]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.product.sellingPrice * line.quantity, 0),
    [cart],
  );
  const discountNum = Math.min(Math.max(0, Number(discount) || 0), subtotal);
  const taxable = subtotal - discountNum;
  const taxRate = state.settings.taxEnabled ? state.settings.taxRate : 0;
  const taxAmount = taxRate > 0 ? Math.round((taxable * taxRate) / 100) : 0;
  const grandTotal = taxable + taxAmount;
  const paidAmount =
    paidInput.trim() === '' ? grandTotal : Math.min(Math.max(0, Number(paidInput) || 0), grandTotal);
  const remainingBalance = Math.max(0, grandTotal - paidAmount);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      notify('error', 'Out of stock', `${product.name} currently has 0 units available.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          notify('error', 'Stock limit reached', `Only ${product.quantity} units in stock.`);
          return prev;
        }
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { product, quantity: 1, imei: product.imei || '' }];
    });
  };

  const updateLineQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.product.id !== productId) return line;
          const next = line.quantity + delta;
          if (next <= 0) return null;
          if (next > line.product.quantity) {
            notify('error', 'Stock limit reached', `Only ${line.product.quantity} units available.`);
            return line;
          }
          return { ...line, quantity: next };
        })
        .filter((l): l is CartLine => Boolean(l)),
    );
  };

  const updateLineImei = (productId: string, imei: string) => {
    setCart((prev) => prev.map((l) => (l.product.id === productId ? { ...l, imei } : l)));
  };

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      notify('error', 'Cart is empty', 'Add at least one phone or accessory before checkout.');
      return;
    }

    const customer =
      selectedCustomerId !== 'walk-in'
        ? state.customers.find((c) => c.id === selectedCustomerId)
        : undefined;

    if (remainingBalance > 0 && !customer) {
      notify(
        'error',
        'Customer required for credit balance',
        'Select a registered customer to record a partial or unpaid balance.',
      );
      return;
    }

    try {
      const sale = completeSale({
        customerId: customer?.id,
        customerName: customer ? customer.name : walkInName.trim() || 'Walk-in Customer',
        customerPhone: customer ? customer.phone : walkInPhone.trim() || undefined,
        items: cart.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          imei: l.imei.trim() || undefined,
        })),
        discount: discountNum,
        taxRate,
        paymentMethod,
        paidAmount,
        soldBy: profile.fullName,
      });

      setCompletedSale(sale);
      setCart([]);
      setDiscount('0');
      setPaidInput('');
      notify(
        'success',
        `Sale ${sale.invoiceNumber} completed`,
        `Inventory updated and invoice ready to print.`,
      );
    } catch (err) {
      notify('error', 'Checkout failed', err instanceof Error ? err.message : 'Unable to complete sale');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Left: Product Catalog */}
      <div className="space-y-4 xl:col-span-7 2xl:col-span-8">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search phone model, brand, IMEI, or accessory SKU..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat === 'ALL' ? 'All Items' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const inCart = cart.find((c) => c.product.id === product.id);
            const outOfStock = product.quantity === 0;
            return (
              <div
                key={product.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-indigo-300"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      kind={product.kind}
                      className="h-14 w-14"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-indigo-600">{product.brand}</p>
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {product.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {product.kind === 'PHONE'
                          ? `${product.ram || ''} / ${product.storage || ''} · ${product.condition}`
                          : product.category}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="min-w-0">
                    <p className="whitespace-nowrap text-sm font-bold text-slate-900 tabular-nums">
                      {formatRs(product.sellingPrice, currency)}
                    </p>
                    <p
                      className={`whitespace-nowrap text-[11px] font-medium tabular-nums ${
                        outOfStock
                          ? 'text-red-600'
                          : product.quantity <= product.minStock
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                      }`}
                    >
                      {outOfStock ? 'Out of stock' : `${product.quantity} in stock`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={inCart ? 'secondary' : 'primary'}
                    disabled={outOfStock}
                    onClick={() => addToCart(product)}
                    className="px-2.5"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    {inCart ? `(${inCart.quantity})` : 'Add'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Cart & Checkout Panel */}
      <div className="xl:col-span-5 2xl:col-span-4">
        <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-900">Current Sale Cart</h2>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 tabular-nums">
              {cart.reduce((s, l) => s + l.quantity, 0)} items
            </span>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <label htmlFor="pos-customer" className="block text-xs font-medium text-slate-700">
              Customer
            </label>
            <select
              id="pos-customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="walk-in">Walk-in Customer</option>
              {state.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>

            {selectedCustomerId === 'walk-in' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Buyer name"
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
                <input
                  type="tel"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                <p className="text-xs font-medium text-slate-600">No items in cart yet</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Select phones or accessories from the catalog to start billing.
                </p>
              </div>
            ) : (
              cart.map((line) => (
                <div
                  key={line.product.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {line.product.name}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {formatRs(line.product.sellingPrice, currency)} each
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.product.id)}
                      aria-label={`Remove ${line.product.name}`}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  {line.product.kind === 'PHONE' && (
                    <input
                      type="text"
                      value={line.imei}
                      onChange={(e) => updateLineImei(line.product.id, e.target.value)}
                      placeholder="Enter 15-digit IMEI for warranty"
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-[11px] text-slate-800 placeholder:text-slate-400"
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white">
                      <button
                        type="button"
                        onClick={() => updateLineQty(line.product.id, -1)}
                        aria-label="Decrease quantity"
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <span className="min-w-[24px] text-center text-xs font-semibold tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateLineQty(line.product.id, 1)}
                        aria-label="Increase quantity"
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-slate-900 tabular-nums">
                      {formatRs(line.product.sellingPrice * line.quantity, currency)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discount & Payment */}
          <div className="space-y-3 border-t border-slate-200 pt-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="pos-discount" className="block text-[11px] font-medium text-slate-600">
                  Discount ({currency})
                </label>
                <input
                  id="pos-discount"
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="pos-paid" className="block text-[11px] font-medium text-slate-600">
                  Paid Amount ({currency})
                </label>
                <input
                  id="pos-paid"
                  type="number"
                  min={0}
                  value={paidInput}
                  onChange={(e) => setPaidInput(e.target.value)}
                  placeholder={String(grandTotal)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm tabular-nums"
                />
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-slate-600">Payment Method</span>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                      paymentMethod === method
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="space-y-1.5 rounded-lg bg-slate-50 p-3.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatRs(subtotal, currency)}</span>
            </div>
            {discountNum > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span className="tabular-nums">-{formatRs(discountNum, currency)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax ({taxRate}%)</span>
                <span className="tabular-nums">{formatRs(taxAmount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
              <span>Grand Total</span>
              <span className="tabular-nums">{formatRs(grandTotal, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Remaining Balance</span>
              <span
                className={`font-semibold tabular-nums ${
                  remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {formatRs(remainingBalance, currency)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={cart.length === 0}
            onClick={handleCompleteSale}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Complete Sale & Generate Invoice
          </Button>
        </div>
      </div>

      <InvoicePreviewModal
        sale={completedSale}
        settings={state.settings}
        onClose={() => setCompletedSale(null)}
      />
    </div>
  );
}
