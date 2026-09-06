import React from 'react';
import { ProductCard } from './ProductCard';
import { useApp } from '../context/AppContext';

interface ProductGridProps {
  categorySlug?: string;
  limit?: number;
  featuredOnly?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  categorySlug, 
  limit, 
  featuredOnly 
}) => {
  const { products, language } = useApp();

  let filtered = [...products];

  if (categorySlug && categorySlug !== 'all') {
    filtered = filtered.filter(p => p.categorySlug === categorySlug);
  }

  if (featuredOnly) {
    filtered = filtered.filter(p => p.isFeatured);
  }

  if (limit) {
    filtered = filtered.slice(0, limit);
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 bg-stone-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-stone-300 dark:border-slate-700">
        <p className="text-stone-500 font-medium">
          {language === 'BN' ? 'কোনো পণ্য পাওয়া যায়নি।' : 'No products found matching your criteria.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
      {filtered.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
