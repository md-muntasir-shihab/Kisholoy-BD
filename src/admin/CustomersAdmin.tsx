import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  ShieldAlert,
  CheckCircle2,
  Award,
  CreditCard,
  MessageCircle,
  Send,
  Plus,
  Tag,
  AlertTriangle,
  FileText,
  Truck,
  XCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  Check,
  Download,
  Filter,
  Eye,
  ArrowUpDown,
  SlidersHorizontal,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Customer, CustomerSegmentType, RfmScore, RfmSegmentSummary } from '../types';
import { Customer360Modal } from '../components/admin/Customer360Modal';
import { CreateCustomerModal } from '../components/admin/CreateCustomerModal';
import { CustomerQuickMessageModal } from '../components/admin/CustomerQuickMessageModal';

interface EnrichedCustomer extends Customer {
  rfm?: RfmScore | null;
  segment?: CustomerSegmentType;
  deliveredOrders?: number;
  cancelledOrders?: number;
  returnedOrders?: number;
  completionRate?: number;
  riskRating?: 'LOW' | 'MEDIUM' | 'HIGH';
  district?: string;
  tags?: string[];
}

export function CustomersAdmin() {
  const { customers: contextCustomers, orders: contextOrders, language, updateCustomerStatus, showToast } = useApp();
  const [searchParams] = useSearchParams();
  const isBn = language === 'BN';

  // API State
  const [customersList, setCustomersList] = useState<EnrichedCustomer[]>([]);
  const [summaries, setSummaries] = useState<RfmSegmentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & Controls
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'spend-desc' | 'spend-asc' | 'orders-desc' | 'name-asc'>('spend-desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Synchronize when URL search param updates
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);

  // Modals
  const [inspectCustomerId, setInspectCustomerId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [messageCustomer, setMessageCustomer] = useState<{ id: string; name: string; phone: string; email?: string } | null>(null);

  // Copy tracking
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch enriched customers from backend
  const fetchCustomers = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedSegment !== 'ALL') params.append('segment', selectedSegment);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedDistrict !== 'ALL') params.append('district', selectedDistrict);
      if (search.trim()) params.append('search', search.trim());
      params.append('sortBy', sortBy);

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomersList(data.customers || []);
        if (data.summaries) setSummaries(data.summaries);
      } else {
        fallbackToContextData();
      }
    } catch (e) {
      console.warn('Backend customer API offline, using local context:', e);
      fallbackToContextData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fallback builder
  const fallbackToContextData = () => {
    const enriched: EnrichedCustomer[] = contextCustomers.map((c) => {
      const custOrders = contextOrders.filter(
        (o) =>
          (o.customer?.phone && c.phone && o.customer.phone.replace(/\D/g, '') === c.phone.replace(/\D/g, '')) ||
          (o.customer?.name || '').toLowerCase() === c.name.toLowerCase()
      );
      const deliveredOrders = custOrders.filter((o) => o.orderStatus === 'DELIVERED').length;
      const cancelledOrders = custOrders.filter((o) => o.orderStatus === 'CANCELLED').length;
      const completionRate = custOrders.length > 0 ? Math.round((deliveredOrders / custOrders.length) * 100) : 100;

      let segment: CustomerSegmentType = 'NEW_CUSTOMER';
      if (c.totalSpent >= 15000 && c.totalOrders >= 3) segment = 'CHAMPIONS_VIP';
      else if (c.totalOrders >= 2) segment = 'LOYAL';
      else if (c.totalSpent >= 4000) segment = 'POTENTIAL_LOYALIST';
      else if (c.totalOrders === 1) segment = 'NEW_CUSTOMER';

      const custDistrict = (c as any).district || (c.defaultAddress ? c.defaultAddress.split(',').pop()?.trim() || 'Dhaka' : 'Dhaka');

      return {
        ...c,
        segment,
        rfm: {
          customerId: c.id,
          customerName: c.name,
          phone: c.phone,
          email: c.email,
          district: custDistrict,
          recencyDays: 14,
          frequencyCount: c.totalOrders,
          monetaryTotal: c.totalSpent,
          rScore: 4,
          fScore: c.totalOrders > 2 ? 4 : 2,
          mScore: c.totalSpent > 10000 ? 5 : 3,
          compositeScore: 75,
          segment,
          lastOrderDate: new Date().toISOString(),
          avgOrderValue: Math.round(c.totalSpent / Math.max(1, c.totalOrders)),
          tags: ['VERIFIED_BUYER']
        },
        deliveredOrders,
        cancelledOrders,
        completionRate,
        riskRating: c.status === 'BLOCKED' ? 'HIGH' : cancelledOrders >= 2 ? 'MEDIUM' : 'LOW',
        district: custDistrict,
        tags: ['VERIFIED_BUYER']
      };
    });

    setCustomersList(enriched);
  };

  useEffect(() => {
    fetchCustomers(true);
  }, [selectedSegment, selectedDistrict, selectedRisk, selectedStatus, sortBy]);

  // Client-side search filtering (smooth debounce/instant)
  const filteredCustomers = useMemo(() => {
    return customersList.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q));

      const matchSegment = selectedSegment === 'ALL' || c.segment === selectedSegment;
      const matchRisk = selectedRisk === 'ALL' || c.riskRating === selectedRisk;
      const matchStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
      const matchDistrict = selectedDistrict === 'ALL' || (c.district && c.district.toLowerCase() === selectedDistrict.toLowerCase());

      return matchSearch && matchSegment && matchRisk && matchStatus && matchDistrict;
    });
  }, [customersList, search, selectedSegment, selectedRisk, selectedStatus, selectedDistrict]);

  // Overall KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalCust = customersList.length;
    const activeBuyers = customersList.filter((c) => c.status === 'ACTIVE').length;
    const totalLtv = customersList.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalOrders = customersList.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const avgAov = totalOrders > 0 ? Math.round(totalLtv / totalOrders) : 0;
    const repeatCustCount = customersList.filter((c) => (c.totalOrders || 0) > 1).length;
    const repeatRate = totalCust > 0 ? Math.round((repeatCustCount / totalCust) * 100) : 0;
    const vipCount = customersList.filter((c) => c.segment === 'CHAMPIONS_VIP' || (c.totalSpent || 0) >= 15000).length;
    const highRiskCount = customersList.filter((c) => c.riskRating === 'HIGH' || c.status === 'BLOCKED').length;

    return {
      totalCust,
      activeBuyers,
      totalLtv,
      avgAov,
      repeatRate,
      vipCount,
      highRiskCount
    };
  }, [customersList]);

  // All districts present
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    customersList.forEach((c) => {
      if (c.district) set.add(c.district);
    });
    return Array.from(set);
  }, [customersList]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredCustomers.length === 0) {
      showToast(isBn ? 'এক্সপোর্ট করার মতো কোনো কাস্টমার নেই' : 'No customer records to export');
      return;
    }

    const headers = [
      'Customer ID',
      'Name',
      'Phone',
      'Email',
      'District',
      'Segment',
      'Total Orders',
      'Lifetime Spend (BDT)',
      'Completion Rate (%)',
      'Risk Rating',
      'Status',
      'Joined Date'
    ];

    const rows = filteredCustomers.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      c.email || '',
      c.district || 'Dhaka',
      c.segment || 'NEW_CUSTOMER',
      c.totalOrders,
      c.totalSpent,
      `${c.completionRate || 100}%`,
      c.riskRating || 'LOW',
      c.status,
      c.joinedDate
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kisholoy_crm_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(isBn ? 'সিআরএম গ্রাহক তালিকা সিএসভি ডাউনলোড হয়েছে' : 'Customer CRM data exported to CSV');
  };

  const copyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(isBn ? 'ফোন নম্বর কপি হয়েছে' : 'Phone number copied');
  };

  const cleanPhoneForWa = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '88' + clean;
    if (!clean.startsWith('880')) clean = '880' + clean;
    return clean;
  };

  const getSegmentBadge = (segment?: CustomerSegmentType) => {
    switch (segment) {
      case 'CHAMPIONS_VIP':
        return {
          label: isBn ? 'চ্যাম্পিয়ন ও ভিআইপি' : 'Champions VIP',
          classes: 'bg-amber-100 text-amber-900 border-amber-300'
        };
      case 'LOYAL':
        return {
          label: isBn ? 'বিশ্বস্ত নিয়মিত' : 'Loyal Repeat',
          classes: 'bg-emerald-100 text-emerald-900 border-emerald-300'
        };
      case 'POTENTIAL_LOYALIST':
        return {
          label: isBn ? 'সম্ভাব্য নিয়মিত' : 'Potential Loyalist',
          classes: 'bg-blue-100 text-blue-900 border-blue-300'
        };
      case 'NEW_CUSTOMER':
        return {
          label: isBn ? 'নতুন প্রথমবার' : 'New First-Timer',
          classes: 'bg-purple-100 text-purple-900 border-purple-300'
        };
      case 'AT_RISK':
        return {
          label: isBn ? 'ঝুঁকিপূর্ণ / হারিয়ে যেতে বসা' : 'At-Risk / Lapsing',
          classes: 'bg-rose-100 text-rose-900 border-rose-300'
        };
      case 'HIBERNATING_LAPSED':
        return {
          label: isBn ? 'নিষ্ক্রিয়' : 'Hibernating',
          classes: 'bg-stone-200 text-stone-700 border-stone-300'
        };
      case 'PRICE_SENSITIVE':
        return {
          label: isBn ? 'মূল্য-সংবেদনশীল' : 'Price Sensitive',
          classes: 'bg-orange-100 text-orange-900 border-orange-300'
        };
      default:
        return {
          label: isBn ? 'নিয়মিত ক্রেতা' : 'Customer',
          classes: 'bg-stone-100 text-stone-800 border-stone-200'
        };
    }
  };

  return (
    <div id="customers-admin-container" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-tight">
              {isBn ? 'কাস্টমার ইন্টেলিজেন্স ও সিআরএম' : 'Customer Intelligence & CRM Hub'}
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 uppercase">
              Phase 19 & 360° View
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {isBn
              ? 'গ্রাহকদের আচরণ বিশ্লেষণ, আরএফএম সেগমেন্টেশন, লাইফটাইম ভ্যালু (LTV), এবং যোগাযোগ কন্ট্রোল সেন্টার।'
              : 'Verified customer profiles, behavioral RFM segmentation, lifetime value (LTV), and multi-channel engagement.'}
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchCustomers(false)}
            className="p-2 text-stone-600 hover:text-stone-900 bg-white border border-stone-300 rounded-lg shadow-2xs hover:bg-stone-50 transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-700' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-700 bg-white border border-stone-300 rounded-lg shadow-2xs hover:bg-stone-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>{isBn ? 'সিএসভি ডাউনলোড' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-850 hover:bg-teal-900 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isBn ? 'নতুন কাস্টমার নিবন্ধন' : 'Register Customer'}</span>
          </button>
        </div>
      </div>

      {/* 5-Column High-Impact Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Customers */}
        <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">{isBn ? 'মোট ক্রেতা ভিত্তি' : 'Total Customer Base'}</span>
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <p className="text-xl font-mono font-bold text-stone-900">{metrics.totalCust}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {metrics.activeBuyers} {isBn ? 'সক্রিয় ক্রেতা' : 'Active accounts'}
          </span>
        </div>

        {/* Total LTV */}
        <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">{isBn ? 'মোট রেভিনিউ সম্পদ (LTV)' : 'Customer Asset LTV'}</span>
            <CreditCard className="w-4 h-4 text-teal-700" />
          </div>
          <p className="text-xl font-mono font-bold text-teal-950">৳ {metrics.totalLtv.toLocaleString()}</p>
          <span className="text-[10px] text-stone-400">
            Avg AOV: ৳ {metrics.avgAov.toLocaleString()}
          </span>
        </div>

        {/* Repeat Purchase Rate */}
        <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">{isBn ? 'পুনরাবৃত্তি হার (Repeat)' : 'Repeat Purchase Rate'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-mono font-bold text-emerald-800">{metrics.repeatRate}%</p>
          <span className="text-[10px] text-stone-400">
            {isBn ? 'একাধিক অর্ডারকারী গ্রাহক' : 'Customers with >1 orders'}
          </span>
        </div>

        {/* Champions & VIPs */}
        <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">{isBn ? 'ভিআইপি ও চ্যাম্পিয়ন' : 'VIP & Champions'}</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-mono font-bold text-amber-900">{metrics.vipCount}</p>
          <span className="text-[10px] text-amber-700 font-semibold">
            {isBn ? 'সর্বোচ্চ অর্ডারিং ক্লাস' : 'High AOV Patron class'}
          </span>
        </div>

        {/* High Risk / Blocked */}
        <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">{isBn ? 'সিওডি ঝুঁকি ও স্থগিত' : 'COD Risk / Blocked'}</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-mono font-bold text-rose-800">{metrics.highRiskCount}</p>
          <span className="text-[10px] text-stone-400">
            {isBn ? 'রিটার্ন বা প্রতারণা সতর্কতা' : 'RTO prevention alerts'}
          </span>
        </div>
      </div>

      {/* RFM Segmentation Filter Strip */}
      <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs flex items-center overflow-x-auto gap-1.5 scrollbar-thin">
        <span className="text-[11px] font-bold text-stone-500 px-2 shrink-0 uppercase tracking-wider">
          {isBn ? 'সেগমেন্ট ফিল্টার:' : 'RFM Segment:'}
        </span>

        {[
          { key: 'ALL', labelEn: 'All Customers', labelBn: 'সকল ক্রেতা', count: customersList.length },
          {
            key: 'CHAMPIONS_VIP',
            labelEn: '🏆 Champions & VIP',
            labelBn: '🏆 চ্যাম্পিয়ন ও ভিআইপি',
            count: customersList.filter((c) => c.segment === 'CHAMPIONS_VIP').length
          },
          {
            key: 'LOYAL',
            labelEn: '💎 Loyal Repeat',
            labelBn: '💎 বিশ্বস্ত নিয়মিত',
            count: customersList.filter((c) => c.segment === 'LOYAL').length
          },
          {
            key: 'POTENTIAL_LOYALIST',
            labelEn: '⭐ Potential Loyalist',
            labelBn: '⭐ সম্ভাব্য নিয়মিত',
            count: customersList.filter((c) => c.segment === 'POTENTIAL_LOYALIST').length
          },
          {
            key: 'NEW_CUSTOMER',
            labelEn: '🌱 New Buyers',
            labelBn: '🌱 নতুন প্রথমবার',
            count: customersList.filter((c) => c.segment === 'NEW_CUSTOMER').length
          },
          {
            key: 'AT_RISK',
            labelEn: '⚠️ At Risk',
            labelBn: '⚠️ ঝুঁকিপূর্ণ',
            count: customersList.filter((c) => c.segment === 'AT_RISK').length
          },
          {
            key: 'HIBERNATING_LAPSED',
            labelEn: '💤 Hibernating',
            labelBn: '💤 নিষ্ক্রিয়',
            count: customersList.filter((c) => c.segment === 'HIBERNATING_LAPSED').length
          }
        ].map((tab) => {
          const isSelected = selectedSegment === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedSegment(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-teal-900 text-white shadow-2xs font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>{isBn ? tab.labelBn : tab.labelEn}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-teal-800 text-teal-200' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                isBn
                  ? 'নাম, মোবাইল নম্বর (+880), ইমেইল বা জেলা দিয়ে সার্চ করুন...'
                  : 'Search by customer name, phone (+880), email, or city...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-stone-400 hover:text-stone-600 absolute right-3 top-2.5 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Secondary Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* District Filter */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-teal-800"
            >
              <option value="ALL">{isBn ? 'সকল জেলা (All Districts)' : 'All Districts'}</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Risk Rating Filter */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-teal-800"
            >
              <option value="ALL">{isBn ? 'সকল ঝুঁকি স্তর' : 'All Risk Tiers'}</option>
              <option value="LOW">{isBn ? 'কম ঝুঁকি (Low Risk)' : 'Low Risk'}</option>
              <option value="MEDIUM">{isBn ? 'মাঝারি ঝুঁকি (Medium Risk)' : 'Medium Risk'}</option>
              <option value="HIGH">{isBn ? 'উচ্চ ঝুঁকি (High Risk)' : 'High Risk'}</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-teal-800"
            >
              <option value="ALL">{isBn ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
              <option value="ACTIVE">{isBn ? 'সক্রিয় (Active)' : 'Active Accounts'}</option>
              <option value="BLOCKED">{isBn ? 'স্থগিত (Blocked)' : 'Blocked / Restricted'}</option>
            </select>

            {/* Sorting Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-teal-800"
            >
              <option value="spend-desc">{isBn ? 'কেনাকাটা (বেশি থেকে কম)' : 'Spend (High to Low)'}</option>
              <option value="spend-asc">{isBn ? 'কেনাকাটা (কম থেকে বেশি)' : 'Spend (Low to High)'}</option>
              <option value="orders-desc">{isBn ? 'অর্ডার সংখ্যা (বেশি থেকে কম)' : 'Orders (High to Low)'}</option>
              <option value="name-asc">{isBn ? 'নাম (A - Z)' : 'Name (A to Z)'}</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                {isBn ? 'টেবিল' : 'Table'}
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                {isBn ? 'কার্ড' : 'Cards'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter & Active Filter Pills */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
          <span>
            {isBn ? 'প্রদর্শিত কাস্টমার সংখ্যা:' : 'Showing Customers:'}{' '}
            <strong className="text-stone-900 font-mono">{filteredCustomers.length}</strong> {isBn ? 'জন' : 'profiles'}
          </span>

          {(selectedSegment !== 'ALL' || selectedDistrict !== 'ALL' || selectedRisk !== 'ALL' || selectedStatus !== 'ALL' || search) && (
            <button
              onClick={() => {
                setSelectedSegment('ALL');
                setSelectedDistrict('ALL');
                setSelectedRisk('ALL');
                setSelectedStatus('ALL');
                setSearch('');
              }}
              className="text-[11px] font-semibold text-teal-800 hover:text-teal-950 underline"
            >
              {isBn ? 'সকল ফিল্টার মুছুন' : 'Reset all filters'}
            </button>
          )}
        </div>
      </div>

      {/* Main Customers List Presentation */}
      {loading && customersList.length === 0 ? (
        <div className="p-16 text-center text-stone-500 bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-700" />
          <p className="text-xs font-semibold">
            {isBn ? 'গ্রাহক তথ্য ও আরএফএম সেগমেন্ট বিশ্লেষণ লোড হচ্ছে...' : 'Loading verified customer directory...'}
          </p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-16 text-center text-stone-500 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2">
          <Users className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-sm font-bold text-stone-700">
            {isBn ? 'কোনো গ্রাহক রেকর্ড পাওয়া যায়নি' : 'No matching customer profiles found'}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            {isBn
              ? 'আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
              : 'Try clearing search terms or resetting the segment filters above.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* DESKTOP RESPONSIVE TABLE VIEW */
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/80 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="p-4">{isBn ? 'কাস্টমার পরিচিতি' : 'Customer Info'}</th>
                  <th className="p-4">{isBn ? 'যোগাযোগ ও জেলা' : 'Contact & District'}</th>
                  <th className="p-4">{isBn ? 'আরএফএম সেগমেন্ট' : 'RFM Segment'}</th>
                  <th className="p-4">{isBn ? 'অর্ডার ও সফলতা' : 'Orders & Delivery Rate'}</th>
                  <th className="p-4">{isBn ? 'মোট কেনাকাটা (LTV)' : 'Lifetime Spend'}</th>
                  <th className="p-4">{isBn ? 'নিরাপত্তা ও স্ট্যাটাস' : 'Status & Risk'}</th>
                  <th className="p-4 text-right">{isBn ? 'পদক্ষেপ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredCustomers.map((c) => {
                  const segBadge = getSegmentBadge(c.segment);
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-teal-50/20 transition-colors group cursor-pointer"
                      onClick={() => setInspectCustomerId(c.id)}
                    >
                      {/* Customer Name & Joined */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-900 text-teal-200 flex items-center justify-center font-serif font-black text-xs shrink-0 shadow-2xs">
                            {c.name ? c.name.slice(0, 2).toUpperCase() : 'CU'}
                          </div>
                          <div>
                            <span className="font-bold text-stone-900 block group-hover:text-teal-900 transition-colors">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              ID: {c.id} • {c.joinedDate || '2026-02-14'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & District */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-stone-800 font-semibold">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{c.phone}</span>
                            <button
                              onClick={() => copyPhone(c.phone, c.id)}
                              className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                              title="Copy Phone"
                            >
                              {copiedId === c.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="font-medium text-stone-700">{c.district || 'Dhaka'}</span>
                            {c.email && (
                              <span className="text-stone-400 truncate max-w-[120px]" title={c.email}>
                                • {c.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* RFM Segment Badge */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${segBadge.classes}`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{segBadge.label}</span>
                        </span>
                        {c.rfm?.compositeScore && (
                          <span className="block text-[10px] text-stone-400 font-mono mt-0.5">
                            Score: {c.rfm.compositeScore} / 100
                          </span>
                        )}
                      </td>

                      {/* Orders & Delivery Completion Rate */}
                      <td className="p-4">
                        <span className="font-mono font-bold text-stone-900 block text-xs">
                          {c.totalOrders} {isBn ? 'টি অর্ডার' : 'orders'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                          <Truck className="w-3 h-3" />
                          <span>{c.completionRate || 100}% {isBn ? 'সফল ডেলিভারি' : 'Delivery success'}</span>
                        </div>
                      </td>

                      {/* Lifetime Spend */}
                      <td className="p-4 font-mono font-bold text-teal-950 text-xs">
                        ৳ {(c.totalSpent || 0).toLocaleString()}
                        <span className="block text-[10px] text-stone-400 font-normal">
                          AOV: ৳ {c.rfm?.avgOrderValue || Math.round((c.totalSpent || 0) / Math.max(1, c.totalOrders))}
                        </span>
                      </td>

                      {/* Security Status & Risk */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {c.status === 'ACTIVE' ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{isBn ? 'সক্রিয়' : 'ACTIVE'}</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-2.5 h-2.5 text-rose-600" />
                                <span>{isBn ? 'স্থগিত' : 'BLOCKED'}</span>
                              </>
                            )}
                          </span>

                          <Link
                            to={`/admin/fraud?search=${encodeURIComponent(c.phone)}`}
                            className={`block text-[10px] font-mono font-bold hover:underline ${
                              c.riskRating === 'HIGH'
                                ? 'text-rose-700'
                                : c.riskRating === 'MEDIUM'
                                ? 'text-amber-700'
                                : 'text-stone-400'
                            }`}
                            title={isBn ? 'ফ্রড ইঞ্জিন রেকর্ড দেখুন' : 'Inspect Risk History in Fraud Engine'}
                          >
                            {c.riskRating || 'LOW'} RISK →
                          </Link>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Orders link */}
                          <Link
                            to={`/admin/orders?search=${encodeURIComponent(c.phone)}`}
                            className="p-1.5 text-stone-600 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition-colors"
                            title={isBn ? 'এই কাস্টমারের সকল অর্ডার দেখুন' : 'View Customer Orders'}
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </Link>

                          {/* Fraud alert link */}
                          <Link
                            to={`/admin/fraud?search=${encodeURIComponent(c.phone)}`}
                            className="p-1.5 text-stone-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors"
                            title={isBn ? 'ফ্রড রিস্ক রেকর্ড দেখুন' : 'Check Fraud Risk'}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </Link>

                          {/* WhatsApp Trigger */}
                          <a
                            href={`https://wa.me/${cleanPhoneForWa(c.phone)}?text=${encodeURIComponent(
                              isBn
                                ? `আসসালামু আলাইকুম ${c.name}, কিশলয় (KISHOLOY) থেকে আপনাকে শুভেচ্ছা।`
                                : `Hello ${c.name}, greetings from KISHOLOY.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Direct WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Quick Message Modal Trigger */}
                          <button
                            onClick={() => setMessageCustomer(c)}
                            className="p-1.5 text-teal-800 hover:text-teal-950 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Send SMS / Alert"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* 360 View Profile Trigger */}
                          <button
                            onClick={() => setInspectCustomerId(c.id)}
                            className="px-2.5 py-1 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-stone-500" />
                            <span className="hidden sm:inline">{isBn ? 'প্রোফাইল' : '360°'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MOBILE & COMPACT CARD GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCustomers.map((c) => {
            const segBadge = getSegmentBadge(c.segment);
            return (
              <div
                key={c.id}
                onClick={() => setInspectCustomerId(c.id)}
                className="p-4 rounded-xl border border-stone-200 bg-white hover:border-teal-700 transition-all shadow-2xs space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-900 text-teal-200 flex items-center justify-center font-bold text-xs">
                      {c.name ? c.name.slice(0, 2).toUpperCase() : 'CU'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900 truncate max-w-[140px]">{c.name}</h4>
                      <span className="text-[10px] text-stone-400 font-mono">ID: {c.id}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${segBadge.classes}`}
                  >
                    <span>{segBadge.label}</span>
                  </span>
                </div>

                <div className="space-y-1 text-xs text-stone-700">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {c.phone}
                    </span>
                    <span className="font-semibold text-stone-800">{c.district || 'Dhaka'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                    <span className="text-stone-500">{isBn ? 'অর্ডার:' : 'Orders:'}</span>
                    <span className="font-mono font-bold text-stone-900">{c.totalOrders}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">{isBn ? 'মোট কেনাকাটা:' : 'Lifetime Spend:'}</span>
                    <span className="font-mono font-bold text-teal-950">৳ {(c.totalSpent || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Card Action Row */}
                <div
                  className="flex items-center justify-between pt-2 border-t border-stone-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                    }`}
                  >
                    {c.status}
                  </span>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${cleanPhoneForWa(c.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setMessageCustomer(c)}
                      className="p-1 text-teal-800 hover:bg-teal-50 rounded"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setInspectCustomerId(c.id)}
                      className="text-xs font-bold text-teal-900 hover:underline"
                    >
                      {isBn ? 'বিস্তারিত' : 'View 360°'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer 360° Deep Modal */}
      {inspectCustomerId && (
        <Customer360Modal
          customerId={inspectCustomerId}
          onClose={() => setInspectCustomerId(null)}
          onOpenMessageModal={(c) => setMessageCustomer(c)}
          onCustomerUpdated={() => fetchCustomers(false)}
        />
      )}

      {/* Register Customer Modal */}
      <CreateCustomerModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => fetchCustomers(false)}
      />

      {/* Direct Customer Communication Modal */}
      <CustomerQuickMessageModal
        isOpen={!!messageCustomer}
        onClose={() => setMessageCustomer(null)}
        customer={messageCustomer}
      />
    </div>
  );
}
