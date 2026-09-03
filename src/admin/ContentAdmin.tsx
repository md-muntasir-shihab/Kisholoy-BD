import React, { useState } from 'react';
import { 
  FileText, Save, CheckCircle2, Globe, Bell, Shield, Phone, Sparkles, 
  Layers, Image as ImageIcon, Eye, RotateCcw, Upload, Sliders, ExternalLink, 
  Smartphone, Monitor, History, Check, AlertCircle, Plus, Trash2, ArrowUp, 
  ArrowDown, HelpCircle, Truck, Info, RefreshCw, Send, Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SiteContent, ContentRevision } from '../types';
import { BrandLogo } from '../components/brand/BrandLogo';

type CmsSection = 
  | 'brand' 
  | 'announcement' 
  | 'hero' 
  | 'promo_banners' 
  | 'sections' 
  | 'navigation' 
  | 'policies' 
  | 'contact' 
  | 'shipping' 
  | 'revisions';

const PRESET_ARTISAN_IMAGES = [
  {
    name: 'Dhakai Jamdani Weaver',
    category: 'Handloom & Textiles',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1600'
  },
  {
    name: 'Cumilla Terracotta Pottery',
    category: 'Clay & Terracotta',
    url: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&q=80&w=1600'
  },
  {
    name: 'Sundarbans Wild Honey Harvest',
    category: 'Organic Pantry',
    url: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8c0a1?auto=format&fit=crop&q=80&w=1600'
  },
  {
    name: 'Artisan Workshop Hands',
    category: 'Heritage Craft',
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1600'
  },
  {
    name: 'Natural Jute & Fiber Weave',
    category: 'Jute & Fiber',
    url: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=1600'
  },
  {
    name: 'Handcrafted Heritage Leather',
    category: 'Leather Craft',
    url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1600'
  },
  {
    name: 'Sylhet Organic Green Tea Garden',
    category: 'Tea & Pantry',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=1600'
  }
];

export function ContentAdmin() {
  const { 
    siteContent, 
    publishSiteContent, 
    contentRevisions, 
    restoreContentRevision, 
    showToast,
    language 
  } = useApp();

  const [activeSection, setActiveSection] = useState<CmsSection>('brand');
  const [draft, setDraft] = useState<SiteContent>(() => JSON.parse(JSON.stringify(siteContent)));
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishSummary, setPublishSummary] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewLanguage, setPreviewLanguage] = useState<'EN' | 'BN'>('EN');
  const [imagePickerTarget, setImagePickerTarget] = useState<string | null>(null);
  const [activePolicyTab, setActivePolicyTab] = useState<'terms' | 'privacy' | 'returns' | 'shipping' | 'about' | 'faq'>('returns');

  // Sync draft when siteContent is restored or loaded
  const handleResetToPublished = () => {
    if (confirm('Discard all unsaved draft changes and reload currently published content?')) {
      setDraft(JSON.parse(JSON.stringify(siteContent)));
      showToast('Draft reset to published content');
    }
  };

  const handleOpenPublishModal = (e: React.FormEvent) => {
    e.preventDefault();
    setPublishSummary(`Updated ${activeSection.replace('_', ' ')} and storefront copy`);
    setPublishModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    setIsPublishing(true);
    const success = await publishSiteContent(draft, publishSummary.trim() || 'Published storefront updates');
    setIsPublishing(false);
    if (success) {
      setPublishModalOpen(false);
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (confirm(`Are you sure you want to roll back the entire website content to revision ${revId}?`)) {
      const ok = await restoreContentRevision(revId);
      if (ok) {
        setDraft(JSON.parse(JSON.stringify(siteContent)));
      }
    }
  };

  const handleSelectPresetImage = (url: string) => {
    if (!imagePickerTarget) return;

    if (imagePickerTarget === 'hero.image') {
      setDraft(prev => ({ ...prev, hero: { ...prev.hero, image: url } }));
    } else if (imagePickerTarget === 'artisanImage') {
      setDraft(prev => ({
        ...prev,
        sectionSettings: {
          ...(prev.sectionSettings || {
            showAnnouncement: true,
            showHero: true,
            showCuratedCategories: true,
            showFeaturedProducts: true,
            showArtisanSpotlight: true,
            showPillars: true,
            categoriesTitle: 'Explore by Category',
            categoriesTitleBn: 'জনপ্রিয় ক্যাটাগরি',
            featuredTitle: 'Featured Masterpieces',
            featuredTitleBn: 'বিশেষ নির্বাচিত পণ্য',
            artisanTitle: 'Revitalizing Bangladesh’s Living Craft Traditions',
            artisanTitleBn: 'শতবর্ষের তাঁত ও মৃত্তিকা শিল্পের নতুন উন্মেষ',
            artisanStory: '',
            artisanStoryBn: '',
            artisanImage: url
          }),
          artisanImage: url
        }
      }));
    } else if (imagePickerTarget.startsWith('promo-')) {
      const promoId = imagePickerTarget.replace('promo-', '');
      setDraft(prev => ({
        ...prev,
        promoBanners: (prev.promoBanners || []).map(b => b.id === promoId ? { ...b, image: url } : b)
      }));
    }

    setImagePickerTarget(null);
    showToast('Image asset selected');
  };

  const sectionsList: { id: CmsSection; label: string; icon: any; badge?: string }[] = [
    { id: 'brand', label: 'Brand Identity & Meta', icon: Globe },
    { id: 'announcement', label: 'Announcement Bar', icon: Bell },
    { id: 'hero', label: 'Hero Banner & Carousel', icon: Sparkles },
    { id: 'promo_banners', label: 'Campaign & Promo Cards', icon: Tag, badge: `${draft.promoBanners?.length || 0}` },
    { id: 'sections', label: 'Homepage Layout & Story', icon: Layers },
    { id: 'navigation', label: 'Navigation Links', icon: Sliders },
    { id: 'policies', label: 'Legal & Policy Pages', icon: Shield },
    { id: 'contact', label: 'Support & Social Channels', icon: Phone },
    { id: 'shipping', label: 'Delivery Fees & Turnaround', icon: Truck },
    { id: 'revisions', label: 'Publish History & Rollback', icon: History, badge: `${contentRevisions.length}` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header & Publishing Action Bar */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-teal-400 font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-950/80 border border-teal-800">
              CONTENT PUBLISHING FLOW
            </span>
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Live Synced
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Storefront CMS & Publishing Studio
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Craft, preview, and publish dynamic bilingual content, marketing campaigns, and brand policies.
          </p>
        </div>

        {/* Global CMS Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleResetToPublished}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Discard draft changes"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            <span>Reset Draft</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewModalOpen(true)}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-teal-300 rounded-lg text-xs font-bold border border-teal-800/60 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Eye className="w-4 h-4 text-teal-400" />
            <span>Live Store Preview</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPublishModal}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Publish to Live Store</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar: CMS Sections Selector */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-stone-200 shadow-xs p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-600 border-b border-stone-100 mb-1 flex items-center justify-between">
            <span>Publishing Sections</span>
            <span className="text-[10px] text-teal-800 font-mono">10 Modules</span>
          </div>

          {sectionsList.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-900 text-white font-semibold shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-300' : 'text-stone-600'}`} />
                  <span className="truncate">{sec.label}</span>
                </div>
                {sec.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                      isActive ? 'bg-teal-700 text-teal-100' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Area: Active Section Editor Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleOpenPublishModal} className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-6">
            {/* 1. Brand Identity & Meta */}
            {activeSection === 'brand' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3">
                  <h3 className="text-base font-bold text-stone-900">Brand Identity & Legal Registrations</h3>
                  <p className="text-xs text-stone-500">Configure public store name, motto, trademark identifiers, and visual logos.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Brand Name (English)</label>
                    <input
                      type="text"
                      value={draft.brandName}
                      onChange={(e) => setDraft({ ...draft, brandName: e.target.value })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Brand Name (Bangla)</label>
                    <input
                      type="text"
                      value={draft.brandNameBn}
                      onChange={(e) => setDraft({ ...draft, brandNameBn: e.target.value })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-bangla focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Tagline (English)</label>
                    <input
                      type="text"
                      value={draft.tagline}
                      onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Tagline (Bangla)</label>
                    <input
                      type="text"
                      value={draft.taglineBn}
                      onChange={(e) => setDraft({ ...draft, taglineBn: e.target.value })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-bangla focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Motto / Slogan (English)</label>
                    <input
                      type="text"
                      value={draft.motto}
                      onChange={(e) => setDraft({ ...draft, motto: e.target.value })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Motto / Slogan (Bangla)</label>
                    <input
                      type="text"
                      value={draft.mottoBn}
                      onChange={(e) => setDraft({ ...draft, mottoBn: e.target.value })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-bangla"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Trade License / BIN Number</label>
                    <input
                      type="text"
                      value={draft.tradeLicense || ''}
                      placeholder="e.g. TRAD/DNCC/094281/2026"
                      onChange={(e) => setDraft({ ...draft, tradeLicense: e.target.value })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Favicon URL</label>
                    <input
                      type="url"
                      value={draft.faviconUrl || ''}
                      placeholder="https://..."
                      onChange={(e) => setDraft({ ...draft, faviconUrl: e.target.value })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Comprehensive Visual Logo Configuration */}
                <div className="p-5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-teal-800" />
                        Storefront Brand Logo & Emblem Studio
                      </h4>
                      <p className="text-[11px] text-stone-500">Upload your brand logo image, select vector emblem motifs, or choose elegant artisan typography.</p>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-teal-100 text-teal-900">
                      Live Storefront Identity
                    </span>
                  </div>

                  {/* Logo Display Mode Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'BOTH_IMAGE_AND_TEXT', label: 'Image + Brand Name', desc: 'Logo image on left with stylized title & motto' },
                      { id: 'IMAGE', label: 'Pure Image Logo', desc: 'Standalone logo graphic without extra text' },
                      { id: 'EMBLEM_AND_TEXT', label: 'Emblem Motif + Name', desc: 'Curated Bangladeshi craft vector icon & title' },
                      { id: 'TEXT', label: 'Pure Typography', desc: 'High-contrast luxury bilingual font styling' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setDraft({ ...draft, logoType: mode.id as any })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          (draft.logoType || 'BOTH_IMAGE_AND_TEXT') === mode.id
                            ? 'border-teal-800 bg-teal-50/80 text-teal-950 font-semibold ring-1 ring-teal-800'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        <div className="font-bold text-xs">{mode.label}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">{mode.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Image Logo Upload & URL Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="space-y-2">
                      <label className="font-bold text-stone-700 block">
                        Primary Logo Image (Light Navbar Background)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={draft.logoUrl || ''}
                          placeholder="Paste image URL (https://...)"
                          onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
                          className="flex-1 p-2.5 border border-stone-300 rounded-lg text-xs"
                        />
                        <label className="px-3 py-2 bg-stone-900 text-white rounded-lg cursor-pointer hover:bg-stone-800 inline-flex items-center gap-1.5 text-xs font-semibold flex-shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setDraft({ ...draft, logoUrl: reader.result as string });
                                  showToast('Logo image uploaded to draft!');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {draft.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, logoUrl: '' })}
                          className="text-[11px] text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear Primary Logo
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="font-bold text-stone-700 block">
                        Dark / Footer Logo Image (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={draft.logoDarkUrl || ''}
                          placeholder="Dark background variant URL (Optional)"
                          onChange={(e) => setDraft({ ...draft, logoDarkUrl: e.target.value })}
                          className="flex-1 p-2.5 border border-stone-300 rounded-lg text-xs"
                        />
                        <label className="px-3 py-2 bg-stone-800 text-stone-200 rounded-lg cursor-pointer hover:bg-stone-700 inline-flex items-center gap-1.5 text-xs font-semibold flex-shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setDraft({ ...draft, logoDarkUrl: reader.result as string });
                                  showToast('Dark variant logo uploaded to draft!');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {draft.logoDarkUrl && (
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, logoDarkUrl: '' })}
                          className="text-[11px] text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear Dark Logo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Logo Sizing & Emblem Styles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-stone-700">Logo Height (Pixels)</label>
                        <span className="font-mono text-stone-500 font-semibold">{draft.logoHeight || 40}px</span>
                      </div>
                      <input
                        type="range"
                        min="28"
                        max="68"
                        step="2"
                        value={draft.logoHeight || 40}
                        onChange={(e) => setDraft({ ...draft, logoHeight: parseInt(e.target.value, 10) })}
                        className="w-full accent-teal-800"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Emblem Vector Motif</label>
                      <select
                        value={draft.logoEmblemStyle || 'leaf_sprout'}
                        onChange={(e) => setDraft({ ...draft, logoEmblemStyle: e.target.value as any })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg bg-white"
                      >
                        <option value="leaf_sprout">🌿 Golden Leaf & Sprout (Kisholoy Crest)</option>
                        <option value="jamdani_flower">🌸 Dhakai Jamdani Floral Medallion</option>
                        <option value="terracotta_seal">🏺 Cumilla Terracotta Heritage Seal</option>
                        <option value="heritage_loom">🧵 Traditional Handloom Shuttle</option>
                        <option value="bengal_royal">🛡️ Royal Bengal Heritage Shield</option>
                        <option value="minimalist_k">🔤 Minimalist Bengali 'ক' Monogram</option>
                      </select>
                    </div>
                  </div>

                  {/* Preset Artisan Logo Gallery */}
                  <div className="pt-2 border-t border-stone-200">
                    <label className="font-bold text-stone-700 block mb-2 text-xs">
                      Instant Artisan Logo Presets (Click to apply):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        {
                          name: 'Heritage Jamdani Icon',
                          url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200',
                          emblem: 'jamdani_flower'
                        },
                        {
                          name: 'Terracotta Pottery Mark',
                          url: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&q=80&w=200',
                          emblem: 'terracotta_seal'
                        },
                        {
                          name: 'Artisan Workshop Emblem',
                          url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=200',
                          emblem: 'heritage_loom'
                        },
                        {
                          name: 'Organic Green Leaf',
                          url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=200',
                          emblem: 'leaf_sprout'
                        }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDraft({
                              ...draft,
                              logoUrl: preset.url,
                              logoEmblemStyle: preset.emblem as any,
                              logoType: 'BOTH_IMAGE_AND_TEXT'
                            });
                            showToast(`Applied ${preset.name} preset!`);
                          }}
                          className="flex items-center gap-2 p-2 border border-stone-200 rounded-lg hover:border-teal-800 hover:bg-teal-50/50 text-left transition-colors bg-white text-xs"
                        >
                          <img src={preset.url} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                          <span className="text-[11px] font-medium text-stone-800 leading-tight">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real-time Dual Theme Preview */}
                  <div className="mt-4 pt-3 border-t border-stone-200">
                    <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-2">
                      Live Storefront Brand Logo Preview:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Navbar Light Preview */}
                      <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] text-stone-400 font-semibold mb-2 uppercase tracking-wider">
                          Header / Navbar Preview (Light Mode)
                        </span>
                        <div className="py-2">
                          <BrandLogo variant="light" linkToHome={false} size="md" />
                        </div>
                      </div>

                      {/* Footer Dark Preview */}
                      <div className="p-4 rounded-xl border border-stone-800 bg-stone-900 shadow-2xs flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] text-stone-400 font-semibold mb-2 uppercase tracking-wider">
                          Footer Preview (Dark Mode)
                        </span>
                        <div className="py-2">
                          <BrandLogo variant="dark" linkToHome={false} size="md" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Announcement Bar */}
            {activeSection === 'announcement' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Storefront Announcement Bar</h3>
                    <p className="text-xs text-stone-500">Highlighted promotional or delivery message pinned to the very top of all pages.</p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.announcementBar.enabled}
                      onChange={(e) => setDraft({
                        ...draft,
                        announcementBar: { ...draft.announcementBar, enabled: e.target.checked }
                      })}
                      className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-stone-800">
                      {draft.announcementBar.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Announcement Copy (English)</label>
                    <input
                      type="text"
                      value={draft.announcementBar.text}
                      onChange={(e) => setDraft({
                        ...draft,
                        announcementBar: { ...draft.announcementBar, text: e.target.value }
                      })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Announcement Copy (Bangla)</label>
                    <input
                      type="text"
                      value={draft.announcementBar.textBn}
                      onChange={(e) => setDraft({
                        ...draft,
                        announcementBar: { ...draft.announcementBar, textBn: e.target.value }
                      })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-bangla"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Banner Theme</label>
                      <select
                        value={draft.announcementBar.theme || 'midnight'}
                        onChange={(e) => setDraft({
                          ...draft,
                          announcementBar: { ...draft.announcementBar, theme: e.target.value as any }
                        })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg bg-white"
                      >
                        <option value="midnight">Midnight (Dark Stone)</option>
                        <option value="teal">Deep Heritage Teal</option>
                        <option value="amber">Warm Artisan Amber</option>
                        <option value="crimson">Festive Crimson</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Action Link URL (Optional)</label>
                      <input
                        type="text"
                        value={draft.announcementBar.linkUrl || ''}
                        placeholder="/shop"
                        onChange={(e) => setDraft({
                          ...draft,
                          announcementBar: { ...draft.announcementBar, linkUrl: e.target.value }
                        })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Action Button Text</label>
                      <input
                        type="text"
                        value={draft.announcementBar.linkLabel || ''}
                        placeholder="Shop Now"
                        onChange={(e) => setDraft({
                          ...draft,
                          announcementBar: { ...draft.announcementBar, linkLabel: e.target.value }
                        })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Live Banner Preview Box */}
                  <div className="mt-4 p-3 rounded-lg border border-stone-300 bg-stone-50">
                    <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">Live Appearance Preview:</span>
                    <div className={`p-2.5 rounded text-xs text-center font-medium ${
                      draft.announcementBar.theme === 'teal'
                        ? 'bg-teal-900 text-teal-100'
                        : draft.announcementBar.theme === 'amber'
                        ? 'bg-amber-900 text-amber-100'
                        : draft.announcementBar.theme === 'crimson'
                        ? 'bg-rose-900 text-rose-100'
                        : 'bg-stone-900 text-stone-100'
                    }`}>
                      {draft.announcementBar.text}
                      {draft.announcementBar.linkLabel && (
                        <span className="ml-2 underline font-bold cursor-pointer">
                          {draft.announcementBar.linkLabel} &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Hero Banner & Carousel */}
            {activeSection === 'hero' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Hero Section Showcase</h3>
                    <p className="text-xs text-stone-500">The primary above-the-fold banner presented to every storefront visitor.</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Eyebrow Badge (English)</label>
                      <input
                        type="text"
                        value={draft.hero.eyebrow}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, eyebrow: e.target.value } })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Eyebrow Badge (Bangla)</label>
                      <input
                        type="text"
                        value={draft.hero.eyebrowBn}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, eyebrowBn: e.target.value } })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg font-bangla"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Hero Main Headline (English)</label>
                      <input
                        type="text"
                        value={draft.hero.title}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, title: e.target.value } })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg font-serif text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Hero Main Headline (Bangla)</label>
                      <input
                        type="text"
                        value={draft.hero.titleBn}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, titleBn: e.target.value } })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg font-serif font-bangla text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Subtitle Description (English)</label>
                      <textarea
                        rows={3}
                        value={draft.hero.subtitle}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, subtitle: e.target.value } })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Subtitle Description (Bangla)</label>
                      <textarea
                        rows={3}
                        value={draft.hero.subtitleBn}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, subtitleBn: e.target.value } })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg font-bangla leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="space-y-3">
                      <span className="font-bold text-stone-800 text-xs block">Primary Action Button</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Text (EN)"
                          value={draft.hero.ctaPrimaryText}
                          onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, ctaPrimaryText: e.target.value } })}
                          className="p-2 border border-stone-300 rounded-lg bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Text (BN)"
                          value={draft.hero.ctaPrimaryTextBn}
                          onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, ctaPrimaryTextBn: e.target.value } })}
                          className="p-2 border border-stone-300 rounded-lg bg-white font-bangla"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="URL (e.g. /shop)"
                        value={draft.hero.ctaPrimaryUrl || '/shop'}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, ctaPrimaryUrl: e.target.value } })}
                        className="w-full p-2 border border-stone-300 rounded-lg bg-white text-xs"
                      />
                    </div>

                    <div className="space-y-3">
                      <span className="font-bold text-stone-800 text-xs block">Secondary Action Button</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Text (EN)"
                          value={draft.hero.ctaSecondaryText}
                          onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, ctaSecondaryText: e.target.value } })}
                          className="p-2 border border-stone-300 rounded-lg bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Text (BN)"
                          value={draft.hero.ctaSecondaryTextBn}
                          onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, ctaSecondaryTextBn: e.target.value } })}
                          className="p-2 border border-stone-300 rounded-lg bg-white font-bangla"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="URL (e.g. /pages/about)"
                        value={draft.hero.ctaSecondaryUrl || '/pages/about'}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, ctaSecondaryUrl: e.target.value } })}
                        className="w-full p-2 border border-stone-300 rounded-lg bg-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Hero Background Image */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-stone-700 block">Hero Background Image Asset</label>
                      <button
                        type="button"
                        onClick={() => setImagePickerTarget('hero.image')}
                        className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Pick from Artisanal Asset Library</span>
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={draft.hero.image}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, image: e.target.value } })}
                        className="w-full p-2.5 border border-stone-300 rounded-lg font-mono text-xs"
                      />
                    </div>

                    {/* Image Preview & Dark Overlay Slider */}
                    <div className="relative h-44 rounded-xl overflow-hidden border border-stone-300 mt-2 bg-stone-900">
                      <img
                        src={draft.hero.image}
                        alt="Hero Preview"
                        className="w-full h-full object-cover"
                      />
                      <div 
                        className="absolute inset-0 bg-stone-950" 
                        style={{ opacity: (draft.hero.overlayOpacity || 45) / 100 }}
                      ></div>
                      <div className="absolute bottom-3 left-3 text-white z-10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">{draft.hero.eyebrow}</span>
                        <h4 className="text-base font-serif font-bold text-white leading-tight">{draft.hero.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2">
                      <span className="text-stone-600 font-medium">Background Dark Overlay: {draft.hero.overlayOpacity || 45}%</span>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={draft.hero.overlayOpacity || 45}
                        onChange={(e) => setDraft({
                          ...draft,
                          hero: { ...draft.hero, overlayOpacity: Number(e.target.value) }
                        })}
                        className="w-48 accent-teal-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Campaign & Promo Cards */}
            {activeSection === 'promo_banners' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Marketing & Promotional Banners</h3>
                    <p className="text-xs text-stone-500">Configure mid-page callout cards, seasonal clearance banners, and artisan spotlights.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newPromo = {
                        id: `promo-${Date.now()}`,
                        title: 'New Artisanal Spotlight',
                        titleBn: 'নতুন বিশেষ কালেকশন',
                        subtitle: 'Limited edition handcrafted products.',
                        subtitleBn: 'সীমিত সংস্করণের ঐতিহ্যবাহী পণ্য।',
                        badge: 'Seasonal',
                        badgeBn: 'নতুন উৎসব',
                        ctaText: 'Shop Now',
                        ctaTextBn: 'কিনুন',
                        link: '/shop',
                        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
                        position: 'MID_PAGE' as const,
                        enabled: true
                      };
                      setDraft(prev => ({
                        ...prev,
                        promoBanners: [...(prev.promoBanners || []), newPromo]
                      }));
                      showToast('Added new promo banner block');
                    }}
                    className="px-3 py-1.5 bg-teal-900 text-white rounded-lg text-xs font-bold hover:bg-teal-950 flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Promo Card</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(draft.promoBanners || []).map((banner, idx) => (
                    <div key={banner.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-800">Banner #{idx + 1}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-900">
                            {banner.position}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={banner.enabled}
                              onChange={(e) => {
                                const updated = [...(draft.promoBanners || [])];
                                updated[idx].enabled = e.target.checked;
                                setDraft({ ...draft, promoBanners: updated });
                              }}
                              className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                            />
                            <span className="text-[11px] font-bold text-stone-700">
                              {banner.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = (draft.promoBanners || []).filter(b => b.id !== banner.id);
                              setDraft({ ...draft, promoBanners: updated });
                              showToast('Removed banner');
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-stone-700 block mb-1">Banner Title (English)</label>
                          <input
                            type="text"
                            value={banner.title}
                            onChange={(e) => {
                              const updated = [...(draft.promoBanners || [])];
                              updated[idx].title = e.target.value;
                              setDraft({ ...draft, promoBanners: updated });
                            }}
                            className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-stone-700 block mb-1">Banner Title (Bangla)</label>
                          <input
                            type="text"
                            value={banner.titleBn}
                            onChange={(e) => {
                              const updated = [...(draft.promoBanners || [])];
                              updated[idx].titleBn = e.target.value;
                              setDraft({ ...draft, promoBanners: updated });
                            }}
                            className="w-full p-2 border border-stone-300 rounded-lg bg-white font-bangla"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-stone-700 block mb-1">Subtitle (English)</label>
                          <input
                            type="text"
                            value={banner.subtitle}
                            onChange={(e) => {
                              const updated = [...(draft.promoBanners || [])];
                              updated[idx].subtitle = e.target.value;
                              setDraft({ ...draft, promoBanners: updated });
                            }}
                            className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-stone-700 block mb-1">Subtitle (Bangla)</label>
                          <input
                            type="text"
                            value={banner.subtitleBn}
                            onChange={(e) => {
                              const updated = [...(draft.promoBanners || [])];
                              updated[idx].subtitleBn = e.target.value;
                              setDraft({ ...draft, promoBanners: updated });
                            }}
                            className="w-full p-2 border border-stone-300 rounded-lg bg-white font-bangla"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-stone-700 block mb-1">Badge Tag</label>
                          <input
                            type="text"
                            value={banner.badge}
                            onChange={(e) => {
                              const updated = [...(draft.promoBanners || [])];
                              updated[idx].badge = e.target.value;
                              setDraft({ ...draft, promoBanners: updated });
                            }}
                            className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-stone-700 block mb-1">Target Link URL</label>
                          <input
                            type="text"
                            value={banner.link}
                            onChange={(e) => {
                              const updated = [...(draft.promoBanners || [])];
                              updated[idx].link = e.target.value;
                              setDraft({ ...draft, promoBanners: updated });
                            }}
                            className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-stone-700 block">Banner Image URL</label>
                            <button
                              type="button"
                              onClick={() => setImagePickerTarget(`promo-${banner.id}`)}
                              className="text-xs text-teal-800 font-bold hover:underline flex items-center gap-1"
                            >
                              <ImageIcon className="w-3 h-3" /> Select from Library
                            </button>
                          </div>
                          <input
                            type="url"
                            value={banner.image}
                            onChange={(e) => {
                              const updated = [...(draft.promoBanners || [])];
                              updated[idx].image = e.target.value;
                              setDraft({ ...draft, promoBanners: updated });
                            }}
                            className="w-full p-2 border border-stone-300 rounded-lg bg-white font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Homepage Sections & Customizer */}
            {activeSection === 'sections' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3">
                  <h3 className="text-base font-bold text-stone-900">Homepage Layout & Section Customizer</h3>
                  <p className="text-xs text-stone-500">Configure visibility, headings, and storytelling blocks on the storefront homepage.</p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Category Section Config */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-800 text-sm">Curated Categories Section</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.sectionSettings?.showCuratedCategories ?? true}
                          onChange={(e) => setDraft(prev => ({
                            ...prev,
                            sectionSettings: {
                              ...(prev.sectionSettings || ({} as any)),
                              showCuratedCategories: e.target.checked
                            }
                          }))}
                          className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                        />
                        <span className="font-bold text-xs text-stone-700">Display Section</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-stone-600 block mb-1">Heading (English)</label>
                        <input
                          type="text"
                          value={draft.sectionSettings?.categoriesTitle || 'Explore by Category'}
                          onChange={(e) => setDraft(prev => ({
                            ...prev,
                            sectionSettings: {
                              ...(prev.sectionSettings || ({} as any)),
                              categoriesTitle: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-stone-600 block mb-1">Heading (Bangla)</label>
                        <input
                          type="text"
                          value={draft.sectionSettings?.categoriesTitleBn || 'জনপ্রিয় ক্যাটাগরি'}
                          onChange={(e) => setDraft(prev => ({
                            ...prev,
                            sectionSettings: {
                              ...(prev.sectionSettings || ({} as any)),
                              categoriesTitleBn: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white font-bangla"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Featured Products Section Config */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-800 text-sm">Featured Masterpieces Section</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.sectionSettings?.showFeaturedProducts ?? true}
                          onChange={(e) => setDraft(prev => ({
                            ...prev,
                            sectionSettings: {
                              ...(prev.sectionSettings || ({} as any)),
                              showFeaturedProducts: e.target.checked
                            }
                          }))}
                          className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                        />
                        <span className="font-bold text-xs text-stone-700">Display Section</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-stone-600 block mb-1">Heading (English)</label>
                        <input
                          type="text"
                          value={draft.sectionSettings?.featuredTitle || 'Featured Masterpieces'}
                          onChange={(e) => setDraft(prev => ({
                            ...prev,
                            sectionSettings: {
                              ...(prev.sectionSettings || ({} as any)),
                              featuredTitle: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-stone-600 block mb-1">Heading (Bangla)</label>
                        <input
                          type="text"
                          value={draft.sectionSettings?.featuredTitleBn || 'বিশেষ নির্বাচিত পণ্য'}
                          onChange={(e) => setDraft(prev => ({
                            ...prev,
                            sectionSettings: {
                              ...(prev.sectionSettings || ({} as any)),
                              featuredTitleBn: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white font-bangla"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Artisan Spotlight Story Block */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-800 text-sm">Artisan Heritage Story Spotlight</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.sectionSettings?.showArtisanSpotlight ?? true}
                          onChange={(e) => setDraft(prev => ({
                            ...prev,
                            sectionSettings: {
                              ...(prev.sectionSettings || ({} as any)),
                              showArtisanSpotlight: e.target.checked
                            }
                          }))}
                          className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                        />
                        <span className="font-bold text-xs text-stone-700">Display Section</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-stone-600 block mb-1">Title (English)</label>
                        <input
                          type="text"
                          value={draft.sectionSettings?.artisanTitle || ''}
                          onChange={(e) => setDraft(prev => ({
                            ...prev,
                            sectionSettings: {
                              ...(prev.sectionSettings || ({} as any)),
                              artisanTitle: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-stone-600 block mb-1">Title (Bangla)</label>
                        <input
                          type="text"
                          value={draft.sectionSettings?.artisanTitleBn || ''}
                          onChange={(e) => setDraft(prev => ({
                            ...prev,
                            sectionSettings: {
                              ...(prev.sectionSettings || ({} as any)),
                              artisanTitleBn: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white font-bangla"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-stone-600 block mb-1">Story Narrative (English)</label>
                        <textarea
                          rows={3}
                          value={draft.sectionSettings?.artisanStory || ''}
                          onChange={(e) => setDraft(prev => ({
                            ...prev,
                            sectionSettings: {
                              ...(prev.sectionSettings || ({} as any)),
                              artisanStory: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white leading-relaxed"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-stone-600 block">Artisan Photo Asset</label>
                          <button
                            type="button"
                            onClick={() => setImagePickerTarget('artisanImage')}
                            className="text-xs text-teal-800 font-bold hover:underline flex items-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3" /> Select from Library
                          </button>
                        </div>
                        <input
                          type="url"
                          value={draft.sectionSettings?.artisanImage || ''}
                          onChange={(e) => setDraft(prev => ({
                            ...prev,
                            sectionSettings: {
                              ...(prev.sectionSettings || ({} as any)),
                              artisanImage: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Navigation Links Manager */}
            {activeSection === 'navigation' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Header & Navigation Links Manager</h3>
                    <p className="text-xs text-stone-500">Configure top navigation menu order, active visibility, and bilingual labels.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newNav = {
                        id: `nav-${Date.now()}`,
                        name: 'New Page',
                        nameBn: 'নতুন লিংক',
                        path: '/shop',
                        order: (draft.navLinks?.length || 0) + 1,
                        enabled: true
                      };
                      setDraft(prev => ({
                        ...prev,
                        navLinks: [...(prev.navLinks || []), newNav]
                      }));
                      showToast('Added navigation link');
                    }}
                    className="px-3 py-1.5 bg-teal-900 text-white rounded-lg text-xs font-bold hover:bg-teal-950 flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Nav Link</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(draft.navLinks || []).map((link, idx) => (
                    <div key={link.id} className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex flex-col sm:flex-row items-center gap-3 text-xs">
                      <div className="flex items-center gap-2 font-mono font-bold text-stone-600">
                        #{idx + 1}
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                        <input
                          type="text"
                          placeholder="Label (EN)"
                          value={link.name}
                          onChange={(e) => {
                            const updated = [...(draft.navLinks || [])];
                            updated[idx].name = e.target.value;
                            setDraft({ ...draft, navLinks: updated });
                          }}
                          className="p-2 border border-stone-300 rounded-lg bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Label (BN)"
                          value={link.nameBn}
                          onChange={(e) => {
                            const updated = [...(draft.navLinks || [])];
                            updated[idx].nameBn = e.target.value;
                            setDraft({ ...draft, navLinks: updated });
                          }}
                          className="p-2 border border-stone-300 rounded-lg bg-white font-bangla"
                        />
                        <input
                          type="text"
                          placeholder="Path (/shop)"
                          value={link.path}
                          onChange={(e) => {
                            const updated = [...(draft.navLinks || [])];
                            updated[idx].path = e.target.value;
                            setDraft({ ...draft, navLinks: updated });
                          }}
                          className="p-2 border border-stone-300 rounded-lg bg-white font-mono text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={link.enabled}
                            onChange={(e) => {
                              const updated = [...(draft.navLinks || [])];
                              updated[idx].enabled = e.target.checked;
                              setDraft({ ...draft, navLinks: updated });
                            }}
                            className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                          />
                          <span className="text-[11px] font-bold text-stone-700">Active</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = (draft.navLinks || []).filter(l => l.id !== link.id);
                            setDraft({ ...draft, navLinks: updated });
                            showToast('Deleted link');
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Legal & Policies Studio */}
            {activeSection === 'policies' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3">
                  <h3 className="text-base font-bold text-stone-900">Legal, Governance & Storefront Policies</h3>
                  <p className="text-xs text-stone-500">Edit comprehensive Markdown policy pages with real-time character counters.</p>
                </div>

                {/* Sub-tabs for policies */}
                <div className="flex items-center gap-1.5 border-b border-stone-200 pb-1 text-xs overflow-x-auto">
                  {[
                    { id: 'returns', label: '7-Day Returns Policy' },
                    { id: 'shipping', label: 'Shipping & Delivery Terms' },
                    { id: 'terms', label: 'Terms of Service' },
                    { id: 'privacy', label: 'Privacy Policy' },
                    { id: 'about', label: 'About Kisholoy' },
                    { id: 'faq', label: 'FAQ & Help Center' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePolicyTab(p.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                        activePolicyTab === p.id
                          ? 'bg-teal-900 text-white shadow-xs'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-stone-500 text-[11px]">
                    <span className="font-semibold text-stone-700">
                      Editing: {activePolicyTab.toUpperCase()} POLICY
                    </span>
                    <span>
                      Character Count:{' '}
                      <strong>{(draft.policies[activePolicyTab] || '').length}</strong> chars
                    </span>
                  </div>

                  <textarea
                    rows={12}
                    value={draft.policies[activePolicyTab] || ''}
                    onChange={(e) => setDraft({
                      ...draft,
                      policies: {
                        ...draft.policies,
                        [activePolicyTab]: e.target.value
                      }
                    })}
                    className="w-full p-3.5 border border-stone-300 rounded-xl font-mono text-xs leading-relaxed focus:ring-1 focus:ring-teal-700 focus:outline-none bg-stone-50/50"
                  />

                  <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-950 text-[11px] flex items-start gap-2">
                    <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <span>
                      All policy changes are immediately reflected on public customer links at <code className="bg-teal-100 px-1 py-0.5 rounded">/pages/{activePolicyTab}</code> upon publishing.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Support & Social Channels */}
            {activeSection === 'contact' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3">
                  <h3 className="text-base font-bold text-stone-900">Official Contact Channels & Socials</h3>
                  <p className="text-xs text-stone-500">Customer support hotline, WhatsApp direct chat, and physical headquarters location.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Customer Support Hotline</label>
                    <input
                      type="text"
                      value={draft.contact.phone}
                      onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, phone: e.target.value } })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">WhatsApp Direct Hotline</label>
                    <input
                      type="text"
                      value={draft.contact.whatsappNumber || '+8801700000000'}
                      placeholder="+8801700000000"
                      onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, whatsappNumber: e.target.value } })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Support Email Address</label>
                    <input
                      type="email"
                      value={draft.contact.email}
                      onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, email: e.target.value } })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Operating Hours (English)</label>
                    <input
                      type="text"
                      value={draft.contact.hours || 'Saturday – Thursday: 9:00 AM – 9:00 PM'}
                      onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, hours: e.target.value } })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-stone-700 block mb-1">Headquarters Physical Address (English)</label>
                    <input
                      type="text"
                      value={draft.contact.address}
                      onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, address: e.target.value } })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-stone-700 block mb-1">Headquarters Physical Address (Bangla)</label>
                    <input
                      type="text"
                      value={draft.contact.addressBn}
                      onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, addressBn: e.target.value } })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-bangla"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Facebook Page URL</label>
                    <input
                      type="url"
                      value={draft.contact.facebookUrl}
                      onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, facebookUrl: e.target.value } })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Instagram Profile URL</label>
                    <input
                      type="url"
                      value={draft.contact.instagramUrl}
                      onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, instagramUrl: e.target.value } })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 9. Delivery Fees & Shipping */}
            {activeSection === 'shipping' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3">
                  <h3 className="text-base font-bold text-stone-900">Logistics Rates & Free Delivery Thresholds</h3>
                  <p className="text-xs text-stone-500">Enforced during cart checkout and synchronized with server calculations.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <label className="font-bold text-stone-800 block">Inside Dhaka Delivery Fee (৳ BDT)</label>
                    <input
                      type="number"
                      value={draft.shippingFees.insideDhaka}
                      onChange={(e) => setDraft({
                        ...draft,
                        shippingFees: { ...draft.shippingFees, insideDhaka: Number(e.target.value) }
                      })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-mono font-bold text-stone-900 text-sm bg-white"
                    />
                    <span className="text-[11px] text-stone-500 block">Standard 24-48h Dhaka City SLA</span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <label className="font-bold text-stone-800 block">Dhaka Suburbs Delivery Fee (৳ BDT)</label>
                    <input
                      type="number"
                      value={draft.shippingFees.subDhaka}
                      onChange={(e) => setDraft({
                        ...draft,
                        shippingFees: { ...draft.shippingFees, subDhaka: Number(e.target.value) }
                      })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-mono font-bold text-stone-900 text-sm bg-white"
                    />
                    <span className="text-[11px] text-stone-500 block">Savar, Gazipur, Keraniganj, Narayanganj</span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <label className="font-bold text-stone-800 block">Outside Dhaka (64 Districts) (৳ BDT)</label>
                    <input
                      type="number"
                      value={draft.shippingFees.outsideDhaka}
                      onChange={(e) => setDraft({
                        ...draft,
                        shippingFees: { ...draft.shippingFees, outsideDhaka: Number(e.target.value) }
                      })}
                      className="w-full p-2.5 border border-stone-300 rounded-lg font-mono font-bold text-stone-900 text-sm bg-white"
                    />
                    <span className="text-[11px] text-stone-500 block">Nationwide door-to-door courier dispatch</span>
                  </div>

                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 space-y-2">
                    <label className="font-bold text-teal-950 block">Free Shipping Minimum Threshold (৳ BDT)</label>
                    <input
                      type="number"
                      value={draft.shippingFees.freeShippingThreshold}
                      onChange={(e) => setDraft({
                        ...draft,
                        shippingFees: { ...draft.shippingFees, freeShippingThreshold: Number(e.target.value) }
                      })}
                      className="w-full p-2.5 border border-teal-300 rounded-lg font-mono font-bold text-teal-900 text-sm bg-white"
                    />
                    <span className="text-[11px] text-teal-800 block">Orders at or above this value get ৳0 delivery charge</span>
                  </div>
                </div>
              </div>
            )}

            {/* 10. Revisions & Rollback History */}
            {activeSection === 'revisions' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Content Revisions & Instant Rollback</h3>
                    <p className="text-xs text-stone-500">Every publish event creates an immutable revision snapshot with 1-click restore capability.</p>
                  </div>

                  <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                    {contentRevisions.length} Revisions Recorded
                  </span>
                </div>

                <div className="space-y-3">
                  {contentRevisions.map((rev, idx) => (
                    <div
                      key={rev.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs ${
                        idx === 0
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900">{rev.id}</span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                              CURRENT LIVE VERSION
                            </span>
                          )}
                        </div>
                        <p className="text-stone-700 font-medium">{rev.summary}</p>
                        <div className="text-[11px] text-stone-500 flex items-center gap-2">
                          <span>By <strong>{rev.operator}</strong></span>
                          <span>•</span>
                          <span>{new Date(rev.timestamp).toLocaleString('en-GB')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setDraft(JSON.parse(JSON.stringify(rev.snapshot)));
                            showToast(`Loaded ${rev.id} snapshot into editor`);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-semibold"
                        >
                          Load in Editor
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRestoreRevision(rev.id)}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                          <span>Restore Live</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-between pt-5 border-t border-stone-200">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Unsaved draft in local memory</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(true)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish Changes</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: Live Storefront Preview Simulator */}
      {/* ========================================================================= */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-6xl bg-stone-900 rounded-2xl border border-stone-700 shadow-2xl flex flex-col h-[92vh] overflow-hidden">
            {/* Top Toolbar */}
            <div className="px-4 py-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                </div>
                <span className="text-xs font-bold text-stone-300 font-mono hidden sm:inline">
                  LIVE STORE SIMULATOR — {previewDevice.toUpperCase()} VIEW
                </span>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-2">
                <div className="bg-stone-800 p-1 rounded-lg flex items-center gap-1 border border-stone-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded text-xs font-bold flex items-center gap-1 ${
                      previewDevice === 'desktop' ? 'bg-teal-900 text-teal-200 shadow-xs' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded text-xs font-bold flex items-center gap-1 ${
                      previewDevice === 'mobile' ? 'bg-teal-900 text-teal-200 shadow-xs' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mobile (375px)</span>
                  </button>
                </div>

                {/* Language Switch */}
                <button
                  type="button"
                  onClick={() => setPreviewLanguage(previewLanguage === 'EN' ? 'BN' : 'EN')}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold border border-stone-700"
                >
                  {previewLanguage === 'EN' ? '🇧🇩 বাংলা' : '🇬🇧 English'}
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded-lg text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Simulated Store Canvas */}
            <div className="flex-1 overflow-y-auto bg-stone-950 p-4 sm:p-6 flex justify-center">
              <div
                className={`bg-white transition-all duration-300 overflow-y-auto shadow-2xl ${
                  previewDevice === 'desktop'
                    ? 'w-full max-w-5xl rounded-xl border border-stone-300'
                    : 'w-[375px] rounded-3xl border-8 border-stone-800 shadow-2xl h-[760px]'
                }`}
              >
                {/* 1. Announcement Bar */}
                {draft.announcementBar.enabled && (
                  <div className={`py-2 px-4 text-center text-xs font-semibold ${
                    draft.announcementBar.theme === 'teal'
                      ? 'bg-teal-900 text-teal-100'
                      : draft.announcementBar.theme === 'amber'
                      ? 'bg-amber-900 text-amber-100'
                      : draft.announcementBar.theme === 'crimson'
                      ? 'bg-rose-900 text-rose-100'
                      : 'bg-stone-900 text-stone-100'
                  }`}>
                    {previewLanguage === 'BN' ? draft.announcementBar.textBn : draft.announcementBar.text}
                    {draft.announcementBar.linkLabel && (
                      <span className="ml-2 underline font-bold cursor-pointer">
                        {previewLanguage === 'BN' ? draft.announcementBar.linkLabelBn : draft.announcementBar.linkLabel} &rarr;
                      </span>
                    )}
                  </div>
                )}

                {/* 2. Header */}
                <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white/95">
                  <div>
                    <h2 className="text-xl font-serif font-black text-teal-950">
                      {previewLanguage === 'BN' ? draft.brandNameBn : draft.brandName}
                    </h2>
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest block">
                      {previewLanguage === 'BN' ? draft.mottoBn : draft.motto}
                    </span>
                  </div>

                  {previewDevice === 'desktop' && (
                    <div className="flex items-center gap-4 text-xs font-semibold text-stone-700">
                      {(draft.navLinks || []).filter(l => l.enabled).map(l => (
                        <span key={l.id} className="hover:text-teal-800 cursor-pointer">
                          {previewLanguage === 'BN' ? l.nameBn : l.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs font-bold text-teal-900 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200">
                    Cart (0)
                  </div>
                </div>

                {/* 3. Hero Section */}
                <div className="relative bg-stone-900 text-white overflow-hidden p-8 sm:p-14 min-h-[340px] flex flex-col justify-center">
                  <img
                    src={draft.hero.image}
                    alt="Hero"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0 bg-stone-950" 
                    style={{ opacity: (draft.hero.overlayOpacity || 45) / 100 }}
                  ></div>

                  <div className="relative z-10 max-w-xl space-y-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-900/80 text-teal-200 border border-teal-700/50">
                      {previewLanguage === 'BN' ? draft.hero.eyebrowBn : draft.hero.eyebrow}
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight">
                      {previewLanguage === 'BN' ? draft.hero.titleBn : draft.hero.title}
                    </h1>
                    <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                      {previewLanguage === 'BN' ? draft.hero.subtitleBn : draft.hero.subtitle}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-3">
                      <button className="px-5 py-2.5 rounded-lg bg-white text-stone-900 font-bold text-xs shadow-md">
                        {previewLanguage === 'BN' ? draft.hero.ctaPrimaryTextBn : draft.hero.ctaPrimaryText} &rarr;
                      </button>
                      <button className="px-5 py-2.5 rounded-lg bg-stone-800/80 text-stone-200 font-bold text-xs border border-stone-700">
                        {previewLanguage === 'BN' ? draft.hero.ctaSecondaryTextBn : draft.hero.ctaSecondaryText}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Promo Cards */}
                {(draft.promoBanners || []).filter(b => b.enabled).length > 0 && (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(draft.promoBanners || []).filter(b => b.enabled).map(b => (
                      <div key={b.id} className="relative h-44 rounded-xl overflow-hidden shadow-xs border border-stone-200 p-4 flex flex-col justify-end text-white">
                        <img src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
                        <div className="relative z-10 space-y-1">
                          <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block">{b.badge}</span>
                          <h4 className="font-serif font-bold text-sm text-white">{previewLanguage === 'BN' ? b.titleBn : b.title}</h4>
                          <p className="text-[11px] text-stone-300 line-clamp-1">{previewLanguage === 'BN' ? b.subtitleBn : b.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Footer Preview */}
                <div className="p-6 bg-stone-900 text-stone-400 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                    <span className="text-white font-serif font-bold text-base">
                      {previewLanguage === 'BN' ? draft.brandNameBn : draft.brandName}
                    </span>
                    <span className="text-[11px] text-teal-400 font-mono">Hotline: {draft.contact.phone}</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    &copy; {new Date().getFullYear()} {draft.brandName}. All rights reserved. Trade License: {draft.tradeLicense || 'TRAD/DNCC/094281/2026'}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Modal: Confirm Publish to Live Store */}
      {/* ========================================================================= */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-300 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
              <div className="p-2.5 rounded-full bg-teal-100 text-teal-900">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Publish Storefront Changes</h3>
                <p className="text-xs text-stone-500">Deploy draft copy to the live website instantly.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Release Summary / Changelog Note</label>
                <input
                  type="text"
                  value={publishSummary}
                  onChange={(e) => setPublishSummary(e.target.value)}
                  placeholder="e.g. Updated Eid banners and shipping policy"
                  className="w-full p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5 text-stone-600 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-stone-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Snapshot Revision Record</span>
                </div>
                <p>An immutable rollback snapshot will be created in the revisions ledger.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handleConfirmPublish}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Deploy Live</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Modal: Artisanal Image Asset Selector */}
      {/* ========================================================================= */}
      {imagePickerTarget && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 border border-stone-300 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-800" />
                <h3 className="text-base font-bold text-stone-900">Artisanal Media Asset Library</h3>
              </div>
              <button
                type="button"
                onClick={() => setImagePickerTarget(null)}
                className="text-xs font-bold text-stone-500 hover:text-stone-900"
              >
                Cancel
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {PRESET_ARTISAN_IMAGES.map((img, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectPresetImage(img.url)}
                  className="group relative h-40 rounded-xl overflow-hidden border border-stone-300 shadow-xs hover:border-teal-700 hover:shadow-lg cursor-pointer transition-all duration-200"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block">{img.category}</span>
                    <h5 className="text-xs font-bold text-white group-hover:text-teal-200 leading-tight">{img.name}</h5>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
              <span>Royalty-free curated photos of authentic Bangladesh craft traditions.</span>
              <button
                type="button"
                onClick={() => setImagePickerTarget(null)}
                className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
