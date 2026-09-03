import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, Truck, ShieldCheck, Tag, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function CartPage() {
  const { cart, removeFromCart, updateCartQuantity, cartSubtotal, siteContent, language } = useApp();
  const [shippingRegion, setShippingRegion] = useState<'insideDhaka' | 'subDhaka' | 'outsideDhaka'>('insideDhaka');
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const navigate = useNavigate();

  const isBn = language === 'BN';

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
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-stone-400 border border-stone-200">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 mb-3 tracking-tight">
          {isBn ? 'আপনার শপিং ব্যাগটি খালি' : 'Your Shopping Bag is Empty'}
        </h2>
        <p className="text-stone-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
          {isBn 
            ? 'আমাদের ঐতিহ্যবাহী জামদানি শাড়ি, সুন্দরবনের মধু এবং হস্তশিল্প সংগ্রহ দেখতে ক্যাটালগে প্রবেশ করুন।' 
            : 'Explore our authentic Dhakai Jamdani, pure Sundarbans honey, and handcrafted heritage decor.'}
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-900 text-white rounded-2xl text-xs sm:text-sm font-bold hover:bg-teal-950 transition-all shadow-xs hover:shadow-sm"
        >
          <span>{isBn ? 'পণ্য কেনাকাটা শুরু করুন' : 'Explore Artisanal Catalog'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isBn ? 'অর্ডার রিভিউ' : 'Order Review'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-stone-900 tracking-tight">
            {isBn ? 'শপিং কার্ট' : 'Shopping Cart'} ({cart.length} {cart.length === 1 ? 'item' : 'items'})
          </h1>
        </div>
        <Link to="/shop" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-teal-900 hover:text-teal-950 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isBn ? 'শপে ফিরে যান' : 'Continue Shopping'}</span>
        </Link>
      </div>

      {/* Free Shipping Progress Alert */}
      {remainingForFreeShipping > 0 ? (
        <div className="mb-8 bg-teal-50/90 border border-teal-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center shrink-0 border border-teal-200">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm text-teal-950 font-medium">
              Add <span className="font-bold text-teal-900">৳ {remainingForFreeShipping.toLocaleString()}</span> more to qualify for <strong>FREE Delivery</strong> inside Dhaka!
            </span>
          </div>
          <Link to="/shop" className="text-xs font-bold text-teal-900 hover:underline shrink-0 bg-white px-3.5 py-1.5 rounded-xl border border-teal-200 shadow-2xs">
            Add More Items &rarr;
          </Link>
        </div>
      ) : (
        <div className="mb-8 bg-emerald-50/90 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3.5 text-emerald-900 text-xs sm:text-sm font-semibold shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0 border border-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <span>Congratulations! You qualify for <strong>FREE Delivery</strong> anywhere in Dhaka!</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        {/* Cart Items Table */}
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200/90 divide-y divide-stone-100 shadow-sm overflow-hidden">
            {cart.map((item) => (
              <div key={item.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:bg-stone-50/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 shadow-2xs">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900 line-clamp-1">
                      {isBn && item.titleBn ? item.titleBn : item.title}
                    </h3>
                    {item.variantName && (
                      <span className="text-xs text-stone-500 font-medium block mt-0.5">
                        Variant: {item.variantName}
                      </span>
                    )}
                    <span className="text-xs font-mono text-stone-400 block mt-0.5">
                      SKU: {item.sku}
                    </span>
                    <span className="text-sm font-black text-stone-900 block mt-1.5 font-mono">
                      ৳ {item.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-stone-300 rounded-2xl bg-stone-50 p-1">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-xl font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-stone-900 min-w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-xl font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-base font-black text-stone-900 min-w-24 text-right font-mono">
                    ৳ {(item.price * item.quantity).toLocaleString()}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link to="/shop" className="text-xs font-bold text-teal-900 hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isBn ? 'শপে আরও পণ্য খুঁজুন' : 'Explore more handcrafted items'}</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="lg:w-96 shrink-0">
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-7 space-y-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-serif font-black text-stone-900">
              {isBn ? 'অর্ডারের বিবরণী' : 'Order Summary'}
            </h2>

            {/* Delivery Destination Selector */}
            <div>
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                {isBn ? 'ডেলিভারি এলাকা' : 'Delivery Destination'}
              </label>
              <select
                value={shippingRegion}
                onChange={(e) => setShippingRegion(e.target.value as any)}
                className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 cursor-pointer shadow-2xs"
              >
                <option value="insideDhaka">Inside Dhaka City (৳80)</option>
                <option value="subDhaka">Dhaka Suburbs / Gazipur / Narayanganj (৳110)</option>
                <option value="outsideDhaka">Outside Dhaka / Nationwide (৳150)</option>
              </select>
            </div>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Coupon (e.g. KISHOLOY10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl uppercase placeholder:normal-case font-bold focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
              >
                {isBn ? 'প্রয়োগ' : 'Apply'}
              </button>
            </form>

            {/* Price Calculations */}
            <div className="space-y-3 pt-4 border-t border-stone-100 text-xs sm:text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-bold text-stone-900 font-mono">৳ {cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Estimated Shipping</span>
                <span className="font-bold text-stone-900 font-mono">
                  {shippingFee === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `৳ ${shippingFee}`}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount</span>
                  <span className="font-mono">- ৳ {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                <span className="font-black text-stone-900 text-base font-serif">Total Payable</span>
                <span className="font-black text-2xl text-stone-900 font-mono">৳ {finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 px-5 bg-teal-900 text-white font-bold rounded-2xl text-sm hover:bg-teal-950 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-sm"
            >
              <span>{isBn ? 'চেকআউটে যান' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4 text-teal-300" />
            </button>

            <div className="text-[11px] text-stone-500 text-center space-y-1 pt-2 border-t border-stone-100">
              <p className="flex items-center justify-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Authentic Heritage Guarantee
              </p>
              <p className="flex items-center justify-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cash on Delivery (COD) Available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
