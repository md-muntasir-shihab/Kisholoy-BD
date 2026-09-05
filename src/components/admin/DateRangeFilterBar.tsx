/**
 * @file src/components/admin/DateRangeFilterBar.tsx
 * @description Universal Reusable Date Range Filter Bar for Admin Modules.
 * Supports Presets, Specific Years, Months, Weeks, Custom Date Pickers, and Instant Export Triggers.
 */

import React, { useState } from 'react';
import { 
  Calendar, ChevronDown, Filter, RotateCcw, Download, 
  FileSpreadsheet, FileText, Check, Clock, CalendarDays,
  Sparkles, Layers
} from 'lucide-react';
import { 
  DateFilterConfig, 
  DateFilterPreset, 
  getDateRangeBounds, 
  AVAILABLE_YEARS, 
  BANGLA_MONTHS, 
  ENGLISH_MONTHS,
  toBanglaDigits,
  exportToExcel,
  exportToCsv
} from '../../utils/dateFilterUtils';
import { useApp } from '../../context/AppContext';

interface DateRangeFilterBarProps {
  value: DateFilterConfig;
  onChange: (newConfig: DateFilterConfig) => void;
  onExportExcel?: () => void;
  onExportCsv?: () => void;
  onOpenDataHub?: () => void;
  totalFilteredCount?: number;
  totalUnfilteredCount?: number;
  exportData?: Record<string, any>[];
  exportFilePrefix?: string;
  className?: string;
  showExportButtons?: boolean;
}

export function DateRangeFilterBar({
  value,
  onChange,
  onExportExcel,
  onExportCsv,
  onOpenDataHub,
  totalFilteredCount,
  totalUnfilteredCount,
  exportData,
  exportFilePrefix = 'Kisholoy_Report',
  className = '',
  showExportButtons = true,
}: DateRangeFilterBarProps) {
  const { language } = useApp();
  const isBn = language === 'BN';
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const bounds = getDateRangeBounds(value);
  const currentYear = new Date().getFullYear();

  const presets: { key: DateFilterPreset; labelEn: string; labelBn: string }[] = [
    { key: 'ALL', labelEn: 'All Time', labelBn: 'সর্বকালীন' },
    { key: 'TODAY', labelEn: 'Today', labelBn: 'আজ' },
    { key: 'YESTERDAY', labelEn: 'Yesterday', labelBn: 'গতকাল' },
    { key: 'LAST_2_DAYS', labelEn: '2 Days', labelBn: '২ দিন' },
    { key: 'LAST_5_DAYS', labelEn: '5 Days', labelBn: '৫ দিন' },
    { key: 'LAST_7_DAYS', labelEn: '7 Days', labelBn: '৭ দিন' },
    { key: 'THIS_MONTH', labelEn: 'This Month', labelBn: 'এই মাস' },
    { key: 'LAST_MONTH', labelEn: 'Last Month', labelBn: 'গত মাস' },
    { key: 'THIS_QUARTER', labelEn: 'Quarter', labelBn: 'ত্রৈমাসিক' },
    { key: 'THIS_YEAR', labelEn: 'This Year', labelBn: 'এই বছর' },
    { key: 'CUSTOM_RANGE', labelEn: 'Custom', labelBn: 'কাস্টম রেঞ্জ' },
  ];

  const handlePresetSelect = (preset: DateFilterPreset) => {
    if (preset === 'CUSTOM_RANGE') {
      setShowAdvanced(true);
      onChange({
        ...value,
        preset,
        startDate: value.startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: value.endDate || new Date().toISOString().split('T')[0],
      });
    } else {
      onChange({
        preset,
        selectedYear: currentYear,
        selectedMonth: new Date().getMonth(),
      });
    }
  };

  const handleYearChange = (year: number) => {
    onChange({
      ...value,
      preset: 'SPECIFIC_YEAR',
      selectedYear: year,
    });
  };

  const handleMonthChange = (monthIdx: number) => {
    onChange({
      ...value,
      preset: 'SPECIFIC_MONTH',
      selectedYear: value.selectedYear || currentYear,
      selectedMonth: monthIdx,
    });
  };

  const handleWeekChange = (weekNum: number) => {
    onChange({
      ...value,
      preset: 'SPECIFIC_WEEK',
      selectedYear: value.selectedYear || currentYear,
      selectedWeek: weekNum,
    });
  };

  const handleCustomDateChange = (type: 'start' | 'end', dateStr: string) => {
    onChange({
      ...value,
      preset: 'CUSTOM_RANGE',
      startDate: type === 'start' ? dateStr : value.startDate,
      endDate: type === 'end' ? dateStr : value.endDate,
    });
  };

  const handleReset = () => {
    onChange({
      preset: 'ALL',
      startDate: undefined,
      endDate: undefined,
      selectedYear: currentYear,
      selectedMonth: new Date().getMonth(),
    });
    setShowAdvanced(false);
  };

  const handleTriggerExcel = () => {
    setShowExportMenu(false);
    if (onExportExcel) {
      onExportExcel();
    } else if (exportData && exportData.length > 0) {
      exportToExcel(exportData, 'Records', exportFilePrefix, value);
    }
  };

  const handleTriggerCsv = () => {
    setShowExportMenu(false);
    if (onExportCsv) {
      onExportCsv();
    } else if (exportData && exportData.length > 0) {
      exportToCsv(exportData, exportFilePrefix, value);
    }
  };

  return (
    <div role="group" aria-label="Date range filters" className={`bg-stone-900 text-stone-100 rounded-2xl p-3 sm:p-4 border border-stone-800 shadow-md ${className}`}>
      {/* Top Header & Presets Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        
        {/* Left: Active Date Scope Banner */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-2 rounded-xl bg-teal-950 text-teal-400 border border-teal-800/80 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold">
                {isBn ? 'তারিখ ফিল্টার ও এনালিসিস' : 'Date Range Scope'}
              </span>
              <span className="text-xs font-serif font-bold text-white">
                &bull; {isBn ? bounds.labelBn : bounds.labelEn}
              </span>
            </div>
            {(totalFilteredCount !== undefined) && (
              <p className="text-[11px] text-stone-400 font-mono">
                {isBn
                  ? `চিহ্নিত রেকর্ড: ${toBanglaDigits(totalFilteredCount)} ${totalUnfilteredCount !== undefined ? `(মোট ${toBanglaDigits(totalUnfilteredCount)} এর মধ্যে)` : ''}`
                  : `Showing ${totalFilteredCount.toLocaleString()} matching records ${totalUnfilteredCount !== undefined ? `of ${totalUnfilteredCount.toLocaleString()}` : ''}`}
              </p>
            )}
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
          {/* Advanced Date Toggle (Year/Month/Week/Custom) */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              showAdvanced || ['SPECIFIC_YEAR', 'SPECIFIC_MONTH', 'SPECIFIC_WEEK', 'CUSTOM_RANGE'].includes(value.preset)
                ? 'bg-teal-900 text-teal-200 border-teal-700 shadow-xs'
                : 'bg-stone-800 hover:bg-stone-750 text-stone-300 border-stone-700'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{isBn ? 'সাল / মাস / সপ্তাহ / কাস্টম' : 'Year / Month / Custom'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* Reset button if filtered */}
          {value.preset !== 'ALL' && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 border border-stone-700 transition-colors min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center"
              title={isBn ? 'ফিল্টার রিসেট করুন' : 'Reset Date Filter'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Export Dropdown / Trigger */}
          {showExportButtons && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-900 hover:bg-emerald-850 text-emerald-100 border border-emerald-700 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isBn ? 'এক্সপোর্ট' : 'Export'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-stone-900 border border-stone-750 rounded-xl shadow-2xl p-1.5 z-40 text-xs animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={handleTriggerExcel}
                    className="w-full px-3 py-2 rounded-lg text-left hover:bg-stone-800 flex items-center gap-2 text-stone-200 hover:text-white transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold">{isBn ? 'Excel ফাইল (.xlsx)' : 'Excel Sheet (.xlsx)'}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{bounds.labelEn}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerCsv}
                    className="w-full px-3 py-2 rounded-lg text-left hover:bg-stone-800 flex items-center gap-2 text-stone-200 hover:text-white transition-colors"
                  >
                    <FileText className="w-4 h-4 text-teal-400" />
                    <div>
                      <div className="font-semibold">{isBn ? 'CSV ফাইল (.csv)' : 'CSV Format (.csv)'}</div>
                      <div className="text-[10px] text-stone-400 font-mono">UTF-8 Bangla supported</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Master Date Hub Trigger */}
          {onOpenDataHub && (
            <button
              type="button"
              onClick={onOpenDataHub}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-750 text-teal-300 border border-teal-800/80 transition-all flex items-center gap-1.5"
              title={isBn ? 'তারিখ ভিত্তিক মাস্টার এক্সপ্লোরার ও ইমপোর্ট হাব' : 'Open Master Date Analytics & Import/Export Hub'}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">{isBn ? 'ডেট হাব' : 'Date Hub'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Pills */}
      <div className="mt-3 pt-3 border-t border-stone-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        {presets.map((p) => {
          const isActive = value.preset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePresetSelect(p.key)}
              className={`px-3 py-1 rounded-xl font-semibold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-teal-800 text-white shadow-xs border border-teal-600'
                  : 'bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              {isBn ? p.labelBn : p.labelEn}
            </button>
          );
        })}
      </div>

      {/* Advanced Specific Year / Month / Week / Custom Date Pickers Drawer */}
      {showAdvanced && (
        <div className="mt-3 p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-3 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* 1. Year Selector (সাল নির্বাচন) */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold block">
                {isBn ? '১. নির্দিষ্ট সাল (Year)' : '1. Select Year'}
              </label>
              <select
                value={value.selectedYear || currentYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                className="w-full bg-stone-900 border border-stone-750 text-stone-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-700"
              >
                {AVAILABLE_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {isBn ? `সাল ${toBanglaDigits(yr)}` : `Year ${yr}`}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Month Selector (মাস নির্বাচন) */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold block">
                {isBn ? '২. নির্দিষ্ট মাস (Month)' : '2. Select Month'}
              </label>
              <select
                value={value.selectedMonth !== undefined ? value.selectedMonth : new Date().getMonth()}
                onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
                className="w-full bg-stone-900 border border-stone-750 text-stone-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-700"
              >
                {(isBn ? BANGLA_MONTHS : ENGLISH_MONTHS).map((mName, idx) => (
                  <option key={idx} value={idx}>
                    {mName}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Week of Year Selector (সপ্তাহ নির্বাচন) */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold block">
                {isBn ? '৩. নির্দিষ্ট সপ্তাহ (Week 1-52)' : '3. Week of Year'}
              </label>
              <select
                value={value.selectedWeek || 1}
                onChange={(e) => handleWeekChange(parseInt(e.target.value, 10))}
                className="w-full bg-stone-900 border border-stone-750 text-stone-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-700"
              >
                {Array.from({ length: 52 }, (_, i) => i + 1).map((wk) => (
                  <option key={wk} value={wk}>
                    {isBn ? `সপ্তাহ নং ${toBanglaDigits(wk)}` : `Week ${wk}`}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Quarter Presets (ত্রৈমাসিক) */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold block">
                {isBn ? '৪. ত্রৈমাসিক (Quarter)' : '4. Quarter (Q1-Q4)'}
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['Q1', 'Q2', 'Q3', 'Q4'] as DateFilterPreset[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onChange({ ...value, preset: q, selectedYear: value.selectedYear || currentYear })}
                    className={`py-1.5 text-center rounded-lg font-mono font-bold transition-all ${
                      value.preset === q
                        ? 'bg-teal-800 text-white border border-teal-600'
                        : 'bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-750'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Custom Date Range Pickers (কাস্টম রেঞ্জ: শুরু ও শেষ তারিখ) */}
          <div className="pt-2 border-t border-stone-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                {isBn ? 'কাস্টম শুরুর ও শেষ তারিখ:' : 'Custom Date Range:'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={value.startDate || ''}
                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                  className="bg-stone-900 border border-stone-750 text-stone-100 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-teal-700"
                />
                <span className="text-stone-500 font-mono">&rarr;</span>
                <input
                  type="date"
                  value={value.endDate || ''}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  className="bg-stone-900 border border-stone-750 text-stone-100 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-teal-700"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (value.startDate && value.endDate) {
                  onChange({ ...value, preset: 'CUSTOM_RANGE' });
                }
              }}
              className="px-3 py-1 rounded-lg bg-teal-900 hover:bg-teal-800 text-teal-200 font-semibold text-xs transition-colors"
            >
              {isBn ? 'রেঞ্জ প্রয়োগ করুন' : 'Apply Range'}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
