import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Landmark, ArrowRight, X, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function AdminUrgentAlertBanner() {
  const { orders, settlements, language } = useApp();
  const [dismissed, setDismissed] = useState(false);

  const isBn = language === 'BN';

  // Calculate urgent items
  const highRiskOrders = orders.filter(o => 
    o.fraudRisk && (o.fraudRisk.riskScore >= 60 || o.fraudRisk.riskRating === 'HIGH' || o.fraudRisk.riskRating === 'SUSPICIOUS')
  );
  
  const pendingSettlements = settlements.filter(s => s.status === 'PENDING' || s.status === 'INITIATED');

  if (dismissed || (highRiskOrders.length === 0 && pendingSettlements.length === 0)) {
    return null;
  }

  const hasFraud = highRiskOrders.length > 0;
  const hasSettlement = pendingSettlements.length > 0;

  return (
    <div
      id="admin-urgent-operational-banner"
      className="bg-rose-50/90 dark:bg-stone-900 border-b border-rose-200/90 dark:border-rose-900/50 px-4 sm:px-6 py-2.5 text-xs text-stone-900 dark:text-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs transition-colors animate-in fade-in duration-200"
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        
        <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          {isBn ? 'জরুরি অপারেশনস সতর্কতা:' : 'Urgent Operations Alert:'}
        </span>

        <span className="text-stone-700 dark:text-stone-300">
          {hasFraud && (
            <span className="mr-2">
              🚨 <strong>{highRiskOrders.length}</strong> {isBn ? 'উচ্চ ঝুঁকিপূর্ণ অর্ডার চিহ্নিত' : 'High Fraud Risk order(s) require review'}
            </span>
          )}
          {hasSettlement && (
            <span>
              💰 <strong>{pendingSettlements.length}</strong> {isBn ? 'গেটওয়ে সেটেলমেন্ট অনুমোদন বাকি' : 'Gateway Settlement batch(es) pending payout'}
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {hasFraud && (
          <Link
            to="/admin/fraud"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 dark:bg-rose-950/80 dark:hover:bg-rose-900 dark:text-rose-200 dark:border-rose-700/60 font-semibold text-[11px] transition-colors"
          >
            <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>{isBn ? 'ফ্রড ড্যাশবোর্ড' : 'Review Fraud'}</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}

        {hasSettlement && (
          <Link
            to="/admin/finance"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:hover:bg-amber-900 dark:text-amber-200 dark:border-amber-700/60 font-semibold text-[11px] transition-colors"
          >
            <Landmark className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{isBn ? 'সেটেলমেন্ট লেজার' : 'Authorize Payouts'}</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors ml-1"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
