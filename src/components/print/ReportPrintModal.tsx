/**
 * @file src/components/print/ReportPrintModal.tsx
 * @description Unified Business Report print modal (named PDF + real codes).
 *   Builds a single Sales / Financial report PDF via the shared print engine.
 * @license Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, FileText, Printer, Download, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SiteContent, PrintSettings, DocPageFormat } from '../../types';
import { ReportTemplate, ReportPrintData } from './ReportTemplate';
import { buildPdfPackage, reportFilename } from '../../lib/documentEngine';
import { PRINT_PAGE_FORMATS } from '../../lib/printFormats';
import { fetchReportPayload } from '../../lib/documentEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dateRange: string;
  from?: string;
  to?: string;
}

const A4_PX = Math.round(210 * (96 / 25.4));

export function ReportPrintModal({ isOpen, onClose, dateRange, from, to }: Props) {
  const [payload, setPayload] = useState<ReportPrintData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchReportPayload(dateRange, from, to);
      setPayload(p);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, dateRange, from, to]);

  if (!isOpen) return null;

  const format: DocPageFormat = payload?.settings?.documents?.['REPORT']?.pageFormat || 'A4';
  const siteContent = payload?.siteContent || ({ brandName: 'KISHOLOY', brandNameBn: 'কিশলয়', contact: { address: '', phone: '', email: '' } } as SiteContent);
  const settings = payload?.settings || ({ documents: {} } as PrintSettings);

  const handleDownload = async () => {
    if (!payload) return;
    setGenerating(true);
    setError(null);
    setProgress('Rendering report…');
    const day = (payload.from || new Date().toISOString().slice(0, 10));
    const filename = reportFilename(day.replace(/-/g, ''));
    const res = await buildPdfPackage(
      [
        {
          format,
          element: (
            <ReportTemplate data={payload} siteContent={siteContent} settings={settings} codes={payload.codes} pageWidthPx={A4_PX} />
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
              <h2 className="text-sm font-bold font-serif">Business Report</h2>
              <p className="text-[11px] text-stone-400">{payload?.title || 'Loading…'} • {dateRange} • one named PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-800 rounded-lg hover:bg-stone-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-end gap-2 no-print">
          <button onClick={handleBrowserPrint} className="px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-stone-50">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownload} disabled={generating || !payload} className="px-4 py-2 bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-teal-950 disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? progress || 'Generating…' : 'Download PDF (Report)'}
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
            <p className="mt-3 text-xs font-medium">Generating report data & codes…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
            <AlertTriangle className="w-9 h-9 text-amber-600" />
            <h3 className="mt-3 text-sm font-bold text-stone-900">Print Generation Failed</h3>
            <p className="mt-1 text-xs text-stone-600 max-w-md">{error}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={load} className="px-4 py-2 bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Retry</button>
              <button onClick={onClose} className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-bold">Close</button>
            </div>
          </div>
        )}

        {!loading && payload && (
          <div className="flex-1 overflow-auto bg-stone-100 p-4">
            <div className="kisholoy-print-surface mx-auto" style={{ width: '210mm' }}>
              <div className="kisholoy-print-page" style={{ pageBreakAfter: 'always', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <ReportTemplate data={payload} siteContent={siteContent} settings={settings} codes={payload.codes} pageWidthPx={A4_PX} />
              </div>
            </div>
          </div>
        )}
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
