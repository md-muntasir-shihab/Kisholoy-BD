/**
 * @file src/components/theme/ThemeSwitcher.tsx
 * @description Reusable Light / Dark / System theme selector. Reads and writes
 *   the persisted theme preference through the app context (no page reload).
 * @license Apache-2.0
 */

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ThemePreference } from '../../context/AppContext';

interface Props {
  compact?: boolean;
}

const OPTIONS: { key: ThemePreference; icon: React.ComponentType<{ className?: string }>; label: string; labelBn: string }[] = [
  { key: 'light', icon: Sun, label: 'Light', labelBn: 'লাইট' },
  { key: 'dark', icon: Moon, label: 'Dark', labelBn: 'ডার্ক' },
  { key: 'system', icon: Monitor, label: 'System', labelBn: 'সিস্টেম' },
];

export function ThemeSwitcher({ compact = false }: Props) {
  const { theme, setTheme, language } = useApp();
  const isBn = language === 'BN';

  return (
    <div
      className="inline-flex items-center rounded-xl border border-stone-200 bg-white p-0.5"
      role="group"
      aria-label={isBn ? 'থিম নির্বাচন' : 'Theme selector'}
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => setTheme(opt.key)}
            aria-pressed={active}
            title={`${opt.label} mode`}
            className={`inline-flex items-center justify-center rounded-lg transition-all ${
              compact ? 'h-8 w-8' : 'h-9 px-3 gap-1.5'
            } ${
              active
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {!compact && <span className="text-xs font-bold">{isBn ? opt.labelBn : opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
