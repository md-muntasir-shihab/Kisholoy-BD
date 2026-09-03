import React, { useState } from 'react';
import { RotateCcw, CheckCircle2, XCircle, AlertCircle, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function ReturnsAdmin() {
  const { orders, updateOrderStatus, logAudit, showToast } = useApp();

  const handleApproveReturn = (orderId: string) => {
    updateOrderStatus(orderId, 'RETURNED', 'RMA Approved & Item Inspected at Hub');
    logAudit('APPROVE_RETURN', 'Order', `Approved RMA for Order ${orderId}`);
    showToast('Return approved and items marked for restock');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900">Returns & RMA Inspection Desk</h1>
        <p className="text-xs text-stone-500">Inspect customer returns, verify defective claims, and trigger warehouse restock/scrap.</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Active RMA Queue</h2>
        <div className="border border-stone-200 rounded-xl divide-y divide-stone-200 text-xs">
          <div className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-stone-50/50">
            <div>
              <span className="font-mono font-bold text-stone-900 block">RMA-2026-004 (Order: KSH-2026-0891)</span>
              <span className="text-stone-500">Reason: Wrong size requested for replacement by Tanzil Ahmed</span>
              <span className="text-[11px] text-amber-800 font-semibold block mt-0.5">Status: Hub Received - Inspection Passed</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleApproveReturn('ord-001')}
                className="px-3 py-1.5 bg-teal-900 text-white rounded font-bold hover:bg-teal-950"
              >
                Approve & Restock
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
