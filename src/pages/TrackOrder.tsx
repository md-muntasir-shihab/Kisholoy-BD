import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, CheckCircle2, Clock, Truck, Package, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';
import { CustomerOrderTimeline } from '../components/customer/CustomerOrderTimeline';

export function TrackOrder() {
  const [searchParams] = useSearchParams();
  const { orders, language } = useApp();
  const [query, setQuery] = useState(searchParams.get('order') || '');
  const [searchedOrder, setSearchedOrder] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const initialOrder = searchParams.get('order');
    if (initialOrder) {
      setQuery(initialOrder);
      performSearch(initialOrder);
    }
  }, [searchParams, orders]);

  const performSearch = async (searchTerm: string) => {
    setHasSearched(true);
    const cleanTerm = searchTerm.trim();

    // 1. Try server tracking API
    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(cleanTerm)}&phone=${encodeURIComponent(cleanTerm)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          setSearchedOrder(data.order);
          return;
        }
      }
    } catch {
      // ignore network errors and fallback to local state
    }

    // 2. Local fallback
    const lower = cleanTerm.toLowerCase();
    const found = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === lower ||
        o.customer.phone.replace(/[^0-9]/g, '').includes(lower.replace(/[^0-9]/g, '')) ||
        o.courier.trackingId?.toLowerCase() === lower
    );
    setSearchedOrder(found || null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
    }
  };

  const steps: { status: OrderStatus; label: string; labelBn: string }[] = [
    { status: 'PENDING', label: 'Order Placed', labelBn: 'অর্ডার গ্রহণ' },
    { status: 'CONFIRMED', label: 'Confirmed', labelBn: 'নিশ্চিতকরণ' },
    { status: 'PROCESSING', label: 'Packed & Ready', labelBn: 'প্যাকেজিং' },
    { status: 'SHIPPED', label: 'In Transit', labelBn: 'কুরিয়ারে হস্তান্তর' },
    { status: 'DELIVERED', label: 'Delivered', labelBn: 'ডেলিভারি সম্পন্ন' }
  ];

  const getStepStatus = (stepStatus: OrderStatus, currentStatus: OrderStatus) => {
    const statusOrder: OrderStatus[] = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'READY_TO_SHIP',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED'
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (currentStatus === 'CANCELLED') return 'cancelled';
    if (currentIndex >= stepIndex) return 'completed';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-bold text-teal-900 uppercase tracking-widest block mb-1">
          {language === 'BN' ? 'রিয়েল-টাইম ট্র্যাকিং' : 'Live Shipment Tracking'}
        </span>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-3">
          {language === 'BN' ? 'আপনার অর্ডার ট্র্যাক করুন' : 'Track Your Package'}
        </h1>
        <p className="text-stone-500 text-xs sm:text-sm">
          Enter your <strong>Order Number (e.g. KSH-2026-0891)</strong> or registered <strong>Mobile Number</strong>.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-12 flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            required
            placeholder="e.g. KSH-2026-0891 or 01712345678"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 shadow-xs"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-teal-950 shadow-xs"
        >
          Track
        </button>
      </form>

      {/* Search Results */}
      {hasSearched && (
        searchedOrder ? (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-stone-200 gap-4">
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Tracking Order</span>
                <h2 className="text-xl font-bold text-stone-900 font-mono">{searchedOrder.orderNumber}</h2>
                <span className="text-xs text-stone-500">
                  Placed on {new Date(searchedOrder.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200">
                  Status: {searchedOrder.orderStatus}
                </span>
                {searchedOrder.courier.trackingId && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                    {searchedOrder.courier.provider}: {searchedOrder.courier.trackingId}
                  </span>
                )}
              </div>
            </div>

            {/* Automated Order Timeline */}
            <CustomerOrderTimeline order={searchedOrder} language={language} showFullDetailsInitially={true} />

            {/* Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-200 text-xs text-stone-700">
              <div>
                <span className="font-bold text-stone-900 block mb-1">Destination</span>
                <p>{searchedOrder.shippingAddress.address}, {searchedOrder.shippingAddress.thana}, {searchedOrder.shippingAddress.district}</p>
              </div>
              <div>
                <span className="font-bold text-stone-900 block mb-1">Recipient</span>
                <p>{searchedOrder.shippingAddress.firstName} {searchedOrder.shippingAddress.lastName} ({searchedOrder.shippingAddress.phone})</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-10 text-center max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-stone-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900 mb-1">No Order Found</h3>
            <p className="text-stone-500 text-xs mb-4">
              We couldn't locate any order with query "{query}". Please double-check your Order Number or Mobile Number.
            </p>
            <p className="text-xs text-teal-900 font-semibold">Try sample order: <strong>KSH-2026-0891</strong></p>
          </div>
        )
      )}
    </div>
  );
}
