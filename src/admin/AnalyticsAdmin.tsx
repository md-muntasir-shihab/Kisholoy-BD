import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Users, Eye, MousePointerClick, ShoppingBag, Globe, 
  MapPin, Smartphone, Monitor, Compass, Shield, ArrowUpRight, 
  ArrowDownRight, RefreshCw, Filter, Search, Download, Clock, 
  Sparkles, CheckCircle2, AlertCircle, LogIn, LogOut, ChevronRight,
  TrendingUp, Radio, ExternalLink, Play, Pause, Info, Layers, 
  BarChart2, PieChart as PieIcon, Cpu, Zap, Wifi
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { Product, Order } from '../types';
import { getStoredAuthEvents, logAuthEvent } from '../utils/telemetryLogger';
import { AdminModalShell } from '../components/admin/AdminModalShell';

// Types for Analytics
export interface VisitorSession {
  id: string;
  ip: string;
  isp: string;
  country: string;
  countryCode: string;
  division: string;
  district: string;
  city: string;
  device: 'Mobile' | 'Desktop' | 'Tablet';
  os: 'Android' | 'iOS' | 'Windows' | 'macOS' | 'Linux';
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera';
  referrer: 'Direct' | 'Google Search' | 'Facebook Ad' | 'WhatsApp' | 'Instagram' | 'Organic Referral';
  currentPage: string;
  lastAction: string;
  viewCount: number;
  clickCount: number;
  hasCart: boolean;
  cartTotal?: number;
  userId?: string;
  userName?: string;
  status: 'ACTIVE_NOW' | 'IDLE' | 'COMPLETED_ORDER' | 'EXITED';
  durationSeconds: number;
  timestamp: string;
}

export interface UserAuthEvent {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  role: string;
  eventType: 'LOGIN_SUCCESS' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'CART_CHECKOUT';
  ip: string;
  district: string;
  device: string;
  timestamp: string;
  sessionDuration?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface ProductEngagement {
  id: string;
  title: string;
  titleBn?: string;
  sku: string;
  image: string;
  category: string;
  price: number;
  stock: number;
  impressions: number;
  views: number;
  clicks: number;
  cartAdds: number;
  purchases: number;
  ctr: number; // Click Through Rate %
  conversionRate: number; // View to Purchase %
}

export function AnalyticsAdmin() {
  const { products, orders, customers, language, siteContent } = useApp();
  const isBn = language === 'BN';

  // Active Tab View
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'GEO_TRAFFIC' | 'PRODUCTS' | 'LIVE_STREAM' | 'USER_SESSIONS'>('OVERVIEW');
  const [timeRange, setTimeRange] = useState<'REALTIME' | 'TODAY' | '1D' | '2D' | '5D' | '7D' | '30D' | 'ALL'>('TODAY');
  const [isLiveSimulating, setIsLiveSimulating] = useState(true);
  const [simSpeed, setSimSpeed] = useState<number>(5000); // 5 seconds
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorSession | null>(null);

  // Simulated Live Visitor Feed
  const [liveVisitors, setLiveVisitors] = useState<VisitorSession[]>(() => generateInitialVisitors(products));
  const [authEvents, setAuthEvents] = useState<UserAuthEvent[]>(() => {
    const stored = getStoredAuthEvents();
    const initial = generateInitialAuthEvents(customers);
    const combined = [...(stored as any[]), ...initial];
    return combined.slice(0, 50);
  });

  // Sync real-time stored auth events when storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = getStoredAuthEvents();
      if (stored && stored.length > 0) {
        setAuthEvents(prev => {
          const ids = new Set(stored.map(s => s.id));
          const filteredPrev = prev.filter(p => !ids.has(p.id));
          return [...(stored as any[]), ...filteredPrev].slice(0, 50);
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Periodic Live Traffic Simulator
  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      // 1. Randomly update a visitor or add new visitor
      setLiveVisitors(prev => {
        const updated = [...prev];
        const randomAction = Math.random();

        if (randomAction > 0.4 && updated.length > 0) {
          // Update existing visitor activity
          const idx = Math.floor(Math.random() * Math.min(10, updated.length));
          const v = { ...updated[idx] };
          v.durationSeconds += Math.floor(Math.random() * 20) + 5;
          v.viewCount += 1;
          v.clickCount += Math.random() > 0.5 ? 1 : 0;
          
          const pages = [
            'Home Page',
            `Product: ${products[Math.floor(Math.random() * products.length)]?.title || 'Organic Honey'}`,
            'Category: অর্গানিক ফুডস',
            'Shopping Cart',
            'Checkout & Shipping Address',
            'Search: "খাঁটি ঘি"'
          ];
          v.currentPage = pages[Math.floor(Math.random() * pages.length)];
          v.lastAction = `Navigated to ${v.currentPage}`;
          v.timestamp = new Date().toISOString();
          v.status = 'ACTIVE_NOW';
          updated[idx] = v;
          return updated;
        } else {
          // Spawn new incoming visitor
          const newV = createRandomVisitor(products);
          return [newV, ...updated.slice(0, 39)]; // Keep latest 40
        }
      });

      // 2. Occasionally add auth/session log
      if (Math.random() > 0.7) {
        setAuthEvents(prev => {
          const newEvent = createRandomAuthEvent(customers);
          return [newEvent, ...prev.slice(0, 49)];
        });
      }
    }, simSpeed);

    return () => clearInterval(interval);
  }, [isLiveSimulating, simSpeed, products, customers]);

  const timeMultiplier = useMemo(() => {
    switch (timeRange) {
      case 'REALTIME': return 0.05;
      case 'TODAY': return 1;
      case '1D': return 1;
      case '2D': return 2.1;
      case '5D': return 4.8;
      case '7D': return 6.9;
      case '30D': return 28.5;
      case 'ALL': return 150.0;
      default: return 1;
    }
  }, [timeRange]);

  // Derived KPIs
  const activeNowCount = useMemo(() => {
    return liveVisitors.filter(v => v.status === 'ACTIVE_NOW' || v.durationSeconds < 600).length + 8;
  }, [liveVisitors]);

  const totalPageViews = useMemo(() => {
    return Math.floor((liveVisitors.reduce((acc, v) => acc + v.viewCount, 2840) + orders.length * 15) * timeMultiplier);
  }, [liveVisitors, orders, timeMultiplier]);

  const totalClicks = useMemo(() => {
    return Math.floor((liveVisitors.reduce((acc, v) => acc + v.clickCount, 1920) + orders.length * 8) * timeMultiplier);
  }, [liveVisitors, orders, timeMultiplier]);

  const avgSessionDuration = useMemo(() => {
    const totalSecs = liveVisitors.reduce((acc, v) => acc + v.durationSeconds, 4200);
    const avg = Math.round(totalSecs / (liveVisitors.length || 1));
    const mins = Math.floor(avg / 60);
    const secs = avg % 60;
    return `${mins}m ${secs}s`;
  }, [liveVisitors]);

  // District Breakdown Data
  const districtData = useMemo(() => {
    const bdDistricts = [
      { name: 'Dhaka', nameBn: 'ঢাকা', division: 'Dhaka', visitors: 1420, orders: 185, bounceRate: '22%' },
      { name: 'Chittagong', nameBn: 'চট্টগ্রাম', division: 'Chittagong', visitors: 680, orders: 74, bounceRate: '26%' },
      { name: 'Sylhet', nameBn: 'সিলেট', division: 'Sylhet', visitors: 410, orders: 48, bounceRate: '24%' },
      { name: 'Gazipur', nameBn: 'গাজীপুর', division: 'Dhaka', visitors: 320, orders: 39, bounceRate: '28%' },
      { name: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', division: 'Dhaka', visitors: 290, orders: 35, bounceRate: '25%' },
      { name: 'Rajshahi', nameBn: 'রাজশাহী', division: 'Rajshahi', visitors: 270, orders: 28, bounceRate: '31%' },
      { name: 'Khulna', nameBn: 'খুলনা', division: 'Khulna', visitors: 240, orders: 26, bounceRate: '29%' },
      { name: 'Comilla', nameBn: 'কুমিল্লা', division: 'Chittagong', visitors: 210, orders: 22, bounceRate: '30%' },
      { name: 'Bogura', nameBn: 'বগুড়া', division: 'Rajshahi', visitors: 180, orders: 19, bounceRate: '33%' },
      { name: 'Barisal', nameBn: 'বরিশাল', division: 'Barisal', visitors: 160, orders: 15, bounceRate: '35%' },
      { name: 'Rangpur', nameBn: 'রংপুর', division: 'Rangpur', visitors: 150, orders: 14, bounceRate: '34%' },
      { name: 'Mymensingh', nameBn: 'ময়মনসিংহ', division: 'Mymensingh', visitors: 140, orders: 13, bounceRate: '32%' },
    ];

    // Factor in live real-time additions
    const totalDistVisitors = bdDistricts.reduce((a, b) => a + b.visitors, 0);
    return bdDistricts.map(d => ({
      ...d,
      visitors: Math.floor(d.visitors * timeMultiplier),
      orders: Math.floor(d.orders * timeMultiplier),
      percentage: ((d.visitors / totalDistVisitors) * 100).toFixed(1)
    }));
  }, [timeMultiplier]);

  // Country Breakdown Data
  const countryData = useMemo(() => [
    { name: 'Bangladesh', flag: '🇧🇩', visitors: Math.floor(4280 * timeMultiplier), share: '92.6%', isLocal: true },
    { name: 'United States', flag: '🇺🇸', visitors: Math.floor(145 * timeMultiplier), share: '3.1%', isLocal: false },
    { name: 'United Kingdom', flag: '🇬🇧', visitors: Math.floor(82 * timeMultiplier), share: '1.8%', isLocal: false },
    { name: 'Saudi Arabia & UAE', flag: '🇸🇦', visitors: Math.floor(68 * timeMultiplier), share: '1.5%', isLocal: false },
    { name: 'Canada', flag: '🇨🇦', visitors: Math.floor(45 * timeMultiplier), share: '1.0%', isLocal: false },
  ], [timeMultiplier]);

  // Product Engagement Data
  const productEngagements = useMemo<ProductEngagement[]>(() => {
    return products.map((p, idx) => {
      const impressions = Math.floor((800 + (products.length - idx) * 140) * timeMultiplier);
      const views = Math.round(impressions * 0.42);
      const clicks = Math.round(views * 0.65);
      const cartAdds = Math.round(clicks * 0.35);
      const purchases = Math.floor((orders.filter(o => o.items.some(it => it.productId === p.id)).length + Math.round(cartAdds * 0.28)) * timeMultiplier);
      const ctr = views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : 0;
      const conversionRate = views > 0 ? Number(((purchases / views) * 100).toFixed(1)) : 0;

      return {
        id: p.id,
        title: p.title,
        titleBn: p.titleBn,
        sku: p.sku || `KSH-${1000 + idx}`,
        image: p.images[0] || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200',
        category: p.category,
        price: p.price,
        stock: p.stock,
        impressions,
        views,
        clicks,
        cartAdds,
        purchases,
        ctr,
        conversionRate
      };
    }).sort((a, b) => b.clicks - a.clicks);
  }, [products, orders]);

  // Hourly Traffic Trend Chart Data
  const hourlyTrafficData = useMemo(() => [
    { time: '00:00', visitors: Math.floor(45 * timeMultiplier), pageViews: Math.floor(110 * timeMultiplier), clicks: Math.floor(65 * timeMultiplier) },
    { time: '03:00', visitors: Math.floor(18 * timeMultiplier), pageViews: Math.floor(42 * timeMultiplier), clicks: Math.floor(22 * timeMultiplier) },
    { time: '06:00', visitors: Math.floor(65 * timeMultiplier), pageViews: Math.floor(180 * timeMultiplier), clicks: Math.floor(95 * timeMultiplier) },
    { time: '09:00', visitors: Math.floor(280 * timeMultiplier), pageViews: Math.floor(790 * timeMultiplier), clicks: Math.floor(420 * timeMultiplier) },
    { time: '12:00', visitors: Math.floor(410 * timeMultiplier), pageViews: Math.floor(1150 * timeMultiplier), clicks: Math.floor(680 * timeMultiplier) },
    { time: '15:00', visitors: Math.floor(490 * timeMultiplier), pageViews: Math.floor(1380 * timeMultiplier), clicks: Math.floor(820 * timeMultiplier) },
    { time: '18:00', visitors: Math.floor(620 * timeMultiplier), pageViews: Math.floor(1840 * timeMultiplier), clicks: Math.floor(1120 * timeMultiplier) },
    { time: '21:00', visitors: Math.floor(780 * timeMultiplier), pageViews: Math.floor(2260 * timeMultiplier), clicks: Math.floor(1450 * timeMultiplier) },
    { time: '23:00', visitors: Math.floor(340 * timeMultiplier), pageViews: Math.floor(920 * timeMultiplier), clicks: Math.floor(510 * timeMultiplier) },
  ], [timeMultiplier]);

  // Device Breakdown Data
  const deviceData = useMemo(() => [
    { name: 'Mobile (Android & iPhone)', value: 74, color: '#0d9488' },
    { name: 'Desktop (Windows & Mac)', value: 21, color: '#0f766e' },
    { name: 'Tablet & iPad', value: 5, color: '#14b8a6' },
  ], []);

  // Acquisition Channels Data
  const trafficChannels = useMemo(() => [
    { channel: 'Facebook / Instagram Ads', visitors: Math.floor(1840 * timeMultiplier), percentage: '42%', color: '#1877F2' },
    { channel: 'Direct / Bookmarks', visitors: Math.floor(1120 * timeMultiplier), percentage: '26%', color: '#0F766E' },
    { channel: 'Google Organic Search', visitors: Math.floor(810 * timeMultiplier), percentage: '19%', color: '#EA4335' },
    { channel: 'WhatsApp Shared Links', visitors: Math.floor(390 * timeMultiplier), percentage: '9%', color: '#25D366' },
    { channel: 'Other Referrals', visitors: Math.floor(180 * timeMultiplier), percentage: '4%', color: '#8B5CF6' },
  ], [timeMultiplier]);

  // Session Duration Distribution Data
  const sessionDurationData = useMemo(() => [
    { range: '< 1 min', visitors: Math.floor(420 * timeMultiplier), label: 'Bounce / Quick Look' },
    { range: '1-3 mins', visitors: Math.floor(1150 * timeMultiplier), label: 'Catalog Browsing' },
    { range: '3-5 mins', visitors: Math.floor(980 * timeMultiplier), label: 'Cart Consideration' },
    { range: '5-10 mins', visitors: Math.floor(640 * timeMultiplier), label: 'High Intent' },
    { range: '10+ mins', visitors: Math.floor(310 * timeMultiplier), label: 'Checkout & Account' },
  ], [timeMultiplier]);

  // Filtered Live Visitors
  const filteredVisitors = useMemo(() => {
    return liveVisitors.filter(v => {
      if (selectedDistrict !== 'ALL' && v.district !== selectedDistrict) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.ip.includes(q) ||
          v.district.toLowerCase().includes(q) ||
          v.isp.toLowerCase().includes(q) ||
          v.currentPage.toLowerCase().includes(q) ||
          (v.userName && v.userName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [liveVisitors, selectedDistrict, searchQuery]);

  // Export Analytics Summary CSV
  const handleExportCSV = () => {
    const csvRows = [
      ['KISHOLOY Analytics Export', new Date().toISOString()],
      [],
      ['Top Products by Views & Clicks'],
      ['Product Title', 'SKU', 'Category', 'Price', 'Page Views', 'Clicks', 'Cart Adds', 'Purchases', 'CTR %', 'Conversion Rate %'],
      ...productEngagements.map(p => [
        `"${p.title}"`,
        p.sku,
        p.category,
        p.price,
        p.views,
        p.clicks,
        p.cartAdds,
        p.purchases,
        `${p.ctr}%`,
        `${p.conversionRate}%`
      ]),
      [],
      ['Geographic Traffic by District (Bangladesh)'],
      ['District', 'Division', 'Visitors', 'Orders', 'Bounce Rate', 'Share %'],
      ...districtData.map(d => [d.name, d.division, d.visitors, d.orders, d.bounceRate, `${d.percentage}%`])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kisholoy_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="analytics-desk-container" className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      
      {/* 1. Header & Live Controller Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-950/80 text-teal-400 border border-teal-700/60 rounded-xl shadow-inner">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
                <span>{isBn ? 'ভিজিটর ও ইউজার অ্যানালাইসিস' : 'Traffic & User Analytics'}</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LIVE</span>
                </span>
              </h1>
              <p className="text-xs text-stone-400 mt-0.5">
                {isBn 
                  ? 'রিয়েলটাইম ভিজিটর ট্র্যাকিং, জেলাভিত্তিক ট্রাফিক, কোন পণ্যে বেশি ক্লিক পড়ছে ও ইউজার লগইন হিস্ট্রি' 
                  : 'Live real-time visitor telemetry, regional heatmaps, product clickstreams, and user access trails'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Controls & Real-time toggles */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          {/* Simulation Toggle */}
          <button
            onClick={() => setIsLiveSimulating(!isLiveSimulating)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isLiveSimulating 
                ? 'bg-emerald-950 text-emerald-200 border-emerald-700 hover:bg-emerald-900' 
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
            }`}
            title="Toggle Live Real-Time Stream Simulation"
          >
            {isLiveSimulating ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isLiveSimulating ? (isBn ? 'লাইভ স্ট্রিম চালু' : 'Live Stream Active') : (isBn ? 'পজ করা' : 'Paused')}</span>
          </button>

          {/* Time Range Filter */}
          <div className="flex items-center bg-stone-800/90 rounded-xl p-0.5 border border-stone-700 text-xs">
            {[
              { id: 'TODAY', label: '1 Day', labelBn: '১ দিন' },
              { id: '2D', label: '2 Days', labelBn: '২ দিন' },
              { id: '5D', label: '5 Days', labelBn: '৫ দিন' },
              { id: '7D', label: '7 Days', labelBn: '৭ দিন' },
              { id: '30D', label: '30 Days', labelBn: '৩০ দিন' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id as any)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  timeRange === r.id 
                    ? 'bg-teal-700 text-white shadow-xs font-bold' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isBn ? r.labelBn : r.label}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-teal-300 border border-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isBn ? 'রিপোর্ট ডাউনলোড' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Active Now */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs relative overflow-hidden group hover:border-teal-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{isBn ? 'এখন লাইভ ভিজিটর' : 'Active Visitors'}</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-stone-900">{activeNowCount}</span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +14%
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1 truncate">{isBn ? 'বর্তমানে ওয়েবসাইটে ব্রাউজ করছেন' : 'Browsing real-time'}</p>
        </div>

        {/* Total Page Views */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs group hover:border-teal-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{isBn ? 'মোট পেজ ভিউ' : 'Total Page Views'}</span>
            <Eye className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-stone-900">{totalPageViews.toLocaleString()}</span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +28%
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1 truncate">{isBn ? 'পণ্য ও পেজ পরিদর্শন সংখ্যা' : 'Product & catalog views'}</p>
        </div>

        {/* Total Product Clicks */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs group hover:border-teal-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{isBn ? 'প্রোডাক্ট ক্লিকস' : 'Product Clicks'}</span>
            <MousePointerClick className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-stone-900">{totalClicks.toLocaleString()}</span>
            <span className="text-[11px] text-emerald-700 font-semibold">67.6% CTR</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1 truncate">{isBn ? 'পণ্যের বিস্তারিত দেখার ক্লিক' : 'Direct item interactions'}</p>
        </div>

        {/* Avg Session Duration */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs group hover:border-teal-500 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{isBn ? 'গড় ব্রাউজিং সময়' : 'Avg Session'}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-stone-900">{avgSessionDuration}</span>
            <span className="text-[11px] text-emerald-700 font-semibold">+42s</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1 truncate">{isBn ? 'প্রতি ভিজিটরের গড় সময়' : 'Time spent per visitor'}</p>
        </div>

        {/* Store Conversion Rate */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs group hover:border-teal-500 transition-colors col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{isBn ? 'কনভার্শন রেট' : 'Conversion'}</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-emerald-950">4.82%</span>
            <span className="text-[11px] text-emerald-700 font-semibold">{orders.length} {isBn ? 'অর্ডার' : 'Orders'}</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1 truncate">{isBn ? 'ভিজিটর থেকে অর্ডার সম্পন্ন' : 'Visitors converted to orders'}</p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'OVERVIEW', label: 'Analytics Overview', labelBn: 'সার্বিক গ্রাফ ও চার্ট', icon: BarChart2 },
          { id: 'GEO_TRAFFIC', label: 'Geo & Districts', labelBn: 'জেলা ও অঞ্চলভিত্তিক ট্রাফিক', icon: MapPin },
          { id: 'PRODUCTS', label: 'Product Clicks & Views', labelBn: 'পণ্য ভিউ ও ক্লিক অ্যানালাইসিস', icon: MousePointerClick },
          { id: 'LIVE_STREAM', label: 'Live Visitor & IP Log', labelBn: 'লাইভ ভিজিটর ও আইপি ট্রেসিং', icon: Radio },
          { id: 'USER_SESSIONS', label: 'User Auth & Sessions', labelBn: 'ইউজার লগইন ও সেশন হিস্ট্রি', icon: Users },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-teal-900 text-white shadow-xs' 
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isBn ? t.labelBn : t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW CHARTS */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Main Area Chart: Hourly / Daily Traffic Curve */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-700" />
                  <span>{isBn ? 'দৈনিক ট্রাফিক ট্রেন্ড (ভিজিটর, পেজ ভিউ ও ক্লিক)' : 'Visitor Traffic & Clickstream Velocity'}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {isBn ? 'প্রতি ঘণ্টার ভিজিটর সংখ্যা, প্রোডাক্ট পেজ ভিউ এবং ক্লিক অ্যানালাইসিস' : 'Hourly breakdown of online visitors, total pageviews, and direct product interactions'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-stone-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-600"></span> {isBn ? 'ভিজিটর' : 'Visitors'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span> {isBn ? 'পেজ ভিউ' : 'Page Views'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span> {isBn ? 'ক্লিক' : 'Clicks'}
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '0.75rem', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="visitors" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisitors)" name="Visitors" />
                  <Area type="monotone" dataKey="pageViews" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" name="Page Views" />
                  <Area type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" name="Clicks" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2 Column Section: Traffic Acquisition & Device/OS Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Acquisition Channels */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <h3 className="font-serif font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-700" />
                <span>{isBn ? 'ট্রাফিক সোর্স ও রেফারেল চ্যানেল' : 'Traffic Acquisition Sources'}</span>
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                {isBn ? 'কোথা থেকে ভিজিটররা ওয়েবসাইটে প্রবেশ করছেন' : 'Where your visitors are arriving from'}
              </p>

              <div className="space-y-3">
                {trafficChannels.map(ch => (
                  <div key={ch.channel} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-stone-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }}></span>
                        {ch.channel}
                      </span>
                      <span className="font-mono text-stone-600">
                        {ch.visitors.toLocaleString()} ({ch.percentage})
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: ch.percentage, backgroundColor: ch.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device & Platform Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-teal-700" />
                  <span>{isBn ? 'ডিভাইস ও ব্রাউজার শেয়ার' : 'Device & Platform Breakdown'}</span>
                </h3>
                <p className="text-xs text-stone-500 mb-4">
                  {isBn ? 'মোবাইল বনাম ডেস্কটপ ব্রাউজিং অনুপাত' : 'User devices and hardware platform distribution'}
                </p>

                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                    <Smartphone className="w-5 h-5 text-teal-700 mx-auto mb-1" />
                    <span className="text-xs text-stone-500 block">Mobile</span>
                    <span className="font-mono font-bold text-teal-950 text-base">74%</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <Monitor className="w-5 h-5 text-stone-700 mx-auto mb-1" />
                    <span className="text-xs text-stone-500 block">Desktop</span>
                    <span className="font-mono font-bold text-stone-900 text-base">21%</span>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <Layers className="w-5 h-5 text-indigo-700 mx-auto mb-1" />
                    <span className="text-xs text-stone-500 block">Tablet/iPad</span>
                    <span className="font-mono font-bold text-indigo-950 text-base">5%</span>
                  </div>
                </div>
              </div>

              {/* Conversion Funnel Strip */}
              <div className="p-3 bg-stone-900 text-white rounded-xl text-xs space-y-2">
                <div className="flex justify-between font-bold text-teal-300">
                  <span>Store Funnel Conversion</span>
                  <span className="font-mono">4.82% Final Checkout</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
                  <div className="bg-stone-800 p-1.5 rounded">
                    <span className="block text-stone-400">Visitors</span>
                    <strong className="text-white font-mono">100%</strong>
                  </div>
                  <div className="bg-stone-800 p-1.5 rounded">
                    <span className="block text-stone-400">View SKU</span>
                    <strong className="text-teal-300 font-mono">68%</strong>
                  </div>
                  <div className="bg-stone-800 p-1.5 rounded">
                    <span className="block text-stone-400">Add Cart</span>
                    <strong className="text-amber-300 font-mono">19%</strong>
                  </div>
                  <div className="bg-teal-950 border border-teal-700 p-1.5 rounded">
                    <span className="block text-teal-300 font-bold">Ordered</span>
                    <strong className="text-emerald-300 font-mono">4.8%</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Recharts BarChart: Session Duration Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-700" />
                  <span>{isBn ? 'সেশন সময়কাল বিশ্লেষণ (Session Duration Distribution)' : 'Session Duration Distribution'}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {isBn ? 'ভিজিটরদের স্টোর ব্রাউজিং সময়কাল এবং পারফরম্যান্স এনগেজমেন্ট' : 'Breakdown of user session engagement duration'}
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionDurationData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '0.75rem', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any) => [`${value} Sessions`, 'Visitors']}
                  />
                  <Bar dataKey="visitors" fill="#0d9488" radius={[6, 6, 0, 0]} name="Session Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GEOGRAPHIC & DISTRICT TRAFFIC */}
      {/* ========================================================================= */}
      {activeTab === 'GEO_TRAFFIC' && (
        <div className="space-y-6">
          {/* Top Country Grid */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <h3 className="font-serif font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-700" />
              <span>{isBn ? 'দেশভিত্তিক আন্তর্জাতিক ট্রাফিক' : 'Global Traffic & Expatriate Reach'}</span>
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {isBn ? 'বাংলাদেশ এবং প্রবাসী বাংলাদেশিদের ভিজিটর সংখ্যা' : 'Visitors from Bangladesh and overseas expat communities'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {countryData.map(c => (
                <div key={c.name} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.flag}</span>
                    <span className="font-bold text-xs text-stone-900 truncate">{c.name}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-mono font-bold text-stone-900 text-sm">{c.visitors.toLocaleString()}</span>
                    <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">{c.share}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* District Breakdown Table & Bar Graph */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  <span>{isBn ? 'বাংলাদেশের ৬৪ জেলাভিত্তিক ট্রাফিক ও অর্ডার কনভার্শন' : 'Bangladesh District-Level Traffic Breakdown'}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {isBn ? 'কোন জেলা থেকে কতজন ভিজিটর আসছেন এবং কয়টি অর্ডার তৈরি হয়েছে' : 'Visitors, orders, and delivery conversion performance by district'}
                </p>
              </div>

              {/* Division Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-stone-500">{isBn ? 'বিভাগ:' : 'Division:'}</span>
                <select 
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-semibold text-xs text-stone-800 focus:outline-none focus:border-teal-700"
                >
                  <option value="ALL">{isBn ? 'সকল জেলা' : 'All Districts'}</option>
                  <option value="Dhaka">Dhaka (ঢাকা)</option>
                  <option value="Chittagong">Chittagong (চট্টগ্রাম)</option>
                  <option value="Sylhet">Sylhet (সিলেট)</option>
                  <option value="Rajshahi">Rajshahi (রাজশাহী)</option>
                  <option value="Khulna">Khulna (খুলনা)</option>
                  <option value="Barisal">Barisal (বরিশাল)</option>
                  <option value="Rangpur">Rangpur (রংপুর)</option>
                  <option value="Mymensingh">Mymensingh (ময়মনসিংহ)</option>
                </select>
              </div>
            </div>

            {/* Recharts BarChart: District Visitors & Orders */}
            <div className="h-64 w-full mb-6 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={districtData.slice(0, 8)} 
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 600 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#0d9488' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#059669' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '0.75rem', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar yAxisId="left" dataKey="visitors" fill="#0d9488" radius={[4, 4, 0, 0]} name="Visitors" />
                  <Bar yAxisId="right" dataKey="orders" fill="#059669" radius={[4, 4, 0, 0]} name="Orders Placed" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/80 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">{isBn ? 'জেলা ও বিভাগ' : 'District & Division'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'ভিজিটর সংখ্যা' : 'Visitors'}</th>
                    <th className="p-3.5">{isBn ? 'ট্রাফিক শেয়ার' : 'Traffic Share'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'অর্ডার তৈরি' : 'Orders Placed'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'বাউন্স রেট' : 'Bounce Rate'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {districtData.map((d, idx) => (
                    <tr key={d.name} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-stone-400 font-bold">{idx + 1}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-stone-900">{d.name} ({d.nameBn})</div>
                        <div className="text-[11px] text-stone-500">{d.division} Division</div>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-stone-900">
                        {d.visitors.toLocaleString()}
                      </td>
                      <td className="p-3.5 min-w-48">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-teal-700 rounded-full" 
                              style={{ width: `${Math.min(100, Number(d.percentage) * 2.2)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-semibold text-stone-600 w-10 text-right">{d.percentage}%</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-800">
                        {d.orders}
                      </td>
                      <td className="p-3.5 text-right font-mono text-stone-500">
                        {d.bounceRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRODUCT CLICKS & PAGEVIEWS */}
      {/* ========================================================================= */}
      {activeTab === 'PRODUCTS' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-teal-700" />
                  <span>{isBn ? 'পণ্য ভিউ ও ক্লিক অ্যানালাইসিস (Clickstream & Views)' : 'Product Clickstream & View Analytics'}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {isBn ? 'কোন পণ্য কতবার দেখা হয়েছে, কতবার ক্লিক পড়েছে এবং কার্ট টু সেলস কনভার্শন' : 'Detailed performance matrix of most viewed, clicked, and added-to-cart items'}
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={isBn ? 'পণ্য বা SKU দিয়ে খুঁজুন...' : 'Search by product name or SKU...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700 bg-stone-50"
                />
              </div>
            </div>

            {/* Product Performance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/80 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">{isBn ? 'পণ্য' : 'Product'}</th>
                    <th className="p-3.5">{isBn ? 'মূল্য ও স্টক' : 'Price & Stock'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'ইম্প্রেশন' : 'Impressions'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'পেজ ভিউ' : 'Views'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'ক্লিকস' : 'Clicks'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'কার্ট যোগ' : 'Cart Adds'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'অর্ডার' : 'Orders'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'CTR %' : 'CTR %'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'কনভার্শন' : 'Conv. %'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {productEngagements
                    .filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.image} 
                            alt={p.title} 
                            className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 block truncate max-w-xs sm:max-w-sm">
                              {p.title}
                            </span>
                            <span className="text-[11px] text-stone-500 font-mono">
                              SKU: {p.sku} • {p.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-stone-900">৳ {p.price.toLocaleString()}</div>
                        <div className={`text-[10px] font-semibold ${p.stock <= 5 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {p.stock} in stock
                        </div>
                      </td>
                      <td className="p-3.5 text-right font-mono text-stone-600">
                        {p.impressions.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-stone-900">
                        {p.views.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-teal-800">
                        {p.clicks.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono text-amber-800 font-semibold">
                        {p.cartAdds.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-800">
                        {p.purchases}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-stone-700">
                        {p.ctr}%
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {p.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LIVE VISITOR STREAM & IP TRACE LOG */}
      {/* ========================================================================= */}
      {activeTab === 'LIVE_STREAM' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>{isBn ? 'রিয়েলটাইম ভিজিটর স্ট্রিম ও আইপি ট্রেস লগ' : 'Live Visitor Stream & IP Telemetry Stream'}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {isBn ? 'বর্তমানে ওয়েবসাইটে থাকা ভিজিটরদের আইপি, জেলা, ডিভাইস ও বর্তমান অ্যাক্টিভিটি' : 'Real-time feed of active visitors, IP addresses, ISP, device OS, and active page actions'}
                </p>
              </div>

              {/* Filter Search */}
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={isBn ? 'আইপি, জেলা বা পেজ দিয়ে খুঁজুন...' : 'Search by IP, district, or page...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700 bg-stone-50"
                  />
                </div>
              </div>
            </div>

            {/* Live Visitor Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/80 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">{isBn ? 'আইপি অ্যাড্রেস ও আইএসপি' : 'IP Address & ISP'}</th>
                    <th className="p-3.5">{isBn ? 'অবস্থান (জেলা/দেশ)' : 'Location (District/Country)'}</th>
                    <th className="p-3.5">{isBn ? 'ডিভাইস ও ব্রাউজার' : 'Device & Browser'}</th>
                    <th className="p-3.5">{isBn ? 'বর্তমান পেজ ও অ্যাকশন' : 'Current Page / Last Action'}</th>
                    <th className="p-3.5">{isBn ? 'সোর্স' : 'Source'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'ভিউ / ক্লিক' : 'Views/Clicks'}</th>
                    <th className="p-3.5">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'ইন্সপেক্ট' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredVisitors.map((v) => (
                    <tr key={v.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-stone-900 flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-teal-700" />
                          <span>{v.ip}</span>
                        </div>
                        <div className="text-[11px] text-stone-500">{v.isp}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-stone-900 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-600" />
                          <span>{v.district}, {v.country}</span>
                        </div>
                        <div className="text-[11px] text-stone-500">{v.division} Division</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-stone-800">{v.device} • {v.os}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{v.browser}</div>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="font-semibold text-teal-950 truncate">{v.currentPage}</div>
                        <div className="text-[11px] text-stone-500 truncate">{v.lastAction}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                          {v.referrer}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        <span className="font-bold text-stone-900">{v.viewCount}v</span> / <span className="text-teal-800">{v.clickCount}c</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.status === 'ACTIVE_NOW' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          v.status === 'COMPLETED_ORDER' ? 'bg-teal-100 text-teal-800 border border-teal-300' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {v.status === 'ACTIVE_NOW' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
                          <span>{v.status}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedVisitor(v)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-teal-900 hover:text-white rounded-lg text-xs font-bold transition-colors border border-stone-200"
                        >
                          {isBn ? 'ডিটেইলস' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: USER AUTH & SESSION TIMELINE */}
      {/* ========================================================================= */}
      {activeTab === 'USER_SESSIONS' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-700" />
                  <span>{isBn ? 'ইউজার লগইন, লগআউট ও অ্যাক্সেস অডিট লগ' : 'User Authentication & Session Audit Trail'}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {isBn ? 'কোন ইউজার কখন লগইন বা লগআউট করেছেন, আইপি অ্যাড্রেস ও ডিভাইস ট্র্যাকিং' : 'Security log of user authentication events, session durations, and IP access'}
                </p>
              </div>
            </div>

            {/* Auth Events Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/80 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">{isBn ? 'টাইমস্ট্যাম্প' : 'Timestamp'}</th>
                    <th className="p-3.5">{isBn ? 'ইউজার ও ফোন' : 'User & Phone'}</th>
                    <th className="p-3.5">{isBn ? 'রোল' : 'Role'}</th>
                    <th className="p-3.5">{isBn ? 'ইভেন্ট টাইপ' : 'Event Type'}</th>
                    <th className="p-3.5">{isBn ? 'আইপি ও জেলা' : 'IP Address & Location'}</th>
                    <th className="p-3.5">{isBn ? 'ডিভাইস' : 'Device'}</th>
                    <th className="p-3.5 text-right">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {authEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3.5 text-stone-500 font-mono text-[11px]">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-stone-900">{ev.userName}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{ev.userPhone}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                          {ev.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.eventType === 'LOGIN_SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                          ev.eventType === 'LOGOUT' ? 'bg-stone-200 text-stone-800' :
                          ev.eventType === 'CART_CHECKOUT' ? 'bg-teal-100 text-teal-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {ev.eventType === 'LOGIN_SUCCESS' && <LogIn className="w-3 h-3 text-emerald-700" />}
                          {ev.eventType === 'LOGOUT' && <LogOut className="w-3 h-3 text-stone-700" />}
                          <span>{ev.eventType}</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono text-stone-800">{ev.ip}</div>
                        <div className="text-[11px] text-stone-500">{ev.district}, Bangladesh</div>
                      </td>
                      <td className="p-3.5 text-stone-700 font-medium">
                        {ev.device}
                      </td>
                      <td className="p-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.status === 'SUCCESS' ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' :
                          'text-rose-800 bg-rose-50 border border-rose-200'
                        }`}>
                          {ev.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISITOR INSPECTOR MODAL */}
      {/* ========================================================================= */}
      <AdminModalShell
        open={!!selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
        label=""
        overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-700" />
                <h3 className="font-serif font-bold text-stone-900 text-base">Visitor Telemetry Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl">
                <div>
                  <span className="text-stone-400 block font-semibold">IP Address</span>
                  <strong className="font-mono text-stone-900 text-sm">{selectedVisitor.ip}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block font-semibold">ISP / Network</span>
                  <strong className="text-stone-900">{selectedVisitor.isp}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block font-semibold">Location</span>
                  <strong className="text-stone-900">{selectedVisitor.district}, {selectedVisitor.country}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block font-semibold">Device & OS</span>
                  <strong className="text-stone-900">{selectedVisitor.device} ({selectedVisitor.os})</strong>
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 space-y-1.5">
                <span className="font-bold text-teal-950 block">Session Activity</span>
                <div className="flex justify-between">
                  <span className="text-stone-600">Current Page:</span>
                  <strong className="text-stone-900">{selectedVisitor.currentPage}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Referrer Channel:</span>
                  <strong className="text-stone-900">{selectedVisitor.referrer}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Page Views / Clicks:</span>
                  <strong className="font-mono text-stone-900">{selectedVisitor.viewCount} views / {selectedVisitor.clickCount} clicks</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Session Duration:</span>
                  <strong className="font-mono text-stone-900">{Math.floor(selectedVisitor.durationSeconds / 60)}m {selectedVisitor.durationSeconds % 60}s</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedVisitor(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
      </AdminModalShell>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper Generators for Realistic Initial Data & Simulation
// ---------------------------------------------------------------------------

function generateInitialVisitors(products: Product[]): VisitorSession[] {
  const districts = ['Dhaka', 'Chittagong', 'Sylhet', 'Gazipur', 'Narayanganj', 'Rajshahi', 'Khulna', 'Comilla', 'Bogura', 'Barisal', 'Rangpur', 'Mymensingh'];
  const isps = ['Grameenphone 4G', 'Banglalink Digital', 'Robi Axiata', 'AmberIT Broadband', 'Link3 Technologies', 'Dot Internet', 'Carnival Internet'];
  const devices: ('Mobile' | 'Desktop' | 'Tablet')[] = ['Mobile', 'Mobile', 'Mobile', 'Desktop', 'Tablet'];
  const browsers: ('Chrome' | 'Safari' | 'Firefox' | 'Edge')[] = ['Chrome', 'Chrome', 'Safari', 'Firefox', 'Edge'];
  const referrers: ('Direct' | 'Google Search' | 'Facebook Ad' | 'WhatsApp' | 'Instagram')[] = ['Direct', 'Facebook Ad', 'Google Search', 'WhatsApp', 'Instagram'];

  return Array.from({ length: 18 }).map((_, i) => {
    const district = districts[Math.floor(Math.random() * districts.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const pages = [
      'Home Page (হিরো অফার)',
      product ? `Product: ${product.title}` : 'Product: খাঁটি সুন্দরবন মধু',
      'Category: অর্গানিক ফুডস',
      'Shopping Cart (কার্ট পেজ)',
      'Checkout Page'
    ];

    return {
      id: `vis-${Date.now()}-${i}`,
      ip: `103.${Math.floor(Math.random() * 200) + 20}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
      isp: isps[Math.floor(Math.random() * isps.length)],
      country: 'Bangladesh',
      countryCode: 'BD',
      division: district === 'Dhaka' || district === 'Gazipur' || district === 'Narayanganj' ? 'Dhaka' : district === 'Chittagong' || district === 'Comilla' ? 'Chittagong' : 'Sylhet',
      district,
      city: district,
      device,
      os: device === 'Mobile' ? (Math.random() > 0.4 ? 'Android' : 'iOS') : 'Windows',
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      currentPage: pages[Math.floor(Math.random() * pages.length)],
      lastAction: 'Browsing products',
      viewCount: Math.floor(Math.random() * 8) + 1,
      clickCount: Math.floor(Math.random() * 6) + 1,
      hasCart: Math.random() > 0.6,
      status: i < 8 ? 'ACTIVE_NOW' : 'IDLE',
      durationSeconds: Math.floor(Math.random() * 600) + 30,
      timestamp: new Date(Date.now() - i * 45000).toISOString()
    };
  });
}

function createRandomVisitor(products: Product[]): VisitorSession {
  const districts = ['Dhaka', 'Chittagong', 'Sylhet', 'Gazipur', 'Rajshahi', 'Khulna', 'Comilla', 'Bogura'];
  const isps = ['Grameenphone 4G', 'Banglalink Digital', 'AmberIT', 'Link3', 'Robi 4G'];
  const district = districts[Math.floor(Math.random() * districts.length)];
  const product = products[Math.floor(Math.random() * products.length)];

  return {
    id: `vis-${Date.now()}`,
    ip: `103.${Math.floor(Math.random() * 180) + 40}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
    isp: isps[Math.floor(Math.random() * isps.length)],
    country: 'Bangladesh',
    countryCode: 'BD',
    division: district === 'Dhaka' || district === 'Gazipur' ? 'Dhaka' : 'Chittagong',
    district,
    city: district,
    device: Math.random() > 0.3 ? 'Mobile' : 'Desktop',
    os: Math.random() > 0.5 ? 'Android' : 'iOS',
    browser: 'Chrome',
    referrer: Math.random() > 0.5 ? 'Facebook Ad' : 'Direct',
    currentPage: product ? `Product: ${product.title}` : 'Home Page',
    lastAction: 'Clicked product card',
    viewCount: 1,
    clickCount: 1,
    hasCart: false,
    status: 'ACTIVE_NOW',
    durationSeconds: 12,
    timestamp: new Date().toISOString()
  };
}

function generateInitialAuthEvents(customers: any[]): UserAuthEvent[] {
  const names = ['Md. Arif Rahman', 'Farhana Sultana', 'Tanvir Ahmed', 'Nusrat Jahan', 'Sabbir Hossain', 'Anika Tabassum'];
  const phones = ['01711223344', '01819887766', '01912345678', '01611002233', '01511998877'];
  const types: ('LOGIN_SUCCESS' | 'LOGOUT' | 'CART_CHECKOUT')[] = ['LOGIN_SUCCESS', 'LOGIN_SUCCESS', 'LOGOUT', 'CART_CHECKOUT'];

  return Array.from({ length: 12 }).map((_, i) => ({
    id: `auth-${Date.now()}-${i}`,
    userId: `usr-${100 + i}`,
    userName: names[i % names.length],
    userPhone: phones[i % phones.length],
    role: i === 0 ? 'ADMIN' : 'CUSTOMER',
    eventType: types[i % types.length],
    ip: `103.145.${Math.floor(Math.random() * 100) + 10}.${Math.floor(Math.random() * 200)}`,
    district: i % 2 === 0 ? 'Dhaka' : 'Chittagong',
    device: i % 2 === 0 ? 'Mobile (Chrome)' : 'Desktop (Windows)',
    timestamp: new Date(Date.now() - i * 360000).toISOString(),
    status: 'SUCCESS'
  }));
}

function createRandomAuthEvent(customers: any[]): UserAuthEvent {
  const names = ['Kazi Moinul', 'Sadia Islam', 'Ahsan Habib', 'Jannatul Ferdous'];
  const phones = ['01712998877', '01811554433', '01918776655'];
  
  return {
    id: `auth-${Date.now()}`,
    userId: `usr-${Math.floor(Math.random() * 900) + 100}`,
    userName: names[Math.floor(Math.random() * names.length)],
    userPhone: phones[Math.floor(Math.random() * phones.length)],
    role: 'CUSTOMER',
    eventType: Math.random() > 0.5 ? 'LOGIN_SUCCESS' : 'CART_CHECKOUT',
    ip: `103.145.${Math.floor(Math.random() * 100) + 10}.${Math.floor(Math.random() * 200)}`,
    district: 'Dhaka',
    device: 'Mobile (Android)',
    timestamp: new Date().toISOString(),
    status: 'SUCCESS'
  };
}
