/**
 * @file src/lib/documentEngine.tsx
 * @description KISHOLOY unified Document & Print Engine (client side).
 *   Renders official document templates and compiles them into a single PDF
 *   package (one page per document) using jsPDF + html2canvas. Printing is
 *   output-only: it never mutates business records.
 * @license Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Order,
  SiteContent,
  PrintSettings,
  PrintDocumentType,
  PrintOrderPayload,
  DocPageFormat,
} from '../types';
import { PRINT_PAGE_FORMATS } from './printFormats';
import { OrderDocumentTemplate } from '../components/print/PrintTemplates';

const PX_PER_MM = 96 / 25.4;

/** Page format dimensions in mm. */
export function pageFormatDims(format: DocPageFormat) {
  return PRINT_PAGE_FORMATS[format];
}

/** Standard single-order filename. */
export function orderPdfFilename(orderNumber: string): string {
  return `KISHOLOY_Order_${orderNumber}.pdf`;
}

/** Standard combined bulk filename. */
export function combinedBulkFilename(dateStr: string): string {
  return `KISHOLOY_BulkPrint_${dateStr}.pdf`;
}

/** Standard supplier settlement filename. */
export function supplierSettlementFilename(supplierCode: string, period: string): string {
  return `KISHOLOY_SupplierSettlement_${supplierCode}_${period}.pdf`;
}

/** Standard purchase document filename. */
export function purchaseDocumentFilename(poNumber: string): string {
  return `KISHOLOY_Purchase_${poNumber}.pdf`;
}

/** Standard return/refund filename. */
export function returnRefundFilename(requestNumber: string): string {
  return `KISHOLOY_Return_${requestNumber}.pdf`;
}

/** Standard business report filename. */
export function reportFilename(dateStr: string): string {
  return `KISHOLOY_SalesReport_${dateStr}.pdf`;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'));
  if (imgs.length === 0) return Promise.resolve();
  return Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          })
    )
  ).then(() => undefined);
}

async function waitForFonts(): Promise<void> {
  try {
    if (typeof (document as any).fonts?.ready !== 'undefined') {
      await (document as any).fonts.ready;
    }
  } catch {
    /* ignore font loading errors */
  }
}

/**
 * Render an arbitrary React element into a hidden off-screen container then
 * capture it to a PNG data URL fit to the requested page format.
 */
export async function renderElementToDataUrl(
  element: React.ReactNode,
  format: DocPageFormat
): Promise<{ dataUrl: string; wMm: number; hMm: number; aspect: number }> {
  const { w: wMm, h: hMm } = PRINT_PAGE_FORMATS[format];
  const wpx = Math.round(wMm * PX_PER_MM);

  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed;left:-20000px;top:0;width:${wpx}px;background:#ffffff;z-index:-9999;pointer-events:none;`;
  document.body.appendChild(wrap);

  const root = createRoot(wrap);
  root.render(<div style={{ width: `${wpx}px`, background: '#ffffff' }}>{element}</div>);

  await nextFrame();
  await nextFrame();
  await waitForFonts();
  await waitForImages(wrap);

  const canvas = await html2canvas(wrap, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    width: wpx,
    height: wrap.scrollHeight,
    x: 0,
    y: 0,
    windowWidth: wpx,
    scrollX: 0,
    scrollY: 0,
    logging: false,
  });

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const aspect = wrap.scrollHeight / wpx;
  root.unmount();
  wrap.remove();

  return { dataUrl, wMm, hMm, aspect };
}

/** Render an order document template (convenience wrapper). */
export async function renderDocToDataUrl(
  type: PrintDocumentType,
  order: Order,
  siteContent: SiteContent,
  settings: PrintSettings,
  codes: PrintOrderPayload['codes'],
  format: DocPageFormat
): Promise<{ dataUrl: string; wMm: number; hMm: number; aspect: number }> {
  return renderElementToDataUrl(
    <OrderDocumentTemplate type={type} order={order} siteContent={siteContent} settings={settings} codes={codes} pageWidthPx={Math.round(PRINT_PAGE_FORMATS[format].w * PX_PER_MM)} />,
    format
  );
}

/** Draw the captured image onto the current page, fitting it (contain). */
function addImageToPage(pdf: jsPDF, dataUrl: string, aspect: number) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  let drawW = pageW;
  let drawH = pageW * aspect;
  if (drawH > pageH) {
    drawH = pageH;
    drawW = pageH / aspect;
  }
  const x = (pageW - drawW) / 2;
  const y = (pageH - drawH) / 2;
  pdf.addImage(dataUrl, 'PNG', x, y, drawW, drawH, undefined, 'FAST');
  return;
}

/** One item to place inside a PDF package. */
export interface PdfPackageItem {
  element: React.ReactNode;
  format: DocPageFormat;
}

/**
 * Generic PDF package builder: one page per item (page format per item).
 * This is the single shared engine used by every document type.
 */
export async function buildPdfPackage(
  items: PdfPackageItem[],
  filename: string,
  onProgress?: (msg: string) => void
): Promise<{ ok: boolean; filename: string; error?: string }> {
  if (!items.length) return { ok: false, filename, error: 'No documents selected for printing' };
  try {
    let pdf: jsPDF | null = null;
    for (const item of items) {
      onProgress?.('Rendering document…');
      const cap = await renderElementToDataUrl(item.element, item.format);
      if (!pdf) {
        pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [cap.wMm, cap.hMm], compress: true });
      } else {
        pdf.addPage([cap.wMm, cap.hMm], 'portrait');
      }
      addImageToPage(pdf, cap.dataUrl, cap.aspect);
    }
    if (!pdf) throw new Error('No documents selected for printing');
    onProgress?.('Saving PDF…');
    pdf.save(filename);
    return { ok: true, filename };
  } catch (err: any) {
    console.error('PDF generation failed:', err);
    return { ok: false, filename, error: err?.message || String(err) };
  }
}

/**
 * Build ONE PDF package for a single order, one page per selected document.
 */
export async function buildOrderPdf(
  payload: PrintOrderPayload,
  selectedTypes: PrintDocumentType[],
  onProgress?: (msg: string) => void
): Promise<{ ok: boolean; filename: string; error?: string }> {
  const { order, siteContent, settings, codes } = payload;
  const filename = orderPdfFilename(order.orderNumber);
  const types = selectedTypes.length > 0 ? selectedTypes : payload.documents.filter((d) => d.enabledByDefault).map((d) => d.type);
  const items: PdfPackageItem[] = [];
  for (const type of types) {
    const format: DocPageFormat = settings.documents[type]?.pageFormat || 'A4';
    items.push({
      format,
      element: <OrderDocumentTemplate type={type} order={order} siteContent={siteContent} settings={settings} codes={codes} pageWidthPx={Math.round(PRINT_PAGE_FORMATS[format].w * PX_PER_MM)} />,
    });
  }
  return buildPdfPackage(items, filename, onProgress);
}

/**
 * Build ONE combined PDF across multiple orders (bulk Mode B).
 */
export async function buildBulkCombinedPdf(
  payloads: PrintOrderPayload[],
  selectedTypes: PrintDocumentType[],
  dateStr: string,
  onProgress?: (msg: string) => void
): Promise<{ ok: boolean; filename: string; error?: string }> {
  const filename = combinedBulkFilename(dateStr);
  const items: PdfPackageItem[] = [];
  for (const payload of payloads) {
    const types = selectedTypes.length > 0 ? selectedTypes : payload.documents.filter((d) => d.enabledByDefault).map((d) => d.type);
    for (const type of types) {
      const format: DocPageFormat = payload.settings.documents[type]?.pageFormat || 'A4';
      items.push({
        format,
        element: (
          <OrderDocumentTemplate
            type={type}
            order={payload.order}
            siteContent={payload.siteContent}
            settings={payload.settings}
            codes={payload.codes}
            pageWidthPx={Math.round(PRINT_PAGE_FORMATS[format].w * PX_PER_MM)}
          />
        ),
      });
    }
  }
  return buildPdfPackage(items, filename, onProgress);
}

/** Load a single order's print payload from the server (includes real codes). */
export async function fetchOrderPrintPayload(orderNumber: string): Promise<PrintOrderPayload> {
  const res = await fetch(`/api/print/order/${encodeURIComponent(orderNumber)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to load print data');
  return data.payload;
}

/** Load a supplier settlement print payload from the server. */
export async function fetchSupplierStatementPayload(supplierId: string, periodStart?: string, periodEnd?: string): Promise<any> {
  const qs = new URLSearchParams();
  if (periodStart) qs.set('periodStart', periodStart);
  if (periodEnd) qs.set('periodEnd', periodEnd);
  const res = await fetch(`/api/print/supplier-statement/${encodeURIComponent(supplierId)}?${qs.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to load supplier statement');
  return data.payload;
}

/** Load a purchase order print payload from the server. */
export async function fetchPurchaseOrderPayload(poId: string): Promise<any> {
  const res = await fetch(`/api/print/purchase-order/${encodeURIComponent(poId)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to load purchase order');
  return data.payload;
}

/** Load a return/refund print payload from the server. */
export async function fetchReturnRefundPayload(returnId: string): Promise<any> {
  const res = await fetch(`/api/print/return-refund/${encodeURIComponent(returnId)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to load return/refund');
  return data.payload;
}

/** Load a business report print payload from the server. */
export async function fetchReportPayload(dateRange: string, from?: string, to?: string): Promise<any> {
  const qs = new URLSearchParams();
  if (dateRange) qs.set('range', dateRange);
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const res = await fetch(`/api/print/report?${qs.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to load report');
  return data.payload;
}
