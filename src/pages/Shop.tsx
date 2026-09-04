import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, ArrowUpDown, X, Sparkles, Check, RotateCcw } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useApp } from '../context/AppContext';

export function Shop() {
  const { products, categories, language } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(6000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount =
    (currentCategory !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (maxPrice < 6000 ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (currentCategory !== 'all' && product.categorySlug !== currentCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = product.title.toLowerCase().includes(q);
        const matchTitleBn = product.titleBn?.toLowerCase().includes(q);
        const matchSku = product.sku.toLowerCase().includes(q);
        const matchCat = product.category.toLowerCase().includes(q);
        if (!matchTitle && !matchTitleBn && !matchSku && !matchCat) return false;
      }
      // Price filter
      if (product.price > maxPrice) {
        return false;
      }
      // In-stock filter
      if (inStockOnly && product.stock <= 0) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // featured default
    });
  }, [products, currentCategory, searchQuery, maxPrice, inStockOnly, sortBy]);

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    setSearchParams(params);
    setFilterOpen(false);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header Banner */}
      <div className="border-b border-stone-200/90 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'BN' ? 'আসল বাংলাদেশি কারুকাজ' : 'Authentic Bangladeshi Heritage'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-stone-900 tracking-tight">
            {language === 'BN' ? 'সকল পণ্য সংগ্রহ' : 'Artisanal Collection'}
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            {language === 'BN' 
              ? `${filteredProducts.length} টি খাঁটি পণ্য প্রদর্শিত হচ্ছে` 
              : `Showing ${filteredProducts.length} certified heritage products`}
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2.5 bg-stone-50 p-1.5 rounded-xl border border-stone-200 shadow-2xs">
          <ArrowUpDown className="w-4 h-4 text-stone-500 ml-1.5" />
          <span className="text-xs font-semibold text-stone-600 hidden sm:inline">{language === 'BN' ? 'সাজান:' : 'Sort by:'}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 cursor-pointer shadow-2xs"
          >
            <option value="featured">Featured / curated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Active Search Filter Badge */}
      {searchQuery && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-xs text-stone-500">Search results for:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-xs font-semibold">
            "{searchQuery}"
            <button onClick={clearSearch} className="hover:text-rose-600 ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setFilterOpen((v) => !v)}
          aria-expanded={filterOpen}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold transition-colors shadow-xs dark:bg-teal-700 dark:hover:bg-teal-600"
        >
          <Filter className="w-4 h-4" />
          <span>{filterOpen ? (language === 'BN' ? 'ফিল্টার লুকান' : 'Hide Filters') : (language === 'BN' ? 'ফিল্টার দেখুন' : 'Show Filters')}</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Filter Sidebar */}
        <aside className={`lg:w-68 flex-shrink-0 space-y-6 ${filterOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-900" />
                {language === 'BN' ? 'ফিল্টারসমূহ' : 'Refine Catalog'}
              </h3>
              {(currentCategory !== 'all' || searchQuery || maxPrice < 6000 || inStockOnly) && (
                <button
                  onClick={() => {
                    setSearchParams({});
                    setMaxPrice(6000);
                    setInStockOnly(false);
                    setFilterOpen(false);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2.5">
                {language === 'BN' ? 'ক্যাটাগরি' : 'Category'}
              </label>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl font-semibold transition-all flex items-center justify-between ${
                    currentCategory === 'all' 
                      ? 'bg-teal-950 text-white shadow-xs' 
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>{language === 'BN' ? 'সকল ক্যাটাগরি' : 'All Categories'}</span>
                  {currentCategory === 'all' && <Check className="w-3.5 h-3.5 text-teal-400" />}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCategoryChange(c.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl font-semibold transition-all flex items-center justify-between ${
                      currentCategory === c.slug 
                        ? 'bg-teal-950 text-white shadow-xs' 
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>{language === 'BN' ? c.nameBn : c.name}</span>
                    {currentCategory === c.slug && <Check className="w-3.5 h-3.5 text-teal-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Max Budget
                </label>
                <span className="text-xs font-bold text-teal-950 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  ৳ {maxPrice.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="6000"
                step="250"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-teal-900 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-medium mt-1.5">
                <span>৳ 500</span>
                <span>৳ 6,000+</span>
              </div>
            </div>

            {/* In Stock Checkbox */}
            <div className="pt-3 border-t border-stone-100">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-800 select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded-md border-stone-300 text-teal-900 focus:ring-teal-900 h-4 w-4 cursor-pointer"
                />
                <span>{language === 'BN' ? 'শুধু প্রস্তুত স্টক' : 'Ready Stock Only'}</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-stone-50/80 rounded-2xl border border-dashed border-stone-300 p-8">
              <p className="text-stone-600 font-medium mb-4 text-sm">
                {language === 'BN' ? 'কোনো পণ্য খুঁজে পাওয়া যায়নি।' : 'No products matched your active filter criteria.'}
              </p>
              <button
                onClick={() => {
                  setSearchParams({});
                  setMaxPrice(6000);
                  setInStockOnly(false);
                  setFilterOpen(false);
                }}
                className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors shadow-xs dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

