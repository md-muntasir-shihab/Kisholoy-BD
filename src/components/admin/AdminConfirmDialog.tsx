import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Loader2,
  X,
  Layers,
  Check,
} from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useApp } from '../../context/AppContext';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmItemSummary {
  id: string;
  label: string;
  subtext?: string;
  badge?: string;
  badgeVariant?: 'neutral' | 'danger' | 'warning' | 'success' | 'info';
  imageUrl?: string;
}

export interface AdminConfirmDialogProps {
  /** Controls visibility of the modal */
  isOpen: boolean;
  /** Invoked when user cancels or dismisses the dialog */
  onClose: () => void;
  /** Invoked when user confirms the action (can return a Promise for async operations) */
  onConfirm: () => void | Promise<void>;
  /** Primary title (English) */
  title: string;
  /** Primary title (Bangla fallback/override) */
  titleBn?: string;
  /** Explanatory message / consequences of the action */
  description?: string;
  /** Explanatory message in Bangla */
  descriptionBn?: string;
  /** Color theme and icon archetype */
  variant?: ConfirmDialogVariant;
  /** Text for the confirmation action button */
  confirmLabel?: string;
  /** Confirmation action button label in Bangla */
  confirmLabelBn?: string;
  /** Text for the dismissal button */
  cancelLabel?: string;
  /** Dismissal button label in Bangla */
  cancelLabelBn?: string;
  /** Number of bulk entities being affected (e.g. 5 products) */
  count?: number;
  /** Name of the entity type (e.g. 'order', 'product', 'batch') */
  itemTypeLabel?: string;
  /** Entity type in Bangla (e.g. 'টি অর্ডার', 'টি পণ্য') */
  itemTypeLabelBn?: string;
  /** Summary preview list of specific items being affected */
  items?: ConfirmItemSummary[];
  /** Custom security or audit warning notice */
  auditWarning?: string | boolean;
  /** Bangla audit warning notice */
  auditWarningBn?: string;
  /** If true, requires operator to type a keyword to enable the confirm button */
  requiresTypedConfirmation?: boolean;
  /** The keyword required when requiresTypedConfirmation is true (default: 'DELETE' or 'CONFIRM') */
  confirmationKeyword?: string;
  /** Controlled loading state for async operations */
  isLoading?: boolean;
  /** Custom icon override */
  icon?: React.ReactNode;
  /** Language override (defaults to current app language) */
  language?: 'EN' | 'BN';
  /** Extra custom form inputs or metadata to render inside the dialog */
  children?: React.ReactNode;
}

export function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  titleBn,
  description,
  descriptionBn,
  variant = 'danger',
  confirmLabel,
  confirmLabelBn,
  cancelLabel,
  cancelLabelBn,
  count = 0,
  itemTypeLabel = 'item',
  itemTypeLabelBn,
  items = [],
  auditWarning = true,
  auditWarningBn,
  requiresTypedConfirmation = false,
  confirmationKeyword,
  isLoading: externalIsLoading,
  icon,
  language: langProp,
  children,
}: AdminConfirmDialogProps) {
  const { language: appLang } = useApp();
  const lang = langProp || appLang || 'EN';
  const isBn = lang === 'BN';

  const [internalLoading, setInternalLoading] = useState(false);
  const [typedKeyword, setTypedKeyword] = useState('');
  const [showAllItems, setShowAllItems] = useState(false);

  // Default confirmation keyword depends on variant
  const targetKeyword = (
    confirmationKeyword ||
    (variant === 'danger' ? (isBn ? 'DELETE' : 'DELETE') : 'CONFIRM')
  ).toUpperCase();

  // Reset inputs when opened
  useEffect(() => {
    if (isOpen) {
      setTypedKeyword('');
      setShowAllItems(false);
      setInternalLoading(false);
    }
  }, [isOpen]);

  const isLoading = externalIsLoading || internalLoading;

  // Accessible modal bindings
  const { containerRef, dialogProps } = useModalA11y({
    open: isOpen,
    onClose: isLoading ? () => {} : onClose,
    closeOnEscape: !isLoading && !requiresTypedConfirmation,
    label: isBn && titleBn ? titleBn : title,
  });

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isLoading) return;
    if (requiresTypedConfirmation && typedKeyword.trim().toUpperCase() !== targetKeyword) {
      return;
    }

    try {
      setInternalLoading(true);
      const res = onConfirm();
      if (res && typeof res.then === 'function') {
        await res;
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const isTypedMatch = !requiresTypedConfirmation || typedKeyword.trim().toUpperCase() === targetKeyword;

  // Visual styling config based on variant
  const variantConfig = {
    danger: {
      iconBg: 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-rose-900/10',
      badgeBg: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      defaultIcon: <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />,
      defaultConfirmText: isBn ? 'নিশ্চিত করুন ও মুছে ফেলুন' : 'Confirm & Delete',
    },
    warning: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-900/10',
      badgeBg: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      defaultIcon: <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />,
      defaultConfirmText: isBn ? 'নিশ্চিত করুন' : 'Confirm Action',
    },
    info: {
      iconBg: 'bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900',
      confirmBtn: 'bg-teal-900 hover:bg-teal-950 active:bg-black text-white shadow-teal-950/10',
      badgeBg: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      defaultIcon: <Info className="w-5 h-5 sm:w-6 sm:h-6" />,
      defaultConfirmText: isBn ? 'কার্যকর করুন' : 'Apply Changes',
    },
    success: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
      confirmBtn: 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white shadow-emerald-900/10',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      defaultIcon: <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />,
      defaultConfirmText: isBn ? 'সম্পন্ন করুন' : 'Complete Action',
    },
  }[variant];

  const displayTitle = isBn && titleBn ? titleBn : title;
  const displayDescription = isBn && descriptionBn ? descriptionBn : description;
  const displayConfirmLabel = (isBn && confirmLabelBn) ? confirmLabelBn : (confirmLabel || variantConfig.defaultConfirmText);
  const displayCancelLabel = (isBn && cancelLabelBn) ? cancelLabelBn : (cancelLabel || (isBn ? 'বাতিল' : 'Cancel'));

  const maxPreviewItems = 4;
  const visibleItems = showAllItems ? items : items.slice(0, maxPreviewItems);
  const hiddenCount = items.length - maxPreviewItems;

  return (
    <div
      ref={containerRef}
      {...dialogProps}
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (!isLoading && !requiresTypedConfirmation && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Strip with Icon */}
        <div className="p-4 sm:p-6 pb-2 sm:pb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border shrink-0 ${variantConfig.iconBg}`}>
              {icon || variantConfig.defaultIcon}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-white leading-snug">
                  {displayTitle}
                </h3>
                {count > 0 && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${variantConfig.badgeBg}`}>
                    <Layers className="w-3 h-3" />
                    <span>
                      {count} {isBn ? (itemTypeLabelBn || 'টি আইটেম') : `${itemTypeLabel}${count > 1 ? 's' : ''}`}
                    </span>
                  </span>
                )}
              </div>

              {displayDescription && (
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  {displayDescription}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body: Item previews, typed confirmation, custom inputs */}
        <div className="px-4 sm:px-6 py-2 overflow-y-auto space-y-3.5 text-xs">
          {/* Item Preview List (if provided) */}
          {items.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                <span>{isBn ? `প্রভাবিত আইটেমসমূহ (${items.length})` : `Affected Items (${items.length})`}</span>
                {items.length > maxPreviewItems && (
                  <button
                    type="button"
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="text-teal-700 dark:text-teal-400 hover:underline lowercase font-semibold"
                  >
                    {showAllItems 
                      ? (isBn ? 'সংক্ষিপ্ত করুন' : 'show less') 
                      : (isBn ? `আরও ${hiddenCount}টি দেখুন` : `+${hiddenCount} more`)}
                  </button>
                )}
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 divide-y divide-stone-200/60 dark:divide-stone-750 max-h-48 overflow-y-auto">
                {visibleItems.map((item) => (
                  <div key={item.id} className="py-2 first:pt-0.5 last:pb-0.5 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-stone-200 dark:bg-stone-750 flex items-center justify-center font-mono text-[10px] font-bold text-stone-500 shrink-0">
                          #
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                          {item.label}
                        </p>
                        {item.subtext && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono truncate">
                            {item.subtext}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.badge && (
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200/80 dark:bg-stone-750 text-stone-700 dark:text-stone-300">
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Slot / Children */}
          {children && <div className="pt-1">{children}</div>}

          {/* High-Risk Typed Safety Gate */}
          {requiresTypedConfirmation && (
            <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
              <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold text-xs">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {isBn 
                    ? `নিশ্চিত করতে অনুগ্রহ করে টাইপ করুন: "${targetKeyword}"` 
                    : `Please type "${targetKeyword}" to authorize:`}
                </span>
              </div>

              <input
                type="text"
                autoFocus
                value={typedKeyword}
                onChange={(e) => setTypedKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isTypedMatch && !isLoading) {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                placeholder={targetKeyword}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-stone-900 border border-rose-300 dark:border-rose-800 rounded-lg text-stone-900 dark:text-white uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Audit / Ledger Notice */}
          {auditWarning && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-100 dark:bg-stone-850 text-[11px] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800">
              <ShieldAlert className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span>
                {typeof auditWarning === 'string' 
                  ? (isBn && auditWarningBn ? auditWarningBn : auditWarning)
                  : (isBn 
                      ? 'এই ক্রিয়াকলাপটি অপরিবর্তনীয় এবং নিরাপত্তা নিরীক্ষা রেকর্ডে সংরক্ষিত হবে।' 
                      : 'This operational action is irreversible and recorded in the security audit ledger.')}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-stone-50 dark:bg-stone-850 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-initial px-4 py-2 bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            {displayCancelLabel}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isTypedMatch || isLoading}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${variantConfig.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isBn ? 'প্রক্রিয়াধীন...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{displayConfirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Convenience alias for bulk-specific confirmation dialogs.
 */
export const BulkActionConfirmModal = AdminConfirmDialog;
