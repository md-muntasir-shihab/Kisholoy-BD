import React, { useState } from 'react';
import { Truck, Package, Printer, CheckCircle2, ArrowRight, ExternalLink, QrCode, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ShippingLabelModal } from '../components/admin/ShippingLabelModal';
import { Order } from '../types';

export function ShipmentsAdmin() {
  const { orders, dispatchCourier, showToast } = useApp();
  const [selectedCourier, setSelectedCourier] = useState<'Steadfast' | 'Pathao' | 'RedX'>('Steadfast');
  const [isDispatching, setIsDispatching] = useState<string | null>(null);
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);

  // Webhook Simulator state
  const [webhookConsignmentId, setWebhookConsignmentId] = useState('');
  const [webhookStatus, setWebhookStatus] = useState('in_transit');
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  const shippedOrders = orders.filter((o) => o.courier.trackingId);
  const pendingShipmentOrders = orders.filter((o) => o.orderStatus === 'PROCESSING' || (o.orderStatus === 'CONFIRMED' && !o.courier.trackingId));

  const handleDispatch = async (orderId: string, provider: 'Steadfast' | 'Pathao') => {
    setIsDispatching(orderId);
    try {
      const res = await fetch('/api/courier/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, courierProvider: provider })
      });
      const data = await res.json();
      
      if (data.success) {
        dispatchCourier(orderId, provider);
        showToast(`Consignment booked successfully with ${provider}!`);
      } else {
        showToast(`Booking failed: ${data.error || 'Unknown error'}`, 'info');
      }
    } catch (e) {
      showToast('Network error during dispatch.', 'info');
    } finally {
      setIsDispatching(null);
    }
  };

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
          tracking_id: webhookConsignmentId, // Fallback if user pastes tracking ID
          status: webhookStatus,
          note: `Simulated webhook event: ${webhookStatus}`
        })
      });
      const data = await res.json();
      if (data.updated) {
        showToast(data.message);
        // Soft reload by triggering a context refresh if available, else just rely on next navigation
      } else {
        showToast(data.message || 'Webhook failed', 'info');
      }
    } catch (e) {
      showToast('Network error while simulating webhook', 'info');
    } finally {
      setIsSendingWebhook(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">Courier Dispatch & Shipping Labels</h1>
          <p className="text-xs text-stone-500">API booking with Steadfast, Pathao & RedX with barcode parcel labels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Dispatch Actions Card */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-900" />
              Ready for Consignment Dispatch ({pendingShipmentOrders.length})
            </h2>

            {pendingShipmentOrders.length === 0 ? (
              <p className="text-xs text-stone-500 py-3">All confirmed orders have been dispatched to couriers!</p>
            ) : (
              <div className="divide-y divide-stone-200">
                {pendingShipmentOrders.map((order) => (
                  <div key={order.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-stone-50 transition-colors p-2 rounded">
                    <div>
                      <span className="font-mono font-bold text-stone-900">{order.orderNumber}</span>
                      <span className="text-stone-500 ml-2">({order.customer.name} • {order.shippingAddress.district})</span>
                      <span className="block text-[11px] text-stone-400 mt-0.5">Total Due: ৳ {order.total.toLocaleString()} ({order.paymentMethod})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={isDispatching === order.id}
                        onClick={() => handleDispatch(order.id, 'Steadfast')}
                        className="px-3 py-1.5 bg-teal-900 text-white rounded font-bold hover:bg-teal-950 flex items-center gap-1 disabled:opacity-50 transition-colors"
                      >
                        <span>{isDispatching === order.id ? 'Booking...' : 'Dispatch via Steadfast'}</span>
                      </button>
                      <button
                        disabled={isDispatching === order.id}
                        onClick={() => handleDispatch(order.id, 'Pathao')}
                        className="px-3 py-1.5 bg-stone-900 text-white rounded font-bold hover:bg-black disabled:opacity-50 transition-colors"
                      >
                        <span>Pathao</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dispatched Consignments Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center text-xs font-bold text-stone-700">
              <span>Active Consignments & Tracking ({shippedOrders.length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4">Consignment / Order #</th>
                    <th className="p-4">Courier Partner</th>
                    <th className="p-4">Tracking Code</th>
                    <th className="p-4">Destination</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {shippedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-stone-900">
                        {order.orderNumber}
                      </td>
                      <td className="p-4 font-semibold text-stone-800">
                        {order.courier.provider}
                      </td>
                      <td className="p-4 font-mono font-bold text-teal-900 flex items-center gap-1">
                        {order.courier.trackingId}
                        <ExternalLink className="w-3 h-3 text-stone-400 cursor-pointer hover:text-teal-900" />
                      </td>
                      <td className="p-4 text-stone-600">
                        {order.shippingAddress.thana}, {order.shippingAddress.district}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-900 border border-teal-200">
                          {order.courier.status || order.orderStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setLabelOrder(order)}
                          className="px-2.5 py-1.5 bg-white border border-stone-300 hover:border-stone-400 hover:bg-stone-50 rounded font-semibold text-stone-700 flex items-center gap-1.5 inline-flex shadow-xs transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-teal-900" />
                          Print Label
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Webhook Simulator */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-teal-800" />
              Webhook Simulator
            </h3>
            <p className="text-[11px] text-stone-500 mt-1 mb-4">
              Simulate server-to-server tracking updates from Steadfast or Pathao APIs.
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
                      {o.courier.trackingId} ({o.orderNumber})
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
                  <option value="delivered">Delivered (Success)</option>
                  <option value="returned">Returned to Hub</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSendingWebhook || !webhookConsignmentId}
                className="w-full py-2.5 bg-stone-900 hover:bg-black text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSendingWebhook ? 'Dispatching...' : 'Fire Event'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <ShippingLabelModal
        isOpen={!!labelOrder}
        onClose={() => setLabelOrder(null)}
        order={labelOrder}
      />
    </div>
  );
}
