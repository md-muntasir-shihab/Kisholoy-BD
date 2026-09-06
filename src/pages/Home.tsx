import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Award, ShieldCheck, HeartHandshake, MapPin, Truck, CheckCircle2 } from 'lucide-react';
import { ProductGrid } from '../components/ProductGrid';
import { useApp } from '../context/AppContext';

export function Home() {
  const { siteContent, categories, language } = useApp();

  const sec = siteContent.sectionSettings || {
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
    artisanStory: 'Every purchase at Kisholoy directly supports rural weavers in Rupganj, potters in Cumilla, and honey gatherers in the Sundarbans. We ensure fair pricing, ethical working conditions, and authentic quality.',
    artisanStoryBn: 'কিশলয় থেকে কেনাকাটার প্রতিটি ধাপ সরাসরি রূপগঞ্জের তাঁতি, কুমিল্লার মৃৎশিল্পী এবং সুন্দরবনের মৌয়ালদের পরিবারকে প্রত্যক্ষ সহায়তা করে।',
    artisanImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800'
  };

  const activePromos = (siteContent.promoBanners || []).filter(p => p.enabled);

  return (
    <div className="flex flex-col gap-8 sm:gap-14 lg:gap-18 pb-16 sm:pb-20">
      {/* Hero Section */}
      {(sec.showHero ?? true) && (
        <section className="relative bg-stone-950 text-white overflow-hidden mx-3 sm:mx-4 lg:mx-8 rounded-2xl sm:rounded-3xl mt-2 sm:mt-4 border border-stone-800/90 shadow-2xl">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={siteContent.hero.image}
              alt="Kisholoy Heritage"
              className="w-full h-full object-cover object-center scale-102 transform duration-1000"
            />
            <div 
              className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/85 to-stone-950/40"
              style={{ opacity: Math.max((siteContent.hero.overlayOpacity || 50) / 100, 0.45) }}
            ></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-8 sm:py-20 lg:py-28 flex flex-col items-start max-w-3xl">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-teal-950/90 text-teal-300 border border-teal-700/60 mb-3 sm:mb-6 backdrop-blur-md shadow-inner">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span>{language === 'BN' ? siteContent.hero.eyebrowBn : siteContent.hero.eyebrow}</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-6xl font-serif font-black text-white tracking-tight leading-[1.15] mb-3 sm:mb-6 drop-shadow-sm">
              {language === 'BN' ? siteContent.hero.titleBn : siteContent.hero.title}
            </h1>

            {/* Subtitle */}
            <p className="text-stone-300 text-xs sm:text-base lg:text-lg leading-relaxed mb-5 sm:mb-8 max-w-xl font-normal line-clamp-3 sm:line-clamp-none">
              {language === 'BN' ? siteContent.hero.subtitleBn : siteContent.hero.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 w-full sm:w-auto">
              <Link
                to={siteContent.hero.ctaPrimaryUrl || '/shop'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-stone-950 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-lg shadow-teal-950/40"
              >
                <span>{language === 'BN' ? siteContent.hero.ctaPrimaryTextBn : siteContent.hero.ctaPrimaryText}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
              <Link
                to={siteContent.hero.ctaSecondaryUrl || '/pages/about'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-200 font-semibold text-xs sm:text-sm border border-stone-700/80 backdrop-blur-md transition-all"
              >
                <span>{language === 'BN' ? siteContent.hero.ctaSecondaryTextBn : siteContent.hero.ctaSecondaryText}</span>
              </Link>
            </div>

            {/* Quick Hero Highlights */}
            <div className="mt-6 pt-5 sm:mt-10 sm:pt-8 border-t border-stone-800/80 grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-6 text-[11px] sm:text-xs text-stone-300 sm:text-stone-400 w-full">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{language === 'BN' ? '১০০% আসল হস্তশিল্প' : '100% Genuine Handcrafted'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{language === 'BN' ? 'সারাদেশে হোম ডেলিভারি' : 'Nationwide Fast Delivery'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{language === 'BN' ? 'সরাসরি গ্রামীণ কারিগরদের কাছ থেকে' : 'Sourced from Rural Artisans'}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Campaign & Promo Cards */}
      {activePromos.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {activePromos.map((promo) => (
              <Link
                key={promo.id}
                to={promo.link || '/shop'}
                className="group relative h-40 sm:h-52 rounded-xl sm:rounded-2xl overflow-hidden border border-stone-200/90 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-stone-300 transition-all duration-300 flex flex-col justify-end p-4 sm:p-6 text-white"
              >
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent"></div>
                <div className="relative z-10 space-y-1 sm:space-y-1.5">
                  {promo.badge && (
                    <span className="inline-block text-[9px] sm:text-[10px] font-bold text-teal-300 uppercase tracking-widest bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60 mb-0.5 sm:mb-1">
                      {language === 'BN' && promo.badgeBn ? promo.badgeBn : promo.badge}
                    </span>
                  )}
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white group-hover:text-teal-300 transition-colors">
                    {language === 'BN' && promo.titleBn ? promo.titleBn : promo.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-300 line-clamp-1">
                    {language === 'BN' && promo.subtitleBn ? promo.subtitleBn : promo.subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Categories Grid */}
      {(sec.showCuratedCategories ?? true) && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-4 sm:mb-8 pb-3 sm:pb-4 border-b border-stone-200/80 dark:border-slate-800 gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-teal-900 dark:text-teal-400 uppercase tracking-widest block mb-0.5 sm:mb-1">
                {language === 'BN' ? 'ঐতিহ্যবাহী সংগ্রহ' : 'Curated Heritage'}
              </span>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
                {language === 'BN' ? (sec.categoriesTitleBn || 'জনপ্রিয় ক্যাটাগরি') : (sec.categoriesTitle || 'Explore by Category')}
              </h2>
            </div>
            <Link 
              to="/shop" 
              className="text-xs font-bold text-teal-900 dark:text-teal-300 hover:text-teal-950 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 transition-colors shrink-0"
            >
              <span>{language === 'BN' ? 'সকল' : 'All'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group relative h-44 sm:h-64 lg:h-72 rounded-xl sm:rounded-2xl overflow-hidden border border-stone-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-3 sm:p-5"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent"></div>
                
                <div className="relative z-10">
                  <span className="text-[9px] sm:text-[11px] font-semibold text-teal-300 uppercase tracking-wider block mb-0.5">
                    {cat.itemCount} {language === 'BN' ? 'টি পণ্য' : 'Items'}
                  </span>
                  <h3 className="text-xs sm:text-base lg:text-xl font-serif font-bold text-white group-hover:text-teal-200 transition-colors line-clamp-1">
                    {language === 'BN' ? cat.nameBn : cat.name}
                  </h3>
                  <p className="hidden sm:block text-xs text-stone-300 line-clamp-1 mt-1 font-normal">
                    {cat.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Showcase */}
      {(sec.showFeaturedProducts ?? true) && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-4 sm:mb-8 pb-3 sm:pb-4 border-b border-stone-200/80 dark:border-slate-800 gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-teal-900 dark:text-teal-400 uppercase tracking-widest block mb-0.5 sm:mb-1">
                {language === 'BN' ? 'সেরা পছন্দ' : 'Handcrafted Masterpieces'}
              </span>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
                {language === 'BN' ? (sec.featuredTitleBn || 'বিশেষ নির্বাচিত পণ্য') : (sec.featuredTitle || 'Featured Masterpieces')}
              </h2>
            </div>
            <Link 
              to="/shop" 
              className="text-xs font-bold text-teal-900 dark:text-teal-300 hover:text-teal-950 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 transition-colors shrink-0"
            >
              <span>{language === 'BN' ? 'সকল পণ্য' : 'Shop All'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ProductGrid featuredOnly={true} />
        </section>
      )}

      {/* Artisan Spotlight Banner */}
      {(sec.showArtisanSpotlight ?? true) && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <div className="bg-gradient-to-br from-stone-900 to-stone-950 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12 border border-stone-800 shadow-xl flex flex-col lg:flex-row items-center gap-6 sm:gap-10 text-white">
            <div className="flex-1 space-y-3 sm:space-y-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-amber-300 bg-amber-950/80 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-amber-800/60 shadow-xs">
                <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                {language === 'BN' ? 'কারিগরদের ক্ষমতায়ন' : 'Direct Artisan Support'}
              </span>
              <h3 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                {language === 'BN' 
                  ? (sec.artisanTitleBn || 'শতবর্ষের তাঁত ও মৃত্তিকা শিল্পের নতুন উন্মেষ') 
                  : (sec.artisanTitle || 'Revitalizing Bangladesh’s Living Craft Traditions')}
              </h3>
              <p className="text-stone-300 text-xs sm:text-base leading-relaxed">
                {language === 'BN' 
                  ? (sec.artisanStoryBn || 'কিশলয় থেকে কেনাকাটার প্রতিটি ধাপ সরাসরি রূপগঞ্জের তাঁতি, কুমিল্লার মৃৎশিল্পী এবং সুন্দরবনের মৌয়ালদের পরিবারকে প্রত্যক্ষ সহায়তা করে।')
                  : (sec.artisanStory || 'Every purchase at Kisholoy directly supports rural weavers in Rupganj, potters in Cumilla, and honey gatherers in the Sundarbans. We ensure fair pricing, ethical working conditions, and authentic quality.')}
              </p>
              <div className="pt-1 sm:pt-2 flex flex-wrap gap-4">
                <Link 
                  to="/pages/about" 
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white text-stone-900 font-bold text-xs hover:bg-stone-100 transition-colors shadow-sm"
                >
                  <span>{language === 'BN' ? 'আমাদের গল্প পড়ুন' : 'Read Our Heritage Story'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            <div className="w-full lg:w-96 aspect-4/3 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-stone-700/80 shrink-0">
              <img
                src={sec.artisanImage || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800"}
                alt="Artisan Craftsmanship"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

