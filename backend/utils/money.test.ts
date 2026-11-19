import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNetProfit,
  calculateSaleTotals,
  formatCurrency,
  fromPaisa,
  toPaisa,
} from './money';

test('toPaisa and fromPaisa convert without floating-point drift', () => {
  assert.equal(toPaisa(472000), 47200000);
  assert.equal(toPaisa(19.99), 1999);
  assert.equal(fromPaisa(1999), 19.99);
  assert.equal(formatCurrency(toPaisa(472000), 'PKR'), 'PKR 472,000');
  assert.equal(formatCurrency(toPaisa(-1500), 'PKR'), '-PKR 1,500');
});

test('calculateSaleTotals computes item discounts, order discounts, and tax accurately', () => {
  const result = calculateSaleTotals(
    [
      { unitPricePaisa: toPaisa(50000), quantity: 2, discountPaisa: toPaisa(2000) },
      { unitPricePaisa: toPaisa(5000), quantity: 1, discountPaisa: 0 },
    ],
    toPaisa(3000),
    10,
  );

  assert.equal(result.subtotalPaisa, toPaisa(105000));
  assert.equal(result.itemDiscountPaisa, toPaisa(2000));
  assert.equal(result.orderDiscountPaisa, toPaisa(3000));
  // Taxable base = 105,000 - 2,000 - 3,000 = 100,000; 10% tax = 10,000
  assert.equal(result.taxPaisa, toPaisa(10000));
  assert.equal(result.grandTotalPaisa, toPaisa(110000));
});

test('calculateNetProfit accounts for COGS, discounts, returns, and expenses', () => {
  const breakdown = calculateNetProfit({
    grossSalesPaisa: toPaisa(1000000),
    discountsPaisa: toPaisa(20000),
    returnsPaisa: toPaisa(30000),
    cogsPaisa: toPaisa(750000),
    expensesPaisa: toPaisa(100000),
  });

  // Net Revenue = 1,000,000 - 20,000 - 30,000 = 950,000
  // Gross Profit = 950,000 - 750,000 = 200,000
  // Net Profit = 200,000 - 100,000 = 100,000
  assert.equal(breakdown.netRevenuePaisa, toPaisa(950000));
  assert.equal(breakdown.grossProfitPaisa, toPaisa(200000));
  assert.equal(breakdown.netProfitPaisa, toPaisa(100000));
  assert.equal(breakdown.marginPercent, 10.53);
});
