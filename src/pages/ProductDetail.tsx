import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Truck, RotateCcw, Check, ShoppingBag, ArrowLeft, Heart, Sparkles, MapPin, Layers, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { products, addToCart, language, isWishlisted, toggleWishlist } = useApp();
  const navigate = useNavigate();

  const product = products.find((p) => p.slug === slug);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product?.variants?.[0]?.id
  );
  const [quantity, setQuantity] = useState<number>(1);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-serif mb-2 text-stone-900">Product Not Found</h2>
        <p className="text-stone-500 text-sm mb-6">The requested product could not be located in our catalog.</p>
        <Link to="/shop" className="px-5 py-2.5 bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-950 transition-colors">
          Return to Artisanal Shop
        </Link>
      </div>
    );
  }

  const title = language === 'BN' && product.titleBn ? product.titleBn : product.title;
  const description = language === 'BN' && product.descriptionBn ? product.descriptionBn : product.description;
  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariantId);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariantId);
    navigate('/checkout');
  };

  const relatedProducts = products
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 mb-8 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-stone-900 font-medium">Home</Link>
        <span className="text-stone-300">/</span>
        <Link to="/shop" className="hover:text-stone-900 font-medium">Artisanal Catalog</Link>
        <span className="text-stone-300">/</span>
        <Link to={`/category/${product.categorySlug}`} className="hover:text-stone-900 font-medium text-teal-900">
          {product.category}
        </Link>
        <span className="text-stone-300">/</span>
        <span className="text-stone-900 font-bold truncate max-w-xs">{title}</span>
      </nav>

      {/* Main Product Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-16">
        
        {/* Left Column: Image Gallery (5 cols on large screens) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square w-full rounded-3xl overflow-hidden bg-stone-100 border border-stone-200/90 shadow-sm relative group">
            <img
              src={product.images[selectedImage] || product.images[0]}
              alt={title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            {product.badge && (
              <span className="absolute top-5 left-5 px-3.5 py-1 bg-stone-950/90 backdrop-blur-md text-amber-300 text-xs font-bold rounded-xl shadow-xs border border-stone-800">
                {product.badge}
              </span>
            )}
          </div>

          {/* Thumbnail list */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === idx ? 'border-teal-900 shadow-xs scale-102' : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Actions (6 cols on large screens) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-teal-950 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                {product.category}
              </span>
              <span className="text-xs text-stone-400 font-mono">SKU: {selectedVariant?.sku || product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-stone-900 leading-snug tracking-tight">
              {title}
            </h1>

            {/* Rating and Origin Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center text-amber-500 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                ))}
                <span className="text-xs font-bold text-amber-950 ml-1.5">{product.rating}</span>
              </div>
              <span className="text-xs text-stone-400">({product.reviewsCount} verified reviews)</span>
              
              {product.attributes?.origin && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                  <MapPin className="w-3 h-3 text-teal-800" />
                  <span>{product.attributes.origin}</span>
                </span>
              )}
            </div>

            {/* Price Box */}
            <div className="flex items-baseline gap-4 py-4 border-y border-stone-100">
              <span className="text-3xl sm:text-4xl font-black text-stone-900 font-mono tracking-tight">
                ৳ {currentPrice.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-base text-stone-400 line-through font-mono">
                  ৳ {product.originalPrice.toLocaleString()}
                </span>
              )}
              <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 ml-auto">
                {product.stock > 0 ? `Ready Stock (${product.stock} units)` : 'Out of stock'}
              </span>
            </div>

            <p className="text-stone-600 text-sm leading-relaxed">
              {description}
            </p>

            {/* Variant Picker */}
            {product.variants && product.variants.length > 0 && (
              <div className="pt-2">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-2.5">
                  Select Variant / Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedVariantId === v.id
                          ? 'border-teal-900 bg-teal-900 text-white shadow-xs scale-102'
                          : 'border-stone-300 bg-stone-50 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {language === 'BN' && v.nameBn ? v.nameBn : v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Add to Cart */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-stone-300 rounded-2xl bg-stone-50 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 text-sm font-bold text-stone-900 min-w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl font-bold transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-teal-900 text-white rounded-2xl font-bold text-xs sm:text-sm hover:bg-teal-950 shadow-xs hover:shadow-sm active:scale-98 transition-all"
                >
                  <ShoppingBag className="w-4 h-4 text-teal-300" />
                  <span>{language === 'BN' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  className={`p-3.5 rounded-2xl border transition-all shadow-2xs ${
                    isWishlisted(product.id)
                      ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'border-stone-300 bg-white text-stone-600 hover:text-rose-600 hover:border-rose-300'
                  }`}
                  title={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted(product.id) ? 'fill-rose-600 stroke-rose-600' : ''}`} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 px-6 bg-stone-950 text-white rounded-2xl font-bold text-xs sm:text-sm hover:bg-stone-900 shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>{language === 'BN' ? 'সরাসরি অর্ডার করুন (Buy Now)' : 'Proceed to Instant Checkout'}</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Value Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-stone-100 text-center">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 shadow-2xs">
                <Truck className="w-4 h-4 mx-auto text-teal-900 mb-1" />
                <span className="text-[11px] font-bold text-stone-900 block">Dhaka 24-48h</span>
                <span className="text-[10px] text-stone-500">Nationwide 3-4 days</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 shadow-2xs">
                <RotateCcw className="w-4 h-4 mx-auto text-teal-900 mb-1" />
                <span className="text-[11px] font-bold text-stone-900 block">7 Days Return</span>
                <span className="text-[10px] text-stone-500">Hassle-free exchange</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 shadow-2xs">
                <ShieldCheck className="w-4 h-4 mx-auto text-teal-900 mb-1" />
                <span className="text-[11px] font-bold text-stone-900 block">Cash on Delivery</span>
                <span className="text-[10px] text-stone-500">Pay on doorstep</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Artisanal Provenance */}
      {product.attributes && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm mb-16">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-lg font-serif font-bold text-stone-900">
              Product Specifications & Heritage Provenance
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            {product.attributes.material && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                <span className="text-stone-400 block text-xs mb-1 font-semibold uppercase tracking-wider">Primary Material</span>
                <span className="font-bold text-stone-900">{product.attributes.material}</span>
              </div>
            )}
            {product.attributes.origin && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                <span className="text-stone-400 block text-xs mb-1 font-semibold uppercase tracking-wider">Artisan Origin</span>
                <span className="font-bold text-stone-900">{product.attributes.origin}</span>
              </div>
            )}
            {product.attributes.weight && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                <span className="text-stone-400 block text-xs mb-1 font-semibold uppercase tracking-wider">Net Weight / Dimension</span>
                <span className="font-bold text-stone-900">{product.attributes.weight}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              {language === 'BN' ? 'আরও খাঁটি হস্তশিল্প পণ্য' : 'Authentic Handcrafted Pairings'}
            </h3>
            <Link to="/shop" className="text-xs font-bold text-teal-900 hover:underline">
              {language === 'BN' ? 'সকল পণ্য দেখুন' : 'Explore All'} &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
