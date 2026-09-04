/**
 * Server-Side Secure Financial Calculation Engine
 * Rule: Never trust client-side financial values. Always recalculate prices on the server.
 * @license Apache-2.0
 */

import { serverDb } from './db';
import { CartItem, Order } from '../src/types';
import { promotionEngine } from './promotionEngine';

export interface CalculationInput {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  division: string;
  district: string;
  couponCode?: string;
  customerPhone?: string;
  customerId?: string;
}

export interface VerifiedCalculationResult {
  verifiedItems: Array<{
    productId: string;
    title: string;
    titleBn: string;
    sku: string;
    image: string;
    unitPrice: number;
    costPrice: number;
    quantity: number;
    lineTotal: number;
    variantId?: string;
    variantName?: string;
  }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  isFreeShipping: boolean;
  couponApplied?: {
    code: string;
    discountAmount: number;
    description: string;
  };
  checksum: string;
  calculatedAt: string;
}

export function calculateOrderFinance(input: CalculationInput): VerifiedCalculationResult {
  const { items, division, district, couponCode } = input;
  const siteContent = serverDb.siteContent;
  const shippingFees = siteContent.shippingFees || {
    insideDhaka: 60,
    subDhaka: 100,
    outsideDhaka: 130,
    freeShippingThreshold: 5000
  };

  let subtotal = 0;
  const verifiedItems: VerifiedCalculationResult['verifiedItems'] = [];

  for (const clientItem of items) {
    const product = serverDb.getProductById(clientItem.productId);
    if (!product) {
      throw new Error(`Product with ID ${clientItem.productId} not found in authoritative catalog.`);
    }

    if (clientItem.quantity <= 0) {
      throw new Error(`Invalid quantity ${clientItem.quantity} for product "${product.title}".`);
    }

    if (product.stock < clientItem.quantity) {
      throw new Error(`Insufficient stock for "${product.title}". Available: ${product.stock}, Requested: ${clientItem.quantity}.`);
    }

    let unitPrice = product.price;
    let variantName: string | undefined;
    let itemSku = product.sku;

    if (clientItem.variantId && product.variants) {
      const variant = product.variants.find(v => v.id === clientItem.variantId);
      if (variant) {
        unitPrice = variant.price;
        variantName = variant.name;
        itemSku = variant.sku;
      }
    }

    const lineTotal = unitPrice * clientItem.quantity;
    subtotal += lineTotal;

    verifiedItems.push({
      productId: product.id,
      title: product.title,
      titleBn: product.titleBn,
      sku: itemSku,
      image: product.images[0] || '',
      unitPrice,
      costPrice: product.costPrice || (unitPrice * 0.6),
      quantity: clientItem.quantity,
      lineTotal,
      variantId: clientItem.variantId,
      variantName
    });
  }

  // Shipping Calculation based on Bangladesh delivery zone
  let shippingFee = shippingFees.outsideDhaka;
  const normalizedDistrict = (district || '').trim().toLowerCase();
  const normalizedDivision = (division || '').trim().toLowerCase();

  if (normalizedDistrict === 'dhaka' || normalizedDivision === 'dhaka city') {
    shippingFee = shippingFees.insideDhaka;
  } else if (['gazipur', 'savar', 'narayanganj', 'keraniganj'].includes(normalizedDistrict)) {
    shippingFee = shippingFees.subDhaka;
  } else {
    shippingFee = shippingFees.outsideDhaka;
  }

  // Free shipping threshold
  const isFreeShipping = subtotal >= shippingFees.freeShippingThreshold;
  if (isFreeShipping) {
    shippingFee = 0;
  }

  // Authoritative dynamic coupon evaluation via PromotionEngine
  let discount = 0;
  let couponApplied: VerifiedCalculationResult['couponApplied'] = undefined;

  if (couponCode) {
    const evalResult = promotionEngine.evaluateCoupon({
      couponCode,
      items: verifiedItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.unitPrice
      })),
      subtotal,
      shippingFee,
      customerPhone: input.customerPhone,
      customerId: input.customerId
    });

    if (evalResult.valid && evalResult.code) {
      discount = evalResult.discountAmount;
      shippingFee = evalResult.adjustedShippingFee;
      couponApplied = {
        code: evalResult.code,
        discountAmount: evalResult.discountAmount,
        description: evalResult.description || 'Promotional Discount Applied'
      };
    }
  }

  const grandTotal = Math.max(0, subtotal + shippingFee - discount);
  const calculatedAt = new Date().toISOString();

  // Simple pseudo-checksum for tamper detection
  const checksum = Buffer.from(
    `${subtotal}|${shippingFee}|${discount}|${grandTotal}|${calculatedAt}`
  ).toString('base64');

  return {
    verifiedItems,
    subtotal,
    shippingFee,
    discount,
    grandTotal,
    isFreeShipping,
    couponApplied,
    checksum,
    calculatedAt
  };
}

/**
 * Authoritative Server-Side Real-time P&L Ledger & Margin Computation
 */
export function calculateFinancialSummary() {
  const orders = serverDb.orders;
  const products = serverDb.products;
  const expenses = serverDb.expenses;
  const settlements = serverDb.settlements;
  const transactions = serverDb.paymentTransactions;

  // Active / Paid orders that contribute to revenue
  const nonCancelledOrders = orders.filter(o => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'FAILED');

  const grossRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.total, 0);
  const netSales = nonCancelledOrders.reduce((sum, o) => sum + (o.subtotal - (o.discount || 0)), 0);

  // Authoritative Cost of Goods Sold (Weaver procurement cost)
  const totalCogs = nonCancelledOrders.reduce((sum, o) => {
    return sum + o.items.reduce((itemSum, item) => {
      const prod = products.find(p => p.id === item.productId || p.sku === item.sku);
      const unitCost = prod?.costPrice || (item.price * 0.6);
      return itemSum + (unitCost * item.quantity);
    }, 0);
  }, 0);

  const grossProfit = grossRevenue - totalCogs;
  const grossMarginPct = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

  // Operating Expenses categorized
  const packagingTotal = expenses
    .filter(e => e.category === 'PACKAGING')
    .reduce((sum, e) => sum + e.amount, 0);

  // Courier cost: use recorded COURIER_FEES expenses when present; otherwise
  // fall back to a baseline fulfillment estimate. Never add both — that would
  // double-count the same courier cost.
  const recordedCourierFees = expenses
    .filter(e => e.category === 'COURIER_FEES')
    .reduce((sum, e) => sum + e.amount, 0);

  const courierFeesTotal = recordedCourierFees > 0
    ? recordedCourierFees
    : (nonCancelledOrders.length * 80); // baseline fulfillment estimate

  const marketingTotal = expenses
    .filter(e => e.category === 'MARKETING')
    .reduce((sum, e) => sum + e.amount, 0);

  const otherExpensesTotal = expenses
    .filter(e => !['PACKAGING', 'COURIER_FEES', 'MARKETING'].includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  // Payment gateway fees from recorded transactions
  const gatewayFeesTotal = transactions
    .filter(t => t.status === 'VALID')
    .reduce((sum, t) => sum + (t.feeDeducted || 0), 0);

  const discountsTotal = nonCancelledOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
  const totalOperatingExpenses = packagingTotal + courierFeesTotal + marketingTotal + otherExpensesTotal + gatewayFeesTotal;
  const estimatedOperatingProfit = grossProfit - totalOperatingExpenses;
  const estimatedOperatingMarginPct = grossRevenue > 0 ? (estimatedOperatingProfit / grossRevenue) * 100 : 0;

  // Bank Settlements
  const settledFundsInBank = settlements
    .filter(s => s.status === 'SETTLED')
    .reduce((sum, s) => sum + s.netPayout, 0);

  const pendingSettlements = settlements
    .filter(s => s.status !== 'SETTLED')
    .reduce((sum, s) => sum + s.netPayout, 0);

  // Cash flow metrics
  const cashReceivedFromGateways = transactions
    .filter(t => t.status === 'VALID')
    .reduce((sum, t) => sum + (t.amount - (t.feeDeducted || 0)), 0);

  const cashPaidForExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Unremitted COD receivables for delivered or dispatched COD orders
  const unremittedCodReceivable = orders
    .filter(o => o.paymentMethod === 'COD' && o.orderStatus !== 'CANCELLED' && o.paymentStatus !== 'PAID')
    .reduce((sum, o) => sum + (o.balanceDueCod !== undefined ? o.balanceDueCod : o.total), 0);

  const accountsReceivable = pendingSettlements + unremittedCodReceivable;

  return {
    grossRevenue,
    discountsTotal,
    netSales,
    totalCogs,
    grossProfit,
    grossMarginPct: Number(grossMarginPct.toFixed(2)),
    totalOperatingExpenses,
    gatewayFeesTotal: Number(gatewayFeesTotal.toFixed(2)),
    courierFeesTotal,
    marketingTotal,
    packagingTotal,
    otherExpensesTotal,
    netOperatingProfit: Number(estimatedOperatingProfit.toFixed(2)),
    netProfitMarginPct: Number(estimatedOperatingMarginPct.toFixed(2)),
    estimatedOperatingProfit: Number(estimatedOperatingProfit.toFixed(2)),
    estimatedOperatingMarginPct: Number(estimatedOperatingMarginPct.toFixed(2)),
    settledFundsInBank: Number(settledFundsInBank.toFixed(2)),
    pendingSettlements: Number(pendingSettlements.toFixed(2)),
    cashReceived: Number(cashReceivedFromGateways.toFixed(2)),
    cashPaid: Number(cashPaidForExpenses.toFixed(2)),
    accountsReceivable: Number(accountsReceivable.toFixed(2)),
    unremittedCodReceivable: Number(unremittedCodReceivable.toFixed(2)),
    accountingDisclaimer: 'Operational management metrics for internal decision support; not certified statutory financial accounts.'
  };
}

/**
 * Gateway & Courier Automated Reconciliation Engine
 */
export function performReconciliationScan() {
  const orders = serverDb.orders;
  const transactions = serverDb.paymentTransactions;
  const settlements = serverDb.settlements;
  const anomalies: Array<{
    id: string;
    orderNumber: string;
    type: 'MISSING_PAYMENT' | 'FEE_MISMATCH' | 'COD_UNREMITTED' | 'UNMATCHED_TRANSACTION';
    description: string;
    expectedAmount: number;
    actualAmount: number;
    difference: number;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }> = [];

  for (const order of orders) {
    if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'FAILED') continue;

    if (order.paymentMethod === 'SSLCOMMERZ' || order.paymentMethod === 'BKASH') {
      const tx = transactions.find(t => t.orderNumber === order.orderNumber);
      if (!tx) {
        if (order.paymentStatus === 'PAID') {
          anomalies.push({
            id: `anom-${order.orderNumber}-1`,
            orderNumber: order.orderNumber,
            type: 'MISSING_PAYMENT',
            description: `Order marked as PAID via ${order.paymentMethod} but missing authoritative gateway transaction record.`,
            expectedAmount: order.total,
            actualAmount: 0,
            difference: order.total,
            severity: 'HIGH'
          });
        }
      } else {
        if (Math.abs(tx.amount - order.total) > 1) {
          anomalies.push({
            id: `anom-${order.orderNumber}-2`,
            orderNumber: order.orderNumber,
            type: 'FEE_MISMATCH',
            description: `Amount mismatch: Order total is ৳${order.total}, but gateway transaction logged ৳${tx.amount}.`,
            expectedAmount: order.total,
            actualAmount: tx.amount,
            difference: Math.abs(tx.amount - order.total),
            severity: 'HIGH'
          });
        }
      }
    } else if (order.paymentMethod === 'COD') {
      if (order.courier.status === 'DELIVERED') {
        const tx = transactions.find(t => t.orderNumber === order.orderNumber);
        if (!tx) {
          anomalies.push({
            id: `anom-${order.orderNumber}-3`,
            orderNumber: order.orderNumber,
            type: 'COD_UNREMITTED',
            description: `Order delivered by ${order.courier.provider || 'Courier'} but COD cash remittance not yet logged or settled.`,
            expectedAmount: order.total,
            actualAmount: 0,
            difference: order.total,
            severity: 'MEDIUM'
          });
        }
      }
    }
  }

  return {
    scannedOrdersCount: orders.length,
    scannedTransactionsCount: transactions.length,
    scannedSettlementsCount: settlements.length,
    anomaliesCount: anomalies.length,
    anomalies,
    scannedAt: new Date().toISOString()
  };
}

