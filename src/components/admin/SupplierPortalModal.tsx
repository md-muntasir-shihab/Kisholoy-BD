import React, { useState } from 'react';
import { 
  X, Building2, Package, ShoppingBag, CreditCard, ShieldAlert, 
  CheckCircle2, AlertCircle, Phone, Mail, MapPin, DollarSign, Calendar
} from 'lucide-react';
import { Supplier } from '../../types';
import { useApp } from '../../context/AppContext';
import { useModalA11y } from '../../hooks/useModalA11y';

interface SupplierPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

export const SupplierPortalModal: React.FC<SupplierPortalModalProps> = ({
  isOpen,
  onClose,
  supplier
}) => {
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: isOpen,
    onClose,
    label: 'Supplier Portal',
  });

  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'payments' | 'profile'>('products');

  if (!isOpen || !supplier) return null;

  return (
    <div ref={containerRef} {...dialogProps} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with isolated boundary banner */}
        <div className="bg-amber-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span className="font-bold tracking-wide uppercase">
              {language === 'BN' ? 'আইসোলেটেড সাপ্লায়ার পোর্টাল প্রিভিউ' : 'Isolated Supplier Portal Simulator'}
            </span>
            <span className="bg-amber-800/80 text-amber-200 text-[10px] px-2 py-0.5 rounded-full border border-amber-700">
              Vendor Scoped Boundary
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-amber-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vendor Top Banner */}
        <div className="p-6 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900">{supplier.name}</h2>
                <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-600">
                  {supplier.code}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Portal Enabled
                </span>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-stone-400" /> {supplier.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-stone-400" /> {supplier.email}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Total Supplied</span>
              <span className="font-bold text-stone-800">৳{supplier.totalPurchased?.toLocaleString() || 0}</span>
            </div>
            <div className="w-px h-6 bg-stone-200"></div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Disbursed</span>
              <span className="font-bold text-emerald-700">৳{supplier.totalPaid?.toLocaleString() || 0}</span>
            </div>
            <div className="w-px h-6 bg-stone-200"></div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Outstanding Due</span>
              <span className="font-bold text-amber-700">৳{supplier.outstandingDue?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* Security Warning notice */}
        <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Vendor Isolation Enforced:</strong> This vendor account has zero visibility into customer records, retail sales margins, store settings, or other suppliers.
          </span>
        </div>

        {/* Portal Tabs */}
        <div className="flex border-b border-stone-200 px-6 gap-2 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'border-teal-900 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Supplied Products ({supplier.suppliedProducts?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-teal-900 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Purchase Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-teal-900 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment History & Payables</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-teal-900 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Vendor Profile & Banking</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* TAB 1: SUPPLIED PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-stone-500">
                <span>Products assigned to {supplier.name} for procurement:</span>
                <span className="font-mono">{supplier.suppliedProducts?.length || 0} catalog items</span>
              </div>

              {(!supplier.suppliedProducts || supplier.suppliedProducts.length === 0) ? (
                <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200 text-stone-400">
                  No active products currently linked to this supplier.
                </div>
              ) : (
                <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                  {supplier.suppliedProducts.map((p) => (
                    <div key={p.productId} className="p-3.5 flex items-center justify-between hover:bg-stone-50/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 font-mono text-xs">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900 text-xs">{p.productName}</h4>
                          <span className="text-[10px] text-stone-400 font-mono">{p.sku}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-right">
                        <div>
                          <span className="text-[10px] text-stone-400 block">Supply Cost</span>
                          <span className="font-semibold text-stone-800">৳{p.supplyPrice?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block">Lead Time</span>
                          <span className="font-medium text-stone-600">{p.leadTimeDays || 3} days</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.isPrimarySupplier ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {p.isPrimarySupplier ? 'Primary Supplier' : 'Secondary'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PURCHASE ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-xs">
                <div className="p-3.5 flex items-center justify-between hover:bg-stone-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">PO-2026-081</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        RECEIVED & VERIFIED
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Dispatched on Feb 28, 2026 • 240 Units</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 block">৳142,000</span>
                    <span className="text-[10px] text-emerald-700 font-medium">Fully Paid</span>
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between hover:bg-stone-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">PO-2026-094</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        IN PRODUCTION
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Dispatched on Mar 02, 2026 • 150 Units</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 block">৳95,000</span>
                    <span className="text-[10px] text-amber-800 font-medium">Payment Pending</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS & PAYABLES */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Preferred Payout Channel</span>
                  <span className="font-bold text-stone-900 text-sm mt-1 block">
                    {supplier.bankDetails?.bankName || 'Dutch-Bangla Bank PLC'}
                  </span>
                  <span className="text-[11px] font-mono text-stone-500 block mt-0.5">
                    A/C: {supplier.bankDetails?.accountNumber || '126.120.984712'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Mobile Banking Settlement</span>
                  <span className="font-bold text-stone-900 text-sm mt-1 block">
                    bKash Merchant: {supplier.phone}
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    Disbursement frequency: Weekly Net-15
                  </span>
                </div>
              </div>

              <div className="border border-stone-200 rounded-xl p-3.5 space-y-2">
                <h4 className="font-bold text-stone-900 text-xs">Recent Disbursements</h4>
                <div className="divide-y divide-stone-100 font-mono text-[11px]">
                  <div className="py-2 flex justify-between">
                    <span>TXN-BKASH-891024 (Weekly PO Settlement)</span>
                    <span className="font-bold text-emerald-800">৳75,000 (Feb 25, 2026)</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span>EFT-DBBL-230911 (Raw Material Advance)</span>
                    <span className="font-bold text-emerald-800">৳67,000 (Feb 14, 2026)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium">Business Legal Name</span>
                  <span className="font-semibold text-stone-800">{supplier.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium">Contact Person</span>
                  <span className="font-semibold text-stone-800">{supplier.contactPerson || 'General Manager'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium">Trade License</span>
                  <span className="font-semibold text-stone-800 font-mono">{supplier.tradeLicense || 'TR-DHK-2024-9102'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium">District & Address</span>
                  <span className="font-semibold text-stone-800">{supplier.address}, {supplier.district}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>Logged in as Vendor: {supplier.code}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold transition-colors"
          >
            Exit Portal Simulator
          </button>
        </div>

      </div>
    </div>
  );
};
