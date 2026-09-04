/**
 * @file src/components/print/PrintSettingsPanel.tsx
 * @description "Settings → Documents & Printing" admin panel. Per-document
 *   configuration: status, language, page format, barcode/QR, footer, notes,
 *   field visibility (required/optional/system), preview and reset to default.
 * @license Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Save, RefreshCw, Eye, Printer, Layers, Check, X, Loader2, AlertTriangle,
} from 'lucide-react';
import { PrintSettings, PrintDocumentType, DocLanguage, DocPageFormat } from '../../types';
import {
  PRINT_DOCUMENT_TYPES,
  PRINT_DOCUMENT_LABELS,
  PRINT_FIELD_DEFINITIONS,
  PRINT_PAGE_FORMATS,
  defaultPrintSettings,
  resolveOrderDocuments,
} from '../../lib/printFormats';
import { Order, SiteContent } from '../../types';
import { OrderDocumentTemplate } from './PrintTemplates';

interface Props {
  orders: Order[];
  siteContent: SiteContent;
}

const LANG_OPTIONS: { value: DocLanguage; label: string }[] = [
  { value: 'EN', label: 'English' },
  { value: 'BN', label: 'বাংলা' },
  { value: 'BILINGUAL', label: 'Bilingual (EN/BN)' },
];
const FORMAT_OPTIONS: { value: DocPageFormat; label: string }[] = [
  { value: 'A4', label: 'A4' },
  { value: 'A5', label: 'A5' },
  { value: 'LETTER', label: 'Letter' },
  { value: 'THERMAL_80MM', label: 'Thermal 80mm' },
  { value: 'LABEL_4x6', label: 'Label 4x6' },
];
const CATEGORY_LABELS: Record<string, string> = {
  REQUIRED: 'Required (cannot remove)',
  OPTIONAL: 'Optional (may show/hide)',
  SYSTEM_CONTROLLED: 'System-controlled (always accurate)',
};

const A4_PX = Math.round(210 * (96 / 25.4));

export function PrintSettingsPanel({ orders, siteContent }: Props) {
  const [settings, setSettings] = useState<PrintSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<PrintDocumentType>('INVOICE');
  const [showPreview, setShowPreview] = useState(false);
  const [previewCodes, setPreviewCodes] = useState<{ barcodes: Record<string, string>; qrs: Record<string, string> }>({ barcodes: {}, qrs: {} });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/print/settings');
      const data = await res.json();
      if (data.success) setSettings(data.settings);
      else throw new Error(data.error || 'Failed');
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setDoc = (type: PrintDocumentType, patch: Partial<PrintSettings['documents'][PrintDocumentType]>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        documents: {
          ...prev.documents,
          [type]: { ...prev.documents[type], ...patch },
        },
      };
    });
  };

  const setField = (type: PrintDocumentType, key: string, value: boolean) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        documents: {
          ...prev.documents,
          [type]: { ...prev.documents[type], fields: { ...prev.documents[type].fields, [key]: value } },
        },
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch('/api/print/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      setSettings(data.settings);
      setMsg('Document & printing settings saved.');
      setTimeout(() => setMsg(null), 2500);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/print/settings/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) setSettings(data.settings);
      setMsg('Settings reset to defaults.');
      setTimeout(() => setMsg(null), 2500);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const openPreview = async (type: PrintDocumentType) => {
    setShowPreview(true);
    setErr(null);
    const sample = orders[0];
    if (!sample) { setErr('No sample order available for preview.'); return; }
    try {
      const res = await fetch('/api/print/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcodes: { sample: sample.orderNumber, tracking: sample.courier?.trackingId || sample.orderNumber },
          qrs: { sample: sample.orderNumber, tracking: sample.courier?.trackingId || sample.orderNumber },
        }),
      });
      const data = await res.json();
      if (data.success) setPreviewCodes(data.codes);
    } catch (e) {
      setPreviewCodes({ barcodes: {}, qrs: {} });
    }
  };

  const sampleOrder = orders[0];
  const sampleSettings = settings || defaultPrintSettings();
  const sampleDoc = sampleSettings.documents[activeType];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Printer className="w-4 h-4 text-teal-900" /> Documents & Printing
          </h3>
          <p className="text-[11px] text-stone-500">
            Configure each document's fields, language, format and codes. These power the unified Print engine.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-3 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-stone-200">
            <RefreshCw className="w-3.5 h-3.5" /> Reset to Default
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-teal-950 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
          </button>
        </div>
      </div>

      {msg && <div className="flex items-center gap-1.5 text-teal-800 bg-teal-50 border border-teal-200 rounded-lg p-2 text-xs"><Check className="w-4 h-4" /> {msg}</div>}
      {err && <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      {loading && <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-teal-700" /></div>}

      {!loading && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Document type selector */}
          <div className="bg-white rounded-xl border border-stone-200 p-3">
            <div className="text-[11px] font-bold text-stone-500 uppercase mb-2">Document Type</div>
            <div className="space-y-1">
              {PRINT_DOCUMENT_TYPES.map((t) => {
                const cfg = settings.documents[t];
                return (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${activeType === t ? 'bg-teal-900 text-white border-teal-900' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{PRINT_DOCUMENT_LABELS[t]?.en}</span>
                      {cfg?.enabled ? <span className="text-teal-400">●</span> : <span className="text-stone-300">○</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-4 space-y-4">
            {sampleDoc && (
              <>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-stone-700">
                    <input type="checkbox" checked={sampleDoc.enabled} onChange={(e) => setDoc(activeType, { enabled: e.target.checked })} />
                    Enabled
                  </label>
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => openPreview(activeType)} className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-stone-200">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">Language</label>
                    <select value={sampleDoc.language} onChange={(e) => setDoc(activeType, { language: e.target.value as DocLanguage })} className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-xs">
                      {LANG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">Page Format</label>
                    <select value={sampleDoc.pageFormat} onChange={(e) => setDoc(activeType, { pageFormat: e.target.value as DocPageFormat })} className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-xs">
                      {FORMAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-stone-700">
                    <input type="checkbox" checked={sampleDoc.showBarcode} onChange={(e) => setDoc(activeType, { showBarcode: e.target.checked })} /> Barcode
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-stone-700">
                    <input type="checkbox" checked={sampleDoc.showQR} onChange={(e) => setDoc(activeType, { showQR: e.target.checked })} /> QR Code
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">Footer</label>
                  <textarea value={sampleDoc.footer} onChange={(e) => setDoc(activeType, { footer: e.target.value })} rows={2} className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">Notes</label>
                  <textarea value={sampleDoc.notes} onChange={(e) => setDoc(activeType, { notes: e.target.value })} rows={2} className="w-full border border-stone-300 rounded-lg px-2 py-1.5 text-xs" />
                </div>

                {/* Field visibility */}
                <div>
                  <div className="text-xs font-bold text-stone-600 mb-2">Fields</div>
                  {(['REQUIRED', 'OPTIONAL', 'SYSTEM_CONTROLLED'] as const).map((cat) => {
                    const defs = PRINT_FIELD_DEFINITIONS[activeType]?.filter((f) => f.category === cat) || [];
                    if (defs.length === 0) return null;
                    return (
                      <div key={cat} className="mb-2">
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">{CATEGORY_LABELS[cat]}</div>
                        <div className="grid grid-cols-2 gap-1">
                          {defs.map((f) => {
                            const val = sampleDoc.fields[f.key] ?? false;
                            const locked = cat !== 'OPTIONAL';
                            return (
                              <label key={f.key} className={`flex items-center gap-1.5 text-[11px] px-1 py-0.5 rounded ${locked ? 'text-stone-400 cursor-not-allowed' : 'text-stone-700 cursor-pointer'}`}>
                                <input
                                  type="checkbox"
                                  checked={val}
                                  disabled={locked}
                                  onChange={(e) => setField(activeType, f.key, e.target.checked)}
                                />
                                {f.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Preview panel */}
          <div className="lg:col-span-1 bg-stone-50 rounded-xl border border-stone-200 p-3 overflow-auto">
            <div className="text-[11px] font-bold text-stone-500 uppercase mb-2">Live Preview</div>
            {showPreview && sampleOrder ? (
              <div className="bg-white shadow rounded">
                <OrderDocumentTemplate
                  type={activeType}
                  order={sampleOrder}
                  siteContent={siteContent}
                  settings={sampleSettings}
                  codes={previewCodes}
                  pageWidthPx={A4_PX}
                />
              </div>
            ) : (
              <div className="text-[11px] text-stone-400 py-10 text-center">
                Click <b>Preview</b> to render a sample.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
