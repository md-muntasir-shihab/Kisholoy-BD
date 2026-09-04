/**
 * @file src/components/print/PurchaseDocumentTemplate.tsx
 * @description Unified KISHOLOY Purchase Order document template used by the
 *   single Document & Print Engine. Powered by server-verified purchase data.
 * @license Apache-2.0
 */

import React from 'react';
import { SiteContent, PrintSettings, SupplierPurchaseOrder, Supplier, DocLanguage } from '../../types';
import { PRINT_FIELD_DEFINITIONS } from '../../lib/printFormats';

export interface PurchaseTemplateProps {
  po: SupplierPurchaseOrder;
  supplier?: Supplier | null;
  siteContent: SiteContent;
  settings: PrintSettings;
  codes?: { barcodes: Record<string, string>; qrs: Record<string, string> };
  pageWidthPx: number;
}

function currency(n: number): string {
  const nn = Math.round((Number(n) || 0) * 100) / 100;
  return `৳${nn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dateStr(s?: string): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-GB');
  } catch {
    return s;
  }
}
function fieldOn(settings: PrintSettings, key: string): boolean {
  const doc = settings.documents['PURCHASE_DOCUMENT'];
  if (!doc) return false;
  if (key in doc.fields) return doc.fields[key];
  const def = PRINT_FIELD_DEFINITIONS['PURCHASE_DOCUMENT']?.find((f) => f.key === key);
  if (def) return def.category === 'REQUIRED' || def.category === 'SYSTEM_CONTROLLED';
  return false;
}
function lang(settings: PrintSettings): DocLanguage {
  return settings.documents['PURCHASE_DOCUMENT']?.language || 'BILINGUAL';
}

export function PurchaseDocumentTemplate({ po, supplier, siteContent, settings, codes, pageWidthPx }: PurchaseTemplateProps) {
  const visual = {
    brandName: settings.businessName || siteContent.brandName || 'KISHOLOY',
    brandNameBn: settings.businessNameBn || siteContent.brandNameBn || 'কিশলয়',
    address: settings.businessAddress || siteContent.contact?.address || '',
    phone: settings.businessPhone || siteContent.contact?.phone || '',
    email: settings.businessEmail || siteContent.contact?.email || '',
  };
  const L = lang(settings);
  const t = (en: string, bn: string) => (L === 'BN' ? bn : L === 'EN' ? en : `${en} / ${bn}`);
  const barcode = (key: string) => (codes && codes.barcodes[key]) || '';
  const qr = (key: string) => (codes && codes.qrs[key]) || '';

  return (
    <div style={{ width: '100%', background: '#ffffff', color: '#1c1917', fontFamily: "'Hind Siliguri', 'Plus Jakarta Sans', sans-serif", padding: '14px 16px', boxSizing: 'border-box', fontSize: '11.5px', lineHeight: 1.45, border: '1px solid #e7e5e4' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '2px solid #115e59', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '5px', background: '#115e59', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>ক</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.5px' }}>{visual.brandName}</div>
            <div style={{ fontSize: '10px', color: '#57534e' }}>{visual.brandNameBn} • {visual.address}</div>
            <div style={{ fontSize: '10px', color: '#57534e' }}>{visual.phone} • {visual.email}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: '18px', color: '#115e59', textTransform: 'uppercase' }}>{t('Purchase Order', 'ক্রয় আদেশ')}</div>
          <div style={{ fontSize: '11px', color: '#57534e', fontWeight: 700 }}>{po.poNumber}</div>
        </div>
      </div>

      {/* Supplier + PO meta */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#78716c' }}>{t('Supplier', 'সাপ্লায়ার')}</div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>{po.supplierName}</div>
          {supplier && <>
            <div style={{ fontSize: '10px', color: '#57534e' }}>{supplier.contactPerson} • {supplier.phone} • {supplier.email}</div>
            <div style={{ fontSize: '10px', color: '#57534e' }}>{supplier.address}</div>
          </>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#78716c' }}>{t('Order Date', 'অর্ডারের তারিখ')}</div>
          <div style={{ fontWeight: 700, fontSize: '11px' }}>{dateStr(po.orderDate)}</div>
          <div style={{ fontSize: '9px', color: '#78716c', marginTop: '4px' }}>{t('Expected', 'প্রত্যাশিত')}: {dateStr(po.expectedDeliveryDate)}</div>
          <div style={{ fontSize: '9px', color: '#78716c', marginTop: '2px' }}>{t('Created by', 'তৈরি করেছেন')}: {po.createdByName}</div>
        </div>
      </div>

      {/* Items */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#115e59', margin: '6px 0 4px' }}>{t('Items', 'পণ্যসমূহ')}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
          <thead><tr style={{ background: '#f5f5f4' }}>
            <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'left' }}>{t('Product', 'পণ্য')}</th>
            <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'left' }}>{t('SKU', 'এসকেইউ')}</th>
            <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'right' }}>{t('Qty', 'পরিমাণ')}</th>
            <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'right' }}>{t('Unit Cost', 'একক খরচ')}</th>
            <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'right' }}>{t('Subtotal', 'উপমোট')}</th>
          </tr></thead>
          <tbody>
            {po.items.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f5f5f4' }}>
                <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px' }}>{it.productTitle}</td>
                <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px' }}>{it.sku}</td>
                <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px', textAlign: 'right' }}>{it.quantity}</td>
                <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px', textAlign: 'right' }}>{currency(it.unitCost)}</td>
                <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px', textAlign: 'right' }}>{currency(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ marginLeft: 'auto', width: '55%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 6px', fontSize: '11px' }}>
          <span>{t('Total', 'সর্বমোট')}</span><span style={{ fontWeight: 700 }}>{currency(po.totalAmount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 6px', fontSize: '11px' }}>
          <span>{t('Paid', 'পরিশোধিত')}</span><span>{currency(po.paidAmount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 6px', fontSize: '11px' }}>
          <span>{t('Due', 'বকেয়া')}</span><span>{currency(po.dueAmount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: '#115e59', color: '#fff', borderRadius: '4px', fontSize: '13px', fontWeight: 800, marginTop: '4px' }}>
          <span>{t('Payment Status', 'পেমেন্ট স্ট্যাটাস')}</span><span>{po.paymentStatus} • {po.deliveryStatus}</span>
        </div>
      </div>

      {/* Notes */}
      {po.notes && <div style={{ marginTop: '10px', fontSize: '10px', color: '#78716c', borderTop: '1px solid #e7e5e4', paddingTop: '6px' }}>{po.notes}</div>}

      {/* Footer + codes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e7e5e4', paddingTop: '8px', marginTop: '10px' }}>
        <div style={{ fontSize: '9px', color: '#78716c' }}>{settings.documents['PURCHASE_DOCUMENT']?.footer || ''}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {barcode('po') && <img src={barcode('po')!} alt="barcode" style={{ height: '42px' }} />}
          {qr('po') && <img src={qr('po')!} alt="qr" style={{ width: '54px', height: '54px' }} />}
        </div>
      </div>
    </div>
  );
}
