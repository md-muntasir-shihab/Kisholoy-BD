/**
 * @file src/components/admin/InvoiceGeneratorModal.tsx
 * @description Advanced Invoice Generator component for Admin Orders with PDF download, print layouts, bilingual Bangla/English support, and NBR Mushak-6.3 compliance.
 * @license Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { 
  Printer, Download, X, FileText, CheckCircle2, QrCode, 
  Building2, Truck, ShieldCheck, Copy, Check, ChevronDown, 
  Settings2, Sliders, RefreshCw, Layers, Sparkles, Hash, Calendar, AlertCircle
} from 'lucide-react';
import { Order, SiteContent } from '../../types';
import { toBanglaDigits, numberToEnglishWords, numberToBanglaWords, generatePdfFromElement } from '../../utils/invoiceUtils';

export type InvoiceTemplateType = 'MUSHAK_6_3' | 'RETAIL_MEMO' | 'BILINGUAL_DELIVERY' | 'PROFORMA';

interface InvoiceGeneratorModalProps {
  initialOrderId?: string;
  order?: Order;
  ordersList: Order[];
  siteContent: SiteContent;
  onClose: () => void;
}

export function InvoiceGeneratorModal({
  initialOrderId,
  order: propOrder,
  ordersList,
  siteContent,
  onClose
}: InvoiceGeneratorModalProps) {
  // Currently selected primary order
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    propOrder?.id || initialOrderId || (ordersList[0]?.id ?? '')
  );

  // Search filter for order selector
  const [orderSearch, setOrderSearch] = useState('');

  // Batch Mode: multi-select orders
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedBatchOrderIds, setSelectedBatchOrderIds] = useState<string[]>(
    propOrder ? [propOrder.id] : ordersList.slice(0, 3).map(o => o.id)
  );

  // Template Type
  const [templateType, setTemplateType] = useState<InvoiceTemplateType>('MUSHAK_6_3');

  // Customization Options
  const [language, setLanguage] = useState<'BILINGUAL' | 'EN' | 'BN'>('BILINGUAL');
  const [showVatBreakdown, setShowVatBreakdown] = useState(true);
  const [showTaxCredentials, setShowTaxCredentials] = useState(true);
  const [showCourierBarcode, setShowCourierBarcode] = useState(true);
  const [showWarehouseHub, setShowWarehouseHub] = useState(true);
  const [showPaymentStamp, setShowPaymentStamp] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [showSignatureBlock, setShowSignatureBlock] = useState(true);
  const [customNotes, setCustomNotes] = useState('');
  const [signatoryName, setSignatoryName] = useState('Md. Rafiqul Islam');
  const [signatoryRole, setSignatoryRole] = useState('Accounts & Logistics Manager');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // UI States
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  // Find active single order
  const activeOrder = useMemo(() => {
    return ordersList.find(o => o.id === selectedOrderId) || propOrder || ordersList[0];
  }, [ordersList, selectedOrderId, propOrder]);

  // Find active batch orders
  const activeBatchOrders = useMemo(() => {
    if (!isBatchMode) return activeOrder ? [activeOrder] : [];
    return ordersList.filter(o => selectedBatchOrderIds.includes(o.id));
  }, [isBatchMode, ordersList, selectedBatchOrderIds, activeOrder]);

  // Filtered orders for selector
  const filteredOrderOptions = useMemo(() => {
    if (!orderSearch.trim()) return ordersList;
    const q = orderSearch.toLowerCase();
    return ordersList.filter(o => 
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.phone.includes(q)
    );
  }, [ordersList, orderSearch]);

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsDownloadingPdf(true);
    setDownloadProgress('Preparing document layout...');

    const fileName = isBatchMode 
      ? `Kisholoy_Batch_Invoices_${activeBatchOrders.length}_Orders_${Date.now()}`
      : `Kisholoy_Invoice_${activeOrder?.orderNumber || 'Document'}`;

    try {
      await generatePdfFromElement(documentRef.current, fileName, (msg) => {
        setDownloadProgress(msg);
      });
    } finally {
      setIsDownloadingPdf(false);
      setDownloadProgress('');
    }
  };

  const handleDownloadJson = () => {
    const data = {
      generator: 'Kisholoy Invoice Engine',
      template: templateType,
      language,
      generatedAt: new Date().toISOString(),
      orders: activeBatchOrders.map(o => ({
        orderNumber: o.orderNumber,
        customer: o.customer,
        shippingAddress: o.shippingAddress,
        items: o.items,
        financials: {
          subtotal: o.subtotal,
          discount: o.discount,
          shippingFee: o.shippingFee,
          total: o.total,
          estimatedVat5Pct: Math.round(o.subtotal * 0.05 / 1.05)
        },
        courier: o.courier,
        fulfillment: o.fulfillment
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_Data_${isBatchMode ? 'Batch' : activeOrder?.orderNumber}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    if (!activeOrder) return;
    const summary = `🧾 KISHOLOY Invoice Summary
Order Number: ${activeOrder.orderNumber}
Customer: ${activeOrder.customer.name} (${activeOrder.customer.phone})
Address: ${activeOrder.shippingAddress.address}, ${activeOrder.shippingAddress.thana}, ${activeOrder.shippingAddress.district}
Items (${activeOrder.items.length}): ${activeOrder.items.map(i => `${i.title} (x${i.quantity})`).join(', ')}
Total Payable: ৳${activeOrder.total.toLocaleString()} (${activeOrder.paymentMethod} • ${activeOrder.paymentStatus})
Courier: ${activeOrder.courier.provider} (Tracking: ${activeOrder.courier.trackingId || 'Pending'})
Assigned Hub: ${activeOrder.fulfillment?.assignedWarehouseName || 'Dhaka Central Hub'}
Helpline: ${siteContent.contact.phone}`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const toggleBatchOrder = (id: string) => {
    setSelectedBatchOrderIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* ========================================================= */}
        {/* MODAL TOP CONTROL BAR (NO PRINT) */}
        {/* ========================================================= */}
        <div className="p-4 bg-stone-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-serif text-white tracking-wide">
                  Commercial Invoice & Challan Generator
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-900/80 text-teal-300 border border-teal-700">
                  NBR Mushak-6.3 Ready
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Generate, customize, and export printable official tax invoices and retail cash memos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-700"
              title="Copy SMS/WhatsApp Order Summary"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON Data</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {isDownloadingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? (downloadProgress || 'Exporting PDF...') : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-white text-stone-900 hover:bg-stone-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-stone-900" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY: CONFIGURATION SIDEBAR + LIVE PREVIEW CANVAS */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-stone-100">
          
          {/* ------------------------------------------------------- */}
          {/* LEFT SIDEBAR: GENERATOR SETTINGS & CONTROLS (NO PRINT) */}
          {/* ------------------------------------------------------- */}
          <div className="w-full lg:w-80 bg-white border-r border-stone-200 p-4 overflow-y-auto space-y-5 text-xs no-print shadow-xs">
            
            {/* Mode Switcher: Single vs Batch */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-500 tracking-wider mb-2">
                Generation Mode
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsBatchMode(false)}
                  className={`py-1.5 px-3 rounded-lg font-bold transition-all text-center ${
                    !isBatchMode ? 'bg-white text-teal-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Single Order
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchMode(true)}
                  className={`py-1.5 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 ${
                    isBatchMode ? 'bg-white text-teal-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Layers className="w-3 h-3" /> Batch ({selectedBatchOrderIds.length})
                </button>
              </div>
            </div>

            {/* Order Selector */}
            {!isBatchMode ? (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase text-stone-500 tracking-wider">
                  Select Order
                </label>
                <input
                  type="text"
                  placeholder="Filter by #, name, phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full p-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-teal-700 bg-stone-50/50 mb-1"
                />
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg font-mono font-medium text-stone-900 bg-white focus:outline-none focus:border-teal-700"
                >
                  {filteredOrderOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.customer.name} (৳{o.total.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold uppercase text-stone-500 tracking-wider">
                    Select Batch Orders
                  </label>
                  <span className="text-[10px] text-teal-800 font-bold">
                    {selectedBatchOrderIds.length} Selected
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-stone-50 rounded-xl border border-stone-200">
                  {ordersList.map((o) => {
                    const checked = selectedBatchOrderIds.includes(o.id);
                    return (
                      <label 
                        key={o.id} 
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-[11px] transition-colors ${
                          checked ? 'bg-teal-50 text-teal-900 font-semibold' : 'hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleBatchOrder(o.id)}
                          className="rounded text-teal-700 focus:ring-teal-700"
                        />
                        <span className="font-mono">{o.orderNumber}</span>
                        <span className="truncate flex-1 text-stone-500">{o.customer.name}</span>
                        <span className="font-mono font-bold">৳{o.total.toLocaleString()}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Template Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase text-stone-500 tracking-wider">
                Invoice Template
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'MUSHAK_6_3', label: 'NBR Mushak-6.3 Tax Invoice', desc: 'Government tax challan format' },
                  { id: 'RETAIL_MEMO', label: 'Commercial Retail Memo', desc: 'Standard customer packing bill' },
                  { id: 'BILINGUAL_DELIVERY', label: 'Bilingual Delivery Challan', desc: 'Bangla & English side-by-side' },
                  { id: 'PROFORMA', label: 'Proforma / Quotation Bill', desc: 'Advance verification draft' }
                ].map((t) => (
                  <label
                    key={t.id}
                    className={`block p-2.5 rounded-xl border cursor-pointer transition-all ${
                      templateType === t.id
                        ? 'border-teal-700 bg-teal-50/50 text-teal-950 font-semibold shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="templateType"
                        value={t.id}
                        checked={templateType === t.id}
                        onChange={() => setTemplateType(t.id as InvoiceTemplateType)}
                        className="text-teal-700 focus:ring-teal-700"
                      />
                      <div>
                        <div className="text-xs">{t.label}</div>
                        <div className="text-[10px] text-stone-500 font-normal">{t.desc}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase text-stone-500 tracking-wider">
                Document Language
              </label>
              <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-center font-bold">
                <button
                  type="button"
                  onClick={() => setLanguage('BILINGUAL')}
                  className={`py-1 rounded-lg ${language === 'BILINGUAL' ? 'bg-white text-teal-950 shadow-xs' : 'text-stone-600'}`}
                >
                  Bilingual
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('EN')}
                  className={`py-1 rounded-lg ${language === 'EN' ? 'bg-white text-teal-950 shadow-xs' : 'text-stone-600'}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('BN')}
                  className={`py-1 rounded-lg font-bangla ${language === 'BN' ? 'bg-white text-teal-950 shadow-xs' : 'text-stone-600'}`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Customization Toggles */}
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <label className="block text-[11px] font-bold uppercase text-stone-500 tracking-wider">
                Custom Content & Stamps
              </label>
              
              <div className="space-y-1.5 text-stone-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showVatBreakdown}
                    onChange={(e) => setShowVatBreakdown(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-700"
                  />
                  <span>NBR 5% VAT Calculation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTaxCredentials}
                    onChange={(e) => setShowTaxCredentials(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-700"
                  />
                  <span>Show Seller BIN, TIN & Trade License</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWarehouseHub}
                    onChange={(e) => setShowWarehouseHub(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-700"
                  />
                  <span>Show Hub & Bin Location (Phase 13)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCourierBarcode}
                    onChange={(e) => setShowCourierBarcode(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-700"
                  />
                  <span>Show Courier Barcode & Consignment</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPaymentStamp}
                    onChange={(e) => setShowPaymentStamp(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-700"
                  />
                  <span>Show Payment Stamp Watermark</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSignatureBlock}
                    onChange={(e) => setShowSignatureBlock(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-700"
                  />
                  <span>Authorized Signature Lines</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTerms}
                    onChange={(e) => setShowTerms(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-700"
                  />
                  <span>Return & Warranty Policy</span>
                </label>
              </div>
            </div>

            {/* Custom Notes & Signatory */}
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Issue Date Override
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-stone-50 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Authorized Signatory
                </label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder="Officer Name"
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-stone-50 focus:outline-none focus:border-teal-700 mb-1"
                />
                <input
                  type="text"
                  value={signatoryRole}
                  onChange={(e) => setSignatoryRole(e.target.value)}
                  placeholder="Designation"
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-stone-50 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Special Admin Instructions / Notes
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Fragile silk apparel. Handle with care. Verify OTP upon COD handover."
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-stone-50 focus:outline-none focus:border-teal-700"
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* RIGHT PREVIEW: HIGH-FIDELITY A4 DOCUMENT CANVAS */}
          {/* ------------------------------------------------------- */}
          <div className="flex-1 p-4 sm:p-8 overflow-y-auto flex flex-col items-center bg-stone-200/80">
            
            {/* Batch Info banner */}
            {isBatchMode && (
              <div className="w-full max-w-[210mm] mb-4 bg-teal-900 text-white p-3 rounded-xl flex items-center justify-between text-xs no-print shadow-md">
                <div className="flex items-center gap-2 font-medium">
                  <Layers className="w-4 h-4 text-teal-300" />
                  <span>Batch Invoicing Active: Rendering <strong>{activeBatchOrders.length}</strong> invoices in consecutive A4 pages.</span>
                </div>
                <button
                  onClick={handleDownloadPdf}
                  className="px-3 py-1 bg-white text-teal-950 font-bold rounded-lg hover:bg-stone-100"
                >
                  Download All ({activeBatchOrders.length})
                </button>
              </div>
            )}

            {/* The Document Container that is captured for PDF or sent to Print */}
            <div 
              ref={documentRef}
              className="w-full max-w-[210mm] space-y-8 printable-invoice-container"
            >
              {activeBatchOrders.map((order, orderIndex) => {
                const subtotal = order.subtotal;
                const shippingFee = order.shippingFee;
                const discount = order.discount;
                const grandTotal = order.total;

                // NBR VAT 5% inclusive extraction or calculation
                const vatRatePct = 5;
                const vatAmount = Math.round((subtotal * vatRatePct) / (100 + vatRatePct));
                const taxableBase = subtotal - vatAmount;

                const isPaid = order.paymentStatus === 'PAID';
                const isCod = order.paymentMethod === 'COD';

                return (
                  <div
                    key={order.id}
                    className="bg-white text-stone-900 p-8 sm:p-10 rounded-xl shadow-xl border border-stone-300 print:border-none print:shadow-none print:p-0 print:m-0 space-y-6 text-xs font-sans relative overflow-hidden"
                    style={{ minHeight: '297mm', pageBreakAfter: orderIndex < activeBatchOrders.length - 1 ? 'always' : 'auto' }}
                  >
                    
                    {/* Watermark Payment Stamp */}
                    {showPaymentStamp && (
                      <div className="absolute right-12 top-28 pointer-events-none opacity-15 rotate-[-12deg] z-0 select-none">
                        <div className={`border-4 rounded-xl px-6 py-2 text-center font-black tracking-widest uppercase font-mono ${
                          isPaid ? 'border-emerald-700 text-emerald-800 text-3xl' :
                          isCod ? 'border-amber-700 text-amber-800 text-2xl' : 'border-stone-700 text-stone-800 text-2xl'
                        }`}>
                          {isPaid ? 'PAID & VERIFIED' : isCod ? `COD: COLLECT ৳${grandTotal.toLocaleString()}` : 'PAYMENT PENDING'}
                        </div>
                      </div>
                    )}

                    {/* ========================================== */}
                    {/* 1. DOCUMENT HEADER */}
                    {/* ========================================== */}
                    {templateType === 'MUSHAK_6_3' && (
                      <div className="text-center border-b border-stone-300 pb-4 space-y-1">
                        <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest font-bangla">
                          গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • জাতীয় রাজস্ব বোর্ড
                        </div>
                        <div className="text-xs text-stone-600 font-serif font-semibold">
                          Government of the People's Republic of Bangladesh • National Board of Revenue
                        </div>
                        <div className="inline-block px-4 py-1 bg-stone-100 rounded-md font-bold text-sm text-stone-900 border border-stone-300 mt-1">
                          কর চালানপত্র (মুসক-৬.৩) / TAX INVOICE (MUSHAK-6.3)
                        </div>
                        <div className="text-[10px] text-stone-500 italic">
                          [মূল্য সংযোজন কর ও সম্পূরক শুল্ক বিধিমালা, ২০১৬ এর বিধি ৪৭ এর উপ-বিধি (১) এর দফা (গ) দ্রষ্টব্য]
                        </div>
                      </div>
                    )}

                    {templateType === 'RETAIL_MEMO' && (
                      <div className="flex justify-between items-center border-b-2 border-teal-900 pb-4">
                        <div>
                          <h1 className="text-2xl font-serif font-black text-teal-950 tracking-wide">
                            {siteContent.brandName.toUpperCase()}
                          </h1>
                          <p className="text-xs text-stone-600 font-bangla font-medium">
                            {siteContent.brandNameBn} • {siteContent.tagline}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="px-3 py-1 bg-teal-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                            Commercial Retail Memo
                          </div>
                          <div className="text-[11px] font-mono text-stone-600 mt-1 font-bold">
                            Challan #: {order.orderNumber}
                          </div>
                        </div>
                      </div>
                    )}

                    {templateType === 'BILINGUAL_DELIVERY' && (
                      <div className="flex justify-between items-center border-b-2 border-stone-800 pb-4">
                        <div>
                          <div className="text-xl font-serif font-black text-stone-900">
                            {siteContent.brandName} | <span className="font-bangla font-bold">{siteContent.brandNameBn}</span>
                          </div>
                          <div className="text-[11px] text-stone-600">
                            E-Commerce Delivery Challan & Dispatch Bill
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 bg-stone-900 text-white font-bold text-xs rounded">
                            ডেলিভারি চালান / DELIVERY INVOICE
                          </span>
                        </div>
                      </div>
                    )}

                    {templateType === 'PROFORMA' && (
                      <div className="flex justify-between items-center border-b border-stone-300 pb-4">
                        <div>
                          <h1 className="text-xl font-serif font-black text-stone-900">{siteContent.brandName}</h1>
                          <p className="text-xs text-stone-500">Commercial Proforma Quotation & Booking Invoice</p>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded">
                            PROFORMA INVOICE
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ========================================== */}
                    {/* 2. SELLER & BUYER DETAILS */}
                    {/* ========================================== */}
                    <div className="grid grid-cols-2 gap-6 pt-1">
                      {/* Registered Seller Information */}
                      <div className="space-y-1 text-stone-700">
                        <div className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-teal-800" />
                          <span>নিবন্ধিত সরবরাহকারীর বিবরণ / Registered Seller</span>
                        </div>
                        <div className="font-bold text-stone-900">{siteContent.brandName} ({siteContent.brandNameBn})</div>
                        <div>{siteContent.contact.address}</div>
                        <div>হটলাইন / Phone: <span className="font-mono">{siteContent.contact.phone}</span></div>
                        <div>ইমেইল / Email: {siteContent.contact.email}</div>
                        
                        {showTaxCredentials && (
                          <div className="pt-1.5 space-y-0.5 text-[11px] font-mono text-stone-800 border-t border-stone-200/80">
                            <div><strong>BIN:</strong> 002948192-0101 (Large Taxpayers Unit, VAT)</div>
                            <div><strong>TIN:</strong> 719284019283 / Circle 11, Dhaka</div>
                            <div><strong>Trade License:</strong> {siteContent.tradeLicense || 'TRAD/DNCC/092812/2024'}</div>
                          </div>
                        )}
                      </div>

                      {/* Customer / Buyer Information */}
                      <div className="space-y-1 text-stone-700">
                        <div className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-800" />
                          <span>ক্রেতার বিবরণ / Consignee & Delivery To</span>
                        </div>
                        <div className="font-bold text-stone-900 text-sm">{order.customer.name}</div>
                        <div>ফোন / Mobile: <strong className="font-mono text-stone-900">{order.customer.phone}</strong></div>
                        {order.customer.email && <div>ইমেইল: {order.customer.email}</div>}
                        <div>ঠিকানা / Address: {order.shippingAddress.address}</div>
                        <div>
                          {order.shippingAddress.thana}, {order.shippingAddress.district}, {order.shippingAddress.division}
                        </div>
                        <div className="text-[11px] font-mono text-stone-500 pt-1">
                          Customer ID: {order.customer.id || 'CUST-GUEST'}
                        </div>
                      </div>
                    </div>

                    {/* ========================================== */}
                    {/* 3. INVOICE META BAR & COURIER LOGISTICS */}
                    {/* ========================================== */}
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                      <div>
                        <span className="text-stone-500 block text-[10px] uppercase font-bold">চালান নং / Invoice #</span>
                        <span className="font-mono font-bold text-stone-900 text-xs">{order.orderNumber}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[10px] uppercase font-bold">ইস্যুর তারিখ / Issue Date</span>
                        <span className="font-mono font-semibold text-stone-900">{customDate}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[10px] uppercase font-bold">পেমেন্ট মেথড / Payment</span>
                        <span className="font-bold text-stone-900">
                          {order.paymentMethod} • <span className={isPaid ? 'text-emerald-700' : 'text-amber-800'}>{order.paymentStatus}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[10px] uppercase font-bold">কুরিয়ার / Courier 3PL</span>
                        <span className="font-bold text-stone-900">
                          {order.courier.provider} {order.courier.trackingId ? `(${order.courier.trackingId})` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Warehouse Hub Fulfillment Metadata (Phase 13) */}
                    {showWarehouseHub && order.fulfillment && (
                      <div className="p-2.5 bg-teal-50/70 rounded-lg border border-teal-200/80 flex items-center justify-between text-[11px] text-teal-950">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-teal-700" />
                          <span>
                            Fulfillment Hub: <strong>{order.fulfillment.assignedWarehouseName}</strong> ({order.fulfillment.assignedWarehouseCode})
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-teal-800">
                          Routing: {order.fulfillment.routingReason}
                        </div>
                      </div>
                    )}

                    {/* ========================================== */}
                    {/* 4. LINE ITEMS TABLE */}
                    {/* ========================================== */}
                    <div className="overflow-hidden rounded-lg border border-stone-300">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-stone-100 text-stone-800 font-bold uppercase tracking-wider text-[10px] border-b border-stone-300">
                          <tr>
                            <th className="p-2.5 text-center w-10">ক্র. / #</th>
                            <th className="p-2.5">পণ্য ও সেবার বিবরণ / Description & SKU</th>
                            <th className="p-2.5 text-right w-24">একক মূল্য / Unit (৳)</th>
                            <th className="p-2.5 text-center w-16">পরিমাণ / Qty</th>
                            <th className="p-2.5 text-right w-24">মোট মূল্য / Total (৳)</th>
                            {showVatBreakdown && <th className="p-2.5 text-right w-20">ভ্যাট / VAT (5%)</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {order.items.map((it, idx) => {
                            const lineTotal = it.price * it.quantity;
                            const lineVat = Math.round((lineTotal * vatRatePct) / (100 + vatRatePct));
                            return (
                              <tr key={idx} className="hover:bg-stone-50/50">
                                <td className="p-2.5 text-center font-mono text-stone-500 font-medium">
                                  {language === 'BN' ? toBanglaDigits(idx + 1) : idx + 1}
                                </td>
                                <td className="p-2.5">
                                  <div className="font-bold text-stone-900">
                                    {language === 'BN' ? (it.titleBn || it.title) : it.title}
                                  </div>
                                  <div className="text-[10px] text-stone-500 font-mono">
                                    SKU: {it.sku} {it.variantName ? `• ${it.variantName}` : ''}
                                  </div>
                                </td>
                                <td className="p-2.5 text-right font-mono font-medium">
                                  {language === 'BN' ? toBanglaDigits(it.price.toLocaleString()) : it.price.toLocaleString()}
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold">
                                  {language === 'BN' ? toBanglaDigits(it.quantity) : it.quantity}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-stone-900">
                                  {language === 'BN' ? toBanglaDigits(lineTotal.toLocaleString()) : lineTotal.toLocaleString()}
                                </td>
                                {showVatBreakdown && (
                                  <td className="p-2.5 text-right font-mono text-stone-600 text-[11px]">
                                    {language === 'BN' ? toBanglaDigits(lineVat.toLocaleString()) : lineVat.toLocaleString()}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* ========================================== */}
                    {/* 5. TOTALS BREAKDOWN & AMOUNT IN WORDS */}
                    {/* ========================================== */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                      
                      {/* Left Column: Words, Bank & Courier Barcode */}
                      <div className="sm:col-span-7 space-y-3">
                        {/* Amount In Words */}
                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                          <div className="text-[10px] font-bold text-stone-500 uppercase">কথায় / Amount in Words:</div>
                          <div className="font-bold text-stone-900 font-bangla text-xs mt-0.5">
                            {numberToBanglaWords(grandTotal)}
                          </div>
                          {language !== 'BN' && (
                            <div className="text-[11px] text-stone-600 italic">
                              ({numberToEnglishWords(grandTotal)})
                            </div>
                          )}
                        </div>

                        {/* Courier Consignment Barcode visual */}
                        {showCourierBarcode && (
                          <div className="p-2.5 bg-white rounded-lg border border-stone-300 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold uppercase text-stone-500">3PL Tracking & Barcode</div>
                              <div className="font-mono font-bold text-stone-900 text-xs">
                                {order.courier.trackingId || `STDF-${order.orderNumber.replace(/[^0-9]/g, '')}`}
                              </div>
                              <div className="text-[9px] text-stone-400">Scan for automated transit scan</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Visual Simulated Barcode */}
                              <div className="h-8 flex items-center gap-0.5 bg-stone-100 p-1 rounded border border-stone-300 font-mono text-[9px]">
                                <span className="w-1 h-6 bg-black block" />
                                <span className="w-0.5 h-6 bg-black block" />
                                <span className="w-1.5 h-6 bg-black block" />
                                <span className="w-0.5 h-6 bg-black block" />
                                <span className="w-2 h-6 bg-black block" />
                                <span className="w-0.5 h-6 bg-black block" />
                                <span className="w-1 h-6 bg-black block" />
                                <span className="w-1.5 h-6 bg-black block" />
                              </div>
                              <QrCode className="w-8 h-8 text-stone-800" />
                            </div>
                          </div>
                        )}

                        {/* Custom Admin Remarks */}
                        {customNotes && (
                          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-950">
                            <strong>বিশেষ নির্দেশনাবলী / Remarks:</strong> {customNotes}
                          </div>
                        )}
                      </div>

                      {/* Right Column: Calculations */}
                      <div className="sm:col-span-5 bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
                        <div className="flex justify-between text-stone-600">
                          <span>পণ্য উপ-মোট / Subtotal:</span>
                          <span className="font-mono font-semibold">৳ {subtotal.toLocaleString()}</span>
                        </div>

                        {discount > 0 && (
                          <div className="flex justify-between text-emerald-700 font-medium">
                            <span>বিশেষ ছাড় / Discount:</span>
                            <span className="font-mono">- ৳ {discount.toLocaleString()}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-stone-600">
                          <span>ডেলিভারি চার্জ / Shipping Fee:</span>
                          <span className="font-mono font-semibold">৳ {shippingFee.toLocaleString()}</span>
                        </div>

                        {showVatBreakdown && (
                          <div className="pt-1.5 border-t border-stone-200/80 space-y-1 text-[11px] text-stone-500">
                            <div className="flex justify-between">
                              <span>করযোগ্য মূল্য / Taxable Base:</span>
                              <span className="font-mono">৳ {taxableBase.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>মূল্য সংযোজন কর (৫%) / VAT (5%):</span>
                              <span className="font-mono">৳ {vatAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        )}

                        {order.advancePaymentAmount && order.advancePaymentAmount > 0 && (
                          <div className="flex justify-between text-teal-800 font-semibold pt-1 border-t border-stone-200">
                            <span>অগ্রিম পরিশোধ / Advance Paid:</span>
                            <span className="font-mono">- ৳ {order.advancePaymentAmount.toLocaleString()}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center font-bold text-sm text-stone-900 pt-2 border-t-2 border-stone-300">
                          <span>সর্বমোট প্রদেয় / Total Due:</span>
                          <span className="font-mono text-base text-teal-950">
                            ৳ {grandTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ========================================== */}
                    {/* 6. TERMS & CONDITIONS */}
                    {/* ========================================== */}
                    {showTerms && (
                      <div className="pt-2 border-t border-stone-200 text-[10px] text-stone-500 space-y-1">
                        <div className="font-bold text-stone-700 uppercase">শর্তাবলী ও রিটার্ন পলিসি / Terms & Return Policy:</div>
                        <ul className="list-disc pl-4 space-y-0.5 leading-normal">
                          <li>পণ্য গ্রহণের সময় ডেলিভারি এজেন্টের উপস্থিতিতে পণ্য ও চালান মিলিয়ে গ্রহণ করুন।</li>
                          <li>কোনো ত্রুটি বা অমিল থাকলে আনবক্সিং ভিডিও ধারণ করুন এবং ২৪ ঘণ্টার মধ্যে আমাদের হেল্পলাইনে ({siteContent.contact.phone}) যোগাযোগ করুন।</li>
                          <li>এটি একটি সরকারিভাবে স্বীকৃত ডিজিটাল ভ্যাট চালানপত্র। অনুমোদিত সিল ও স্বাক্ষর ব্যতিরেকে কোনো হস্তাক্ষর গ্রহণ করা হয় না।</li>
                        </ul>
                      </div>
                    )}

                    {/* ========================================== */}
                    {/* 7. SIGNATURE BLOCK */}
                    {/* ========================================== */}
                    {showSignatureBlock && (
                      <div className="pt-8 grid grid-cols-3 gap-8 text-center text-xs">
                        <div className="space-y-1">
                          <div className="border-b border-stone-400 pb-1 h-8 flex items-end justify-center font-serif italic text-stone-600 text-xs">
                            System Generated
                          </div>
                          <div className="font-bold text-stone-800 text-[11px]">প্রস্তুতকারকের স্বাক্ষর</div>
                          <div className="text-[10px] text-stone-400">Prepared By</div>
                        </div>

                        <div className="space-y-1">
                          <div className="border-b border-stone-400 pb-1 h-8 flex items-end justify-center font-mono font-bold text-teal-900 text-xs">
                            {signatoryName}
                          </div>
                          <div className="font-bold text-stone-800 text-[11px]">অনুমোদিত কর্মকর্তার স্বাক্ষর ও সিল</div>
                          <div className="text-[10px] text-stone-500">{signatoryRole}</div>
                        </div>

                        <div className="space-y-1">
                          <div className="border-b border-stone-400 pb-1 h-8" />
                          <div className="font-bold text-stone-800 text-[11px]">গ্রাহকের স্বাক্ষর</div>
                          <div className="text-[10px] text-stone-400">Customer / Receiver's Signature</div>
                        </div>
                      </div>
                    )}

                    {/* Document Footer */}
                    <div className="text-center text-[9px] text-stone-400 pt-2 border-t border-stone-100">
                      This electronic tax invoice was generated by KISHOLOY Business OS • {new Date().toLocaleString()} • Page {orderIndex + 1} of {activeBatchOrders.length}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
