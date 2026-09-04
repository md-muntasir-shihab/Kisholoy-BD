/**
 * @file src/components/print/PrintOrderDocumentsModal.tsx
 * @description Single-order Print Documents modal (unified engine).
 *   One order -> ONE PDF package with all relevant documents.
 * @license Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  X, FileText, Printer, Download, Eye, Loader2, AlertTriangle, RefreshCw,
  CheckSquare, Square,
} from 'lucide-react';
import { Order, SiteContent, PrintOrderPayload, PrintDocumentType } from '../../types';
import { OrderDocumentTemplate } from './PrintTemplates';
import { buildOrderPdf, fetchOrderPrintPayload } from '../../lib/documentEngine';
import { PRINT_DOCUMENT_LABELS } from '../../lib/printFormats';

interface Props {
  order: Order;
  siteContent: SiteContent;
  onClose: () => void;
}

const A4_PX = Math.round(210 * (96 / 25.4)); // 794px

export function PrintOrderDocumentsModal({ order, siteContent, onClose }: Props) {
  const [payload, setPayload] = useState<PrintOrderPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<PrintDocumentType>>(new Set<PrintDocumentType>());
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [previewMode, setPreviewMode] = useState<'preview' | 'print'>('preview');
  const [browserPrintReady, setBrowserPrintReady] = useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchOrderPrintPayload(order.orderNumber);
      setPayload(p);
      setSelected(new Set(p.documents.filter((d) => d.enabledByDefault).map((d) => d.type)));
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [order.orderNumber]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (t: PrintDocumentType) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  };

  const selectedOrder = order;
  const selectedTypes = useMemo(() => Array.from(selected), [selected]);

  const handleDownload = async () => {
    if (!payload) return;
    setGenerating(true);
    setError(null);
    setProgress('Preparing document package…');
    const res = await buildOrderPdf(payload, selectedTypes, (m) => setProgress(m));
    setGenerating(false);
    setProgress('');
    if (!res.ok) setError(res.error || 'Print generation failed');
  };

  const handleBrowserPrint = () => {
    setBrowserPrintReady(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setBrowserPrintReady(false), 500);
    }, 50);
  };

  const docTypes = payload?.documents || [];
  const activeTypes = docTypes.length > 0 ? docTypes.map((d) => d.type) : selectedTypes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/70 backdrop-blur-sm kisholoy-print-overlay">
      {/* Non-printable chrome */}
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl kisholoy-print-chrome">
        {/* Header bar */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-sm font-bold font-serif">Print Order Documents</h2>
              <p className="text-[11px] text-stone-400">
                {order.orderNumber} • {docTypes.length} document type(s) • one PDF package
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-800 rounded-lg hover:bg-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
            <p className="mt-3 text-xs font-medium">Loading document data & codes…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
            <AlertTriangle className="w-9 h-9 text-amber-600" />
            <h3 className="mt-3 text-sm font-bold text-stone-900">Print Generation Failed</h3>
            <p className="mt-1 text-xs text-stone-600 max-w-md">{error}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={load} className="px-4 py-2 bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
              <button onClick={onClose} className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-bold">Close</button>
            </div>
          </div>
        )}

        {!loading && payload && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Document selection */}
            <div className="px-4 pt-3 pb-2 border-b border-stone-200 no-print">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Include:</span>
                {activeTypes.map((t) => {
                  const active = selected.has(t);
                  const meta = docTypes.find((d) => d.type === t);
                  const smartOn = meta?.enabledByDefault;
                  return (
                    <button
                      key={t}
                      onClick={() => toggle(t)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-teal-900 text-white border-teal-900'
                          : smartOn
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : 'bg-stone-50 text-stone-500 border-stone-200'
                      }`}
                    >
                      {active ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      {PRINT_DOCUMENT_LABELS[t]?.en}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] text-stone-500">
                  Smart selection auto-includes only the documents relevant to this order's current state.
                </p>
                <button
                  onClick={() => setSelected(new Set(docTypes.filter((d) => d.enabledByDefault).map((d) => d.type)))}
                  className="text-[11px] font-bold text-teal-800 hover:underline"
                >
                  Reset to smart defaults
                </button>
              </div>
            </div>

            {/* Tabs + actions */}
            <div className="flex items-center justify-between px-4 py-2 bg-stone-50 border-b border-stone-200 no-print">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${previewMode === 'preview' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" /> Preview
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBrowserPrint}
                  className="px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-stone-50"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={handleDownload}
                  disabled={generating || selected.size === 0}
                  className="px-4 py-2 bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-teal-950 disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {generating ? progress || 'Generating…' : `Download PDF (${selected.size})`}
                </button>
              </div>
            </div>

            {/* Preview surface (printable) */}
            <div className="flex-1 overflow-auto bg-stone-100 p-4">
              <div className="kisholoy-print-surface mx-auto" style={{ width: '210mm' }}>
                {activeTypes.filter((t) => selected.has(t)).map((t) => {
                  const format = payload.settings.documents[t]?.pageFormat || 'A4';
                  return (
                    <div key={t} className="kisholoy-print-page" style={{ pageBreakAfter: 'always', marginBottom: selected.size > 1 ? '16px' : 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                      <OrderDocumentTemplate
                        type={t}
                        order={selectedOrder}
                        siteContent={siteContent}
                        settings={payload.settings}
                        codes={payload.codes}
                        pageWidthPx={A4_PX}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print-only styles: show only the print surface */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .kisholoy-print-surface, .kisholoy-print-surface * { visibility: visible; }
          .kisholoy-print-surface { position: absolute; left: 0; top: 0; width: 210mm; }
          .kisholoy-print-overlay { display: block !important; background: #fff !important; }
          .no-print { display: none !important; }
          .kisholoy-print-page { box-shadow: none !important; margin: 0 !important; page-break-after: always; }
          @page { size: A4 portrait; margin: 8mm; }
        }
      `}</style>
      <span style={{ display: 'none' }}>{previewMode}{browserPrintReady ? '1' : '0'}</span>
    </div>
  );
}
