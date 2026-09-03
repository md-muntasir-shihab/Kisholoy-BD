import React, { useState } from 'react';
import { DollarSign, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function RefundsAdmin() {
  const { showToast, logAudit } = useApp();
  const [processed, setProcessed] = useState(false);

  const handleProcessRefund = () => {
    setProcessed(true);
    logAudit('EXECUTE_REFUND', 'Finance', 'Processed refund ৳3,800 via SSLCOMMERZ gateway reversal');
    showToast('Refund of ৳3,800 successfully initiated via SSLCOMMERZ');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900">Refunds Approval Queue</h1>
        <p className="text-xs text-stone-500">Reverse card transactions, initiate bKash/Nagad wallet disbursements, and balance journals.</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Pending Refund Authorizations</h2>
        
        {processed ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            All queued refunds processed. No pending requests.
          </div>
        ) : (
          <div className="border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-stone-50/50 text-xs">
            <div>
              <span className="font-mono font-bold text-stone-900 block">REF-8891 (Order: KSH-2026-0891)</span>
              <span className="text-stone-600">Customer: Tanzil Ahmed (+880 1712345678)</span>
              <span className="text-stone-500 block">Amount: <strong>৳ 3,800</strong> (Original Gateway: SSLCOMMERZ / Visa)</span>
            </div>
            <button
              onClick={handleProcessRefund}
              className="px-4 py-2 bg-teal-900 text-white rounded-lg font-bold hover:bg-teal-950 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Approve & Disburse Gateway Reversal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
