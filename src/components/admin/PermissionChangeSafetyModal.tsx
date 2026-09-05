import React from 'react';
import { ShieldCheck, AlertCircle, Plus, Minus, Check, X } from 'lucide-react';
import { Role } from '../../types';
import { useApp } from '../../context/AppContext';
import { useModalA11y } from '../../hooks/useModalA11y';

interface PermissionChangeSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  role: Role;
  roleName: string;
  originalPermissions: string[];
  newPermissions: string[];
  isProcessing?: boolean;
}

export const PermissionChangeSafetyModal: React.FC<PermissionChangeSafetyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  role,
  roleName,
  originalPermissions,
  newPermissions,
  isProcessing = false
}) => {
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: isOpen,
    onClose,
    label: 'Permission Change Safety',
  });

  const { language } = useApp();

  if (!isOpen) return null;

  const added = newPermissions.filter(p => !originalPermissions.includes(p));
  const removed = originalPermissions.filter(p => !newPermissions.includes(p));

  return (
    <div ref={containerRef} {...dialogProps} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-900 text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              {language === 'BN' ? 'অনুমতি পরিবর্তন ও প্রভাব পর্যালোচনা' : 'Review RBAC Permission Adjustments'}
            </h3>
            <span className="text-xs text-stone-500 block">
              Target Role: <strong className="text-stone-800">{roleName}</strong> ({role})
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex justify-between items-center text-xs">
            <div>
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Current Active Permissions</span>
              <span className="font-bold text-stone-800">{originalPermissions.length} rules</span>
            </div>
            <div className="text-stone-400">→</div>
            <div>
              <span className="text-stone-400 text-[10px] uppercase font-bold block">New Proposed Permissions</span>
              <span className="font-bold text-teal-900">{newPermissions.length} rules</span>
            </div>
          </div>

          {/* Newly Added Access */}
          {added.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                <span>Newly Added Access & Privileges ({added.length})</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 max-h-32 overflow-y-auto space-y-1">
                {added.map(perm => (
                  <div key={perm} className="flex items-center gap-2 font-mono text-[11px] text-emerald-950">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed Access */}
          {removed.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-red-800 font-bold uppercase tracking-wider text-[10px]">
                <Minus className="w-3.5 h-3.5 text-red-600" />
                <span>Removed Access & Capabilities ({removed.length})</span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-50/60 border border-red-200 max-h-32 overflow-y-auto space-y-1">
                {removed.map(perm => (
                  <div key={perm} className="flex items-center gap-2 font-mono text-[11px] text-red-950">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {added.length === 0 && removed.length === 0 && (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-center">
              No modifications detected.
            </div>
          )}

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Security Audit Note:</strong> Updating this role permission template impacts all staff currently assigned to <strong>{role}</strong> upon their next API request.
            </p>
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
            disabled={isProcessing || (added.length === 0 && removed.length === 0)}
            className="px-4 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Saving Matrix...' : (language === 'BN' ? 'অনুমতি পরিবর্তন সেভ করুন' : 'Confirm & Apply RBAC Matrix')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
