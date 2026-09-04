/**
 * @file src/components/print/BulkPrintModal.tsx
 * @description Bulk Print modal (unified engine). Filter/select orders by date,
 *   status and courier then generate one PDF-per-order or one combined PDF.
 * @license Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  X, FileText, Download, Loader2, Filter, AlertTriangle, Layers, CheckSquare, Square,
} from 'lucide-react';
import { Order, SiteContent, PrintDocumentType } from '../../types';
import {
  resolveOrderDocuments,
  PRINT_DOCUMENT_LABELS,
  defaultPrintSettings,
} from '../../lib/printFormats';
import { buildOrderPdf, buildBulkCombinedPdf, fetchOrderPrintPayload } from '../../lib/documentEngine';
import { PrintSettings } from '../../types';

interface Props {
  orders: Order[];
  siteContent: SiteContent;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PENDING',
];
const COURIER_OPTIONS = ['Steadfast', 'Pathao', 'RedX', 'Paperfly', 'eCourier', 'Manual'];
const TYPE_ORDER = ['INVOICE', 'PAYMENT_RECEIPT', 'PACKING_SLIP', 'COURIER_LABEL'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function BulkPrintModal({ orders, siteContent, onClose }: Props) {
  const [dateFrom, setDateFrom] = useState(daysAgo(7));
  const [dateTo, setDateTo] = useState(todayStr());
  const [status, setStatus] = useState<string>('ALL');
  const [courier, setCourier] = useState<string>('ALL');
  const [selected, setSelected] = useState<Set<string>>(new Set<string>());
  const [mode, setMode] = useState<'COMBINED' | 'SEPARATE'>('COMBINED');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(null);

  useEffect(() => {
    fetch('/api/print/settings')
      .then((r) => r.json())
      .then((d) => { if (d.success) setPrintSettings(d.settings); })
      .catch(() => {});
  }, []);

  // Quick ranges
  const applyRange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };
  const today = todayStr();

  const filtered = useMemo(() => {
    const from = new Date(dateFrom + 'T00:00:00').getTime();
    const to = new Date(dateTo + 'T23:59:59').getTime();
    return orders.filter((o) => {
      const ts = new Date(o.createdAt).getTime();
      if (ts < from || ts > to) return false;
      if (status !== 'ALL' && o.orderStatus !== status) return false;
      if (courier !== 'ALL' && (o.courier?.provider || 'Manual') !== courier) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo, status, courier]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map((o) => o.id)));
  const clearAll = () => setSelected(new Set<string>());

  const summary = useMemo(() => {
    const settings = printSettings || defaultPrintSettings();
    const counts: Record<PrintDocumentType, number> = {
      INVOICE: 0, PAYMENT_RECEIPT: 0, PACKING_SLIP: 0, COURIER_LABEL: 0, SUPPLIER_SETTLEMENT: 0, PURCHASE_DOCUMENT: 0, RETURN_REFUND: 0, REPORT: 0,
    };
    let pages = 0;
    for (const o of filtered.filter((x) => selected.has(x.id))) {
      const docs = resolveOrderDocuments(o).filter((d) => d.active && settings.documents[d.type]?.enabled !== false);
      for (const d of docs) {
        if (d.type in counts) {
          counts[d.type] += 1;
          pages += 1;
        }
      }
    }
    return { counts, pages };
  }, [filtered, selected, printSettings]);

  const selectedOrders = useMemo(() => filtered.filter((o) => selected.has(o.id)), [filtered, selected]);
  const selectedOrderNumbers = selectedOrders.map((o) => o.orderNumber);

  const handleGenerate = async () => {
    if (selectedOrderNumbers.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      if (mode === 'COMBINED') {
        setProgress('Fetching order data…');
        const payloads = [];
        for (const num of selectedOrderNumbers) {
          payloads.push(await fetchOrderPrintPayload(num));
        }
        setProgress('Building combined PDF…');
        const res = await buildBulkCombinedPdf(payloads, [], today, (m) => setProgress(m));
        if (!res.ok) throw new Error(res.error || 'Failed to build PDF');
      } else {
        // Separate PDF per order
        for (const num of selectedOrderNumbers) {
          setProgress(`Generating ${num}…`);
          const payload = await fetchOrderPrintPayload(num);
          const res = await buildOrderPdf(payload, [], (m) => setProgress(m));
          if (!res.ok) throw new Error(res.error || `Failed: ${num}`);
        }
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const courierCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of filtered) {
      const c = o.courier?.provider || 'Manual';
      m[c] = (m[c] || 0) + 1;
    }
    return m;
  }, [filtered]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-sm font-bold font-serif">Bulk Print Orders</h2>
              <p className="text-[11px] text-stone-400">Filter by date / status / courier, then generate documents.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-800 rounded-lg hover:bg-stone-700"><X className="w-5 h-5" /></button>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-stone-200">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1"><Filter className="w-4 h-4 text-stone-500" /></div>
            <label className="font-bold text-stone-600">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-stone-300 rounded-lg px-2 py-1.5" />
            <label className="font-bold text-stone-600">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-stone-300 rounded-lg px-2 py-1.5" />
            <button onClick={() => applyRange(daysAgo(1), today)} className="px-3 py-1.5 bg-stone-100 rounded-lg font-bold text-stone-700 hover:bg-stone-200">Yesterday</button>
            <button onClick={() => applyRange(daysAgo(6), today)} className="px-3 py-1.5 bg-stone-100 rounded-lg font-bold text-stone-700 hover:bg-stone-200">This Week</button>
            <button onClick={() => applyRange(daysAgo(29), today)} className="px-3 py-1.5 bg-stone-100 rounded-lg font-bold text-stone-700 hover:bg-stone-200">This Month</button>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-stone-300 rounded-lg px-2 py-1.5 font-semibold">
              <option value="ALL">All Status</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={courier} onChange={(e) => setCourier(e.target.value)} className="border border-stone-300 rounded-lg px-2 py-1.5 font-semibold">
              <option value="ALL">All Couriers</option>
              {COURIER_OPTIONS.map((c) => <option key={c} value={c}>{c} ({courierCounts[c] || 0})</option>)}
            </select>
          </div>
        </div>

        {/* Body: list + actions */}
        <div className="flex-1 flex overflow-hidden">
          {/* Order list */}
          <div className="flex-1 overflow-auto p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-700">{filtered.length} order(s) match</span>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[11px] font-bold text-teal-800 hover:underline">Select all</button>
                <button onClick={clearAll} className="text-[11px] font-bold text-stone-500 hover:underline">Clear</button>
              </div>
            </div>
            <div className="space-y-1.5">
              {filtered.map((o) => {
                const on = selected.has(o.id);
                const docs = resolveOrderDocuments(o).filter((d) => d.active && (printSettings?.documents[d.type]?.enabled ?? true));
                return (
                  <button
                    key={o.id}
                    onClick={() => toggle(o.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors ${on ? 'bg-teal-50 border-teal-300' : 'bg-white border-stone-200 hover:bg-stone-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      {on ? <CheckSquare className="w-4 h-4 text-teal-800" /> : <Square className="w-4 h-4 text-stone-400" />}
                      <div>
                        <div className="text-xs font-bold text-stone-900">{o.orderNumber}</div>
                        <div className="text-[11px] text-stone-500">{o.customer.name} • {o.customer.phone}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-stone-600">{o.paymentStatus} • {o.orderStatus}</div>
                      <div className="text-[11px] text-stone-400">
                        {docs.length} doc{docs.length !== 1 ? 's' : ''} • ৳{o.total.toLocaleString()}
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && <div className="text-center py-12 text-stone-400 text-xs">No orders match the selected filters.</div>}
            </div>
          </div>

          {/* Right summary */}
          <div className="w-72 border-l border-stone-200 p-4 flex flex-col">
            <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Output Mode</div>
            <div className="space-y-1.5 mb-3">
              <button onClick={() => setMode('COMBINED')} className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold ${mode === 'COMBINED' ? 'bg-teal-900 text-white border-teal-900' : 'bg-white border-stone-200 text-stone-700'}`}>
                <Layers className="w-3.5 h-3.5 inline mr-1" /> One Combined PDF
              </button>
              <button onClick={() => setMode('SEPARATE')} className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold ${mode === 'SEPARATE' ? 'bg-teal-900 text-white border-teal-900' : 'bg-white border-stone-200 text-stone-700'}`}>
                <FileText className="w-3.5 h-3.5 inline mr-1" /> Separate PDF per order
              </button>
            </div>

            <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Summary</div>
            <div className="bg-stone-50 rounded-lg p-3 text-[11px] space-y-1">
              <div className="flex justify-between"><span className="text-stone-500">Orders selected</span><b>{selected.size}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Invoices</span><b>{summary.counts['INVOICE']}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Payment Receipts</span><b>{summary.counts['PAYMENT_RECEIPT']}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Packing Slips</span><b>{summary.counts['PACKING_SLIP']}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Courier Labels</span><b>{summary.counts['COURIER_LABEL']}</b></div>
              <div className="flex justify-between border-t border-stone-200 pt-1 mt-1"><span className="text-stone-500">Estimated pages</span><b>{summary.pages}</b></div>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-auto pt-3">
              <button
                onClick={handleGenerate}
                disabled={generating || selected.size === 0}
                className="w-full px-4 py-2.5 bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-teal-950 disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {generating ? progress || 'Generating…' : `Generate ${mode === 'COMBINED' ? 'Combined PDF' : `${selected.size} PDFs`}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
