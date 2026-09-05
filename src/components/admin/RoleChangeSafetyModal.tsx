import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight, Check, X, ShieldCheck } from 'lucide-react';
import { Role } from '../../types';
import { useApp } from '../../context/AppContext';
import { useModalA11y } from '../../hooks/useModalA11y';

interface RoleChangeSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetUserName: string;
  currentRole: Role;
  newRole: Role;
  isProcessing?: boolean;
}

export const RoleChangeSafetyModal: React.FC<RoleChangeSafetyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetUserName,
  currentRole,
  newRole,
  isProcessing = false
}) => {
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: isOpen,
    onClose,
    label: 'Role Change Safety',
  });

  const { language } = useApp();

  if (!isOpen) return null;

  const isHighImpact = newRole === 'SUPER_ADMIN' || newRole === 'ADMIN';

  // Role impact description helper
  const getImpactSummary = (from: Role, to: Role) => {
    if (to === 'SUPER_ADMIN') {
      return {
        warning: 'CRITICAL PRIVILEGE ESCALATION: Super Admin has master authority over all systems, database restore, payment credentials, and user permissions.',
        gains: [
          'Full access to restore database backups and snapshot exports',
          'Capability to create, modify, and delete other staff accounts',
          'Direct modification of gateway secrets (bKash, SSLCommerz)',
          'Access to tamper-evident cryptographic security audit logs'
        ],
        losses: []
      };
    }
    if (to === 'ADMIN') {
      return {
        warning: 'HIGH BUSINESS IMPACT: Admin user gains full oversight over product prices, orders, inventory, and marketing campaigns.',
        gains: [
          'Product catalog creation, pricing modifications, and deletions',
          'Order updates, cancellations, and courier dispatch assignments',
          'Promotional discounts, voucher codes, and CMS content updates'
        ],
        losses: [
          'Root security and database backup restoration remain blocked'
        ]
      };
    }
    if (to === 'ORDER_MANAGER') {
      return {
        warning: 'Operational scope limited strictly to order processing and logistics dispatch.',
        gains: [
          'Order statuses, packing slips, courier dispatch, customer shipping info'
        ],
        losses: [
          'Cannot change catalog prices, approve refunds, or alter security'
        ]
      };
    }
    if (to === 'INVENTORY_MANAGER') {
      return {
        warning: 'Operational scope limited to warehouse logistics and supplier receiving.',
        gains: [
          'Stock adjustment, warehouse hub transfers, supplier receiving'
        ],
        losses: [
          'Cannot view private customer data or process financial payouts'
        ]
      };
    }
    if (to === 'FINANCE') {
      return {
        warning: 'Operational scope focused on payment reconciliation and refunds.',
        gains: [
          'Payment verification, COD courier settlement, authorized refunds'
        ],
        losses: [
          'Cannot adjust stock directly or modify website content'
        ]
      };
    }
    return {
      warning: `Role transition from ${from} to ${to}. Operational access will be updated immediately.`,
      gains: [`Authorized capabilities for ${to}`],
      losses: [`Capabilities exclusive to ${from}`]
    };
  };

  const impact = getImpactSummary(currentRole, newRole);

  return (
    <div ref={containerRef} {...dialogProps} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center gap-3 ${
          isHighImpact ? 'bg-amber-50/80 border-amber-200 text-amber-950' : 'bg-stone-50 border-stone-200 text-stone-900'
        }`}>
          <div className={`p-2 rounded-xl ${isHighImpact ? 'bg-amber-100 text-amber-900' : 'bg-teal-900 text-white'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base">
              {language === 'BN' ? 'ভূমিকা পরিবর্তনের নিরাপত্তা সতর্কতা' : 'Role Change Safety Verification'}
            </h3>
            <span className="text-xs opacity-80 block">
              {isHighImpact ? 'High Impact Operational Privilege Modification' : 'Staff Role Adjustment Confirmation'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-400 block uppercase font-bold">Target Staff User</span>
              <span className="font-bold text-sm text-stone-900">{targetUserName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-mono text-[11px] font-bold">
                {currentRole}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="px-2 py-0.5 rounded-md bg-teal-900 text-white font-mono text-[11px] font-bold">
                {newRole}
              </span>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
            isHighImpact ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-teal-50/60 border-teal-200 text-teal-950'
          }`}>
            <p className="font-semibold">{impact.warning}</p>
          </div>

          {/* Newly Granted Capabilities */}
          {impact.gains.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                {language === 'BN' ? 'নতুন অনুমোদিত সুবিধাসমূহ:' : 'Newly Granted Access & Permissions:'}
              </span>
              <div className="space-y-1">
                {impact.gains.map((gain, i) => (
                  <div key={i} className="flex items-start gap-2 text-stone-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-200/50">
                    <Check className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <span>{gain}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revoked / Restricted Boundaries */}
          {impact.losses.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                {language === 'BN' ? 'সীমিত / প্রত্যাহারকৃত পরিধি:' : 'Operational Boundaries:'}
              </span>
              <div className="space-y-1">
                {impact.losses.map((loss, i) => (
                  <div key={i} className="flex items-start gap-2 text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200/50">
                    <X className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
                    <span>{loss}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 text-[11px] text-stone-500">
            {language === 'BN' 
              ? 'এই পরিবর্তনটি অবিলম্বে কার্যকর হবে এবং সিস্টেমে ক্রিপ্টোগ্রাফিক অডিট লগ সংরক্ষিত হবে।' 
              : 'This action will take effect immediately. An indelible record will be written to the cryptographic audit ledger.'}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors"
          >
            {language === 'BN' ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors ${
              isHighImpact ? 'bg-amber-800 hover:bg-amber-900' : 'bg-teal-900 hover:bg-teal-950'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Applying Role...' : (language === 'BN' ? 'ভূমিকা পরিবর্তন নিশ্চিত করুন' : 'Confirm Role Assignment')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
