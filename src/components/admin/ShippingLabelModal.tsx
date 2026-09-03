import React from 'react';
import { X, Printer, Package, Truck, Phone, MapPin, ScanLine } from 'lucide-react';
import { Order } from '../../types';

interface ShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export function ShippingLabelModal({ isOpen, onClose, order }: ShippingLabelModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate a mock barcode using QR server for visual representation
  const trackingData = order.courier?.trackingId || order.orderNumber;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingData)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm print:bg-white print:p-0">
      {/* Non-printable overlay controls */}
      <div className="absolute top-6 right-6 flex gap-3 print:hidden z-50">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-teal-800 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-teal-900 shadow-lg"
        >
          <Printer className="w-4 h-4" /> Print Label
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white text-stone-600 rounded-lg hover:bg-stone-100 shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* The Printable Label Canvas */}
      <div className="bg-white text-black w-[4in] min-h-[6in] shadow-2xl relative print:shadow-none print:w-full print:h-full animate-in fade-in zoom-in-95">
        
        {/* Header - Courier Branding */}
        <div className="border-b-4 border-black p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">
              {order.courier?.provider || 'KISHOLOY EXPRESS'}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1">E-Commerce Standard</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black">{order.shippingAddress.district.substring(0, 3).toUpperCase()}</span>
          </div>
        </div>

        {/* Tracking & Barcode Section */}
        <div className="p-4 border-b-2 border-black flex flex-col items-center justify-center gap-3">
          <div className="w-48 h-16 border-2 border-black flex items-center justify-center bg-stone-100 relative overflow-hidden">
            {/* Fake SVG Barcode Pattern */}
            <div className="absolute inset-0 flex items-stretch">
              {[...Array(40)].map((_, i) => (
                <div key={i} className={`h-full bg-black ${Math.random() > 0.5 ? 'w-1' : 'w-2'} ${Math.random() > 0.7 ? 'mr-1' : 'mr-0.5'}`} />
              ))}
            </div>
          </div>
          <div className="font-mono font-bold text-lg tracking-widest uppercase">
            {order.courier?.trackingId || order.orderNumber}
          </div>
        </div>

        {/* Recipient Details */}
        <div className="p-4 border-b border-black">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Deliver To</span>
          <h2 className="text-xl font-bold uppercase">{order.customer.name}</h2>
          <div className="text-sm font-semibold mt-1 flex flex-col gap-0.5">
            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {order.customer.phone}</span>
            <span className="flex items-start gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> 
              <span>{order.shippingAddress.address}<br/>{order.shippingAddress.thana}, {order.shippingAddress.district}</span>
            </span>
          </div>
        </div>

        {/* Sender Details */}
        <div className="p-4 border-b-2 border-black flex justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Sender (Merchant)</span>
            <h3 className="text-sm font-bold">KISHOLOY</h3>
            <p className="text-[11px] font-medium leading-tight">House 12, Road 4, Banani<br/>Dhaka 1213<br/>01700-000000</p>
          </div>
          
          <div className="shrink-0 flex items-center justify-center p-2">
             <img src={qrUrl} alt="QR Code" className="w-20 h-20" />
          </div>
        </div>

        {/* Package & Payment Summary */}
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Weight & Dim</span>
            <p className="text-sm font-bold border border-black px-2 py-1 inline-block">1.5 KG • STD</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Cash on Delivery</span>
            {order.paymentMethod === 'COD' && order.paymentStatus === 'UNPAID' ? (
              <p className="text-xl font-black font-mono border-2 border-black bg-black text-white px-3 py-1 inline-block">
                ৳ {order.total}
              </p>
            ) : (
              <p className="text-base font-black font-mono border-2 border-gray-300 text-gray-400 px-3 py-1 inline-block">
                PREPAID
              </p>
            )}
          </div>
        </div>

        {/* Order Details (SKUs) */}
        <div className="p-4 bg-gray-50 text-[10px] font-mono leading-tight">
          <p className="font-bold mb-1 border-b border-gray-300 pb-1">Order Contents (Ref: {order.orderNumber})</p>
          {order.items.slice(0, 3).map((item, i) => (
            <div key={i} className="flex justify-between py-0.5">
              <span className="truncate pr-2">{item.quantity}x {item.title.substring(0,20)}...</span>
              <span>{item.variantName || item.sku}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="text-gray-500 mt-1 italic">+ {order.items.length - 3} more items</div>
          )}
        </div>

      </div>

      {/* Global Print Styles embedded here so it only affects when this is rendered */}
      <style>{`
        @media print {
          @page { size: 4in 6in; margin: 0; }
          body * { visibility: hidden; }
          .print\\:bg-white { visibility: visible; }
          .print\\:bg-white * { visibility: visible; }
          .print\\:bg-white { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>
  );
}
