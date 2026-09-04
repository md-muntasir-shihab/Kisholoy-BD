import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ShoppingCart, Filter, Truck, CheckCircle2, Clock, AlertCircle, 
  Printer, ArrowRight, Search, FileText, ChevronRight, Layers, Receipt,
  ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, Building2, User,
  Calendar, Download, Sparkles, Plus, MessageCircle, MessageSquare, Phone,
  Send, Share2, DollarSign, Package, Copy, Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus, OrderSourceChannel } from '../types';
import { PrintOrderDocumentsModal } from '../components/print/PrintOrderDocumentsModal';
import { BulkPrintModal } from '../components/print/BulkPrintModal';
import { DateRangeFilterBar } from '../components/admin/DateRangeFilterBar';
import { DateWiseDataHubModal } from '../components/admin/DateWiseDataHubModal';
import { ManualOrderModal } from '../components/admin/ManualOrderModal';
import { OrderCourierDispatchModal } from '../components/admin/OrderCourierDispatchModal';
import { OrderLiveTrackingTimeline } from '../components/admin/OrderLiveTrackingTimeline';
import { 
  DateFilterConfig, 
  filterItemsByDate, 
  exportToExcel, 
  exportToCsv,
  formatDateDisplay 
} from '../utils/dateFilterUtils';

export function OrdersAdmin() {
  const { orders, updateOrderStatus, dispatchCourier, siteContent, language, showToast } = useApp();
  const isBn = language === 'BN';
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [showBulkPrint, setShowBulkPrint] = useState(false);
  const [showDataHub, setShowDataHub] = useState(false);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [manualOrderInitialChannel, setManualOrderInitialChannel] = useState<OrderSourceChannel>('WHATSAPP');
  
  // Courier Integration states
  const [courierDispatchOrder, setCourierDispatchOrder] = useState<Order | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterConfig>({
    preset: 'ALL',
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth(),
  });

  // Sync if URL search query param changes
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Apply both Date Filter and Status/Channel/Search Filters
  const filteredOrders = useMemo(() => {
    // 1. Date Filter
    const dateFiltered = filterItemsByDate<Order>(orders, (o: Order) => o.createdAt, dateFilter);

    // 2. Status, Channel & Search Filters
    return dateFiltered.filter((o: Order) => {
      if (statusFilter !== 'ALL' && o.orderStatus !== statusFilter) return false;
      if (channelFilter !== 'ALL') {
        const orderCh = o.orderSource || 'WEB';
        if (orderCh !== channelFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.phone.includes(q) ||
          (o.channelDetails?.operatorName && o.channelDetails.operatorName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [orders, dateFilter, statusFilter, channelFilter, searchQuery]);

  // Helper: Open WhatsApp with Order summary
  const openWhatsAppForOrder = (order: Order) => {
    const cleanPhone = order.customer.phone.replace(/[^0-9]/g, '');
    const internationalPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
    const advancePaid = order.advancePayment?.isPaid ? order.advancePayment.amount : (order.advancePaymentAmount || 0);
    const balanceCod = order.balanceDueCod ?? Math.max(0, order.total - advancePaid);

    const itemsText = order.items.map((it, idx) => 
      `${idx + 1}. *${it.title}* - ${it.quantity}x @ ৳${it.price.toLocaleString()} = ৳${(it.price * it.quantity).toLocaleString()}`
    ).join('\n');

    const msg = `🌸 *কিশলয় (KISHOLOY) অর্ডার কনফার্মেশন* 🌸
প্রিয় ${order.customer.name},
আপনার অর্ডার #${order.orderNumber} সফলভাবে গ্রহণ করা হয়েছে! 🌿

🛍️ *অর্ডারের আইটেম:*
${itemsText}

💰 *সর্বমোট:* ৳${order.total.toLocaleString()}
${advancePaid > 0 ? `✅ *অগ্রিম পরিশোধ:* ৳${advancePaid.toLocaleString()}\n🔴 *ক্যাশ অন ডেলিভারি (বকেয়া):* ৳${balanceCod.toLocaleString()}` : `🔴 *ক্যাশ অন ডেলিভারি (বকেয়া):* ৳${order.total.toLocaleString()}`}

📍 *ঠিকানা:* ${order.shippingAddress.address}, ${order.shippingAddress.district}
🚚 *কুরিয়ার:* ${order.courier.provider} (${order.courier.trackingId || 'Preparing'})
🔎 *ট্র্যাকিং লিংক:* https://kisholoy.com/track/${order.orderNumber}

ধন্যবাদ কিশলয়ের সাথে থাকার জন্য! 🍃`;

    window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Format data for Excel/CSV Export
  const getExportableOrders = () => {
    return filteredOrders.map((o) => ({
      'Order Number': o.orderNumber,
      'Order Date': o.createdAt ? new Date(o.createdAt).toLocaleString('en-GB') : '',
      'Source Channel': o.orderSource || 'WEB',
      'Operator': o.channelDetails?.operatorName || 'System Checkout',
      'Customer Name': o.customer.name,
      'Phone': o.customer.phone,
      'Address': o.shippingAddress?.address || '',
      'District': o.shippingAddress?.district || '',
      'Payment Method': o.paymentMethod,
      'Payment Status': o.paymentStatus,
      'Delivery Status': o.orderStatus,
      'Subtotal (BDT)': o.subtotal,
      'Delivery Charge (BDT)': o.shippingFee,
      'Discount (BDT)': o.discount,
      'Grand Total (BDT)': o.total,
      'Advance Paid (BDT)': o.advancePayment?.amount || 0,
      'Balance Due COD (BDT)': o.balanceDueCod || o.total,
      'Items Count': o.items?.length || 0,
      'Courier Code': o.courier?.trackingId || 'Unassigned',
      'Fraud Risk': o.fraudRisk?.riskRating || 'LOW',
    }));
  };

  const handleExportExcel = () => {
    const data = getExportableOrders();
    if (data.length === 0) {
      showToast(isBn ? 'এক্সপোর্ট করার মতো কোনো অর্ডার নেই' : 'No orders to export in this date range.', 'info');
      return;
    }
    exportToExcel(data, 'Orders', 'Kisholoy_Orders_Report', dateFilter);
    showToast(isBn ? `${data.length}টি অর্ডার এক্সেলে এক্সপোর্ট করা হয়েছে` : `Exported ${data.length} orders to Excel.`);
  };

  const handleExportCsv = () => {
    const data = getExportableOrders();
    if (data.length === 0) return;
    exportToCsv(data, 'Kisholoy_Orders_Report', dateFilter);
    showToast(isBn ? 'অর্ডার তালিকা CSV ফরম্যাটে ডাউনলোড হয়েছে' : 'Orders CSV exported successfully.');
  };

  const allStatuses: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'READY_TO_SHIP',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURN_REQUESTED',
    'RETURNED'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-stone-900">Orders Operational Desk</h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-emerald-600" />
              <span>Omnichannel</span>
            </span>
          </div>
          <p className="text-xs text-stone-500">Manage web checkouts, WhatsApp & social assisted orders, inventory lock, and courier dispatch.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Create Manual / WhatsApp Order Button */}
          <button
            onClick={() => {
              setManualOrderInitialChannel('WHATSAPP');
              setShowManualOrderModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <MessageCircle className="w-4 h-4 text-emerald-200" />
            <span>{isBn ? '+ হোয়াটসঅ্যাপ/সোশ্যাল অর্ডার' : '+ Create Order (WhatsApp / Social)'}</span>
          </button>

          <button
            onClick={() => setShowDataHub(true)}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-950 text-teal-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all border border-stone-800"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>{isBn ? 'মাস্টার ডেট হাব' : 'Date & Export Hub'}</span>
          </button>
          <button
            onClick={() => setShowBulkPrint(true)}
            className="px-4 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
          >
            <Printer className="w-4 h-4 text-teal-300" />
            <span>{isBn ? 'বাল্ক প্রিন্ট' : 'Bulk Print Orders'}</span>
          </button>
        </div>
      </div>

      {/* Reusable Date Range Filter Bar */}
      <DateRangeFilterBar
        value={dateFilter}
        onChange={setDateFilter}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        onOpenDataHub={() => setShowDataHub(true)}
        totalFilteredCount={filteredOrders.length}
        totalUnfilteredCount={orders.length}
      />

      {/* Filters Bar with Channel & Status */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by order #, name, phone, or agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1">Status:</span>
            {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Channel Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-stone-100 text-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Share2 className="w-3 h-3 text-stone-500" />
            <span>Channel:</span>
          </span>
          {[
            { id: 'ALL', label: 'All Channels', icon: null },
            { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
            { id: 'MESSENGER', label: 'Messenger', icon: MessageSquare, color: 'text-blue-700 bg-blue-50 border-blue-300' },
            { id: 'PHONE', label: 'Phone Call', icon: Phone, color: 'text-amber-700 bg-amber-50 border-amber-300' },
            { id: 'WEB', label: 'Web Store', icon: ShoppingCart, color: 'text-teal-700 bg-teal-50 border-teal-300' },
            { id: 'DIRECT', label: 'Direct/Walk-in', icon: Building2, color: 'text-stone-700 bg-stone-100 border-stone-300' }
          ].map((ch) => {
            const Icon = ch.icon;
            const isSelected = channelFilter === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setChannelFilter(ch.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{ch.label}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  ({ch.id === 'ALL' ? orders.length : orders.filter(o => (o.orderSource || 'WEB') === ch.id).length})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">Order # & Channel</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Financials (BDT)</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Fraud Risk</th>
                <th className="p-4">Status</th>
                <th className="p-4">Courier</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredOrders.map((order) => {
                const risk = order.fraudRisk;
                const isHighRisk = risk && (risk.riskScore >= 60 || risk.riskRating === 'HIGH' || risk.riskRating === 'SUSPICIOUS');
                const orderSource = order.orderSource || 'WEB';
                const advanceAmount = order.advancePayment?.isPaid ? order.advancePayment.amount : (order.advancePaymentAmount || 0);

                return (
                <tr key={order.id} className={`hover:bg-stone-50 transition-colors ${isHighRisk ? 'bg-rose-50/20' : ''}`}>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="font-mono font-bold text-stone-900 hover:underline text-teal-900 text-left"
                      >
                        {order.orderNumber}
                      </button>

                      {/* Source Channel Badge */}
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold w-fit ${
                        orderSource === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        orderSource === 'MESSENGER' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        orderSource === 'PHONE' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        orderSource === 'DIRECT' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                        'bg-stone-100 text-stone-700 border border-stone-200'
                      }`}>
                        {orderSource === 'WHATSAPP' && <MessageCircle className="w-2.5 h-2.5 text-emerald-600" />}
                        {orderSource === 'MESSENGER' && <MessageSquare className="w-2.5 h-2.5 text-blue-600" />}
                        {orderSource === 'PHONE' && <Phone className="w-2.5 h-2.5 text-amber-600" />}
                        {orderSource === 'WEB' && <ShoppingCart className="w-2.5 h-2.5 text-stone-500" />}
                        <span>{orderSource}</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-stone-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/admin/customers?search=${encodeURIComponent(order.customer.phone || order.customer.name)}`}
                      className="group block"
                      title="Inspect Customer in Directory"
                    >
                      <span className="font-semibold text-stone-900 group-hover:text-teal-900 group-hover:underline flex items-center gap-1">
                        {order.customer.name}
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-teal-800 transition-opacity" />
                      </span>
                      <span className="text-stone-500 font-mono text-[11px] group-hover:text-stone-800">{order.customer.phone}</span>
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-stone-900 font-mono">
                      ৳ {order.total.toLocaleString()}
                    </div>
                    {advanceAmount > 0 && (
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        Adv: ৳{advanceAmount} • COD: ৳{(order.balanceDueCod ?? (order.total - advanceAmount)).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'
                    }`}>
                      {order.paymentMethod} • {order.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    {risk ? (
                      <Link
                        to={`/admin/fraud?search=${encodeURIComponent(order.orderNumber)}`}
                        className="flex flex-col gap-0.5 group hover:opacity-90 transition-opacity"
                        title="View Full Fraud & Risk Assessment"
                      >
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          risk.riskRating === 'SUSPICIOUS' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          risk.riskRating === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          risk.riskRating === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {risk.riskRating === 'SUSPICIOUS' ? <AlertCircle className="w-3 h-3 text-rose-600" /> :
                           risk.riskRating === 'HIGH' ? <ShieldAlert className="w-3 h-3 text-amber-600" /> :
                           <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                          {risk.riskRating} ({risk.riskScore})
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60 group-hover:opacity-100" />
                        </span>
                        {order.verificationStatus && order.verificationStatus !== 'UNVERIFIED' && (
                          <span className="text-[9px] text-teal-700 font-medium">
                            {order.verificationStatus.replace(/_/g, ' ')}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <Link
                        to={`/admin/fraud?search=${encodeURIComponent(order.orderNumber)}`}
                        className="text-stone-400 hover:text-stone-600 text-[10px] underline"
                      >
                        Check Risk
                      </Link>
                    )}
                  </td>
                  <td className="p-4">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="bg-teal-50 border border-teal-200 text-teal-900 font-bold px-2 py-1 rounded text-xs focus:outline-none"
                    >
                      {allStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-stone-600 font-mono text-[11px]">
                    {order.courier.trackingId ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCourierDispatchOrder(order)}
                          className="text-left group hover:opacity-80 transition-opacity"
                          title="Click to view courier consignment & tracking status"
                        >
                          <span className="text-teal-900 font-bold block">{order.courier.provider}</span>
                          <span className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
                            {order.courier.trackingId}
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCourierDispatchOrder(order)}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <Truck className="w-3 h-3 text-teal-700" />
                        <span>+ Dispatch Delivery</span>
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Courier Quick Action */}
                      <button
                        onClick={() => setCourierDispatchOrder(order)}
                        title={order.courier?.trackingId ? "View / Update Courier Dispatch" : "Trigger Steadfast / Pathao Delivery"}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          order.courier?.trackingId 
                            ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200' 
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                      </button>

                      {/* WhatsApp Quick Message Button */}
                      <button
                        onClick={() => openWhatsAppForOrder(order)}
                        title="Send Order Receipt via WhatsApp"
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      </button>

                      <button
                        onClick={() => setPrintOrder(order)}
                        title="Print Order Documents (one PDF)"
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Printer className="w-3 h-3 text-teal-700" />
                        <span>Print</span>
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1 bg-stone-900 text-white rounded font-semibold hover:bg-black transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-6 shadow-2xl border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-stone-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-white">{selectedOrder.orderNumber}</h3>
                <span className="text-xs text-stone-500 dark:text-slate-400">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-stone-900 dark:hover:text-white font-bold text-lg p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-stone-50 dark:bg-slate-800/80 rounded-xl border border-stone-200 dark:border-slate-700">
                <h4 className="font-bold text-stone-900 dark:text-white mb-1">Customer</h4>
                <p>{selectedOrder.customer.name}</p>
                <p className="font-mono">{selectedOrder.customer.phone}</p>
                <p>{selectedOrder.customer.email || 'No email provided'}</p>
              </div>
              <div className="p-4 bg-stone-50 dark:bg-slate-800/80 rounded-xl border border-stone-200 dark:border-slate-700">
                <h4 className="font-bold text-stone-900 dark:text-white mb-1">Shipping Destination</h4>
                <p>{selectedOrder.shippingAddress.address}</p>
                <p>{selectedOrder.shippingAddress.thana}, {selectedOrder.shippingAddress.district}</p>
                <p>Division: {selectedOrder.shippingAddress.division}</p>
              </div>
            </div>

            {/* Omnichannel Source & Sales Agent Details */}
            {selectedOrder.channelDetails && (
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <MessageCircle className="w-4 h-4 text-emerald-700" />
                    <span>Order Source & Assisted Sales</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold bg-emerald-200 text-emerald-900 text-[10px] uppercase">
                    {selectedOrder.orderSource || 'WHATSAPP'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-stone-700">
                  <div>
                    Agent / Operator: <strong>{selectedOrder.channelDetails.operatorName || 'Admin'}</strong>
                  </div>
                  {selectedOrder.channelDetails.conversationLink && (
                    <div>
                      Chat Link: <a href={selectedOrder.channelDetails.conversationLink} target="_blank" rel="noreferrer" className="text-teal-800 underline truncate block">{selectedOrder.channelDetails.conversationLink}</a>
                    </div>
                  )}
                </div>
                {selectedOrder.channelDetails.internalNotes && (
                  <div className="p-2 bg-white/80 rounded border border-emerald-200 text-stone-700 text-[11px]">
                    <span className="font-bold text-emerald-900">Internal Agent Note: </span>
                    {selectedOrder.channelDetails.internalNotes}
                  </div>
                )}
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => openWhatsAppForOrder(selectedOrder)}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Send WhatsApp Invoice / Receipt</span>
                  </button>
                </div>
              </div>
            )}

            {/* Phase 13: Multi-Warehouse Hub Fulfillment Metadata */}
            {selectedOrder.fulfillment && (
              <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 font-bold text-teal-950">
                    <Building2 className="w-4 h-4 text-teal-700" />
                    <span>Fulfillment Hub Routing</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-teal-100 text-teal-900 text-[10px]">
                    {selectedOrder.fulfillment.assignedWarehouseCode || 'HUB'}
                  </span>
                </div>
                <div className="text-stone-700">
                  Assigned Hub: <strong>{selectedOrder.fulfillment.assignedWarehouseName}</strong>
                </div>
                <div className="text-stone-600 text-[11px]">
                  Reason: {selectedOrder.fulfillment.routingReason}
                </div>
                {selectedOrder.fulfillment.dispatchCutoff && (
                  <div className="text-teal-900 font-medium text-[11px] pt-1 border-t border-teal-200/50">
                    Estimated Cutoff: {selectedOrder.fulfillment.dispatchCutoff}
                  </div>
                )}
              </div>
            )}

            {/* Courier & Logistics Dispatch Live Status Timeline (Steadfast & Pathao APIs) */}
            {selectedOrder.courier?.trackingId ? (
              <div className="space-y-2">
                <OrderLiveTrackingTimeline
                  order={selectedOrder}
                  isBn={isBn}
                  onStatusSync={(newStatus) => {
                    updateOrderStatus(selectedOrder.id, newStatus as OrderStatus);
                    setSelectedOrder((prev: any) => 
                      prev ? { 
                        ...prev, 
                        orderStatus: newStatus, 
                        courier: { ...prev.courier, status: newStatus } 
                      } : null
                    );
                    showToast(`Synced order status to ${newStatus}`);
                  }}
                />
                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button
                    onClick={() => setPrintOrder(selectedOrder)}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-300" />
                    <span>Print Order Documents</span>
                  </button>
                  <button
                    onClick={() => setCourierDispatchOrder(selectedOrder)}
                    className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5 text-sky-700" />
                    <span>Manage / Switch Courier</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 text-xs space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 font-bold text-sky-950">
                    <Truck className="w-4 h-4 text-sky-700" />
                    <span>Logistics & Courier Delivery (Steadfast / Pathao APIs)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-amber-100 text-amber-800 border border-amber-300">
                    PENDING DISPATCH
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/90 p-3 rounded-lg border border-sky-200">
                  <div>
                    <p className="text-stone-800 font-medium">
                      Order is ready for direct courier delivery request trigger.
                    </p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Destination: {selectedOrder.shippingAddress.district} ({selectedOrder.shippingAddress.division}) • COD: ৳{(selectedOrder.balanceDueCod ?? selectedOrder.total).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setCourierDispatchOrder(selectedOrder)}
                    className="px-4 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap shrink-0"
                  >
                    <Truck className="w-4 h-4 text-teal-300" />
                    <span>Trigger Delivery Request</span>
                  </button>
                </div>
              </div>
            )}

            {/* Phase 12: Fraud Risk Assessment Card */}
            {selectedOrder.fraudRisk && (
              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <ShieldAlert className="w-4 h-4 text-rose-700" />
                    <span>Fraud & Risk Assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900 font-mono">
                      Score: {selectedOrder.fraudRisk.riskScore}/100
                    </span>
                    <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 text-[10px]">
                      {selectedOrder.fraudRisk.riskRating}
                    </span>
                  </div>
                </div>

                <div className="text-stone-700 space-y-1">
                  <div className="font-semibold text-stone-900">Recommendation: {selectedOrder.fraudRisk.recommendation.replace(/_/g, ' ')}</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-stone-600">
                    {selectedOrder.fraudRisk.reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-rose-200/60">
                  <span className="text-[11px] text-stone-500">
                    Status: <strong className="text-stone-800">{selectedOrder.verificationStatus || 'UNVERIFIED'}</strong>
                  </span>
                  <Link
                    to="/admin/fraud"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 underline"
                  >
                    Open in Fraud Review Center <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="border border-stone-200 rounded-xl divide-y divide-stone-200 overflow-hidden">
              {selectedOrder.items.map((it: any, i: number) => (
                <div key={i} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img src={it.image} alt={it.title} className="w-10 h-10 rounded object-cover border" />
                    <div>
                      <span className="font-bold text-stone-900 block">{it.title}</span>
                      <span className="text-stone-500">Qty: {it.quantity} • SKU: {it.sku}</span>
                    </div>
                  </div>
                  <span className="font-bold text-stone-900">৳ {(it.price * it.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Financials & Advance Breakdown */}
            <div className="bg-stone-50 p-4 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>৳ {selectedOrder.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>৳ {selectedOrder.shippingFee.toLocaleString()}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount</span>
                  <span>- ৳ {selectedOrder.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-teal-950 pt-2 border-t border-stone-200">
                <span>Grand Total</span>
                <span>৳ {selectedOrder.total.toLocaleString()}</span>
              </div>

              {/* Advance Payment Details */}
              {((selectedOrder.advancePayment && selectedOrder.advancePayment.isPaid) || (selectedOrder.advancePaymentAmount && selectedOrder.advancePaymentAmount > 0)) && (
                <div className="pt-2 mt-2 border-t border-dashed border-stone-300 space-y-1 bg-emerald-50/50 p-2.5 rounded-lg">
                  <div className="flex justify-between font-semibold text-emerald-900">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Advance Paid ({selectedOrder.advancePayment?.method || selectedOrder.paymentMethod}):
                    </span>
                    <span>৳ {(selectedOrder.advancePayment?.amount || selectedOrder.advancePaymentAmount).toLocaleString()}</span>
                  </div>
                  {selectedOrder.advancePayment?.transactionId && (
                    <div className="text-[11px] text-stone-500 font-mono">
                      TrxID: {selectedOrder.advancePayment.transactionId}
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-emerald-200">
                    <span>Balance Due (Cash on Delivery):</span>
                    <span className="text-teal-950 font-mono">৳ {(selectedOrder.balanceDueCod ?? Math.max(0, selectedOrder.total - (selectedOrder.advancePayment?.amount || selectedOrder.advancePaymentAmount))).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCourierDispatchOrder(selectedOrder)}
                  className="px-3.5 py-2 bg-teal-800 text-white rounded-lg text-xs font-bold hover:bg-teal-900 flex items-center gap-1.5 shadow-xs"
                >
                  <Truck className="w-3.5 h-3.5 text-teal-300" />
                  <span>{selectedOrder.courier?.trackingId ? 'Manage Courier / Dispatch' : 'Dispatch via Steadfast/Pathao'}</span>
                </button>
                <button
                  onClick={() => setPrintOrder(selectedOrder)}
                  className="px-3.5 py-2 bg-teal-900 text-white rounded-lg text-xs font-bold hover:bg-teal-950 flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-300" />
                  <span>Print Order Documents</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-800 text-teal-200 font-normal">One PDF</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-stone-200 text-stone-800 rounded-lg text-xs font-bold hover:bg-stone-300"
              >
                Close Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courier & Delivery Dispatch Modal (Steadfast & Pathao APIs) */}
      {courierDispatchOrder && (
        <OrderCourierDispatchModal
          isOpen={!!courierDispatchOrder}
          order={courierDispatchOrder}
          onClose={() => setCourierDispatchOrder(null)}
          onSuccess={(updatedOrder) => {
            if (selectedOrder && selectedOrder.id === updatedOrder.id) {
              setSelectedOrder(updatedOrder);
            }
          }}
          onPrintLabel={(ord) => {
            setPrintOrder(ord);
          }}
        />
      )}

      {/* Unified Single-Order Print Documents Modal */}
      {printOrder && (
        <PrintOrderDocumentsModal
          order={printOrder}
          siteContent={siteContent}
          onClose={() => setPrintOrder(null)}
        />
      )}

      {/* Unified Bulk Print Modal */}
      {showBulkPrint && (
        <BulkPrintModal
          orders={orders}
          siteContent={siteContent}
          onClose={() => setShowBulkPrint(false)}
        />
      )}

      {/* Manual & Social Order Creation Modal */}
      {showManualOrderModal && (
        <ManualOrderModal
          isOpen={showManualOrderModal}
          onClose={() => setShowManualOrderModal(false)}
          defaultChannel={manualOrderInitialChannel}
        />
      )}

      {/* Date-wise Master Data Hub Modal */}
      {showDataHub && (
        <DateWiseDataHubModal
          isOpen={showDataHub}
          onClose={() => setShowDataHub(false)}
          initialDomain="ORDERS"
        />
      )}
    </div>
  );
}
