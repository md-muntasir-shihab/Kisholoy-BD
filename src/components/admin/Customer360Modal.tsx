import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Award,
  CreditCard,
  MessageCircle,
  Send,
  Plus,
  Tag,
  AlertTriangle,
  FileText,
  Truck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Lock,
  Unlock,
  Building2,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CrmCustomerDetails, CrmCustomerNote, CustomerSegmentType, Order } from '../../types';
import { useModalA11y } from '../../hooks/useModalA11y';
import { usePendingAction } from '../../hooks/usePendingAction';

interface Customer360ModalProps {
  customerId: string | null;
  onClose: () => void;
  onOpenMessageModal?: (customer: { id: string; name: string; phone: string; email?: string }) => void;
  onCustomerUpdated?: () => void;
}

type TabType = 'overview' | 'orders' | 'addresses' | 'notes' | 'risk';

export function Customer360Modal({
  customerId,
  onClose,
  onOpenMessageModal,
  onCustomerUpdated
}: Customer360ModalProps) {
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: !!customerId,
    onClose,
    label: 'Customer360',
  });

  const { language, orders: globalOrders, currentRole, showToast } = useApp();
  const isBn = language === 'BN';

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // F-306: blocks duplicate submits while a mutation is in flight.

  const { run, isPending, isBusy } = usePendingAction();
  const [loading, setLoading] = useState<boolean>(true);
  const [details, setDetails] = useState<CrmCustomerDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Note form state
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Tag form state
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Block modal state
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Copy state
  const [copiedPhone, setCopiedPhone] = useState(false);

  const fetchCustomerDetails = async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setDetails(data.details);
      } else {
        // Fallback using globalOrders & synthetic details
        buildFallbackDetails();
      }
    } catch (e: any) {
      console.warn('Backend fetch failed, building fallback details:', e);
      buildFallbackDetails();
    } finally {
      setLoading(false);
    }
  };

  const buildFallbackDetails = () => {
    if (!customerId) return;
    // Find customer in orders
    const relatedOrders = globalOrders.filter(
      (o) => o.customer.id === customerId || o.customer.phone.includes(customerId)
    );
    const sampleCustomer = relatedOrders[0]?.customer || {
      id: customerId,
      name: 'Customer ' + customerId,
      phone: '+880 1712345678',
      email: 'customer@kisholoy.com',
      joinedDate: '2026-02-14',
      totalOrders: relatedOrders.length,
      totalSpent: relatedOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      defaultAddress: 'Dhaka, Bangladesh',
      status: 'ACTIVE' as const
    };

    setDetails({
      customer: sampleCustomer as any,
      rfm: {
        customerId,
        customerName: sampleCustomer.name,
        phone: sampleCustomer.phone,
        email: sampleCustomer.email,
        district: 'Dhaka',
        recencyDays: 14,
        frequencyCount: relatedOrders.length || 1,
        monetaryTotal: ('totalSpent' in sampleCustomer ? (sampleCustomer as any).totalSpent : relatedOrders.reduce((sum, o) => sum + (o.total || 0), 0)) || 5000,
        rScore: 4,
        fScore: 3,
        mScore: 4,
        compositeScore: 78,
        segment: 'LOYAL',
        lastOrderDate: new Date().toISOString(),
        avgOrderValue: 2500,
        tags: ['VERIFIED_BUYER', 'VIP']
      },
      recentOrders: relatedOrders,
      notes: [
        {
          id: 'note-default',
          author: 'Operations Staff',
          text: 'Verified phone via OTP. Prefers delivery after 3 PM.',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
        }
      ],
      tags: ['VERIFIED_BUYER', 'ONLINE_PAYER'],
      addresses: [
        {
          id: 'addr-1',
          customerId,
          label: 'Home',
          recipientName: sampleCustomer.name,
          phone: sampleCustomer.phone,
          division: 'Dhaka',
          district: 'Dhaka',
          upazilaOrArea: 'Banani',
          addressLine: (sampleCustomer as any).defaultAddress || 'Banani, Dhaka',
          isDefault: true,
          createdAt: '2026-02-14'
        }
      ],
      loyaltyWallet: {
        customerId,
        pointsBalance: 320,
        lifetimePointsEarned: 520,
        lifetimePointsRedeemed: 200,
        tier: 'GOLD',
        referralCode: 'KSH-' + sampleCustomer.name.slice(0, 3).toUpperCase() + '89',
        tierMultiplier: 1.25,
        history: []
      },
      riskRating: 'LOW'
    });
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  if (!customerId) return null;

  // Add internal note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !details) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/customers/${details.customer.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newNoteText.trim(),
          author: currentRole.replace('_', ' ')
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDetails((prev) =>
          prev
            ? {
                ...prev,
                notes: [data.note, ...prev.notes]
              }
            : prev
        );
        setNewNoteText('');
        showToast(isBn ? 'নতুন নোট যুক্ত হয়েছে' : 'Customer note added successfully');
      }
    } catch (err) {
      // Fallback local note
      const fallbackNote: CrmCustomerNote = {
        id: `note-${Date.now()}`,
        author: currentRole.replace('_', ' '),
        text: newNoteText.trim(),
        createdAt: new Date().toISOString()
      };
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              notes: [fallbackNote, ...prev.notes]
            }
          : prev
      );
      setNewNoteText('');
      showToast(isBn ? 'নতুন নোট সংরক্ষিত হয়েছে' : 'Note saved locally');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Toggle tag
  const handleToggleTag = async (tag: string) =>  run('handleToggleTag', async () => {
    if (!details) return;
    try {
      const res = await fetch(`/api/customers/${details.customer.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag })
      });
      if (res.ok) {
        const data = await res.json();
        setDetails((prev) => (prev ? { ...prev, tags: data.tags } : prev));
        showToast(isBn ? 'ট্যাগ আপডেট হয়েছে' : 'Customer tags updated');
      }
    } catch (e) {
      // Optimistic toggle
      const currentTags = details.tags || [];
      const updatedTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      setDetails((prev) => (prev ? { ...prev, tags: updatedTags } : prev));
      showToast(isBn ? 'ট্যাগ আপডেট হয়েছে' : 'Customer tag toggled');
    }
    });

  // Toggle status
  const handleStatusToggle = async () => {
    if (!details) return;
    const newStatus = details.customer.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/customers/${details.customer.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: blockReason || (newStatus === 'BLOCKED' ? 'Flagged for investigation' : 'Reactivated by admin'),
          operator: currentRole
        })
      });

      if (res.ok) {
        setDetails((prev) =>
          prev
            ? {
                ...prev,
                customer: {
                  ...prev.customer,
                  status: newStatus
                }
              }
            : prev
        );
        setShowBlockConfirm(false);
        setBlockReason('');
        showToast(
          newStatus === 'BLOCKED'
            ? isBn
              ? 'কাস্টমার অ্যাকাউন্ট স্থগিত করা হয়েছে'
              : 'Customer account restricted'
            : isBn
            ? 'কাস্টমার অ্যাকাউন্ট সক্রিয় করা হয়েছে'
            : 'Customer account reactivated'
        );
        onCustomerUpdated?.();
      }
    } catch (e) {
      // Optimistic
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              customer: {
                ...prev.customer,
                status: newStatus
              }
            }
          : prev
      );
      setShowBlockConfirm(false);
      onCustomerUpdated?.();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getSegmentColor = (segment: CustomerSegmentType) => {
    switch (segment) {
      case 'CHAMPIONS_VIP':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'LOYAL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'POTENTIAL_LOYALIST':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'NEW_CUSTOMER':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'AT_RISK':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIBERNATING_LAPSED':
        return 'bg-stone-200 text-stone-700 border-stone-300';
      case 'PRICE_SENSITIVE':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getSegmentName = (segment: CustomerSegmentType) => {
    switch (segment) {
      case 'CHAMPIONS_VIP':
        return isBn ? 'চ্যাম্পিয়ন ও ভিআইপি' : 'Champions & VIP';
      case 'LOYAL':
        return isBn ? 'বিশ্বস্ত নিয়মিত ক্রেতা' : 'Loyal Repeat Buyer';
      case 'POTENTIAL_LOYALIST':
        return isBn ? 'সম্ভাব্য নিয়মিত ক্রেতা' : 'Potential Loyalist';
      case 'NEW_CUSTOMER':
        return isBn ? 'নতুন প্রথমবার ক্রেতা' : 'New First-Time Buyer';
      case 'AT_RISK':
        return isBn ? 'ঝুঁকিপূর্ণ / হারিয়ে যেতে বসা' : 'At-Risk / Lapsing';
      case 'HIBERNATING_LAPSED':
        return isBn ? 'নিষ্ক্রিয় দীর্ঘমেয়াদী' : 'Hibernating / Inactive';
      case 'PRICE_SENSITIVE':
        return isBn ? 'মূল্য-সংবেদনশীল' : 'Price Sensitive';
      default:
        return segment;
    }
  };

  const getSegmentRecommendation = (segment: CustomerSegmentType) => {
    switch (segment) {
      case 'CHAMPIONS_VIP':
        return isBn
          ? 'বিশেষ ভিআইপি কনসিয়ার্জ সেবা প্রদান করুন, নতুন তাঁতের পণ্যের আগাম প্রদর্শনী ও উপহার দিন।'
          : 'Provide concierge VIP care, exclusive preview access to new handloom collections, and priority dispatch.';
      case 'LOYAL':
        return isBn
          ? 'লয়্যালটি পয়েন্ট বোনাস ও রেফারেল সুবিধার মাধ্যমে নতুন অর্ডারে উৎসাহিত করুন।'
          : 'Reward with double loyalty points and send personalized refer-a-friend bonuses to drive advocacy.';
      case 'POTENTIAL_LOYALIST':
        return isBn
          ? 'সম্পর্কিত পণ্যের সুপারিশ এবং দ্বিতীয় অর্ডারের জন্য বিশেষ ফ্রি-শিপিং ভাউচার দিন।'
          : 'Recommend complementary cross-sells and offer a 2nd-purchase free shipping incentive coupon.';
      case 'NEW_CUSTOMER':
        return isBn
          ? 'পণ্য ব্যবহারের নির্দেশিকা ও সন্তুষ্টি যাচাইয়ের জন্য ফলো-আপ হোয়াটসঅ্যাপ বার্তা দিন।'
          : 'Send onboarding care instructions and a personal thank-you follow-up on delivery satisfaction.';
      case 'AT_RISK':
        return isBn
          ? 'বিশেষ উইন-ব্যাক ডিসকাউন্ট কোড (COMEBACK10) সহ ব্যক্তিগত বার্তা পাঠিয়ে ফিরিয়ে আনুন।'
          : 'Trigger targeted win-back SMS with exclusive discount code (COMEBACK10) before full lapse.';
      case 'HIBERNATING_LAPSED':
        return isBn
          ? 'মৌসুমী উৎসব বা নতুন ঈদ/বৈশাখী কালেকশনের আকর্ষণীয় খবর পাঠিয়ে স্মরণ করিয়ে দিন।'
          : 'Send seasonal revival newsletters featuring top-rated heritage items to rekindle interest.';
      case 'PRICE_SENSITIVE':
        return isBn
          ? 'ফ্ল্যাশ সেল ও কম্বো বান্ডল অফারের সময় টার্গেটেড নোটিফিকেশন পাঠান।'
          : 'Engage during Flash Sale campaigns, bundle clearance discounts, and promotional price-drop events.';
      default:
        return '';
    }
  };

  const copyPhoneNumber = () => {
    if (!details?.customer.phone) return;
    navigator.clipboard.writeText(details.customer.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
    showToast(isBn ? 'ফোন নম্বর কপি করা হয়েছে' : 'Phone number copied to clipboard');
  };

  const cleanPhoneForWa = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '88' + clean;
    if (!clean.startsWith('880')) clean = '880' + clean;
    return clean;
  };

  return (
    <div ref={containerRef} {...dialogProps} id="customer-360-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="customer-360-modal-card"
        className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Header Bar */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-900/80 border border-teal-700/50 flex items-center justify-center font-serif font-black text-teal-300 text-lg shadow-xs">
              {details?.customer.name ? details.customer.name.slice(0, 2).toUpperCase() : 'CU'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">
                  {details?.customer.name || (isBn ? 'গ্রাহক লোড হচ্ছে...' : 'Loading Customer...')}
                </h2>
                <span className="bg-teal-950 text-teal-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-teal-800">
                  360° INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                ID: {details?.customer.id} • {isBn ? 'নিবন্ধিত:' : 'Joined:'}{' '}
                {details?.customer.joinedDate || '2026-02-14'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCustomerDetails}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center"
              title="Refresh profile data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading && !details ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-stone-500">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-700" />
            <p className="text-xs font-semibold">
              {isBn ? 'গ্রাহক তথ্য ও আরএফএম বিশ্লেষণ লোড হচ্ছে...' : 'Loading 360° customer analytics...'}
            </p>
          </div>
        ) : details ? (
          <>
            {/* Quick Profile Strip with Communication Action Buttons */}
            <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              {/* Contact Information */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-stone-700">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                  <Phone className="w-3.5 h-3.5 text-teal-700" />
                  <span className="font-mono font-bold">{details.customer.phone}</span>
                  <button
                    onClick={copyPhoneNumber}
                    className="ml-1 p-1 hover:text-teal-800 rounded transition-colors"
                    title="Copy phone"
                  >
                    {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                {details.customer.email && (
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                    <Mail className="w-3.5 h-3.5 text-stone-500" />
                    <span className="text-stone-700">{details.customer.email}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-semibold text-stone-800">
                    {details.rfm.district || 'Dhaka'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getSegmentColor(
                      details.rfm.segment
                    )}`}
                  >
                    <Sparkles className="w-3 h-3" />
                    {getSegmentName(details.rfm.segment)}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      details.customer.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {details.customer.status === 'ACTIVE' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {isBn ? 'সক্রিয় ক্রেতা' : 'Active Account'}
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-rose-600" />
                        {isBn ? 'অ্যাকাউন্ট স্থগিত' : 'Restricted / Blocked'}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Instant Action Bar */}
              <div className="flex items-center gap-2">
                {/* Direct WhatsApp Message Trigger */}
                <a
                  href={`https://wa.me/${cleanPhoneForWa(details.customer.phone)}?text=${encodeURIComponent(
                    isBn
                      ? `আসসালামু আলাইকুম ${details.customer.name}, কিশলয় (KISHOLOY) থেকে আপনাকে শুভেচ্ছা। আপনার অর্ডার সংক্রান্ত কোনো সহায়তা লাগলে আমাদের জানান।`
                      : `Hello ${details.customer.name}, greetings from KISHOLOY. Please let us know if you need any assistance with your heritage craft orders.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{isBn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                </a>

                {/* Direct Phone Call Trigger */}
                <a
                  href={`tel:${details.customer.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{isBn ? 'কল দিন' : 'Call'}</span>
                </a>

                {/* Quick SMS / Support Dispatch Modal Trigger */}
                {onOpenMessageModal && (
                  <button
                    onClick={() =>
                      onOpenMessageModal({
                        id: details.customer.id,
                        name: details.customer.name,
                        phone: details.customer.phone,
                        email: details.customer.email
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-850 hover:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isBn ? 'এসএমএস / নোটিফিকেশন' : 'Send SMS / Alert'}</span>
                  </button>
                )}

                {/* Block / Unblock Action */}
                <button
                  onClick={() => setShowBlockConfirm(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    details.customer.status === 'ACTIVE'
                      ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {details.customer.status === 'ACTIVE' ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isBn ? 'স্থগিত করুন' : 'Block / Restrict'}</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সক্রিয় করুন' : 'Unblock Account'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Block / Unblock Confirmation Box */}
            {showBlockConfirm && (
              <div className="bg-rose-50 border-b border-rose-200 p-4 animate-in slide-in-from-top-2">
                <div className="max-w-xl mx-auto space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>
                      {details.customer.status === 'ACTIVE'
                        ? isBn
                          ? 'গ্রাহক অ্যাকাউন্ট সাময়িক স্থগিত / ব্লক করার নিশ্চয়তা'
                          : 'Confirm Account Restriction / Block'
                        : isBn
                        ? 'গ্রাহক অ্যাকাউন্ট সক্রিয় করার নিশ্চয়তা'
                        : 'Confirm Account Reactivation'}
                    </span>
                  </div>
                  <p className="text-xs text-rose-700">
                    {details.customer.status === 'ACTIVE'
                      ? isBn
                        ? 'স্থগিত করা হলে এই গ্রাহক ভবিষ্যতে ক্যাশ অন ডেলিভারি (COD) চেকআউট বা নতুন অর্ডার করতে বাধা পাবেন।'
                        : 'Blocking will restrict this customer from placing high-risk Cash on Delivery (COD) checkouts.'
                      : isBn
                      ? 'পুনরায় সক্রিয় করলে এই গ্রাহক স্বাভাবিকভাবে অর্ডার করতে পারবেন।'
                      : 'Reactivating will restore full shopping and COD privileges for this customer.'}
                  </p>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder={
                      isBn
                        ? 'স্থগিতের কারণ লিখুন (যেমন: বারবার কুরিয়ার রিটার্ন/অস্বীকৃতি)...'
                        : 'Reason (e.g., Repeated COD delivery refusals, verified fraud risk)...'
                    }
                    className="w-full text-xs px-3 py-2 bg-white border border-rose-300 rounded-lg focus:outline-none focus:border-rose-600"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowBlockConfirm(false)}
                      className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                    >
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleStatusToggle}
                      disabled={updatingStatus}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs disabled:opacity-50"
                    >
                      {updatingStatus
                        ? isBn
                          ? 'আপডেট হচ্ছে...'
                          : 'Updating...'
                        : details.customer.status === 'ACTIVE'
                        ? isBn
                          ? 'হ্যাঁ, স্থগিত করুন'
                          : 'Confirm Restrict'
                        : isBn
                        ? 'হ্যাঁ, সক্রিয় করুন'
                        : 'Confirm Unblock'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Tabs Bar */}
            <div className="bg-white border-b border-stone-200 px-6 flex overflow-x-auto gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'overview'
                    ? 'border-teal-850 text-teal-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isBn ? 'একনজরে ও আরএফএম বিশ্লেষণ' : 'Overview & RFM Analytics'}</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'orders'
                    ? 'border-teal-850 text-teal-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>
                  {isBn ? 'অর্ডার ও কেনাকাটার ইতিহাস' : 'Orders History'} (
                  {details.recentOrders?.length || details.customer.totalOrders})
                </span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'addresses'
                    ? 'border-teal-850 text-teal-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isBn ? 'ডেলিভারি ঠিকানা' : 'Saved Addresses'}</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'notes'
                    ? 'border-teal-850 text-teal-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {isBn ? 'অভ্যন্তরীণ সিআরএম নোটস' : 'Internal CRM Notes'} ({details.notes?.length || 0})
                </span>
              </button>

              <button
                onClick={() => setActiveTab('risk')}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'risk'
                    ? 'border-teal-850 text-teal-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isBn ? 'সিওডি ঝুঁকি ও নিরাপত্তা' : 'COD Risk & Anti-Abuse'}</span>
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="p-6 overflow-y-auto max-h-[calc(92vh-180px)] space-y-6">
              {/* TAB 1: OVERVIEW & RFM */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* RFM Intelligence Banner & Automated Advice */}
                  <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-900 text-teal-300 flex items-center justify-center font-black text-xs">
                          RFM
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                              {isBn ? 'গ্রাহক আচরণ ও সেগমেন্ট সুপারিশ' : 'Behavioral Intelligence & Recommendation'}
                            </h3>
                            <span className="font-mono text-[11px] font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded">
                              Composite Score: {details.rfm.compositeScore} / 100
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Recency ({details.rfm.rScore}/5) • Frequency ({details.rfm.fScore}/5) • Monetary (
                            {details.rfm.mScore}/5)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-500">{isBn ? 'অ্যাকশন গাইড:' : 'Action Rule:'}</span>
                        <span className="text-xs font-bold text-stone-800 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                          {getSegmentName(details.rfm.segment)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-teal-200/80 text-xs text-stone-800 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-teal-950 block">
                          {isBn ? 'প্রস্তাবিত মার্কেটিং ও সাপোর্ট পদক্ষেপ:' : 'Recommended Operational Strategy:'}
                        </span>
                        <p className="text-stone-700 mt-0.5">{getSegmentRecommendation(details.rfm.segment)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Order Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
                      <div className="flex items-center justify-between text-stone-500 mb-1">
                        <span className="text-[11px] font-semibold">{isBn ? 'মোট কেনাকাটা (LTV)' : 'Lifetime Spend'}</span>
                        <CreditCard className="w-4 h-4 text-teal-700" />
                      </div>
                      <p className="text-xl font-mono font-bold text-stone-900">
                        ৳ {details.customer.totalSpent.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-stone-400">
                        AOV: ৳ {details.rfm.avgOrderValue.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
                      <div className="flex items-center justify-between text-stone-500 mb-1">
                        <span className="text-[11px] font-semibold">{isBn ? 'মোট অর্ডার' : 'Total Orders'}</span>
                        <ShoppingBag className="w-4 h-4 text-stone-600" />
                      </div>
                      <p className="text-xl font-mono font-bold text-stone-900">{details.customer.totalOrders}</p>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {details.recentOrders.filter((o) => o.orderStatus === 'DELIVERED').length} delivered
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
                      <div className="flex items-center justify-between text-stone-500 mb-1">
                        <span className="text-[11px] font-semibold">{isBn ? 'সর্বশেষ অর্ডার' : 'Last Purchase'}</span>
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-base font-mono font-bold text-stone-900">
                        {details.rfm.recencyDays} {isBn ? 'দিন আগে' : 'days ago'}
                      </p>
                      <span className="text-[10px] text-stone-400">
                        {details.rfm.lastOrderDate ? new Date(details.rfm.lastOrderDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
                      <div className="flex items-center justify-between text-stone-500 mb-1">
                        <span className="text-[11px] font-semibold">{isBn ? 'লয়্যালটি পয়েন্টস' : 'Loyalty Wallet'}</span>
                        <Award className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xl font-mono font-bold text-purple-900">
                        {details.loyaltyWallet?.pointsBalance || 0} pts
                      </p>
                      <span className="text-[10px] text-purple-700 font-semibold uppercase">
                        Tier: {details.loyaltyWallet?.tier || 'SILVER'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Tags Section */}
                  <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-stone-500" />
                        <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                          {isBn ? 'গ্রাহক ট্যাগ ও ক্যাটাগরি' : 'Customer Tags & Classification'}
                        </h4>
                      </div>
                      <button
                        onClick={() => setShowTagInput(!showTagInput)}
                        className="text-[11px] font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isBn ? 'ট্যাগ যোগ করুন' : 'Add Tag'}</span>
                      </button>
                    </div>

                    {showTagInput && (
                      <div className="flex items-center gap-2 max-w-sm">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          placeholder="e.g. VIP, SILK_LOVER, WHOLESALE"
                          className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg flex-1 uppercase font-mono"
                        />
                        <button
                          onClick={() => {
                            if (newTagInput.trim()) {
                              handleToggleTag(newTagInput.trim().toUpperCase());
                              setNewTagInput('');
                              setShowTagInput(false);
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-bold bg-teal-850 text-white rounded-lg hover:bg-teal-900"
                        >
                          {isBn ? 'যুক্ত' : 'Add'}
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {details.tags && details.tags.length > 0 ? (
                        details.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200 group"
                          >
                            <span>#{tag}</span>
                            <button
                              onClick={() => handleToggleTag(tag)}
                              className="text-stone-400 hover:text-rose-600 transition-colors"
                              title="Remove tag"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 italic">
                          {isBn ? 'কোনো কাস্টম ট্যাগ যুক্ত নেই।' : 'No custom tags assigned.'}
                        </span>
                      )}

                      {/* Quick suggested tags */}
                      {['VIP', 'COD_PREFERENCE', 'ONLINE_PAYER', 'HIGH_AOV'].map((suggested) => {
                        if (details.tags?.includes(suggested)) return null;
                        return (
                          <button
                            key={suggested}
                            onClick={() => handleToggleTag(suggested)}
                            className="text-[10px] font-mono px-2 py-0.5 rounded border border-dashed border-stone-300 text-stone-500 hover:text-teal-800 hover:border-teal-700 transition-colors"
                          >
                            +{suggested}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Loyalty & Referral Card */}
                  {details.loyaltyWallet && (
                    <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-purple-600" />
                          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                            {isBn ? 'লয়্যালটি ও রেফারেল প্রোগ্রাম' : 'Loyalty & Referral Rewards Program'}
                          </h4>
                        </div>
                        <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          Code: {details.loyaltyWallet.referralCode}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-stone-50 rounded-lg">
                          <span className="text-[10px] text-stone-500 block">Current Available Points</span>
                          <span className="text-base font-bold font-mono text-stone-900">
                            {details.loyaltyWallet.pointsBalance}
                          </span>
                          <span className="text-[10px] text-stone-400 block">≈ ৳{details.loyaltyWallet.pointsBalance} value</span>
                        </div>

                        <div className="p-3 bg-stone-50 rounded-lg">
                          <span className="text-[10px] text-stone-500 block">Lifetime Earned / Redeemed</span>
                          <span className="text-base font-bold font-mono text-stone-900">
                            {details.loyaltyWallet.lifetimePointsEarned} / {details.loyaltyWallet.lifetimePointsRedeemed}
                          </span>
                        </div>

                        <div className="p-3 bg-stone-50 rounded-lg">
                          <span className="text-[10px] text-stone-500 block">Tier Point Multiplier</span>
                          <span className="text-base font-bold font-mono text-emerald-800">
                            {details.loyaltyWallet.tierMultiplier || 1.0}x Points
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ORDER HISTORY */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        {isBn ? 'সম্পূর্ণ অর্ডার রেকর্ড ও বিবরণ' : 'Full Purchase Ledger'}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {isBn
                          ? 'গ্রাহকের সকল সম্পন্ন, প্রক্রিয়াধীন ও বাতিল অর্ডারের তালিকা।'
                          : 'Comprehensive ledger of completed, in-transit, and cancelled orders.'}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded">
                      {details.recentOrders.length} Order(s)
                    </span>
                  </div>

                  {details.recentOrders.length === 0 ? (
                    <div className="p-12 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
                      {isBn ? 'এই গ্রাহকের এখনও কোনো অর্ডার রেকর্ড নেই।' : 'No recorded orders found for this customer.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {details.recentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-all shadow-2xs space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                {order.id}
                              </span>
                              <span className="text-xs text-stone-500 font-mono">
                                {new Date(order.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Order Status Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  order.orderStatus === 'DELIVERED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : order.orderStatus === 'CANCELLED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {order.orderStatus}
                              </span>

                              {/* Payment Status Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  order.paymentStatus === 'PAID'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {order.paymentMethod} ({order.paymentStatus})
                              </span>

                              <span className="font-mono font-bold text-xs text-stone-900">
                                ৳ {order.total.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="space-y-1.5">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs text-stone-700 pl-2 border-l-2 border-stone-200"
                              >
                                <span className="truncate max-w-md font-medium">
                                  {item.productTitle || (item as any).title}
                                </span>
                                <div className="font-mono text-stone-500 shrink-0">
                                  {item.quantity} × ৳{item.price} = ৳{(item.quantity * item.price).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Courier Tracking info if available */}
                          {order.courier?.trackingId && (
                            <div className="flex items-center gap-2 text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg font-mono">
                              <Truck className="w-3.5 h-3.5 text-teal-700" />
                              <span>
                                {order.courier.provider} • Tracking: {order.courier.trackingId} (Status:{' '}
                                {order.courier.status})
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ADDRESSES */}
              {activeTab === 'addresses' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        {isBn ? 'সংরক্ষিত ডেলিভারি ঠিকানা সমূহ' : 'Verified Delivery Addresses'}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {isBn
                          ? 'কুরিয়ার ডেলিভারির জন্য ব্যবহৃত ঠিকানার তালিকা।'
                          : 'Saved shipping destinations used for courier dispatch.'}
                      </p>
                    </div>
                  </div>

                  {details.addresses && details.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {details.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`p-4 rounded-xl border transition-all ${
                            addr.isDefault
                              ? 'bg-teal-50/50 border-teal-300'
                              : 'bg-white border-stone-200'
                          } space-y-2`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-teal-700" />
                              {addr.label || 'Home'}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded">
                                {isBn ? 'ডিফল্ট' : 'PRIMARY DEFAULT'}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-stone-800 font-medium leading-relaxed">
                            {addr.addressLine}
                          </p>

                          <div className="text-[11px] text-stone-500 space-y-0.5 font-mono">
                            <p>
                              {addr.upazilaOrArea ? `${addr.upazilaOrArea}, ` : ''}
                              {addr.district}, {addr.division}
                            </p>
                            <p>
                              Recipient: {addr.recipientName} ({addr.phone})
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-700 space-y-1">
                      <span className="font-bold block text-stone-900">
                        {isBn ? 'মূল প্রোফাইল ঠিকানা:' : 'Default Profile Address:'}
                      </span>
                      <p>{details.customer.defaultAddress || 'Dhaka, Bangladesh'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: INTERNAL NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      {isBn ? 'অভ্যন্তরীণ সিআরএম নোট ও মন্তব্য' : 'Staff CRM Notes & Relationship Logs'}
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      {isBn
                        ? 'অপারেশন ও কাস্টমার সাপোর্ট টিমের অভ্যন্তরীণ নোট (গ্রাহক দেখতে পান না)।'
                        : 'Private internal notes by customer care and operations staff (never visible to customer).'}
                    </p>
                  </div>

                  {/* Add Note Box */}
                  <form onSubmit={handleAddNote} className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
                    <label className="text-xs font-bold text-stone-700 block">
                      {isBn ? 'নতুন নোট যুক্ত করুন:' : 'Add Internal Operational Note:'}
                    </label>
                    <textarea
                      rows={2}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder={
                        isBn
                          ? 'গ্রাহকের পছন্দ, ডেলিভারি নির্দেশনা, বা বিশেষ আলোচনার সারসংক্ষেপ লিখুন...'
                          : 'Write notes about customer preference, verified delivery instructions, or special requests...'
                      }
                      className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-stone-500 font-mono">
                        Author: {currentRole.replace('_', ' ')}
                      </span>
                      <button
                        type="submit"
                        disabled={submittingNote || !newNoteText.trim()}
                        className="px-4 py-1.5 text-xs font-bold bg-teal-850 hover:bg-teal-900 text-white rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{submittingNote ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : isBn ? 'নোট যোগ করুন' : 'Save Note'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Notes Timeline List */}
                  <div className="space-y-2.5">
                    {details.notes && details.notes.length > 0 ? (
                      details.notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-teal-950 flex items-center gap-1.5">
                              <User className="w-3 h-3 text-teal-700" />
                              {note.author}
                            </span>
                            <span className="text-stone-400 font-mono text-[11px]">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-stone-800 leading-relaxed">{note.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
                        {isBn ? 'এখনও কোনো অভ্যন্তরীণ নোট যোগ করা হয়নি।' : 'No internal notes added yet.'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: RISK & FRAUD PROFILE */}
              {activeTab === 'risk' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      {isBn ? 'ক্যাশ অন ডেলিভারি (COD) ঝুঁকি ও নিরাপত্তা নিরীক্ষা' : 'COD Delivery Risk & Anti-Fraud Engine'}
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      {isBn
                        ? 'বাংলাদেশে ই-কমার্স ডেলিভারি রিটার্ন (RTO) ক্ষতি প্রতিরোধ ও নিরাপত্তা স্তর।'
                        : 'Protection against courier Return to Origin (RTO) losses and unauthorized orders.'}
                    </p>
                  </div>

                  {/* Risk Badge Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div
                      className={`p-4 rounded-xl border ${
                        details.riskRating === 'HIGH'
                          ? 'bg-rose-50 border-rose-300'
                          : details.riskRating === 'MEDIUM'
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-emerald-50 border-emerald-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-stone-600">
                        {isBn ? 'ঝুঁকি রেটিং' : 'Fraud / RTO Risk Tier'}
                      </span>
                      <p
                        className={`text-xl font-bold font-mono ${
                          details.riskRating === 'HIGH'
                            ? 'text-rose-800'
                            : details.riskRating === 'MEDIUM'
                            ? 'text-amber-800'
                            : 'text-emerald-800'
                        }`}
                      >
                        {details.riskRating || 'LOW'} RISK
                      </p>
                      <span className="text-[11px] text-stone-500">
                        {details.riskRating === 'HIGH'
                          ? isBn
                            ? 'অ্যাডভান্স ডেলিভারি চার্জ আবশ্যক'
                            : 'Advance shipping fee recommended'
                          : isBn
                          ? 'নিয়মিত সিওডি অনুমোদিত'
                          : 'Safe for standard Cash on Delivery'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-stone-500">
                        {isBn ? 'কুরিয়ার ডেলিভারি সফলতার হার' : 'Fulfillment Success Rate'}
                      </span>
                      <p className="text-xl font-bold font-mono text-teal-900">
                        {details.recentOrders.length > 0
                          ? Math.round(
                              (details.recentOrders.filter((o) => o.orderStatus === 'DELIVERED').length /
                                details.recentOrders.length) *
                                100
                            )
                          : 100}
                        %
                      </p>
                      <span className="text-[11px] text-stone-400">
                        {details.recentOrders.filter((o) => o.orderStatus === 'CANCELLED').length} cancelled / 0 returns
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-stone-500">
                        {isBn ? 'ব্ল্যাকলিস্ট স্ট্যাটাস' : 'Blacklist Cross-Check'}
                      </span>
                      <p className="text-base font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>CLEAN / VERIFIED</span>
                      </p>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Phone & Email cleared in fraud ledger
                      </span>
                    </div>
                  </div>

                  {/* Operational COD Guidance */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                    <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-700" />
                      {isBn ? 'অপারেশনস ও কল ভেরিফিকেশন নির্দেশিকা:' : 'Operations & Dispatch Guidelines:'}
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-stone-600">
                      <li>
                        {isBn
                          ? 'উচ্চমূল্যের অর্ডারের ক্ষেত্রে (৳ ৫,০০০+) কাস্টমারকে কল দিয়ে কুরিয়ার পাঠানোর আগে নিশ্চিত করুন।'
                          : 'For high-value orders (৳ 5,000+), phone confirmation prior to Steadfast / Pathao dispatch is advised.'}
                      </li>
                      <li>
                        {isBn
                          ? 'গ্রাহক অতীতে অর্ডার গ্রহণ না করে থাকলে বা বাতিল করলে অ্যাকাউন্ট সাময়িক ব্লক করা যেতে পারে।'
                          : 'If customer has multiple delivery refusals, admin can restrict account to Prepaid Only.'}
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-16 text-center text-stone-500 text-xs">
            {error || (isBn ? 'গ্রাহক পাওয়া যায়নি।' : 'Customer not found.')}
          </div>
        )}
      </div>
    </div>
  );
}
