import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Printer, Download, Building2, Phone, Mail, Calendar, 
  DollarSign, CheckCircle2, AlertCircle, Layers, RefreshCw
} from 'lucide-react';
import { SupplierStatement } from '../../types';
import { useApp } from '../../context/AppContext';

interface SupplierStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string | null;
}

export const SupplierStatementModal: React.FC<SupplierStatementModalProps> = ({
  isOpen,
  onClose,
  supplierId
}) => {
  const { language } = useApp();
  const [statement, setStatement] = useState<SupplierStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);

  const loadStatement = async () => {
    if (!supplierId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/statement?periodStart=${periodStart}&periodEnd=${periodEnd}`);
      const data = await res.json();
      if (data.success) {
        setStatement(data.statement);
      }
    } catch (err) {
      console.error('Failed to load supplier statement', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && supplierId) {
      loadStatement();
    }
  }, [isOpen, supplierId]);

  if (!isOpen || !supplierId) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-stone-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs">
            <FileText className="w-4 h-4 text-teal-300" />
            <span className="font-bold tracking-wide uppercase">
              {language === 'BN' ? 'সরবরাহকারী আর্থিক স্টেটমেন্ট' : 'Supplier Commercial & Financial Statement'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Selector for Statement */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700">Period:</span>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="border border-stone-300 rounded px-2 py-1 bg-white"
            />
            <span className="text-stone-400">to</span>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="border border-stone-300 rounded px-2 py-1 bg-white"
            />
            <button
              onClick={loadStatement}
              className="px-2.5 py-1 bg-teal-900 text-white rounded font-semibold text-xs flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Update
            </button>
          </div>
        </div>

        {/* Printable Statement Document Content */}
        <div className="p-8 overflow-y-auto space-y-6 text-stone-800">
          {statement && (
            <>
              {/* Statement Header */}
              <div className="flex items-start justify-between border-b border-stone-300 pb-6">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-stone-900">KISHOLOY</h1>
                  <p className="text-xs text-stone-500 font-medium">Authentic Bangladeshi Craft & Apparel E-Commerce</p>
                  <p className="text-[11px] text-stone-400 mt-1">Tejgaon I/A, Dhaka 1208, Bangladesh | support@kisholoy.com</p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-2.5 py-1 rounded bg-teal-50 border border-teal-200 text-teal-950 font-bold text-xs uppercase tracking-wider">
                    Official Supplier Statement
                  </div>
                  <div className="text-xs text-stone-500 mt-2 font-mono">
                    Date: {new Date(statement.generatedAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-stone-500 font-mono">
                    Period: {new Date(statement.periodStart).toLocaleDateString()} – {new Date(statement.periodEnd).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Vendor & Account Info */}
              <div className="grid grid-cols-2 gap-6 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Vendor Account</span>
                  <div className="font-bold text-stone-900 text-sm">{statement.supplier.companyName}</div>
                  <div className="text-stone-600 font-mono mt-0.5">Code: {statement.supplier.code}</div>
                  <div className="text-stone-600 mt-0.5">{statement.supplier.contactPerson} | {statement.supplier.phone}</div>
                  <div className="text-stone-500 mt-0.5">{statement.supplier.address}</div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Financial Terms</span>
                  <div className="text-stone-700 font-medium">Payment Terms: <strong>{statement.supplier.paymentTerms || 'NET_30'}</strong></div>
                  <div className="text-stone-700 font-medium mt-1">Trade License: {statement.supplier.tradeLicenseNumber || 'Verified'}</div>
                  <div className="text-stone-700 font-medium mt-1">TIN: {statement.supplier.taxIdentificationNumber || 'On Record'}</div>
                </div>
              </div>

              {/* Financial Balance Summary Banner */}
              <div className="grid grid-cols-4 gap-3 bg-stone-900 text-white p-4 rounded-xl font-mono text-center">
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block font-sans">Gross Goods Supplied</span>
                  <span className="text-base font-bold">৳{statement.summary.totalSuppliedValue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block font-sans">Eligible Sales Share</span>
                  <span className="text-base font-bold text-emerald-400">৳{statement.summary.totalSupplierEarnings.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block font-sans">Total Disbursed</span>
                  <span className="text-base font-bold text-teal-300">৳{statement.summary.totalPaidOut.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-amber-300 block font-sans font-bold">Current Net Due</span>
                  <span className="text-base font-bold text-amber-300">৳{statement.summary.currentOutstandingDue.toLocaleString()}</span>
                </div>
              </div>

              {/* Batches Intake Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-800" />
                  Supply Batches Delivered ({statement.batches.length})
                </h3>
                <table className="w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden font-mono">
                  <thead className="bg-stone-100 text-[10px] text-stone-600 uppercase border-b border-stone-200">
                    <tr>
                      <th className="p-2">Batch No</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Product Name</th>
                      <th className="p-2 text-right">Qty Received</th>
                      <th className="p-2 text-right">Qty Sold</th>
                      <th className="p-2 text-right">Unit Cost</th>
                      <th className="p-2 text-right">Total Batch Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {statement.batches.map(b => (
                      <tr key={b.id} className="text-stone-700">
                        <td className="p-2 font-mono font-bold">{b.batchNumber}</td>
                        <td className="p-2 font-mono text-[11px]">{new Date(b.receivedDate).toLocaleDateString()}</td>
                        <td className="p-2">{b.productName}</td>
                        <td className="p-2 text-right font-mono">{b.receivedQuantity}</td>
                        <td className="p-2 text-right font-mono">{b.soldQuantity}</td>
                        <td className="p-2 text-right font-mono">৳{b.unitCost.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold">৳{(b.receivedQuantity * b.unitCost).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Settlements Record */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-800" />
                  Settlement Cycles & Disbursed Vouchers ({statement.settlements.length})
                </h3>
                <table className="w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden font-mono">
                  <thead className="bg-stone-100 text-[10px] text-stone-600 uppercase border-b border-stone-200">
                    <tr>
                      <th className="p-2">Settlement No</th>
                      <th className="p-2">Period</th>
                      <th className="p-2 text-right">Gross Retail</th>
                      <th className="p-2 text-right">Supplier Share</th>
                      <th className="p-2 text-right">Net Payable</th>
                      <th className="p-2 text-right">Disbursed Amount</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {statement.settlements.map(st => (
                      <tr key={st.id} className="text-stone-700">
                        <td className="p-2 font-mono font-bold">{st.settlementNumber}</td>
                        <td className="p-2 font-mono text-[11px]">
                          {new Date(st.periodStart).toLocaleDateString()} - {new Date(st.periodEnd).toLocaleDateString()}
                        </td>
                        <td className="p-2 text-right font-mono">৳{st.grossSalesAmount.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold text-emerald-800">৳{st.supplierShareAmount.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold">৳{st.netPayable.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono text-teal-900 font-bold">৳{(st.paidAmount || 0).toLocaleString()}</td>
                        <td className="p-2 text-center font-bold text-[10px]">{st.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature Footer */}
              <div className="pt-10 border-t border-stone-300 flex items-end justify-between text-xs text-stone-500">
                <div>
                  <div className="w-44 border-b border-stone-400 mb-1"></div>
                  <span>Authorized Signature (KISHOLOY Accounts)</span>
                </div>
                <div>
                  <div className="w-44 border-b border-stone-400 mb-1"></div>
                  <span>Supplier Acceptance & Date</span>
                </div>
              </div>
            </>
          )}

          {loading && (
            <div className="p-12 text-center text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-800" />
              Generating supplier statement...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
