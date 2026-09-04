import React from 'react';
import { Languages } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LanguageButton: React.FC = () => {
  const { language, setLanguage } = useApp();
  const isBn = language === 'BN';

  return (
    <button
      onClick={() => setLanguage(isBn ? 'EN' : 'BN')}
      title={isBn ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
      aria-label="Toggle language"
      className="inline-flex h-9 px-2.5 items-center justify-center gap-1.5 rounded-full border border-stone-200/90 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:border-teal-700/60 dark:hover:border-teal-500 hover:text-teal-900 dark:hover:text-teal-300 active:scale-95 transition-all text-xs font-semibold shadow-2xs"
    >
      <Languages className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
      <span className="text-[11px] tracking-wide">{isBn ? 'বাং' : 'EN'}</span>
    </button>
  );
};
