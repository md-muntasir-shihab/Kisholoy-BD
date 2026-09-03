import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, Truck, ShieldCheck, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function CartPage() {
  const { cart, removeFromCart, updateCartQuantity, cartSubtotal, siteContent, language } = useApp();
  const [shippingRegion, setShippingRegion] = useState<'insideDhaka' | 'subDhaka' | 'outsideDhaka'>('insideDhaka');
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const navigate = useNavigate();

  const shippingFee = cartSubtotal >= siteContent.shippingFees.freeShippingThreshold 
    ? 0 
    : siteContent.shippingFees[shippingRegion];

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'KISHOLOY10' || couponCode.toUpperCase() === 'EID2026') {
      const discount = Math.round(cartSubtotal * 0.1);
      setDiscountAmount(discount);
      setCouponApplied(true);
    } else {
      alert('Invalid coupon code. Try "KISHOLOY10" for 10% discount.');
    }
  };

  const finalTotal = Math.max(0, cartSubtotal + shippingFee - discountAmount);
  const remainingForFreeShipping = Math.max(0, siteContent.shippingFees.freeShippingThreshold - cartSubtotal);

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">
          {language === 'BN' ? 'আপনার কার্ট খালি' : 'Your Shopping Cart is Empty'}
        </h2>
        <p className="text-stone-500 text-sm mb-6 max-w-sm mx-auto">
          {language === 'BN' 
            ? 'আমাদের ঐতিহ্যবাহী জামদানি শাড়ি, সুন্দরবনের মধু এবং হস্তশিল্প সংগ্রহ দেখতে শপে প্রবেশ করুন।' 
            : 'Explore our authentic Dhakai Jamdani, pure honey, and handcrafted decor.'}
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-900 text-white rounded-lg text-sm font-semibold hover:bg-teal-950 transition-all shadow-xs"
        >
          <span>{language === 'BN' ? 'পণ্য কেনাকাটা শুরু করুন' : 'Start Shopping'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-8">
        {language === 'BN' ? 'শপিং কার্ট' : 'Shopping Cart'} ({cart.length} {cart.length === 1 ? 'item' : 'items'})
      </h1>

      {/* Free Shipping Progress Alert */}
      {remainingForFreeShipping > 0 ? (
        <div className="mb-6 bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-teal-800 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-teal-950 font-medium">
              Add <span className="font-bold text-teal-900">৳ {remainingForFreeShipping.toLocaleString()}</span> more to qualify for <strong>FREE Delivery</strong> inside Dhaka!
            </span>
          </div>
          <Link to="/shop" className="text-xs font-bold text-teal-900 hover:underline flex-shrink-0">
            Add More Items &rarr;
          </Link>
        </div>
      ) : (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-900 text-xs sm:text-sm font-semibold">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <span>Congratulations! You qualify for <strong>FREE Delivery</strong> on this order.</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Cart Items Table */}
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-200 shadow-xs">
            {cart.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 line-clamp-1">
                      {language === 'BN' && item.titleBn ? item.titleBn : item.title}
                    </h3>
                    {item.variantName && (
                      <span className="text-xs text-stone-500 block mt-0.5">
                        Variant: {item.variantName}
                      </span>
                    )}
                    <span className="text-xs font-mono text-stone-400 block mt-0.5">
                      SKU: {item.sku}
                    </span>
                    <span className="text-sm font-bold text-stone-900 block mt-1">
                      ৳ {item.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-stone-600 hover:text-stone-900 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-stone-900 min-w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-stone-600 hover:text-stone-900 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-sm font-bold text-teal-950 min-w-20 text-right">
                    ৳ {(item.price * item.quantity).toLocaleString()}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-md hover:bg-stone-100 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link to="/shop" className="text-xs font-semibold text-teal-900 hover:underline">
              &larr; Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary & Calculations */}
        <div className="lg:w-96 flex-shrink-0">
          <div className="bg-stone-50 rounded-xl border border-stone-200 p-6 space-y-6 shadow-xs sticky top-24">
            <h2 className="text-lg font-serif font-bold text-stone-900">
              Order Summary
            </h2>

            {/* Delivery Destination Selector */}
            <div>
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
                Shipping Destination
              </label>
              <select
                value={shippingRegion}
                onChange={(e) => setShippingRegion(e.target.value as any)}
                className="w-full text-xs font-medium bg-white border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:outline-none focus:border-teal-800"
              >
                <option value="insideDhaka">Inside Dhaka City (৳80)</option>
                <option value="subDhaka">Dhaka Suburbs / Gazipur / Narayanganj (৳110)</option>
                <option value="outsideDhaka">Outside Dhaka / Nationwide (৳150)</option>
              </select>
            </div>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Coupon (e.g. KISHOLOY10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-stone-300 rounded-lg uppercase placeholder:normal-case focus:outline-none focus:border-teal-800"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800"
              >
                Apply
              </button>
            </form>

            {/* Price Calculations */}
            <div className="space-y-3 pt-4 border-t border-stone-200 text-xs sm:text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">৳ {cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-stone-900">
                  {shippingFee === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `৳ ${shippingFee}`}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount</span>
                  <span>- ৳ {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                <span className="font-bold text-stone-900 text-base">Total</span>
                <span className="font-bold text-xl text-teal-950">৳ {finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 px-4 bg-teal-900 text-white font-semibold rounded-lg text-sm hover:bg-teal-950 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>{language === 'BN' ? 'চেকআউটে যান' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-stone-500 text-center space-y-1">
              <p>✓ 100% Secure Checkout</p>
              <p>✓ Cash on Delivery (COD) supported</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
