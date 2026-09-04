/**
 * @file src/components/print/ReturnRefundTemplate.tsx
 * @description Unified KISHOLOY Return / Refund document template used by the
 *   single Document & Print Engine. Accepts a normalized view-model so it can be
 *   produced from the admin RMA records or from server-verified return data.
 * @license Apache-2.0
 */

import React from 'react';
import { SiteContent, PrintSettings, DocLanguage } from '../../types';
import { PRINT_FIELD_DEFINITIONS } from '../../lib/printFormats';

/** Normalized return/refund data passed to the template. */
export interface ReturnRefundPrintData {
  requestNumber: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productTitle: string;
  sku?: string;
  quantity: number;
  amount: number;
  reason: string;
  reasonDetails: string;
  resolution: string;
  status: string;
  createdAt: string;
  notes?: string;
}

export interface ReturnRefundTemplateProps {
  data: ReturnRefundPrintData;
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
  const doc = settings.documents['RETURN_REFUND'];
  if (!doc) return false;
  if (key in doc.fields) return doc.fields[key];
  const def = PRINT_FIELD_DEFINITIONS['RETURN_REFUND']?.find((f) => f.key === key);
  if (def) return def.category === 'REQUIRED' || def.category === 'SYSTEM_CONTROLLED';
  return false;
}
function lang(settings: PrintSettings): DocLanguage {
  return settings.documents['RETURN_REFUND']?.language || 'BILINGUAL';
}

export function ReturnRefundTemplate({ data, siteContent, settings, codes, pageWidthPx }: ReturnRefundTemplateProps) {
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
          <div style={{ fontWeight: 800, fontSize: '18px', color: '#115e59', textTransform: 'uppercase' }}>{t('Return / Refund', 'রিটার্ন / রিফান্ড')}</div>
          <div style={{ fontSize: '11px', color: '#57534e', fontWeight: 700 }}>{data.requestNumber}</div>
        </div>
      </div>

      {/* Customer + order */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#78716c' }}>{t('Customer', 'গ্রাহক')}</div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>{data.customerName}</div>
          <div style={{ fontSize: '10px', color: '#57534e' }}>{data.customerPhone}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#78716c' }}>{t('Order No.', 'অর্ডার নং')}</div>
          <div style={{ fontWeight: 700, fontSize: '11px' }}>{data.orderNumber}</div>
          <div style={{ fontSize: '9px', color: '#78716c', marginTop: '4px' }}>{t('Requested on', 'আবেদনের তারিখ')}: {dateStr(data.createdAt)}</div>
        </div>
      </div>

      {/* Product + reason + resolution */}
      <div style={{ display: 'flex', gap: '12px', margin: '8px 0' }}>
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#78716c' }}>{t('Product', 'পণ্য')}</div>
          <div style={{ fontWeight: 700, fontSize: '12px' }}>{data.productTitle}</div>
          <div style={{ fontSize: '10px', color: '#57534e' }}>{data.sku ? `${t('SKU', 'এসকেইউ')}: ${data.sku} • ` : ''}{t('Quantity', 'পরিমাণ')}: {data.quantity}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#78716c' }}>{t('Reason', 'কারণ')}</div>
          <div style={{ fontWeight: 700, fontSize: '11px' }}>{data.reason}</div>
          {data.reasonDetails && <div style={{ fontSize: '10px', color: '#57534e' }}>{data.reasonDetails}</div>}
        </div>
      </div>

      {/* Resolution + amount */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f4', borderRadius: '4px', padding: '10px', margin: '10px 0' }}>
        <div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#78716c' }}>{t('Resolution', 'সমাধান')}</div>
          <div style={{ fontWeight: 700, fontSize: '12px' }}>{data.resolution}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#78716c' }}>{t('Refund Amount', 'রিফান্ড পরিমাণ')}</div>
          <div style={{ fontWeight: 800, fontSize: '18px' }}>{currency(data.amount)}</div>
        </div>
      </div>

      {/* Status + notes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '6px' }}>
        <span style={{ color: '#57534e' }}>{t('Status', 'স্ট্যাটাস')}: <b style={{ color: '#115e59' }}>{data.status}</b></span>
        {data.notes && <span style={{ color: '#78716c' }}>{data.notes}</span>}
      </div>

      {/* Footer + codes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e7e5e4', paddingTop: '8px', marginTop: '10px' }}>
        <div style={{ fontSize: '9px', color: '#78716c' }}>{settings.documents['RETURN_REFUND']?.footer || ''}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {barcode('return') && <img src={barcode('return')!} alt="barcode" style={{ height: '42px' }} />}
          {qr('return') && <img src={qr('return')!} alt="qr" style={{ width: '54px', height: '54px' }} />}
        </div>
      </div>
    </div>
  );
}
