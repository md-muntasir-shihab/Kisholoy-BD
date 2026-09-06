/**
 * @file src/admin/MarketingCommandCenter.tsx
 * @description KISHOLOY Marketing Command Center (Phases MC-1..MC-5):
 *   Channel Registry · Spend Ledger (boost/ad/send) · Attribution & UTM auto-tag view ·
 *   server-computed ROI dashboard (ROAS, ROI%, CPO, cost/click, cost/conversation) with
 *   charts + monthly summary + read-only Finance reconciliation + CSV export + FUTURE sync hooks.
 *
 * Design contract:
 *   - The UI NEVER computes financial metrics itself. Every number here comes from
 *     /api/marketing/command/* which the server-side ROI engine produced.
 *   - It cannot edit Finance or Order rows; campaign/finance links are read-only references.
 *   - History is preserved: voids and archives, never hard deletes.
 *
 * @license Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity, Megaphone, Radio, Coins, Target, PlugZap, Plus, Pencil, Ban,
  RefreshCw, Download, TrendingUp, Wallet, ShoppingCart, Gauge, PauseCircle,
  PlayCircle, Archive, ExternalLink, Info, CheckCircle2, AlertTriangle, History
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { useApp } from '../context/AppContext';
import {
  MarketingChannelRegistry,
  MarketingSpendEntry,
  MarketingAttributionEntry,
  MarketingRoiReport,
  MarketingRoiRow,
  AutoAttributedOrderRow,
  MarketingSyncConnector,
  MarketingFinanceReconciliation,
  MarketingCampaign,
  AdChannelType,
  AdChannelStatus,
  MarketingSpendType,
  AttributionSourceType,
} from '../types';
import { toBanglaDigits, BANGLA_MONTHS, ENGLISH_MONTHS, formatDateDisplay } from '../utils/dateFilterUtils';
import { AdminHelpButton } from '../components/admin/AdminHelpModal';
import { MARKETING_HELP_DATA } from './marketingHelpData';

type CommandTab = 'OVERVIEW' | 'SPENDS' | 'ATTRIBUTION' | 'CHANNELS' | 'EXPORT';
type PeriodPreset = 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30_DAYS' | 'THIS_QUARTER' | 'CUSTOM';

// ---------------------------------------------------------------------------
// Formatting helpers (display only — never used for computation)
// ---------------------------------------------------------------------------

function localeNum(n: number, isBn: boolean, digits = 0): string {
  const base = new Intl.NumberFormat(isBn ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(n) ? n : 0);
  return base;
}

function useFormat() {
  const { language } = useApp();
  const isBn = language === 'BN';
  return useMemo(() => ({
    isBn,
    bdt: (n: number) => `৳${localeNum(n || 0, isBn, (n || 0) % 1 !== 0 ? 2 : 0)}`,
    num: (n: number) => localeNum(n || 0, isBn),
    x: (n: number) => `${localeNum(n || 0, isBn, 2)}×`,
    pct: (n: number) => `${localeNum(n || 0, isBn, 1)}%`,
    bn: (v: string | number) => toBanglaDigits(String(v)),
    month: (yyyyMm: string) => {
      const [y, m] = yyyyMm.split('-').map(Number);
      const en = ENGLISH_MONTHS[(m || 1) - 1] || '';
      const bnName = BANGLA_MONTHS[(m || 1) - 1] || '';
      return isBn ? `${bnName} ${toBanglaDigits(y)}` : `${en} ${y}`;
    },
    date: (iso: string) => formatDateDisplay(iso, isBn),
  }), [isBn]);
}

// ---------------------------------------------------------------------------
// Period picker (client picks the window; the server does all math for it)
// ---------------------------------------------------------------------------

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function resolvePeriod(preset: PeriodPreset, customFrom: string, customTo: string): { from?: string; to?: string } {
  const now = new Date();
  switch (preset) {
    case 'ALL':
      return {};
    case 'THIS_MONTH':
      return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
    case 'LAST_MONTH':
      return { from: isoDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: isoDay(new Date(now.getFullYear(), now.getMonth(), 0)) };
    case 'LAST_30_DAYS':
      return { from: isoDay(new Date(now.getTime() - 29 * 864e5)), to: isoDay(now) };
    case 'THIS_QUARTER': {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      return { from: isoDay(new Date(now.getFullYear(), qStart, 1)), to: isoDay(new Date(now.getFullYear(), qStart + 3, 0)) };
    }
    case 'CUSTOM':
      return { from: customFrom || undefined, to: customTo || undefined };
  }
}

// ---------------------------------------------------------------------------
// Small presentational atoms
// ---------------------------------------------------------------------------

function StatusChip({ status }: { status: AdChannelStatus | MarketingSpendEntry['status'] }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    PAUSED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    ARCHIVED: 'bg-stone-200 text-stone-600 dark:bg-slate-800 dark:text-slate-400',
    VOID: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  };
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide ${map[status] || map.ARCHIVED}`}>{status}</span>;
}

function TypeChip({ type }: { type: MarketingSpendType }) {
  const map: Record<MarketingSpendType, string> = {
    AD: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    BOOST: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    SEND: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  };
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${map[type]}`}>{type}</span>;
}

function StatCard({ icon: Icon, label, value, tone = 'teal', sub }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: 'teal' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'sky';
  sub?: string;
}) {
  const tones: Record<string, string> = {
    teal: 'bg-teal-900 text-teal-50',
    emerald: 'bg-emerald-800 text-emerald-50',
    amber: 'bg-amber-700 text-amber-50',
    rose: 'bg-rose-700 text-rose-50',
    indigo: 'bg-indigo-800 text-indigo-50',
    sky: 'bg-sky-800 text-sky-50',
  };
  return (
    <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex items-start gap-3">
      <div className={`p-2 rounded-lg shrink-0 ${tones[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 truncate">{label}</p>
        <p className="text-base font-black text-stone-900 dark:text-slate-100 font-mono leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-stone-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-stone-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/40';
const labelCls = 'font-bold text-stone-700 dark:text-slate-300 text-[11px] block mb-1 uppercase tracking-wide';

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[10px] text-stone-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function ModalShell({ title, onClose, children, wide }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-6" onMouseDown={onClose}>
      <div
        className={`bg-stone-50 dark:bg-slate-950 rounded-2xl shadow-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[92vh] overflow-y-auto border border-stone-200 dark:border-slate-800`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 rounded-t-2xl">
          <h3 className="text-sm font-black text-stone-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-500 dark:text-slate-400 min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center">
            <Ban className="w-4 h-4 rotate-45" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ROI data table (channel or campaign view)
// ---------------------------------------------------------------------------

function RoiTable({ rows, caption, captionBn, labelKey }: { rows: MarketingRoiRow[]; caption: string; captionBn: string; labelKey: 'label' | 'labelBn' }) {
  const fmt = useFormat();
  const { language } = useApp();
  const isBn = language === 'BN';
  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-stone-400 dark:text-slate-500 font-semibold">
        {isBn ? 'এই সময়ে কোনো লেনদেন লগ করা হয়নি। নতুন স্পেন্ড/অ্যাট্রিবিউশন যোগ করুন।' : 'No ledger activity for this period yet. Log spend or attribution entries to populate this view.'}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full text-left text-[11px]">
        <caption className="text-left text-xs font-black text-stone-800 dark:text-slate-200 pb-2">{isBn ? captionBn : caption}</caption>
        <thead>
          <tr className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
            <th className="py-2 pr-2 font-black">{isBn ? 'চ্যানেল / ক্যাম্পেইন' : 'Channel / Campaign'}</th>
            <th className="py-2 px-2 font-black text-right">{isBn ? 'মোট স্পেন্ড' : 'Spend'}</th>
            <th className="py-2 px-2 font-black text-right">{isBn ? 'অ্যাট্রিবিউটেড রেভিনিউ' : 'Attributed Revenue'}</th>
            <th className="py-2 px-2 font-black text-right">{isBn ? 'অর্ডার' : 'Orders'}</th>
            <th className="py-2 px-2 font-black text-right">ROAS</th>
            <th className="py-2 px-2 font-black text-right">ROI%</th>
            <th className="py-2 px-2 font-black text-right">{isBn ? 'কস্ট/অর্ডার' : 'CPO'}</th>
            <th className="py-2 px-2 font-black text-right">{isBn ? 'কস্ট/ক্লিক' : 'Cost/Click'}</th>
            <th className="py-2 px-2 font-black text-right">{isBn ? 'কস্ট/কথোপকথন' : 'Cost/Conv.'}</th>
            <th className="py-2 pl-2 font-black text-right">{isBn ? 'ইম্প্রেশন / ক্লিক / সেন্ড' : 'Impr / Clicks / Sends'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
          {rows.map((r) => (
            <tr key={r.key} className="hover:bg-stone-100/60 dark:hover:bg-slate-900/60 transition-colors">
              <td className="py-2.5 pr-2">
                <p className="font-black text-stone-900 dark:text-slate-100">{r[labelKey]}</p>
                <p className="text-[9px] text-stone-400 dark:text-slate-500 font-semibold">{r.meta || ''}</p>
              </td>
              <td className="py-2.5 px-2 text-right font-mono font-bold text-stone-800 dark:text-slate-200">{fmt.bdt(r.spendBdt)}</td>
              <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">{fmt.bdt(r.attributedRevenueBdt)}</td>
              <td className="py-2.5 px-2 text-right font-mono font-bold text-stone-700 dark:text-slate-300">{fmt.num(r.attributedOrders)}</td>
              <td className="py-2.5 px-2 text-right">
                <span className={`font-mono font-black ${r.roas >= 1 ? 'text-emerald-700 dark:text-emerald-400' : r.spendBdt > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-stone-400'}`}>{r.spendBdt > 0 ? fmt.x(r.roas) : '—'}</span>
              </td>
              <td className="py-2.5 px-2 text-right">
                <span className={`font-mono font-black ${r.roiPct >= 0 ? 'text-teal-800 dark:text-teal-400' : 'text-rose-700 dark:text-rose-400'}`}>{r.spendBdt > 0 ? fmt.pct(r.roiPct) : '—'}</span>
              </td>
              <td className="py-2.5 px-2 text-right font-mono text-stone-700 dark:text-slate-300">{r.attributedOrders > 0 ? fmt.bdt(r.cpoBdt) : '—'}</td>
              <td className="py-2.5 px-2 text-right font-mono text-stone-700 dark:text-slate-300">{r.clicks > 0 ? fmt.bdt(r.costPerClickBdt) : '—'}</td>
              <td className="py-2.5 px-2 text-right font-mono text-stone-700 dark:text-slate-300">{r.sends > 0 ? fmt.bdt(r.costPerSendBdt) : '—'}</td>
              <td className="py-2.5 pl-2 text-right font-mono text-[10px] text-stone-500 dark:text-slate-400 whitespace-nowrap">
                {fmt.num(r.impressions)} / {fmt.num(r.clicks)} / {fmt.num(r.sends)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MarketingCommandCenter() {
  const { language, showToast } = useApp();
  const isBn = language === 'BN';
  const fmt = useFormat();

  const [activeTab, setActiveTab] = useState<CommandTab>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Period state
  const [preset, setPreset] = useState<PeriodPreset>('THIS_MONTH');
  const [customFrom, setCustomFrom] = useState(isoDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [customTo, setCustomTo] = useState(isoDay(new Date()));

  // Server-derived datasets
  const [channels, setChannels] = useState<MarketingChannelRegistry[]>([]);
  const [spends, setSpends] = useState<MarketingSpendEntry[]>([]);
  const [attributions, setAttributions] = useState<MarketingAttributionEntry[]>([]);
  const [autoOrders, setAutoOrders] = useState<AutoAttributedOrderRow[]>([]);
  const [report, setReport] = useState<MarketingRoiReport | null>(null);
  const [recon, setRecon] = useState<MarketingFinanceReconciliation | null>(null);
  const [connectors, setConnectors] = useState<MarketingSyncConnector[]>([]);
  const [syncNote, setSyncNote] = useState<{ note: string; noteBn: string } | null>(null);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);

  // Modals
  const [spendModal, setSpendModal] = useState<{ mode: 'create' | 'edit'; entry?: MarketingSpendEntry } | null>(null);
  const [voidTarget, setVoidTarget] = useState<MarketingSpendEntry | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [attrModal, setAttrModal] = useState(false);
  const [channelModal, setChannelModal] = useState<{ mode: 'create' | 'edit'; channel?: MarketingChannelRegistry } | null>(null);
  const [statusTarget, setStatusTarget] = useState<MarketingChannelRegistry | null>(null);
  const [statusDraft, setStatusDraft] = useState<{ status: AdChannelStatus; note: string }>({ status: 'PAUSED', note: '' });
  const [historyTarget, setHistoryTarget] = useState<MarketingSpendEntry | null>(null);

  // Forms
  const emptySpendForm = () => ({
    entryType: 'BOOST' as MarketingSpendType,
    channelId: '',
    campaignId: '',
    dateFrom: isoDay(new Date()),
    dateTo: isoDay(new Date()),
    amountBdt: '',
    impressions: '',
    clicks: '',
    sends: '',
    utmSource: '',
    utmCampaign: '',
    notes: '',
    financeExpenseRef: '',
  });
  const [spendForm, setSpendForm] = useState(emptySpendForm());

  const emptyAttrForm = () => ({
    channelId: '',
    campaignId: '',
    date: isoDay(new Date()),
    attributedRevenueBdt: '',
    attributedOrders: '',
    orderNumbers: '',
    source: 'MANUAL' as AttributionSourceType,
    notes: '',
  });
  const [attrForm, setAttrForm] = useState(emptyAttrForm());

  const emptyChannelForm = () => ({
    type: 'FACEBOOK' as AdChannelType,
    name: '',
    handle: '',
    pageUrl: '',
    status: 'ACTIVE' as AdChannelStatus,
    utmSourcePatterns: '',
    notes: '',
  });
  const [channelForm, setChannelForm] = useState(emptyChannelForm());

  const period = resolvePeriod(preset, customFrom, customTo);
  const rangeQuery = `${period.from ? `from=${period.from}` : ''}${period.to ? `${period.from ? '&' : ''}to=${period.to}` : ''}`;

  const api = async (url: string, opts?: RequestInit) => {
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error((data as any).error || `Request failed (${res.status})`);
    return data;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const qs = rangeQuery ? `?${rangeQuery}` : '';
    try {
      const results = await Promise.allSettled([
        api('/api/marketing/command/channels?includeArchived=1'),
        api(`/api/marketing/command/spends?includeVoided=1${rangeQuery ? `&${rangeQuery}` : ''}`),
        api(`/api/marketing/command/attributions${qs}`),
        api(`/api/marketing/command/auto-orders${qs}`),
        api(`/api/marketing/command/roi${qs}`),
        api(`/api/marketing/command/finance-reconciliation${qs}`),
        api('/api/marketing/command/sync-status'),
        api('/api/marketing/campaigns'),
      ]);

      const [chRes, spRes, atRes, autoRes, roiRes, recRes, syncRes, campRes] = results;

      if (chRes.status === 'fulfilled' && chRes.value?.success) setChannels(chRes.value.channels || []);
      if (spRes.status === 'fulfilled' && spRes.value?.success) setSpends(spRes.value.spends || []);
      if (atRes.status === 'fulfilled' && atRes.value?.success) setAttributions(atRes.value.attributions || []);
      if (autoRes.status === 'fulfilled' && autoRes.value?.success) setAutoOrders(autoRes.value.rows || []);
      if (roiRes.status === 'fulfilled' && roiRes.value?.success) setReport(roiRes.value.report || null);
      if (recRes.status === 'fulfilled' && recRes.value?.success) setRecon(recRes.value.reconciliation || null);
      if (syncRes.status === 'fulfilled' && syncRes.value?.success) {
        setConnectors(syncRes.value.connectors || []);
        setSyncNote({ note: syncRes.value.note || '', noteBn: syncRes.value.noteBn || '' });
      }
      if (campRes.status === 'fulfilled' && campRes.value?.success) setCampaigns(campRes.value.campaigns || []);
    } catch (e: any) {
      console.error('Marketing command center fetch failed', e);
      showToast(isBn ? 'মার্কেটিং কমান্ড সেন্টার ডেটা লোড করা যায়নি' : 'Failed to load Marketing Command Center data');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeQuery, isBn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const channelName = (id: string) => channels.find((c) => c.id === id)?.name || id;

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const submitSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spendForm.channelId) {
      showToast(isBn ? 'চ্যানেল নির্বাচন আবশ্যক' : 'Channel selection is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...spendForm,
        amountBdt: Number(spendForm.amountBdt),
        impressions: Number(spendForm.impressions || 0),
        clicks: Number(spendForm.clicks || 0),
        sends: Number(spendForm.sends || 0),
        campaignId: spendForm.campaignId || '',
      };
      if (spendModal?.mode === 'edit' && spendModal.entry) {
        await api(`/api/marketing/command/spends/${spendModal.entry.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        showToast(isBn ? 'স্পেন্ড এন্ট্রি সংশোধিত (সংশোধনের ইতিহাস সংরক্ষিত)' : 'Spend entry amended (amendment history preserved)');
      } else {
        await api('/api/marketing/command/spends', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        showToast(isBn ? 'স্পেন্ড লেজারে যুক্ত হয়েছে' : 'Spend logged to the marketing ledger');
      }
      setSpendModal(null);
      await fetchData();
    } catch (err: any) {
      showToast(`⚠ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitVoid = async () => {
    if (!voidTarget) return;
    setSaving(true);
    try {
      await api(`/api/marketing/command/spends/${voidTarget.id}/void`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: voidReason }),
      });
      showToast(isBn ? 'এন্ট্রি বাতিল (VOID) চিহ্নিত — রেকর্ড ইতিহাসে থাকবে' : 'Entry voided — original record preserved in history');
      setVoidTarget(null);
      setVoidReason('');
      await fetchData();
    } catch (err: any) {
      showToast(`⚠ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitAttribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrForm.channelId) {
      showToast(isBn ? 'চ্যানেল নির্বাচন আবশ্যক' : 'Channel selection is required');
      return;
    }
    setSaving(true);
    try {
      await api('/api/marketing/command/attributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...attrForm,
          attributedRevenueBdt: Number(attrForm.attributedRevenueBdt || 0),
          attributedOrders: Number(attrForm.attributedOrders || 0),
          orderNumbers: attrForm.orderNumbers.split(',').map((s) => s.trim()).filter(Boolean),
          campaignId: attrForm.campaignId || '',
        }),
      });
      showToast(isBn ? 'অ্যাট্রিবিউশন রেকর্ড সঞ্চয়িত' : 'Attribution record saved');
      setAttrModal(false);
      setAttrForm(emptyAttrForm());
      await fetchData();
    } catch (err: any) {
      showToast(`⚠ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (channelModal?.mode === 'edit' && channelModal.channel) {
        await api(`/api/marketing/command/channels/${channelModal.channel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: channelForm.name,
            handle: channelForm.handle,
            pageUrl: channelForm.pageUrl,
            notes: channelForm.notes,
            utmSourcePatterns: channelForm.utmSourcePatterns.split(',').map((s) => s.trim()).filter(Boolean),
          }),
        });
        showToast(isBn ? 'চ্যানেল রেজিস্ট্রি হালনাগাদ' : 'Channel registry updated');
      } else {
        await api('/api/marketing/command/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...channelForm,
            utmSourcePatterns: channelForm.utmSourcePatterns.split(',').map((s) => s.trim()).filter(Boolean),
          }),
        });
        showToast(isBn ? 'নতুন মার্কেটিং চ্যানেল নিবন্ধিত' : 'New marketing channel registered');
      }
      setChannelModal(null);
      setChannelForm(emptyChannelForm());
      await fetchData();
    } catch (err: any) {
      showToast(`⚠ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitChannelStatus = async () => {
    if (!statusTarget) return;
    setSaving(true);
    try {
      await api(`/api/marketing/command/channels/${statusTarget.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusDraft.status, note: statusDraft.note }),
      });
      showToast(isBn ? `চ্যানেল স্ট্যাটাস ${statusDraft.status} — ইতিহাস সংরক্ষিত` : `Channel status set to ${statusDraft.status} — history preserved`);
      setStatusTarget(null);
      setStatusDraft({ status: 'PAUSED', note: '' });
      await fetchData();
    } catch (err: any) {
      showToast(`⚠ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const openSpendModal = (entry?: MarketingSpendEntry) => {
    if (entry) {
      setSpendForm({
        entryType: entry.entryType,
        channelId: entry.channelId,
        campaignId: entry.campaignId || '',
        dateFrom: entry.dateFrom,
        dateTo: entry.dateTo,
        amountBdt: String(entry.amountBdt),
        impressions: String(entry.impressions || ''),
        clicks: String(entry.clicks || ''),
        sends: String(entry.sends || ''),
        utmSource: entry.utmSource || '',
        utmCampaign: entry.utmCampaign || '',
        notes: entry.notes || '',
        financeExpenseRef: entry.financeExpenseRef || '',
      });
      setSpendModal({ mode: 'edit', entry });
    } else {
      setSpendForm({ ...emptySpendForm(), channelId: channels.find((c) => c.status === 'ACTIVE')?.id || '' });
      setSpendModal({ mode: 'create' });
    }
  };

  const openChannelModal = (channel?: MarketingChannelRegistry) => {
    if (channel) {
      setChannelForm({
        type: channel.type,
        name: channel.name,
        handle: channel.handle,
        pageUrl: channel.pageUrl || '',
        status: channel.status,
        utmSourcePatterns: channel.utmSourcePatterns.join(', '),
        notes: channel.notes || '',
      });
      setChannelModal({ mode: 'edit', channel });
    } else {
      setChannelForm(emptyChannelForm());
      setChannelModal({ mode: 'create' });
    }
  };

  const downloadCsv = (type: string) => {
    window.location.href = `/api/marketing/command/export?type=${type}${rangeQuery ? `&${rangeQuery}` : ''}`;
  };

  // -------------------------------------------------------------------------
  // Chart data (pure projection of server report rows — no client math)
  // -------------------------------------------------------------------------

  const channelChartData = (report?.byChannel || []).map((r) => ({
    name: isBn ? r.labelBn : r.label,
    short: r.label.split(' ').slice(0, 2).join(' '),
    spend: r.spendBdt,
    revenue: r.attributedRevenueBdt,
  }));
  const monthlyChartData = (report?.monthly || []).map((m) => ({
    name: fmt.month(m.month),
    spend: m.spendBdt,
    revenue: m.attributedRevenueBdt,
    roas: m.roas,
  }));

  const totals = report?.totals;
  const selectableChannels = channels.filter((c) => c.status !== 'ARCHIVED');

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header + period control */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="p-2 bg-teal-800 text-white rounded-lg shrink-0"><Radio className="w-4 h-4" /></div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-stone-900 dark:text-slate-100 flex items-center gap-2">
              {isBn ? 'মার্কেটিং কমান্ড সেন্টার' : 'Marketing Command Center'}
              <AdminHelpButton helpData={MARKETING_HELP_DATA.MARKETING_COMMAND_CENTER} />
            </h2>
            <p className="text-[10px] text-stone-500 dark:text-slate-400 font-semibold">
              {isBn
                ? 'রেজিস্ট্রি · স্পেন্ড লেজার · অ্যাট্রিবিউশন · সার্ভার-সাইড ROI — ফাইন্যান্স/অর্ডারে হাত দেয় না'
                : 'Registry · Spend ledger · Attribution · Server-side ROI — never mutates Finance or Orders'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as PeriodPreset)}
            className="border border-stone-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-bold bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-200"
            aria-label={isBn ? 'সময়সীমা' : 'Period'}
          >
            <option value="ALL">{isBn ? 'সর্বকালের' : 'All time'}</option>
            <option value="THIS_MONTH">{isBn ? 'এই মাস' : 'This month'}</option>
            <option value="LAST_MONTH">{isBn ? 'গত মাস' : 'Last month'}</option>
            <option value="LAST_30_DAYS">{isBn ? 'গত ৩০ দিন' : 'Last 30 days'}</option>
            <option value="THIS_QUARTER">{isBn ? 'এই প্রান্তিককাল' : 'This quarter'}</option>
            <option value="CUSTOM">{isBn ? 'কাস্টম রেঞ্জ' : 'Custom range'}</option>
          </select>
          {preset === 'CUSTOM' && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="border border-stone-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-bold bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-200" />
              <span className="text-stone-400 text-[11px]">→</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="border border-stone-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-bold bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-200" />
            </>
          )}
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 dark:border-slate-700 rounded-lg text-[11px] font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isBn ? 'সিঙ্ক' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {([
          { id: 'OVERVIEW', icon: Gauge, label: isBn ? 'ROI ড্যাশবোর্ড' : 'ROI Dashboard' },
          { id: 'SPENDS', icon: Coins, label: isBn ? 'স্পেন্ড লেজার' : 'Spend Ledger' },
          { id: 'ATTRIBUTION', icon: Target, label: isBn ? 'অ্যাট্রিবিউশন' : 'Attribution' },
          { id: 'CHANNELS', icon: Megaphone, label: isBn ? 'চ্যানেল রেজিস্ট্রি' : 'Channel Registry' },
          { id: 'EXPORT', icon: PlugZap, label: isBn ? 'রিপোর্ট ও সিংক হুক' : 'Reports & Sync Hooks' },
        ] as { id: CommandTab; icon: React.ComponentType<{ className?: string }>; label: string }[]).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-stone-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================= TAB: OVERVIEW ============================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard icon={Wallet} label={isBn ? 'মোট স্পেন্ড' : 'Total Spend'} value={fmt.bdt(totals?.spendBdt || 0)} tone="rose" sub={isBn ? 'লেজারভিত্তিক (BDT)' : 'Ledger-based (BDT)'} />
            <StatCard icon={TrendingUp} label={isBn ? 'অ্যাট্রিবিউটেড রেভিনিউ' : 'Attributed Revenue'} value={fmt.bdt(totals?.attributedRevenueBdt || 0)} tone="emerald" sub={isBn ? 'UTM + ম্যানুয়াল রেকর্ড' : 'UTM + recorded entries'} />
            <StatCard icon={ShoppingCart} label={isBn ? 'অ্যাট্রিবিউটেড অর্ডার' : 'Attributed Orders'} value={fmt.num(totals?.attributedOrders || 0)} tone="indigo" />
            <StatCard icon={Gauge} label="ROAS" value={totals && totals.spendBdt > 0 ? fmt.x(totals.roas) : '—'} tone="teal" sub={isBn ? 'রেভিনিউ ÷ স্পেন্ড' : 'revenue ÷ spend'} />
            <StatCard icon={Activity} label="ROI %" value={totals && totals.spendBdt > 0 ? fmt.pct(totals.roiPct) : '—'} tone={(totals?.roiPct || 0) >= 0 ? 'emerald' : 'rose'} sub={isBn ? 'স্পেন্ডসহ নিট রিটার্ন' : 'net return vs spend'} />
            <StatCard icon={Coins} label={isBn ? 'কস্ট / অর্ডার (CPO)' : 'Cost / Order (CPO)'} value={totals && totals.attributedOrders > 0 ? fmt.bdt(totals.cpoBdt) : '—'} tone="amber" />
          </div>

          {/* Governance strip */}
          <div className="flex items-start gap-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-teal-700 dark:text-teal-400 mt-0.5 shrink-0" />
            <p className="text-[11px] font-semibold text-teal-900 dark:text-teal-200 leading-relaxed">
              {isBn
                ? 'ROAS, ROI%, CPO, কস্ট/ক্লিক ও কস্ট/কথোপকথন সব হিসাব একচেটিয়াভাবে সার্ভার-সাইড ROI ইঞ্জিনে হয়। এই মডিউল অর্ডার বা ফাইন্যান্সের কোনো সংখ্যা পরিবর্তন করে না; ইতিহাস সর্বদা সংরক্ষিত (VOID/ARCHIVE, ডিলিট নয়)।'
                : 'ROAS, ROI%, CPO, cost/click and cost/conversation are computed exclusively by the server-side ROI engine. This module never mutates order or finance figures, and history is always retained (VOID / ARCHIVE — no hard deletes).'}
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Channel chart */}
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <h3 className="text-xs font-black text-stone-800 dark:text-slate-200 mb-3">
                {isBn ? 'চ্যানেলভিত্তিক স্পেন্ড বনাম রেভিনিউ' : 'Spend vs Attributed Revenue — by channel'}
              </h3>
              <div className="h-64">
                {channelChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelChartData} margin={{ top: 4, right: 6, left: -14, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="short" tick={{ fontSize: 10, fill: '#78716c' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#78716c' }} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #d6d3d1' }}
                        formatter={(v: any, name: any) => [`৳${localeNum(Number(v) || 0, false)}`, name === 'spend' ? (isBn ? 'স্পেন্ড' : 'Spend') : (isBn ? 'রেভিনিউ' : 'Revenue')]}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v) => (v === 'spend' ? (isBn ? 'স্পেন্ড' : 'Spend') : isBn ? 'রেভিনিউ' : 'Revenue')} />
                      <Bar dataKey="spend" fill="#9f1239" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="revenue" fill="#047857" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-stone-400 dark:text-slate-500 font-semibold">{isBn ? 'ডেটা নেই' : 'No data for this period'}</div>
                )}
              </div>
            </div>

            {/* Monthly trend */}
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <h3 className="text-xs font-black text-stone-800 dark:text-slate-200 mb-3">
                {isBn ? 'মাসিক ধারা — স্পেন্ড, রেভিনিউ ও ROAS' : 'Monthly Trend — spend, revenue & ROAS'}
              </h3>
              <div className="h-64">
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyChartData} margin={{ top: 4, right: 6, left: -14, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b45309" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#b45309" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="mRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716c' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#78716c' }} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #d6d3d1' }}
                        formatter={(v: any, name: any) => [name === 'roas' ? `${Number(v).toFixed(2)}×` : `৳${localeNum(Number(v) || 0, false)}`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Area type="monotone" dataKey="revenue" stroke="#0d9488" fill="url(#mRev)" strokeWidth={2} />
                      <Area type="monotone" dataKey="spend" stroke="#b45309" fill="url(#mSpend)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-stone-400 dark:text-slate-500 font-semibold">{isBn ? 'ডেটা নেই' : 'No data for this period'}</div>
                )}
              </div>
            </div>
          </div>

          {/* ROI tables */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <RoiTable rows={report?.byChannel || []} caption="Per-channel ROI" captionBn="প্রতি চ্যানেলের ROI" labelKey="label" />
          </div>
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <RoiTable rows={report?.byCampaign || []} caption="Per-campaign ROI (linked to Campaigns module)" captionBn="প্রতি ক্যাম্পেইনের ROI (ক্যাম্পেইন মডিউলের সাথে লিংকড)" labelKey="labelBn" />
          </div>

          {/* Monthly summary table */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-4 shadow-xs overflow-x-auto">
            <h3 className="text-xs font-black text-stone-800 dark:text-slate-200 mb-3">{isBn ? 'মাসিক সারাংশ' : 'Monthly Summary'}</h3>
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                  <th className="py-2 pr-2 font-black">{isBn ? 'মাস' : 'Month'}</th>
                  <th className="py-2 px-2 font-black text-right">{isBn ? 'স্পেন্ড' : 'Spend'}</th>
                  <th className="py-2 px-2 font-black text-right">{isBn ? 'রেভিনিউ' : 'Revenue'}</th>
                  <th className="py-2 px-2 font-black text-right">{isBn ? 'অর্ডার' : 'Orders'}</th>
                  <th className="py-2 px-2 font-black text-right">{isBn ? 'ক্লিক' : 'Clicks'}</th>
                  <th className="py-2 px-2 font-black text-right">{isBn ? 'সেন্ড' : 'Sends'}</th>
                  <th className="py-2 px-2 font-black text-right">ROAS</th>
                  <th className="py-2 pl-2 font-black text-right">ROI%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                {(report?.monthly || []).map((m) => (
                  <tr key={m.month}>
                    <td className="py-2 pr-2 font-black text-stone-800 dark:text-slate-200">{fmt.month(m.month)}</td>
                    <td className="py-2 px-2 text-right font-mono">{fmt.bdt(m.spendBdt)}</td>
                    <td className="py-2 px-2 text-right font-mono text-emerald-700 dark:text-emerald-400">{fmt.bdt(m.attributedRevenueBdt)}</td>
                    <td className="py-2 px-2 text-right font-mono">{fmt.num(m.attributedOrders)}</td>
                    <td className="py-2 px-2 text-right font-mono">{fmt.num(m.clicks)}</td>
                    <td className="py-2 px-2 text-right font-mono">{fmt.num(m.sends)}</td>
                    <td className="py-2 px-2 text-right font-mono font-black">{m.spendBdt > 0 ? fmt.x(m.roas) : '—'}</td>
                    <td className={`py-2 pl-2 text-right font-mono font-black ${m.roiPct >= 0 ? 'text-teal-800 dark:text-teal-400' : 'text-rose-700 dark:text-rose-400'}`}>{m.spendBdt > 0 ? fmt.pct(m.roiPct) : '—'}</td>
                  </tr>
                ))}
                {(report?.monthly || []).length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-stone-400 dark:text-slate-500 font-semibold text-xs">{isBn ? 'এই সময়ে কোনো মাসিক কার্যকলাপ নেই' : 'No monthly activity in this period'}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Finance reconciliation (read-only) */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-black text-stone-800 dark:text-slate-200">{isBn ? 'ফাইন্যান্স রিকনসিলিয়েশন (শুধু পড়া)' : 'Finance Reconciliation (read-only)'}</h3>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase">{isBn ? 'ইন্টিগ্রেটেড · লেখালেখি নয়' : 'Integrated · Non-mutating'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="border border-stone-200 dark:border-slate-800 rounded-lg p-3">
                <p className="text-[9px] uppercase font-black text-stone-400">{isBn ? 'ফাইন্যান্সের MARKETING খরচ' : 'Finance MARKETING expenses'}</p>
                <p className="font-mono font-black text-stone-900 dark:text-slate-100 mt-1">{fmt.bdt(recon?.financeMarketingSpendBdt || 0)}</p>
              </div>
              <div className="border border-stone-200 dark:border-slate-800 rounded-lg p-3">
                <p className="text-[9px] uppercase font-black text-stone-400">{isBn ? 'কমান্ড সেন্টার লেজার' : 'Command Center ledger'}</p>
                <p className="font-mono font-black text-stone-900 dark:text-slate-100 mt-1">{fmt.bdt(recon?.commandCenterSpendBdt || 0)}</p>
              </div>
              <div className={`border rounded-lg p-3 ${Math.abs(recon?.gapBdt || 0) > 0 ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40' : 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'}`}>
                <p className="text-[9px] uppercase font-black text-stone-400">{isBn ? 'পার্থক্য (লগ করা বাকি)' : 'Unlogged gap (finance − ledger)'}</p>
                <p className="font-mono font-black mt-1 text-stone-900 dark:text-slate-100">{fmt.bdt(recon?.gapBdt || 0)}</p>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-slate-400 font-semibold leading-relaxed">
              {isBn ? recon?.noteBn : recon?.note}
            </p>
          </div>
        </div>
      )}

      {/* ============================= TAB: SPEND LEDGER ============================= */}
      {activeTab === 'SPENDS' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-stone-500 dark:text-slate-400">
              {isBn
                ? 'বুস্ট / অ্যাড / ব্রডকাস্ট সেন্ড — সব খরচ এখানে লগ করুন। বাতিল মানেই VOID, মুছে যায় না।'
                : 'Boost, ad and broadcast send costs live here. Voiding keeps history; entries are never hard-deleted.'}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadCsv('SPENDS')} className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 dark:border-slate-700 rounded-lg text-[11px] font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800">
                <Download className="w-3.5 h-3.5" /> {isBn ? 'CSV' : 'Export CSV'}
              </button>
              <button onClick={() => openSpendModal()} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors">
                <Plus className="w-4 h-4" /> {isBn ? 'স্পেন্ড লগ' : 'Log Spend'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                  <th className="py-2.5 px-3 font-black">{isBn ? 'তারিখ (সময়সীমা)' : 'Period'}</th>
                  <th className="py-2.5 px-3 font-black">{isBn ? 'ধরন' : 'Type'}</th>
                  <th className="py-2.5 px-3 font-black">{isBn ? 'চ্যানেল' : 'Channel'}</th>
                  <th className="py-2.5 px-3 font-black">{isBn ? 'ক্যাম্পেইন' : 'Campaign'}</th>
                  <th className="py-2.5 px-3 font-black text-right">{isBn ? 'টাকা (BDT)' : 'Amount'}</th>
                  <th className="py-2.5 px-3 font-black text-right">{isBn ? 'ইম্প্রেসন' : 'Impr.'}</th>
                  <th className="py-2.5 px-3 font-black text-right">{isBn ? 'ক্লিক' : 'Clicks'}</th>
                  <th className="py-2.5 px-3 font-black text-right">{isBn ? 'সেন্ড' : 'Sends'}</th>
                  <th className="py-2.5 px-3 font-black">{isBn ? 'UTM' : 'UTM'}</th>
                  <th className="py-2.5 px-3 font-black">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-2.5 px-3 font-black text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                {spends.map((s) => (
                  <tr key={s.id} className={`hover:bg-stone-50 dark:hover:bg-slate-800/40 ${s.status === 'VOID' ? 'opacity-55' : ''}`}>
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                      <p className="font-bold text-stone-800 dark:text-slate-200">{s.dateFrom === s.dateTo ? s.dateFrom : `${s.dateFrom} → ${s.dateTo}`}</p>
                      <p className="text-[9px] text-stone-400">{isBn ? 'লগ:' : 'logged'} {fmt.date(s.createdAt)}</p>
                    </td>
                    <td className="py-2.5 px-3"><TypeChip type={s.entryType} /></td>
                    <td className="py-2.5 px-3 font-bold text-stone-800 dark:text-slate-200 max-w-[160px] truncate" title={channelName(s.channelId)}>{channelName(s.channelId)}</td>
                    <td className="py-2.5 px-3 max-w-[170px]">
                      {s.campaignId ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300" title={s.campaignNameSnapshot}>
                          <ExternalLink className="w-3 h-3" /> <span className="truncate">{s.campaignNameSnapshot || s.campaignId}</span>
                        </span>
                      ) : <span className="text-stone-400">—</span>}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-black ${s.status === 'VOID' ? 'line-through text-stone-400' : 'text-stone-900 dark:text-slate-100'}`}>{fmt.bdt(s.amountBdt)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-500 dark:text-slate-400">{fmt.num(s.impressions)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-500 dark:text-slate-400">{fmt.num(s.clicks)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-500 dark:text-slate-400">{fmt.num(s.sends)}</td>
                    <td className="py-2.5 px-3 text-[10px] font-mono text-stone-500 dark:text-slate-400 max-w-[130px] truncate" title={`${s.utmSource || ''}${s.utmCampaign ? ` / ${s.utmCampaign}` : ''}`}>
                      {s.utmSource ? `${s.utmSource}${s.utmCampaign ? ` / ${s.utmCampaign}` : ''}` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1">
                        <StatusChip status={s.status} />
                        {s.financeExpenseRef && <span className="text-[8px] font-black text-slate-400">FIN·{s.financeExpenseRef}</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => setHistoryTarget(s)} className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400" title={isBn ? 'সংশোধনের ইতিহাস' : 'Amendment history'}><History className="w-3.5 h-3.5" /></button>
                        {s.status === 'ACTIVE' && (
                          <>
                            <button onClick={() => openSpendModal(s)} className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300" title={isBn ? 'সংশোধন' : 'Amend'}><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setVoidTarget(s)} className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400" title={isBn ? 'বাতিল (VOID)' : 'Void'}><Ban className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {spends.length === 0 && (
                  <tr><td colSpan={11} className="py-8 text-center text-stone-400 dark:text-slate-500 font-semibold text-xs">{isBn ? 'এই সময়সীমায় কোনো স্পেন্ড লগ নেই' : 'No spend entries logged for this period'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================= TAB: ATTRIBUTION ============================= */}
      {activeTab === 'ATTRIBUTION' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-stone-500 dark:text-slate-400 max-w-2xl">
              {isBn
                ? 'অ্যাট্রিবিউশন দুই স্তরে: (১) চেকআউটে UTM অটো-ট্যাগ হওয়া অর্ডার সার্ভার স্বয়ংক্রিয়ভাবে চ্যানেলে বসায়, (২) Ads Manager/WhatsApp/Telegram-এর সংখ্যা ম্যানুয়ালি রেকর্ড করা যায়। ম্যানুয়াল রেকর্ড যে অর্ডারগুলো দাবি করে, অটো-গণনায় সেগুলো বাদ যায় — ডাবল-কাউন্টিং ঠেকাতে।'
                : 'Two layers: (1) orders auto-tagged with UTM at checkout are matched to channels by the server, (2) manual entries record Ads Manager / WhatsApp / Telegram figures. Manual entries claim their orders so auto-counting skips them — no double counting.'}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadCsv('ATTRIBUTIONS')} className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 dark:border-slate-700 rounded-lg text-[11px] font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => { setAttrForm(emptyAttrForm()); setAttrModal(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors">
                <Plus className="w-4 h-4" /> {isBn ? 'অ্যাট্রিবিউশন রেকর্ড' : 'Record Attribution'}
              </button>
            </div>
          </div>

          {/* Manual attribution ledger */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
            <div className="px-4 pt-3 text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-slate-400">{isBn ? 'ম্যানুয়াল/রেকর্ডকৃত অ্যাট্রিবিউশন' : 'Recorded Attribution Entries'}</div>
            <table className="w-full text-left text-[11px] mt-1">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                  <th className="py-2 px-3 font-black">{isBn ? 'তারিখ' : 'Date'}</th>
                  <th className="py-2 px-3 font-black">{isBn ? 'চ্যানেল' : 'Channel'}</th>
                  <th className="py-2 px-3 font-black">{isBn ? 'ক্যাম্পেইন' : 'Campaign'}</th>
                  <th className="py-2 px-3 font-black text-right">{isBn ? 'রেভিনিউ' : 'Revenue'}</th>
                  <th className="py-2 px-3 font-black text-right">{isBn ? 'অর্ডার' : 'Orders'}</th>
                  <th className="py-2 px-3 font-black">{isBn ? 'সোর্স' : 'Source'}</th>
                  <th className="py-2 px-3 font-black">{isBn ? 'অর্ডার রেফারেন্স' : 'Order refs'}</th>
                  <th className="py-2 px-3 font-black">{isBn ? 'নোট' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                {attributions.map((a) => (
                  <tr key={a.id} className="hover:bg-stone-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono">{a.date}</td>
                    <td className="py-2 px-3 font-bold text-stone-800 dark:text-slate-200">{channelName(a.channelId)}</td>
                    <td className="py-2 px-3 text-indigo-700 dark:text-indigo-300 max-w-[150px] truncate">{a.campaignNameSnapshot || '—'}</td>
                    <td className="py-2 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">{fmt.bdt(a.attributedRevenueBdt)}</td>
                    <td className="py-2 px-3 text-right font-mono">{fmt.num(a.attributedOrders)}</td>
                    <td className="py-2 px-3"><span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-black">{a.source}</span></td>
                    <td className="py-2 px-3 font-mono text-[10px] text-stone-500 dark:text-slate-400 max-w-[160px] truncate" title={a.orderNumbers.join(', ')}>{a.orderNumbers.join(', ') || '—'}</td>
                    <td className="py-2 px-3 text-stone-500 dark:text-slate-400 max-w-[200px] truncate" title={a.notes}>{a.notes || '—'}</td>
                  </tr>
                ))}
                {attributions.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-stone-400 dark:text-slate-500 font-semibold text-xs">{isBn ? 'কোনো ম্যানুয়াল অ্যাট্রিবিউশন রেকর্ড নেই' : 'No manual attribution records yet'}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Auto-tagged orders */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
            <div className="px-4 pt-3 flex items-center justify-between">
              <div className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-slate-400">
                {isBn ? 'UTM/সোর্স-ট্যাগড অর্ডার — সার্ভার স্বয়ংক্রিয় ম্যাচ (শুধু পড়া)' : 'Auto-matched orders from UTM / channel provenance (read-only)'}
              </div>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300">{isBn ? 'অর্ডার ডেটা অপরিবর্তিত' : 'Orders untouched'}</span>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-left text-[11px] mt-1">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                  <th className="py-2 px-3 font-black">{isBn ? 'অর্ডার' : 'Order'}</th>
                  <th className="py-2 px-3 font-black">{isBn ? 'তারিখ' : 'Date'}</th>
                  <th className="py-2 px-3 font-black text-right">{isBn ? 'মূল্য' : 'Total'}</th>
                  <th className="py-2 px-3 font-black">utm_source</th>
                  <th className="py-2 px-3 font-black">utm_campaign</th>
                  <th className="py-2 px-3 font-black">{isBn ? 'ম্যাচ হওয়া চ্যানেল' : 'Matched channel'}</th>
                  <th className="py-2 px-3 font-black">{isBn ? 'ম্যাচ হওয়া ক্যাম্পেইন' : 'Matched campaign'}</th>
                  <th className="py-2 px-3 font-black">{isBn ? 'ভিত্তি' : 'Basis'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                {autoOrders.map((r) => (
                  <tr key={r.orderNumber} className="hover:bg-stone-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono font-black text-stone-800 dark:text-slate-200">{r.orderNumber}</td>
                    <td className="py-2 px-3 font-mono text-stone-500">{r.orderDate}</td>
                    <td className="py-2 px-3 text-right font-mono">{fmt.bdt(r.totalBdt)}</td>
                    <td className="py-2 px-3 font-mono text-[10px]">{r.utmSource || '—'}</td>
                    <td className="py-2 px-3 font-mono text-[10px] max-w-[150px] truncate">{r.utmCampaign || '—'}</td>
                    <td className="py-2 px-3 font-semibold text-stone-700 dark:text-slate-300">{r.matchedChannelLabel || <span className="text-stone-400">—</span>}</td>
                    <td className="py-2 px-3 text-indigo-700 dark:text-indigo-300 max-w-[150px] truncate">{r.matchedCampaignName || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                        r.matchBasis === 'UTM_SOURCE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : r.matchBasis === 'ORDER_SOURCE' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
                            : 'bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {r.matchBasis === 'NONE' ? (isBn ? 'ম্যানুয়াল/আনম্যাচড' : 'Manual/Unmatched') : r.matchBasis}
                      </span>
                    </td>
                  </tr>
                ))}
                {autoOrders.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-stone-400 dark:text-slate-500 font-semibold text-xs">
                    {isBn
                      ? 'এই সময়ে UTM-ট্যাগড কোনো অর্ডার নেই। লিংকে utm_source=fb যুক্ত করে অর্ডার এলে এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।'
                      : 'No UTM-tagged orders in this window. Share campaign links with utm_source=fb and they will appear here automatically.'}
                  </td></tr>
                )}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {/* ============================= TAB: CHANNEL REGISTRY ============================= */}
      {activeTab === 'CHANNELS' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-stone-500 dark:text-slate-400">
              {isBn ? 'MarketingChannel রেজিস্ট্রি — পেজ/চ্যানেল হ্যান্ডেল, UTM অ্যালিয়াস ও লাইফসাইকেল (PAUSE/ARCHIVE; কখনো ডিলিট নয়)' : 'MarketingChannel registry — page/channel handles, UTM aliases and lifecycle (PAUSE/ARCHIVE; never hard-deleted)'}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadCsv('CHANNELS')} className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 dark:border-slate-700 rounded-lg text-[11px] font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => openChannelModal()} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors">
                <Plus className="w-4 h-4" /> {isBn ? 'নতুন চ্যানেল' : 'Register Channel'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {channels.map((c) => (
              <div key={c.id} className={`rounded-xl border p-4 bg-white dark:bg-slate-900 shadow-xs ${c.status === 'ARCHIVED' ? 'border-stone-200 dark:border-slate-800 opacity-60' : 'border-stone-200 dark:border-slate-800'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-stone-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[9px] font-black tracking-wider">{c.type}</span>
                      <StatusChip status={c.status} />
                    </div>
                    <h4 className="text-xs font-black text-stone-900 dark:text-slate-100 mt-1.5 truncate" title={c.name}>{c.name}</h4>
                    <p className="text-[10px] font-mono text-stone-500 dark:text-slate-400 truncate">@{c.handle}</p>
                    {c.pageUrl && (
                      <a href={c.pageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-400 hover:underline mt-0.5">
                        {isBn ? 'প্রোফাইল' : 'Open profile'} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {c.status === 'ACTIVE' && (
                      <button onClick={() => { setStatusTarget(c); setStatusDraft({ status: 'PAUSED', note: '' }); }} className="p-1.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600" title={isBn ? 'বিরতি' : 'Pause'}><PauseCircle className="w-4 h-4" /></button>
                    )}
                    {c.status === 'PAUSED' && (
                      <button onClick={() => { setStatusTarget(c); setStatusDraft({ status: 'ACTIVE', note: '' }); }} className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600" title={isBn ? 'পুনরায় সক্রিয়' : 'Reactivate'}><PlayCircle className="w-4 h-4" /></button>
                    )}
                    {c.status !== 'ARCHIVED' && (
                      <button onClick={() => { setStatusTarget(c); setStatusDraft({ status: 'ARCHIVED', note: '' }); }} className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-500" title={isBn ? 'আর্কাইভ (ইতিহাস থাকবে)' : 'Archive (history retained)'}><Archive className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => openChannelModal(c)} className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-500" title={isBn ? 'সম্পাদনা' : 'Edit'}><Pencil className="w-4 h-4" /></button>
                  </div>
                </div>
                {c.utmSourcePatterns.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.utmSourcePatterns.map((p) => (
                      <span key={p} className="px-1.5 py-0.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded text-[9px] font-mono font-bold text-teal-800 dark:text-teal-300">utm:{p}</span>
                    ))}
                  </div>
                )}
                {c.notes && <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2" title={c.notes}>{c.notes}</p>}
                <p className="text-[9px] text-stone-400 dark:text-slate-500 mt-2 font-semibold">
                  {isBn ? 'স্ট্যাটাস পরিবর্তন' : 'Status events'}: {c.statusHistory.length} · {isBn ? 'সর্বশেষ' : 'last'} {fmt.date(c.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================= TAB: EXPORT & SYNC HOOKS ============================= */}
      {activeTab === 'EXPORT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-2.5">
            <h3 className="text-xs font-black text-stone-800 dark:text-slate-200 flex items-center gap-2"><Download className="w-4 h-4 text-teal-700" /> {isBn ? 'CSV রিপোর্ট এক্সপোর্ট' : 'CSV Report Exports'}</h3>
            <p className="text-[10px] text-stone-500 dark:text-slate-400 font-semibold leading-relaxed">
              {isBn ? 'সব ফাইল সার্ভার থেকেই তৈরি হয় (UTF-8 BOM — বাংলা এক্সেলে ঠিকঠাক খুলবে) এবং বর্তমান নির্বাচিত সময়সীমা মেনে চলে।' : 'All files are generated server-side (UTF-8 BOM for Bangla Excel) and honor the selected period.'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'ROI_CHANNELS', label: isBn ? 'চ্যানেল ROI' : 'Channel ROI' },
                { key: 'ROI_CAMPAIGNS', label: isBn ? 'ক্যাম্পেইন ROI' : 'Campaign ROI' },
                { key: 'SPENDS', label: isBn ? 'স্পেন্ড লেজার' : 'Spend Ledger' },
                { key: 'ATTRIBUTIONS', label: isBn ? 'অ্যাট্রিবিউশন + ট্যাগড অর্ডার' : 'Attribution + tagged orders' },
                { key: 'MONTHLY', label: isBn ? 'মাসিক সারাংশ' : 'Monthly Summary' },
                { key: 'CHANNELS', label: isBn ? 'চ্যানেল রেজিস্ট্রি' : 'Channel Registry' },
              ].map((x) => (
                <button key={x.key} onClick={() => downloadCsv(x.key)} className="flex items-center justify-between gap-2 border border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-800 rounded-lg px-3 py-2.5 text-[11px] font-bold text-stone-700 dark:text-slate-300 transition-colors">
                  <span>{x.label}</span> <Download className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <h3 className="text-xs font-black text-stone-800 dark:text-slate-200 flex items-center gap-2">
              <PlugZap className="w-4 h-4 text-amber-600" /> {isBn ? 'API অটো-সিংক সংযোগকারী' : 'API Auto-Sync Connectors'}
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-[9px] font-black">{isBn ? 'FUTURE / ঐচ্ছিক' : 'FUTURE / OPTIONAL'}</span>
            </h3>
            <div className="space-y-2 mt-3">
              {connectors.map((c) => (
                <div key={c.id} className="border border-stone-200 dark:border-slate-800 rounded-lg p-3 flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 shrink-0"><Radio className="w-3.5 h-3.5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-stone-800 dark:text-slate-200">{isBn ? c.labelBn : c.label}</p>
                    <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-0.5 leading-relaxed">{isBn ? c.descriptionBn : c.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-[9px] font-black">{c.status}</span>
                    <span className="text-[8px] font-black text-stone-400 uppercase">{isBn ? 'ইমপ্লিমেন্টেড নয়' : 'Not implemented'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 mt-3 bg-stone-50 dark:bg-slate-800/50 border border-stone-200 dark:border-slate-800 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[10px] font-bold text-stone-600 dark:text-slate-300 leading-relaxed">{isBn ? syncNote?.noteBn : syncNote?.note}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODALS                                                                     */}
      {/* ========================================================================== */}

      {spendModal && (
        <ModalShell
          wide
          onClose={() => setSpendModal(null)}
          title={spendModal.mode === 'create'
            ? (isBn ? 'নতুন মার্কেটিং স্পেন্ড লগ (বুস্ট / অ্যাড / সেন্ড)' : 'Log Marketing Spend (Boost / Ad / Send)')
            : (isBn ? 'স্পেন্ড এন্ট্রি সংশোধন' : 'Amend Spend Entry')}
        >
          <form onSubmit={submitSpend} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label={isBn ? 'খরচের ধরন' : 'Entry Type'}>
                <select value={spendForm.entryType} onChange={(e) => setSpendForm({ ...spendForm, entryType: e.target.value as MarketingSpendType })} className={inputCls}>
                  <option value="BOOST">{isBn ? 'পেজ পোস্ট বুস্ট' : 'Post Boost'}</option>
                  <option value="AD">{isBn ? 'অ্যাড ক্যাম্পেইন' : 'Ad Campaign'}</option>
                  <option value="SEND">{isBn ? 'ব্রডকাস্ট/সেন্ড' : 'Broadcast Send'}</option>
                </select>
              </Field>
              <Field label={isBn ? 'চ্যানেল' : 'Channel'}>
                <select value={spendForm.channelId} onChange={(e) => setSpendForm({ ...spendForm, channelId: e.target.value })} className={inputCls} required>
                  <option value="">— {isBn ? 'নির্বাচন' : 'Select'} —</option>
                  {selectableChannels.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                </select>
              </Field>
              <Field label={isBn ? 'ক্যাম্পেইন লিংক (ঐচ্ছিক)' : 'Campaign Link (optional)'} hint={isBn ? 'Campaigns মডিউলের বিদ্যমান ক্যাম্পেইনের সাথে যুক্ত হবে' : 'Links to existing Campaigns module'}>
                <select value={spendForm.campaignId} onChange={(e) => setSpendForm({ ...spendForm, campaignId: e.target.value })} className={inputCls}>
                  <option value="">— {isBn ? 'লিংকবিহীন' : 'Unlinked'} —</option>
                  {campaigns.map((c) => <option key={c.id} value={c.id}>{isBn ? c.campaignNameBn : c.campaignName}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label={isBn ? 'শুরু (তারিখ)' : 'Period Start'}>
                <input type="date" value={spendForm.dateFrom} onChange={(e) => setSpendForm({ ...spendForm, dateFrom: e.target.value })} className={inputCls} required />
              </Field>
              <Field label={isBn ? 'শেষ (তারিখ)' : 'Period End'}>
                <input type="date" value={spendForm.dateTo} min={spendForm.dateFrom} onChange={(e) => setSpendForm({ ...spendForm, dateTo: e.target.value })} className={inputCls} required />
              </Field>
              <Field label={isBn ? 'পরিমাণ (BDT ৳)' : 'Amount (BDT ৳)'}>
                <input type="number" min="0.01" step="0.01" value={spendForm.amountBdt} onChange={(e) => setSpendForm({ ...spendForm, amountBdt: e.target.value })} className={inputCls} placeholder="2500" required />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label={isBn ? 'ইম্প্রেশন' : 'Impressions'}>
                <input type="number" min="0" step="1" value={spendForm.impressions} onChange={(e) => setSpendForm({ ...spendForm, impressions: e.target.value })} className={inputCls} placeholder="0" />
              </Field>
              <Field label={isBn ? 'ক্লিক' : 'Clicks'}>
                <input type="number" min="0" step="1" value={spendForm.clicks} onChange={(e) => setSpendForm({ ...spendForm, clicks: e.target.value })} className={inputCls} placeholder="0" />
              </Field>
              <Field label={isBn ? 'সেন্ড/কথোপকথন' : 'Sends/Conversations'}>
                <input type="number" min="0" step="1" value={spendForm.sends} onChange={(e) => setSpendForm({ ...spendForm, sends: e.target.value })} className={inputCls} placeholder="0" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="utm_source" hint={isBn ? 'ডেস্টিনেশন লিংকের UTM — অটো-ম্যাচিংকে সাহায্য করে' : 'Destination UTM — powers order auto-matching'}>
                <input type="text" value={spendForm.utmSource} onChange={(e) => setSpendForm({ ...spendForm, utmSource: e.target.value })} className={inputCls} placeholder="fb / ig / wa" />
              </Field>
              <Field label="utm_campaign">
                <input type="text" value={spendForm.utmCampaign} onChange={(e) => setSpendForm({ ...spendForm, utmCampaign: e.target.value })} className={inputCls} placeholder="eid_momo_2026" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={isBn ? 'নোট' : 'Notes'}>
                <textarea rows={2} value={spendForm.notes} onChange={(e) => setSpendForm({ ...spendForm, notes: e.target.value })} className={inputCls} placeholder={isBn ? 'যেমন: শুধু ঢাকা + চট্টগ্রাম অডিয়েন্স' : 'e.g. Dhaka + Ctg audience only'} />
              </Field>
              <Field label={isBn ? 'ফাইন্যান্স খরচ রেফারেন্স (ঐচ্ছিক, শুধু লিংক)' : 'Finance expense ref (optional, link only)'} hint={isBn ? 'যেমন exp-3 — ফাইন্যান্সে কিছুই লেখা হয় না, শুধু মিলানো হয়' : 'e.g. exp-3 — never writes to Finance, only cross-references'}>
                <input type="text" value={spendForm.financeExpenseRef} onChange={(e) => setSpendForm({ ...spendForm, financeExpenseRef: e.target.value })} className={inputCls} placeholder="exp-3" list="finance-expense-refs" />
                <datalist id="finance-expense-refs">
                  {(recon?.financeRows || []).map((f) => <option key={f.id} value={f.id}>{f.vendor} · ৳{f.amount} · {f.reference}</option>)}
                </datalist>
              </Field>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-slate-800">
              <button type="button" onClick={() => setSpendModal(null)} className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-xs">
                {saving ? (isBn ? 'সংরক্ষ হচ্ছে…' : 'Saving…') : (isBn ? 'লেজারে যোগ করুন' : 'Save to ledger')}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {voidTarget && (
        <ModalShell onClose={() => { setVoidTarget(null); setVoidReason(''); }} title={isBn ? 'স্পেন্ড এন্ট্রি বাতিল (VOID) করুন' : 'Void Spend Entry (history preserved)'}>
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg p-3 mb-3 text-[11px] font-mono text-stone-600 dark:text-slate-300">
            {voidTarget.dateFrom} → {voidTarget.dateTo} · {voidTarget.entryType} · {channelName(voidTarget.channelId)} · ৳{localeNum(voidTarget.amountBdt, isBn)}
          </div>
          <p className="text-[10px] font-semibold text-stone-500 dark:text-slate-400 mb-2">
            {isBn ? 'এন্ট্রি মোছে যায় না — শুধু হিসাব থেকে বাদ পড়ে; মূল রেকর্ড ও নতুন কারণ স্থায়ী ইতিহাসে থাকে।' : 'The entry is never deleted — only excluded from math; the original record and your reason stay in the immutable history.'}
          </p>
          <Field label={isBn ? 'বাতিলের কারণ (আবশ্যক)' : 'Void reason (required)'}>
            <textarea rows={3} value={voidReason} onChange={(e) => setVoidReason(e.target.value)} className={inputCls} placeholder={isBn ? 'যেমন: ভুল ইনপুট — পুনরায় ৳৩০০ এন্ট্রি দেওয়া হয়েছে' : 'e.g. duplicate entry, re-logged as ৳300'} />
          </Field>
          <div className="flex items-center justify-end gap-2 pt-3">
            <button onClick={() => { setVoidTarget(null); setVoidReason(''); }} className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg">{isBn ? 'ফিরে যান' : 'Keep it'}</button>
            <button onClick={submitVoid} disabled={saving || voidReason.trim().length < 3} className="px-5 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs">
              {isBn ? 'VOID চিহ্নিত করুন' : 'Mark as VOID'}
            </button>
          </div>
        </ModalShell>
      )}

      {historyTarget && (
        <ModalShell onClose={() => setHistoryTarget(null)} title={isBn ? 'সংশোধন ও স্ট্যাটাস ইতিহাস' : 'Amendment & Status History'}>
          <div className="space-y-2">
            {historyTarget.editHistory.length === 0 && historyTarget.status === 'ACTIVE' && (
              <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">{isBn ? 'কোনো সংশোধন হয়নি — এন্ট্রিটি মূল অবস্থায় আছে।' : 'No amendments recorded — entry is in its original state.'}</p>
            )}
            {historyTarget.editHistory.map((h, i) => (
              <div key={i} className="flex items-start gap-2 border border-stone-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900">
                <History className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-stone-800 dark:text-slate-200">{h.summary}</p>
                  <p className="text-[9px] font-mono text-stone-400">{fmt.date(h.editedAt)} · {h.editedBy}</p>
                </div>
              </div>
            ))}
            {historyTarget.status === 'VOID' && (
              <div className="flex items-start gap-2 border border-rose-200 dark:border-rose-900 rounded-lg p-2.5 bg-rose-50 dark:bg-rose-950/40">
                <Ban className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-black text-rose-800 dark:text-rose-300">{isBn ? 'VOID — হিসাব থেকে বাদ' : 'VOID — excluded from math'}</p>
                  <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-400">{historyTarget.voidReason}</p>
                  <p className="text-[9px] font-mono text-rose-500">{historyTarget.voidedAt ? fmt.date(historyTarget.voidedAt) : ''}</p>
                </div>
              </div>
            )}
            <div className="text-[10px] font-mono text-stone-400 pt-2 border-t border-stone-200 dark:border-slate-800">
              {isBn ? 'লগ হয়েছে' : 'Logged'}: {fmt.date(historyTarget.createdAt)} · {historyTarget.recordedBy} · {isBn ? 'হ্যাশ-চেইনড অডিট লগে সংরক্ষিত' : 'retained in chained audit log'}
            </div>
          </div>
        </ModalShell>
      )}

      {attrModal && (
        <ModalShell onClose={() => setAttrModal(false)} title={isBn ? 'রেভিনিউ/অর্ডার অ্যাট্রিবিউশন রেকর্ড' : 'Record Revenue / Order Attribution'}>
          <form onSubmit={submitAttribution} className="space-y-4">
            <p className="text-[10px] font-semibold text-stone-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-800/60 rounded-lg p-2.5 leading-relaxed">
              {isBn
                ? 'Ads Manager, WhatsApp বা Telegram-এ রিপোর্টকৃত বিক্রি এখানে লিখুন। অর্ডার নম্বর দিলে সার্ভার সেই অর্ডারকে অটো-গণনা থেকে বাদ দেবে (ডাবল-কাউন্টিং প্রতিরোধ)। রোজের অর্থ অ্যাট্রিবিউশন শুধু এই লেজারে যোগ হয় — অর্ডার/ফাইন্যান্স বদলায় না।'
                : 'Use this for sales reported in Ads Manager, WhatsApp or Telegram. Listing order numbers makes the server skip those orders in auto-counting (anti double-count). Attribution money lives only in this ledger — orders and finance are never altered.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={isBn ? 'চ্যানেল' : 'Channel'}>
                <select value={attrForm.channelId} onChange={(e) => setAttrForm({ ...attrForm, channelId: e.target.value })} className={inputCls} required>
                  <option value="">— {isBn ? 'নির্বাচন' : 'Select'} —</option>
                  {selectableChannels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label={isBn ? 'ক্যাম্পেইন (ঐচ্ছিক)' : 'Campaign (optional)'}>
                <select value={attrForm.campaignId} onChange={(e) => setAttrForm({ ...attrForm, campaignId: e.target.value })} className={inputCls}>
                  <option value="">— {isBn ? 'লিংকবিহীন' : 'Unlinked'} —</option>
                  {campaigns.map((c) => <option key={c.id} value={c.id}>{isBn ? c.campaignNameBn : c.campaignName}</option>)}
                </select>
              </Field>
              <Field label={isBn ? 'অ্যাট্রিবিউশন তারিখ' : 'Attribution Date'}>
                <input type="date" value={attrForm.date} onChange={(e) => setAttrForm({ ...attrForm, date: e.target.value })} className={inputCls} required />
              </Field>
              <Field label={isBn ? 'সোর্স' : 'Source'}>
                <select value={attrForm.source} onChange={(e) => setAttrForm({ ...attrForm, source: e.target.value as AttributionSourceType })} className={inputCls}>
                  <option value="UTM">UTM {isBn ? '(রিপোর্টভিত্তিক)' : 'report'}</option>
                  <option value="ADS_MANAGER">Ads Manager</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="TELEGRAM">Telegram</option>
                  <option value="MANUAL">{isBn ? 'ম্যানুয়াল' : 'Manual'}</option>
                </select>
              </Field>
              <Field label={isBn ? 'অ্যাট্রিবিউটেড রেভিনিউ (৳)' : 'Attributed Revenue (৳)'}>
                <input type="number" min="0" step="0.01" value={attrForm.attributedRevenueBdt} onChange={(e) => setAttrForm({ ...attrForm, attributedRevenueBdt: e.target.value })} className={inputCls} placeholder="8500" />
              </Field>
              <Field label={isBn ? 'অর্ডার সংখ্যা' : 'Attributed Orders'}>
                <input type="number" min="0" step="1" value={attrForm.attributedOrders} onChange={(e) => setAttrForm({ ...attrForm, attributedOrders: e.target.value })} className={inputCls} placeholder="3" />
              </Field>
            </div>
            <Field label={isBn ? 'অর্ডার নম্বর (কমা দিয়ে)' : 'Order numbers (comma separated)'} hint={isBn ? 'যেমন: KSH-2026-0886, KSH-2026-0887 — সার্ভার প্রতিটি যাচাই করে' : 'e.g. KSH-2026-0886, KSH-2026-0887 — each is verified server-side'}>
              <input type="text" value={attrForm.orderNumbers} onChange={(e) => setAttrForm({ ...attrForm, orderNumbers: e.target.value })} className={inputCls} />
            </Field>
            <Field label={isBn ? 'নোট' : 'Notes'}>
              <textarea rows={2} value={attrForm.notes} onChange={(e) => setAttrForm({ ...attrForm, notes: e.target.value })} className={inputCls} placeholder={isBn ? 'যেমন: Meta Ads Manager → Purchases কলাম, ২৯ আগস্ট' : 'e.g. Meta Ads Manager → Purchases column, Aug 29'} />
            </Field>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-slate-800">
              <button type="button" onClick={() => setAttrModal(false)} className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-xs">
                {saving ? '…' : (isBn ? 'রেকর্ড করুন' : 'Save attribution')}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {channelModal && (
        <ModalShell onClose={() => setChannelModal(null)} title={channelModal.mode === 'create' ? (isBn ? 'নতুন মার্কেটিং চ্যানেল নিবন্ধন' : 'Register Marketing Channel') : (isBn ? 'চ্যানেল সম্পাদনা' : 'Edit Channel')}>
          <form onSubmit={submitChannel} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={isBn ? 'প্ল্যাটফর্ম ধরন' : 'Platform Type'}>
                <select
                  value={channelForm.type}
                  onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value as AdChannelType })}
                  className={inputCls}
                  disabled={channelModal.mode === 'edit'}
                >
                  {(['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'TELEGRAM', 'OTHER'] as AdChannelType[]).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label={isBn ? 'স্ট্যাটাস (নিবন্ধনের সময়)' : 'Status (at registration)'}>
                <select value={channelForm.status} onChange={(e) => setChannelForm({ ...channelForm, status: e.target.value as AdChannelStatus })} className={inputCls} disabled={channelModal.mode === 'edit'}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </Field>
              <Field label={isBn ? 'চ্যানেলের নাম' : 'Channel Name'}>
                <input type="text" value={channelForm.name} onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })} className={inputCls} placeholder="Kisholoy Official Facebook Page" required />
              </Field>
              <Field label={isBn ? 'পেজ/চ্যানেল হ্যান্ডেল' : 'Page / Channel Handle'}>
                <input type="text" value={channelForm.handle} onChange={(e) => setChannelForm({ ...channelForm, handle: e.target.value })} className={inputCls} placeholder="kisholoy.bd বা +8801700000000" required />
              </Field>
              <Field label={isBn ? 'প্রোফাইল URL (ঐচ্ছিক)' : 'Profile URL (optional)'}>
                <input type="url" value={channelForm.pageUrl} onChange={(e) => setChannelForm({ ...channelForm, pageUrl: e.target.value })} className={inputCls} placeholder="https://facebook.com/kisholoy.bd" />
              </Field>
              <Field label={isBn ? 'অতিরিক্ত UTM অ্যালিয়াস (কমা দিয়ে)' : 'Extra UTM aliases (comma separated)'} hint={isBn ? 'যেই utm_source মানগুলো এই চ্যানেলে ম্যাপ হবে' : 'utm_source tokens that should map to this channel'}>
                <input type="text" value={channelForm.utmSourcePatterns} onChange={(e) => setChannelForm({ ...channelForm, utmSourcePatterns: e.target.value })} className={inputCls} placeholder="fb_page, reel_ads" />
              </Field>
            </div>
            <Field label={isBn ? 'নোট' : 'Notes'}>
              <textarea rows={2} value={channelForm.notes} onChange={(e) => setChannelForm({ ...channelForm, notes: e.target.value })} className={inputCls} placeholder={isBn ? 'যেমন: বুস্ট বাজেট সাপ্তাহিক, রবিবার রিসেট' : 'e.g. weekly boost budget, resets Sunday'} />
            </Field>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-slate-800">
              <button type="button" onClick={() => setChannelModal(null)} className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-xs">
                {saving ? '…' : (channelModal.mode === 'create' ? (isBn ? 'নিবন্ধন' : 'Register') : (isBn ? 'সংরক্ষণ' : 'Save'))}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {statusTarget && (
        <ModalShell onClose={() => setStatusTarget(null)} title={isBn ? 'চ্যানেল স্ট্যাটাস পরিবর্তন' : 'Change Channel Status'}>
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-lg p-3 mb-3 text-[11px]">
            <p className="font-black text-stone-800 dark:text-slate-200">{statusTarget.name}</p>
            <p className="font-mono text-stone-400 text-[10px]">@{statusTarget.handle} · {statusTarget.type}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            {(['ACTIVE', 'PAUSED', 'ARCHIVED'] as AdChannelStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => setStatusDraft({ ...statusDraft, status: st })}
                className={`py-2 rounded-lg text-[11px] font-black border transition-colors ${statusDraft.status === st
                  ? 'bg-stone-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                  : 'border-stone-300 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'}`}
              >
                {st}
              </button>
            ))}
          </div>
          <Field label={isBn ? 'কারণ / নোট (প্রস্তাবিত)' : 'Reason / note (recommended)'} hint={isBn ? 'ইতিহাস ট্র্যাকে স্থায়ীভাবে সংরক্ষিত হবে' : 'Persisted permanently in the status history trail'}>
            <textarea rows={2} value={statusDraft.note} onChange={(e) => setStatusDraft({ ...statusDraft, note: e.target.value })} className={inputCls} placeholder={isBn ? 'যেমন: ঈদ ক্যাম্পেইন শেষ — পরবর্তী ব্রিফিং পর্যন্ত বিরতি' : 'e.g. Eid flight ended — paused until next brief'} />
          </Field>
          <div className="flex items-center justify-between gap-2 pt-3">
            <p className="text-[9px] font-bold text-stone-400 dark:text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" />{isBn ? 'ARCHIVE মানে আড়াল, ডিলিট নয় — পুরোনো স্পেন্ড/রিপোর্ট অক্ষত থাকে' : 'ARCHIVE hides, never deletes — historical spends & reports remain intact'}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setStatusTarget(null)} className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg">{isBn ? 'ফিরে যান' : 'Cancel'}</button>
              <button onClick={submitChannelStatus} disabled={saving} className="px-5 py-2 bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-xs">
                {saving ? '…' : (isBn ? 'স্ট্যাটাস প্রয়োগ' : 'Apply status')}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
