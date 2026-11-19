import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialCrmState } from '../data/seedData';
import {
  completePosSale,
  computeDashboardMetrics,
  processReturnOrExchange,
  recordCustomerPayment,
  recordPurchaseOrder,
} from './crmEngine';

test('Initial seed metrics match realistic shop targets', () => {
  const state = createInitialCrmState();
  const metrics = computeDashboardMetrics(state);

  assert.equal(metrics.todaysSales, 185000);
  assert.equal(metrics.monthlySales, 2450000);
  assert.equal(metrics.totalProducts, 245);
  assert.equal(metrics.totalCustomers, 580);
  assert.equal(metrics.lowStockCount, 12);
  assert.equal(metrics.totalExpenses, 185000);
  assert.equal(metrics.outstandingPayments, 320000);
  assert.equal(metrics.estimatedProfit, 420000);
});

test('completePosSale deducts stock, updates dashboard metrics, customer balance, and registers warranty', () => {
  const initial = createInitialCrmState();
  const phoneBefore = initial.products.find((p) => p.id === 'prod-3')!;
  const custBefore = initial.customers.find((c) => c.id === 'cust-4')!;

  const { nextState, sale } = completePosSale(initial, {
    customerId: custBefore.id,
    customerName: custBefore.name,
    customerPhone: custBefore.phone,
    items: [{ productId: phoneBefore.id, quantity: 1, imei: '864219058279999' }],
    discount: 1000,
    taxRate: 0,
    paymentMethod: 'JazzCash',
    paidAmount: 50000,
    soldBy: 'Rizwan Ahmed',
  });

  assert.equal(sale.grandTotal, 75000);
  assert.equal(sale.remainingBalance, 25000);
  assert.equal(sale.paymentStatus, 'Partial');

  const phoneAfter = nextState.products.find((p) => p.id === 'prod-3')!;
  assert.equal(phoneAfter.quantity, phoneBefore.quantity - 1);

  const custAfter = nextState.customers.find((c) => c.id === 'cust-4')!;
  assert.equal(custAfter.outstandingBalance, custBefore.outstandingBalance + 25000);

  const metricsAfter = computeDashboardMetrics(nextState);
  assert.equal(metricsAfter.todaysSales, 185000 + 75000);
  assert.equal(metricsAfter.outstandingPayments, 320000 + 25000);

  // Warranty auto-registered for smartphone
  assert.ok(nextState.warranties.some((w) => w.imei === '864219058279999'));
});

test('recordPurchaseOrder increases stock and updates supplier payables', () => {
  const initial = createInitialCrmState();
  const prodBefore = initial.products.find((p) => p.id === 'prod-7')!;
  const supBefore = initial.suppliers.find((s) => s.id === 'sup-3')!;

  const { nextState, purchase } = recordPurchaseOrder(initial, {
    supplierId: supBefore.id,
    items: [{ productId: prodBefore.id, quantity: 5, unitCost: 50000 }],
    paidAmount: 150000,
    paymentMethod: 'Bank Transfer',
  });

  assert.equal(purchase.totalAmount, 250000);
  assert.equal(purchase.remainingAmount, 100000);
  assert.equal(nextState.products.find((p) => p.id === 'prod-7')!.quantity, prodBefore.quantity + 5);
  assert.equal(
    nextState.suppliers.find((s) => s.id === 'sup-3')!.outstandingBalance,
    supBefore.outstandingBalance + 100000,
  );
});

test('recordCustomerPayment lowers customer balance and updates invoice status', () => {
  const initial = createInitialCrmState();
  const { nextState } = recordCustomerPayment(initial, {
    customerId: 'cust-6',
    invoiceNumber: 'INV-2026-1042',
    amount: 45000,
    method: 'Cash',
  });

  const cust = nextState.customers.find((c) => c.id === 'cust-6')!;
  const sale = nextState.sales.find((s) => s.invoiceNumber === 'INV-2026-1042')!;
  assert.equal(cust.outstandingBalance, 0);
  assert.equal(sale.remainingBalance, 0);
  assert.equal(sale.paymentStatus, 'Paid');
});

test('processReturnOrExchange prevents returning more than sold quantity and restores stock', () => {
  const initial = createInitialCrmState();
  const prodBefore = initial.products.find((p) => p.id === 'prod-4')!;

  assert.throws(() =>
    processReturnOrExchange(initial, {
      invoiceNumber: 'INV-2026-1042',
      productId: 'prod-4',
      quantity: 2,
      type: 'Refund',
      reason: 'Exceeds sold quantity',
    }),
  );

  const { nextState, record } = processReturnOrExchange(initial, {
    invoiceNumber: 'INV-2026-1042',
    productId: 'prod-4',
    quantity: 1,
    type: 'Refund',
    reason: 'Speaker defect',
  });

  assert.equal(record.refundAmount, 134000);
  assert.equal(nextState.products.find((p) => p.id === 'prod-4')!.quantity, prodBefore.quantity + 1);
});
