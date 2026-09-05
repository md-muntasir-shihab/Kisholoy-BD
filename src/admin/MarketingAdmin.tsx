/**
 * @file src/admin/MarketingAdmin.tsx
 * @description Phase 19: Marketing Automation, RFM Customer Segmentation, CRM, Abandoned Cart Recovery & Referral Engine
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Target, ShoppingBag, Gift, Megaphone, Send, Sparkles, Radio, 
  Search, Filter, CheckCircle2, AlertTriangle, Clock, RefreshCw, 
  ArrowUpRight, Phone, Mail, MapPin, Tag, Plus, MessageSquare, 
  ShieldAlert, Award, TrendingUp, DollarSign, ChevronRight, X, 
  Copy, ExternalLink, HelpCircle, Eye, Check, Play
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  RfmScore, RfmSegmentSummary, CustomerSegmentType, 
  AbandonedCart, MarketingCampaign, ReferralRecord, ReferralProgramConfig, 
  CrmCustomerDetails, CrmCustomerNote, MarketingChannel, MarketingCampaignType
} from '../types';
import { AdminHelpButton } from '../components/admin/AdminHelpModal';
import { MARKETING_HELP_DATA } from './marketingHelpData';
import { MarketingCommandCenter } from './MarketingCommandCenter';
import { AdminModalShell } from '../components/admin/AdminModalShell';
import { usePendingAction } from '../hooks/usePendingAction';

type ActiveTab = 'SEGMENTS' | 'CARTS' | 'CAMPAIGNS' | 'REFERRALS' | 'CRM' | 'COMMAND';

export function MarketingAdmin() {
  const { language, showToast, logAudit } = useApp();

  // F-306: blocks duplicate submits while a mutation is in flight.
  const { run, isPending, isBusy } = usePendingAction();
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    // Deep-link support: /admin/marketing?tab=command lands directly on the Command Center
    try {
      const t = new URLSearchParams(window.location.search).get('tab');
      if (t && ['SEGMENTS', 'CARTS', 'CAMPAIGNS', 'REFERRALS', 'CRM', 'COMMAND'].includes(t)) return t as ActiveTab;
    } catch {
      /* ignore */
    }
    return 'SEGMENTS';
  });
  const [loading, setLoading] = useState(true);

  // Data states
  const [rfmScores, setRfmScores] = useState<RfmScore[]>([]);
  const [rfmSummaries, setRfmSummaries] = useState<RfmSegmentSummary[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [cartMetrics, setCartMetrics] = useState({
    totalCarts: 0,
    totalAbandonedValue: 0,
    recoveredCount: 0,
    recoveredValue: 0,
    recoveryRatePct: 0
  });
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [campaignMetrics, setCampaignMetrics] = useState({
    totalCampaigns: 0,
    totalAudience: 0,
    totalAttributedRev: 0,
    totalSpend: 0,
    overallRoi: 0
  });
  const [referralRecords, setReferralRecords] = useState<ReferralRecord[]>([]);
  const [referralConfig, setReferralConfig] = useState<ReferralProgramConfig | null>(null);
  const [advocates, setAdvocates] = useState<any[]>([]);
  const [referralMetrics, setReferralMetrics] = useState({
    totalReferrals: 0,
    rewardedCount: 0,
    totalRewardPaid: 0,
    totalReferralGmv: 0
  });

  // Filters & Search
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState<string>('ALL');
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const [cartStatusFilter, setCartStatusFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedCustomerCrm, setSelectedCustomerCrm] = useState<CrmCustomerDetails | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [newTagText, setNewTagText] = useState('');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCartNudgeModal, setShowCartNudgeModal] = useState<AbandonedCart | null>(null);
  const [nudgeStage, setNudgeStage] = useState(1);
  const [nudgeChannel, setNudgeChannel] = useState<'SMS' | 'WHATSAPP' | 'EMAIL'>('SMS');
  const [nudgeCoupon, setNudgeCoupon] = useState('RECOVER5');
  const [nudgeCustomNote, setNudgeCustomNote] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // New Campaign Form State
  const [campaignForm, setCampaignForm] = useState<{
    campaignName: string;
    campaignNameBn: string;
    type: MarketingCampaignType;
    targetSegment: CustomerSegmentType | 'ALL' | 'ABANDONED_CARTS';
    channel: MarketingChannel;
    contentEn: string;
    contentBn: string;
    couponCode: string;
    audienceCount: number;
    costBdt: number;
  }>({
    campaignName: '',
    campaignNameBn: '',
    type: 'FLASH_SALE',
    targetSegment: 'ALL',
    channel: 'SMS',
    contentEn: '',
    contentBn: '',
    couponCode: 'SALE10',
    audienceCount: 150,
    costBdt: 300
  });

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. RFM Segments
      const rfmRes = await fetch('/api/marketing/rfm-segments');
      const rfmData = await rfmRes.json();
      if (rfmData.success) {
        setRfmScores(rfmData.scores);
        setRfmSummaries(rfmData.summaries);
      }

      // 2. Abandoned Carts
      const cartRes = await fetch('/api/marketing/abandoned-carts');
      const cartData = await cartRes.json();
      if (cartData.success) {
        setAbandonedCarts(cartData.carts);
        setCartMetrics(cartData.metrics);
      }

      // 3. Campaigns
      const campRes = await fetch('/api/marketing/campaigns');
      const campData = await campRes.json();
      if (campData.success) {
        setCampaigns(campData.campaigns);
        setCampaignMetrics(campData.metrics);
      }

      // 4. Referrals
      const refRes = await fetch('/api/marketing/referrals');
      const refData = await refRes.json();
      if (refData.success) {
        setReferralRecords(refData.records);
        setReferralConfig(refData.config);
        setAdvocates(refData.advocates);
        setReferralMetrics(refData.metrics);
      }
    } catch (e) {
      console.error('Failed to fetch marketing data', e);
      showToast('Error loading marketing data from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch single customer CRM details
  const viewCustomerCrm = async (customerId: string) => {
    try {
      const res = await fetch(`/api/marketing/customers-crm/${customerId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedCustomerCrm(data.details);
      } else {
        showToast('Customer CRM profile not found');
      }
    } catch (e) {
      showToast('Failed to load CRM details');
    }
  };

  // Add CRM Note
  const handleAddNote = async () =>  run('handleAddNote', async () => {
    if (!selectedCustomerCrm || !newNoteText.trim()) return;
    try {
      const res = await fetch(`/api/marketing/customers-crm/${selectedCustomerCrm.customer.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNoteText.trim(), author: 'Marketing Lead' })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCustomerCrm({
          ...selectedCustomerCrm,
          notes: [data.note, ...selectedCustomerCrm.notes]
        });
        setNewNoteText('');
        showToast('Internal CRM note added');
        logAudit('ADD_CRM_NOTE', 'Marketing', selectedCustomerCrm.customer.id, 'Added internal CRM note');
      }
    } catch (e) {
      showToast('Error saving note');
    }
    });

  // Toggle Customer Tag
  const handleToggleTag = async (tag: string) =>  run('handleToggleTag', async () => {
    if (!selectedCustomerCrm || !tag.trim()) return;
    try {
      const res = await fetch(`/api/marketing/customers-crm/${selectedCustomerCrm.customer.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: tag.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCustomerCrm({
          ...selectedCustomerCrm,
          tags: data.tags
        });
        setNewTagText('');
        showToast(`Tag updated: ${tag.toUpperCase()}`);
        logAudit('UPDATE_CUSTOMER_TAG', 'Marketing', selectedCustomerCrm.customer.id, `Toggled tag ${tag}`);
      }
    } catch (e) {
      showToast('Error updating tag');
    }
    });

  // Dispatch Abandoned Cart Recovery Nudge
  const handleSendCartNudge = async () =>  run('handleSendCartNudge', async () => {
    if (!showCartNudgeModal) return;
    try {
      const res = await fetch(`/api/marketing/abandoned-carts/${showCartNudgeModal.id}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: nudgeStage,
          channel: nudgeChannel,
          incentiveCoupon: nudgeCoupon,
          customNote: nudgeCustomNote
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Recovery nudge dispatched to ${showCartNudgeModal.customerPhone} via ${nudgeChannel}!`);
        setShowCartNudgeModal(null);
        fetchData();
        logAudit('DISPATCH_CART_RECOVERY', 'Marketing', showCartNudgeModal.id, `Sent ${nudgeChannel} recovery nudge`);
      } else {
        showToast(data.error || 'Failed to dispatch nudge');
      }
    } catch (e) {
      showToast('Network error dispatching recovery nudge');
    }
    });

  // Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) =>  run('handleCreateCampaign', async () => {
    e.preventDefault();
    if (!campaignForm.campaignName || !campaignForm.contentEn) {
      showToast('Please fill all required campaign fields');
      return;
    }
    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Marketing campaign scheduled successfully!');
        setShowCampaignModal(false);
        fetchData();
        logAudit('CREATE_CAMPAIGN', 'Marketing', data.campaign.id, `Created campaign ${campaignForm.campaignName}`);
      } else {
        showToast(data.error || 'Failed to create campaign');
      }
    } catch (e) {
      showToast('Network error creating campaign');
    }
    });

  // Dispatch Campaign
  const handleDispatchCampaign = async (campaignId: string) =>  run('handleDispatchCampaign', async () => {
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/dispatch`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
        logAudit('EXECUTE_CAMPAIGN', 'Marketing', campaignId, 'Dispatched marketing campaign');
      } else {
        showToast(data.error || 'Failed to dispatch campaign');
      }
    } catch (e) {
      showToast('Error dispatching campaign');
    }
    });

  // Disburse Referral Reward
  const handleDisburseReferral = async (referralId: string) =>  run('handleDisburseReferral', async () => {
    try {
      const res = await fetch(`/api/marketing/referrals/disburse/${referralId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
        logAudit('DISBURSE_REFERRAL_REWARD', 'Marketing', referralId, 'Disbursed referral reward to advocate');
      } else {
        showToast(data.error || 'Failed to disburse referral reward');
      }
    } catch (e) {
      showToast('Error disbursing reward');
    }
    });

  // Update Referral Config
  const handleUpdateConfig = async (e: React.FormEvent) =>  run('handleUpdateConfig', async () => {
    e.preventDefault();
    if (!referralConfig) return;
    try {
      const res = await fetch('/api/marketing/referrals/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referralConfig)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Referral program settings updated');
        setShowConfigModal(false);
        logAudit('UPDATE_REFERRAL_CONFIG', 'Marketing', 'CONFIG', 'Saved referral parameters');
      }
    } catch (e) {
      showToast('Error updating configuration');
    }
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800">
              Phase 19 Engine
            </span>
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              {language === 'BN' ? 'মার্কেটিং অটোমেশন, সিআরএম ও রেফারেল হাব' : 'Marketing Automation, CRM & Referral Hub'}
            </h1>
            <AdminHelpButton helpData={MARKETING_HELP_DATA.RFM_SEGMENTATION} />
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            {language === 'BN' 
              ? 'আরএফএম সেগমেন্টেশন, পরিত্যক্ত কার্ট রিকভারি, মাল্টি-চ্যানেল ক্যাম্পেইন শিডিউলার এবং দ্বিমুখী রেফারেল গ্রোথ ইঞ্জিন।'
              : 'Algorithmic RFM customer segmentation, automated abandoned cart recovery, multi-channel broadcast scheduler, and double-sided referral engine.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'BN' ? 'রিফ্রেশ ডেটা' : 'Sync Telemetry'}</span>
          </button>
          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'BN' ? 'নতুন ক্যাম্পেইন' : 'New Campaign'}</span>
          </button>
        </div>
      </div>

      {/* Top 5 Primary Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('SEGMENTS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'SEGMENTS' 
              ? 'bg-stone-900 text-white shadow-xs' 
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{language === 'BN' ? 'আরএফএম সেগমেন্টেশন' : 'RFM Segmentation'}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-700 text-white">
            {rfmSummaries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CARTS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'CARTS' 
              ? 'bg-stone-900 text-white shadow-xs' 
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{language === 'BN' ? 'পরিত্যক্ত কার্ট রিকভারি' : 'Abandoned Cart Recovery'}</span>
          {cartMetrics.totalCarts > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-600 text-white">
              {cartMetrics.totalCarts}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('CAMPAIGNS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'CAMPAIGNS' 
              ? 'bg-stone-900 text-white shadow-xs' 
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>{language === 'BN' ? 'মার্কেটিং ক্যাম্পেইন' : 'Broadcast Campaigns'}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-700 text-white">
            {campaigns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('REFERRALS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'REFERRALS' 
              ? 'bg-stone-900 text-white shadow-xs' 
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>{language === 'BN' ? 'রেফারেল ও অ্যাডভোকেট' : 'Referral & Advocates'}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-700 text-white">
            {referralRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CRM')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'CRM' 
              ? 'bg-stone-900 text-white shadow-xs' 
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{language === 'BN' ? 'কাস্টমার ৩৬০° সিআরএম' : 'Customer 360° CRM'}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-700 text-white">
            {rfmScores.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('COMMAND')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'COMMAND' 
              ? 'bg-teal-800 text-white shadow-xs' 
              : 'text-teal-900 hover:bg-teal-50'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>{language === 'BN' ? 'কমান্ড সেন্টার (ROI)' : 'Command Center (ROI)'}</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: RFM SEGMENTATION MATRIX                                        */}
      {/* ===================================================================== */}
      {activeTab === 'SEGMENTS' && (
        <div className="space-y-6">
          {/* Quick Explanation Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  {language === 'BN' ? 'অ্যালগরিদমিক আরএফএম গ্রাহক শ্রেণিবিভাগ' : 'Algorithmic RFM Behavioral Segmentation'}
                </h4>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  {language === 'BN'
                    ? 'গ্রাহকদের ক্রয় ইতিহাস থেকে স্বয়ংক্রিয়ভাবে হিসাবকৃত: R = শেষ অর্ডারের দিন, F = মোট অর্ডারের সংখ্যা, M = সর্বমোট ক্রয়মূল্য (টাকা)।'
                    : 'Dynamically scored from immutable order ledgers: R = Recency (days), F = Frequency (order count), M = Monetary (cumulative BDT spent).'}
                </p>
              </div>
            </div>
            <AdminHelpButton helpData={MARKETING_HELP_DATA.RFM_SEGMENTATION} />
          </div>

          {/* Segment Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rfmSummaries.map((s) => (
              <div 
                key={s.segment}
                className={`p-5 rounded-2xl border transition-all hover:shadow-md bg-white ${s.colorClass.replace('bg-', 'border-')}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.badgeBg}`}>
                    {language === 'BN' ? s.segmentNameBn : s.segmentNameEn}
                  </span>
                  {s.segment === 'CHAMPIONS_VIP' && <AdminHelpButton helpData={MARKETING_HELP_DATA.CHAMPIONS_VIP} />}
                  {s.segment === 'AT_RISK' && <AdminHelpButton helpData={MARKETING_HELP_DATA.AT_RISK_CUSTOMERS} />}
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <div>
                    <span className="text-3xl font-serif font-bold text-stone-900">{s.customerCount}</span>
                    <span className="text-xs text-stone-500 ml-1">buyers ({s.percentageOfBase}%)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-teal-950 block">৳ {s.totalRevenueBdt.toLocaleString()}</span>
                    <span className="text-[10px] text-stone-400">Total GMV</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-600">
                  <span className="font-bold text-stone-700 block mb-1">
                    {language === 'BN' ? 'সুপারিশকৃত পদক্ষেপ:' : 'Recommended Action:'}
                  </span>
                  <p className="line-clamp-2">
                    {language === 'BN' ? s.recommendedActionBn : s.recommendedActionEn}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setCampaignForm({
                      ...campaignForm,
                      campaignName: `${s.segmentNameEn} Exclusive Offer`,
                      targetSegment: s.segment
                    });
                    setShowCampaignModal(true);
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'BN' ? 'ক্যাম্পেইন পাঠান' : 'Target Segment'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ABANDONED CART RECOVERY CENTER                                 */}
      {/* ===================================================================== */}
      {activeTab === 'CARTS' && (
        <div className="space-y-6">
          {/* Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Abandoned</span>
              <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block">{cartMetrics.totalCarts}</span>
              <span className="text-[10px] text-stone-500">Uncompleted checkouts</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Abandoned Value</span>
              <span className="text-2xl font-serif font-bold text-rose-700 mt-1 block">৳ {cartMetrics.totalAbandonedValue.toLocaleString()}</span>
              <span className="text-[10px] text-stone-500">At-risk pipeline</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Recovered Orders</span>
              <span className="text-2xl font-serif font-bold text-emerald-800 mt-1 block">{cartMetrics.recoveredCount}</span>
              <span className="text-[10px] text-emerald-600">Saved by automated nudges</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Recovered GMV</span>
              <span className="text-2xl font-serif font-bold text-teal-950 mt-1 block">৳ {cartMetrics.recoveredValue.toLocaleString()}</span>
              <span className="text-[10px] text-stone-500">Realized bank cash</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Recovery Rate</span>
                <AdminHelpButton helpData={MARKETING_HELP_DATA.ABANDONED_CART_RECOVERY} />
              </div>
              <span className="text-2xl font-serif font-bold text-stone-900 block">{cartMetrics.recoveryRatePct}%</span>
              <span className="text-[10px] text-emerald-600 font-bold">Industry avg: 12-18%</span>
            </div>
          </div>

          {/* Abandoned Carts Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  {language === 'BN' ? 'পরিত্যক্ত চেকআউট সেশন তালিকা' : 'Active Abandoned Cart Sessions'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700">
                  {abandonedCarts.length} Sessions
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={cartStatusFilter}
                  onChange={(e) => setCartStatusFilter(e.target.value)}
                  className="text-xs border border-stone-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-teal-800"
                >
                  <option value="ALL">All Recovery Statuses</option>
                  <option value="ABANDONED">Unrecovered (Pending)</option>
                  <option value="STAGE_1_SENT">Stage 1 Sent</option>
                  <option value="RECOVERED">Recovered (Success)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4">Customer & Contact</th>
                    <th className="p-4">Cart Items & Value</th>
                    <th className="p-4">Drop-off Stage</th>
                    <th className="p-4">Recovery Status</th>
                    <th className="p-4">Last Nudge</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {abandonedCarts
                    .filter(c => cartStatusFilter === 'ALL' || c.recoveryStatus === cartStatusFilter)
                    .map((cart) => (
                      <tr key={cart.id} className="hover:bg-stone-50">
                        <td className="p-4">
                          <span className="font-bold text-stone-900 block">{cart.customerName}</span>
                          <span className="font-mono text-stone-600 text-[11px] block">{cart.customerPhone}</span>
                          <span className="text-stone-400 text-[10px]">{cart.district}, {cart.thana || 'BD'}</span>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            {cart.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="font-bold text-stone-800">{item.quantity}x</span>
                                <span className="text-stone-700 truncate max-w-xs">{item.title}</span>
                              </div>
                            ))}
                            <span className="font-mono font-bold text-teal-950 block text-xs mt-1">
                              ৳ {cart.subtotal.toLocaleString()}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {cart.abandonedStep.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            cart.recoveryStatus === 'RECOVERED' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : cart.recoveryStatus === 'STAGE_1_SENT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {cart.recoveryStatus}
                          </span>
                          {cart.recoveredOrderNumber && (
                            <span className="text-[10px] font-mono font-bold text-emerald-700 block mt-1">
                              Order: {cart.recoveredOrderNumber}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-[11px] text-stone-500">
                          {cart.recoveryHistory.length > 0 ? (
                            <div>
                              <span className="font-bold text-stone-700 block">
                                Stage {cart.recoveryHistory[0].stage} via {cart.recoveryHistory[0].channel}
                              </span>
                              <span className="text-[10px]">
                                {new Date(cart.recoveryHistory[0].sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">No nudges dispatched</span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {cart.recoveryStatus !== 'RECOVERED' ? (
                            <button
                              onClick={() => {
                                setShowCartNudgeModal(cart);
                                setNudgeStage(cart.recoveryStatus === 'STAGE_1_SENT' ? 2 : 1);
                              }}
                              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                            >
                              {language === 'BN' ? 'রিকভারি পাঠান' : 'Send Nudge'}
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-bold text-xs flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Recovered
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: BROADCAST CAMPAIGNS HUB                                        */}
      {/* ===================================================================== */}
      {activeTab === 'CAMPAIGNS' && (
        <div className="space-y-6">
          {/* Campaign KPI Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Campaigns</span>
              <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block">{campaignMetrics.totalCampaigns}</span>
              <span className="text-[10px] text-stone-500">Multi-channel dispatches</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Audience Reached</span>
              <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block">{campaignMetrics.totalAudience.toLocaleString()}</span>
              <span className="text-[10px] text-stone-500">Recipients targeted</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Attributed Revenue</span>
              <span className="text-2xl font-serif font-bold text-teal-950 mt-1 block">৳ {campaignMetrics.totalAttributedRev.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-600 font-bold">Tracked via coupon codes</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Campaign ROI</span>
                <AdminHelpButton helpData={MARKETING_HELP_DATA.CAMPAIGN_BROADCAST_HUB} />
              </div>
              <span className="text-2xl font-serif font-bold text-emerald-700 block">+{campaignMetrics.overallRoi}%</span>
              <span className="text-[10px] text-stone-500">Total Spend: ৳{campaignMetrics.totalSpend}</span>
            </div>
          </div>

          {/* Campaigns List */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                {language === 'BN' ? 'মার্কেটিং ক্যাম্পেইন তালিকা' : 'Broadcast Campaigns'}
              </h3>
              <button
                onClick={() => setShowCampaignModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'BN' ? 'ক্যাম্পেইন তৈরি করুন' : 'Create Campaign'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4">Campaign Title</th>
                    <th className="p-4">Target & Channel</th>
                    <th className="p-4">Message Preview</th>
                    <th className="p-4">Audience & Clicks</th>
                    <th className="p-4">Attributed Sales</th>
                    <th className="p-4">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-stone-50">
                      <td className="p-4">
                        <span className="font-bold text-stone-900 block">{c.campaignName}</span>
                        <span className="text-stone-500 text-[11px] block">{c.campaignNameBn}</span>
                        <span className="text-stone-400 text-[10px]">
                          Created: {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200 block w-fit mb-1">
                          {c.targetSegment}
                        </span>
                        <span className="font-mono text-[10px] text-teal-800 font-bold block">
                          Channel: {c.channel}
                        </span>
                        {c.couponCode && (
                          <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-1 rounded border border-amber-200 block w-fit mt-0.5">
                            Coupon: {c.couponCode}
                          </span>
                        )}
                      </td>

                      <td className="p-4 max-w-xs">
                        <p className="text-stone-700 text-[11px] line-clamp-2 italic">
                          "{language === 'BN' ? c.contentBn : c.contentEn}"
                        </p>
                      </td>

                      <td className="p-4">
                        <span className="font-mono font-bold text-stone-800 block">
                          {c.deliveredCount} / {c.audienceCount} delivered
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          {c.clicksCount} clicks ({c.deliveredCount > 0 ? Math.round((c.clicksCount / c.deliveredCount) * 100) : 0}%)
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-mono font-bold text-teal-950 block">
                          ৳ {c.attributedRevenue.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-bold block">
                          {c.attributedOrders} orders (+{c.roi}% ROI)
                        </span>
                      </td>

                      <td className="p-4">
                        {c.status === 'COMPLETED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDispatchCampaign(c.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            <span>{language === 'BN' ? 'চালান' : 'Dispatch Now'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: REFERRAL & ADVOCATE ENGINE                                     */}
      {/* ===================================================================== */}
      {activeTab === 'REFERRALS' && (
        <div className="space-y-6">
          {/* Top Performance & Anti-Fraud Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Referrals</span>
              <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block">{referralMetrics.totalReferrals}</span>
              <span className="text-[10px] text-stone-500">Invitations logged</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Rewards Disbursed</span>
              <span className="text-2xl font-serif font-bold text-emerald-800 mt-1 block">৳ {referralMetrics.totalRewardPaid.toLocaleString()}</span>
              <span className="text-[10px] text-stone-500">{referralMetrics.rewardedCount} successful deliveries</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Referral GMV</span>
              <span className="text-2xl font-serif font-bold text-teal-950 mt-1 block">৳ {referralMetrics.totalReferralGmv.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-600 font-bold">First-order revenue</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Rules & Security</span>
                <AdminHelpButton helpData={MARKETING_HELP_DATA.REFERRAL_PROGRAM_CONFIG} />
              </div>
              <button
                onClick={() => setShowConfigModal(true)}
                className="mt-2 text-xs font-bold text-teal-800 hover:text-teal-950 underline text-left"
              >
                {language === 'BN' ? 'কনফিগারেশন ও অ্যান্টি-ফ্রড' : 'Configure Rules & Fraud Guard'}
              </button>
              <span className="text-[10px] text-stone-400">Referrer: ৳{referralConfig?.referrerRewardAmount} / Referee: ৳{referralConfig?.refereeRewardAmount}</span>
            </div>
          </div>

          {/* Top Brand Advocates Leaderboard */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  {language === 'BN' ? 'শীর্ষ ব্র্যান্ড অ্যাম্বাসেডর ও রেফারার লিডারবোর্ড' : 'Top Brand Advocate Leaderboard'}
                </h3>
              </div>
              <span className="text-xs text-stone-500">Ranked by qualified orders</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {advocates.map((adv, idx) => (
                <div key={adv.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-stone-900 text-xs block">{adv.name}</span>
                      <span className="font-mono text-stone-500 text-[10px] block">{adv.code}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-800 text-xs block">{adv.successfulReferrals} referrals</span>
                    <span className="text-[10px] text-stone-500">৳ {adv.totalGmv.toLocaleString()} GMV</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Ledger Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  {language === 'BN' ? 'রেফারেল ট্র্যাকিং লেজার' : 'Referral Attribution Ledger'}
                </h3>
                <AdminHelpButton helpData={MARKETING_HELP_DATA.ANTI_FRAUD_SELF_REFERRAL} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4">Referrer (Advocate)</th>
                    <th className="p-4">Referee (Invitee)</th>
                    <th className="p-4">Order Value</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Anti-Fraud Inspection</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {referralRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50">
                      <td className="p-4">
                        <span className="font-bold text-stone-900 block">{r.referrerName}</span>
                        <span className="font-mono text-stone-600 text-[11px] block">{r.referrerPhone}</span>
                        <span className="font-mono text-amber-800 text-[10px] bg-amber-50 px-1 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                          {r.referralCode}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-stone-800 block">{r.refereeName}</span>
                        <span className="font-mono text-stone-600 text-[11px] block">{r.refereePhone}</span>
                        {r.refereeOrderNumber && (
                          <span className="font-mono text-teal-800 text-[10px] block">
                            Order: {r.refereeOrderNumber}
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono font-bold text-stone-900">
                        {r.orderAmount ? `৳ ${r.orderAmount.toLocaleString()}` : '—'}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          r.status === 'REWARDED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'FRAUD_REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      <td className="p-4 max-w-xs text-[11px] text-stone-600">
                        {r.fraudCheckNotes || 'Passed address and device verification'}
                      </td>

                      <td className="p-4 text-right">
                        {r.status === 'ORDER_PLACED' && !r.referrerRewardClaimed && (
                          <button
                            onClick={() => handleDisburseReferral(r.id)}
                            className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                          >
                            {language === 'BN' ? 'রিওয়ার্ড দিন' : 'Disburse ৳150'}
                          </button>
                        )}
                        {r.status === 'REWARDED' && (
                          <span className="text-emerald-700 font-bold text-xs flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" /> Disbursed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: CUSTOMER 360° CRM EXPLORER                                     */}
      {/* ===================================================================== */}
      {activeTab === 'CRM' && (
        <div className="space-y-6">
          {/* Search & Segment Filter */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder={language === 'BN' ? 'নাম, ফোন নম্বর বা জেলা খুঁজুন...' : 'Search by name, phone, or district...'}
                value={crmSearchQuery}
                onChange={(e) => setCrmSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={selectedSegmentFilter}
                  onChange={(e) => setSelectedSegmentFilter(e.target.value)}
                  className="text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-teal-800"
                >
                  <option value="ALL">All RFM Segments</option>
                  <option value="CHAMPIONS_VIP">Champions & VIP</option>
                  <option value="LOYAL">Loyal Repeat</option>
                  <option value="POTENTIAL_LOYALIST">Potential Loyalist</option>
                  <option value="NEW_CUSTOMER">New First-Time</option>
                  <option value="AT_RISK">At-Risk Churn</option>
                  <option value="HIBERNATING_LAPSED">Hibernating / Lapsed</option>
                  <option value="PRICE_SENSITIVE">Price Sensitive</option>
                </select>
              </div>
              <AdminHelpButton helpData={MARKETING_HELP_DATA.CUSTOMER_CRM_360} />
            </div>
          </div>

          {/* CRM Customers Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Contact & Location</th>
                    <th className="p-4">RFM Segment</th>
                    <th className="p-4">Recency / Frequency</th>
                    <th className="p-4">Lifetime Spend (LTV)</th>
                    <th className="p-4">Tags</th>
                    <th className="p-4 text-right">CRM Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {rfmScores
                    .filter((s) => {
                      const matchesSeg = selectedSegmentFilter === 'ALL' || s.segment === selectedSegmentFilter;
                      const q = crmSearchQuery.toLowerCase();
                      const matchesSearch = !q || s.customerName.toLowerCase().includes(q) || s.phone.includes(q) || s.district.toLowerCase().includes(q);
                      return matchesSeg && matchesSearch;
                    })
                    .map((s) => (
                      <tr key={s.customerId} className="hover:bg-stone-50">
                        <td className="p-4 font-bold text-stone-900">
                          {s.customerName}
                        </td>

                        <td className="p-4">
                          <span className="font-mono text-stone-800 block">{s.phone}</span>
                          <span className="text-stone-400 text-[11px] block">{s.district}, Bangladesh</span>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200">
                            {s.segment}
                          </span>
                        </td>

                        <td className="p-4 text-[11px]">
                          <span className="font-bold text-stone-800 block">{s.frequencyCount} order(s)</span>
                          <span className="text-stone-500 text-[10px]">{s.recencyDays} days ago</span>
                        </td>

                        <td className="p-4 font-mono font-bold text-teal-950">
                          ৳ {s.monetaryTotal.toLocaleString()}
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {s.tags.slice(0, 2).map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-stone-100 text-stone-600">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => viewCustomerCrm(s.customerId)}
                            className="flex items-center gap-1 ml-auto px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{language === 'BN' ? 'বিস্তারিত প্রোফাইল' : 'View 360°'}</span>
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

      {/* ===================================================================== */}
      {/* TAB 6: MARKETING COMMAND CENTER (Spend ledger, Attribution & ROI)      */}
      {/* ===================================================================== */}
      {activeTab === 'COMMAND' && <MarketingCommandCenter />}

      {/* ===================================================================== */}
      {/* MODAL: CUSTOMER 360° DRAWER                                          */}
      {/* ===================================================================== */}
      <AdminModalShell
        open={!!selectedCustomerCrm}
        onClose={() => setSelectedCustomerCrm(null)}
        label=""
        overlayClassName="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-end"
      >
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  Customer 360° Intelligence
                </span>
                <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">
                  {selectedCustomerCrm.customer.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCustomerCrm(null)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Profile Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Total Spend</span>
                <span className="text-base font-mono font-bold text-teal-950">৳ {selectedCustomerCrm.rfm.monetaryTotal.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Total Orders</span>
                <span className="text-base font-mono font-bold text-stone-900">{selectedCustomerCrm.rfm.frequencyCount}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">RFM Segment</span>
                <span className="text-xs font-bold text-stone-800">{selectedCustomerCrm.rfm.segment}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Loyalty Points</span>
                <span className="text-base font-mono font-bold text-amber-700">{selectedCustomerCrm.loyaltyWallet?.pointsBalance || 0} pts</span>
              </div>
            </div>

            {/* Contact & Address */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-stone-700">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-mono font-bold">{selectedCustomerCrm.customer.phone}</span>
              </div>
              {selectedCustomerCrm.customer.email && (
                <div className="flex items-center gap-2 text-stone-700">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span>{selectedCustomerCrm.customer.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-stone-700">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{selectedCustomerCrm.customer.address ? `${selectedCustomerCrm.customer.address}, ${selectedCustomerCrm.customer.district}` : 'Dhaka, Bangladesh'}</span>
              </div>
            </div>

            {/* Tags Management */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">Behavioral & Priority Tags</h4>
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedCustomerCrm.tags.map((t) => (
                  <span key={t} className="px-2 py-1 rounded-md text-[11px] font-bold bg-stone-100 text-stone-700 flex items-center gap-1">
                    {t}
                    <button onClick={() => handleToggleTag(t)} className="hover:text-rose-600">×</button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="New Tag..."
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    className="text-xs border border-stone-300 rounded px-2 py-1 w-24"
                  />
                  <button
                    onClick={() => handleToggleTag(newTagText)}
                    className="px-2 py-1 bg-stone-800 text-white rounded text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Internal Staff Notes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Internal Operational Notes</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type note (e.g. customer prefers evening delivery, corporate buyer)..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 text-xs border border-stone-300 rounded-lg px-3 py-2"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold"
                >
                  Add Note
                </button>
              </div>

              <div className="space-y-2 mt-2">
                {selectedCustomerCrm.notes.map((n) => (
                  <div key={n.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                    <p className="text-stone-800">{n.text}</p>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                      <span>By: {n.author}</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders Timeline */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">Order History</h4>
              <div className="space-y-2">
                {selectedCustomerCrm.recentOrders.map((o) => (
                  <div key={o.id} className="p-3 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-stone-900 block">{o.orderNumber}</span>
                      <span className="text-[10px] text-stone-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-teal-950 block">৳ {o.grandTotal.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-emerald-700">{o.orderStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </AdminModalShell>

      {/* ===================================================================== */}
      {/* MODAL: CART RECOVERY NUDGE                                            */}
      {/* ===================================================================== */}
      <AdminModalShell
        open={!!showCartNudgeModal}
        onClose={() => setShowCartNudgeModal(false)}
        label=""
        overlayClassName="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                {language === 'BN' ? 'পরিত্যক্ত কার্ট রিকভারি বার্তা পাঠান' : 'Dispatch Cart Recovery Nudge'}
              </h3>
              <button onClick={() => setShowCartNudgeModal(null)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Customer:</span>
                <span className="font-bold text-stone-900">{showCartNudgeModal.customerName} ({showCartNudgeModal.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Cart Total:</span>
                <span className="font-mono font-bold text-teal-950">৳ {showCartNudgeModal.subtotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Communication Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['SMS', 'WHATSAPP', 'EMAIL'] as const).map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setNudgeChannel(ch)}
                      className={`py-1.5 rounded-lg font-bold text-xs border ${
                        nudgeChannel === ch ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-700 border-stone-300'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Incentive Coupon Code</label>
                <input
                  type="text"
                  value={nudgeCoupon}
                  onChange={(e) => setNudgeCoupon(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg p-2 font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Custom Message / Notes</label>
                <textarea
                  rows={3}
                  value={nudgeCustomNote}
                  onChange={(e) => setNudgeCustomNote(e.target.value)}
                  placeholder="Leave empty for automated standard template with 1-click recovery URL..."
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowCartNudgeModal(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCartNudge}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Dispatch Nudge
              </button>
            </div>
          </div>
      </AdminModalShell>

      {/* ===================================================================== */}
      {/* MODAL: CREATE CAMPAIGN                                                */}
      {/* ===================================================================== */}
      <AdminModalShell
        open={!!showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        label=""
        overlayClassName="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
          <form onSubmit={handleCreateCampaign} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                {language === 'BN' ? 'নতুন মার্কেটিং ক্যাম্পেইন শিডিউলার' : 'Schedule Marketing Campaign'}
              </h3>
              <button type="button" onClick={() => setShowCampaignModal(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Campaign Name (English)</label>
                  <input
                    type="text"
                    required
                    value={campaignForm.campaignName}
                    onChange={(e) => setCampaignForm({ ...campaignForm, campaignName: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2"
                    placeholder="e.g. Pohela Boishakh Saree Preview"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Campaign Name (Bangla)</label>
                  <input
                    type="text"
                    value={campaignForm.campaignNameBn}
                    onChange={(e) => setCampaignForm({ ...campaignForm, campaignNameBn: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2"
                    placeholder="বাংলা নাম..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Target Segment</label>
                  <select
                    value={campaignForm.targetSegment}
                    onChange={(e) => setCampaignForm({ ...campaignForm, targetSegment: e.target.value as any })}
                    className="w-full border border-stone-300 rounded-lg p-2 bg-white"
                  >
                    <option value="ALL">All Buyers</option>
                    <option value="CHAMPIONS_VIP">Champions VIP</option>
                    <option value="LOYAL">Loyal Repeat</option>
                    <option value="AT_RISK">At-Risk Churn</option>
                    <option value="ABANDONED_CARTS">Abandoned Carts</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Channel</label>
                  <select
                    value={campaignForm.channel}
                    onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value as any })}
                    className="w-full border border-stone-300 rounded-lg p-2 bg-white"
                  >
                    <option value="SMS">SMS (Banglalink / GP)</option>
                    <option value="WHATSAPP">WhatsApp Cloud API</option>
                    <option value="EMAIL">Email Newsletter</option>
                    <option value="MULTI_CHANNEL">Multi-Channel Blast</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Message Body (English)</label>
                <textarea
                  rows={2}
                  required
                  value={campaignForm.contentEn}
                  onChange={(e) => setCampaignForm({ ...campaignForm, contentEn: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Message Body (বাংলা ইউনিকোড)</label>
                <textarea
                  rows={2}
                  value={campaignForm.contentBn}
                  onChange={(e) => setCampaignForm({ ...campaignForm, contentBn: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Character count: {campaignForm.contentBn.length} chars (Unicode 70-char SMS page limit).
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Attribution Coupon</label>
                  <input
                    type="text"
                    value={campaignForm.couponCode}
                    onChange={(e) => setCampaignForm({ ...campaignForm, couponCode: e.target.value.toUpperCase() })}
                    className="w-full border border-stone-300 rounded-lg p-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Estimated Budget (BDT)</label>
                  <input
                    type="number"
                    value={campaignForm.costBdt}
                    onChange={(e) => setCampaignForm({ ...campaignForm, costBdt: Number(e.target.value) })}
                    className="w-full border border-stone-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowCampaignModal(false)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Save & Schedule
              </button>
            </div>
          </form>
      </AdminModalShell>

      {/* ===================================================================== */}
      {/* MODAL: REFERRAL CONFIGURATION                                         */}
      {/* ===================================================================== */}
      <AdminModalShell
        open={!!(showConfigModal && referralConfig)}
        onClose={() => setShowConfigModal(false)}
        label=""
        overlayClassName="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
          <form onSubmit={handleUpdateConfig} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                {language === 'BN' ? 'রেফারেল ও অ্যান্টি-ফ্রড সেটিংস' : 'Referral Program & Anti-Abuse Rules'}
              </h3>
              <button type="button" onClick={() => setShowConfigModal(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Referrer Reward (Advocate Store Credit)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-500 font-bold">৳</span>
                  <input
                    type="number"
                    value={referralConfig.referrerRewardAmount}
                    onChange={(e) => setReferralConfig({ ...referralConfig, referrerRewardAmount: Number(e.target.value) })}
                    className="w-full border border-stone-300 rounded-lg pl-8 pr-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Referee Discount (New Buyer Incentive)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-500 font-bold">৳</span>
                  <input
                    type="number"
                    value={referralConfig.refereeRewardAmount}
                    onChange={(e) => setReferralConfig({ ...referralConfig, refereeRewardAmount: Number(e.target.value) })}
                    className="w-full border border-stone-300 rounded-lg pl-8 pr-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Minimum Order Value for Qualification</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-500 font-bold">৳</span>
                  <input
                    type="number"
                    value={referralConfig.refereeMinOrderValue}
                    onChange={(e) => setReferralConfig({ ...referralConfig, refereeMinOrderValue: Number(e.target.value) })}
                    className="w-full border border-stone-300 rounded-lg pl-8 pr-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={referralConfig.preventSelfReferral}
                    onChange={(e) => setReferralConfig({ ...referralConfig, preventSelfReferral: e.target.checked })}
                    className="rounded text-emerald-800 focus:ring-emerald-700"
                  />
                  <span className="font-bold text-stone-800">
                    {language === 'BN' ? 'সেলফ-রেফারেল ও অপব্যবহার প্রতিরোধ সক্রিয় রাখুন' : 'Enforce Anti-Fraud Self-Referral Prevention'}
                  </span>
                </label>
                <p className="text-[10px] text-stone-500 mt-1 pl-6">
                  Prevents identical phone numbers, duplicate IP subnets, or identical shipping addresses from earning rewards.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </form>
      </AdminModalShell>
    </div>
  );
}
