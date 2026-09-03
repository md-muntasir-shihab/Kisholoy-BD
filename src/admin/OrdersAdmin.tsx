import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, Filter, Truck, CheckCircle2, Clock, AlertCircle, 
  Printer, ArrowRight, Search, FileText, ChevronRight, Layers, Receipt,
  ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';
import { BusinessDocumentModal } from '../components/admin/BusinessDocumentModal';
import { InvoiceGeneratorModal } from '../components/admin/InvoiceGeneratorModal';

export function OrdersAdmin() {
  const { orders, updateOrderStatus, dispatchCourier, siteContent } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [printDoc, setPrintDoc] = useState<{ type: 'INVOICE' | 'PACKING_SLIP'; order: any } | null>(null);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [invoiceGeneratorOrderId, setInvoiceGeneratorOrderId] = useState<string | undefined>(undefined);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.orderStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.includes(q)
      );
    }
    return true;
  });

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
          <h1 className="text-2xl font-serif font-bold text-stone-900">Orders Operational Desk</h1>
          <p className="text-xs text-stone-500">Manage order validation, state machine transitions, and courier booking.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setInvoiceGeneratorOrderId(undefined);
              setShowInvoiceGenerator(true);
            }}
            className="px-4 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
          >
            <FileText className="w-4 h-4 text-teal-300" />
            <span>Invoice Generator</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-800 text-teal-200 font-normal">PDF</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by order #, name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
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

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">Order #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
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
                return (
                <tr key={order.id} className={`hover:bg-stone-50 transition-colors ${isHighRisk ? 'bg-rose-50/20' : ''}`}>
                  <td className="p-4 font-mono font-bold text-stone-900">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="hover:underline text-teal-900"
                    >
                      {order.orderNumber}
                    </button>
                  </td>
                  <td className="p-4 text-stone-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-stone-900 block">{order.customer.name}</span>
                    <span className="text-stone-500 font-mono text-[11px]">{order.customer.phone}</span>
                  </td>
                  <td className="p-4 font-bold text-stone-900 font-mono">
                    ৳ {order.total.toLocaleString()}
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
                      <div className="flex flex-col gap-0.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          risk.riskRating === 'SUSPICIOUS' ? 'bg-rose-100 text-rose-800' :
                          risk.riskRating === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                          risk.riskRating === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {risk.riskRating === 'SUSPICIOUS' ? <AlertCircle className="w-3 h-3 text-rose-600" /> :
                           risk.riskRating === 'HIGH' ? <ShieldAlert className="w-3 h-3 text-amber-600" /> :
                           <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                          {risk.riskRating} ({risk.riskScore})
                        </span>
                        {order.verificationStatus && order.verificationStatus !== 'UNVERIFIED' && (
                          <span className="text-[9px] text-teal-700 font-medium">
                            {order.verificationStatus.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-stone-400 text-[10px]">Unrated</span>
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
                      <span className="text-teal-900 font-bold">{order.courier.provider}: {order.courier.trackingId}</span>
                    ) : (
                      <button
                        onClick={() => dispatchCourier(order.id, 'Steadfast')}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 rounded font-semibold text-stone-800"
                      >
                        + Book Courier
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setInvoiceGeneratorOrderId(order.id);
                          setShowInvoiceGenerator(true);
                        }}
                        title="Generate & Download Invoice (PDF)"
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded font-semibold flex items-center gap-1 transition-colors"
                      >
                        <FileText className="w-3 h-3 text-teal-700" />
                        <span>Invoice</span>
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
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-bold font-serif text-stone-900">{selectedOrder.orderNumber}</h3>
                <span className="text-xs text-stone-500">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-stone-900 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <h4 className="font-bold text-stone-900 mb-1">Customer</h4>
                <p>{selectedOrder.customer.name}</p>
                <p className="font-mono">{selectedOrder.customer.phone}</p>
                <p>{selectedOrder.customer.email || 'No email provided'}</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <h4 className="font-bold text-stone-900 mb-1">Shipping Destination</h4>
                <p>{selectedOrder.shippingAddress.address}</p>
                <p>{selectedOrder.shippingAddress.thana}, {selectedOrder.shippingAddress.district}</p>
                <p>Division: {selectedOrder.shippingAddress.division}</p>
              </div>
            </div>

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

            {/* Financials */}
            <div className="bg-stone-50 p-4 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>৳ {selectedOrder.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>৳ {selectedOrder.shippingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-teal-950 pt-2 border-t border-stone-200">
                <span>Total Due</span>
                <span>৳ {selectedOrder.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setInvoiceGeneratorOrderId(selectedOrder.id);
                    setShowInvoiceGenerator(true);
                  }}
                  className="px-3.5 py-2 bg-teal-900 text-white rounded-lg text-xs font-bold hover:bg-teal-950 flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-300" />
                  <span>Invoice Generator (PDF & Print)</span>
                </button>
                <button
                  onClick={() => setPrintDoc({ type: 'INVOICE', order: selectedOrder })}
                  className="px-3 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black flex items-center gap-1.5 shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5" /> Mushak-6.3 Fast Print
                </button>
                <button
                  onClick={() => setPrintDoc({ type: 'PACKING_SLIP', order: selectedOrder })}
                  className="px-3 py-2 bg-stone-100 text-stone-800 rounded-lg text-xs font-bold hover:bg-stone-200 flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" /> Packing Slip
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

      {/* Advanced Invoice Generator Modal */}
      {showInvoiceGenerator && (
        <InvoiceGeneratorModal
          initialOrderId={invoiceGeneratorOrderId}
          ordersList={orders}
          siteContent={siteContent}
          onClose={() => {
            setShowInvoiceGenerator(false);
            setInvoiceGeneratorOrderId(undefined);
          }}
        />
      )}

      {/* Printable Business Document Modal */}
      {printDoc && (
        <BusinessDocumentModal
          type={printDoc.type}
          order={printDoc.order}
          ordersList={orders}
          siteContent={siteContent}
          onClose={() => setPrintDoc(null)}
        />
      )}
    </div>
  );
}
