import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Truck, RotateCcw, Check, ShoppingBag, ArrowLeft, Heart } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold font-serif mb-4">Product Not Found</h2>
        <Link to="/shop" className="text-teal-900 font-semibold underline">
          Return to Shop
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
        <Link to="/" className="hover:text-stone-900">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-stone-900">Shop</Link>
        <span>/</span>
        <Link to={`/category/${product.categorySlug}`} className="hover:text-stone-900">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-medium truncate max-w-xs">{title}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 mb-16">
        
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-xs relative">
            <img
              src={product.images[selectedImage] || product.images[0]}
              alt={title}
              className="w-full h-full object-cover object-center"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-stone-900 text-white text-xs font-bold rounded-md shadow-xs">
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
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === idx ? 'border-teal-900 shadow-xs' : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-widest bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                {product.category}
              </span>
              <span className="text-xs text-stone-400 font-mono">SKU: {selectedVariant?.sku || product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-snug mb-3">
              {title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-stone-800">{product.rating}</span>
              <span className="text-xs text-stone-400">({product.reviewsCount} verified reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 py-3 border-y border-stone-200">
              <span className="text-3xl font-bold text-stone-900">
                ৳ {currentPrice.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-base text-stone-400 line-through">
                  ৳ {product.originalPrice.toLocaleString()}
                </span>
              )}
              <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                In Stock ({product.stock} units left)
              </span>
            </div>

            <p className="text-stone-600 text-sm leading-relaxed mt-4">
              {description}
            </p>

            {/* Variant Picker */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-6">
                <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-2">
                  Select Variant / Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        selectedVariantId === v.id
                          ? 'border-teal-900 bg-teal-900 text-white shadow-xs'
                          : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {language === 'BN' && v.nameBn ? v.nameBn : v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Add to Cart */}
            <div className="mt-6 pt-6 border-t border-stone-200 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-stone-600 hover:text-stone-900 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-bold text-stone-900 min-w-10 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-stone-600 hover:text-stone-900 font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-teal-900 text-white rounded-lg font-semibold text-sm hover:bg-teal-950 shadow-sm active:scale-98 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{language === 'BN' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  className={`p-3 rounded-lg border transition-all ${
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
                className="w-full py-3 px-6 bg-stone-900 text-white rounded-lg font-semibold text-sm hover:bg-black shadow-sm active:scale-98 transition-all"
              >
                {language === 'BN' ? 'সরাসরি অর্ডার করুন (Buy Now)' : 'Proceed to Instant Checkout'}
              </button>
            </div>

            {/* Value Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-stone-200 text-center">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/60">
                <Truck className="w-4 h-4 mx-auto text-teal-800 mb-1" />
                <span className="text-[11px] font-bold text-stone-800 block">Dhaka 24-48h</span>
                <span className="text-[10px] text-stone-500">Nationwide 3-4 days</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/60">
                <RotateCcw className="w-4 h-4 mx-auto text-teal-800 mb-1" />
                <span className="text-[11px] font-bold text-stone-800 block">7 Days Return</span>
                <span className="text-[10px] text-stone-500">Hassle-free exchange</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/60">
                <ShieldCheck className="w-4 h-4 mx-auto text-teal-800 mb-1" />
                <span className="text-[11px] font-bold text-stone-800 block">Cash on Delivery</span>
                <span className="text-[10px] text-stone-500">Pay on doorstep</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Artisanal Origin */}
      {product.attributes && (
        <div className="bg-stone-50 rounded-2xl p-6 sm:p-8 border border-stone-200 mb-16">
          <h3 className="text-lg font-serif font-bold text-stone-900 mb-4">
            Product Specifications & Provenance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            {product.attributes.material && (
              <div className="p-4 bg-white rounded-xl border border-stone-200">
                <span className="text-stone-400 block text-xs mb-1">Primary Material</span>
                <span className="font-semibold text-stone-900">{product.attributes.material}</span>
              </div>
            )}
            {product.attributes.origin && (
              <div className="p-4 bg-white rounded-xl border border-stone-200">
                <span className="text-stone-400 block text-xs mb-1">Artisan Origin</span>
                <span className="font-semibold text-stone-900">{product.attributes.origin}</span>
              </div>
            )}
            {product.attributes.weight && (
              <div className="p-4 bg-white rounded-xl border border-stone-200">
                <span className="text-stone-400 block text-xs mb-1">Net Weight / Dimension</span>
                <span className="font-semibold text-stone-900">{product.attributes.weight}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h3 className="text-xl font-serif font-bold text-stone-900 mb-6">
            You May Also Like
          </h3>
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
