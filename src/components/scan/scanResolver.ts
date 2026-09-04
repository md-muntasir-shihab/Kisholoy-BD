/**
 * @file src/components/scan/scanResolver.ts
 * @description Resolves a scanned / typed code to the correct KISHOLOY business
 *   record (Order, Shipment/Tracking, Product). Codes always resolve to a real
 *   entity or an explicit "not found" result — never a random match.
 * @license Apache-2.0
 */

import { Order, Product } from '../../types';

export type ScanEntityType = 'ORDER' | 'SHIPMENT' | 'PRODUCT';

export interface ScanResolution {
  type: ScanEntityType;
  label: string;
  code: string;
  order?: Order;
  product?: Product;
  trackingId?: string;
  sourceCode?: string;
}

/** Normalize a code for matching: trim, uppercase, collapse whitespace. */
export function normalizeCode(code: string): string {
  return String(code || '').trim().replace(/\s+/g, '').toUpperCase();
}

/**
 * Resolve a code against the provided orders and products.
 * Order matching: orderNumber, courier.trackingId, courier.consignmentId.
 * Product matching: sku, id.
 */
export function resolveScanCode(code: string, orders: Order[], products: Product[]): ScanResolution | null {
  const c = normalizeCode(code);
  if (!c) return null;

  // 1. Order lookup (orderNumber)
  const order = orders.find(
    (o) =>
      normalizeCode(o.orderNumber) === c ||
      normalizeCode(o.id) === c ||
      normalizeCode(o.courier?.trackingId || '') === c ||
      normalizeCode(o.courier?.consignmentId || '') === c
  );

  if (order) {
    const isTracking =
      normalizeCode(order.courier?.trackingId || '') === c ||
      normalizeCode(order.courier?.consignmentId || '') === c;
    return {
      type: isTracking ? 'SHIPMENT' : 'ORDER',
      label: isTracking ? 'Shipment / Tracking' : 'Order',
      code: c,
      order,
      trackingId: order.courier?.trackingId,
      sourceCode: isTracking ? (order.courier?.trackingId || order.courier?.consignmentId) : order.orderNumber,
    };
  }

  // 2. Product lookup (SKU / id)
  const product = products.find((p) => normalizeCode(p.sku) === c || normalizeCode(p.id) === c);
  if (product) {
    return {
      type: 'PRODUCT',
      label: 'Product / Inventory',
      code: c,
      product,
      sourceCode: product.sku,
    };
  }

  return null;
}

/** Human-friendly scan hint text. */
export function scanHintText(): string {
  return 'Scan an order number (KSH-…), courier tracking ID, or product SKU. Codes resolve to the correct business record.';
}
