/**
 * @file src/components/admin/BusinessDocumentModal.tsx
 * @description Print-ready commercial invoice (Mushak-6.3), packing slip, and courier handover manifest modal
 * @license Apache-2.0
 */

import React, { useRef } from 'react';
import { Printer, Download, X, QrCode, ShieldCheck, CheckCircle2, FileText, Truck, Landmark } from 'lucide-react';
import { Order, SiteContent, TaxVatSummary } from '../../types';

interface BusinessDocumentModalProps {
  type: 'INVOICE' | 'PACKING_SLIP' | 'COURIER_MANIFEST' | 'TAX_STATEMENT';
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Top Control Bar */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-sm font-bold font-serif">
                {type === 'INVOICE' && 'Mushak-6.3 Commercial Tax Invoice'}
                {type === 'PACKING_SLIP' && 'Warehouse Picking & Packing Slip'}
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
          {/* 1. MUSHAK-6.3 COMMERCIAL INVOICE */}
          {/* ========================================================= */}
          {type === 'INVOICE' && order && (
            <div className="space-y-6 text-xs max-w-3xl mx-auto font-sans leading-relaxed">
              {/* Government Header */}
              <div className="text-center border-b border-stone-300 pb-4 space-y-1">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Government of the People's Republic of Bangladesh • National Board of Revenue
                </div>
                <div className="text-xs font-bold text-stone-700">
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • জাতীয় রাজস্ব বোর্ড
                </div>
                <div className="inline-block px-3 py-0.5 bg-stone-100 text-stone-800 font-serif font-bold text-sm rounded border border-stone-300 mt-1">
                  ট্যাক্স চালানপত্র (মূসক-৬.৩) / Tax Invoice (Mushak-6.3)
                </div>
                <div className="text-[10px] text-stone-500">
                  [বিধি ৪০ এর উপ-বিধি (১) এর দফা (গ) দ্রষ্টব্য / Rule 40, Sub-rule (1), Clause (c)]
                </div>
              </div>

              {/* Company & Order Header */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-stone-200">
                <div className="space-y-1">
                  <h1 className="text-base font-serif font-bold text-stone-900 tracking-wide">
                    {siteContent.brandName} <span className="text-xs font-normal text-stone-500 font-sans">({siteContent.brandNameBn})</span>
                  </h1>
                  <p className="text-stone-600 text-[11px]">{siteContent.contact.address}</p>
                  <div className="text-[11px] font-mono pt-1 text-stone-700 space-y-0.5">
                    <div><strong>BIN:</strong> 003920194-0102</div>
                    <div><strong>TIN:</strong> 592819028301</div>
                    <div><strong>Zone:</strong> Dhaka North Commissionerate (Customs, Excise & VAT)</div>
                    <div><strong>Helpline:</strong> {siteContent.contact.phone}</div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block bg-stone-50 border border-stone-200 p-2.5 rounded-lg text-left text-[11px] min-w-[200px]">
                    <div><strong>Invoice No:</strong> <span className="font-mono font-bold">INV-{order.orderNumber.replace('KSH-', '')}</span></div>
                    <div><strong>Challan No:</strong> <span className="font-mono">MUS63-{order.orderNumber}</span></div>
                    <div><strong>Issue Date:</strong> {new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
                    <div><strong>Payment Method:</strong> {order.paymentMethod} ({order.paymentStatus})</div>
                    <div><strong>Courier Tracking:</strong> <span className="font-mono">{order.courier?.consignmentId || 'ST-DIRECT'}</span></div>
                  </div>
                </div>
              </div>

              {/* Customer Shipping & Billing Profile */}
              <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200 grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <span className="font-bold text-stone-500 uppercase tracking-wider block text-[9px]">Buyer / Consignee Information</span>
                  <div className="font-bold text-stone-900 text-xs mt-0.5">{order.customer.name}</div>
                  <div className="text-stone-600">Phone: <span className="font-mono">{order.customer.phone}</span></div>
                  {order.customer.email && <div className="text-stone-600">Email: {order.customer.email}</div>}
                </div>
                <div>
                  <span className="font-bold text-stone-500 uppercase tracking-wider block text-[9px]">Delivery Destination</span>
                  <div className="text-stone-800">{order.shippingAddress.address}</div>
                  <div className="text-stone-600 font-semibold">{order.shippingAddress.thana ? `${order.shippingAddress.thana}, ` : ''}{order.shippingAddress.district}, Bangladesh</div>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-left border-collapse border border-stone-300 text-[11px]">
                <thead>
                  <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-300">
                    <th className="p-2 border-r border-stone-300 w-8 text-center">SL</th>
                    <th className="p-2 border-r border-stone-300">Description of Handcrafted Goods</th>
                    <th className="p-2 border-r border-stone-300 text-center w-16">Qty</th>
                    <th className="p-2 border-r border-stone-300 text-right w-24">Unit (৳)</th>
                    <th className="p-2 border-r border-stone-300 text-center w-14">VAT %</th>
                    <th className="p-2 border-r border-stone-300 text-right w-20">VAT (৳)</th>
                    <th className="p-2 text-right w-28">Total (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {order.items.map((item, idx) => {
                    const itemSub = item.price * item.quantity;
                    const itemVat = Number((itemSub * 0.05).toFixed(2));
                    return (
                      <tr key={idx}>
                        <td className="p-2 border-r border-stone-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border-r border-stone-300">
                          <div className="font-bold text-stone-900">{item.title}</div>
                          <div className="text-[10px] text-stone-500 font-mono">SKU: {item.sku}</div>
                        </td>
                        <td className="p-2 border-r border-stone-300 text-center font-mono">{item.quantity}</td>
                        <td className="p-2 border-r border-stone-300 text-right font-mono">{item.price.toLocaleString()}</td>
                        <td className="p-2 border-r border-stone-300 text-center font-mono text-stone-600">5%</td>
                        <td className="p-2 border-r border-stone-300 text-right font-mono text-stone-600">{itemVat.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold text-stone-900">{itemSub.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Financial Calculation Waterfall */}
              <div className="flex justify-between items-start pt-2">
                <div className="space-y-2 text-[10px] text-stone-500 max-w-sm">
                  <div className="flex items-center gap-1.5 font-mono text-stone-700 bg-stone-100 p-2 rounded border border-stone-200">
                    <QrCode className="w-5 h-5 shrink-0" />
                    <span>VERIFY: NBR-MUS63-{order.orderNumber}-003920194</span>
                  </div>
                  <p>
                    * Certified that the particulars furnished above are true and correct, and the amount indicated represents the actual price charged.
                  </p>
                </div>

                <div className="w-64 space-y-1.5 text-[11px] border border-stone-200 p-3 rounded-lg bg-stone-50">
                  <div className="flex justify-between text-stone-600">
                    <span>Taxable Value / Subtotal:</span>
                    <span className="font-mono font-semibold">৳ {order.subtotal.toLocaleString()}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Promo Discount:</span>
                      <span className="font-mono font-semibold">- ৳ {order.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>Included 5% NBR VAT:</span>
                    <span className="font-mono font-semibold">৳ {Number(((order.subtotal - (order.discount || 0)) * 0.05).toFixed(2)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Delivery & Logistics:</span>
                    <span className="font-mono font-semibold">৳ {order.shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-stone-300 pt-1.5 flex justify-between font-bold text-sm text-stone-900">
                    <span>Net Invoice Total:</span>
                    <span className="font-mono text-teal-900">৳ {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Signature Footer */}
              <div className="grid grid-cols-2 pt-12 text-center text-[10px] text-stone-500">
                <div>
                  <div className="w-44 border-t border-stone-400 mx-auto pt-1 font-semibold text-stone-700">Customer's Acknowledgement</div>
                  <div>Received Goods in Good Condition</div>
                </div>
                <div>
                  <div className="w-44 border-t border-stone-400 mx-auto pt-1 font-semibold text-stone-700">Authorized Signatory</div>
                  <div>For {siteContent.brandName} (Kisholoy Enterprise)</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. PACKING SLIP & WAREHOUSE DISPATCH SLIP */}
          {/* ========================================================= */}
          {type === 'PACKING_SLIP' && order && (
            <div className="space-y-6 text-xs max-w-3xl mx-auto font-sans">
              <div className="flex justify-between items-center border-b border-stone-300 pb-3">
                <div>
                  <h1 className="text-base font-bold text-stone-900 uppercase tracking-wide">
                    Warehouse Picking & Packing Slip
                  </h1>
                  <p className="text-[11px] text-stone-500">Order ID: <strong className="font-mono text-stone-800">{order.orderNumber}</strong></p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded font-bold text-[11px]">
                    {order.paymentMethod === 'COD' ? `COD DUE: ৳${order.total}` : 'PREPAID - DO NOT CHARGE'}
                  </span>
                </div>
              </div>

              {/* Dispatch Logistics Info */}
              <div className="grid grid-cols-2 gap-4 bg-stone-50 p-3.5 rounded-lg border border-stone-200 text-[11px]">
                <div>
                  <span className="font-bold text-stone-500 uppercase text-[9px]">3PL Courier Assignment</span>
                  <div className="font-bold text-stone-900 text-xs mt-0.5">{order.courier?.provider || 'Steadfast Courier Ltd.'}</div>
                  <div>Consignment Code: <strong className="font-mono">{order.courier?.consignmentId || 'ST-AWAITING-DISPATCH'}</strong></div>
                </div>
                <div>
                  <span className="font-bold text-stone-500 uppercase text-[9px]">Recipient & Hub</span>
                  <div className="font-bold text-stone-900">{order.customer.name} ({order.customer.phone})</div>
                  <div className="text-stone-600">{order.shippingAddress.address}, {order.shippingAddress.district}</div>
                </div>
              </div>

              {/* Item Checklist */}
              <table className="w-full text-left border-collapse border border-stone-300 text-[11px]">
                <thead>
                  <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-300">
                    <th className="p-2 border-r border-stone-300 w-10 text-center">Check</th>
                    <th className="p-2 border-r border-stone-300">SKU / Item Title</th>
                    <th className="p-2 border-r border-stone-300 w-24 text-center">Warehouse Bin</th>
                    <th className="p-2 text-center w-16">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border-r border-stone-300 text-center">
                        <div className="w-4 h-4 border-2 border-stone-400 rounded-xs mx-auto"></div>
                      </td>
                      <td className="p-2 border-r border-stone-300">
                        <div className="font-bold text-stone-900">{item.title}</div>
                        <div className="text-[10px] text-stone-500 font-mono">SKU: {item.sku}</div>
                      </td>
                      <td className="p-2 border-r border-stone-300 text-center font-mono text-stone-600">
                        ZONE-A / BIN-{(idx + 1) * 4}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-stone-900 text-sm">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Packaging Standards */}
              <div className="p-3 bg-stone-100 rounded border border-stone-200 text-[10px] text-stone-600 space-y-1">
                <div className="font-bold text-stone-800">Quality Inspection & Eco-Packaging Mandate:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Verify handloom weaves for pulls, loose threads, and intact authenticity tags.</li>
                  <li>Enclose saree in moisture-barrier paper before inserting into Kisholoy signature cotton mailer bag.</li>
                  <li>Affix Steadfast thermal shipping label on top clear surface.</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 pt-8 text-center text-[10px] text-stone-500">
                <div>
                  <div className="w-36 border-t border-stone-400 mx-auto pt-1 font-semibold text-stone-700">Picker Signature</div>
                </div>
                <div>
                  <div className="w-36 border-t border-stone-400 mx-auto pt-1 font-semibold text-stone-700">QC & Packer Signature</div>
                </div>
              </div>
            </div>
          )}

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
                    <th className="p-2 border-r border-stone-300">Consignment ID</th>
                    <th className="p-2 border-r border-stone-300">Order Ref</th>
                    <th className="p-2 border-r border-stone-300">Customer Name & Phone</th>
                    <th className="p-2 border-r border-stone-300">District</th>
                    <th className="p-2 border-r border-stone-300 text-right">COD Due (৳)</th>
                    <th className="p-2 text-center w-16">Rider Tick</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {ordersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-stone-400">No active parcels to manifest</td>
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
                  <div className="w-40 border-t border-stone-400 mx-auto pt-1 font-semibold text-stone-700">Dispatch Executive</div>
                  <div>Kisholoy Central Hub</div>
                </div>
                <div>
                  <div className="w-40 border-t border-stone-400 mx-auto pt-1 font-semibold text-stone-700">Courier Pickup Rider</div>
                  <div>Steadfast Rider Signature & Mobile</div>
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
