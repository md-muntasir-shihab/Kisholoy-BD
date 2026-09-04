/**
 * @file src/components/print/PrintTemplates.tsx
 * @description Unified KISHOLOY document templates used by the single
 *   Document & Print Engine for on-screen preview, browser printing and PDF output.
 * @license Apache-2.0
 */

import React from 'react';
import {
  Order,
  SiteContent,
  PrintSettings,
  PrintDocumentType,
  DocLanguage,
} from '../../types';
import { PRINT_PAGE_FORMATS, PRINT_FIELD_DEFINITIONS } from '../../lib/printFormats';
import { toBanglaDigits } from '../../utils/invoiceUtils';

const MM = 25.4 / 96; // mm per css px

interface TemplateProps {
  type: PrintDocumentType;
  order?: Order;
  siteContent: SiteContent;
  settings: PrintSettings;
  codes?: {
    barcodes: Record<string, string>;
    qrs: Record<string, string>;
  };
  /** Width in css px for the current page format (must match wrapper). */
  pageWidthPx: number;
}

/** Check whether a field is enabled for a document type. */
function fieldOn(settings: PrintSettings, type: PrintDocumentType, key: string): boolean {
  const doc = settings.documents[type];
  if (!doc) return false;
  if (key in doc.fields) return doc.fields[key];
  // Fall back to definition default (required/system visible).
  const def = PRINT_FIELD_DEFINITIONS[type]?.find((f) => f.key === key);
  if (def) return def.category === 'REQUIRED' || def.category === 'SYSTEM_CONTROLLED';
  return false;
}

function currency(n: number): string {
  const nn = Math.round((Number(n) || 0) * 100) / 100;
  return `৳${nn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function bnNum(n: number | string): string {
  return toBanglaDigits(Number(n).toLocaleString('en-US'));
}

function pickText(lang: DocLanguage, en: string, bn: string): string {
  if (lang === 'BN') return bn;
  if (lang === 'EN') return en;
  return `${en} / ${bn}`;
}

interface DocVisual {
  brandName: string;
  brandNameBn: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
}

function useVisual(siteContent: SiteContent, settings: PrintSettings): DocVisual {
  return {
    brandName: settings.businessName || siteContent.brandName || 'KISHOLOY',
    brandNameBn: settings.businessNameBn || siteContent.brandNameBn || 'কিশলয়',
    address: settings.businessAddress || siteContent.contact?.address || '',
    phone: settings.businessPhone || siteContent.contact?.phone || '',
    email: settings.businessEmail || siteContent.contact?.email || '',
    logoUrl: siteContent.logoUrl || '/brand/kisholoy-logo.svg',
  };
}

interface PageFrameProps {
  children: React.ReactNode;
  type: PrintDocumentType;
  title: string;
  titleBn: string;
  subtitle?: string;
  visual: DocVisual;
  codeLine?: string;
}

function PageFrame({ children, type, title, titleBn, visual, codeLine }: PageFrameProps) {
  const isLabel = type === 'COURIER_LABEL';
  return (
    <div
      className="kisholoy-doc"
      style={{
        width: '100%',
        background: '#ffffff',
        color: '#1c1917',
        fontFamily: "'Hind Siliguri', 'Plus Jakarta Sans', sans-serif",
        border: isLabel ? '1px solid #0f172a' : '1px solid #e7e5e4',
        padding: isLabel ? '8px' : '14px 16px',
        boxSizing: 'border-box',
        fontSize: isLabel ? '11px' : '12px',
        lineHeight: 1.4,
      }}
    >
      {/* Brand header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isLabel ? 'flex-start' : 'center',
          paddingBottom: '8px',
          borderBottom: isLabel ? '2px solid #0f172a' : '2px solid #115e59',
          marginBottom: isLabel ? '6px' : '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {visual.logoUrl ? (
            <img
              src={visual.logoUrl}
              alt={visual.brandName}
              style={{
                height: isLabel ? '24px' : '32px',
                width: 'auto',
                maxWidth: '120px',
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
          ) : (
            <div
              style={{
                width: isLabel ? '26px' : '30px',
                height: isLabel ? '26px' : '30px',
                borderRadius: '5px',
                background: '#115e59',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px',
                flexShrink: 0,
              }}
            >
              ক
            </div>
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: isLabel ? '14px' : '16px', letterSpacing: '0.5px' }}>
              {visual.brandName}
            </div>
            <div style={{ fontSize: '10px', color: '#57534e' }}>
              {visual.brandNameBn} • {visual.address}
            </div>
            <div style={{ fontSize: '10px', color: '#57534e' }}>
              {visual.phone} • {visual.email}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: isLabel ? '15px' : '18px', color: '#115e59', textTransform: 'uppercase' }}>
            {title}
          </div>
          <div style={{ fontSize: '11px', color: '#57534e' }}>{titleBn}</div>
          {codeLine && (
            <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>{codeLine}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: '12px', marginBottom: '6px' }}>{children}</div>;
}

function InfoCell({ label, value, flex = 1 }: { label: string; value: string; flex?: number }) {
  return (
    <div style={{ flex, minWidth: 0 }}>
      <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#78716c', letterSpacing: '0.4px' }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '11px', overflowWrap: 'anywhere' }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#115e59', margin: '8px 0 4px' }}>
      {children}
    </div>
  );
}

function Table({ head, rows, align = [] }: { head: string[]; rows: (string | number)[][]; align?: ('left' | 'right')[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '4px' }}>
      <thead>
        <tr style={{ background: '#f5f5f4' }}>
          {head.map((h, i) => (
            <th key={i} style={{ textAlign: align[i] || 'left', padding: '4px 6px', border: '1px solid #e7e5e4', fontWeight: 800, fontSize: '9px', textTransform: 'uppercase' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} style={{ borderBottom: '1px solid #f5f5f4' }}>
            {r.map((c, ci) => (
              <td key={ci} style={{ textAlign: align[ci] || 'left', padding: '4px 6px', border: '1px solid #f5f5f4', overflowWrap: 'anywhere' }}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Render the page content for a given document type. */
export function OrderDocumentTemplate({ type, order, siteContent, settings, codes, pageWidthPx }: TemplateProps) {
  const visual = useVisual(siteContent, settings);
  const language = settings.documents[type]?.language || 'BILINGUAL';
  const hasCodes = (codes && (Object.values(codes.barcodes || {}).some(Boolean) || Object.values(codes.qrs || {}).some(Boolean)));

  const barcode = (key: string) => (hasCodes ? codes!.barcodes[key] : '');
  const qr = (key: string) => (hasCodes ? codes!.qrs[key] : '');

  if (!order) {
    return (
      <PageFrame type={type} title="No Data" titleBn="তথ্য নেই" visual={visual}>
        <div style={{ padding: '20px', textAlign: 'center', color: '#78716c' }}>Select an order to preview.</div>
      </PageFrame>
    );
  }

  const orderNumber = order.orderNumber;
  const currencyShort = (n: number) => (language === 'BN' ? `৳${bnNum(n)}` : currency(n));

  const subtotal = order.subtotal;
  const shipping = order.shippingFee;
  const discount = order.discount || 0;
  const tax = Math.max(0, order.total - subtotal - shipping + discount);
  const total = order.total;

  // ---------- INVOICE ----------
  if (type === 'INVOICE') {
    const showSku = fieldOn(settings, type, 'sku');
    const showVariant = fieldOn(settings, type, 'variant');
    const rows = order.items.map((it) => [
      it.titleBn || it.title,
      showVariant && it.variantName ? it.variantName : '',
      showSku ? it.sku : '',
      it.quantity,
      currency(it.price),
      currency(it.price * it.quantity),
    ]);
    const head = [
      pickText(language, 'Item', 'পণ্য'),
      showVariant ? pickText(language, 'Variant', 'ভ্যারিয়েন্ট') : '',
      showSku ? pickText(language, 'SKU', 'এসকেইউ') : '',
      pickText(language, 'Qty', 'পরিমাণ'),
      pickText(language, 'Unit', 'একক মূল্য'),
      pickText(language, 'Total', 'মোট'),
    ].filter(Boolean);
    const align: ('left' | 'right')[] = ['left', 'left', 'left', 'right', 'right', 'right'];

    return (
      <PageFrame type={type} title="INVOICE" titleBn="চালান" visual={visual} codeLine={pickText(language, 'Invoice', 'চালান')}>
        <InfoRow>
          <InfoCell label={pickText(language, 'Customer', 'গ্রাহক')} value={`${order.customer.name} • ${order.customer.phone}`} />
          <InfoCell label={pickText(language, 'Order No.', 'অর্ডার নং')} value={orderNumber} />
          <InfoCell label={pickText(language, 'Invoice No.', 'ইনভয়েস নং')} value={`INV-${orderNumber.replace('KSH-', '')}`} />
          <InfoCell label={pickText(language, 'Date', 'তারিখ')} value={pickText(language, new Date(order.createdAt).toLocaleDateString('en-GB'), toBanglaDigits(new Date(order.createdAt).toLocaleDateString('en-GB')))} />
        </InfoRow>
        <SectionTitle>{pickText(language, 'Products', 'পণ্যসমূহ')}</SectionTitle>
        <Table head={head} rows={rows} align={align} />
        <div style={{ marginTop: '8px', marginLeft: 'auto', width: '60%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 6px', fontSize: '11px' }}>
            <span>{pickText(language, 'Subtotal', 'উপমোট')}</span><span style={{ fontWeight: 700 }}>{currency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 6px', fontSize: '11px' }}>
              <span>{pickText(language, 'Discount', 'ডিসকাউন্ট')}</span><span>-{currency(discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 6px', fontSize: '11px' }}>
            <span>{pickText(language, 'Shipping', 'ডেলিভারি')}</span><span>{currency(shipping)}</span>
          </div>
          {tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 6px', fontSize: '11px' }}>
              <span>{pickText(language, 'Tax / VAT', 'ট্যাক্স / ভ্যাট')}</span><span>{currency(tax)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: '#115e59', color: '#fff', borderRadius: '4px', fontSize: '13px', fontWeight: 800, marginTop: '4px' }}>
            <span>{pickText(language, 'Total', 'সর্বমোট')}</span><span>{currency(total)}</span>
          </div>
          <div style={{ fontSize: '10px', color: '#57534e', padding: '2px 6px' }}>
            {pickText(language, 'Payment Status', 'পেমেন্ট স্ট্যাটাস')}: <b>{order.paymentStatus}</b> • {pickText(language, 'Payment Method', 'পেমেন্ট মাধ্যম')}: {order.paymentMethod}
          </div>
        </div>
        {fieldOn(settings, type, 'footer') && settings.documents[type].footer && (
          <div style={{ marginTop: '12px', fontSize: '9px', color: '#78716c', borderTop: '1px solid #e7e5e4', paddingTop: '6px' }}>{settings.documents[type].footer}</div>
        )}
      </PageFrame>
    );
  }

  // ---------- PAYMENT RECEIPT ----------
  if (type === 'PAYMENT_RECEIPT') {
    const amount = order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'PARTIALLY_REFUNDED' ? order.total : order.total;
    return (
      <PageFrame type={type} title="PAYMENT RECEIPT" titleBn="পেমেন্ট রসিদ" visual={visual} codeLine={pickText(language, 'Receipt', 'রসিদ')}>
        <InfoRow>
          <InfoCell label={pickText(language, 'Customer', 'গ্রাহক')} value={order.customer.name} />
          <InfoCell label={pickText(language, 'Order No.', 'অর্ডার নং')} value={orderNumber} />
          <InfoCell label={pickText(language, 'Payment Ref', 'পেমেন্ট রেফারেন্স')} value={`PAY-${orderNumber.replace('KSH-', '')}`} />
          <InfoCell label={pickText(language, 'Date', 'তারিখ')} value={pickText(language, new Date(order.createdAt).toLocaleString('en-GB'), toBanglaDigits(new Date(order.createdAt).toLocaleString('en-GB')))} />
        </InfoRow>
        <div style={{ margin: '14px 0', textAlign: 'center', padding: '12px', border: '2px solid #115e59', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#57534e' }}>{pickText(language, 'Amount Received', 'প্রাপ্ত পরিমাণ')}</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{currency(amount)}</div>
          <div style={{ fontSize: '11px', color: '#57534e' }}>{order.paymentMethod} • {order.paymentStatus}</div>
        </div>
        <InfoRow>
          <InfoCell label={pickText(language, 'Method', 'মাধ্যম')} value={order.paymentMethod} />
          <InfoCell label={pickText(language, 'Reference / Trx', 'রেফারেন্স / ট্রানজেকশন')} value={order.advancePaymentTrxId || order.courier?.trackingId || orderNumber} />
          <InfoCell label={pickText(language, 'Status', 'স্ট্যাটাস')} value={order.paymentStatus} />
        </InfoRow>
        {fieldOn(settings, type, 'footer') && settings.documents[type].footer && (
          <div style={{ marginTop: '12px', fontSize: '9px', color: '#78716c', borderTop: '1px dashed #d6d3d1', paddingTop: '6px' }}>{settings.documents[type].footer}</div>
        )}
      </PageFrame>
    );
  }

  // ---------- PACKING SLIP ----------
  if (type === 'PACKING_SLIP') {
    const rows = order.items.map((it) => [
      it.titleBn || it.title,
      it.variantName || '',
      it.sku,
      it.quantity,
    ]);
    return (
      <PageFrame type={type} title="PACKING SLIP" titleBn="প্যাকিং স্লিপ" visual={visual} codeLine={pickText(language, 'Packing', 'প্যাকিং')}>
        <InfoRow>
          <InfoCell label={pickText(language, 'Order No.', 'অর্ডার নং')} value={orderNumber} />
          <InfoCell label={pickText(language, 'Customer', 'গ্রাহক')} value={order.customer.name} />
          <InfoCell label={pickText(language, 'Phone', 'ফোন')} value={order.customer.phone} />
          <InfoCell label={pickText(language, 'Date', 'তারিখ')} value={pickText(language, new Date(order.createdAt).toLocaleDateString('en-GB'), toBanglaDigits(new Date(order.createdAt).toLocaleDateString('en-GB')))} />
        </InfoRow>
        <SectionTitle>{pickText(language, 'Ship To', 'পাঠানোর ঠিকানা')}</SectionTitle>
        <div style={{ fontSize: '12px', fontWeight: 700 }}>{order.shippingAddress.address}</div>
        <div style={{ fontSize: '11px', color: '#57534e' }}>{order.shippingAddress.thana}, {order.shippingAddress.district}, {order.shippingAddress.division}</div>
        <SectionTitle>{pickText(language, 'Items', 'পণ্যসমূহ')}</SectionTitle>
        <Table head={[pickText(language, 'Item', 'পণ্য'), pickText(language, 'Variant', 'ভ্যারিয়েন্ট'), pickText(language, 'SKU', 'এসকেইউ'), pickText(language, 'Qty', 'পরিমাণ')]} rows={rows} align={['left', 'left', 'left', 'right']} />
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#57534e' }}>
          {pickText(language, 'Total items', 'মোট পণ্য')}: {order.items.reduce((s, i) => s + i.quantity, 0)}
        </div>
        {settings.documents[type].notes && <div style={{ marginTop: '6px', fontSize: '10px', color: '#78716c' }}>{settings.documents[type].notes}</div>}
      </PageFrame>
    );
  }

  // ---------- COURIER LABEL ----------
  if (type === 'COURIER_LABEL') {
    const trackingId = order.courier?.trackingId || orderNumber;
    const cod = order.paymentMethod === 'COD' && (order.paymentStatus === 'UNPAID' || order.balanceDueCod != null);
    return (
      <PageFrame type={type} title="COURIER LABEL" titleBn="কুরিয়ার লেবেল" visual={visual} codeLine={order.courier?.provider || 'KISHOLOY EXPRESS'}>
        <InfoRow>
          <InfoCell label={pickText(language, 'Deliver To', 'প্রাপক')} value={order.customer.name} />
          <InfoCell label={pickText(language, 'Phone', 'ফোন')} value={order.customer.phone} />
        </InfoRow>
        <div style={{ fontSize: '11px', fontWeight: 700, margin: '2px 0 8px' }}>{order.shippingAddress.address}, {order.shippingAddress.thana}, {order.shippingAddress.district}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
          <div>
            <div style={{ fontSize: '9px', color: '#78716c', textTransform: 'uppercase' }}>{pickText(language, 'Order Ref', 'অর্ডার রেফ')}</div>
            <div style={{ fontWeight: 800, fontSize: '13px' }}>{orderNumber}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', color: '#78716c', textTransform: 'uppercase' }}>{pickText(language, 'COD', 'ক্যাশ অন ডেলিভারি')}</div>
            <div style={{ fontWeight: 800, fontSize: '13px' }}>{cod ? currency(order.balanceDueCod ?? order.total) : 'PREPAID'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
          {settings.documents[type].showBarcode && barcode('tracking') && (
            <img src={barcode('tracking')!} alt="barcode" style={{ height: '44px', maxWidth: '100%' }} />
          )}
        </div>
        <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800, letterSpacing: '1px', fontFamily: 'monospace' }}>{trackingId}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <div style={{ fontSize: '9px', color: '#78716c' }}>{pickText(language, 'Weight', 'ওজন')}: 1.5 KG</div>
          {settings.documents[type].showQR && qr('tracking') && (
            <img src={qr('tracking')!} alt="qr" style={{ width: '48px', height: '48px' }} />
          )}
        </div>
      </PageFrame>
    );
  }

  // ---------- GENERIC FALLBACK ----------
  return (
    <PageFrame type={type} title={type} titleBn={type} visual={visual}>
      <div style={{ padding: '12px', color: '#78716c' }}>Document type not yet templated.</div>
    </PageFrame>
  );
}

export { PRINT_PAGE_FORMATS };
export const MM_PER_PX = MM;
