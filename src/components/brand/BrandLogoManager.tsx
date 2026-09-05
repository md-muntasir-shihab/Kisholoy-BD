import React, { useState, useRef } from 'react';
import { 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Image as ImageIcon, 
  Layers, 
  Sliders, 
  Sun, 
  Moon, 
  Code, 
  Eye, 
  Info, 
  Check, 
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo, OfficialKisholoyVector } from './BrandLogo';

export function BrandLogoManager() {
  const { siteContent, uploadAndApplyLogo, resetToDefaultLogo, isDarkMode, language } = useApp();
  const isBn = language === 'BN';

  const [activeTab, setActiveTab] = useState<'upload' | 'svg' | 'settings'>('upload');
  const [svgInput, setSvgInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewHeight, setPreviewHeight] = useState<number>(siteContent.logoHeight || 44);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const darkFileInputRef = useRef<HTMLInputElement>(null);

  const isDefaultActive = !siteContent.logoUrl || 
    siteContent.logoUrl === '/brand/kisholoy-logo.svg' || 
    siteContent.logoUrl.includes('kisholoy-logo');

  // Handle image file upload (auto-applies globally)
  const handleFileUpload = async (file: File, isDarkVariant = false) => {
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(isBn ? 'লোগো ফাইলের আকার ৫ মেগাবাইটের কম হতে হবে।' : 'Logo file size must be under 5MB.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async () => {
      const dataUrl = reader.result as string;
      if (isDarkVariant) {
        await uploadAndApplyLogo({
          logoUrl: siteContent.logoUrl || '/brand/kisholoy-logo.svg',
          logoDarkUrl: dataUrl,
          logoHeight: siteContent.logoHeight || 44,
          logoType: siteContent.logoType || 'IMAGE'
        }, 'Uploaded dark variant brand logo');
      } else {
        await uploadAndApplyLogo({
          logoUrl: dataUrl,
          logoHeight: siteContent.logoHeight || 44,
          logoType: siteContent.logoType || 'IMAGE'
        }, 'Uploaded primary brand logo globally');
      }
      setIsProcessing(false);
    };

    reader.onerror = () => {
      setIsProcessing(false);
      alert(isBn ? 'ফাইল পড়তে সমস্যা হয়েছে।' : 'Failed to read the file.');
    };

    if (file.type === 'image/svg+xml') {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  // Handle direct SVG code application
  const handleApplySvgCode = async () => {
    if (!svgInput.trim() || !svgInput.includes('<svg')) {
      alert(isBn ? 'দয়া করে সঠিক <svg>...</svg> কোড প্রদান করুন।' : 'Please provide valid <svg>...</svg> code.');
      return;
    }

    setIsProcessing(true);
    await uploadAndApplyLogo({
      logoUrl: svgInput.trim(),
      logoHeight: previewHeight,
      logoType: 'IMAGE'
    }, 'Applied custom SVG vector markup as brand logo');
    setIsProcessing(false);
    setSvgInput('');
  };

  // Handle height slider change & live auto-apply
  const handleHeightChange = (height: number) => {
    setPreviewHeight(height);
    uploadAndApplyLogo({
      logoUrl: siteContent.logoUrl || '/brand/kisholoy-logo.svg',
      logoHeight: height
    }, `Adjusted logo height to ${height}px`);
  };

  // Handle display type change
  const handleTypeChange = (type: 'IMAGE' | 'BOTH_IMAGE_AND_TEXT' | 'EMBLEM_AND_TEXT' | 'TEXT') => {
    uploadAndApplyLogo({
      logoUrl: siteContent.logoUrl || '/brand/kisholoy-logo.svg',
      logoType: type
    }, `Updated brand logo display format to ${type}`);
  };

  // Handle emblem motif change
  const handleEmblemChange = (style: any) => {
    uploadAndApplyLogo({
      logoUrl: siteContent.logoUrl || '/brand/kisholoy-logo.svg',
      logoType: 'EMBLEM_AND_TEXT',
      logoEmblemStyle: style
    }, `Updated craft emblem style to ${style}`);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-teal-50/50 via-emerald-50/30 to-amber-50/30 dark:from-teal-950/20 dark:via-stone-900 dark:to-stone-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-800 text-teal-100 flex items-center justify-center font-bold text-sm shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-black text-stone-900 dark:text-white">
                {isBn ? 'সার্বজনীন ব্র্যান্ড লোগো সেন্টার' : 'Universal Brand Logo Center'}
              </h2>
              {isDefaultActive ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {isBn ? 'অফিসিয়াল ভেক্টর সক্রিয়' : 'Official Vector Active'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {isBn ? 'কাস্টম লোগো সক্রিয়' : 'Custom Logo Active'}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-2xl">
              {isBn 
                ? 'এখানে একবার লোগো আপলোড করলে ওয়েবসাইট হেডার, মোবাইল ড্রপডাউন মেনু, ফুটার, অ্যাডমিন প্যানেল ও ইনভয়েসসহ সকল স্থানে তাৎক্ষণিকভাবে অটোমেটিক আপডেট হয়ে যায়।' 
                : 'Upload or configure your brand logo once here. It automatically synchronizes in real time across storefront navbar, mobile menu, footer, admin panel, and printed receipts.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => resetToDefaultLogo()}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>{isBn ? 'ডিফল্ট অফিসিয়াল লোগো' : 'Reset to Default'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Surface Real-time Live Previews */}
      <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            {isBn ? 'লাইভ প্রিভিউ (সকল সারফেসে কেমন দেখাবে)' : 'Multi-Surface Live Preview'}
          </span>
          <span className="text-[11px] text-stone-400 font-mono">
            Height: {siteContent.logoHeight || 44}px
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Surface 1: Light Mode (Storefront Navbar & Invoices) */}
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                {isBn ? 'ওয়েবসাইট হেডার ও ইনভয়েস' : 'Storefront Navbar & Print'}
              </span>
              <span className="text-[10px] text-stone-400">Light Surface</span>
            </div>
            <div className="py-3 flex items-center justify-center min-h-[64px] overflow-hidden">
              <BrandLogo variant="light" size="md" linkToHome={false} showTagline={false} />
            </div>
            <div className="text-[10px] text-stone-400 text-center">
              {isBn ? 'হোয়াইট ব্যাকগ্রাউন্ডে স্বয়ংক্রিয় অভিযোজিত' : 'Clean & high-contrast on light backgrounds'}
            </div>
          </div>

          {/* Surface 2: Dark Mode (Footer & Dark Theme) */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 shadow-2xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-[11px] font-bold text-stone-200 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-teal-400" />
                {isBn ? 'ওয়েবসাইট ফুটার ও ডার্ক মোড' : 'Storefront Footer & Dark'}
              </span>
              <span className="text-[10px] text-stone-500">Dark Surface</span>
            </div>
            <div className="py-3 flex items-center justify-center min-h-[64px] overflow-hidden">
              <BrandLogo variant="dark" size="md" linkToHome={false} showTagline={false} />
            </div>
            <div className="text-[10px] text-stone-500 text-center">
              {isBn ? 'ডার্ক ব্যাকগ্রাউন্ডে উজ্জ্বল ও স্পষ্ট' : 'Optically calibrated for dark backgrounds'}
            </div>
          </div>

          {/* Surface 3: Admin Panel Header */}
          <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 shadow-2xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
              <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                {isBn ? 'অ্যাডমিন প্যানেল হেডার' : 'Admin Panel Ops Bar'}
              </span>
              <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono font-bold">OPS BAR</span>
            </div>
            <div className="py-3 flex items-center justify-center min-h-[64px] overflow-hidden">
              <div className="flex items-center gap-2">
                <BrandLogo variant={isDarkMode ? 'dark' : 'light'} size="sm" linkToHome={false} showTagline={false} />
                <span className="text-teal-800 dark:text-teal-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800">
                  OPS
                </span>
              </div>
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 text-center">
              {isBn ? 'অ্যাডমিন হেডার ও সাইডবারে সক্রিয়' : 'Synchronized in admin navigation'}
            </div>
          </div>
        </div>
      </div>

      {/* Control Tabs */}
      <div className="px-5 sm:px-6 pt-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'upload'
              ? 'border-teal-700 text-teal-900 dark:text-teal-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>{isBn ? 'ফাইল আপলোড (অটো-আপডেট)' : 'Upload File (Auto-Sync)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('svg')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'svg'
              ? 'border-teal-700 text-teal-900 dark:text-teal-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>{isBn ? 'সরাসরি এসভিজি কোড' : 'Direct SVG Vector'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-teal-700 text-teal-900 dark:text-teal-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{isBn ? 'সাইজ ও ডিসপ্লে মোড' : 'Size & Display Mode'}</span>
        </button>
      </div>

      {/* Tab 1: Upload File with Drag & Drop & Instant Apply */}
      {activeTab === 'upload' && (
        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Logo (Light Backgrounds & Universal) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
                <span>{isBn ? '১. মূল লোগো (Primary Logo - Universal)' : '1. Primary Logo (Universal)'}</span>
                <span className="text-[10px] text-teal-700 dark:text-teal-400 font-normal">
                  {isBn ? 'এসভিজি / পিএনজি / ওয়েবপি' : 'SVG / PNG / WebP'}
                </span>
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file, false);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40'
                    : 'border-stone-300 dark:border-stone-700 hover:border-teal-700 dark:hover:border-teal-500 bg-stone-50/60 dark:bg-stone-900/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/svg+xml,image/png,image/webp,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, false);
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="text-xs font-bold text-stone-900 dark:text-white">
                  {isBn ? 'ফাইল ড্রপ করুন অথবা ব্রাউজ করুন' : 'Drop image here or click to browse'}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                  {isBn 
                    ? 'ফাইল নির্বাচন করা মাত্রই এটি স্বয়ংক্রিয়ভাবে সর্বত্র (ফ্রন্ট ও অ্যাডমিন) সেট হয়ে যাবে।' 
                    : 'Selecting a file immediately uploads and activates it globally across storefront and admin.'}
                </p>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-mono">
                    .SVG
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-mono">
                    .PNG
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-mono">
                    .WEBP
                  </span>
                </div>
              </div>
            </div>

            {/* Dark Variant Logo (Optional for Footer/Dark Theme) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
                <span>{isBn ? '২. ডার্ক মোড ভ্যারিয়েন্ট (Dark Background Variant)' : '2. Dark Surface Variant'}</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-normal">
                  {isBn ? 'ঐচ্ছিক (ফুটার ও ডার্ক থিমে ব্যবহৃত)' : 'Optional (Footer/Dark)'}
                </span>
              </label>

              <div
                onClick={() => darkFileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-600 dark:hover:border-amber-500 bg-stone-50/60 dark:bg-stone-900/60 rounded-2xl p-6 text-center cursor-pointer transition-all"
              >
                <input
                  ref={darkFileInputRef}
                  type="file"
                  accept="image/svg+xml,image/png,image/webp,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, true);
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <Moon className="w-6 h-6" />
                </div>

                <div className="text-xs font-bold text-stone-900 dark:text-white">
                  {isBn ? 'ডার্ক মোড লোগো আপলোড' : 'Upload Dark Variant'}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                  {isBn
                    ? 'গাঢ় বা কালো ব্যাকগ্রাউন্ডে সাদা বা গোল্ডেন রঙের লোগো দেখাতে চাইলে এটি নির্বাচন করুন।'
                    : 'Optional white/light logo for dark footer or night theme.'}
                </p>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      uploadAndApplyLogo({
                        logoUrl: siteContent.logoUrl || '/brand/kisholoy-logo.svg',
                        logoDarkUrl: undefined
                      }, 'Removed separate dark variant, using universal logo');
                    }}
                    className="text-[10px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
                  >
                    {isBn ? 'ডার্ক ভ্যারিয়েন্ট মুছে সার্বজনীন লোগো ব্যবহার করুন' : 'Clear dark variant'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick URL Input */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                {isBn ? 'অথবা লোগোর সরাসরি লিংক / পাথ দিন (Direct Asset Path / URL)' : 'Or specify direct Asset Path / Image URL'}
              </label>
              <input
                type="text"
                defaultValue={siteContent.logoUrl || '/brand/kisholoy-logo.svg'}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val && val !== siteContent.logoUrl) {
                    uploadAndApplyLogo({ logoUrl: val }, 'Updated logo from direct URL');
                  }
                }}
                className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                placeholder="/brand/kisholoy-logo.svg or https://..."
              />
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 self-end sm:self-center">
              {isBn ? 'ইনপুট থেকে সরলেই অটো-সেভ হবে' : 'Auto-saves on blur'}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Direct SVG Code Input */}
      {activeTab === 'svg' && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
              <span>{isBn ? 'এসভিজি ভেক্টর মার্কআপ পেস্ট করুন (<svg ...>...</svg>)' : 'Paste SVG Vector Markup'}</span>
              <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono font-bold">100% VECTOR RESOLUTION</span>
            </label>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {isBn 
                ? 'ইলাস্ট্রেটর, ফিগমা বা ইনকস্কেপ থেকে সরাসরি আপনার লোগোর এসভিজি কোড কপি করে এখানে পেস্ট করুন।' 
                : 'Directly paste SVG code from Figma or Illustrator. It will be rendered crisply at any scale.'}
            </p>
            <textarea
              rows={8}
              value={svgInput}
              onChange={(e) => setSvgInput(e.target.value)}
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200"> ... </svg>'
              className="w-full text-xs font-mono p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleApplySvgCode}
              disabled={isProcessing || !svgInput.trim()}
              className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 dark:bg-teal-700 dark:hover:bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isBn ? 'এসভিজি ভেক্টর লোগো হিসেবে প্রয়োগ করুন' : 'Apply SVG Vector as Logo'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Size & Display Mode Settings */}
      {activeTab === 'settings' && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Sizing Slider */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-white block">
                  {isBn ? 'লোগো উচ্চতা নিয়ন্ত্রণ (Logo Height Scaling)' : 'Logo Height Scaling'}
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  {isBn ? 'হেডার, মোবাইল মেনু ও ফুটারের লোগো আকার অ্যাডজাস্ট করুন' : 'Fine-tune logo size across all devices'}
                </span>
              </div>
              <span className="px-3 py-1 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-300 font-mono text-xs font-bold border border-teal-200 dark:border-teal-800">
                {previewHeight}px
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[11px] text-stone-400 font-mono">28px</span>
              <input
                type="range"
                min={28}
                max={72}
                step={2}
                value={previewHeight}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
                className="flex-1 accent-teal-700 cursor-pointer"
              />
              <span className="text-[11px] text-stone-400 font-mono">72px</span>
            </div>
          </div>

          {/* Display Mode Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
              {isBn ? 'লোগো প্রদর্শন বিন্যাস (Display Mode)' : 'Brand Display Format'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  type: 'IMAGE',
                  title: isBn ? 'খাঁটি লোগো গ্রাফিক' : 'Pure Graphic',
                  subtitle: isBn ? 'শুধু ইমেজ বা ভেক্টর মার্ক' : 'Image/Vector wordmark only',
                  icon: ImageIcon
                },
                {
                  type: 'BOTH_IMAGE_AND_TEXT',
                  title: isBn ? 'লোগো এবং নাম' : 'Logo + Text',
                  subtitle: isBn ? 'লোগোর সাথে ব্র্যান্ডের নাম' : 'Symbol followed by brand name',
                  icon: Layers
                },
                {
                  type: 'EMBLEM_AND_TEXT',
                  title: isBn ? 'হস্তশিল্পের মোটিফ' : 'Craft Emblem',
                  subtitle: isBn ? 'ঐতিহ্যবাহী আর্ট সিল' : 'Traditional craft seal + name',
                  icon: Sparkles
                },
                {
                  type: 'TEXT',
                  title: isBn ? 'বিশুদ্ধ টাইপোগ্রাফি' : 'Typography',
                  subtitle: isBn ? 'শুধুমাত্র টেক্সট' : 'Clean text only',
                  icon: Info
                }
              ].map((mode) => {
                const isSelected = (siteContent.logoType || 'IMAGE') === mode.type;
                const IconComp = mode.icon;
                return (
                  <button
                    key={mode.type}
                    type="button"
                    onClick={() => handleTypeChange(mode.type as any)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-teal-700 bg-teal-50/70 dark:bg-teal-950/40 ring-1 ring-teal-700'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <IconComp className={`w-4 h-4 ${isSelected ? 'text-teal-700 dark:text-teal-400' : 'text-stone-400'}`} />
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />}
                    </div>
                    <div className={`text-xs font-bold ${isSelected ? 'text-teal-900 dark:text-teal-200' : 'text-stone-800 dark:text-stone-200'}`}>
                      {mode.title}
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {mode.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Traditional Craft Emblem Motifs (when EMBLEM_AND_TEXT is selected) */}
          {(siteContent.logoType === 'EMBLEM_AND_TEXT') && (
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 space-y-3">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                {isBn ? 'ঐতিহ্যবাহী বাঙালি হস্তশিল্প মোটিফ নির্বাচন করুন' : 'Select Craft Heritage Emblem Motif'}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'leaf_sprout', name: isBn ? 'কিশলয় কচি পাতা' : 'Leaf Sprout' },
                  { key: 'jamdani_flower', name: isBn ? 'ঢাকাই জামদানি ফুল' : 'Jamdani Flower' },
                  { key: 'terracotta_seal', name: isBn ? 'টেরাকোটা সিলমোহর' : 'Terracotta Seal' },
                  { key: 'bengal_royal', name: isBn ? 'রয়্যাল বেঙ্গল ক্রেস্ট' : 'Bengal Royal' },
                  { key: 'heritage_loom', name: isBn ? 'তাঁতের মাকু ও পালক' : 'Heritage Loom' },
                  { key: 'minimalist_k', name: isBn ? 'মিনিমালিস্ট বাংলা "ক"' : 'Minimalist "ক"' },
                ].map((motif) => (
                  <button
                    key={motif.key}
                    type="button"
                    onClick={() => handleEmblemChange(motif.key)}
                    className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      (siteContent.logoEmblemStyle || 'leaf_sprout') === motif.key
                        ? 'border-teal-700 bg-teal-100/60 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-bold'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {motif.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Info & Confirmation Status */}
      <div className="p-4 bg-stone-50/70 dark:bg-stone-950/60 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
          <FileCheck className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
          <span>
            {isBn 
              ? 'লোগো পরিবর্তন সঙ্গে সঙ্গে ব্রাউজারের লোকাল স্টোরেজ ও সার্ভার ডেটাবেসে স্থায়ীভাবে সেভ হয়।' 
              : 'Changes are automatically persisted to local storage and the server database.'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-500">
          <span>Active Asset:</span>
          <span className="text-teal-800 dark:text-teal-300 font-bold truncate max-w-[200px]">
            {isDefaultActive ? 'Official Vector' : (siteContent.logoUrl?.startsWith('data:') ? 'Custom Data URI' : siteContent.logoUrl)}
          </span>
        </div>
      </div>
    </div>
  );
}
