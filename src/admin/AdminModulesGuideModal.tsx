import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Search, ArrowRight, ShieldCheck, CheckCircle2, 
  ExternalLink, Sparkles, BookOpen, Layers
} from 'lucide-react';
import { ADMIN_SECTIONS_DATA, AdminModuleItem, getSectionBadgeCount } from './adminModulesData';
import { useApp } from '../context/AppContext';

interface AdminModulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSectionId?: string;
}

export function AdminModulesGuideModal({ isOpen, onClose, initialSectionId }: AdminModulesGuideModalProps) {
  const { language, orders, products } = useApp();
  const [selectedSection, setSelectedSection] = useState<string>(initialSectionId || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const pendingOrdersCount = orders.filter(o => o.orderStatus === 'PENDING').length;
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const highRiskCount = orders.filter(o => o.fraudRisk && (o.fraudRisk.riskScore >= 60 || o.fraudRisk.riskRating === 'HIGH' || o.fraudRisk.riskRating === 'SUSPICIOUS')).length;

  const counts = {
    pendingOrders: pendingOrdersCount,
    lowStock: lowStockCount,
    fraudAlerts: highRiskCount
  };

  const filteredSections = ADMIN_SECTIONS_DATA.map(section => {
    if (selectedSection !== 'all' && section.id !== selectedSection) {
      return null;
    }

    const matchingItems = section.items.filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.label.toLowerCase().includes(q) ||
        item.labelBn.toLowerCase().includes(q) ||
        item.tagline.toLowerCase().includes(q) ||
        item.taglineBn.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.descriptionBn.toLowerCase().includes(q) ||
        item.tasksEn.some(t => t.toLowerCase().includes(q)) ||
        item.tasksBn.some(t => t.toLowerCase().includes(q))
      );
    });

    if (matchingItems.length === 0) return null;

    return {
      ...section,
      items: matchingItems
    };
  }).filter(Boolean) as typeof ADMIN_SECTIONS_DATA;

  const isBn = language === 'BN';

  return (
    <div 
      id="admin-guide-modal-overlay" 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div 
        id="admin-guide-modal"
        className="bg-white text-stone-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-start justify-between border-b border-stone-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-teal-400" />
                {isBn ? 'অপারেশনাল গাইড ও দায়িত্ব বিবরণী' : 'Operations Directory & Work Guide'}
              </span>
              <span className="text-xs text-stone-400 font-mono">23 Desks</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              {isBn 
                ? 'এডমিন প্যানেলের সকল সেকশন ও কাজের বিস্তারিত বিবরণ' 
                : 'Admin Panel Sections & Operational Work Breakdown'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-3xl">
              {isBn
                ? 'প্রতিটি সেকশন ও ডেস্কের সুনির্দিষ্ট দায়িত্ব, কি কি কাজ করতে হবে তা দেখুন এবং সরাসরি সংশ্লিষ্ট কর্মক্ষেত্রে চলে যান।'
                : 'Detailed responsibilities, workflow tasks, and direct quick-action buttons to enter every administrative workspace.'}
            </p>
          </div>

          <button
            id="admin-guide-modal-close-btn"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors"
            title={isBn ? 'বন্ধ করুন' : 'Close Guide'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Section Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedSection('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                selectedSection === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {isBn ? 'সকল সেকশন (২৩)' : 'All Sections (23)'}
            </button>
            {ADMIN_SECTIONS_DATA.map(sec => (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  selectedSection === sec.id
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {isBn ? sec.titleBn : sec.title} ({sec.items.length})
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'কাজের বিবরণ বা নাম খুঁজুন...' : 'Search desks or duties...'}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 bg-stone-100/50">
          {filteredSections.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
              <Layers className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-700">
                {isBn ? 'কোনো মডিউল পাওয়া যায়নি' : 'No matching modules found'}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {isBn ? 'অন্য কোনো কীওয়ার্ড দিয়ে অনুসন্ধান করে দেখুন।' : 'Try adjusting your search query or reset the filter.'}
              </p>
            </div>
          ) : (
            filteredSections.map(section => (
              <div 
                key={section.id} 
                id={`guide-section-${section.id}`}
                className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden"
              >
                {/* Section Banner */}
                <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {isBn ? section.titleBn : section.title}
                      </span>
                      <span className="text-xs text-stone-500">
                        {isBn ? section.badgeTextBn : section.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      {isBn ? section.summaryBn : section.summary}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-stone-200">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const badge = getSectionBadgeCount(item.badgeKey, counts);

                    return (
                      <div 
                        key={item.path}
                        id={`guide-card-${item.id}`}
                        className="p-4 sm:p-5 hover:bg-stone-50/70 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
                      >
                        {/* Left Info */}
                        <div className="flex items-start gap-3.5 flex-1">
                          <div className="p-2.5 bg-stone-100 text-teal-900 rounded-xl border border-stone-200 shrink-0 mt-0.5">
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-stone-900">
                                {isBn ? item.labelBn : item.label}
                              </h3>
                              <span className="text-xs font-mono text-stone-400 font-normal">
                                ({isBn ? item.label : item.labelBn})
                              </span>

                              {badge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                                  {isBn ? badge.labelBn : badge.label}
                                </span>
                              )}

                              <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                                {isBn ? item.roleBn : item.role}
                              </span>
                            </div>

                            {/* Tagline */}
                            <p className="text-xs font-medium text-stone-700">
                              {isBn ? item.taglineBn : item.tagline}
                            </p>

                            {/* Full Detailed Description */}
                            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 text-xs text-stone-600 leading-relaxed">
                              <strong className="font-semibold text-stone-800 block mb-1">
                                {isBn ? '📌 কাজের পূর্ণ বিবরণ (Purpose & Scope):' : '📌 Full Purpose & Operational Scope:'}
                              </strong>
                              {isBn ? item.descriptionBn : item.description}
                            </div>

                            {/* Key Tasks Checklist */}
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
                                {isBn ? 'প্রধান কাজ ও দায়িত্বসমূহ:' : 'Key Actionable Tasks:'}
                              </span>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-stone-700">
                                {(isBn ? item.tasksBn : item.tasksEn).map((task, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 mt-0.5 shrink-0" />
                                    <span>{task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Right Action Button - Prominently visible next to every module! */}
                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2 pt-2 md:pt-0 shrink-0">
                          <Link
                            id={`guide-btn-${item.id}`}
                            to={item.path}
                            onClick={onClose}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-all group whitespace-nowrap"
                          >
                            <span>{isBn ? 'কাজ দেখুন' : 'View Work'}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>

                          <span className="text-[10px] font-mono text-stone-400">
                            {item.path}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>
              {isBn 
                ? 'কিশোলয় ই-কমার্স এন্টারপ্রাইজ সিস্টেম • সকল মডিউল সক্রিয়' 
                : 'Kisholoy eCommerce Enterprise Core • All Desks Active'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg font-bold text-xs"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
