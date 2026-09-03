import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Award, ShieldCheck, Heart } from 'lucide-react';
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
    <div className="flex flex-col gap-12 sm:gap-16 pb-16">
      {/* Hero Section */}
      {(sec.showHero ?? true) && (
        <section className="relative bg-stone-900 text-white overflow-hidden sm:mx-4 lg:mx-8 sm:rounded-2xl mt-0 sm:mt-4 border border-stone-800 shadow-lg">
          <div className="absolute inset-0 z-0">
            <img
              src={siteContent.hero.image}
              alt="Kisholoy Heritage"
              className="w-full h-full object-cover object-center"
            />
            <div 
              className="absolute inset-0 bg-stone-950"
              style={{ opacity: (siteContent.hero.overlayOpacity || 45) / 100 }}
            ></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 sm:py-28 lg:px-12 flex flex-col items-start max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-900/80 text-teal-200 border border-teal-700/50 mb-6 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              {language === 'BN' ? siteContent.hero.eyebrowBn : siteContent.hero.eyebrow}
            </span>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight mb-6">
              {language === 'BN' ? siteContent.hero.titleBn : siteContent.hero.title}
            </h1>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
              {language === 'BN' ? siteContent.hero.subtitleBn : siteContent.hero.subtitle}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to={siteContent.hero.ctaPrimaryUrl || '/shop'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-stone-900 font-semibold text-sm hover:bg-stone-100 active:scale-95 transition-all shadow-md"
              >
                <span>{language === 'BN' ? siteContent.hero.ctaPrimaryTextBn : siteContent.hero.ctaPrimaryText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={siteContent.hero.ctaSecondaryUrl || '/pages/about'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-stone-800/80 hover:bg-stone-800 text-stone-200 font-semibold text-sm border border-stone-700 backdrop-blur-xs transition-all"
              >
                <span>{language === 'BN' ? siteContent.hero.ctaSecondaryTextBn : siteContent.hero.ctaSecondaryText}</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Campaign & Promo Cards (Top Carousel/Mid Page) */}
      {activePromos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePromos.map((promo) => (
              <Link
                key={promo.id}
                to={promo.link || '/shop'}
                className="group relative h-48 rounded-2xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-end p-5 text-white"
              >
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
                <div className="relative z-10 space-y-1">
                  {promo.badge && (
                    <span className="inline-block text-[10px] font-bold text-teal-300 uppercase tracking-widest bg-teal-950/70 px-2 py-0.5 rounded border border-teal-800/60 mb-1">
                      {language === 'BN' && promo.badgeBn ? promo.badgeBn : promo.badge}
                    </span>
                  )}
                  <h3 className="text-base font-serif font-bold text-white group-hover:text-teal-200 transition-colors">
                    {language === 'BN' && promo.titleBn ? promo.titleBn : promo.title}
                  </h3>
                  <p className="text-xs text-stone-300 line-clamp-1">
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-teal-800 uppercase tracking-widest block mb-1">
                {language === 'BN' ? 'ঐতিহ্যবাহী সংগ্রহ' : 'Curated Collections'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                {language === 'BN' ? (sec.categoriesTitleBn || 'জনপ্রিয় ক্যাটাগরি') : (sec.categoriesTitle || 'Explore by Category')}
              </h2>
            </div>
            <Link to="/shop" className="text-sm font-semibold text-teal-900 hover:text-teal-950 inline-flex items-center gap-1">
              {language === 'BN' ? 'সব দেখুন' : 'View All'} &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group relative h-64 rounded-xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-end p-6"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent"></div>
                
                <div className="relative z-10">
                  <span className="text-[11px] font-semibold text-teal-300 uppercase tracking-wider block mb-1">
                    {cat.itemCount} {language === 'BN' ? 'টি পণ্য' : 'Items'}
                  </span>
                  <h3 className="text-lg font-serif font-bold text-white group-hover:text-teal-200 transition-colors">
                    {language === 'BN' ? cat.nameBn : cat.name}
                  </h3>
                  <p className="text-xs text-stone-300 line-clamp-1 mt-1">
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-teal-800 uppercase tracking-widest block mb-1">
                {language === 'BN' ? 'সেরা পছন্দ' : 'Handpicked for You'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                {language === 'BN' ? (sec.featuredTitleBn || 'বিশেষ নির্বাচিত পণ্য') : (sec.featuredTitle || 'Featured Masterpieces')}
              </h2>
            </div>
            <Link to="/shop" className="text-sm font-semibold text-teal-900 hover:text-teal-950 hidden sm:inline-flex items-center gap-1">
              {language === 'BN' ? 'সকল পণ্য' : 'Browse Entire Shop'} &rarr;
            </Link>
          </div>

          <ProductGrid featuredOnly={true} />
        </section>
      )}

      {/* Artisan Spotlight Banner */}
      {(sec.showArtisanSpotlight ?? true) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="bg-stone-100 rounded-2xl p-8 sm:p-12 border border-stone-300/80 flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-900 bg-white px-3 py-1 rounded-full border border-stone-200">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                {language === 'BN' ? 'কারিগরদের ক্ষমতায়ন' : 'Fair Trade & Heritage Support'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {language === 'BN' 
                  ? (sec.artisanTitleBn || 'শতবর্ষের তাঁত ও মৃত্তিকা শিল্পের নতুন উন্মেষ') 
                  : (sec.artisanTitle || 'Revitalizing Bangladesh’s Living Craft Traditions')}
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                {language === 'BN' 
                  ? (sec.artisanStoryBn || 'কিশলয় থেকে কেনাকাটার প্রতিটি ধাপ সরাসরি রূপগঞ্জের তাঁতি, কুমিল্লার মৃৎশিল্পী এবং সুন্দরবনের মৌয়ালদের পরিবারকে প্রত্যক্ষ সহায়তা করে।')
                  : (sec.artisanStory || 'Every purchase at Kisholoy directly supports rural weavers in Rupganj, potters in Cumilla, and honey gatherers in the Sundarbans. We ensure fair pricing, ethical working conditions, and authentic quality.')}
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link to="/pages/about" className="text-xs font-bold text-teal-950 underline underline-offset-4 hover:text-teal-800">
                  {language === 'BN' ? 'আমাদের গল্প পড়ুন' : 'Read Our Heritage Story'} &rarr;
                </Link>
              </div>
            </div>
            <div className="w-full lg:w-96 aspect-4/3 rounded-xl overflow-hidden shadow-md border border-stone-200 flex-shrink-0">
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
