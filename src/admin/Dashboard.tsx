import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ShoppingCart, Receipt, Wallet, Package, DollarSign, Users,
  Repeat, Award, AlertTriangle, Banknote, RotateCcw, Ticket, Truck,
  BarChart3, MapPin, PieChart, Filter, Calendar, ArrowRight, Sparkles,
  Layers, Landmark, Tag, PackagePlus, ChevronRight, ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ADMIN_SECTIONS_DATA } from './adminModulesData';
import {
  Order, CategoryMetric, DistrictMetric, CustomerCohortMetric,
  CourierPerformanceMetric, SalesTrendPoint, FinancialPnLReport, InventoryVelocityMetric,
} from '../types';

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

interface KpiReport {
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
}

interface DashboardReport {
  kpis: KpiReport;
  categoryMetrics: CategoryMetric[];
  districtMetrics: DistrictMetric[];
  customerCohorts: CustomerCohortMetric;
  courierPerformance: CourierPerformanceMetric[];
  salesTrend: SalesTrendPoint[];
  financialPnl: FinancialPnLReport;
  inventoryVelocityMetrics: InventoryVelocityMetric[];
}

type RangeKey = 'TODAY' | '7D' | '30D' | '90D' | 'YTD' | 'ALL' | 'CUSTOM';

const RANGE_OPTIONS: { key: RangeKey; label: string; labelBn: string }[] = [
  { key: 'TODAY', label: 'Today', labelBn: 'আজ' },
  { key: '7D', label: '7 Days', labelBn: '৭ দিন' },
  { key: '30D', label: '30 Days', labelBn: '৩০ দিন' },
  { key: '90D', label: '90 Days', labelBn: '৯০ দিন' },
  { key: 'YTD', label: 'Year', labelBn: 'বছর' },
  { key: 'ALL', label: 'All Time', labelBn: 'সবকিছু' },
  { key: 'CUSTOM', label: 'Custom', labelBn: 'কাস্টম' },
];

const fmtN = (n: number | undefined): string => (n ?? 0).toLocaleString();
const fmtMoney = (n: number | undefined): string => `৳ ${Math.round(n ?? 0).toLocaleString()}`;
const fmtPct = (n: number | undefined): string => `${(n ?? 0).toFixed(1)}%`;

function filterOrdersByRange(orders: Order[], range: RangeKey, from?: string, to?: string): Order[] {
  if (!from && !to && (range === 'ALL' || !range)) return orders;
  const now = new Date();
  let start: Date | null = null;
  if (from && to) {
    const f = new Date(from);
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    return orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= f && d <= t;
    });
  }
  switch (range) {
    case 'TODAY':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7D':
      start = new Date(now.getTime() - 7 * 864e5);
      break;
    case '30D':
      start = new Date(now.getTime() - 30 * 864e5);
      break;
    case '90D':
      start = new Date(now.getTime() - 90 * 864e5);
      break;
    case 'YTD':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return orders;
  }
  if (!start) return orders;
  return orders.filter((o) => new Date(o.createdAt) >= (start as Date));
}

function dayLabel(d: string): string {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return d;
  }
}

/* ------------------------------------------------------------------ */
/* Presentational helpers                                              */
/* ------------------------------------------------------------------ */

function KpiCard(props: {
  id: string;
  label: string;
  labelBn: string;
  icon: React.ReactNode;
  value: string;
  sub: React.ReactNode;
  tone: 'teal' | 'stone' | 'amber' | 'emerald' | 'rose' | 'sky' | 'indigo' | 'vio';
  link?: string;
  linkText?: string;
  isBn: boolean;
}) {
  const { id, label, labelBn, icon, value, sub, tone, link, linkText, isBn } = props;
  const toneMap: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-900 border-teal-100 dark:bg-teal-500/15 dark:text-teal-200 dark:border-teal-500/30',
    stone: 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-500/20 dark:text-stone-200 dark:border-stone-500/30',
    amber: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30',
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30',
    rose: 'bg-rose-50 text-rose-900 border-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-500/30',
    sky: 'bg-sky-50 text-sky-900 border-sky-100 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-500/30',
    indigo: 'bg-indigo-50 text-indigo-900 border-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-500/30',
    vio: 'bg-violet-50 text-violet-900 border-violet-100 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/30',
  };
  return (
    <div
      id={id}
      className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-slate-700 shadow-xs hover:shadow-sm hover:border-teal-300 dark:hover:border-teal-500/50 transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between text-stone-500 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 pr-1">
            {isBn ? labelBn : label}
          </span>
          <div className={`p-2 rounded-xl border ${toneMap[tone]}`}>{icon}</div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-slate-100 font-mono tracking-tight truncate">{value}</div>
      </div>
      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-700 flex items-center gap-2 text-[11px] text-stone-500 dark:text-slate-400">
        {sub}
        {link && (
          <Link to={link} className="ml-auto font-bold text-teal-900 hover:text-teal-950 hover:underline inline-flex items-center gap-0.5 shrink-0">
            {linkText ?? (isBn ? 'দেখুন' : 'View')}
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

function SectionHeader(props: {
  title: string;
  titleBn: string;
  icon: React.ReactNode;
  hint?: string;
  link?: string;
  linkText?: string;
  isBn: boolean;
}) {
  const { title, titleBn, icon, hint, link, linkText, isBn } = props;
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-teal-50 text-teal-900 border border-teal-100 dark:bg-teal-500/15 dark:text-teal-200 dark:border-teal-500/30">{icon}</div>
        <div>
          <h2 className="text-sm font-serif font-black text-stone-900 dark:text-slate-100">{isBn ? titleBn : title}</h2>
          {hint && <p className="text-[11px] text-stone-500 dark:text-slate-400">{hint}</p>}
        </div>
      </div>
      {link && (
        <Link to={link} className="inline-flex items-center gap-1 text-xs font-bold text-teal-900 hover:text-teal-950 hover:underline shrink-0">
          {linkText ?? (isBn ? 'পূর্ণ রিপোর্ট' : 'Full Report')}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function MiniBar(props: { label: string; value: number; display: string; max: number; tone: string; key?: string | number }) {
  const { label, value, display, max, tone } = props;
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between text-xs mb-1 gap-2">
        <span className="font-semibold text-stone-700 dark:text-slate-300 truncate flex-1 min-w-0">{label}</span>
        <span className="font-mono font-bold text-stone-800 dark:text-slate-200 shrink-0">{display}</span>
      </div>
      <div className="h-1.5 rounded-full bg-stone-100 dark:bg-slate-700/60 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export function Dashboard() {
  const {
    orders, products, expenses, returnRequests,
    updateOrderStatus, dispatchCourier, language,
  } = useApp();
  const isBn = language === 'BN';

  const [range, setRange] = useState<RangeKey>('ALL');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; companyName: string; totalDue: number }[]>([]);
  const [supplierLoadFailed, setSupplierLoadFailed] = useState(false);
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');

  // Fetch server analytics report (range-aware)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        let url = `/api/reports/analytics?range=${range}`;
        if (range === 'CUSTOM' && customFrom && customTo) url += `&from=${customFrom}&to=${customTo}`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          setReport({
            kpis: data.kpis,
            categoryMetrics: data.categoryMetrics || [],
            districtMetrics: data.districtMetrics || [],
            customerCohorts: data.customerCohorts,
            courierPerformance: data.courierPerformance || [],
            salesTrend: data.salesTrend || [],
            financialPnl: data.financialPnl,
            inventoryVelocityMetrics: data.inventoryVelocityMetrics || [],
          });
        }
      } catch (e) {
        console.error('Failed to load dashboard analytics', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [range, customFrom, customTo, orders.length]);

  // Vendor payable (all suppliers outstanding) + vendor name map
  useEffect(() => {
    let cancelled = false;
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list = (d?.suppliers || []).map((s: any) => ({
          id: s.id,
          companyName: s.companyName || s.code || 'Vendor',
          totalDue: Number(s.totalDue) || 0,
        }));
        setSuppliers(list);
        setSupplierLoadFailed(false);
      })
      .catch(() => {
        // The supplier-dues tile would otherwise read a confident 0 when the
        // request failed, understating what the business owes (F-305).
        if (!cancelled) setSupplierLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [orders.length]);

  const suppliersDue = useMemo(() => suppliers.reduce((s, x) => s + x.totalDue, 0), [suppliers]);

  const filteredOrders = useMemo(
    () => filterOrdersByRange(orders, range, customFrom, customTo),
    [orders, range, customFrom, customTo]
  );

  /* ------- Client-side aggregates (range-aware) ------- */
  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; revenue: number; units: number; sku: string }>();
    filteredOrders.forEach((o) =>
      o.items.forEach((it) => {
        const cur = map.get(it.productId || it.sku) || { title: it.title, revenue: 0, units: 0, sku: it.sku };
        cur.revenue += it.price * it.quantity;
        cur.units += it.quantity;
        map.set(it.productId || it.sku, cur);
      })
    );
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [filteredOrders]);

  const profitByProduct = useMemo(() => {
    const map = new Map<string, { title: string; profit: number; revenue: number; sku: string }>();
    filteredOrders.forEach((o) =>
      o.items.forEach((it) => {
        const p = products.find((x) => x.id === it.productId || x.sku === it.sku);
        const cost = p?.costPrice ?? it.price * 0.62;
        const cur = map.get(it.productId || it.sku) || { title: it.title, profit: 0, revenue: 0, sku: it.sku };
        cur.profit += (it.price - cost) * it.quantity;
        cur.revenue += it.price * it.quantity;
        map.set(it.productId || it.sku, cur);
      })
    );
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit).slice(0, 6);
  }, [filteredOrders, products]);

  const profitByVendor = useMemo(() => {
    const map = new Map<string, { name: string; profit: number; revenue: number }>();
    filteredOrders.forEach((o) =>
      o.items.forEach((it) => {
        const p = products.find((x) => x.id === it.productId || x.sku === it.sku);
        if (!p) return;
        const cost = p.costPrice ?? it.price * 0.62;
        const vendorId = p.supplierId || 'UNASSIGNED';
        const vendorName = suppliers.find((s) => s.id === vendorId)?.companyName || (vendorId === 'UNASSIGNED' ? (isBn ? 'অনির্ধারিত' : 'Unassigned') : 'Vendor');
        const cur = map.get(vendorId) || { name: vendorName, profit: 0, revenue: 0 };
        cur.profit += (it.price - cost) * it.quantity;
        cur.revenue += it.price * it.quantity;
        map.set(vendorId, cur);
      })
    );
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit).slice(0, 6);
  }, [filteredOrders, products, suppliers, isBn]);

  const salesBySource = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach((o) => {
      const ch = o.orderSource || o.channelDetails?.channel || 'WEB';
      map.set(ch, (map.get(ch) || 0) + o.total);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredOrders]);

  const inHouseVsPartner = useMemo(() => {
    const partner = new Set(['WHATSAPP', 'MESSENGER', 'FACEBOOK', 'INSTAGRAM']);
    let inHouse = 0;
    let partnerAmt = 0;
    filteredOrders.forEach((o) => {
      const ch = o.orderSource || o.channelDetails?.channel || 'WEB';
      if (partner.has(ch)) partnerAmt += o.total;
      else inHouse += o.total;
    });
    return { inHouse, partner: partnerAmt };
  }, [filteredOrders]);

  const returnReasons = useMemo(() => {
    const map = new Map<string, number>();
    (returnRequests || []).forEach((r) =>
      (r.items || []).forEach((it) => {
        const key = it.reason || 'OTHER';
        map.set(key, (map.get(key) || 0) + 1);
      })
    );
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [returnRequests]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    (expenses || []).forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const couponOrders = useMemo(() => filteredOrders.filter((o) => o.appliedCouponCode).length, [filteredOrders]);
  const lowStock = useMemo(() => products.filter((p) => p.stock <= (p.lowStockThreshold ?? 5)).length, [products]);
  const pendingOrders = filteredOrders.filter((o) => o.orderStatus === 'PENDING').length;
  const readyToShip = filteredOrders.filter((o) => o.orderStatus === 'READY_TO_SHIP' || o.orderStatus === 'PROCESSING').length;

  const k = report?.kpis;
  const repeatRate = report?.customerCohorts?.repeatPurchaseRate;
  const totalOrders = k?.totalOrders ?? filteredOrders.length;
  const totalRevenue = k?.grossRevenue ?? filteredOrders.reduce((s, o) => s + o.total, 0);
  const netRevenue = k?.netSales ?? totalRevenue;
  const aov = k?.aov ?? (totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0);
  const grossProfit = k?.grossProfit ?? 0;
  const netProfit = k?.netOperatingProfit ?? 0;
  const deliveryRate = k?.overallDeliverySuccessRate ?? 0;
  const topProductsLead = topProducts[0];
  const topCategory = (report?.categoryMetrics || []).slice().sort((a, b) => b.grossSales - a.grossSales)[0];

  const maxCategory = Math.max(1, ...(report?.categoryMetrics || []).map((c) => c.grossSales));
  const maxDistrict = Math.max(1, ...(report?.districtMetrics || []).map((d) => d.revenue));
  const maxTrend = Math.max(1, ...(report?.salesTrend || []).map((t) => t.revenue));
  const maxCourier = Math.max(1, ...(report?.courierPerformance || []).map((c) => c.successRate));
  const maxProduct = Math.max(1, ...topProducts.map((p) => p.revenue));
  const maxProfit = Math.max(1, ...profitByProduct.map((p) => p.profit));
  const maxVendorProfit = Math.max(1, ...profitByVendor.map((p) => p.profit));
  const maxExpense = Math.max(1, ...expenseByCategory.map(([, v]) => v));
  const maxReturn = Math.max(1, ...returnReasons.map(([, v]) => v));
  const maxSource = Math.max(1, ...salesBySource.map(([, v]) => v));

  /* ---------------- Render ---------------- */
  return (
    <div id="admin-dashboard-container" role="region" aria-label="Dashboard overview" className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div id="dashboard-header-banner" className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-teal-50 text-teal-950 border border-teal-200 shadow-2xs">
              {isBn ? 'বিজনেস কন্ট্রোল সেন্টার' : 'BUSINESS CONTROL CENTER'}
            </span>
            <span className="text-xs text-stone-400 font-mono font-medium">{isBn ? 'লাইভ অ্যানালিটিক্স' : 'LIVE BUSINESS ANALYTICS'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-stone-900 tracking-tight">
            {isBn ? 'বাণিজ্য ও অপারেশনস ড্যাশবোর্ড' : 'Commerce & Operations Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
            {isBn
              ? 'বিক্রয়, মুনাফা, গ্রাহক, ফুলফিলমেন্ট ও আর্থিক সূচকের এক নজরে সংযুক্ত ভিউ।'
              : 'Unified view of sales, profit, customer, fulfillment and financial metrics.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link to="/admin/orders" id="dashboard-goto-orders-btn" className="px-4 py-2.5 bg-teal-900 hover:bg-teal-950 text-white rounded-2xl text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-teal-300" />
            <span>{isBn ? `ফুলফিলমেন্ট কিউ (${pendingOrders + readyToShip})` : `Fulfillment Queue (${pendingOrders + readyToShip})`}</span>
          </Link>
          <Link to="/admin/reports" className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-300" />
            <span>{isBn ? 'রিপোর্ট' : 'Reports'}</span>
          </Link>
        </div>
      </div>

      {/* Range Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-stone-500">
          <Filter className="w-4 h-4 text-teal-800" />
          <span className="text-xs font-bold uppercase tracking-wider">{isBn ? 'রিপোর্ট সময়সীমা' : 'Report Period'}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setRange(o.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                range === o.key
                  ? 'bg-teal-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {isBn ? o.labelBn : o.label}
            </button>
          ))}
        </div>
        {range === 'CUSTOM' && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-stone-400" />
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="border border-stone-300 rounded-lg px-2 py-1.5 bg-white text-stone-800" />
            <span className="text-stone-400">–</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="border border-stone-300 rounded-lg px-2 py-1.5 bg-white text-stone-800" />
          </div>
        )}
      </div>

      {/* KPI Grid (14) */}
      <section id="dashboard-kpi-section" className="space-y-4">
        <SectionHeader title="Key Performance Indicators" titleBn="মূল কর্মসম্পাদন সূচক" icon={<Sparkles className="w-4 h-4" />} isBn={isBn} />
        <div id="dashboard-kpi-grid" className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard id="kpi-total-revenue" label="Total Revenue" labelBn="মোট বিক্রয়" isBn={isBn} tone="teal" icon={<DollarSign className="w-4 h-4" />} value={fmtMoney(totalRevenue)}
            sub={<span className="text-emerald-700 font-bold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{fmtMoney(totalRevenue)}</span>} link="/admin/reports" />
          <KpiCard id="kpi-net-revenue" label="Net Revenue" labelBn="নিট বিক্রয়" isBn={isBn} tone="emerald" icon={<Wallet className="w-4 h-4" />} value={fmtMoney(netRevenue)}
            sub={<span className="text-stone-500">{isBn ? 'ছাড়/রিফান্ড বাদে' : 'After discounts & refunds'} • {fmtPct(k?.netMarginPct)}</span>} link="/admin/reports" />
          <KpiCard id="kpi-total-orders" label="Total Orders" labelBn="অর্ডার সংখ্যা" isBn={isBn} tone="sky" icon={<ShoppingCart className="w-4 h-4" />} value={fmtN(totalOrders)}
            sub={<span className="text-stone-500">{pendingOrders} {isBn ? 'পেন্ডিং' : 'pending'} • {filteredOrders.length} {isBn ? 'এই সময়ে' : 'in period'}</span>} link="/admin/orders" />
          <KpiCard id="kpi-aov" label="Avg Order Value" labelBn="গড় অর্ডার মূল্য" isBn={isBn} tone="indigo" icon={<Receipt className="w-4 h-4" />} value={fmtMoney(aov)}
            sub={<span className="text-stone-500">{fmtN(k?.avgBasketSize)} {isBn ? 'আইটেম/অর্ডার' : 'items / order'}</span>} link="/admin/orders" />
          <KpiCard id="kpi-gross-profit" label="Gross Profit" labelBn="সরাসরি মার্জিন" isBn={isBn} tone="emerald" icon={<Package className="w-4 h-4" />} value={fmtMoney(grossProfit)}
            sub={<span className="text-stone-500">{fmtPct(k?.grossMarginPct)} {isBn ? 'মার্জিন' : 'margin'}</span>} link="/admin/reports" />
          <KpiCard id="kpi-net-profit" label="Net Profit" labelBn="নিট মুনাফা" isBn={isBn} tone="vio" icon={<TrendingUp className="w-4 h-4" />} value={fmtMoney(netProfit)}
            sub={<span className="text-stone-500">{fmtPct(k?.netMarginPct)} {isBn ? 'মার্জিন' : 'margin'}</span>} link="/admin/finance" />
          <KpiCard id="kpi-repeat" label="Repeat Customer Rate" labelBn="পুনঃক্রয় হার" isBn={isBn} tone="sky" icon={<Repeat className="w-4 h-4" />} value={fmtPct(repeatRate)}
            sub={<span className="text-stone-500">{fmtN(report?.customerCohorts?.repeatCustomerCount)} {isBn ? 'পুনঃক্রয়কারী' : 'repeat buyers'}</span>} link="/admin/customers" />
          <KpiCard id="kpi-top-products" label="Top Products" labelBn="সেরা বিক্রিত পণ্য" isBn={isBn} tone="amber" icon={<Award className="w-4 h-4" />}
            value={topProductsLead ? topProductsLead.title.substring(0, 26) : '—'}
            sub={<span className="text-stone-500">{topProductsLead ? fmtMoney(topProductsLead.revenue) : isBn ? 'কোনো ডেটা নেই' : 'No data'}</span>} link="/admin/products" />
          <KpiCard id="kpi-top-categories" label="Top Categories" labelBn="সেরা ক্যাটাগরি" isBn={isBn} tone="teal" icon={<Tag className="w-4 h-4" />}
            value={topCategory ? (isBn ? topCategory.categoryNameBn : topCategory.categoryName) : '—'}
            sub={<span className="text-stone-500">{topCategory ? fmtN(topCategory.unitsSold) + ' ' + (isBn ? 'একক' : 'units') : '—'}</span>} link="/admin/categories" />
          <KpiCard id="kpi-lowstock" label="Low Stock" labelBn="পুনঃক্রয় সতর্কতা" isBn={isBn} tone="rose" icon={<AlertTriangle className="w-4 h-4" />} value={fmtN(lowStock)}
            sub={<span className={lowStock > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>{lowStock > 0 ? (isBn ? 'রি-অর্ডার প্রয়োজন' : 'Restock needed') : (isBn ? 'স্টক সুস্থ' : 'Stock healthy')}</span>} link="/admin/inventory" />
          <KpiCard id="kpi-vendor-payable" label="Vendor Payable" labelBn="উদ্যোক্তাদের পাওনা" isBn={isBn} tone="rose" icon={<Banknote className="w-4 h-4" />} value={supplierLoadFailed ? '—' : fmtMoney(suppliersDue)}
            sub={<span className={supplierLoadFailed ? 'text-amber-700' : 'text-stone-500'}>
              {supplierLoadFailed
                ? (isBn ? 'লোড করা যায়নি' : 'Could not load')
                : (isBn ? 'সাপ্লায়ার ডিউ' : 'Supplier outstanding')}
            </span>} link="/admin/suppliers" />
          <KpiCard id="kpi-return-rate" label="Return Rate" labelBn="ফেরতের হার" isBn={isBn} tone="rose" icon={<RotateCcw className="w-4 h-4" />} value={fmtPct(totalOrders > 0 ? (returnRequests.length / totalOrders) * 100 : 0)}
            sub={<span className="text-stone-500">{fmtN(returnRequests.length)} {isBn ? 'রিটার্ন' : 'returns'}</span>} link="/admin/returns" />
          <KpiCard id="kpi-coupon" label="Coupon Usage" labelBn="কুপনের ব্যবহার" isBn={isBn} tone="indigo" icon={<Ticket className="w-4 h-4" />} value={fmtN(couponOrders)}
            sub={<span className="text-stone-500">{totalOrders > 0 ? fmtPct((couponOrders / totalOrders) * 100) : '0%'} {isBn ? 'অর্ডারে' : 'of orders'}</span>} link="/admin/promotions" />
          <KpiCard id="kpi-delivery-rate" label="Delivery Success Rate" labelBn="ডেলিভারি সফলতার হার" isBn={isBn} tone="emerald" icon={<Truck className="w-4 h-4" />} value={fmtPct(deliveryRate)}
            sub={<span className="text-stone-500">{isBn ? 'RTO' : 'RTO'} {fmtPct(k?.rtoRate)}</span>} link="/admin/shipments" />
        </div>
      </section>

      {/* Sales Trend */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
        <SectionHeader title="Sales Trend" titleBn="বিক্রয় প্রবণতা" icon={<BarChart3 className="w-4 h-4" />} hint={isBn ? 'সময়ের সাথে বিক্রয় ও মুনাফা' : 'Revenue & profit over time'} link="/admin/reports" linkText={isBn ? 'বিস্তারিত' : 'Detail'} isBn={isBn} />
        {report?.salesTrend?.length ? (
          <div className="space-y-2">
            {(report.salesTrend).map((t) => (
              <MiniBar key={t.date} label={dayLabel(t.date)} value={t.revenue} display={fmtMoney(t.revenue)} max={maxTrend} tone="bg-teal-700" />
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400">{isBn ? 'এই সময়সীমার জন্য কোনো ডেটা নেই' : 'No data for this period'}</p>
        )}
      </section>

      {/* Two-column analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Sales by Category" titleBn="ক্যাটাগরি অনুযায়ী বিক্রয়" icon={<Tag className="w-4 h-4" />} link="/admin/categories" linkText={isBn ? 'ক্যাটাগরি' : 'Categories'} isBn={isBn} />
          {(report?.categoryMetrics || []).length ? (
            report!.categoryMetrics.slice().sort((a, b) => b.grossSales - a.grossSales).slice(0, 6).map((c) => (
              <MiniBar key={c.categoryId} label={isBn ? c.categoryNameBn : c.categoryName} value={c.grossSales} display={fmtMoney(c.grossSales)} max={maxCategory} tone="bg-teal-700" />
            ))
          ) : (
            <p className="text-xs text-stone-400">{isBn ? 'কোনো ডেটা নেই' : 'No data'}</p>
          )}
        </section>

        {/* Sales by Source */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Sales by Source" titleBn="উৎস অনুযায়ী বিক্রয়" icon={<Layers className="w-4 h-4" />} link="/admin/orders" linkText={isBn ? 'অর্ডার' : 'Orders'} isBn={isBn} />
          {salesBySource.length ? (
            salesBySource.slice(0, 6).map(([src, amt]) => (
              <MiniBar key={src} label={src.replace('_', ' ')} value={amt} display={fmtMoney(amt)} max={maxSource} tone="bg-indigo-700" />
            ))
          ) : (
            <p className="text-xs text-stone-400">{isBn ? 'কোনো ডেটা নেই' : 'No data'}</p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Top Products" titleBn="সেরা বিক্রিত পণ্য" icon={<Award className="w-4 h-4" />} link="/admin/products" linkText={isBn ? 'পণ্য' : 'Products'} isBn={isBn} />
          {topProducts.length ? (
            topProducts.map((p) => (
              <MiniBar key={p.sku} label={p.title.substring(0, 30)} value={p.revenue} display={`${fmtMoney(p.revenue)} • ${p.units}u`} max={maxProduct} tone="bg-amber-700" />
            ))
          ) : (
            <p className="text-xs text-stone-400">{isBn ? 'কোনো ডেটা নেই' : 'No data'}</p>
          )}
        </section>

        {/* Sales by District */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Sales by District" titleBn="জেলা অনুযায়ী বিক্রয়" icon={<MapPin className="w-4 h-4" />} link="/admin/reports" linkText={isBn ? 'রিপোর্ট' : 'Report'} isBn={isBn} />
          {(report?.districtMetrics || []).length ? (
            report!.districtMetrics.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 6).map((d) => (
              <MiniBar key={d.district} label={d.district} value={d.revenue} display={`${fmtMoney(d.revenue)} • ${d.orderCount}o`} max={maxDistrict} tone="bg-sky-700" />
            ))
          ) : (
            <p className="text-xs text-stone-400">{isBn ? 'কোনো ডেটা নেই' : 'No data'}</p>
          )}
        </section>
      </div>

      {/* Customer + Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repeat purchase / cohorts */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Customer Cohorts" titleBn="গ্রাহক কোহোর্ট" icon={<Users className="w-4 h-4" />} link="/admin/customers" linkText={isBn ? 'গ্রাহক' : 'Customers'} isBn={isBn} />
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Metric label={isBn ? 'মোট গ্রাহক' : 'Total Customers'} value={fmtN(report?.customerCohorts?.totalCustomers)} />
            <Metric label={isBn ? 'পুনঃক্রয় হার' : 'Repeat Rate'} value={fmtPct(report?.customerCohorts?.repeatPurchaseRate)} />
            <Metric label={isBn ? 'প্রথমবার' : 'First-time'} value={fmtN(report?.customerCohorts?.firstTimeCount)} />
            <Metric label={isBn ? 'গড় LTV' : 'Avg LTV'} value={fmtMoney(report?.customerCohorts?.avgCustomerLtv)} />
          </div>
        </section>

        {/* Payment mix */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Cash vs Digital" titleBn="ক্যাশ বনাম ডিজিটাল" icon={<PieChart className="w-4 h-4" />} link="/admin/payments" linkText={isBn ? 'পেমেন্ট' : 'Payments'} isBn={isBn} />
          <DonutMix online={k?.onlineSharePct ?? 0} cod={k?.codSharePct ?? 0} isBn={isBn} />
        </section>

        {/* Delivery performance */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Delivery Performance" titleBn="ডেলিভারি কর্মক্ষমতা" icon={<Truck className="w-4 h-4" />} link="/admin/shipments" linkText={isBn ? 'শিপমেন্ট' : 'Shipments'} isBn={isBn} />
          {(report?.courierPerformance || []).length ? (
            report!.courierPerformance.slice().sort((a, b) => b.successRate - a.successRate).slice(0, 5).map((c) => (
              <MiniBar key={c.provider} label={c.provider} value={c.successRate} display={`${fmtPct(c.successRate)} • ${c.deliveredCount}/${c.bookedCount}`} max={maxCourier} tone="bg-emerald-700" />
            ))
          ) : (
            <p className="text-xs text-stone-400">{isBn ? 'কোনো ডেটা নেই' : 'No data'}</p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* In-house vs Partner */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="In-house vs Partner" titleBn="নিজস্ব বনাম পার্টনার" icon={<Landmark className="w-4 h-4" />} link="/admin/orders" linkText={isBn ? 'অর্ডার' : 'Orders'} isBn={isBn} />
          <DonutMix online={inHouseVsPartner.partner} cod={inHouseVsPartner.inHouse} labelA="Partner" labelBnA="পার্টনার" labelB="In-house" labelBnB="নিজস্ব" isBn={isBn} />
          <div className="grid grid-cols-2 gap-3 text-xs mt-2">
            <Metric label={isBn ? 'নিজস্ব বিক্রয়' : 'In-house'} value={fmtMoney(inHouseVsPartner.inHouse)} />
            <Metric label={isBn ? 'পার্টনার বিক্রয়' : 'Partner'} value={fmtMoney(inHouseVsPartner.partner)} />
 arena/01a06c02-kisholoy-bd
          </div>
        </section>
      </div>

      {/* SECTION DIRECTORY & WORK BREAKDOWN */}
      <section id="work-directory-section" className="space-y-6">
        <div className="bg-white dark:bg-stone-950 text-stone-900 dark:text-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 dark:border-stone-850 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-50 dark:bg-teal-500/20 text-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                {isBn ? 'অপারেশনাল ডিরেক্টরি' : 'OPERATIONAL WORK DESKS'}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">23 Connected Desks</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-white tracking-tight">
              {isBn 
                ? 'এডমিন সেকশন ও কাজের পূর্ণ বিবরণী' 
                : 'Admin Workspaces & Operational Matrix'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-2xl leading-relaxed">
              {isBn
                ? 'প্রতিটি বিভাগের সুনির্দিষ্ট কাজের পরিধি, দায়িত্ব এবং সরাসরি কাজ শুরু করার জন্য পাশে দেয়া বাটন ব্যবহার করুন।'
                : 'Full architectural breakdown of operational responsibilities and direct 1-click workspace entry buttons.'}
            </p>
          </div>

          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="filter-sec-all"
              onClick={() => setActiveSectionFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                activeSectionFilter === 'all'
                  ? 'bg-teal-900 text-white dark:bg-teal-400 dark:text-stone-950 font-black shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-850 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-800'
              }`}
            >
              {isBn ? 'সকল সেকশন (২৩)' : 'All Desks (23)'}
            </button>
            {ADMIN_SECTIONS_DATA.map(sec => (
              <button
                key={sec.id}
                id={`filter-sec-${sec.id}`}
                onClick={() => setActiveSectionFilter(sec.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                  activeSectionFilter === sec.id
                    ? 'bg-teal-900 text-white dark:bg-teal-400 dark:text-stone-950 font-black shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-850 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-800'
                }`}
              >
                {isBn ? sec.titleBn : sec.title} ({sec.items.length})
              </button>
            ))}
main
          </div>
        </div>

        {/* Directory cards: operational desks, filtered by the section pills */}
        <div className="space-y-4">
          {ADMIN_SECTIONS_DATA.filter((sec) => activeSectionFilter === 'all' || sec.id === activeSectionFilter).map((sec) => (
            <div key={`dash-sec-${sec.id}`} className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-sm font-black text-stone-900 dark:text-slate-100">{isBn ? sec.titleBn : sec.title}</h3>
                <span className="text-[10px] font-mono font-bold text-stone-400 dark:text-slate-500">{sec.items.length} {isBn ? 'ডেস্ক' : 'desks'}</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 mb-3 max-w-3xl leading-relaxed">{isBn ? sec.summaryBn : sec.summary}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {sec.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      id={`dash-desk-${item.id}`}
                      to={item.path}
                      className="group border border-stone-200 dark:border-slate-700 rounded-2xl p-3.5 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-sm transition-all bg-stone-50/60 dark:bg-slate-900/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-1.5 rounded-lg bg-teal-900/5 text-teal-800 dark:bg-teal-400/10 dark:text-teal-300 border border-teal-200/60 dark:border-teal-700/40">
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-stone-300 dark:text-slate-600 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors" />
                      </div>
                      <p className="text-xs font-black text-stone-900 dark:text-slate-100 mt-2">{isBn ? item.labelBn : item.label}</p>
                      <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-0.5 line-clamp-2">{isBn ? item.taglineBn : item.tagline}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit by product */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Profit by Product" titleBn="পণ্য অনুযায়ী মুনাফা" icon={<Package className="w-4 h-4" />} link="/admin/products" linkText={isBn ? 'পণ্য' : 'Products'} isBn={isBn} />
          {profitByProduct.length ? (
            profitByProduct.map((p) => (
              <MiniBar key={p.sku} label={p.title.substring(0, 30)} value={p.profit} display={fmtMoney(p.profit)} max={maxProfit} tone="bg-violet-700" />
            ))
          ) : (
            <p className="text-xs text-stone-400">{isBn ? 'কোনো ডেটা নেই' : 'No data'}</p>
          )}
        </section>

        {/* Expense by category */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Expense by Category" titleBn="খরচের ধরন অনুযায়ী" icon={<Banknote className="w-4 h-4" />} link="/admin/finance" linkText={isBn ? 'আর্থিক' : 'Finance'} isBn={isBn} />
          {expenseByCategory.length ? (
            expenseByCategory.slice(0, 6).map(([cat, amt]) => (
              <MiniBar key={cat} label={cat.replace('_', ' ')} value={amt} display={fmtMoney(amt)} max={maxExpense} tone="bg-stone-700" />
            ))
          ) : (
            <p className="text-xs text-stone-400">{isBn ? 'কোনো ডেটা নেই' : 'No data'}</p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Return reasons */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Return Reasons" titleBn="ফেরতের কারণ" icon={<RotateCcw className="w-4 h-4" />} link="/admin/returns" linkText={isBn ? 'রিটার্ন' : 'Returns'} isBn={isBn} />
          {returnReasons.length ? (
            returnReasons.map(([r, n]) => (
              <MiniBar key={r} label={r.replace('_', ' ')} value={n} display={fmtN(n)} max={maxReturn} tone="bg-rose-700" />
            ))
          ) : (
            <p className="text-xs text-stone-400">{isBn ? 'কোনো ডেটা নেই' : 'No data'}</p>
          )}
        </section>

        {/* Profit by Vendor */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Profit by Vendor" titleBn="উদ্যোক্তা অনুযায়ী মুনাফা" icon={<Landmark className="w-4 h-4" />} link="/admin/suppliers" linkText={isBn ? 'সাপ্লায়ার' : 'Vendors'} isBn={isBn} />
          {profitByVendor.length ? (
            profitByVendor.map((v, i) => (
              <MiniBar key={i} label={v.name.substring(0, 30)} value={v.profit} display={fmtMoney(v.profit)} max={maxVendorProfit} tone="bg-indigo-700" />
            ))
          ) : (
            <p className="text-xs text-stone-400">{isBn ? 'কোনো ডেটা নেই' : 'No data'}</p>
          )}
        </section>

        {/* Inventory health */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-xs p-6">
          <SectionHeader title="Inventory Velocity" titleBn="ইনভেন্টরি গতি" icon={<PackagePlus className="w-4 h-4" />} link="/admin/inventory" linkText={isBn ? 'ইনভেন্টরি' : 'Inventory'} isBn={isBn} />
          {(report?.inventoryVelocityMetrics || []).length ? (
            report!.inventoryVelocityMetrics.slice().sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5).map((i) => (
              <MiniBar key={i.sku} label={i.title.substring(0, 30)} value={i.unitsSold} display={`${fmtN(i.unitsSold)}u • ${i.velocityStatus.replace('_', ' ')}`} max={Math.max(1, ...report!.inventoryVelocityMetrics.map((x) => x.unitsSold))} tone="bg-teal-700" />
            ))
          ) : (
            <p className="text-xs text-stone-400">{isBn ? 'কোনো ডেটা নেই' : 'No data'}</p>
          )}
        </section>
      </div>

      {/* Live Orders Queue */}
      <div id="dashboard-orders-queue" className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/50 dark:bg-slate-800/60">
          <div>
            <h2 className="text-lg font-serif font-black text-stone-900 dark:text-slate-100">{isBn ? 'চলমান অর্ডার প্রসেসিং কিউ' : 'Active Orders Queue'}</h2>
            <p className="text-xs text-stone-500 mt-0.5">{isBn ? 'লাইভ অর্ডার ভেরিফিকেশন, প্যাকিং ও কুরিয়ার হ্যান্ডওভার' : 'Live order processing, verification, and courier dispatch'}</p>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold text-teal-900 hover:text-teal-950 hover:underline inline-flex items-center gap-1">
            <span>{isBn ? 'সকল অর্ডার দেখুন' : 'View All Orders'}</span><ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/75 dark:bg-slate-800 text-stone-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-stone-200 dark:border-slate-700">
              <tr>
                <th className="p-4">{isBn ? 'অর্ডার #' : 'Order #'}</th>
                <th className="p-4">{isBn ? 'গ্রাহক ও ফোন' : 'Customer & Phone'}</th>
                <th className="p-4">{isBn ? 'পণ্য' : 'Items'}</th>
                <th className="p-4">{isBn ? 'মোট' : 'Total'}</th>
                <th className="p-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="p-4 text-right">{isBn ? 'কুইক অ্যাকশন' : 'Quick Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-stone-900">{order.orderNumber}</td>
                  <td className="p-4">
                    <span className="font-semibold text-stone-900 block">{order.customer.name}</span>
                    <span className="text-stone-500 font-mono text-[11px]">{order.customer.phone}</span>
                  </td>
                  <td className="p-4 text-stone-600">{order.items.length} item(s)</td>
                  <td className="p-4 font-bold text-stone-900 font-mono">৳ {order.total.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${order.orderStatus === 'DELIVERED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-teal-50 text-teal-900 border border-teal-200'}`}>{order.orderStatus}</span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {order.orderStatus === 'PENDING' && (
                      <button onClick={() => updateOrderStatus(order.id, 'CONFIRMED', 'Admin manually confirmed order')} className="px-3 py-1 bg-teal-900 text-white rounded-xl font-bold hover:bg-teal-950 transition-colors shadow-2xs">{isBn ? 'কনফার্ম' : 'Confirm'}</button>
                    )}
                    {order.orderStatus === 'CONFIRMED' && (
                      <button onClick={() => updateOrderStatus(order.id, 'PROCESSING', 'Moved to packaging')} className="px-3 py-1 bg-stone-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-2xs">{isBn ? 'প্যাক' : 'Pack'}</button>
                    )}
                    {order.orderStatus === 'PROCESSING' && (
                      <button onClick={() => dispatchCourier(order.id, 'Steadfast')} className="px-3 py-1 bg-teal-900 text-white rounded-xl font-bold hover:bg-teal-950 transition-colors shadow-2xs">{isBn ? 'ডিসপ্যাচ' : 'Dispatch'}</button>
                    )}
                    {order.orderStatus === 'SHIPPED' && (
                      <button onClick={() => updateOrderStatus(order.id, 'DELIVERED', 'Courier marked delivery completed')} className="px-3 py-1 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900 transition-colors shadow-2xs">{isBn ? 'ডেলিভার্ড' : 'Mark Delivered'}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700">
      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">{props.label}</div>
      <div className="text-sm font-black text-stone-900 dark:text-slate-100 font-mono mt-0.5">{props.value}</div>
    </div>
  );
}

function DonutMix(props: { online: number; cod: number; labelA?: string; labelBnA?: string; labelB?: string; labelBnB?: string; isBn: boolean }) {
  const { online, cod, labelA, labelBnA, labelB, labelBnB, isBn } = props;
  const total = online + cod > 0 ? online + cod : 1;
  const onlinePct = (online / total) * 100;
  const codPct = (cod / total) * 100;
  const r = 40;
  const c = 2 * Math.PI * r;
  const onlineDash = (onlinePct / 100) * c;
  const codDash = c - onlineDash;
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-teal-600 dark:text-teal-400" strokeWidth="14" strokeDasharray={`${onlineDash} ${c - onlineDash}`} strokeLinecap="round" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-stone-500 dark:text-slate-600" strokeWidth="14" strokeDasharray={`${codDash} ${c - codDash}`} strokeDashoffset={-onlineDash} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xs font-black text-stone-900 dark:text-slate-100 font-mono">{Math.round(onlinePct)}%</span>
        </div>
      </div>
      <div className="space-y-1.5 text-xs flex-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-teal-600 dark:bg-teal-400" />
          <span className="text-stone-600 dark:text-slate-300 flex-1">{isBn ? (labelBnA ?? 'ডিজিটাল / অনলাইন') : (labelA ?? 'Digital / Online')}</span>
          <span className="font-mono font-bold text-stone-900 dark:text-slate-100">{Math.round(onlinePct)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-stone-600 dark:bg-slate-600" />
          <span className="text-stone-600 dark:text-slate-300 flex-1">{isBn ? (labelBnB ?? 'ক্যাশ (COD)') : (labelB ?? 'Cash (COD)')}</span>
          <span className="font-mono font-bold text-stone-900 dark:text-slate-100">{Math.round(codPct)}%</span>
        </div>
      </div>
    </div>
  );
}
