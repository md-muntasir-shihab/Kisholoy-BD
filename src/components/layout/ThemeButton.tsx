import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ThemePreference } from '../../context/AppContext';

const OPTIONS: { key: ThemePreference; icon: typeof Sun; label: string; labelBn: string }[] = [
  { key: 'light', icon: Sun, label: 'Light', labelBn: 'লাইট' },
  { key: 'dark', icon: Moon, label: 'Dark', labelBn: 'ডার্ক' },
  { key: 'system', icon: Monitor, label: 'System', labelBn: 'সিস্টেম' },
];

export const ThemeButton: React.FC = () => {
  const { theme, setTheme, language } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isBn = language === 'BN';

  const active = OPTIONS.find((o) => o.key === theme) || OPTIONS[2];
  const ActiveIcon = active.icon;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={isBn ? 'ডিসপ্লে মোড' : 'Display mode'}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/90 text-stone-700 dark:text-slate-200 hover:border-teal-700 dark:hover:border-teal-500 hover:text-teal-900 dark:hover:text-teal-300 hover:bg-stone-100 dark:hover:bg-slate-800 active:scale-[0.95] transition-all shadow-xs"
      >
        <ActiveIcon className="h-4 w-4 text-teal-700 dark:text-teal-400" />
        <ChevronDown className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 text-stone-400 dark:text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 w-44 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.key;
            return (
              <button
                key={opt.key}
                role="menuitem"
                aria-pressed={isActive}
                onClick={() => {
                  setTheme(opt.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-teal-900 text-white dark:bg-teal-500/20 dark:text-teal-200'
                    : 'text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-teal-100 dark:text-teal-300' : 'text-stone-400 dark:text-slate-500'}`} />
                <span>{isBn ? opt.labelBn : opt.label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400"></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
