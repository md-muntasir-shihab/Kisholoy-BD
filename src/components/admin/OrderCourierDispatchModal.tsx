import React, { useState, useEffect } from 'react';
import { 
  Truck, CheckCircle2, AlertCircle, RefreshCw, Send, 
  ExternalLink, Copy, Check, Printer, ShieldCheck, MapPin, 
  Phone, DollarSign, Package, FileText, X, ArrowRight, Sparkles
} from 'lucide-react';
import { Order, CustomCourierConfig } from '../../types';
import { useApp } from '../../context/AppContext';
import { useModalA11y } from '../../hooks/useModalA11y';

interface OrderCourierDispatchModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess?: (updatedOrder: Order) => void;
  onPrintLabel?: (order: Order) => void;
}

interface CourierConfigStatus {
  steadfast: {
    configured: boolean;
    apiKeySet: boolean;
    baseUrl: string;
    mode: string;
    providerName: string;
  };
  pathao: {
    configured: boolean;
    clientIdSet: boolean;
    baseUrl: string;
    mode: string;
    providerName: string;
  };
}

export function OrderCourierDispatchModal({
  isOpen,
  order,
  onClose,
  onSuccess,
  onPrintLabel
}: OrderCourierDispatchModalProps) {
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: isOpen,
    onClose,
    label: 'Order Courier Dispatch',
  });

  const { customCouriers, showToast, language, syncServerOrder } = useApp();
  const isBn = language === 'BN';

  const [courierConfigs, setCourierConfigs] = useState<CourierConfigStatus | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'Steadfast' | 'Pathao' | string>('Steadfast');
  const [deliveryType, setDeliveryType] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  
  // Editable dispatch fields
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [codAmount, setCodAmount] = useState<number>(0);
  const [weightKg, setWeightKg] = useState<number>(0.5);
  const [specialNote, setSpecialNote] = useState('');
  
  // Submission & Response states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastBookingResponse, setLastBookingResponse] = useState<any | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [configLoadFailed, setConfigLoadFailed] = useState(false);

  // Fetch courier API status from server
  useEffect(() => {
    fetch('/api/courier/config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setCourierConfigs(data.config);
        }
      })
      .catch(err => {
        // Without the config the modal silently offers stale provider options.
        console.warn('Could not fetch courier configs:', err);
        setConfigLoadFailed(true);
      });
  }, []);

  // Initialize fields when order changes
  useEffect(() => {
    if (order) {
      setRecipientName(order.customer.name || '');
      setRecipientPhone(order.customer.phone || '');
      
      const fullAddress = [
        order.shippingAddress.address,
        order.shippingAddress.thana,
        order.shippingAddress.district
      ].filter(Boolean).join(', ');
      setRecipientAddress(fullAddress);

      // Calculate initial COD balance
      const advancePaid = order.advancePayment?.isPaid 
        ? order.advancePayment.amount 
        : (order.advancePaymentAmount || 0);
      
      const balanceDue = order.balanceDueCod !== undefined 
        ? order.balanceDueCod 
        : (order.paymentMethod === 'COD' ? Math.max(0, order.total - advancePaid) : 0);
      
      setCodAmount(balanceDue);
      setSpecialNote(order.notes || `Order #${order.orderNumber} - KISHOLOY`);
      setLastBookingResponse(null);

      // Default smart provider selection based on district (e.g. Dhaka vs Outside)
      if (order.courier?.provider) {
        setSelectedProvider(order.courier.provider);
      } else if (order.shippingAddress.division?.toLowerCase() === 'dhaka') {
        setSelectedProvider('Pathao');
      } else {
        setSelectedProvider('Steadfast');
      }
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const isAlreadyDispatched = !!order.courier?.trackingId;

  // Handle Dispatch Execution
  const handleTriggerDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        orderId: order.id,
        courierProvider: selectedProvider,
        codAmount,
        weightKg,
        note: specialNote,
        deliveryType,
        recipientName,
        recipientPhone,
        recipientAddress
      };

      const response = await fetch('/api/courier/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLastBookingResponse(data.booking);
        showToast(
          isBn 
            ? `${selectedProvider} এ কুরিয়ার বুকিং সফল হয়েছে! ট্র্যাকিং: ${data.booking.trackingId}` 
            : `Delivery booked with ${selectedProvider}! Tracking: ${data.booking.trackingId}`
        );

        if (data.order) {
          syncServerOrder(data.order);
          if (onSuccess) onSuccess(data.order);
        }
      } else {
        showToast(data.error || 'Failed to trigger courier booking', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error communicating with courier service', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTracking = (trackingCode: string) => {
    navigator.clipboard.writeText(trackingCode);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
    showToast('Tracking ID copied to clipboard');
  };

  return (
    <div ref={containerRef} {...dialogProps} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800/80 border border-teal-600/50 flex items-center justify-center text-teal-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-serif text-white">
                  {isBn ? 'কুরিয়ার ডেলিভারি ডিসপ্যাচ ও বুকিং' : 'Courier Dispatch & Consignment Booking'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-stone-300">
                {isBn ? 'Steadfast ও Pathao এপিআই দিয়ে সরাসরি পার্সেল বুকিং করুন' : 'Trigger delivery requests via Steadfast & Pathao APIs directly'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-800 text-xs flex-1">
          
          {/* Active Booking Banner if already booked */}
          {(isAlreadyDispatched || lastBookingResponse) && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    {lastBookingResponse?.isSandboxOrSimulated 
                      ? 'Consignment Created (Sandbox / Test Mode)'
                      : 'Active Courier Consignment Registered'}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  {lastBookingResponse?.status || order.courier?.status || 'READY_TO_SHIP'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold block">Courier Partner</span>
                  <span className="font-bold text-stone-900 text-xs">
                    {lastBookingResponse?.provider || order.courier?.provider}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold block">Tracking Number</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-teal-950 text-xs">
                      {lastBookingResponse?.trackingId || order.courier?.trackingId}
                    </span>
                    <button
                      onClick={() => handleCopyTracking(lastBookingResponse?.trackingId || order.courier?.trackingId || '')}
                      className="text-teal-800 hover:text-teal-950 p-1"
                      title="Copy Tracking ID"
                    >
                      {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Booked Order */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(lastBookingResponse?.trackingUrl || order.courier?.provider) && (
                  <a
                    href={
                      lastBookingResponse?.trackingUrl || 
                      (order.courier?.provider?.toLowerCase().includes('steadfast') 
                        ? `https://steadfast.com.bd/t/${order.courier?.trackingId}` 
                        : `https://pathao.com/courier-tracking/?consignment_id=${order.courier?.consignmentId || order.courier?.trackingId}`)
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Track on {lastBookingResponse?.provider || order.courier?.provider} Portal</span>
                  </a>
                )}
                
                {onPrintLabel && (
                  <button
                    onClick={() => {
                      onPrintLabel(order);
                    }}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-300" />
                    <span>Print Shipping Label</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleTriggerDispatch} className="space-y-4">
            
            {/* Courier Selection Cards */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                {isBn ? 'কুরিয়ার পার্টনার নির্বাচন করুন' : 'Select Courier Partner'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Steadfast Option */}
                <div
                  onClick={() => setSelectedProvider('Steadfast')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedProvider === 'Steadfast'
                      ? 'border-teal-800 bg-teal-50/50 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-teal-800" />
                        <span>Steadfast Courier</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">Nationwide coverage with fast COD settlement</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedProvider === 'Steadfast' ? 'border-teal-800 bg-teal-800' : 'border-stone-300'
                    }`}>
                      {selectedProvider === 'Steadfast' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between text-[10px]">
                    <span className="text-stone-500">API Status:</span>
                    <span className={`font-semibold px-1.5 py-0.2 rounded ${
                      configLoadFailed
                        ? 'bg-stone-200 text-stone-700'
                        : courierConfigs?.steadfast.configured 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {configLoadFailed
                        ? 'Status unknown'
                        : courierConfigs?.steadfast.configured ? 'Live API Ready' : 'Sandbox (Simulated)'}
                    </span>
                  </div>
                </div>

                {/* Pathao Option */}
                <div
                  onClick={() => setSelectedProvider('Pathao')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedProvider === 'Pathao'
                      ? 'border-teal-800 bg-teal-50/50 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-rose-600" />
                        <span>Pathao Courier</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">Fast Dhaka & divisional express delivery</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedProvider === 'Pathao' ? 'border-teal-800 bg-teal-800' : 'border-stone-300'
                    }`}>
                      {selectedProvider === 'Pathao' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between text-[10px]">
                    <span className="text-stone-500">API Status:</span>
                    <span className={`font-semibold px-1.5 py-0.2 rounded ${
                      configLoadFailed
                        ? 'bg-stone-200 text-stone-700'
                        : courierConfigs?.pathao.configured 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {configLoadFailed
                        ? 'Status unknown'
                        : courierConfigs?.pathao.configured ? 'Live API Ready' : 'Sandbox (Simulated)'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Recipient Details (Editable for address updates) */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                <MapPin className="w-4 h-4 text-teal-800" />
                <span>Recipient & Shipping Information</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Customer / Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  required
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
                />
              </div>
            </div>

            {/* Parcel Details, COD & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* COD Collection Amount */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-[11px] font-bold text-stone-800 mb-1 flex items-center justify-between">
                  <span>COD Collection (৳)</span>
                  {order.paymentMethod === 'SSLCOMMERZ' && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 rounded">Paid Online</span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-stone-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    value={codAmount}
                    onChange={(e) => setCodAmount(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 font-bold font-mono text-stone-900"
                  />
                </div>
                <span className="text-[10px] text-stone-500 block mt-1">
                  Order Total: ৳{order.total.toLocaleString()}
                </span>
              </div>

              {/* Weight */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-[11px] font-bold text-stone-800 mb-1">
                  Estimated Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 font-mono text-stone-900"
                />
                <span className="text-[10px] text-stone-500 block mt-1">
                  Items count: {order.items.reduce((s, i) => s + i.quantity, 0)} pcs
                </span>
              </div>

              {/* Delivery Speed / Type */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-[11px] font-bold text-stone-800 mb-1">
                  Delivery Speed
                </label>
                <select
                  value={deliveryType}
                  onChange={(e: any) => setDeliveryType(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 text-stone-900"
                >
                  <option value="STANDARD">Standard (24-48 hrs)</option>
                  <option value="EXPRESS">Express (Same/Next Day)</option>
                </select>
                <span className="text-[10px] text-stone-500 block mt-1">
                  Priority level for carrier
                </span>
              </div>

            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Special Delivery Notes / Instructions
              </label>
              <input
                type="text"
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="e.g. Fragile organic glass bottle, call before arrival"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
              />
            </div>

            {/* Submit Bar */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-colors"
              >
                {isBn ? 'বাতিল' : 'Close'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-teal-900 hover:bg-teal-950 text-white rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-300" />
                    <span>{isBn ? 'কুরিয়ার বুকিং হচ্ছে...' : 'Booking Delivery Request...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-teal-300" />
                    <span>
                      {isBn 
                        ? `${selectedProvider} দিয়ে বুকিং নিশ্চিত করুন` 
                        : `Dispatch via ${selectedProvider} API`}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
