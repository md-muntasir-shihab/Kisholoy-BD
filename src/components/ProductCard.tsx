import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, CheckCircle2, Heart, Sparkles, MapPin } from 'lucide-react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { language, addToCart, isWishlisted, toggleWishlist } = useApp();

  const title = language === 'BN' && product.titleBn ? product.titleBn : product.title;
  const badge = language === 'BN' && product.badgeBn ? product.badgeBn : product.badge;
  const wishlisted = isWishlisted(product.id);

  // Calculate discount percentage if original price exists
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/90 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl hover:border-stone-300 dark:hover:border-slate-700 transition-all duration-300">
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100 dark:bg-slate-800">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.images[0]}
            alt={title}
            className="h-full w-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        </Link>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 p-2.5 rounded-full transition-all duration-200 shadow-md backdrop-blur-md min-h-[40px] min-w-[40px] flex items-center justify-center ${
            wishlisted
              ? 'bg-rose-50/95 text-rose-600 hover:bg-rose-100 scale-105'
              : 'bg-white/85 text-stone-700 hover:text-rose-600 hover:bg-white hover:scale-105 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-600 stroke-rose-600' : ''}`} />
        </button>

        {/* Badges & Discounts */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-stone-900/90 text-white backdrop-blur-md shadow-xs border border-stone-700/40">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {badge}
            </span>
          )}

          {discountPercent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* In Stock & Origin Indicator */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-white/95 text-teal-900 backdrop-blur-md border border-stone-200/80 shadow-xs dark:bg-slate-900/95 dark:text-teal-300 dark:border-slate-700">
            <CheckCircle2 className="w-3 h-3 text-teal-700 dark:text-teal-400" />
            {language === 'BN' ? 'স্টকে প্রস্তুত' : 'In Stock'}
          </span>

          {product.origin && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-stone-900/80 text-stone-200 backdrop-blur-md border border-stone-700/50">
              <MapPin className="w-2.5 h-2.5 text-amber-400" />
              {product.origin}
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 mb-1.5">
            <span className="font-semibold text-teal-900 dark:text-teal-400 tracking-wide uppercase text-[10px]">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-800/40">
              <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
              <span className="text-[11px] font-bold">{product.rating}</span>
              <span className="text-stone-400 dark:text-slate-500 font-normal text-[10px]">({product.reviewsCount})</span>
            </div>
          </div>

          <Link to={`/product/${product.slug}`} className="block group-hover:text-teal-950 dark:group-hover:text-teal-300 transition-colors">
            <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900 dark:text-slate-100 line-clamp-2 leading-snug">
              {title}
            </h3>
          </Link>
        </div>

        <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-slate-100">
                ৳ {product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-stone-400 dark:text-slate-500 line-through">
                  ৳ {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {product.sku && (
              <span className="text-[10px] text-stone-400 dark:text-slate-500 font-mono tracking-wider">{product.sku}</span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            aria-label={`Add ${product.title} to cart`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 text-white active:scale-95 transition-all shadow-xs font-semibold text-xs flex-shrink-0 dark:bg-teal-600 dark:hover:bg-teal-500 min-h-[38px]"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'কিনুন' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

