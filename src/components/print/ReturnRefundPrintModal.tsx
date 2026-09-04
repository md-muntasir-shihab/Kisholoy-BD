/**
 * @file src/components/print/ReturnRefundPrintModal.tsx
 * @description Unified Return / Refund print modal (named PDF + real codes).
 *   Built from an admin RMA record; codes are fetched from the server so they
 *   resolve to the real return reference.
 * @license Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, FileText, Printer, Download, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SiteContent, PrintSettings, DocPageFormat } from '../../types';
import { ReturnRefundTemplate, ReturnRefundPrintData } from './ReturnRefundTemplate';
import { buildPdfPackage, returnRefundFilename } from '../../lib/documentEngine';
import { PRINT_PAGE_FORMATS } from '../../lib/printFormats';
import { RmaRecord } from '../../admin/ReturnsRefundsAdmin';

interface Props {
  rma: RmaRecord | null;
  onClose: () => void;
}

const A4_PX = Math.round(210 * (96 / 25.4));
const REASON_LABEL: Record<string, string> = {
  WRONG_SIZE: 'Wrong Size / Fit',
  DEFECTIVE_PRODUCT: 'Defective Product',
  WRONG_ITEM_SENT: 'Wrong Item Sent',
  COLOR_MISMATCH: 'Color Mismatch',
  CHANGED_MIND: 'Changed Mind',
  COURIER_RETURNED: 'Courier Returned',
};

function buildData(rma: RmaRecord): ReturnRefundPrintData {
  return {
    requestNumber: rma.rmaNumber,
    orderNumber: rma.orderNumber,
    customerName: rma.customerName,
    customerPhone: rma.customerPhone,
    productTitle: rma.productTitle,
    sku: rma.sku,
    quantity: rma.quantity,
    amount: rma.totalRefundAmount ?? rma.itemPrice,
    reason: REASON_LABEL[rma.reason] || rma.reason.replace(/_/g, ' '),
    reasonDetails: rma.reasonDetails,
    resolution: rma.refundExecution ? rma.refundExecution.method : rma.stage,
    status: rma.stage,
    createdAt: rma.requestDate,
    notes: rma.inspectionResult?.notes || '',
  };
}

export function ReturnRefundPrintModal({ rma, onClose }: Props) {
  const [settings, setSettings] = useState<PrintSettings | null>(null);
  const [codes, setCodes] = useState<{ barcodes: Record<string, string>; qrs: Record<string, string> }>({ barcodes: {}, qrs: {} });
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadCodes = async () => {
    try {
      const res = await fetch('/api/print/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcodes: { return: rma?.rmaNumber || '', order: rma?.orderNumber || '' },
          qrs: { return: rma?.rmaNumber || '', order: rma?.orderNumber || '' },
        }),
      });
      const data = await res.json();
      if (data.success) setCodes(data.codes);
    } catch {
      setCodes({ barcodes: {}, qrs: {} });
    }
  };

  useEffect(() => {
    fetch('/api/print/settings').then((r) => r.json()).then((d) => { if (d.success) setSettings(d.settings); }).catch(() => {});
    if (rma) loadCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rma]);

  if (!rma) return null;

  const data = buildData(rma);
  const siteContent = { brandName: 'KISHOLOY', brandNameBn: 'কিশলয়', contact: { address: '', phone: '', email: '' } } as SiteContent;
  const format: DocPageFormat = settings?.documents?.['RETURN_REFUND']?.pageFormat || 'A4';
  const finalSettings = settings || ({ documents: {} } as PrintSettings);

  const handleDownload = async () => {
    setGenerating(true);
    setError(null);
    setProgress('Rendering return document…');
    const filename = returnRefundFilename(data.requestNumber);
    const res = await buildPdfPackage(
      [
        {
          format,
          element: (
            <ReturnRefundTemplate data={data} siteContent={siteContent} settings={finalSettings} codes={codes} pageWidthPx={A4_PX} />
          ),
        },
      ],
      filename,
      (m) => setProgress(m)
    );
    setGenerating(false);
    setProgress('');
    if (!res.ok) setError(res.error || 'Print generation failed');
  };

  const handleBrowserPrint = () => setTimeout(() => window.print(), 50);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/70 backdrop-blur-sm kisholoy-print-overlay">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl kisholoy-print-chrome">
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-sm font-bold font-serif">Return / Refund Document</h2>
              <p className="text-[11px] text-stone-400">{data.requestNumber} • one named PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-800 rounded-lg hover:bg-stone-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-end gap-2 no-print">
          <button onClick={handleBrowserPrint} className="px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-stone-50">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownload} disabled={generating} className="px-4 py-2 bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-teal-950 disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? progress || 'Generating…' : 'Download PDF (Return)'}
          </button>
        </div>

        {error && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              <button onClick={handleDownload} className="ml-auto flex items-center gap-1 font-bold hover:underline"><RefreshCw className="w-3 h-3" /> Retry</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-stone-100 p-4">
          <div className="kisholoy-print-surface mx-auto" style={{ width: '210mm' }}>
            <div className="kisholoy-print-page" style={{ pageBreakAfter: 'always', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <ReturnRefundTemplate data={data} siteContent={siteContent} settings={finalSettings} codes={codes} pageWidthPx={A4_PX} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .kisholoy-print-surface, .kisholoy-print-surface * { visibility: visible; }
          .kisholoy-print-surface { position: absolute; left: 0; top: 0; width: 210mm; }
          .kisholoy-print-overlay { display: block !important; background: #fff !important; }
          .no-print { display: none !important; }
          .kisholoy-print-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4 portrait; margin: 8mm; }
        }
      `}</style>
    </div>
  );
}
