import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
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
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header Banner */}
      <div className="border-b border-stone-200 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
            {language === 'BN' ? 'সকল পণ্য সংগ্রহ' : 'Artisanal Catalog'}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {language === 'BN' 
              ? `${filteredProducts.length} টি পণ্য প্রদর্শিত হচ্ছে` 
              : `Showing ${filteredProducts.length} authentic products`}
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-stone-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs sm:text-sm bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-800 font-medium focus:outline-none focus:border-teal-800"
          >
            <option value="featured">Featured / Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Active Search Filter Badge */}
      {searchQuery && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-xs text-stone-500">Searching for:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold">
            "{searchQuery}"
            <button onClick={clearSearch} className="hover:text-red-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Filter Sidebar */}
        <aside className="lg:w-64 flex-shrink-0 space-y-6">
          <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-900" />
                {language === 'BN' ? 'ফিল্টার' : 'Filters'}
              </h3>
              {(currentCategory !== 'all' || searchQuery || maxPrice < 6000) && (
                <button
                  onClick={() => {
                    setSearchParams({});
                    setMaxPrice(6000);
                    setInStockOnly(false);
                  }}
                  className="text-xs text-teal-900 hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2.5">
                {language === 'BN' ? 'ক্যাটাগরি' : 'Category'}
              </label>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                    currentCategory === 'all' 
                      ? 'bg-teal-900 text-white' 
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                >
                  {language === 'BN' ? 'সকল ক্যাটাগরি' : 'All Categories'}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCategoryChange(c.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                      currentCategory === c.slug 
                        ? 'bg-teal-900 text-white' 
                        : 'text-stone-600 hover:bg-stone-200/60'
                    }`}
                  >
                    {language === 'BN' ? c.nameBn : c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Max Price
                </label>
                <span className="text-xs font-bold text-teal-950">৳ {maxPrice.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="6000"
                step="250"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-teal-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>৳ 500</span>
                <span>৳ 6,000+</span>
              </div>
            </div>

            {/* In Stock Checkbox */}
            <div className="pt-2 border-t border-stone-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-teal-900 focus:ring-teal-900 h-4 w-4"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-stone-50 rounded-xl border border-dashed border-stone-300">
              <p className="text-stone-500 font-medium mb-3">
                {language === 'BN' ? 'কোনো পণ্য পাওয়া যায়নি।' : 'No products matched your active filters.'}
              </p>
              <button
                onClick={() => {
                  setSearchParams({});
                  setMaxPrice(6000);
                  setInStockOnly(false);
                }}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold"
              >
                Clear all filters
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
