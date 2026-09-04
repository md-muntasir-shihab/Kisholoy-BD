import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, AlertTriangle, ShieldAlert, Landmark, CheckCircle2, 
  Clock, ArrowRight, Volume2, VolumeX, X, Check,
  ExternalLink, Sparkles, RefreshCw, Layers, ChevronRight,
  Package, RotateCcw, AlertCircle, PlayCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SettlementRecord, Order, Product, CustomerReturnRequest } from '../../types';

export interface UrgentAlertItem {
  id: string;
  type: 'FRAUD_RISK' | 'PENDING_SETTLEMENT' | 'LOW_STOCK' | 'PENDING_RMA';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  metadata?: string;
  timestamp: string;
  actionLabel: string;
  actionPath: string;
  onQuickAction?: () => void;
  rawPayload?: any;
}

export function AdminNotificationAlerts() {
  const { 
    orders, 
    settlements, 
    products, 
    returnRequests, 
    updateSettlementStatus, 
    showToast,
    language 
  } = useApp();
  
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'FRAUD' | 'SETTLEMENT' | 'OPERATIONS'>('ALL');
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(() => new Set());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [simulatedAlerts, setSimulatedAlerts] = useState<UrgentAlertItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isBn = language === 'BN';

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Web Audio chime synthesizer for real-time notifications
  const playAlertChime = (severity: 'CRITICAL' | 'HIGH' | 'NORMAL' = 'HIGH') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = severity === 'CRITICAL' ? 'sawtooth' : 'sine';
      const now = ctx.currentTime;
      
      if (severity === 'CRITICAL') {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.1); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.2); // D6
      } else {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      }

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  };

  // Compile real-time alerts from application state
  const liveAlerts = useMemo<UrgentAlertItem[]>(() => {
    const alerts: UrgentAlertItem[] = [];

    // 1. HIGH FRAUD RISK ORDERS
    const suspiciousOrders = orders.filter(o => 
      o.fraudRisk && (o.fraudRisk.riskScore >= 50 || o.fraudRisk.riskRating === 'HIGH' || o.fraudRisk.riskRating === 'SUSPICIOUS')
    );

    suspiciousOrders.forEach(o => {
      const score = o.fraudRisk?.riskScore || 75;
      const severity = score >= 70 ? 'CRITICAL' : 'HIGH';
      const flags = o.fraudRisk?.triggeredRules?.slice(0, 2).join(', ') || 'Repeated IP / Unusual COD volume';

      alerts.push({
        id: `fraud-${o.id}`,
        type: 'FRAUD_RISK',
        severity,
        title: `Fraud Risk Warning: ${o.orderNumber || o.id} (${score}/100 Score)`,
        titleBn: `জালিয়াতি ঝুঁকি সতর্কতা: ${o.orderNumber || o.id} (স্কোর: ${score}/১০০)`,
        description: `Customer ${o.customerName || 'Anonymous'} placed order ৳${o.total.toLocaleString()} via ${o.paymentMethod}. Triggered flags: ${flags}.`,
        descriptionBn: `গ্রাহক ${o.customerName || 'নাম প্রকাশহীন'} ৳${o.total.toLocaleString()} মূল্যের অর্ডার করেছেন (${o.paymentMethod})। সতর্কবার্তা: ${flags}।`,
        metadata: `Risk: ${o.fraudRisk?.riskRating || 'HIGH'} • Score: ${score}`,
        timestamp: o.createdAt || new Date().toISOString(),
        actionLabel: isBn ? 'ঝুঁকি পর্যালোচনা করুন' : 'Review Risk',
        actionPath: `/admin/orders?search=${o.orderNumber || o.id}`,
        rawPayload: o
      });
    });

    // 2. PENDING SETTLEMENT APPROVALS
    const pendingSettlements = settlements.filter(s => s.status === 'PENDING' || s.status === 'INITIATED');
    pendingSettlements.forEach(s => {
      alerts.push({
        id: `settlement-${s.id}`,
        type: 'PENDING_SETTLEMENT',
        severity: 'HIGH',
        title: `Pending Settlement Approval: Batch ${s.batchNumber}`,
        titleBn: `পেমেন্ট সেটেলমেন্ট অনুমোদন বাকি: ব্যাচ ${s.batchNumber}`,
        description: `Gateway ${s.gateway} payout of ৳${s.netPayout.toLocaleString()} (Gross: ৳${s.grossAmount.toLocaleString()}) awaiting Bank disbursement to ${s.bankAccount}.`,
        descriptionBn: `গেটওয়ে ${s.gateway} থেকে ৳${s.netPayout.toLocaleString()} পেআউট ${s.bankAccount} অ্যাকাউন্টে জমা করার অপেক্ষায় রয়েছে।`,
        metadata: `Net: ৳${s.netPayout.toLocaleString()} • Fee: ৳${s.gatewayFee.toLocaleString()}`,
        timestamp: s.createdAt || new Date().toISOString(),
        actionLabel: isBn ? 'অনুমোদন দিন' : 'Approve Payout',
        actionPath: '/admin/finance',
        onQuickAction: () => {
          const autoUtr = `NPSB-${Math.floor(10000000 + Math.random() * 90000000)}`;
          updateSettlementStatus(s.id, 'SETTLED', autoUtr);
          showToast(`Settlement ${s.batchNumber} approved and marked as SETTLED!`);
        },
        rawPayload: s
      });
    });

    // 3. PENDING RETURN / RMA REQUESTS
    const pendingReturns = returnRequests.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW');
    pendingReturns.forEach(r => {
      alerts.push({
        id: `rma-${r.id}`,
        type: 'PENDING_RMA',
        severity: 'MEDIUM',
        title: `Customer Return Request: ${r.requestNumber}`,
        titleBn: `পণ্য রিটার্ন অনুরোধ: ${r.requestNumber}`,
        description: `Return for ${r.productTitle} on order #${r.orderNumber}. Reason: ${r.reason.replace(/_/g, ' ')}.`,
        descriptionBn: `অর্ডার #${r.orderNumber} এর জন্য ${r.productTitle} ফেরত চাওয়া হয়েছে। কারণ: ${r.reason}।`,
        metadata: `Resolution: ${r.preferredResolution}`,
        timestamp: r.createdAt || new Date().toISOString(),
        actionLabel: isBn ? 'আরএমএ পরীক্ষা' : 'Inspect RMA',
        actionPath: '/admin/returns',
        rawPayload: r
      });
    });

    // 4. CRITICAL LOW STOCK / OUT OF STOCK
    const outOfStockProducts = products.filter(p => p.stock === 0);
    if (outOfStockProducts.length > 0) {
      alerts.push({
        id: 'stock-out-batch',
        type: 'LOW_STOCK',
        severity: 'HIGH',
        title: `Critical Out-of-Stock: ${outOfStockProducts.length} Products Depleted`,
        titleBn: `জরুরি স্টক সংকট: ${outOfStockProducts.length}টি পণ্যের স্টক সম্পূর্ণ শেষ`,
        description: `Top depleted: ${outOfStockProducts.slice(0, 3).map(p => isBn ? (p.titleBn || p.title) : p.title).join(', ')}.`,
        descriptionBn: `স্টক শূন্য পণ্য: ${outOfStockProducts.slice(0, 3).map(p => isBn ? (p.titleBn || p.title) : p.title).join(', ')}।`,
        metadata: `${outOfStockProducts.length} items with 0 stock`,
        timestamp: new Date().toISOString(),
        actionLabel: isBn ? 'রিস্টক ইনভেন্টরি' : 'Restock Items',
        actionPath: '/admin/inventory',
        rawPayload: outOfStockProducts
      });
    }

    return [...alerts, ...simulatedAlerts];
  }, [orders, settlements, products, returnRequests, simulatedAlerts, isBn, updateSettlementStatus, showToast]);

  // Filter unacknowledged alerts
  const activeAlerts = useMemo(() => {
    return liveAlerts.filter(a => !acknowledgedIds.has(a.id));
  }, [liveAlerts, acknowledgedIds]);

  // Filtered by selected tab
  const displayedAlerts = useMemo(() => {
    if (selectedFilter === 'FRAUD') return activeAlerts.filter(a => a.type === 'FRAUD_RISK');
    if (selectedFilter === 'SETTLEMENT') return activeAlerts.filter(a => a.type === 'PENDING_SETTLEMENT');
    if (selectedFilter === 'OPERATIONS') return activeAlerts.filter(a => a.type === 'LOW_STOCK' || a.type === 'PENDING_RMA');
    return activeAlerts;
  }, [activeAlerts, selectedFilter]);

  const fraudCount = activeAlerts.filter(a => a.type === 'FRAUD_RISK').length;
  const settlementCount = activeAlerts.filter(a => a.type === 'PENDING_SETTLEMENT').length;
  const criticalCount = activeAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

  const handleDismissAlert = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAcknowledgedIds(prev => new Set([...prev, id]));
  };

  const handleDismissAll = () => {
    const allIds = activeAlerts.map(a => a.id);
    setAcknowledgedIds(prev => new Set([...prev, ...allIds]));
    showToast(isBn ? 'সকল অ্যালার্ট গৃহীত হয়েছে' : 'All alerts marked as acknowledged.');
  };

  const handleActionClick = (alert: UrgentAlertItem) => {
    setIsOpen(false);
    navigate(alert.actionPath);
  };

  // Simulate an urgent live fraud spike or settlement for demo/testing
  const handleSimulateUrgentAlert = () => {
    const newSimAlert: UrgentAlertItem = {
      id: `sim-${Date.now()}`,
      type: 'FRAUD_RISK',
      severity: 'CRITICAL',
      title: '🚨 LIVE SPIKE: High Velocity Fraud Attempt',
      titleBn: '🚨 লাইভ সতর্কবার্তা: সন্দেহজনক উচ্চ গতির অর্ডার প্রচেষ্টা',
      description: 'Multiple COD orders (৳48,500) initiated within 60 seconds from identical IP subnet in Chittagong.',
      descriptionBn: 'চট্টগ্রামের একই আইপি সাবনেট থেকে ৬০ সেকেন্ডে একাধিক সিওডি অর্ডার (৳৪৮,৫০০) চিহ্নিত হয়েছে।',
      metadata: 'Velocity: 4 orders/min • Risk: CRITICAL (94/100)',
      timestamp: new Date().toISOString(),
      actionLabel: isBn ? 'অর্ডার ব্লক করুন' : 'Investigate & Freeze',
      actionPath: '/admin/orders?risk=HIGH'
    };

    setSimulatedAlerts(prev => [newSimAlert, ...prev]);
    playAlertChime('CRITICAL');
    showToast('🚨 Real-time urgent alert triggered: Velocity Fraud Spike!');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Trigger Bell Button */}
      <button
        id="admin-alert-bell-trigger"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && criticalCount > 0) {
            playAlertChime('NORMAL');
          }
        }}
        className={`relative p-2 rounded-xl transition-all border ${
          activeAlerts.length > 0
            ? criticalCount > 0
              ? 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700/80 dark:hover:bg-rose-900 shadow-xs ring-1 ring-rose-500/30'
              : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700/80 dark:hover:bg-amber-900'
            : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-850 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border-stone-200 dark:border-stone-800'
        }`}
        title={
          activeAlerts.length > 0
            ? `${activeAlerts.length} urgent alerts active (${fraudCount} Fraud, ${settlementCount} Settlements)`
            : 'Operational Radar: No urgent alerts'
        }
        aria-label="Admin Alerts and Notifications"
      >
        <Bell className={`w-4 h-4 ${criticalCount > 0 ? 'animate-bounce' : ''}`} />

        {/* Counter Badge */}
        {activeAlerts.length > 0 && (
          <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center font-mono shadow-md ${
            criticalCount > 0
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-amber-500 text-stone-950'
          }`}>
            {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
          </span>
        )}

        {/* Pulse beacon ring */}
        {criticalCount > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping opacity-75 pointer-events-none" />
        )}
      </button>

      {/* Real-time Notification Popover Dropdown */}
      {isOpen && (
        <div
          id="admin-alerts-popover"
          className="absolute right-0 mt-3 w-96 sm:w-[420px] max-w-[95vw] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-750 rounded-2xl shadow-2xl z-50 text-stone-900 dark:text-stone-100 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Popover Header */}
          <div className="p-4 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${criticalCount > 0 ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300' : 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300'}`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                    {isBn ? 'অপারেশনস রাডার ও অ্যালার্ট' : 'Operations Radar & Alerts'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-stone-400">
                  {activeAlerts.length > 0 
                    ? `${activeAlerts.length} actionable items require admin authorization`
                    : 'All operational parameters nominal'}
                </p>
              </div>
            </div>

            {/* Header controls: Sound & Close */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  showToast(soundEnabled ? 'Audio alerts muted' : 'Audio alerts enabled');
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  soundEnabled 
                    ? 'text-teal-400 hover:bg-stone-850' 
                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-850'
                }`}
                title={soundEnabled ? 'Mute Alert Chimes' : 'Unmute Alert Chimes'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-850 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Urgent Summary Strip (If Critical Fraud / Settlement Present) */}
          {(fraudCount > 0 || settlementCount > 0) && (
            <div className="px-4 py-2 bg-gradient-to-r from-rose-950/80 to-amber-950/80 border-b border-rose-900/40 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>
                  <strong>{fraudCount}</strong> {isBn ? 'ঝুঁকিপূর্ণ অর্ডার' : 'Fraud Alert(s)'} &bull; <strong>{settlementCount}</strong> {isBn ? 'সেটেলমেন্ট বাকি' : 'Settlement(s)'}
                </span>
              </div>
              <button
                onClick={handleDismissAll}
                className="text-[10px] font-semibold text-stone-300 hover:text-white underline"
              >
                {isBn ? 'সবগুলো গ্রহণ করুন' : 'Acknowledge All'}
              </button>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 p-2 bg-stone-950/60 border-b border-stone-800 text-[11px] overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 ${
                selectedFilter === 'ALL'
                  ? 'bg-teal-900 text-white shadow-2xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              {isBn ? 'সকল' : 'All'} ({activeAlerts.length})
            </button>
            <button
              onClick={() => setSelectedFilter('FRAUD')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                selectedFilter === 'FRAUD'
                  ? 'bg-rose-900 text-white shadow-2xs'
                  : 'text-stone-400 hover:text-rose-300 hover:bg-stone-850'
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>{isBn ? 'জালিয়াতি' : 'Fraud Risk'}</span>
              {fraudCount > 0 && <span className="px-1 bg-rose-800 rounded text-[9px] font-mono">{fraudCount}</span>}
            </button>
            <button
              onClick={() => setSelectedFilter('SETTLEMENT')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                selectedFilter === 'SETTLEMENT'
                  ? 'bg-amber-900 text-white shadow-2xs'
                  : 'text-stone-400 hover:text-amber-300 hover:bg-stone-850'
              }`}
            >
              <Landmark className="w-3 h-3 text-amber-400" />
              <span>{isBn ? 'সেটেলমেন্ট' : 'Settlements'}</span>
              {settlementCount > 0 && <span className="px-1 bg-amber-800 rounded text-[9px] font-mono">{settlementCount}</span>}
            </button>
            <button
              onClick={() => setSelectedFilter('OPERATIONS')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 ${
                selectedFilter === 'OPERATIONS'
                  ? 'bg-stone-750 text-white shadow-2xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
              }`}
            >
              {isBn ? 'ইনভেন্টরি / আরএমএ' : 'Stock & RMA'}
            </button>
          </div>

          {/* Alerts Scrollable Feed */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-stone-800 p-2 space-y-2">
            {displayedAlerts.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-stone-200">
                  {isBn ? 'কোনো জরুরি সতর্কতা নেই' : 'All Clear — No Pending Alerts'}
                </h4>
                <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                  {isBn
                    ? 'সকল আর্থিক সেটেলমেন্ট অনুমোদিত এবং কোনো ঝুঁকিপূর্ণ অর্ডার চিহ্নিত নেই।'
                    : 'All payouts reconciled, fraud checks cleared, and inventory thresholds healthy.'}
                </p>
                <button
                  type="button"
                  onClick={handleSimulateUrgentAlert}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white text-[10px] font-mono transition-colors"
                >
                  <PlayCircle className="w-3 h-3 text-teal-400" />
                  <span>{isBn ? 'টেস্ট অ্যালার্ট সিমুলেট করুন' : 'Simulate Test Fraud Alert'}</span>
                </button>
              </div>
            ) : (
              displayedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl transition-all border ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-rose-950/40 border-rose-800/60 hover:bg-rose-950/60'
                      : alert.severity === 'HIGH'
                      ? 'bg-amber-950/30 border-amber-800/50 hover:bg-amber-950/50'
                      : 'bg-stone-850/60 border-stone-750 hover:bg-stone-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wider ${
                        alert.type === 'FRAUD_RISK'
                          ? 'bg-rose-900 text-rose-200 border border-rose-700'
                          : alert.type === 'PENDING_SETTLEMENT'
                          ? 'bg-amber-900 text-amber-200 border border-amber-700'
                          : 'bg-teal-900 text-teal-200 border border-teal-700'
                      }`}>
                        {alert.type === 'FRAUD_RISK' ? 'FRAUD RISK' : alert.type === 'PENDING_SETTLEMENT' ? 'SETTLEMENT' : 'OPERATION'}
                      </span>
                      {alert.metadata && (
                        <span className="text-[10px] text-stone-400 font-mono">
                          {alert.metadata}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleDismissAlert(alert.id, e)}
                      className="text-stone-500 hover:text-stone-300 p-0.5 rounded transition-colors"
                      title="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-1.5">
                    <h5 className="font-bold text-stone-100 text-xs leading-snug">
                      {isBn ? alert.titleBn : alert.title}
                    </h5>
                    <p className="text-[11px] text-stone-300 mt-0.5 leading-relaxed">
                      {isBn ? alert.descriptionBn : alert.description}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-stone-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {alert.onQuickAction && (
                        <button
                          type="button"
                          onClick={() => {
                            alert.onQuickAction?.();
                            handleDismissAlert(alert.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Quick Settle</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleActionClick(alert)}
                        className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-800 hover:bg-rose-700 text-white'
                            : 'bg-teal-800 hover:bg-teal-700 text-white'
                        }`}
                      >
                        <span>{alert.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Popover Footer */}
          <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
            <button
              onClick={handleSimulateUrgentAlert}
              className="hover:text-teal-300 transition-colors flex items-center gap-1 text-[10px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{isBn ? 'সিমুলেট ইভেন্ট' : 'Simulate Spike'}</span>
            </button>

            {activeAlerts.length > 0 && (
              <button
                onClick={handleDismissAll}
                className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                {isBn ? 'সকল মার্ক করুন' : 'Mark All Read'}
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
