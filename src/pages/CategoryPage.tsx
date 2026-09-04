import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProductGrid } from '../components/ProductGrid';
import { useApp } from '../context/AppContext';
import { ArrowLeft } from 'lucide-react';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, language } = useApp();

  const category = categories.find((c) => c.slug === slug);

  if (!category && slug !== 'all') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold font-serif mb-4 text-stone-900 dark:text-slate-100">Category Not Found</h2>
        <Link to="/shop" className="text-teal-800 dark:text-teal-300 font-semibold hover:underline">
          Return to Shop
        </Link>
      </div>
    );
  }

  const name = category ? (language === 'BN' ? category.nameBn : category.name) : 'All Products';
  const desc = category?.description || 'Browse all authentic handcrafted products.';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        {language === 'BN' ? 'সকল ক্যাটাগরিতে ফিরে যান' : 'Back to All Products'}
      </Link>

      <div className="relative rounded-2xl overflow-hidden bg-stone-900 text-white p-8 sm:p-12 mb-10 border border-stone-800 dark:border-slate-700">
        {category?.image && (
          <img
            src={category.image}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
          />
        )}
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-bold text-teal-300 uppercase tracking-widest block mb-2">
            {language === 'BN' ? 'ক্যাটাগরি সংগ্রহ' : 'Category Collection'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">{name}</h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">{desc}</p>
        </div>
      </div>

      <ProductGrid categorySlug={slug} />
    </div>
  );
}
