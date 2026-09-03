import React, { useState } from 'react';
import { HelpCircle, AlertTriangle, CheckCircle, Shield, Link2, Info, X, ExternalLink } from 'lucide-react';

export interface AdminFunctionHelpData {
  id: string;
  title: string;
  titleBn: string;
  whatIsThis: string;
  whatIsThisBn: string;
  whyUsed: string;
  whyUsedBn: string;
  howItWorks: string;
  howItWorksBn: string;
  connectedTo: string[];
  connectedToBn: string[];
  whatHappensIfChanged: string;
  whatHappensIfChangedBn: string;
  affects: string[];
  affectsBn: string[];
  doesNotAffect: string[];
  doesNotAffectBn: string[];
  requirements: string[];
  requirementsBn: string[];
  currentStatus?: string;
  currentStatusBn?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskWarning: string;
  riskWarningBn: string;
  whoCanChange: string;
  whoCanChangeBn: string;
  providerDocLink?: string;
}

interface AdminHelpButtonProps {
  helpData: AdminFunctionHelpData;
  className?: string;
  size?: 'sm' | 'md';
}

export function AdminHelpButton({ helpData, className = '', size = 'sm' }: AdminHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<'EN' | 'BN'>('BN');

  const riskBadgeColor = {
    LOW: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200',
    HIGH: 'bg-orange-50 text-orange-800 border-orange-200',
    CRITICAL: 'bg-red-50 text-red-800 border-red-200'
  }[helpData.riskLevel];

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors p-1 ${className}`}
        title={`Help / Details: ${helpData.title}`}
        aria-label={`Help for ${helpData.title}`}
      >
        <HelpCircle className={size === 'sm' ? 'w-3.5 h-3.5 text-stone-400 hover:text-emerald-700' : 'w-4 h-4 text-stone-500 hover:text-emerald-800'} />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-stone-900 text-white flex justify-between items-center border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-800/80 flex items-center justify-center text-emerald-200 font-bold text-xs">
                  ⓘ
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    {lang === 'BN' ? helpData.titleBn : helpData.title}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {lang === 'BN' ? 'ফাংশন বিশদ ও প্রশাসনিক নির্দেশিকা' : 'Admin Function Specification & Safety Guidelines'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Language Switcher */}
                <div className="inline-flex rounded-lg bg-stone-800 p-0.5 border border-stone-700 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setLang('BN')}
                    className={`px-2 py-0.5 rounded-md transition-all ${lang === 'BN' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-400 hover:text-white'}`}
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('EN')}
                    className={`px-2 py-0.5 rounded-md transition-all ${lang === 'EN' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-400 hover:text-white'}`}
                  >
                    English
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-stone-400 hover:text-white rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-700 divide-y divide-stone-100">
              {/* Risk & Status Bar */}
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    {lang === 'BN' ? 'ঝুঁকির মাত্রা:' : 'Risk Level:'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskBadgeColor}`}>
                    {helpData.riskLevel}
                  </span>
                </div>
                {helpData.currentStatus && (
                  <div className="text-[11px] font-mono text-stone-500">
                    {lang === 'BN' ? 'বর্তমান স্ট্যাটাস:' : 'Current Status:'}{' '}
                    <strong className="text-emerald-800">{lang === 'BN' ? (helpData.currentStatusBn || helpData.currentStatus) : helpData.currentStatus}</strong>
                  </div>
                )}
              </div>

              {/* 1. What is this? & 2. Why is it used? */}
              <div className="pt-3 space-y-3">
                <div>
                  <h4 className="font-bold text-stone-900 mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <Info className="w-3.5 h-3.5 text-emerald-800" />
                    {lang === 'BN' ? '১. এটা কী? (What is this?)' : '1. What is this?'}
                  </h4>
                  <p className="leading-relaxed bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    {lang === 'BN' ? helpData.whatIsThisBn : helpData.whatIsThis}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-stone-900 mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-800" />
                    {lang === 'BN' ? '২. কেন ব্যবহৃত হয়? (Why is it used?)' : '2. Why is it used?'}
                  </h4>
                  <p className="leading-relaxed bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    {lang === 'BN' ? helpData.whyUsedBn : helpData.whyUsed}
                  </p>
                </div>
              </div>

              {/* 3. How does it work? */}
              <div className="pt-3">
                <h4 className="font-bold text-stone-900 mb-1 text-xs uppercase tracking-wide">
                  {lang === 'BN' ? '৩. এটি কীভাবে কাজ করে? (How does it work?)' : '3. How does it work?'}
                </h4>
                <p className="leading-relaxed text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  {lang === 'BN' ? helpData.howItWorksBn : helpData.howItWorks}
                </p>
              </div>

              {/* 4. Connected to */}
              <div className="pt-3">
                <h4 className="font-bold text-stone-900 mb-1 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-indigo-700" />
                  {lang === 'BN' ? '৪. কার সাথে যুক্ত? (What is it connected to?)' : '4. What is it connected to?'}
                </h4>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(lang === 'BN' ? helpData.connectedToBn : helpData.connectedTo).map((item, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded font-mono text-[10px]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* 5. What happens if changed? */}
              <div className="pt-3">
                <h4 className="font-bold text-stone-900 mb-1 text-xs uppercase tracking-wide">
                  {lang === 'BN' ? '৫. পরিবর্তন করলে কী ঘটবে? (What happens if changed?)' : '5. What happens if changed?'}
                </h4>
                <p className="leading-relaxed text-amber-900 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                  {lang === 'BN' ? helpData.whatHappensIfChangedBn : helpData.whatHappensIfChanged}
                </p>
              </div>

              {/* 6. Affects vs 7. Does NOT affect */}
              <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <span className="font-bold text-stone-900 block mb-1 text-[11px] text-emerald-900">
                    {lang === 'BN' ? '৬. যা প্রভাবিত হবে (Affects):' : '6. What it AFFECTS:'}
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-600">
                    {(lang === 'BN' ? helpData.affectsBn : helpData.affects).map((af, i) => (
                      <li key={i}>{af}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <span className="font-bold text-stone-900 block mb-1 text-[11px] text-stone-600">
                    {lang === 'BN' ? '৭. যা প্রভাবিত হবে না (Does NOT affect):' : '7. What it does NOT affect:'}
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-500">
                    {(lang === 'BN' ? helpData.doesNotAffectBn : helpData.doesNotAffect).map((naf, i) => (
                      <li key={i}>{naf}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 8. Requirements */}
              <div className="pt-3">
                <span className="font-bold text-stone-900 block mb-1 text-xs uppercase tracking-wide">
                  {lang === 'BN' ? '৮. কী কী প্রয়োজন? (What is required?)' : '8. What is required?'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {(lang === 'BN' ? helpData.requirementsBn : helpData.requirements).map((req, i) => (
                    <span key={i} className="px-2 py-0.5 bg-stone-100 border border-stone-300 text-stone-800 rounded text-[11px] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-700" /> {req}
                    </span>
                  ))}
                </div>
              </div>

              {/* 9. Warning / Risk & 10. Who can change */}
              <div className="pt-3 space-y-2">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[11px] font-bold uppercase tracking-wider">
                      {lang === 'BN' ? 'সতর্কবার্তা ও ঝুঁকি (Warning & Operational Risk):' : 'Warning & Operational Risk:'}
                    </strong>
                    <span className="text-[11px] mt-0.5 block leading-relaxed">
                      {lang === 'BN' ? helpData.riskWarningBn : helpData.riskWarning}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-stone-600" />
                    <span>{lang === 'BN' ? 'অনুমোদিত প্রশাসক রোল:' : 'Permitted Admin Roles:'}</span>
                    <strong className="font-semibold text-stone-800">
                      {lang === 'BN' ? helpData.whoCanChangeBn : helpData.whoCanChange}
                    </strong>
                  </div>
                  {helpData.providerDocLink && (
                    <a
                      href={helpData.providerDocLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-800 hover:text-emerald-950 font-bold inline-flex items-center gap-1"
                    >
                      {lang === 'BN' ? 'অফিসিয়াল ডকুমেন্টেশন' : 'Official Docs'} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
              >
                {lang === 'BN' ? 'বুঝেছি / বন্ধ করুন' : 'Understood / Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
