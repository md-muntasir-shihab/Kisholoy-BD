import React from 'react';
import { ShieldAlert, ArrowLeft, KeyRound, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';

interface AccessDeniedProps {
  requiredPermission?: string;
  allowedRoles?: Role[];
  onOpenInspector?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredPermission = 'RESTRICTED_ACCESS',
  allowedRoles,
  onOpenInspector
}) => {
  const navigate = useNavigate();
  const { currentRole, setCurrentRole, language, showToast } = useApp();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 shadow-xs text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
            {language === 'BN' ? 'অনুমতি সংরক্ষিত' : 'Restricted Security Boundary'}
          </span>
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
            {language === 'BN' ? 'আপনার এই এলাকায় প্রবেশের অনুমতি নেই' : "You don't have permission to access this area"}
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            {language === 'BN'
              ? 'আপনার বর্তমান অ্যাকাউন্টের ভূমিকা অনুসারে এই মডিউলে প্রবেশের অনুমতি সীমাবদ্ধ রাখা হয়েছে।'
              : 'Your current account role does not have the authorization required to view or modify this administrative module.'}
          </p>
        </div>

        <div className="bg-stone-50 dark:bg-stone-950 rounded-xl p-4 border border-stone-200 dark:border-stone-800 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center text-stone-500 dark:text-stone-400">
            <span>{language === 'BN' ? 'আপনার বর্তমান ভূমিকা:' : 'Your Current Role:'}</span>
            <span className="font-bold text-teal-900 dark:text-teal-300 font-mono bg-white dark:bg-stone-900 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
              {currentRole}
            </span>
          </div>

          <div className="flex justify-between items-center text-stone-500 dark:text-stone-400">
            <span>{language === 'BN' ? 'প্রয়োজনীয় অনুমতি:' : 'Required Permission:'}</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200 font-mono bg-white dark:bg-stone-900 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
              {requiredPermission}
            </span>
          </div>

          {allowedRoles && allowedRoles.length > 0 && (
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">
                {language === 'BN' ? 'অনুমোদিত ভূমিকা সমূহ:' : 'Authorized Roles:'}
              </span>
              <div className="flex flex-wrap gap-1">
                {allowedRoles.map(role => (
                  <span key={role} className="text-[10px] bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded font-mono font-medium">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={() => navigate('/admin')}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'BN' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Return to Dashboard'}</span>
            </button>

            {onOpenInspector && (
              <button
                onClick={onOpenInspector}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                <span>{language === 'BN' ? 'অ্যাক্সেস পরীক্ষা' : 'Inspect'}</span>
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setCurrentRole('SUPER_ADMIN');
              showToast(language === 'BN' ? 'সুপার অ্যাডমিন ভূমিকায় সফলভাবে স্যুইচ হয়েছে' : 'Switched role to SUPER_ADMIN');
            }}
            className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-200 dark:border-amber-800/80 transition-colors"
          >
            ⚡ {language === 'BN' ? 'সুপার অ্যাডমিন পারমিশন নিন (সরাসরি আনলক)' : 'Switch to Super Admin (Direct Unlock)'}
          </button>
        </div>
      </div>
    </div>
  );
};
