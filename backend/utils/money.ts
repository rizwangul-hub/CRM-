/**
 * Financial math utilities storing all monetary values in integer minor units (paisa).
 * 1 PKR = 100 paisa. Avoids IEEE-754 floating-point drift in ledgers and profit reports.
 */

export function toPaisa(majorUnits: number): number {
  if (!Number.isFinite(majorUnits)) {
    throw new Error('Invalid monetary amount');
  }
  return Math.round(majorUnits * 100);
}

export function fromPaisa(paisa: number): number {
  if (!Number.isFinite(paisa)) {
    return 0;
  }
  return Math.round(paisa) / 100;
}

export function formatCurrency(paisa: number, currency = 'PKR'): string {
  const major = fromPaisa(paisa);
  const absFormatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(major));

  const prefix = major < 0 ? '-' : '';
  return `${prefix}${currency} ${absFormatted}`;
}

export interface LineItemCalculation {
  unitPricePaisa: number;
  quantity: number;
  discountPaisa?: number;
}

export interface SaleTotals {
  subtotalPaisa: number;
  itemDiscountPaisa: number;
  orderDiscountPaisa: number;
  taxPaisa: number;
  grandTotalPaisa: number;
}

export function calculateSaleTotals(
  items: LineItemCalculation[],
  orderDiscountPaisa = 0,
  taxRatePercent = 0,
): SaleTotals {
  let subtotalPaisa = 0;
  let itemDiscountPaisa = 0;

  for (const item of items) {
    if (item.quantity < 0 || item.unitPricePaisa < 0) {
      throw new Error('Quantity and unit price must be non-negative');
    }
    const lineGross = Math.round(item.unitPricePaisa) * Math.round(item.quantity);
    const lineDiscount = Math.min(Math.max(0, Math.round(item.discountPaisa || 0)), lineGross);
    subtotalPaisa += lineGross;
    itemDiscountPaisa += lineDiscount;
  }

  const afterItemDiscounts = subtotalPaisa - itemDiscountPaisa;
  const clampedOrderDiscount = Math.min(Math.max(0, Math.round(orderDiscountPaisa)), afterItemDiscounts);
  const taxableBase = afterItemDiscounts - clampedOrderDiscount;
  const taxPaisa = taxRatePercent > 0 ? Math.round((taxableBase * taxRatePercent) / 100) : 0;
  const grandTotalPaisa = taxableBase + taxPaisa;

  return {
    subtotalPaisa,
    itemDiscountPaisa,
    orderDiscountPaisa: clampedOrderDiscount,
    taxPaisa,
    grandTotalPaisa,
  };
}

export interface ProfitBreakdownInput {
  grossSalesPaisa: number;
  discountsPaisa: number;
  returnsPaisa: number;
  cogsPaisa: number;
  expensesPaisa: number;
}

export interface ProfitBreakdown {
  netRevenuePaisa: number;
  grossProfitPaisa: number;
  netProfitPaisa: number;
  marginPercent: number;
}

/**
 * True business profit calculation:
 * Net Revenue = Gross Sales - Discounts - Returns
 * Gross Profit = Net Revenue - COGS
 * Net Profit = Gross Profit - Operating Expenses
 */
export function calculateNetProfit(input: ProfitBreakdownInput): ProfitBreakdown {
  const netRevenuePaisa =
    Math.round(input.grossSalesPaisa) -
    Math.round(input.discountsPaisa) -
    Math.round(input.returnsPaisa);
  const grossProfitPaisa = netRevenuePaisa - Math.round(input.cogsPaisa);
  const netProfitPaisa = grossProfitPaisa - Math.round(input.expensesPaisa);
  const marginPercent =
    netRevenuePaisa > 0 ? Math.round((netProfitPaisa / netRevenuePaisa) * 10000) / 100 : 0;

  return {
    netRevenuePaisa,
    grossProfitPaisa,
    netProfitPaisa,
    marginPercent,
  };
}
