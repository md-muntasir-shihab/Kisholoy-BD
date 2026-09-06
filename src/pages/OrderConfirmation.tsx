import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Truck, Phone, Calendar, ArrowRight, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const { orders, language } = useApp();

  const order = orders.find((o) => o.id === id || o.orderNumber === id);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold font-serif mb-4">Order Details Not Found</h2>
        <p className="text-stone-500 text-sm mb-6">Could not retrieve details for ID: {id}</p>
        <Link to="/" className="text-teal-900 font-semibold underline">
          Return to Home
        </Link>
      </div>
    );
  }

  const isCancelled = order.orderStatus === 'CANCELLED';
  const needsPhoneVerify = order.fraudRisk?.recommendation === 'REQUIRE_PHONE_VERIFICATION';
  const needsAdvanceFee = order.fraudRisk?.recommendation === 'REQUIRE_ADVANCE_SHIPPING_FEE';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Status Badge Banner */}
      {isCancelled ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 text-center mb-8 shadow-xs">
          <div className="w-16 h-16 bg-rose-100 text-rose-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">✕</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-rose-800 block mb-1">
            {language === 'BN' ? 'অর্ডার প্রক্রিয়া বাতিল করা হয়েছে' : 'Order Flagged / Cancelled'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-2">
            Order Status Notice
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto">
            Order <strong>{order.orderNumber}</strong> could not be validated automatically. Please contact our support team at +880 1700-000000 if you believe this is an error.
          </p>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 text-center mb-8 shadow-xs">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 block mb-1">
            {language === 'BN' ? 'অর্ডার সফল হয়েছে' : 'Order Placed Successfully'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-2">
            Thank you, {order.customer.name}!
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto">
            We have received your order <strong>{order.orderNumber}</strong>. Our team will verify and dispatch your package shortly.
          </p>
        </div>
      )}

      {/* Verification Notice Banners */}
      {!isCancelled && needsPhoneVerify && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-xs text-amber-900">
          <Phone className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Verification Call Scheduled</strong>
            Our customer relations team will place a brief confirmation call to your phone number (<strong>{order.customer.phone}</strong>) before dispatching your package with Steadfast Courier.
          </div>
        </div>
      )}

      {!isCancelled && needsAdvanceFee && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-xs text-blue-900">
          <Package className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Advance Courier Charge Notice</strong>
            For out-of-Dhaka Cash on Delivery orders exceeding ৳5,000, our support officer will contact you to confirm delivery and provide bKash details for the standard ৳150 advance courier fee.
          </div>
        </div>
      )}

      {/* Order Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Order Number</span>
          <span className="text-base font-bold text-stone-900 font-mono block">{order.orderNumber}</span>
          <span className="text-xs text-stone-500">{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Payment Method</span>
          <span className="text-base font-bold text-teal-900 block">{order.paymentMethod}</span>
          <span className="text-xs text-stone-500">Status: {order.paymentStatus}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Estimated Delivery</span>
          <span className="text-base font-bold text-stone-900 block">24 - 72 Hours</span>
          <span className="text-xs text-stone-500">Steadfast / Pathao Courier</span>
        </div>
      </div>

      {/* Main Order Details Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden mb-8">
        <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50/50">
          <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-900" />
            Items Ordered ({order.items.length})
          </h2>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 bg-white"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </button>
        </div>

        {/* Item List */}
        <div className="divide-y divide-stone-200 p-6">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={item.image} alt={item.title} className="w-14 h-14 rounded-lg object-cover border border-stone-200 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-stone-900">{item.title}</h4>
                  <span className="text-xs text-stone-500">
                    Qty: {item.quantity} {item.variantName ? `| ${item.variantName}` : ''} | SKU: {item.sku}
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold text-stone-900">
                ৳ {(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="bg-stone-50 p-6 border-t border-stone-200 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span className="font-semibold text-stone-900">৳ {order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Shipping Charge</span>
            <span className="font-semibold text-stone-900">৳ {order.shippingFee.toLocaleString()}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Discount</span>
              <span>- ৳ {order.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
            <span className="font-bold text-stone-900 text-base">Total Amount</span>
            <span className="font-bold text-xl text-teal-950">৳ {order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address Summary */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs mb-8">
        <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">
          Shipping Destination
        </h3>
        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
          <strong>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</strong><br />
          {order.shippingAddress.address}<br />
          {order.shippingAddress.thana}, {order.shippingAddress.district} - {order.shippingAddress.postalCode || ''}, {order.shippingAddress.division}<br />
          Phone: {order.shippingAddress.phone}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center no-print">
        <Link
          to={`/track-order?order=${order.orderNumber}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-900 text-white rounded-lg text-sm font-semibold hover:bg-teal-950 shadow-xs"
        >
          <Truck className="w-4 h-4" />
          <span>Track Order Status</span>
        </Link>
        <Link
          to="/shop"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-100 text-stone-800 rounded-lg text-sm font-semibold hover:bg-stone-200"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
