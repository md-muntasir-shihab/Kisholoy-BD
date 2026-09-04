import React from 'react';
import { Languages } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LanguageButton: React.FC = () => {
  const { language, setLanguage } = useApp();
  const isBn = language === 'BN';

  return (
    <button
      onClick={() => setLanguage(isBn ? 'EN' : 'BN')}
      title={isBn ? 'English' : 'বাংলা'}
      aria-label="Toggle language"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/90 text-stone-700 dark:text-slate-200 hover:border-teal-700 dark:hover:border-teal-500 hover:text-teal-900 dark:hover:text-teal-300 hover:bg-stone-100 dark:hover:bg-slate-800 active:scale-[0.95] transition-all shadow-xs"
    >
      <Languages className="h-4 w-4 text-teal-700 dark:text-teal-400" />
    </button>
  );
};
