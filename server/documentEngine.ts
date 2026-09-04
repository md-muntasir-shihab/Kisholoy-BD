/**
 * @file server/documentEngine.ts
 * @description KISHOLOY unified Document & Print Engine (server side).
 *
 * Responsibilities:
 *  - Resolve the required document set for a business record (smart selection).
 *  - Build authoritative document data from the server database.
 *  - Generate real, entity-resolving barcodes (bwip-js) and QR codes (qrcode).
 *  - Persist document/print settings.
 *
 * Printing is always an OUTPUT-ONLY operation: it never mutates orders,
 * payments, settlements, shipments or financial records.
 * @license Apache-2.0
 */

import { toBuffer as bwipToBuffer } from 'bwip-js/node';
import { toDataURL as qrcodeToDataURL } from 'qrcode';
import { serverDb } from './db';
import {
  PrintDocumentType,
  PrintSettings,
  PrintDocumentConfig,
  PrintOrderPayload,
  SiteContent,
  Order,
} from '../src/types';
import {
  defaultPrintSettings,
  resolveOrderDocuments,
  PRINT_FIELD_DEFINITIONS,
  PRINT_DOCUMENT_LABELS,
  PRINT_PAGE_FORMATS,
  defaultDocumentConfig,
  PRINT_DOCUMENT_TYPES,
} from '../src/lib/printFormats';

/** Merge any stored settings over the defaults (forward-compatible). */
export function normalizePrintSettings(raw?: Partial<PrintSettings> | null): PrintSettings {
  const base = defaultPrintSettings();
  if (!raw) return base;
  const out: PrintSettings = { ...base, ...raw };
  // Ensure every document type exists with valid shape.
  for (const t of PRINT_DOCUMENT_TYPES) {
    const stored = raw.documents?.[t];
    const def = defaultDocumentConfig(t);
    out.documents[t] = {
      ...def,
      ...(stored || {}),
      fields: { ...def.fields, ...(stored?.fields || {}) },
    } as PrintDocumentConfig;
  }
  return out;
}

export function getPrintSettings(): PrintSettings {
  return normalizePrintSettings(serverDb.printSettings);
}

export function savePrintSettings(settings: Partial<PrintSettings>): PrintSettings {
  const normalized = normalizePrintSettings(settings);
  serverDb.printSettings = normalized;
  return normalized;
}

export function resetPrintSettings(): PrintSettings {
  const s = defaultPrintSettings();
  serverDb.printSettings = s;
  return s;
}

/** Derived document number for an order's invoice. */
export function invoiceNumberFor(order: Order): string {
  const seq = String(order.orderNumber).replace('KSH-', '');
  const year = new Date(order.createdAt).getFullYear();
  return `INV-${year}-${seq}`;
}

/** Derived payment reference for an order. */
export function paymentNumberFor(order: Order): string {
  const seq = String(order.orderNumber).replace('KSH-', '');
  const year = new Date(order.createdAt).getFullYear();
  return `PAY-${year}-${seq}`;
}

/** Generate a real CODE128 barcode as a PNG data URL. */
export async function generateBarcode(text: string): Promise<string | null> {
  if (!text) return null;
  try {
    const buf = await bwipToBuffer({
      bcid: 'code128',
      text,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: 'center',
      backgroundcolor: 'FFFFFF',
    });
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch (err) {
    console.error('Barcode generation failed:', text, err);
    return null;
  }
}

/** Generate a real QR code as a PNG data URL. */
export async function generateQr(text: string): Promise<string | null> {
  if (!text) return null;
  try {
    const dataUrl = await qrcodeToDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
      color: { dark: '#000000', light: '#ffffff' },
    });
    return dataUrl;
  } catch (err) {
    console.error('QR generation failed:', text, err);
    return null;
  }
}

/** Resolve the required documents for an order. */
export function resolveDocumentSet(order: Order, settings: PrintSettings) {
  const resolved = resolveOrderDocuments(order);
  return resolved.filter((d) => settings.documents[d.type]?.enabled !== false);
}

/** Build order lookup payload used when printing. */
export function buildOrderPrintPayload(order: Order, overrides?: Partial<PrintSettings>): PrintOrderPayload {
  const settings = getPrintSettings();
  const documents = resolveDocumentSet(order, settings);
  const orderNumber = order.orderNumber;
  const tracking = order.courier?.trackingId || orderNumber;

  // Barcode / QR keys are deterministic business references.
  const payload = {
    order,
    documents,
    settings,
    siteContent: serverDb.siteContent,
    codes: {
      barcodes: {
        order: orderNumber,
        tracking: tracking,
        invoice: invoiceNumberFor(order),
        payment: paymentNumberFor(order),
      },
      qrs: {
        order: orderNumber,
        tracking,
        invoice: invoiceNumberFor(order),
        payment: paymentNumberFor(order),
      },
    },
  };

  return payload;
}

/** Resolve a single order by order number. */
export function findOrderByNumber(orderNumber: string): Order | undefined {
  return serverDb.orders.find(
    (o) => o.orderNumber === orderNumber || o.id === orderNumber
  );
}

/** Build a supplier statement print payload (verified, with real codes). */
export async function buildSupplierStatementPayload(
  supplierId: string,
  periodStart?: string,
  periodEnd?: string
): Promise<{ success: boolean; payload?: any; error?: string }> {
  // Import lazily to avoid circular-dependency issues.
  const { supplierEngine } = await import('./supplierEngine');
  const statement = supplierEngine.generateSupplierStatement(supplierId, periodStart, periodEnd);
  if (!statement) return { success: false, error: 'Supplier not found' };

  const settings = getPrintSettings();
  const ref = statement.statementNumber;
  const codes = {
    barcodes: {
      statement: (await generateBarcode(ref)) || '',
      supplier: (await generateBarcode(statement.supplier.code)) || '',
    },
    qrs: {
      statement: (await generateQr(ref)) || '',
      supplier: (await generateQr(statement.supplier.code)) || '',
    },
  };

  return {
    success: true,
    payload: {
      statement,
      siteContent: serverDb.siteContent,
      settings,
      codes,
    },
  };
}

/** Build a purchase order print payload (verified, with real codes). */
export async function buildPurchaseOrderPayload(
  poId: string
): Promise<{ success: boolean; payload?: any; error?: string }> {
  const { supplierEngine } = await import('./supplierEngine');
  const po = supplierEngine.getPurchaseOrderById(poId);
  if (!po) return { success: false, error: 'Purchase order not found' };

  const settings = getPrintSettings();
  const supplier = supplierEngine.getSupplierById(po.supplierId)?.supplier;
  const codes = {
    barcodes: {
      po: (await generateBarcode(po.poNumber)) || '',
      supplier: (await generateBarcode(supplier?.code || po.supplierId)) || '',
    },
    qrs: {
      po: (await generateQr(po.poNumber)) || '',
      supplier: (await generateQr(supplier?.code || po.supplierId)) || '',
    },
  };

  return {
    success: true,
    payload: {
      po,
      supplier,
      siteContent: serverDb.siteContent,
      settings,
      codes,
    },
  };
}

/** Build a customer return / refund print payload (verified, with real codes). */
export async function buildReturnRefundPayload(
  returnId: string
): Promise<{ success: boolean; payload?: any; error?: string }> {
  const ret = serverDb.customerReturns.find((r) => r.id === returnId);
  if (!ret) return { success: false, error: 'Return request not found' };

  const settings = getPrintSettings();
  const order = serverDb.orders.find((o) => o.id === ret.orderId || o.orderNumber === ret.orderNumber);
  const customer = serverDb.customers.find((c) => c.id === ret.customerId);

  // Resolve a refund amount estimate from any matching refund record or order value.
  const codes = {
    barcodes: {
      return: (await generateBarcode(ret.requestNumber)) || '',
      order: (await generateBarcode(ret.orderNumber)) || '',
    },
    qrs: {
      return: (await generateQr(ret.requestNumber)) || '',
      order: (await generateQr(ret.orderNumber)) || '',
    },
  };

  return {
    success: true,
    payload: {
      ret,
      order,
      customer,
      siteContent: serverDb.siteContent,
      settings,
      codes,
    },
  };
}

/** Build a business report print payload (verified, with real codes). */
export async function buildReportPayload(
  dateRange: string = 'ALL',
  from?: string,
  to?: string
): Promise<{ success: boolean; payload?: any; error?: string }> {
  const { reportService } = await import('./reportService');
  const report = reportService.getAnalyticsReport(dateRange, from, to);
  if (!report) return { success: false, error: 'Failed to generate report' };

  const settings = getPrintSettings();
  const title = `KISHOLOY Business Report (${dateRange})`;
  const ref = `RPT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  const codes = {
    barcodes: {
      report: (await generateBarcode(ref)) || '',
    },
    qrs: {
      report: (await generateQr(ref)) || '',
    },
  };

  return {
    success: true,
    payload: {
      report,
      ref,
      title,
      dateRange,
      from: from || '',
      to: to || '',
      siteContent: serverDb.siteContent,
      settings,
      codes,
    },
  };
}

export { PRINT_FIELD_DEFINITIONS, PRINT_DOCUMENT_LABELS, PRINT_PAGE_FORMATS, PRINT_DOCUMENT_TYPES };
