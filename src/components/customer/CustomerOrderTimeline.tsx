import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, Clock, Truck, Package, MapPin, RefreshCw, 
  Copy, Check, AlertTriangle, ExternalLink, ShieldCheck, 
  ArrowRight, Phone, User, Calendar, Sparkles, AlertCircle, RotateCcw
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';

interface CustomerOrderTimelineProps {
  order: Order;
  language?: 'EN' | 'BN';
  onOrderUpdated?: (updatedOrder: Order) => void;
  showFullDetailsInitially?: boolean;
}

export function CustomerOrderTimeline({
  order: initialOrder,
  language = 'BN',
  onOrderUpdated,
  showFullDetailsInitially = false
}: CustomerOrderTimelineProps) {
  const [currentOrder, setCurrentOrder] = useState<Order>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [showFullTimeline, setShowFullTimeline] = useState(showFullDetailsInitially);
  const [courierRider, setCourierRider] = useState<{ name?: string; phone?: string; hub?: string } | null>(null);

  const isBn = language === 'BN';
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if prop changes
  useEffect(() => {
    setCurrentOrder(initialOrder);
  }, [initialOrder]);

  // Real-time backend status polling
  const syncLatestStatus = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      // 1. Fetch order directly from server API
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(currentOrder.orderNumber)}&phone=${encodeURIComponent(currentOrder.customer.phone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          setCurrentOrder(data.order);
          if (onOrderUpdated) onOrderUpdated(data.order);
        }
      }

      // 2. Fetch live courier details if consignment exists
      if (currentOrder.courier?.trackingId || currentOrder.courier?.consignmentId) {
        const cRes = await fetch(`/api/courier/track/${encodeURIComponent(currentOrder.id)}`);
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.success && cData.tracking?.courierRider) {
            setCourierRider(cData.tracking.courierRider);
          }
        }
      }

      setLastSyncedTime(new Date());
    } catch (err) {
      console.warn('Real-time timeline polling warning:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Poll backend every 12 seconds for real-time status updates
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      syncLatestStatus(true);
    }, 12000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [currentOrder.id, currentOrder.orderNumber]);

  // Stepper milestones definition
  const milestones: {
    status: OrderStatus;
    label: string;
    labelBn: string;
    desc: string;
    descBn: string;
  }[] = [
    {
      status: 'PENDING',
      label: 'Order Placed',
      labelBn: 'অর্ডার জমা হয়েছে',
      desc: 'Received & logged in Kisholoy system',
      descBn: 'অর্ডার সিস্টেমে সফলভাবে সংরক্ষিত হয়েছে'
    },
    {
      status: 'CONFIRMED',
      label: 'Order Confirmed',
      labelBn: 'অর্ডার নিশ্চিতকরণ',
      desc: 'Verified by Kisholoy team',
      descBn: 'কল/অ্যাডভান্স মাধ্যমে অর্ডার নিশ্চিত করা হয়েছে'
    },
    {
      status: 'PROCESSING',
      label: 'Packaging & QC',
      labelBn: 'প্যাকেজিং ও কোয়ালিটি চেক',
      desc: 'Items gathered, inspected & packed',
      descBn: 'পণ্য যাচাই ও স্পেশাল প্যাকেজিং সম্পন্ন'
    },
    {
      status: 'SHIPPED',
      label: 'In Transit',
      labelBn: 'কুরিয়ারে হস্তান্তর',
      desc: 'Handed over to courier partner',
      descBn: 'কুরিয়ার সেন্ট্রাল হাবে ট্রানজিটে রয়েছে'
    },
    {
      status: 'OUT_FOR_DELIVERY',
      label: 'Out for Delivery',
      labelBn: 'ডেলিভারির জন্য রওয়ানা',
      desc: 'Assigned to local delivery rider',
      descBn: 'রাইডার পণ্য নিয়ে গ্রাহকের ঠিকানার পথে'
    },
    {
      status: 'DELIVERED',
      label: 'Delivered',
      labelBn: 'ডেলিভারি সম্পন্ন',
      desc: 'Handed to customer & COD settled',
      descBn: 'গ্রাহকের নিকট পার্সেল পৌঁছানো সম্পন্ন'
    }
  ];

  // Helper to figure out step state
  const getStepState = (milestoneStatus: OrderStatus, currentStatus: OrderStatus) => {
    if (currentStatus === 'CANCELLED') return 'cancelled';
    if (currentStatus === 'RETURNED' || currentStatus === 'RETURN_REQUESTED') return 'returned';

    const orderHierarchy: Record<string, number> = {
      'PENDING': 0,
      'CONFIRMED': 1,
      'PROCESSING': 2,
      'READY_TO_SHIP': 2,
      'SHIPPED': 3,
      'IN_TRANSIT': 3,
      'OUT_FOR_DELIVERY': 4,
      'DELIVERED': 5,
      'COMPLETED': 5
    };

    const currentIdx = orderHierarchy[currentStatus] ?? 0;
    const milestoneIdx = orderHierarchy[milestoneStatus] ?? 0;

    if (currentIdx > milestoneIdx) return 'completed';
    if (currentIdx === milestoneIdx) return 'current';
    return 'upcoming';
  };

  // Helper for status badge style
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          text: isBn ? 'ডেলিভারি সম্পন্ন' : 'Delivered'
        };
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          text: isBn ? 'কুরিয়ার ট্রানজিট' : 'In Transit'
        };
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'READY_TO_SHIP':
        return {
          bg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
          text: isBn ? 'প্রসেসিং হচ্ছে' : 'Processing'
        };
      case 'CANCELLED':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          text: isBn ? 'অর্ডার বাতিল' : 'Cancelled'
        };
      case 'RETURNED':
      case 'RETURN_REQUESTED':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          text: isBn ? 'রিটার্ন প্রসেসড' : 'Returned'
        };
      default:
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          text: isBn ? 'অপেক্ষমাণ' : 'Pending'
        };
    }
  };

  const currentBadge = getStatusBadge(currentOrder.orderStatus);

  // Derive chronology from order timeline array or build fallback
  const timelineEvents = (currentOrder.timeline && currentOrder.timeline.length > 0)
    ? currentOrder.timeline
    : [
        {
          status: currentOrder.orderStatus,
          timestamp: currentOrder.createdAt,
          note: isBn ? 'অর্ডার সিস্টেমে সংরক্ষিত হয়েছে' : 'Order successfully placed in Kisholoy database',
          updatedBy: 'SYSTEM'
        }
      ];

  return (
    <div className="bg-stone-50/80 dark:bg-slate-900/80 rounded-2xl border border-stone-200 dark:border-slate-800 p-4 sm:p-5 space-y-5 transition-colors">
      {/* 1. Header with Real-time Status Badge & Live Polling Control */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-stone-900 dark:text-slate-100 text-sm">
                {isBn ? 'লাইভ অর্ডার টাইমলাইন' : 'Live Order Timeline'}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isBn ? 'লাইভ সিঙ্ক' : 'LIVE AUTO-SYNC'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-slate-400">
              {isBn ? `শেষ সিঙ্ক: ${lastSyncedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : `Last polled: ${lastSyncedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => syncLatestStatus(false)}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
            title="Fetch real-time updates directly from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-700 dark:text-teal-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? (isBn ? 'রিফ্রেশ হচ্ছে...' : 'Syncing...') : (isBn ? 'এখন রিফ্রেশ করুন' : 'Refresh Status')}</span>
          </button>
        </div>
      </div>

      {/* 2. Cancellation or Return Alert Banner if relevant */}
      {currentOrder.orderStatus === 'CANCELLED' && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-sm">
              {isBn ? 'এই অর্ডারটি বাতিল করা হয়েছে' : 'This Order Has Been Cancelled'}
            </strong>
            <p className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-300">
              {isBn ? 'কোনো অগ্রিম পরিশোধ থাকলে তা ২৪ ঘণ্টার মধ্যে রিফান্ড প্রসেস করা হবে। বিস্তারিত জানতে হেল্পলাইনে যোগাযোগ করুন।' : 'If advance payment was made, refund processing will be completed within 24 hours. Contact support for assistance.'}
            </p>
          </div>
        </div>
      )}

      {currentOrder.orderStatus === 'RETURNED' && (
        <div className="p-3.5 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 rounded-xl text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
          <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-sm">
              {isBn ? 'অর্ডার রিটার্ন প্রসেসিং সম্পন্ন' : 'Return Request Processed & Restocked'}
            </strong>
            <p className="mt-0.5 text-[11px] text-purple-700 dark:text-purple-300">
              {isBn ? 'রিটার্ন পার্সেলটি হাবে গৃহীত ও পরিদর্শিত হয়েছে।' : 'Return item successfully received and processed at Kisholoy Central Logistics Hub.'}
            </p>
          </div>
        </div>
      )}

      {/* 3. Visual Stepper / Progress Bar (Horizontal / Vertical Responsive) */}
      <div className="pt-2 pb-2">
        <div className="hidden md:grid grid-cols-6 gap-2 relative">
          {/* Progress Connecting Line */}
          <div className="absolute top-4 left-[8%] right-[8%] h-0.5 bg-stone-200 dark:bg-slate-800 z-0" />

          {milestones.map((st, idx) => {
            const state = getStepState(st.status, currentOrder.orderStatus);
            const isCompleted = state === 'completed';
            const isCurrent = state === 'current';

            return (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : isCurrent 
                    ? 'bg-teal-900 text-white ring-4 ring-teal-100 dark:ring-teal-950 shadow-md' 
                    : 'bg-stone-200 dark:bg-slate-800 text-stone-500 dark:text-slate-400'
                }`}>
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className={`text-xs font-bold mt-2 transition-colors ${
                  isCurrent 
                    ? 'text-teal-950 dark:text-teal-300 font-extrabold' 
                    : isCompleted 
                    ? 'text-stone-900 dark:text-slate-100 font-semibold' 
                    : 'text-stone-400 dark:text-slate-500'
                }`}>
                  {isBn ? st.labelBn : st.label}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-slate-400 mt-0.5 line-clamp-2 px-1">
                  {isBn ? st.descBn : st.desc}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile Vertical Stepper View */}
        <div className="md:hidden space-y-3 relative pl-3 border-l-2 border-teal-200 dark:border-teal-900 ml-2">
          {milestones.map((st, idx) => {
            const state = getStepState(st.status, currentOrder.orderStatus);
            const isCompleted = state === 'completed';
            const isCurrent = state === 'current';

            return (
              <div key={idx} className="relative pl-5 pb-2">
                <div className={`absolute -left-[17px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  isCompleted 
                    ? 'bg-emerald-600 text-white' 
                    : isCurrent 
                    ? 'bg-teal-900 text-white ring-2 ring-teal-200 dark:ring-teal-950' 
                    : 'bg-stone-200 dark:bg-slate-800 text-stone-500 dark:text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                <div>
                  <h5 className={`text-xs font-bold ${
                    isCurrent ? 'text-teal-950 dark:text-teal-300' : isCompleted ? 'text-stone-900 dark:text-slate-200' : 'text-stone-400 dark:text-slate-500'
                  }`}>
                    {isBn ? st.labelBn : st.label}
                  </h5>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400">
                    {isBn ? st.descBn : st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Courier Tracking & Rider Card (if courier booked) */}
      {currentOrder.courier?.provider && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-stone-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900 dark:text-slate-100 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                {isBn ? 'কুরিয়ার পার্টনার:' : 'Courier Partner:'}
                <strong className="text-teal-900 dark:text-teal-300 font-extrabold">{currentOrder.courier.provider}</strong>
              </span>
              {currentOrder.courier.trackingId && (
                <span className="font-mono text-xs font-bold bg-stone-100 dark:bg-slate-700 text-stone-800 dark:text-slate-200 px-2 py-0.5 rounded border border-stone-200 dark:border-slate-600">
                  {currentOrder.courier.trackingId}
                </span>
              )}
            </div>

            {/* Courier Copy Code Button */}
            {currentOrder.courier.trackingId && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentOrder.courier.trackingId || '');
                  setCopiedTracking(true);
                  setTimeout(() => setCopiedTracking(false), 2000);
                }}
                className="px-2 py-1 text-[11px] font-semibold text-stone-700 dark:text-slate-300 bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 rounded flex items-center gap-1 transition-colors"
              >
                {copiedTracking ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-stone-500" />}
                <span>{copiedTracking ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'আইডি কপি করুন' : 'Copy ID')}</span>
              </button>
            )}
          </div>

          {/* Rider information if dispatched */}
          {courierRider && (
            <div className="pt-2 border-t border-stone-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="text-stone-700 dark:text-slate-300 font-medium">
                  {isBn ? 'রাইডার:' : 'Rider:'} <strong>{courierRider.name}</strong>
                </span>
              </div>
              {courierRider.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <a href={`tel:${courierRider.phone}`} className="text-teal-800 dark:text-teal-400 font-bold font-mono hover:underline">
                    {courierRider.phone}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Collapsible Real-Time Checkpoint Event Log (সময়রেখা পয়েন্ট) */}
      <div className="pt-1">
        <button
          onClick={() => setShowFullTimeline(!showFullTimeline)}
          className="w-full text-left py-2 px-3 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-bold text-stone-800 dark:text-slate-200 flex items-center justify-between transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>{isBn ? 'অর্ডারের সম্পূর্ণ হিস্ট্রি ও সময়রেখা দেখুন' : 'View Detailed Audit Log & Event Checkpoints'}</span>
            <span className="px-2 py-0.5 bg-stone-100 dark:bg-slate-700 rounded text-[10px] font-mono text-stone-600 dark:text-slate-300">
              {timelineEvents.length} {isBn ? 'টি আপডেট' : 'events'}
            </span>
          </div>
          <span className="text-stone-400 text-sm font-bold">
            {showFullTimeline ? '▲' : '▼'}
          </span>
        </button>

        {showFullTimeline && (
          <div className="mt-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isBn ? 'ব্যাকএন্ড ইভেন্ট লগ (Real-time Audit Log)' : 'Backend Real-time Event Log'}</span>
            </h5>

            <div className="space-y-3 relative pl-4 border-l-2 border-stone-200 dark:border-slate-800 ml-1">
              {timelineEvents.map((ev, idx) => {
                const evDate = new Date(ev.timestamp);
                const isValidDate = !isNaN(evDate.getTime());
                const formattedDate = isValidDate
                  ? evDate.toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : ev.timestamp;

                return (
                  <div key={idx} className="relative pl-4">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-800 dark:bg-teal-400 ring-4 ring-white dark:ring-slate-900" />
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-bold text-xs text-stone-900 dark:text-slate-100">
                        {ev.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-stone-400 dark:text-slate-500">
                        {formattedDate}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-slate-300 mt-0.5">
                      {ev.note || (isBn ? 'স্ট্যাটাস পরিবর্তন সম্পন্ন' : 'Status updated successfully')}
                    </p>
                    {ev.updatedBy && (
                      <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400">
                        Operator: {ev.updatedBy}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
