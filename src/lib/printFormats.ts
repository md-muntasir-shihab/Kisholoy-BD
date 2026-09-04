/**
 * @file src/lib/printFormats.ts
 * @description Shared definitions for the KISHOLOY unified Document & Print Engine:
 *   document types, configurable field definitions, default settings, and page formats.
 * @license Apache-2.0
 */

import {
  PrintDocumentType,
  PrintDocumentConfig,
  PrintFieldDef,
  PrintSettings,
  DocPageFormat,
  PrintDocumentInstance,
} from '../types';

/** Standard list of printable documents (single source of truth). */
export const PRINT_DOCUMENT_TYPES: PrintDocumentType[] = [
  'INVOICE',
  'PAYMENT_RECEIPT',
  'PACKING_SLIP',
  'COURIER_LABEL',
  'SUPPLIER_SETTLEMENT',
  'PURCHASE_DOCUMENT',
  'RETURN_REFUND',
  'REPORT',
];

/** Human-friendly labels for each document type. */
export const PRINT_DOCUMENT_LABELS: Record<PrintDocumentType, { en: string; bn: string }> = {
  INVOICE: { en: 'Invoice', bn: 'চালান / ইনভয়েস' },
  PAYMENT_RECEIPT: { en: 'Payment Receipt', bn: 'পেমেন্ট রসিদ' },
  PACKING_SLIP: { en: 'Packing Slip', bn: 'প্যাকিং স্লিপ' },
  COURIER_LABEL: { en: 'Courier / Parcel Label', bn: 'কুরিয়ার / পার্সেল লেবেল' },
  SUPPLIER_SETTLEMENT: { en: 'Supplier Settlement Statement', bn: 'সাপ্লায়ার সেটেলমেন্ট স্টেটমেন্ট' },
  PURCHASE_DOCUMENT: { en: 'Purchase Document', bn: 'ক্রয় দলিল' },
  RETURN_REFUND: { en: 'Return / Refund Document', bn: 'রিটার্ন / রিফান্ড দলিল' },
  REPORT: { en: 'Business Report', bn: 'ব্যবসায়িক রিপোর্ট' },
};

/** Define a field permission helper. */
const req = (key: string, label: string, labelBn: string): PrintFieldDef => ({
  key,
  label,
  labelBn,
  category: 'REQUIRED',
});
const opt = (key: string, label: string, labelBn: string): PrintFieldDef => ({
  key,
  label,
  labelBn,
  category: 'OPTIONAL',
});
const sys = (key: string, label: string, labelBn: string): PrintFieldDef => ({
  key,
  label,
  labelBn,
  category: 'SYSTEM_CONTROLLED',
});

/** Field definitions per document type. */
export const PRINT_FIELD_DEFINITIONS: Record<PrintDocumentType, PrintFieldDef[]> = {
  INVOICE: [
    req('businessInfo', 'Business Information', 'ব্যবসায়িক তথ্য'),
    req('customer', 'Customer', 'গ্রাহক'),
    req('orderNumber', 'Order Number', 'অর্ডার নম্বর'),
    req('invoiceNumber', 'Invoice Number', 'ইনভয়েস নম্বর'),
    req('date', 'Date', 'তারিখ'),
    req('items', 'Products / Items', 'পণ্যসমূহ'),
    opt('sku', 'SKU', 'এসকেইউ'),
    opt('variant', 'Variant', 'ভ্যারিয়েন্ট'),
    req('quantity', 'Quantity', 'পরিমাণ'),
    req('unitPrice', 'Unit Price', 'একক মূল্য'),
    opt('discount', 'Discount', 'ডিসকাউন্ট'),
    req('subtotal', 'Subtotal', 'উপমোট'),
    req('shipping', 'Shipping', 'ডেলিভারি চার্জ'),
    req('tax', 'Tax / VAT', 'ট্যাক্স / ভ্যাট'),
    req('total', 'Grand Total', 'সর্বমোট'),
    req('paymentStatus', 'Payment Status', 'পেমেন্ট স্ট্যাটাস'),
    opt('paymentMethod', 'Payment Method', 'পেমেন্ট মাধ্যম'),
    opt('footer', 'Footer / Terms', 'ফুটার / শর্তাবলী'),
    opt('notes', 'Notes', 'নোট'),
    sys('invoiceNumber', 'Invoice Number (system)', 'ইনভয়েস নম্বর (সিস্টেম)'),
    opt('internalCost', 'Internal Product Cost', 'অভ্যন্তরীণ খরচ'),
    opt('internalProfit', 'Internal Profit', 'অভ্যন্তরীণ মুনাফা'),
    opt('supplierShare', 'Supplier Share', 'সাপ্লায়ার অংশ'),
  ],
  PAYMENT_RECEIPT: [
    req('businessInfo', 'Store Identity', 'স্টোর পরিচয়'),
    req('paymentNumber', 'Payment Number / Reference', 'পেমেন্ট নম্বর / রেফারেন্স'),
    req('date', 'Date / Time', 'তারিখ / সময়'),
    req('customer', 'Customer', 'গ্রাহক'),
    req('orderNumber', 'Order Number', 'অর্ডার নম্বর'),
    req('paymentMethod', 'Payment Method', 'পেমেন্ট মাধ্যম'),
    req('amountReceived', 'Amount Received', 'প্রাপ্ত পরিমাণ'),
    sys('transactionId', 'Transaction / Reference ID', 'ট্রানজেকশন / রেফারেন্স আইডি'),
    req('status', 'Status', 'স্ট্যাটাস'),
    opt('notes', 'Note', 'নোট'),
    opt('qr', 'QR Code', 'কিউআর কোড'),
  ],
  PACKING_SLIP: [
    req('orderNumber', 'Order Number', 'অর্ডার নম্বর'),
    req('customer', 'Customer', 'গ্রাহক'),
    req('phone', 'Phone', 'ফোন'),
    req('shippingAddress', 'Shipping Address', 'ডেলিভারি ঠিকানা'),
    req('items', 'Products', 'পণ্যসমূহ'),
    opt('variant', 'Variant', 'ভ্যারিয়েন্ট'),
    opt('sku', 'SKU', 'এসকেইউ'),
    req('quantity', 'Quantity', 'পরিমাণ'),
    req('packingNotes', 'Packing Notes', 'প্যাকিং নোট'),
    opt('parcelReference', 'Parcel Reference', 'পার্সেল রেফারেন্স'),
    opt('barcode', 'Barcode', 'বারকোড'),
    opt('qr', 'QR Code', 'কিউআর কোড'),
  ],
  COURIER_LABEL: [
    req('sender', 'Sender / Store', 'প্রেরক / স্টোর'),
    req('recipient', 'Recipient', 'প্রাপক'),
    req('phone', 'Phone', 'ফোন'),
    req('address', 'Address', 'ঠিকানা'),
    req('orderNumber', 'Order Number', 'অর্ডার নম্বর'),
    sys('trackingNumber', 'Tracking / Consignment Number', 'ট্র্যাকিং / কনসাইনমেন্ট নম্বর'),
    req('codAmount', 'COD Amount', 'ক্যাশ অন ডেলিভারি'),
    opt('parcelReference', 'Parcel Reference', 'পার্সেল রেফারেন্স'),
    opt('weight', 'Weight', 'ওজন'),
    req('courier', 'Courier', 'কুরিয়ার'),
    req('barcode', 'Barcode', 'বারকোড'),
    req('qr', 'QR Code', 'কিউআর কোড'),
  ],
  SUPPLIER_SETTLEMENT: [
    req('businessInfo', 'KISHOLOY Information', 'কিশলয় তথ্য'),
    req('supplier', 'Supplier Information', 'সাপ্লায়ার তথ্য'),
    req('settlementId', 'Settlement ID', 'সেটেলমেন্ট আইডি'),
    req('settlementPeriod', 'Settlement Period', 'সেটেলমেন্ট সময়সীমা'),
    opt('sales', 'Included Sales / Orders', 'অন্তর্ভুক্ত বিক্রয় / অর্ডার'),
    req('products', 'Products', 'পণ্যসমূহ'),
    req('quantities', 'Quantities', 'পরিমাণ'),
    req('supplierShare', 'Supplier Share', 'সাপ্লায়ার অংশ'),
    opt('adjustments', 'Adjustments', 'সমন্বয়'),
    opt('previousDue', 'Previous Due', 'পূর্বের বকেয়া'),
    req('currentPayable', 'Current Payable', 'বর্তমান প্রদেয়'),
    opt('payments', 'Payments', 'পেমেন্টসমূহ'),
    req('finalDue', 'Final Due', 'চূড়ান্ত বকেয়া'),
  ],
  PURCHASE_DOCUMENT: [
    req('businessInfo', 'Business Information', 'ব্যবসায়িক তথ্য'),
    req('supplier', 'Supplier', 'সাপ্লায়ার'),
    req('purchaseNumber', 'Purchase Order Number', 'ক্রয় অর্ডার নম্বর'),
    req('date', 'Date', 'তারিখ'),
    req('items', 'Products', 'পণ্যসমূহ'),
    req('quantity', 'Quantity', 'পরিমাণ'),
    req('unitCost', 'Unit Cost', 'একক খরচ'),
    req('total', 'Total', 'সর্বমোট'),
    opt('notes', 'Notes', 'নোট'),
  ],
  RETURN_REFUND: [
    req('businessInfo', 'Business Information', 'ব্যবসায়িক তথ্য'),
    req('customer', 'Customer', 'গ্রাহক'),
    req('orderNumber', 'Order Number', 'অর্ডার নম্বর'),
    req('returnNumber', 'Return / Refund Number', 'রিটার্ন / রিফান্ড নম্বর'),
    req('date', 'Date', 'তারিখ'),
    req('reason', 'Reason', 'কারণ'),
    req('items', 'Products', 'পণ্যসমূহ'),
    req('amount', 'Refund Amount', 'রিফান্ড পরিমাণ'),
    sys('referenceId', 'Reference ID', 'রেফারেন্স আইডি'),
  ],
  REPORT: [
    req('businessInfo', 'Business Information', 'ব্যবসায়িক তথ্য'),
    req('reportTitle', 'Report Title', 'রিপোর্ট শিরোনাম'),
    req('period', 'Period', 'সময়সীমা'),
    req('data', 'Report Data', 'রিপোর্ট ডেটা'),
    opt('footer', 'Footer', 'ফুটার'),
    opt('notes', 'Notes', 'নোট'),
  ],
};

/** Page dimension map (millimetres) and orientation. */
export const PRINT_PAGE_FORMATS: Record<DocPageFormat, { w: number; h: number; orientation: 'portrait' | 'landscape' }> = {
  A4: { w: 210, h: 297, orientation: 'portrait' },
  A5: { w: 148, h: 210, orientation: 'portrait' },
  LETTER: { w: 215.9, h: 279.4, orientation: 'portrait' },
  THERMAL_80MM: { w: 80, h: 210, orientation: 'portrait' },
  LABEL_4x6: { w: 101.6, h: 152.4, orientation: 'portrait' },
};

/** Default field visibility. Required/System fields always on; internals off. */
function defaultFields(type: PrintDocumentType): Record<string, boolean> {
  const defs = PRINT_FIELD_DEFINITIONS[type];
  const map: Record<string, boolean> = {};
  const internalKeys = ['internalCost', 'internalProfit', 'supplierShare'];
  for (const f of defs) {
    if (f.category === 'REQUIRED' || f.category === 'SYSTEM_CONTROLLED') {
      map[f.key] = true;
    } else {
      // Sensible defaults for optional fields
      map[f.key] = !internalKeys.includes(f.key) && f.key !== 'paymentMethod';
    }
  }
  return map;
}

/** A sensible default config for every document type. */
export function defaultDocumentConfig(type: PrintDocumentType): PrintDocumentConfig {
  const defaults: Partial<Record<PrintDocumentType, Partial<PrintDocumentConfig>>> = {
    INVOICE: { enabled: true, language: 'BILINGUAL', pageFormat: 'A4', footer: 'Thank you for shopping with KISHOLOY. Goods once sold will not be taken back without a valid receipt.', notes: 'This is a computer generated invoice.' },
    PAYMENT_RECEIPT: { enabled: true, language: 'BILINGUAL', pageFormat: 'THERMAL_80MM', footer: 'KISHOLOY — Payment Receipt', notes: 'Please keep this receipt for your records.' },
    PACKING_SLIP: { enabled: true, language: 'BILINGUAL', pageFormat: 'A4', footer: 'Please check the items before accepting the parcel.', notes: '' },
    COURIER_LABEL: { enabled: true, language: 'EN', pageFormat: 'LABEL_4x6', footer: '', notes: '' },
    SUPPLIER_SETTLEMENT: { enabled: true, language: 'BILINGUAL', pageFormat: 'A4', footer: 'This statement is generated automatically by KISHOLOY.', notes: '' },
    PURCHASE_DOCUMENT: { enabled: true, language: 'BILINGUAL', pageFormat: 'A4', footer: 'Authorized by KISHOLOY.', notes: '' },
    RETURN_REFUND: { enabled: true, language: 'BILINGUAL', pageFormat: 'A4', footer: '', notes: '' },
    REPORT: { enabled: true, language: 'BILINGUAL', pageFormat: 'A4', footer: 'Generated by KISHOLOY Business Reports.', notes: '' },
  };
  const d = defaults[type] || {};
  return {
    enabled: d.enabled ?? true,
    language: d.language ?? 'BILINGUAL',
    pageFormat: d.pageFormat ?? 'A4',
    showBarcode: type === 'COURIER_LABEL' || type === 'PACKING_SLIP',
    showQR: type !== 'REPORT',
    footer: d.footer ?? '',
    notes: d.notes ?? '',
    fields: defaultFields(type),
  };
}

/** Factory for the full default settings object. */
export function defaultPrintSettings(): PrintSettings {
  const documents = {} as Record<PrintDocumentType, PrintDocumentConfig>;
  for (const t of PRINT_DOCUMENT_TYPES) {
    documents[t] = defaultDocumentConfig(t);
  }
  return {
    documents,
    businessName: 'KISHOLOY',
    businessNameBn: 'কিশলয়',
    businessAddress: 'House 12, Road 4, Banani, Dhaka 1213',
    businessPhone: '01700-000000',
    businessEmail: 'care@kisholoy.com',
    updatedAt: new Date().toISOString(),
  };
}

/** Build the smart "required documents" list for an order based on its state. */
export interface PrintDocDecision {
  type: PrintDocumentType;
  active: boolean;
  reason: string;
}

export function resolveOrderDocuments(order: {
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  courier?: { trackingId?: string; status?: string; provider?: string };
  fulfillment?: unknown | null;
}): PrintDocumentInstance[] {
  const s = order.orderStatus || '';
  const pay = order.paymentStatus || '';
  const hasTracking = !!order.courier?.trackingId;
  const isCancelled = s === 'CANCELLED' || s === 'FAILED';
  const isReturned = s === 'RETURNED' || s === 'RETURN_REQUESTED';
  const fulfilling = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'].includes(s);
  const shipped = ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(s);
  const paid = ['PAID', 'PARTIALLY_PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(pay);
  const cod = order.paymentMethod === 'COD';

  const docs: PrintDocumentInstance[] = [];

  // Invoice: always relevant as a business record, even for cancelled orders.
  docs.push(mk('INVOICE', true, 'Primary accounting document.'));

  // Payment receipt: only when money was actually received.
  const receiptActive = paid || (cod && shipped) || (cod && s === 'DELIVERED');
  docs.push(mk('PAYMENT_RECEIPT', receiptActive, receiptActive ? 'Payment captured on record.' : 'No payment received yet.'));

  // Packing slip: only while the order is being fulfilled (not cancelled/returned).
  const packingActive = !isCancelled && !isReturned && (fulfilling || shipped);
  docs.push(mk('PACKING_SLIP', packingActive, packingActive ? 'Order is being packed / shipped.' : 'No active shipment.'));

  // Courier label: only when there is a shipment in transit / ready + a tracking ref or courier.
  const labelActive = !isCancelled && !isReturned && hasTracking && (shipped || s === 'READY_TO_SHIP');
  docs.push(mk('COURIER_LABEL', labelActive, labelActive ? 'Courier shipment active with tracking.' : 'No courier shipment to label.'));

  return docs;
}

function mk(type: PrintDocumentType, active: boolean, reason: string): PrintDocumentInstance {
  return {
    type,
    active,
    enabledByDefault: active,
    reason,
    label: PRINT_DOCUMENT_LABELS[type].en,
    labelBn: PRINT_DOCUMENT_LABELS[type].bn,
    pageFormat: 'A4',
  } as PrintDocumentInstance;
}

/** Resolve which documents should be included given the settings + smart defaults. */
export function resolveOrderDocumentsFromPayload(docs: PrintDocumentInstance[], settings: PrintSettings): PrintDocumentInstance[] {
  return docs.filter((d) => settings.documents[d.type]?.enabled !== false);
}
