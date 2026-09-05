import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Edit2, ExternalLink, Package, Building2, Tag, 
  DollarSign, Activity, Truck, Scale, ShieldCheck, 
  Layers, Plus, Minus, CheckCircle, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { Product, Supplier } from '../../types';
import { useModalA11y } from '../../hooks/useModalA11y';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
  suppliers: Supplier[];
  onAdjustStock: (product: Product, delta: number) => void;
  onToggleStatus: (product: Product, field: 'readyToShip' | 'isFeatured') => void;
  language: 'EN' | 'BN';
}

export function ProductQuickViewModal({
  product,
  onClose,
  onEdit,
  suppliers,
  onAdjustStock,
  onToggleStatus,
  language
}: ProductQuickViewModalProps) {
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: !!product,
    onClose,
    label: 'Product Quick View',
  });

  if (!product) return null;

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const supplier = suppliers.find(s => s.id === product.supplierId);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'];

  const taxRate = product.taxRate || 0;
  const postTaxPrice = product.price - (product.price * (taxRate / 100));
  const unitMarginValue = postTaxPrice - product.costPrice;
  const unitMarginPercent = postTaxPrice > 0 ? ((unitMarginValue / postTaxPrice) * 100).toFixed(1) : '0.0';
  const totalStockRetailVal = product.price * product.stock;
  const totalStockCostVal = product.costPrice * product.stock;

  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);
  const isOutOfStock = product.stock === 0;

  return (
    <div ref={containerRef} {...dialogProps} className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-stone-100">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-200 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-teal-900 text-white rounded-lg">
              <Package className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-stone-900">
                  {language === 'BN' ? 'পণ্য বিস্তারিত দৃশ্য' : 'Product Quick View'}
                </h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                  {product.sku}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                {language === 'BN' ? 'ক্যাটালগ বিশদ, আর্থিক তথ্য ও স্টক নিরীক্ষণ' : 'Catalog details, finance unit economics & stock telemetry'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/product/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-stone-500 hover:text-teal-900 hover:bg-white rounded-lg border border-stone-200 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-medium"
              title={language === 'BN' ? 'লাইভ স্টোরে দেখুন' : 'View on Storefront'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'BN' ? 'লাইভ পেজ' : 'Storefront'}</span>
            </Link>
            <button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="px-3 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'BN' ? 'এডিট করুন' : 'Edit'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 text-sm">
          
          {/* Top Section: Media & Primary Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
            {/* Gallery Column */}
            <div className="sm:col-span-5 space-y-2.5">
              <div className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs">
                <img
                  src={images[activeImageIdx] || images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.badge && (
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-stone-900/80 text-white backdrop-blur-xs tracking-wider uppercase">
                    {language === 'BN' && product.badgeBn ? product.badgeBn : product.badge}
                  </span>
                )}
                {product.isFeatured && (
                  <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                    ★ Featured
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-12 h-12 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                        activeImageIdx === idx ? 'border-teal-900 ring-2 ring-teal-900/20' : 'border-stone-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Core Info Column */}
            <div className="sm:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                    {product.category}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isOutOfStock 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : isLowStock 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isOutOfStock ? '● Out of Stock' : isLowStock ? '▲ Low Stock' : '✔ In Stock'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    product.readyToShip 
                      ? 'bg-teal-50 text-teal-800 border-teal-200' 
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}>
                    {product.readyToShip ? 'Ready to Ship' : 'Catalog Paused'}
                  </span>
                </div>

                <h1 className="text-xl font-serif font-bold text-stone-900 leading-tight">
                  {product.title}
                </h1>
                {product.titleBn && (
                  <p className="font-bangla text-stone-600 text-sm mt-0.5 font-medium">
                    {product.titleBn}
                  </p>
                )}

                <div className="mt-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200/80 leading-relaxed">
                  <p className="font-medium">{product.description || 'No English description provided.'}</p>
                  {product.descriptionBn && (
                    <p className="font-bangla text-stone-500 mt-1 border-t border-stone-200 pt-1">
                      {product.descriptionBn}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Stock Controls */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                    {language === 'BN' ? 'বর্তমান মজুদ (স্টক)' : 'Warehouse Stock Level'}
                  </span>
                  <span className="font-mono text-base font-bold text-stone-900">
                    {product.stock} <span className="text-xs font-normal text-stone-500">units available</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onAdjustStock(product, -1)}
                    disabled={product.stock <= 0}
                    className="p-2 bg-white hover:bg-stone-100 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-stone-200 shadow-2xs transition-colors"
                    title="Decrease Stock (-1)"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onAdjustStock(product, 1)}
                    className="p-2 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 shadow-2xs transition-colors"
                    title="Increase Stock (+1)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onAdjustStock(product, 10)}
                    className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 shadow-2xs text-xs font-bold transition-colors"
                    title="Add 10 units"
                  >
                    +10
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Middle Section: Finance Center Deep Breakdown */}
          <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                  {language === 'BN' ? 'ফিন্যান্স সেন্টার ও ইউনিট ইকোনমিক্স' : 'Finance Center & Unit Economics'}
                </h3>
              </div>
              <span className="text-[10px] text-stone-500 font-medium">
                Connected to Accounts Payable & COGS Ledger
              </span>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Retail Price (MRP)</span>
                <span className="font-mono text-base font-bold text-stone-900">৳ {product.price.toLocaleString()}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[10px] text-stone-400 line-through font-mono block">৳ {product.originalPrice.toLocaleString()}</span>
                )}
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Weaver COGS (Cost)</span>
                <span className="font-mono text-base font-bold text-stone-700">৳ {product.costPrice.toLocaleString()}</span>
                <span className="text-[10px] text-stone-400 block">Base procurement</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Tax / VAT Rate</span>
                <span className="font-mono text-base font-bold text-stone-700">{taxRate}%</span>
                <span className="text-[10px] text-stone-400 block">৳ {(product.price * (taxRate / 100)).toFixed(0)} deducted</span>
              </div>

              <div className={`p-3 rounded-lg border ${
                Number(unitMarginPercent) < 20 
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}>
                <span className="text-[10px] uppercase font-bold block">Post-Tax Margin</span>
                <span className="font-mono text-base font-bold">{unitMarginPercent}%</span>
                <span className="text-[10px] block opacity-80 font-mono">Profit: ৳ {unitMarginValue.toFixed(0)}/unit</span>
              </div>
            </div>

            {/* Inventory capital value */}
            <div className="px-4 py-3 bg-stone-50/50 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-white border border-stone-200">
                <span className="text-stone-600 font-medium">Current Total Retail Stock Valuation:</span>
                <span className="font-mono font-bold text-stone-900">৳ {totalStockRetailVal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white border border-stone-200">
                <span className="text-stone-600 font-medium">Total Sunk Sourcing Capital (COGS):</span>
                <span className="font-mono font-bold text-stone-900">৳ {totalStockCostVal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Sourcing, Logistics & Quick Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier Information Card */}
            <div className="border border-stone-200 rounded-xl p-4 bg-white shadow-2xs space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-teal-800" />
                <h4 className="font-bold text-xs uppercase text-stone-700 tracking-wider">
                  {language === 'BN' ? 'সরবরাহকারী / তাঁতি তথ্য' : 'Supplier & Sourcing Origin'}
                </h4>
              </div>

              {supplier ? (
                <div className="text-xs space-y-1 bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Partner:</span>
                    <span className="font-bold text-stone-900">{supplier.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Supplier Code:</span>
                    <span className="font-mono font-semibold text-stone-700">{supplier.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Contact:</span>
                    <span className="text-stone-700">{supplier.contactPerson} ({supplier.phone})</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded-lg text-xs text-stone-500 border border-stone-200 italic">
                  Internal product / No external supplier linked.
                </div>
              )}
            </div>

            {/* Logistics & Attributes */}
            <div className="border border-stone-200 rounded-xl p-4 bg-white shadow-2xs space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-teal-800" />
                <h4 className="font-bold text-xs uppercase text-stone-700 tracking-wider">
                  {language === 'BN' ? 'লজিস্টিকস ও স্পেসিফিকেশন' : 'Logistics & Specifications'}
                </h4>
              </div>

              <div className="text-xs space-y-1.5 bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div className="flex justify-between">
                  <span className="text-stone-500">Shipping Weight:</span>
                  <span className="font-mono font-semibold text-stone-900">
                    {product.attributes?.weight ? `${product.attributes.weight} kg` : '0.50 kg'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Reorder Alert Threshold:</span>
                  <span className="font-mono font-semibold text-stone-900">
                    {product.lowStockThreshold || 5} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Origin / Craft:</span>
                  <span className="text-stone-800 font-medium">
                    {product.attributes?.origin || 'Bangladesh (Authentic Artisan Handloom)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Visibility Switchers */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-stone-500" />
              <span className="text-xs font-bold text-stone-800">
                {language === 'BN' ? 'দ্রুত স্থিতি পরিবর্তন' : 'Quick Status Toggles:'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleStatus(product, 'readyToShip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  product.readyToShip
                    ? 'bg-teal-900 text-white border-teal-900'
                    : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                }`}
              >
                {product.readyToShip ? '✔ Ready to Ship (Active)' : '○ Paused (Inactive)'}
              </button>

              <button
                onClick={() => onToggleStatus(product, 'isFeatured')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  product.isFeatured
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                }`}
              >
                {product.isFeatured ? '★ Featured Product' : '☆ Standard Item'}
              </button>
            </div>
          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-xs text-stone-400 font-mono">
            ID: {product.id}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-bold transition-colors"
            >
              {language === 'BN' ? 'বন্ধ করুন' : 'Close'}
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="px-4 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'BN' ? 'সম্পূর্ণ সম্পাদনা' : 'Full Edit'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
