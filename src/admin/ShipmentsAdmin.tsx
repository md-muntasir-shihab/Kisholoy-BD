import React, { useState } from 'react';
import { 
  Truck, Package, Printer, CheckCircle2, ArrowRight, ExternalLink, 
  QrCode, Send, Plus, Edit2, Trash2, Check, X, Sliders, ShieldCheck, 
  Search, Phone, DollarSign, Globe, Settings2, AlertCircle, Info, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PrintOrderDocumentsModal } from '../components/print/PrintOrderDocumentsModal';
import { Order, CustomCourierConfig } from '../types';
import { AdminModalShell } from '../components/admin/AdminModalShell';
import { usePendingAction } from '../hooks/usePendingAction';

export function ShipmentsAdmin() {
  const { 
    orders, 
    dispatchCourier, 
    showToast, 
    language,
    siteContent,
    customCouriers,
    addCustomCourier,
    updateCustomCourier,
    deleteCustomCourier,
    toggleCustomCourier
  } = useApp();

  const isBn = language === 'BN';

  // State for active view and filtering
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'dispatched' | 'couriers'>('pending');
  // F-306: blocks duplicate submits while a mutation is in flight.
  const { run, isPending, isBusy } = usePendingAction();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourierFilter, setSelectedCourierFilter] = useState('ALL');

  // Dispatch state
  const [dispatchModalOrder, setDispatchModalOrder] = useState<Order | null>(null);
  const [dispatchSelectedCourier, setDispatchSelectedCourier] = useState<string>(customCouriers[0]?.name || 'Steadfast Courier');
  const [dispatchCustomTracking, setDispatchCustomTracking] = useState('');
  const [isDispatching, setIsDispatching] = useState<string | null>(null);

  // Label Modal
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);

  // Custom Courier Modal (Add / Edit)
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [editingCourierId, setEditingCourierId] = useState<string | null>(null);
  const [courierFormData, setCourierFormData] = useState<Omit<CustomCourierConfig, 'id'>>({
    name: '',
    code: '',
    phone: '',
    trackingUrlTemplate: 'https://example.com/track/{trackingId}',
    defaultInsideDhakaFee: 60,
    defaultOutsideDhakaFee: 130,
    codPercentageFee: 1.0,
    isActive: true,
    isBuiltIn: false,
    notes: ''
  });

  // Webhook Simulator state
  const [webhookConsignmentId, setWebhookConsignmentId] = useState('');
  const [webhookStatus, setWebhookStatus] = useState('in_transit');
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  const shippedOrders = orders.filter((o) => o.courier?.trackingId);
  const pendingShipmentOrders = orders.filter((o) => 
    o.orderStatus === 'PROCESSING' || 
    o.orderStatus === 'CONFIRMED' || 
    (o.paymentStatus === 'PAID' && !o.courier?.trackingId)
  );

  // Filtered dispatched orders
  const filteredDispatched = shippedOrders.filter(o => {
    if (selectedCourierFilter !== 'ALL' && o.courier.provider !== selectedCourierFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        (o.courier.trackingId && o.courier.trackingId.toLowerCase().includes(q)) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.shippingAddress.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Open Add Courier modal
  const handleOpenAddCourier = () => {
    setEditingCourierId(null);
    setCourierFormData({
      name: '',
      code: '',
      phone: '',
      trackingUrlTemplate: 'https://example.com/track/{trackingId}',
      defaultInsideDhakaFee: 60,
      defaultOutsideDhakaFee: 130,
      codPercentageFee: 1.0,
      isActive: true,
      isBuiltIn: false,
      notes: ''
    });
    setIsCourierModalOpen(true);
  };

  // Open Edit Courier modal
  const handleOpenEditCourier = (c: CustomCourierConfig) => {
    setEditingCourierId(c.id);
    setCourierFormData({
      name: c.name,
      code: c.code,
      phone: c.phone,
      trackingUrlTemplate: c.trackingUrlTemplate,
      defaultInsideDhakaFee: c.defaultInsideDhakaFee,
      defaultOutsideDhakaFee: c.defaultOutsideDhakaFee,
      codPercentageFee: c.codPercentageFee,
      isActive: c.isActive,
      isBuiltIn: c.isBuiltIn,
      apiEndpoint: c.apiEndpoint || '',
      apiKey: c.apiKey || '',
      notes: c.notes || ''
    });
    setIsCourierModalOpen(true);
  };

  // Save Courier
  const handleSaveCourier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierFormData.name.trim()) {
      showToast(isBn ? 'কুরিয়ারের নাম আবশ্যক' : 'Courier partner name is required', 'info');
      return;
    }

    const code = courierFormData.code.trim() 
      ? courierFormData.code.trim().toLowerCase().replace(/\s+/g, '_')
      : courierFormData.name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);

    if (editingCourierId) {
      updateCustomCourier(editingCourierId, {
        ...courierFormData,
        code
      });
    } else {
      addCustomCourier({
        ...courierFormData,
        code
      });
    }

    setIsCourierModalOpen(false);
  };

  // Open Order Dispatch Modal
  const handleOpenDispatchModal = (order: Order) => {
    setDispatchModalOrder(order);
    setDispatchSelectedCourier(customCouriers.find(c => c.isActive)?.name || 'Steadfast Courier');
    setDispatchCustomTracking('');
  };

  // Execute Consignment Booking
    const handleExecuteDispatch = async (e: React.FormEvent) => {
    // Must fire synchronously. Inside run() it would land in a microtask and
    // the browser would submit the form and reload the page first.
    e.preventDefault();
    return run('handleExecuteDispatch', async () => {
    if (!dispatchModalOrder) return;

    setIsDispatching(dispatchModalOrder.id);
    try {
      // Try API integration if built-in
      const isBuiltIn = dispatchSelectedCourier.toLowerCase().includes('steadfast') || dispatchSelectedCourier.toLowerCase().includes('pathao');
      let bookingFailed: string | null = null;
      if (isBuiltIn) {
        try {
          const res = await fetch('/api/courier/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              orderId: dispatchModalOrder.id, 
              courierProvider: dispatchSelectedCourier 
            })
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || (data && !data.success)) {
            bookingFailed = data?.error || `Courier API returned ${res.status}.`;
          }
        } catch (err: any) {
          bookingFailed = err?.message || 'Courier API unreachable.';
        }
      }

      dispatchCourier(dispatchModalOrder.id, dispatchSelectedCourier, dispatchCustomTracking);
      setDispatchModalOrder(null);

      // The consignment was NOT booked with the carrier. Recording it locally
      // is the intended fallback, but staying silent let an operator believe
      // the parcel was booked when no carrier ever received it (F-305).
      if (bookingFailed) {
        showToast(
          language === 'BN'
            ? `কুরিয়ার বুকিং ব্যর্থ (${bookingFailed}) — ডিসপ্যাচ শুধু লোকালি রেকর্ড হয়েছে। কনসাইনমেন্ট হাতে নিশ্চিত করুন।`
            : `Courier booking failed (${bookingFailed}) — dispatch recorded locally only. Confirm the consignment manually.`,
          'info'
        );
      }
    } finally {
      setIsDispatching(null);
    }
    });
  };

  // Webhook simulator
  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookConsignmentId) return;
    setIsSendingWebhook(true);

    try {
      const res = await fetch('/api/courier/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consignment_id: webhookConsignmentId,
          tracking_id: webhookConsignmentId,
          status: webhookStatus,
          note: `Simulated webhook event: ${webhookStatus}`
        })
      });
      const data = await res.json().catch(() => null);
      if (data?.updated) {
        showToast(data.message);
      } else {
        showToast(data?.message || 'Webhook processed', 'info');
      }
    } catch (e) {
      showToast('Simulation registered locally', 'info');
    } finally {
      setIsSendingWebhook(false);
    }
  };

  return (
    <div id="shipments-admin-container" className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-900 border border-teal-200">
              {isBn ? 'লজিস্টিকস ও কুরিয়ার কন্ট্রোল সেন্টার' : 'LOGISTICS & COURIER DISPATCH'}
            </span>
            <span className="text-xs text-stone-500 font-mono">
              {customCouriers.filter(c => c.isActive).length} {isBn ? 'সক্রিয় কুরিয়ার পার্টনার' : 'Active Partners'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-teal-900" />
            <span>{isBn ? 'শিপমেন্ট ও কুরিয়ার ব্যবস্থাপনা' : 'Shipments & Custom Couriers'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
            {isBn 
              ? 'স্টেডফাস্ট, পাঠাও ছাড়াও সুন্দরবন, রেডএক্স বা যেকোনো স্থানীয় কুরিয়ার সহজে যোগ করুন এবং বারকোড শিপিং লেবেল সহ সরাসরি বুকিং করুন।'
              : 'Add and visually configure any courier partner in Bangladesh, dispatch parcels, manage real-time tracking, and print A6 shipping labels.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddCourier}
            className="px-4 py-2.5 bg-teal-900 text-white rounded-xl text-xs font-semibold hover:bg-teal-950 shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? '+ নতুন কুরিয়ার যোগ করুন' : '+ Add Custom Courier'}</span>
          </button>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'pending'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{isBn ? `প্রেরণ অপেক্ষমান (${pendingShipmentOrders.length})` : `Ready to Dispatch (${pendingShipmentOrders.length})`}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('dispatched')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'dispatched'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{isBn ? `সক্রিয় শিপমেন্ট (${shippedOrders.length})` : `Active Consignments (${shippedOrders.length})`}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('couriers')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'couriers'
                ? 'bg-teal-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{isBn ? `কুরিয়ার পার্টনার লিস্ট (${customCouriers.length})` : `Courier Partners (${customCouriers.length})`}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: COURIER PARTNERS LIST (VISUAL CONFIGURATION) */}
      {activeSubTab === 'couriers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-900" />
              <span>{isBn ? 'কাস্টম কুরিয়ার পার্টনার কনফিগারেশন' : 'Registered Courier Partners'}</span>
            </h2>
            <button
              onClick={handleOpenAddCourier}
              className="px-3 py-1.5 bg-teal-900 text-white rounded-lg text-xs font-bold hover:bg-teal-950 flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isBn ? 'নতুন কুরিয়ার যোগ' : 'Add Courier Partner'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customCouriers.map((c) => (
              <div 
                key={c.id} 
                className={`bg-white rounded-2xl border p-5 transition-all shadow-xs space-y-4 ${
                  c.isActive ? 'border-stone-200' : 'border-stone-200/60 opacity-70 bg-stone-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-xl ${
                      c.isActive ? 'bg-teal-50 text-teal-900' : 'bg-stone-100 text-stone-400'
                    }`}>
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900 text-sm">{c.name}</h3>
                        {c.isBuiltIn && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                            Built-in
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 font-mono block">Code: {c.code}</span>
                    </div>
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => toggleCustomCourier(c.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      c.isActive ? 'bg-teal-900' : 'bg-stone-300'
                    }`}
                  >
                    <span 
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        c.isActive ? 'translate-x-4' : 'translate-x-0'
                      }`} 
                    />
                  </button>
                </div>

                <p className="text-xs text-stone-600 line-clamp-2 min-h-[32px]">
                  {c.notes || 'Reliable courier service provider for ecommerce parcels across Bangladesh.'}
                </p>

                <div className="grid grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Inside</span>
                    <span className="font-mono font-bold text-stone-900">৳{c.defaultInsideDhakaFee}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Outside</span>
                    <span className="font-mono font-bold text-stone-900">৳{c.defaultOutsideDhakaFee}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">COD Fee</span>
                    <span className="font-mono font-bold text-stone-900">{c.codPercentageFee}%</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-stone-500">
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="font-mono text-[10px] text-stone-600 truncate" title={c.trackingUrlTemplate}>
                      {c.trackingUrlTemplate}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                    c.isActive ? 'text-teal-900' : 'text-stone-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-teal-600' : 'bg-stone-300'}`} />
                    {c.isActive ? 'Available at Checkout' : 'Disabled'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditCourier(c)}
                      className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Edit Courier Settings"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!c.isBuiltIn && (
                      <button
                        onClick={() => deleteCustomCourier(c.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Courier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2 & 3: ORDERS DISPATCH & TRACKING */}
      {activeSubTab !== 'couriers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* SUBTAB: READY TO DISPATCH */}
            {activeSubTab === 'pending' && (
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-900" />
                    <span>{isBn ? 'কুরিয়ারে প্রেরণের জন্য প্রস্তুত অর্ডার' : 'Ready for Consignment Dispatch'} ({pendingShipmentOrders.length})</span>
                  </h2>
                </div>

                {pendingShipmentOrders.length === 0 ? (
                  <div className="py-8 text-center text-stone-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="font-semibold text-stone-800">{isBn ? 'সব কনফার্মড অর্ডার কুরিয়ারে প্রেরণ সম্পন্ন হয়েছে!' : 'All confirmed orders have been dispatched!'}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{isBn ? 'নতুন অর্ডার আসলে এখানে প্রদর্শন করা হবে।' : 'New confirmed orders will appear here for one-click consignment booking.'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-200">
                    {pendingShipmentOrders.map((order) => (
                      <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-stone-50 transition-colors p-3 rounded-xl border border-stone-100 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-stone-900 text-sm">{order.orderNumber}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-900 border border-teal-200">
                              {order.orderStatus}
                            </span>
                          </div>
                          <span className="text-stone-600 block mt-1">
                            {order.customer.name} • <strong>{order.customer.phone}</strong> • {order.shippingAddress.district}
                          </span>
                          <span className="text-[11px] text-stone-500 mt-0.5 block">
                            Total Due: <strong>৳ {order.total.toLocaleString()}</strong> ({order.paymentMethod}) • {order.items.length} items
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleOpenDispatchModal(order)}
                            className="px-4 py-2 bg-teal-900 text-white rounded-xl font-bold hover:bg-teal-950 flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{isBn ? 'কুরিয়ার বুক করুন' : 'Dispatch Parcel'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB: ACTIVE CONSIGNMENTS TABLE */}
            {activeSubTab === 'dispatched' && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden space-y-4 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-teal-900" />
                    <span>{isBn ? 'সক্রিয় কুরিয়ার কনসাইনমেন্ট ও ট্র্যাকিং' : 'Active Consignments & Tracking'} ({filteredDispatched.length})</span>
                  </h2>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCourierFilter}
                      onChange={(e) => setSelectedCourierFilter(e.target.value)}
                      className="text-xs p-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                    >
                      <option value="ALL">All Couriers</option>
                      {customCouriers.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search tracking or order..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs pl-8 pr-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="p-3.5">Order #</th>
                        <th className="p-3.5">Courier Partner</th>
                        <th className="p-3.5">Tracking Code</th>
                        <th className="p-3.5">Destination</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Label</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {filteredDispatched.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-stone-500">
                            No consignments found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredDispatched.map((order) => {
                          const courierObj = customCouriers.find(c => c.name.toLowerCase() === order.courier.provider?.toLowerCase());
                          const trackUrl = courierObj?.trackingUrlTemplate && order.courier.trackingId
                            ? courierObj.trackingUrlTemplate.replace('{trackingId}', order.courier.trackingId)
                            : `https://steadfast.com.bd/t/${order.courier.trackingId}`;

                          return (
                            <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                              <td className="p-3.5 font-mono font-bold text-stone-900">
                                {order.orderNumber}
                                <span className="block text-[10px] text-stone-400 font-sans">{order.customer.name}</span>
                              </td>
                              <td className="p-3.5 font-semibold text-stone-800">
                                <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-medium">
                                  {order.courier.provider}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono font-bold text-teal-900">
                                <a 
                                  href={trackUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:underline flex items-center gap-1 text-teal-900"
                                  title="Test live courier tracking portal"
                                >
                                  <span>{order.courier.trackingId}</span>
                                  <ExternalLink className="w-3 h-3 text-stone-400 hover:text-teal-900" />
                                </a>
                              </td>
                              <td className="p-3.5 text-stone-600">
                                {order.shippingAddress.district}
                              </td>
                              <td className="p-3.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-900 border border-teal-200">
                                  {order.courier.status || order.orderStatus}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => setLabelOrder(order)}
                                  className="px-2.5 py-1.5 bg-white border border-stone-300 hover:border-stone-400 hover:bg-stone-50 rounded-lg font-semibold text-stone-700 flex items-center gap-1.5 inline-flex shadow-xs transition-colors"
                                >
                                  <Printer className="w-3.5 h-3.5 text-teal-900" />
                                  <span>Label</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Webhook Simulator & Fast Action */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-800" />
                <span>Courier Webhook Simulator</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-1 mb-4">
                Simulate real-time status callbacks from Steadfast, Pathao, RedX or custom courier webhooks.
              </p>

              <form onSubmit={handleSimulateWebhook} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Select Consignment</label>
                  <select
                    required
                    value={webhookConsignmentId}
                    onChange={(e) => setWebhookConsignmentId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-mono text-[11px] focus:bg-white"
                  >
                    <option value="">Choose active tracking...</option>
                    {shippedOrders.map((o) => (
                      <option key={o.id} value={o.courier.consignmentId || o.courier.trackingId}>
                        {o.courier.trackingId} ({o.orderNumber} - {o.courier.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Simulate Status</label>
                  <select
                    required
                    value={webhookStatus}
                    onChange={(e) => setWebhookStatus(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 focus:bg-white"
                  >
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered (Payment Collected)</option>
                    <option value="returned">Returned to Hub (RMA Trigger)</option>
                    <option value="cancelled">Cancelled by Customer</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSendingWebhook || !webhookConsignmentId}
                  className="w-full py-2.5 bg-stone-900 hover:bg-black text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingWebhook ? 'Dispatching...' : 'Fire Webhook Event'}</span>
                </button>
              </form>
            </div>

            {/* Quick Courier Manager Card */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-5 text-xs space-y-3">
              <div className="flex items-center gap-2 text-teal-950 font-bold">
                <Truck className="w-4 h-4 text-teal-900" />
                <span>Custom Couriers Active</span>
              </div>
              <p className="text-teal-900">
                You can add unlimited delivery partners including local bike delivery riders, Sundarban, eCourier, or SA Paribahan.
              </p>
              <button
                onClick={handleOpenAddCourier}
                className="w-full py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBn ? '+ নতুন কুরিয়ার যোগ করুন' : '+ Add New Courier'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT COURIER PARTNER */}
      <AdminModalShell
        open={!!isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        label="MODAL 1 ADD EDIT COURIER PARTNER"
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
          <form onSubmit={handleSaveCourier} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider font-mono">
                  {editingCourierId ? 'Edit Configuration' : 'Add Courier Partner'}
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {editingCourierId 
                    ? (isBn ? 'কুরিয়ার পার্টনার এডিট করুন' : 'Edit Courier Partner')
                    : (isBn ? 'নতুন কুরিয়ার পার্টনার যোগ করুন' : 'Add New Courier Partner')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCourierModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-900 block mb-1">
                    {isBn ? 'কুরিয়ারের নাম (Courier Name):' : 'Courier Name:'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={courierFormData.name}
                    onChange={(e) => setCourierFormData({ ...courierFormData, name: e.target.value })}
                    placeholder="e.g. Sundarban Courier / Delivery Tiger"
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-900 block mb-1">
                    {isBn ? 'শর্ট কোড (Code):' : 'Short Code:'}
                  </label>
                  <input
                    type="text"
                    value={courierFormData.code}
                    onChange={(e) => setCourierFormData({ ...courierFormData, code: e.target.value })}
                    placeholder="e.g. sundarban / tiger"
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-900 block mb-1">
                    {isBn ? 'ঢাকার ভেতর রেট (৳):' : 'Inside Dhaka Rate (৳):'}
                  </label>
                  <input
                    type="number"
                    value={courierFormData.defaultInsideDhakaFee}
                    onChange={(e) => setCourierFormData({ ...courierFormData, defaultInsideDhakaFee: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-900 block mb-1">
                    {isBn ? 'ঢাকার বাইরে রেট (৳):' : 'Outside Dhaka (৳):'}
                  </label>
                  <input
                    type="number"
                    value={courierFormData.defaultOutsideDhakaFee}
                    onChange={(e) => setCourierFormData({ ...courierFormData, defaultOutsideDhakaFee: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-900 block mb-1">
                    {isBn ? 'ক্যাশ অন ডেলিভারি ফি (%):' : 'COD Fee (%):'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={courierFormData.codPercentageFee}
                    onChange={(e) => setCourierFormData({ ...courierFormData, codPercentageFee: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  {isBn ? 'সাপোর্ট হটলাইন / ফোন:' : 'Customer Care Phone:'}
                </label>
                <input
                  type="text"
                  value={courierFormData.phone}
                  onChange={(e) => setCourierFormData({ ...courierFormData, phone: e.target.value })}
                  placeholder="096xxxxxxxx or 017xxxxxxxx"
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  {isBn ? 'ট্র্যাকিং ইউআরএল টেমপ্লেট:' : 'Tracking URL Template:'}
                </label>
                <input
                  type="text"
                  value={courierFormData.trackingUrlTemplate}
                  onChange={(e) => setCourierFormData({ ...courierFormData, trackingUrlTemplate: e.target.value })}
                  placeholder="https://courier.com/track/{trackingId}"
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 font-mono"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Use {'{trackingId}'} as placeholder where the parcel tracking number will be injected.
                </span>
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  {isBn ? 'নোট / নির্দেশিকা:' : 'Handling Notes / Details:'}
                </label>
                <textarea
                  rows={2}
                  value={courierFormData.notes}
                  onChange={(e) => setCourierFormData({ ...courierFormData, notes: e.target.value })}
                  placeholder="e.g. For fragile items, branch pickup only, or fast same-day delivery."
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <input
                  type="checkbox"
                  id="active-courier-checkbox"
                  checked={courierFormData.isActive}
                  onChange={(e) => setCourierFormData({ ...courierFormData, isActive: e.target.checked })}
                  className="rounded text-teal-800 focus:ring-teal-800 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="active-courier-checkbox" className="text-xs font-semibold text-stone-800 cursor-pointer">
                  {isBn ? 'কুরিয়ার সক্রিয় রাখুন (অর্ডার ডিসপ্যাচে ব্যবহারের উপযোগী)' : 'Courier partner is active and available for parcel dispatch'}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsCourierModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingCourierId ? (isBn ? 'আপডেট করুন' : 'Save Changes') : (isBn ? 'কুরিয়ার যুক্ত করুন' : 'Add Courier')}</span>
              </button>
            </div>
          </form>
      </AdminModalShell>

      {/* MODAL 2: DISPATCH PARCEL MODAL */}
      <AdminModalShell
        open={!!dispatchModalOrder}
        onClose={() => setDispatchModalOrder(null)}
        label="MODAL 2 DISPATCH PARCEL MODAL"
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
        {dispatchModalOrder && (
          <form onSubmit={handleExecuteDispatch} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider font-mono">
                  Order {dispatchModalOrder.orderNumber}
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {isBn ? 'কুরিয়ার কনসাইনমেন্ট বুকিং' : 'Book Courier Consignment'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Customer:</span>
                <span className="font-bold text-stone-900">{dispatchModalOrder.customer.name} ({dispatchModalOrder.customer.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Destination:</span>
                <span className="font-semibold text-stone-800">{dispatchModalOrder.shippingAddress.thana}, {dispatchModalOrder.shippingAddress.district}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-stone-500 font-sans">Collect COD Amount:</span>
                <span className="font-bold text-stone-900">৳ {dispatchModalOrder.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  {isBn ? 'কুরিয়ার পার্টনার নির্বাচন করুন:' : 'Select Courier Partner:'}
                </label>
                <select
                  value={dispatchSelectedCourier}
                  onChange={(e) => setDispatchSelectedCourier(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 bg-stone-50 font-semibold"
                >
                  {customCouriers.filter(c => c.isActive).map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name} {c.isBuiltIn ? '(API Booking)' : '(Manual / Branch)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">
                  {isBn ? 'কাস্টম ট্র্যাকিং কোড (ঐচ্ছিক):' : 'Custom Tracking Code (Optional):'}
                </label>
                <input
                  type="text"
                  value={dispatchCustomTracking}
                  onChange={(e) => setDispatchCustomTracking(e.target.value)}
                  placeholder="Leave empty for auto-generated tracking code"
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-teal-800 font-mono"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  If the courier already provided a paper receipt or memo number, enter it here.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isDispatching === dispatchModalOrder.id}
                className="px-5 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>{isDispatching === dispatchModalOrder.id ? 'Booking...' : 'Confirm Dispatch'}</span>
              </button>
            </div>
          </form>
        )}
      </AdminModalShell>

      {/* UNIFIED PRINT DOCUMENTS MODAL */}
      {labelOrder && (
        <PrintOrderDocumentsModal
          order={labelOrder}
          siteContent={siteContent}
          onClose={() => setLabelOrder(null)}
        />
      )}
    </div>
  );
}
