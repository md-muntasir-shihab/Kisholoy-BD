import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, CheckCircle2, Heart } from 'lucide-react';
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

  return (
    <div className="group relative flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.images[0]}
            alt={title}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
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
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 shadow-sm ${
            wishlisted
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'bg-white/80 text-stone-600 hover:text-rose-600 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-600 stroke-rose-600' : ''}`} />
        </button>

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-900/90 text-white backdrop-blur-xs shadow-xs">
              {badge}
            </span>
          </div>
        )}

        {/* In Stock Indicator */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/95 text-teal-800 backdrop-blur-xs border border-stone-200 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-teal-700" />
            {language === 'BN' ? 'স্টকে আছে' : 'In Stock'}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-medium">{product.category}</span>
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
              <span>{product.rating}</span>
              <span className="text-stone-400 font-normal">({product.reviewsCount})</span>
            </div>
          </div>

          <Link to={`/product/${product.slug}`} className="block group-hover:text-teal-900 transition-colors">
            <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 leading-snug">
              {title}
            </h3>
          </Link>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-stone-900">
                ৳ {product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-stone-400 line-through">
                  ৳ {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {product.sku && (
              <span className="text-[10px] text-stone-400 font-mono">{product.sku}</span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            aria-label={`Add ${product.title} to cart`}
            className="inline-flex items-center justify-center p-2.5 rounded-lg bg-teal-900 text-white hover:bg-teal-950 active:scale-95 transition-all shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
