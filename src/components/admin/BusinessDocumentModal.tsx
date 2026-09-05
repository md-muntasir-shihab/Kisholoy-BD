/**
 * @file src/components/admin/BusinessDocumentModal.tsx
 * @description Print-ready commercial invoice (Mushak-6.3), packing slip, and courier handover manifest modal
 * @license Apache-2.0
 */

import React, { useRef } from 'react';
import { Printer, Download, X, FileText } from 'lucide-react';
import { Order, SiteContent, TaxVatSummary } from '../../types';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useApp } from '../../context/AppContext';

interface BusinessDocumentModalProps {
  type: 'COURIER_MANIFEST' | 'TAX_STATEMENT';
  order?: Order;
  ordersList?: Order[];
  siteContent: SiteContent;
  taxSummary?: TaxVatSummary;
  onClose: () => void;
}

export function BusinessDocumentModal({
  type,
  order,
  ordersList = [],
  siteContent,
  taxSummary,
  onClose
}: BusinessDocumentModalProps) {
  const { language } = useApp();
  // Courier manifests are handed to a rider, so labels stay bilingual rather
  // than Bengali-only (F-309).
  const isBn = language === 'BN';

  // F-307: mounted only while open, so the dialog is always open here.
  const { containerRef, dialogProps } = useModalA11y({
    open: true,
    onClose,
    label: 'Business document',
  });

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const docData = {
      documentType: type,
      timestamp: new Date().toISOString(),
      order,
      ordersList: ordersList.map(o => ({ orderNumber: o.orderNumber, total: o.total })),
      taxSummary
    };
    const blob = new Blob([JSON.stringify(docData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kisholoy_${type}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={containerRef} {...dialogProps} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .printable-content, .printable-content * { visibility: visible !important; }
          .printable-content { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Top Control Bar */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-sm font-bold font-serif">
                {type === 'COURIER_MANIFEST' && '3PL Courier Handover Manifest'}
                {type === 'TAX_STATEMENT' && 'NBR VAT Compliance Statement (Mushak-6.3 Summary)'}
              </h2>
              <p className="text-[11px] text-stone-400">Printable official e-commerce trade record</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
            </button>
            <button
              onClick={handleDownloadJson}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> JSON Data
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-stone-900 printable-content" ref={printRef}>
          {/* ========================================================= */}
          {/* 3. 3PL COURIER HANDOVER MANIFEST */}
          {/* ========================================================= */}
          {type === 'COURIER_MANIFEST' && (
            <div className="space-y-6 text-xs max-w-3xl mx-auto font-sans">
              <div className="flex justify-between items-center border-b border-stone-300 pb-3">
                <div>
                  <h1 className="text-base font-bold text-stone-900 uppercase tracking-wide">
                    3PL Logistics Bulk Handover Manifest
                  </h1>
                  <p className="text-[11px] text-stone-500">
                    Carrier: <strong>Steadfast Courier Ltd.</strong> • Date: <strong>{new Date().toLocaleDateString('en-GB')}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-3 py-1 rounded border border-stone-300">
                    MNF-ST-{Date.now().toString().slice(-6)}
                  </span>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-stone-300 text-[11px]">
                <thead>
                  <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-300">
                    <th className="p-2 border-r border-stone-300 w-8 text-center">#</th>
                    <th className="p-2 border-r border-stone-300">{isBn ? 'কনসাইনমেন্ট আইডি' : 'Consignment ID'}</th>
                    <th className="p-2 border-r border-stone-300">{isBn ? 'অর্ডার রেফ' : 'Order Ref'}</th>
                    <th className="p-2 border-r border-stone-300">{isBn ? 'গ্রাহকের নাম ও ফোন' : 'Customer Name & Phone'}</th>
                    <th className="p-2 border-r border-stone-300">{isBn ? 'জেলা' : 'District'}</th>
                    <th className="p-2 border-r border-stone-300 text-right">COD Due (৳)</th>
                    <th className="p-2 text-center w-16">{isBn ? 'রাইডার টিক' : 'Rider Tick'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {ordersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-stone-400">{isBn ? 'ম্যানিফেস্ট করার মতো সক্রিয় পার্সেল নেই' : 'No active parcels to manifest'}</td>
                    </tr>
                  ) : (
                    ordersList.map((o, idx) => (
                      <tr key={o.id}>
                        <td className="p-2 border-r border-stone-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border-r border-stone-300 font-mono font-bold text-stone-800">
                          {o.courier?.consignmentId || `ST-CON-992${idx}`}
                        </td>
                        <td className="p-2 border-r border-stone-300 font-mono">{o.orderNumber}</td>
                        <td className="p-2 border-r border-stone-300">
                          <div className="font-semibold text-stone-900">{o.customer.name}</div>
                          <div className="text-[10px] text-stone-500 font-mono">{o.customer.phone}</div>
                        </td>
                        <td className="p-2 border-r border-stone-300">{o.shippingAddress.district}</td>
                        <td className="p-2 border-r border-stone-300 text-right font-mono font-bold">
                          {o.paymentMethod === 'COD' ? `৳ ${o.total.toLocaleString()}` : 'PREPAID'}
                        </td>
                        <td className="p-2 text-center">
                          <div className="w-4 h-4 border border-stone-400 rounded-xs mx-auto"></div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-100 font-bold border-t border-stone-300 text-stone-900">
                    <td colSpan={5} className="p-2 text-right">Total Parcels: {ordersList.length} | Total COD Collection:</td>
                    <td className="p-2 text-right font-mono">
                      ৳ {ordersList.reduce((sum, o) => sum + (o.paymentMethod === 'COD' ? o.total : 0), 0).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>

              <div className="grid grid-cols-2 pt-8 text-center text-[10px] text-stone-500">
                <div>
                  <div className="w-40 border-t border-stone-400 mx-auto pt-1 font-semibold text-stone-700">{isBn ? 'ডিসপ্যাচ এক্সিকিউটিভ' : 'Dispatch Executive'}</div>
                  <div>{isBn ? 'কিশলয় সেন্ট্রাল হাব' : 'Kisholoy Central Hub'}</div>
                </div>
                <div>
                  <div className="w-40 border-t border-stone-400 mx-auto pt-1 font-semibold text-stone-700">{isBn ? 'কুরিয়ার পিকআপ রাইডার' : 'Courier Pickup Rider'}</div>
                  <div>{isBn ? 'স্টেডফাস্ট রাইডার স্বাক্ষর ও মোবাইল' : 'Steadfast Rider Signature & Mobile'}</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. NBR VAT COMPLIANCE STATEMENT */}
          {/* ========================================================= */}
          {type === 'TAX_STATEMENT' && taxSummary && (
            <div className="space-y-6 text-xs max-w-3xl mx-auto font-sans">
              <div className="text-center border-b border-stone-300 pb-4 space-y-1">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  National Board of Revenue (NBR) • Value Added Tax Compliance Report
                </div>
                <h1 className="text-base font-serif font-bold text-stone-900">
                  Monthly VAT Return Summary (Mushak-6.3 Calculation)
                </h1>
                <p className="text-xs text-stone-600">Tax Period: <strong>{taxSummary.taxPeriod}</strong> • BIN: <strong>{taxSummary.binNumber}</strong></p>
              </div>

              <div className="border border-stone-200 rounded-lg divide-y divide-stone-200 text-xs">
                <div className="p-3 flex justify-between bg-stone-50 font-bold text-stone-900">
                  <span>Gross E-Commerce Taxable Sales (5% VAT Retail Category)</span>
                  <span className="font-mono">৳ {taxSummary.grossTaxableSales.toLocaleString()}</span>
                </div>
                <div className="p-3 flex justify-between text-stone-700 pl-6">
                  <span>Standard Output VAT Collected @ 5%</span>
                  <span className="font-mono font-bold text-stone-900">৳ {taxSummary.vatCollected.toLocaleString()}</span>
                </div>
                <div className="p-3 flex justify-between text-stone-700 pl-6">
                  <span>Less: Input Tax Credit / Packaging VAT Rebate</span>
                  <span className="font-mono text-emerald-700">- ৳ {taxSummary.inputTaxRebate.toLocaleString()}</span>
                </div>
                <div className="p-4 flex justify-between bg-stone-900 text-white font-bold text-sm rounded-b-lg">
                  <span>Net VAT Payable to Bangladesh Bank Treasury</span>
                  <span className="font-mono text-teal-300">৳ {taxSummary.netVatPayable.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded border border-stone-200 text-[10px] text-stone-500">
                This document is generated automatically from authoritative immutable sales records for statutory tax filing under the Value Added Tax and Supplementary Duty Act, 2012.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
