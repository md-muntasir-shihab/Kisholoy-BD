/**
 * @file src/components/print/ReportTemplate.tsx
 * @description Unified KISHOLOY Business Report template (Sales / Financial P&L /
 *   District / Inventory / Tax) used by the single Document & Print Engine.
 * @license Apache-2.0
 */

import React from 'react';
import { SiteContent, PrintSettings, DocLanguage } from '../../types';
import { PRINT_FIELD_DEFINITIONS } from '../../lib/printFormats';

export interface ReportPrintData {
  report: {
    kpis: {
      totalOrders: number;
      grossRevenue: number;
      discounts: number;
      netSales: number;
      aov: number;
      totalItemsSold: number;
      avgBasketSize: number;
      grossProfit: number;
      grossMarginPct: number;
      netOperatingProfit: number;
      netMarginPct: number;
      overallDeliverySuccessRate: number;
      rtoRate: number;
      onlineSharePct: number;
      codSharePct: number;
      inTransitCodFloat: number;
    };
    districtMetrics: { district: string; division?: string; orderCount: number; revenue: number; deliveredCount: number; deliverySuccessRate: number; rtoRate?: number; codSharePct: number }[];
    categoryMetrics: { categoryName: string; categoryNameBn: string; unitsSold: number; grossSales: number; grossProfit: number; marginPct: number; stockUnits: number }[];
    inventoryVelocityMetrics: { sku: string; title: string; stock: number; unitsSold: number; daysOfSupply: number; velocityStatus: string; stockValuationCost: number }[];
    financialPnl: {
      grossRevenue: number; discounts: number; netSales: number; cogs: number; grossProfit: number; grossMarginPct: number;
      expensesTotal: number; expensesByCategory: { category: string; amount: number; count: number }[]; netOperatingProfit: number; netMarginPct: number;
    };
    customerCohorts: { totalCustomers: number; repeatCustomerCount: number; repeatPurchaseRate: number; avgCustomerLtv: number; firstTimeCount: number };
    taxSummary: { taxPeriod: string; grossTaxableSales: number; standardRatePct: number; vatCollected: number; inputTaxRebate: number; netVatPayable: number; binNumber: string; challanNumber?: string };
    dateRange: string;
    generatedAt: string;
  };
  title: string;
  ref: string;
  dateRange: string;
  from: string;
  to: string;
  settings?: PrintSettings;
  siteContent?: SiteContent;
  codes?: { barcodes: Record<string, string>; qrs: Record<string, string> };
}

export interface ReportTemplateProps {
  data: ReportPrintData;
  siteContent: SiteContent;
  settings: PrintSettings;
  codes?: { barcodes: Record<string, string>; qrs: Record<string, string> };
  pageWidthPx: number;
}

function currency(n: number): string {
  const nn = Math.round((Number(n) || 0) * 100) / 100;
  return `৳${nn.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
function pct(n: number): string {
  return `${(Number(n) || 0).toFixed(1)}%`;
}
function fmt(n: number): string {
  return Number(n || 0).toLocaleString('en-US');
}
function fieldOn(settings: PrintSettings, key: string): boolean {
  const doc = settings.documents['REPORT'];
  if (!doc) return false;
  if (key in doc.fields) return doc.fields[key];
  const def = PRINT_FIELD_DEFINITIONS['REPORT']?.find((f) => f.key === key);
  if (def) return def.category === 'REQUIRED' || def.category === 'SYSTEM_CONTROLLED';
  return false;
}
function lang(settings: PrintSettings): DocLanguage {
  return settings.documents['REPORT']?.language || 'BILINGUAL';
}

function Stat({ label, value, labelBn }: { label: string; value: string; labelBn?: string }) {
  return (
    <div style={{ background: '#f5f5f4', borderRadius: '4px', padding: '8px 6px', textAlign: 'center' }}>
      <div style={{ fontSize: '9px', color: '#78716c', textTransform: 'uppercase' }}>{label}{labelBn ? ` / ${labelBn}` : ''}</div>
      <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '2px' }}>{value}</div>
    </div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#115e59', margin: '10px 0 4px', borderBottom: '1px solid #e7e5e4', paddingBottom: '3px' }}>
      {children}
    </div>
  );
}
function MiniTable({ head, rows, align = [] }: { head: string[]; rows: (string | number)[][]; align?: ('left' | 'right')[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
      <thead><tr style={{ background: '#f5f5f4' }}>
        {head.map((h, i) => <th key={i} style={{ border: '1px solid #e7e5e4', padding: '3px 5px', textAlign: align[i] || 'left', fontWeight: 800 }}>{h}</th>)}
      </tr></thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} style={{ borderBottom: '1px solid #f5f5f4' }}>
            {r.map((c, ci) => <td key={ci} style={{ border: '1px solid #f5f5f4', padding: '3px 5px', textAlign: align[ci] || 'left', overflowWrap: 'anywhere' }}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ReportTemplate({ data, siteContent, settings, codes, pageWidthPx }: ReportTemplateProps) {
  const visual = {
    brandName: settings.businessName || siteContent.brandName || 'KISHOLOY',
    brandNameBn: settings.businessNameBn || siteContent.brandNameBn || 'কিশলয়',
    address: settings.businessAddress || siteContent.contact?.address || '',
    phone: settings.businessPhone || siteContent.contact?.phone || '',
    email: settings.businessEmail || siteContent.contact?.email || '',
  };
  const L = lang(settings);
  const t = (en: string, bn: string) => (L === 'BN' ? bn : L === 'EN' ? en : `${en} / ${bn}`);
  const r = data.report;
  const k = r.kpis;
  const fp = r.financialPnl;
  const barcode = (key: string) => (codes && codes.barcodes[key]) || '';
  const qr = (key: string) => (codes && codes.qrs[key]) || '';
  const periodStr = `${data.from || 'From start'} – ${data.to || 'Now'} (${data.dateRange})`;

  return (
    <div style={{ width: '100%', background: '#ffffff', color: '#1c1917', fontFamily: "'Hind Siliguri', 'Plus Jakarta Sans', sans-serif", padding: '14px 16px', boxSizing: 'border-box', fontSize: '11px', lineHeight: 1.45, border: '1px solid #e7e5e4' }}>
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
          <div style={{ fontWeight: 800, fontSize: '18px', color: '#115e59', textTransform: 'uppercase' }}>{t('Business Report', 'ব্যবসায়িক রিপোর্ট')}</div>
          <div style={{ fontSize: '11px', color: '#57534e' }}>{data.title}</div>
          <div style={{ fontSize: '9px', color: '#78716c' }}>{data.ref}</div>
        </div>
      </div>

      {/* Period + generated */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#57534e', marginBottom: '8px' }}>
        <span>{t('Period', 'সময়সীমা')}: <b>{periodStr}</b></span>
        <span>{t('Generated', 'তৈরি')}: {new Date(r.generatedAt).toLocaleString('en-GB')}</span>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        <Stat label="Total Orders" labelBn="মোট অর্ডার" value={fmt(k.totalOrders)} />
        <Stat label="Gross Revenue" labelBn="মোট বিক্রয়" value={currency(k.grossRevenue)} />
        <Stat label="Net Sales" labelBn="নীট বিক্রয়" value={currency(k.netSales)} />
        <Stat label="AOV" labelBn="গড় অর্ডার" value={currency(k.aov)} />
        <Stat label="Items Sold" labelBn="বিক্রীত পণ্য" value={fmt(k.totalItemsSold)} />
        <Stat label="Gross Profit" labelBn="মোট মুনাফা" value={currency(k.grossProfit)} />
        <Stat label="Net Profit" labelBn="নীট মুনাফা" value={currency(k.netOperatingProfit)} />
        <Stat label="Delivery Success" labelBn="ডেলিভারি সফল" value={pct(k.overallDeliverySuccessRate)} />
      </div>

      {/* Financial P&L */}
      {fieldOn(settings, 'data') && (
        <>
          <SectionTitle>{t('Financial P&L', 'আর্থিক লাভ-ক্ষতি')}</SectionTitle>
          <MiniTable
            head={[t('Metric', 'মেট্রিক'), t('Amount', 'পরিমাণ')]}
            rows={[
              [t('Gross Revenue (GMV)', 'মোট বিক্রয় (GMV)'), currency(fp.grossRevenue)],
              [t('Discounts & Vouchers', 'ডিসকাউন্ট'), `-${currency(fp.discounts)}`],
              [t('Net Sales', 'নীট বিক্রয়'), currency(fp.netSales)],
              [t('Cost of Goods Sold (COGS)', 'পণ্যের খরচ'), `-${currency(fp.cogs)}`],
              [t('Gross Profit', 'মোট মুনাফা'), currency(fp.grossProfit)],
              [t('Operating Expenses', 'অপারেটিং খরচ'), `-${currency(fp.expensesTotal)}`],
              [t('Net Operating Profit', 'নীট মুনাফা'), currency(fp.netOperatingProfit)],
              [t('Gross Margin', 'মোট মার্জিন'), pct(fp.grossMarginPct)],
              [t('Net Margin', 'নীট মার্জিন'), pct(fp.netMarginPct)],
            ]}
            align={['left', 'right']}
          />
        </>
      )}

      {/* Category performance */}
      {r.categoryMetrics.length > 0 && (
        <>
          <SectionTitle>{t('Category Performance', 'ক্যাটাগরি পারফরম্যান্স')}</SectionTitle>
          <MiniTable
            head={[t('Category', 'ক্যাটাগরি'), t('Units', 'একক'), t('Sales', 'বিক্রয়'), t('Profit', 'মুনাফা'), t('Margin', 'মার্জিন')]}
            rows={r.categoryMetrics.map((c) => [c.categoryNameBn || c.categoryName, fmt(c.unitsSold), currency(c.grossSales), currency(c.grossProfit), pct(c.marginPct)])}
            align={['left', 'right', 'right', 'right', 'right']}
          />
        </>
      )}

      {/* Top districts */}
      {r.districtMetrics.length > 0 && (
        <>
          <SectionTitle>{t('Top Districts', 'শীর্ষ জেলা')}</SectionTitle>
          <MiniTable
            head={[t('District', 'জেলা'), t('Orders', 'অর্ডার'), t('Revenue', 'বিক্রয়'), t('Delivered', 'ডেলিভারি'), t('COD Share', 'ক্যাশ শেয়ার')]}
            rows={r.districtMetrics.slice(0, 15).map((d) => [d.district, fmt(d.orderCount), currency(d.revenue), `${d.deliveredCount} (${pct(d.deliverySuccessRate)})`, pct(d.codSharePct)])}
            align={['left', 'right', 'right', 'right', 'right']}
          />
        </>
      )}

      {/* Inventory velocity */}
      {r.inventoryVelocityMetrics.length > 0 && (
        <>
          <SectionTitle>{t('Inventory Velocity', 'ইনভেন্টরি ভেলোসিটি')}</SectionTitle>
          <MiniTable
            head={[t('SKU', 'এসকেইউ'), t('Product', 'পণ্য'), t('Stock', 'স্টক'), t('Sold', 'বিক্রীত'), t('Category', 'ধরন')]}
            rows={r.inventoryVelocityMetrics.slice(0, 12).map((p) => [p.sku, p.title, fmt(p.stock), fmt(p.unitsSold), p.velocityStatus])}
            align={['left', 'left', 'right', 'right', 'left']}
          />
        </>
      )}

      {/* VAT summary */}
      {r.taxSummary && (
        <>
          <SectionTitle>{t('NBR VAT Summary', 'এনবিআর ভ্যাট সারাংশ')}</SectionTitle>
          <MiniTable
            head={[t('Item', 'আইটেম'), t('Value', 'মান')]}
            rows={[
              [t('BIN Number', 'বিআইএন'), r.taxSummary.binNumber],
              [t('Tax Period', 'কর সময়সীমা'), r.taxSummary.taxPeriod],
              [t('Gross Taxable Sales', 'করযোগ্য বিক্রয়'), currency(r.taxSummary.grossTaxableSales)],
              [t('VAT Collected', 'আদায়কৃত ভ্যাট'), currency(r.taxSummary.vatCollected)],
              [t('Input Rebate', 'ইনপুট রেয়াত'), `-${currency(r.taxSummary.inputTaxRebate)}`],
              [t('Net VAT Payable', 'নীট ভ্যাট প্রদেয়'), currency(r.taxSummary.netVatPayable)],
            ]}
            align={['left', 'right']}
          />
        </>
      )}

      {/* Footer + codes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e7e5e4', paddingTop: '8px', marginTop: '10px' }}>
        <div style={{ fontSize: '9px', color: '#78716c' }}>{settings.documents['REPORT']?.footer || ''}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {barcode('report') && <img src={barcode('report')!} alt="barcode" style={{ height: '42px' }} />}
          {qr('report') && <img src={qr('report')!} alt="qr" style={{ width: '54px', height: '54px' }} />}
        </div>
      </div>
    </div>
  );
}
