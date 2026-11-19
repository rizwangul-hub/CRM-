import type {
  CrmState,
  CustomerPayment,
  PaymentMethod,
  Purchase,
  ReturnRecord,
  Sale,
  SaleItem,
} from '../types/crm';

export interface CompleteSaleInput {
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    productId: string;
    quantity: number;
    imei?: string;
  }>;
  discount: number;
  taxRate: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  soldBy: string;
}

export function completePosSale(
  state: CrmState,
  input: CompleteSaleInput,
): { nextState: CrmState; sale: Sale } {
  if (input.items.length === 0) {
    throw new Error('Cart cannot be empty');
  }

  const today = new Date().toISOString().slice(0, 10);
  const productsMap = new Map(state.products.map((p) => [p.id, p]));
  const saleItems: SaleItem[] = [];

  for (const cartLine of input.items) {
    const prod = productsMap.get(cartLine.productId);
    if (!prod) throw new Error('Product not found in inventory');
    if (cartLine.quantity <= 0) throw new Error('Quantity must be greater than zero');
    if (cartLine.quantity > prod.quantity) {
      throw new Error(`Insufficient stock for ${prod.name} (${prod.quantity} available)`);
    }
    saleItems.push({
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      imei: cartLine.imei?.trim() || prod.imei,
      quantity: cartLine.quantity,
      unitPrice: prod.sellingPrice,
      unitCost: prod.purchasePrice,
      lineTotal: prod.sellingPrice * cartLine.quantity,
    });
  }

  const subtotal = saleItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const discount = Math.min(Math.max(0, Math.round(input.discount || 0)), subtotal);
  const taxable = subtotal - discount;
  const tax = input.taxRate > 0 ? Math.round((taxable * input.taxRate) / 100) : 0;
  const grandTotal = taxable + tax;
  const totalCost = saleItems.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
  const paidAmount = Math.min(Math.max(0, Math.round(input.paidAmount)), grandTotal);
  const remainingBalance = Math.max(0, grandTotal - paidAmount);
  const paymentStatus =
    remainingBalance === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';

  const nextInvoiceSeq = 1043 + state.sales.length;
  const invoiceNumber = `${state.settings.invoicePrefix || 'INV-2026'}-${nextInvoiceSeq}`;

  const sale: Sale = {
    id: `sale-${Date.now()}`,
    invoiceNumber,
    customerId: input.customerId,
    customerName: input.customerName || 'Walk-in Customer',
    customerPhone: input.customerPhone,
    date: today,
    items: saleItems,
    subtotal,
    discount,
    tax,
    grandTotal,
    totalCost,
    paidAmount,
    remainingBalance,
    paymentMethod: input.paymentMethod,
    paymentStatus,
    soldBy: input.soldBy,
  };

  // Deduct stock from inventory
  const qtyByProduct = new Map<string, number>();
  for (const line of saleItems) {
    qtyByProduct.set(line.productId, (qtyByProduct.get(line.productId) || 0) + line.quantity);
  }

  const nextNotifications = [...state.notifications];
  const nextProducts = state.products.map((prod) => {
    const deducted = qtyByProduct.get(prod.id);
    if (!deducted) return prod;
    const nextQty = Math.max(0, prod.quantity - deducted);
    if (nextQty <= prod.minStock && prod.quantity > prod.minStock) {
      nextNotifications.unshift({
        id: `not-ls-${Date.now()}-${prod.id}`,
        type: 'Low Stock',
        title: `Low stock alert: ${prod.name}`,
        message: `Stock dropped to ${nextQty} unit(s) after ${invoiceNumber}.`,
        date: today,
        read: false,
        targetSection: prod.kind === 'PHONE' ? 'inventory' : 'accessories',
      });
    }
    return { ...prod, quantity: nextQty };
  });

  // Update customer purchases & balance if registered customer selected
  const nextCustomers = state.customers.map((c) => {
    if (!input.customerId || c.id !== input.customerId) return c;
    return {
      ...c,
      totalPurchases: c.totalPurchases + grandTotal,
      totalPaid: c.totalPaid + paidAmount,
      outstandingBalance: c.outstandingBalance + remainingBalance,
    };
  });

  // Add payment record if paidAmount > 0 and linked to a registered customer
  const nextPayments = [...state.payments];
  if (paidAmount > 0 && input.customerId) {
    nextPayments.unshift({
      id: `pay-${Date.now()}`,
      customerId: input.customerId,
      customerName: sale.customerName,
      invoiceNumber,
      amount: paidAmount,
      date: today,
      method: input.paymentMethod,
      notes: 'POS checkout payment',
    });
  }

  // Auto-register warranty records for phones with warrantyMonths > 0
  const nextWarranties = [...state.warranties];
  for (const line of saleItems) {
    const prod = productsMap.get(line.productId);
    if (prod && prod.kind === 'PHONE' && prod.warrantyMonths > 0) {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + prod.warrantyMonths);
      nextWarranties.unshift({
        id: `war-${Date.now()}-${prod.id}`,
        customerId: input.customerId,
        customerName: sale.customerName,
        productName: prod.name,
        imei: line.imei || prod.imei || 'N/A',
        invoiceNumber,
        provider: `${prod.brand} Official / Shop Warranty`,
        startDate: today,
        expiryDate: expiry.toISOString().slice(0, 10),
        status: 'Active',
      });
    }
  }

  nextNotifications.unshift({
    id: `not-sale-${Date.now()}`,
    type: 'New Sale',
    title: `Sale ${invoiceNumber} completed`,
    message: `${sale.customerName} · Rs. ${grandTotal.toLocaleString('en-PK')} via ${sale.paymentMethod}.`,
    date: today,
    read: false,
    targetSection: 'sales',
  });

  return {
    sale,
    nextState: {
      ...state,
      products: nextProducts,
      customers: nextCustomers,
      sales: [sale, ...state.sales],
      payments: nextPayments,
      warranties: nextWarranties,
      notifications: nextNotifications.slice(0, 40),
    },
  };
}

export interface CreatePurchaseInput {
  supplierId: string;
  items: Array<{ productId: string; quantity: number; unitCost: number }>;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export function recordPurchaseOrder(
  state: CrmState,
  input: CreatePurchaseInput,
): { nextState: CrmState; purchase: Purchase } {
  const supplier = state.suppliers.find((s) => s.id === input.supplierId);
  if (!supplier) throw new Error('Supplier not found');
  if (input.items.length === 0) throw new Error('Add at least one product');

  const today = new Date().toISOString().slice(0, 10);
  const productsMap = new Map(state.products.map((p) => [p.id, p]));

  const purchaseItems = input.items.map((line) => {
    const prod = productsMap.get(line.productId);
    if (!prod) throw new Error('Product not found');
    const qty = Math.max(1, Math.round(line.quantity));
    const unitCost = Math.max(0, Math.round(line.unitCost));
    return {
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unitCost,
      lineTotal: qty * unitCost,
    };
  });

  const totalAmount = purchaseItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const paidAmount = Math.min(Math.max(0, Math.round(input.paidAmount)), totalAmount);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const purchase: Purchase = {
    id: `pur-${Date.now()}`,
    invoiceNumber: `PO-2026-${404 + state.purchases.length}`,
    supplierId: supplier.id,
    supplierName: supplier.name,
    date: today,
    items: purchaseItems,
    totalAmount,
    paidAmount,
    remainingAmount,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
  };

  // Increment inventory quantities & refresh purchase cost
  const additions = new Map<string, { qty: number; unitCost: number }>();
  for (const item of purchaseItems) {
    const prev = additions.get(item.productId);
    additions.set(item.productId, {
      qty: (prev?.qty || 0) + item.quantity,
      unitCost: item.unitCost,
    });
  }

  const nextProducts = state.products.map((prod) => {
    const added = additions.get(prod.id);
    if (!added) return prod;
    return {
      ...prod,
      quantity: prod.quantity + added.qty,
      purchasePrice: added.unitCost > 0 ? added.unitCost : prod.purchasePrice,
    };
  });

  const nextSuppliers = state.suppliers.map((sup) => {
    if (sup.id !== supplier.id) return sup;
    return {
      ...sup,
      totalPurchases: sup.totalPurchases + totalAmount,
      paidAmount: sup.paidAmount + paidAmount,
      outstandingBalance: sup.outstandingBalance + remainingAmount,
    };
  });

  return {
    purchase,
    nextState: {
      ...state,
      products: nextProducts,
      suppliers: nextSuppliers,
      purchases: [purchase, ...state.purchases],
    },
  };
}

export interface RecordPaymentInput {
  customerId: string;
  amount: number;
  method: PaymentMethod;
  invoiceNumber?: string;
  reference?: string;
  notes?: string;
}

export function recordCustomerPayment(
  state: CrmState,
  input: RecordPaymentInput,
): { nextState: CrmState; payment: CustomerPayment } {
  const customer = state.customers.find((c) => c.id === input.customerId);
  if (!customer) throw new Error('Customer not found');
  const amount = Math.round(input.amount);
  if (amount <= 0) throw new Error('Payment amount must be greater than zero');

  const today = new Date().toISOString().slice(0, 10);
  const payment: CustomerPayment = {
    id: `pay-${Date.now()}`,
    customerId: customer.id,
    customerName: customer.name,
    invoiceNumber: input.invoiceNumber || undefined,
    amount,
    date: today,
    method: input.method,
    reference: input.reference,
    notes: input.notes,
  };

  const nextCustomers = state.customers.map((c) => {
    if (c.id !== customer.id) return c;
    const nextBal = Math.max(0, c.outstandingBalance - amount);
    return {
      ...c,
      totalPaid: c.totalPaid + amount,
      outstandingBalance: nextBal,
      status: nextBal === 0 && c.status === 'Credit Hold' ? 'Active' : c.status,
    };
  });

  // Also apply payment toward open invoices for this customer
  let remainingToApply = amount;
  const nextSales = state.sales.map((sale) => {
    if (sale.customerId !== customer.id || sale.remainingBalance <= 0 || remainingToApply <= 0) {
      return sale;
    }
    if (input.invoiceNumber && sale.invoiceNumber !== input.invoiceNumber) {
      return sale;
    }
    const applied = Math.min(sale.remainingBalance, remainingToApply);
    remainingToApply -= applied;
    const nextRem = sale.remainingBalance - applied;
    return {
      ...sale,
      paidAmount: sale.paidAmount + applied,
      remainingBalance: nextRem,
      paymentStatus: nextRem === 0 ? ('Paid' as const) : ('Partial' as const),
    };
  });

  return {
    payment,
    nextState: {
      ...state,
      customers: nextCustomers,
      sales: nextSales,
      payments: [payment, ...state.payments],
    },
  };
}

export interface ProcessReturnInput {
  invoiceNumber: string;
  productId: string;
  quantity: number;
  type: 'Refund' | 'Exchange';
  reason: string;
  exchangeProductId?: string;
}

export function processReturnOrExchange(
  state: CrmState,
  input: ProcessReturnInput,
): { nextState: CrmState; record: ReturnRecord } {
  const sale = state.sales.find(
    (s) => s.invoiceNumber.toLowerCase() === input.invoiceNumber.trim().toLowerCase(),
  );
  if (!sale) throw new Error('Invoice not found');

  const soldLine = sale.items.find((i) => i.productId === input.productId);
  if (!soldLine) throw new Error('Selected product is not on this invoice');

  const alreadyReturned = state.returns
    .filter(
      (r) =>
        r.invoiceNumber === sale.invoiceNumber && r.productId === input.productId,
    )
    .reduce((sum, r) => sum + r.quantity, 0);

  if (input.quantity <= 0 || input.quantity + alreadyReturned > soldLine.quantity) {
    throw new Error(
      `Return quantity exceeds remaining returnable units (${soldLine.quantity - alreadyReturned} left)`,
    );
  }

  const exchangeProd = input.exchangeProductId
    ? state.products.find((p) => p.id === input.exchangeProductId)
    : undefined;
  if (input.type === 'Exchange' && (!exchangeProd || exchangeProd.quantity < 1)) {
    throw new Error('Selected exchange product is out of stock');
  }

  const today = new Date().toISOString().slice(0, 10);
  const refundAmount = input.type === 'Refund' ? soldLine.unitPrice * input.quantity : 0;

  const record: ReturnRecord = {
    id: `ret-${Date.now()}`,
    returnNumber: `RET-2026-0${20 + state.returns.length}`,
    invoiceNumber: sale.invoiceNumber,
    customerName: sale.customerName,
    productId: soldLine.productId,
    productName: soldLine.productName,
    quantity: input.quantity,
    type: input.type,
    reason: input.reason.trim(),
    refundAmount,
    exchangeProductId: exchangeProd?.id,
    exchangeProductName: exchangeProd?.name,
    date: today,
  };

  const nextProducts = state.products.map((p) => {
    let qty = p.quantity;
    if (p.id === soldLine.productId) qty += input.quantity;
    if (exchangeProd && p.id === exchangeProd.id) qty = Math.max(0, qty - 1);
    return qty === p.quantity ? p : { ...p, quantity: qty };
  });

  return {
    record,
    nextState: {
      ...state,
      products: nextProducts,
      returns: [record, ...state.returns],
    },
  };
}

export function computeDashboardMetrics(state: CrmState) {
  const today = new Date().toISOString().slice(0, 10);

  const todaysSalesList = state.sales.filter((s) => s.date === today);
  const todaysSales = todaysSalesList.reduce((sum, s) => sum + s.grandTotal, 0);

  const trackedSalesTotal = state.sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const trackedCostTotal = state.sales.reduce((sum, s) => sum + s.totalCost, 0);
  const trackedReturnsTotal = state.returns.reduce((sum, r) => sum + r.refundAmount, 0);
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);

  const monthlySales = state.baseline.extraMonthlySales + trackedSalesTotal;
  const totalProducts = state.baseline.extraProductsCount + state.products.length;
  const totalCustomers = state.baseline.extraCustomersCount + state.customers.length;

  const lowStockItems = state.products.filter((p) => p.quantity <= p.minStock);
  const lowStockCount = state.baseline.extraLowStockCount + lowStockItems.length;

  const outstandingPayments = state.customers.reduce(
    (sum, c) => sum + c.outstandingBalance,
    0,
  );

  // True COGS-aware profit: (Tracked Revenue - COGS - Returns - Expenses) + historical baseline profit
  const estimatedProfit =
    trackedSalesTotal -
    trackedCostTotal -
    trackedReturnsTotal -
    totalExpenses +
    state.baseline.extraMonthlyProfit;

  // Weekly sales (7 days ending today)
  const weeklySales = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const total = state.sales
      .filter((s) => s.date === iso)
      .reduce((sum, s) => sum + s.grandTotal, 0);
    weeklySales.push({ day: dayLabel, date: iso, sales: total });
  }

  // Monthly revenue (6 months ending current month)
  const monthlyRevenue = [
    { month: 'Jun', revenue: 1780000, expenses: 162000 },
    { month: 'Jul', revenue: 1940000, expenses: 171000 },
    { month: 'Aug', revenue: 2180000, expenses: 178000 },
    { month: 'Sep', revenue: 2090000, expenses: 174000 },
    { month: 'Oct', revenue: 2310000, expenses: 181000 },
    { month: 'Nov', revenue: monthlySales, expenses: totalExpenses },
  ];

  // Sales by Category
  const categoryMap = new Map<string, number>();
  for (const sale of state.sales) {
    for (const item of sale.items) {
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + item.lineTotal);
    }
  }
  const salesByCategory = Array.from(categoryMap.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Payment Methods
  const methodMap = new Map<string, { amount: number; count: number }>();
  for (const sale of state.sales) {
    const prev = methodMap.get(sale.paymentMethod) || { amount: 0, count: 0 };
    methodMap.set(sale.paymentMethod, {
      amount: prev.amount + sale.paidAmount,
      count: prev.count + 1,
    });
  }
  const paymentMethods = Array.from(methodMap.entries())
    .map(([method, data]) => ({ method, amount: data.amount, count: data.count }))
    .sort((a, b) => b.amount - a.amount);

  return {
    todaysSales,
    todaysInvoicesCount: todaysSalesList.length,
    monthlySales,
    totalProducts,
    totalCustomers,
    lowStockCount,
    lowStockItems,
    totalExpenses,
    outstandingPayments,
    estimatedProfit,
    weeklySales,
    monthlyRevenue,
    salesByCategory,
    paymentMethods,
  };
}
