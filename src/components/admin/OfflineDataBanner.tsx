import React from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface OfflineDataBannerProps {
  /** What failed to load, e.g. "customer directory". Shown in the message. */
  resource: string;
  resourceBn?: string;
  /** True when the screen is showing local/cached data instead of server data. */
  visible: boolean;
  /** Optional retry handler; renders a retry button when provided. */
  onRetry?: () => void;
  /** True while a retry is in flight. */
  retrying?: boolean;
}

/**
 * Tells the operator that the panel is showing fallback data.
 *
 * Several admin screens catch a failed load and quietly substitute local
 * context data. The fallback itself is good — the panel stays usable offline —
 * but showing it with no marker meant an operator could read stale numbers,
 * or an empty audit ledger, and believe they were looking at the server
 * (F-305). This makes that state explicit without breaking the fallback.
 */
export function OfflineDataBanner({
  resource,
  resourceBn,
  visible,
  onRetry,
  retrying = false,
}: OfflineDataBannerProps) {
  const { language } = useApp();
  const isBn = language === 'BN';

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-900"
    >
      <CloudOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      <p className="text-[11px] leading-relaxed flex-1 min-w-0">
        {isBn
          ? `সার্ভার থেকে ${resourceBn || resource} লোড করা যায়নি — স্থানীয়ভাবে সংরক্ষিত তথ্য দেখানো হচ্ছে, যা পুরোনো হতে পারে।`
          : `Could not load the ${resource} from the server — showing locally cached data, which may be out of date.`}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-white px-2.5 py-1 text-[11px] font-bold hover:bg-amber-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        >
          <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
          {retrying
            ? isBn ? 'চেষ্টা করা হচ্ছে…' : 'Retrying…'
            : isBn ? 'আবার চেষ্টা করুন' : 'Retry'}
        </button>
      )}
    </div>
  );
}
