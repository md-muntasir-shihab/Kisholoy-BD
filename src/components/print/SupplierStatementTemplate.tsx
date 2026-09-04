/**
 * @file src/components/print/SupplierStatementTemplate.tsx
 * @description Unified KISHOLOY Supplier Settlement / Statement document template
 *   used by the single Document & Print Engine.
 * @license Apache-2.0
 */

import React from 'react';
import { SiteContent, PrintSettings, DocLanguage } from '../../types';
import { PRINT_FIELD_DEFINITIONS } from '../../lib/printFormats';
import { toBanglaDigits } from '../../utils/invoiceUtils';

/** Engine-shaped supplier statement returned by /api/suppliers/:id/statement */
export interface SupplierStatementData {
  statementNumber: string;
  generatedAt: string;
  period: { start: string; end: string };
  supplier: {
    id: string;
    code: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    bankDetails?: { bankName: string; accountName: string; accountNumber: string; branchName: string };
    mfsDetails?: { provider: string; accountType: string; accountNumber: string };
    paymentTerms: string;
  };
  financialSummary: {
    totalSuppliedBdt: number;
    totalSoldUnits: number;
    totalRemainingUnits: number;
    grossSalesValue: number;
    supplierEarnings: number;
    kisholoyMargin: number;
    totalDisbursed: number;
    netOutstandingDue: number;
  };
  batches: Array<{ batchNumber: string; receivedDate: string; productName: string; quantityReceived: number; quantitySold: number; quantityRemaining: number; supplierCost: number }>;
  settlements: Array<{ settlementNumber: string; periodStart: string; periodEnd: string; grossSales: number; supplierShare: number; currentPayable: number; paidAmount?: number; remainingDue?: number; status: string }>;
  payments: Array<{ id: string; amount: number; method?: string; referenceNumber?: string; date?: string }>;
}

export interface SupplierStatementTemplateProps {
  statement: SupplierStatementData;
  siteContent: SiteContent;
  settings: PrintSettings;
  codes?: {
    barcodes: Record<string, string>;
    qrs: Record<string, string>;
  };
  pageWidthPx: number;
}

function currency(n: number): string {
  const nn = Math.round((Number(n) || 0) * 100) / 100;
  return `৳${nn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dateStr(s: string): string {
  try {
    return new Date(s).toLocaleDateString('en-GB');
  } catch {
    return s || '';
  }
}
function fieldOn(settings: PrintSettings, key: string): boolean {
  const doc = settings.documents['SUPPLIER_SETTLEMENT'];
  if (!doc) return false;
  if (key in doc.fields) return doc.fields[key];
  const def = PRINT_FIELD_DEFINITIONS['SUPPLIER_SETTLEMENT']?.find((f) => f.key === key);
  if (def) return def.category === 'REQUIRED' || def.category === 'SYSTEM_CONTROLLED';
  return false;
}
function lang(settings: PrintSettings): DocLanguage {
  return settings.documents['SUPPLIER_SETTLEMENT']?.language || 'BILINGUAL';
}

export function SupplierStatementTemplate({ statement, siteContent, settings, codes, pageWidthPx }: SupplierStatementTemplateProps) {
  const visual = {
    brandName: settings.businessName || siteContent.brandName || 'KISHOLOY',
    brandNameBn: settings.businessNameBn || siteContent.brandNameBn || 'কিশলয়',
    address: settings.businessAddress || siteContent.contact?.address || '',
    phone: settings.businessPhone || siteContent.contact?.phone || '',
    email: settings.businessEmail || siteContent.contact?.email || '',
  };
  const s = statement;
  const fs = s.financialSummary;
  const L = lang(settings);
  const t = (en: string, bn: string) => (L === 'BN' ? bn : L === 'EN' ? en : `${en} / ${bn}`);
  const periodLabel = `${dateStr(s.period.start)} – ${dateStr(s.period.end)}`;
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
          <div style={{ fontWeight: 800, fontSize: '18px', color: '#115e59', textTransform: 'uppercase' }}>{t('Supplier Settlement', 'সাপ্লায়ার সেটেলমেন্ট')}</div>
          <div style={{ fontSize: '11px', color: '#57534e' }}>{s.statementNumber}</div>
        </div>
      </div>

      {/* Supplier + period */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#78716c' }}>{t('Supplier', 'সাপ্লায়ার')}</div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>{s.supplier.companyName}</div>
          <div style={{ fontSize: '10px', color: '#57534e' }}>{s.supplier.contactPerson} • {s.supplier.phone} • {s.supplier.email}</div>
          <div style={{ fontSize: '10px', color: '#57534e' }}>{s.supplier.address}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#78716c' }}>{t('Period', 'সময়সীমা')}</div>
          <div style={{ fontWeight: 700, fontSize: '11px' }}>{periodLabel}</div>
          <div style={{ fontSize: '9px', color: '#78716c', marginTop: '4px' }}>{t('Generated on', 'তৈরি')}: {dateStr(s.generatedAt)}</div>
        </div>
      </div>

      {/* Financial summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', margin: '10px 0' }}>
        {[
          { k: t('Gross Sales', 'মোট বিক্রয়'), v: currency(fs.grossSalesValue) },
          { k: t('Supplier Share', 'সাপ্লায়ার অংশ'), v: currency(fs.supplierEarnings) },
          { k: t('Disbursed', 'পরিশোধিত'), v: currency(fs.totalDisbursed) },
          { k: t('Net Due', 'নীট বকেয়া'), v: currency(fs.netOutstandingDue) },
        ].map((x, i) => (
          <div key={i} style={{ background: '#f5f5f4', borderRadius: '4px', padding: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#78716c', textTransform: 'uppercase' }}>{x.k}</div>
            <div style={{ fontWeight: 800, fontSize: '13px' }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Batches / stock */}
      {fieldOn(settings, 'products') && s.batches.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#115e59', margin: '6px 0 4px' }}>{t('Supply Batches', 'সরবরাহ ব্যাচ')}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
            <thead><tr style={{ background: '#f5f5f4' }}>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'left' }}>{t('Batch', 'ব্যাচ')}</th>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'left' }}>{t('Received', 'প্রাপ্তি')}</th>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'left' }}>{t('Product', 'পণ্য')}</th>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'right' }}>{t('Qty In', 'প্রাপ্ত')}</th>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'right' }}>{t('Sold', 'বিক্রীত')}</th>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'right' }}>{t('Remaining', 'অবশিষ্ট')}</th>
            </tr></thead>
            <tbody>
              {s.batches.map((b, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f4' }}>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px' }}>{b.batchNumber}</td>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px' }}>{dateStr(b.receivedDate)}</td>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px' }}>{b.productName}</td>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px', textAlign: 'right' }}>{b.quantityReceived}</td>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px', textAlign: 'right' }}>{b.quantitySold}</td>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px', textAlign: 'right' }}>{b.quantityRemaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Settlements */}
      {s.settlements.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#115e59', margin: '6px 0 4px' }}>{t('Settlements', 'সেটেলমেন্ট')}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
            <thead><tr style={{ background: '#f5f5f4' }}>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'left' }}>{t('Settlement', 'সেটেলমেন্ট')}</th>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'left' }}>{t('Period', 'সময়')}</th>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'right' }}>{t('Payable', 'প্রদেয়')}</th>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'right' }}>{t('Paid', 'পরিশোধিত')}</th>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'right' }}>{t('Status', 'স্ট্যাটাস')}</th>
            </tr></thead>
            <tbody>
              {s.settlements.map((st, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f4' }}>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px' }}>{st.settlementNumber}</td>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px' }}>{dateStr(st.periodStart)} – {dateStr(st.periodEnd)}</td>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px', textAlign: 'right' }}>{currency(st.currentPayable)}</td>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px', textAlign: 'right' }}>{currency(st.paidAmount ?? 0)}</td>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px', textAlign: 'right' }}>{st.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments */}
      {s.payments.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#115e59', margin: '6px 0 4px' }}>{t('Payments', 'পরিশোধ')}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
            <thead><tr style={{ background: '#f5f5f4' }}>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'left' }}>{t('Reference', 'রেফারেন্স')}</th>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'left' }}>{t('Method', 'মাধ্যম')}</th>
              <th style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: 'right' }}>{t('Amount', 'পরিমাণ')}</th>
            </tr></thead>
            <tbody>
              {s.payments.slice(0, 12).map((p, i) => (
                <tr key={p.id || i} style={{ borderBottom: '1px solid #f5f5f4' }}>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px' }}>{p.referenceNumber || p.id}</td>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px' }}>{p.method || '—'}</td>
                  <td style={{ border: '1px solid #f5f5f4', padding: '3px 5px', textAlign: 'right' }}>{currency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer + codes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e7e5e4', paddingTop: '8px', marginTop: '6px' }}>
        <div style={{ fontSize: '9px', color: '#78716c' }}>{settings.documents['SUPPLIER_SETTLEMENT']?.footer || ''}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {barcode('statement') && <img src={barcode('statement')!} alt="barcode" style={{ height: '42px' }} />}
          {qr('statement') && <img src={qr('statement')!} alt="qr" style={{ width: '54px', height: '54px' }} />}
        </div>
      </div>
    </div>
  );
}
