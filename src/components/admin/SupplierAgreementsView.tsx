import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, CheckCircle2, AlertCircle, HelpCircle, Edit2, Trash2, 
  Percent, DollarSign, Calendar, ShieldCheck, RefreshCw 
} from 'lucide-react';
import { Supplier, SupplierAgreement, SupplierSettlementMethod, SupplierCalculationBasis } from '../../types';
import { useApp } from '../../context/AppContext';
import { SUPPLIER_HELP_DEFINITIONS, SupplierFunctionHelp } from '../../admin/supplierHelpData';
import { AdminModalShell } from './AdminModalShell';
import { usePendingAction } from '../../hooks/usePendingAction';

interface SupplierAgreementsViewProps {
  suppliers: Supplier[];
  onOpenHelp: (help: SupplierFunctionHelp) => void;
}

export const SupplierAgreementsView: React.FC<SupplierAgreementsViewProps> = ({
  suppliers,
  onOpenHelp
}) => {
  const { language, showToast, currentRole, products } = useApp();
  const [agreements, setAgreements] = useState<SupplierAgreement[]>([]);
  // F-306: blocks duplicate submits while a mutation is in flight.
  const { run, isPending, isBusy } = usePendingAction();
  const [loading, setLoading] = useState(false);
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<SupplierAgreement | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [settlementMethod, setSettlementMethod] = useState<SupplierSettlementMethod>('PERCENTAGE_OF_SALE');
  const [calculationBasis, setCalculationBasis] = useState<SupplierCalculationBasis>('NET_SELLING_PRICE');
  const [percentage, setPercentage] = useState<number>(85);
  const [fixedAmount, setFixedAmount] = useState<number>(1000);
  const [supplierCost, setSupplierCost] = useState<number>(1500);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [effectiveTo, setEffectiveTo] = useState('');
  const [status, setStatus] = useState<SupplierAgreement['status']>('ACTIVE');
  const [notes, setNotes] = useState('');

  const loadAgreements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers/agreements/all');
      const data = await res.json();
      if (data.success) {
        setAgreements(data.agreements);
      }
    } catch (err) {
      console.error('Failed to load agreements', err);
      showToast?.('Failed to load agreements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgreements();
  }, []);

  const openCreateModal = () => {
    setEditingAgreement(null);
    setSupplierId(suppliers[0]?.id || '');
    setProductId('');
    setSettlementMethod('PERCENTAGE_OF_SALE');
    setCalculationBasis('NET_SELLING_PRICE');
    setPercentage(85);
    setFixedAmount(1000);
    setSupplierCost(1500);
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
    setEffectiveTo('');
    setStatus('ACTIVE');
    setNotes('');
    setCreateModalOpen(true);
  };

  const openEditModal = (agr: SupplierAgreement) => {
    setEditingAgreement(agr);
    setSupplierId(agr.supplierId);
    setProductId(agr.productId || '');
    setSettlementMethod(agr.settlementMethod);
    setCalculationBasis(agr.calculationBasis || 'NET_SELLING_PRICE');
    setPercentage(agr.percentage || 85);
    setFixedAmount(agr.fixedAmount || 1000);
    setSupplierCost(agr.supplierCost || 1500);
    setEffectiveFrom(agr.effectiveFrom ? agr.effectiveFrom.split('T')[0] : '');
    setEffectiveTo(agr.effectiveTo ? agr.effectiveTo.split('T')[0] : '');
    setStatus(agr.status);
    setNotes(agr.notes || '');
    setCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      showToast?.('Please select a supplier.');
      return;
    }

    const payload = {
      supplierId,
      productId: productId || undefined,
      settlementMethod,
      calculationBasis,
      percentage: settlementMethod === 'PERCENTAGE_OF_SALE' || settlementMethod === 'REVENUE_SHARE' ? Number(percentage) : undefined,
      fixedAmount: settlementMethod === 'FIXED_AMOUNT_PER_UNIT' ? Number(fixedAmount) : undefined,
      supplierCost: settlementMethod === 'FIXED_COST' ? Number(supplierCost) : undefined,
      effectiveFrom: effectiveFrom || new Date().toISOString(),
      effectiveTo: effectiveTo || undefined,
      status,
      notes,
      operator: currentRole
    };

    try {
      const url = editingAgreement ? `/api/suppliers/agreements/${editingAgreement.id}` : `/api/suppliers/${supplierId}/agreements`;
      const method = editingAgreement ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast?.(`Agreement ${editingAgreement ? 'updated' : 'created'} successfully.`);
        setCreateModalOpen(false);
        loadAgreements();
      } else {
        showToast?.(data.error || 'Failed to save agreement.');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Error submitting agreement.');
    }
  };

  const handleDelete = async (agrId: string) =>  run('handleDelete', async () => {
    if (!confirm('Are you sure you want to delete this commercial agreement?')) return;
    try {
      const res = await fetch(`/api/suppliers/agreements/${agrId}?operator=${encodeURIComponent(currentRole)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast?.('Agreement removed.');
        loadAgreements();
      } else {
        showToast?.(data.error || 'Failed to delete agreement.');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Error deleting agreement.');
    }
  
  });

  const filteredAgreements = agreements.filter(a => {
    if (selectedSupplierFilter === 'ALL') return true;
    return a.supplierId === selectedSupplierFilter;
  });

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-800" />
              {language === 'BN' ? 'সরবরাহকারী বাণিজ্যিক চুক্তি (অ্যাগ্রিমেন্ট)' : 'Supplier Commercial Agreements'}
            </h2>
            <button
              type="button"
              onClick={() => onOpenHelp(SUPPLIER_HELP_DEFINITIONS.supplier_agreements)}
              className="text-stone-400 hover:text-teal-700 p-1 rounded hover:bg-stone-100"
              title="Explain Agreements"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {language === 'BN' 
              ? 'নির্দিষ্ট বাণিজ্যিক শর্তাবলি নির্ধারণ করুন: ফিক্সড কস্ট, বিক্রয়ের শতাংশ বা রেভিনিউ শেয়ার।'
              : 'Define settlement terms: Fixed Cost, Percentage of Sale, Fixed Remuneration, or Revenue Share.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 text-stone-800 font-medium focus:ring-1 focus:ring-teal-700 focus:outline-none"
          >
            <option value="ALL">{language === 'BN' ? 'সকল সরবরাহকারী' : 'All Suppliers'}</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.companyName || s.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadAgreements}
            className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center"
            title="Refresh Agreements"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-3.5 py-2 text-xs font-bold text-white bg-teal-900 hover:bg-teal-950 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'BN' ? 'নতুন চুক্তি তৈরি' : 'New Agreement'}</span>
          </button>
        </div>
      </div>

      {/* Agreements Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgreements.map((agr) => {
          const supplier = suppliers.find(s => s.id === agr.supplierId);
          const product = agr.productId ? products.find(p => p.id === agr.productId || p.sku === agr.productId) : null;

          return (
            <div key={agr.id} className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs hover:border-teal-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 uppercase">
                      {agr.id}
                    </span>
                    <h3 className="font-bold text-stone-900 mt-2 text-sm leading-snug">
                      {supplier?.companyName || supplier?.name || agr.supplierId}
                    </h3>
                    <p className="text-[11px] text-stone-500 font-mono">
                      {supplier?.code || 'VENDOR'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    agr.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    agr.status === 'DRAFT' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-stone-100 text-stone-600 border-stone-200'
                  }`}>
                    {agr.status}
                  </span>
                </div>

                {/* Scope */}
                <div className="mt-3.5 p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-xs">
                  <div className="text-[11px] text-stone-500 font-semibold mb-1">
                    {language === 'BN' ? 'চুক্তির আওতা' : 'Product Scope'}:
                  </div>
                  <div className="font-medium text-stone-800">
                    {product ? product.title : (agr.productId ? `SKU: ${agr.productId}` : 'All Products Supplied by Vendor')}
                  </div>
                </div>

                {/* Settlement Method Details */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>{language === 'BN' ? 'পদ্ধতি' : 'Method'}:</span>
                    <span className="font-bold text-stone-900 bg-teal-50 px-2 py-0.5 rounded text-teal-900 border border-teal-200 text-[11px]">
                      {agr.settlementMethod.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-stone-600">
                    <span>{language === 'BN' ? 'হিসাব ভিত্তি' : 'Basis'}:</span>
                    <span className="font-medium text-stone-800 font-mono text-[11px]">
                      {agr.calculationBasis?.replace(/_/g, ' ') || 'NET SELLING PRICE'}
                    </span>
                  </div>

                  {agr.percentage !== undefined && (
                    <div className="flex items-center justify-between text-stone-600">
                      <span>{language === 'BN' ? 'সরবরাহকারী শেয়ার' : 'Supplier Share'}:</span>
                      <span className="font-bold text-teal-800 font-mono text-sm">
                        {agr.percentage}%
                      </span>
                    </div>
                  )}

                  {agr.fixedAmount !== undefined && (
                    <div className="flex items-center justify-between text-stone-600">
                      <span>{language === 'BN' ? 'প্রতি পিস পারিশ্রমিক' : 'Fixed Unit Remuneration'}:</span>
                      <span className="font-bold text-stone-900 font-mono">
                        ৳{agr.fixedAmount.toLocaleString('en-BD')}
                      </span>
                    </div>
                  )}

                  {agr.supplierCost !== undefined && (
                    <div className="flex items-center justify-between text-stone-600">
                      <span>{language === 'BN' ? 'সরবরাহকারী নির্ধারিত খরচ' : 'Agreed Unit Cost'}:</span>
                      <span className="font-bold text-stone-900 font-mono">
                        ৳{agr.supplierCost.toLocaleString('en-BD')}
                      </span>
                    </div>
                  )}
                </div>

                {agr.notes && (
                  <p className="text-[11px] text-stone-500 italic mt-3 bg-stone-50 p-2 rounded border border-stone-200">
                    "{agr.notes}"
                  </p>
                )}
              </div>

              {/* Footer & Actions */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>From: {agr.effectiveFrom ? new Date(agr.effectiveFrom).toLocaleDateString() : 'Active'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(agr)}
                    className="p-1 text-stone-500 hover:text-teal-800 hover:bg-stone-100 rounded"
                    title="Edit Agreement"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(agr.id)}
                    className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Delete Agreement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAgreements.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-700">No Commercial Agreements Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Create structured commercial agreements to govern automatic settlement calculation upon order delivery.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-teal-900 hover:bg-teal-950 rounded-lg inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Agreement
          </button>
        </div>
      )}

      {/* Create / Edit Agreement Modal */}
      <AdminModalShell
        open={!!createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        label="Create Edit Agreement Modal"
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-sm">
                  {editingAgreement ? 'Edit Commercial Agreement' : 'Create Commercial Agreement'}
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-teal-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Supplier Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Supplier Organization *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  disabled={Boolean(editingAgreement)}
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5 bg-stone-50 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  required
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName || s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              {/* Product Scope */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Product Specific Scope (Optional - leave blank for all products)
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none"
                >
                  <option value="">Applicable to ALL products from this supplier</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.sku || p.id})</option>
                  ))}
                </select>
              </div>

              {/* Settlement Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Settlement Method *
                  </label>
                  <select
                    value={settlementMethod}
                    onChange={(e) => setSettlementMethod(e.target.value as SupplierSettlementMethod)}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none font-semibold"
                  >
                    <option value="PERCENTAGE_OF_SALE">Percentage of Sale (%)</option>
                    <option value="FIXED_COST">Fixed Cost (৳ per Unit)</option>
                    <option value="FIXED_AMOUNT_PER_UNIT">Fixed Unit Remuneration (৳)</option>
                    <option value="REVENUE_SHARE">Revenue Share (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Calculation Basis *
                  </label>
                  <select
                    value={calculationBasis}
                    onChange={(e) => setCalculationBasis(e.target.value as SupplierCalculationBasis)}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  >
                    <option value="NET_SELLING_PRICE">Net Selling Price (After Discount)</option>
                    <option value="GROSS_SELLING_PRICE">Gross MRP Selling Price</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Inputs based on method */}
              {(settlementMethod === 'PERCENTAGE_OF_SALE' || settlementMethod === 'REVENUE_SHARE') && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Supplier Share Percentage (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={percentage}
                      onChange={(e) => setPercentage(Number(e.target.value))}
                      className="w-full text-xs border border-stone-300 rounded-lg p-2.5 pr-8 focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono font-bold"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-stone-400">%</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    KISHOLOY retains remaining {100 - percentage}% as platform retail margin.
                  </p>
                </div>
              )}

              {settlementMethod === 'FIXED_COST' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Agreed Unit Cost (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={supplierCost}
                    onChange={(e) => setSupplierCost(Number(e.target.value))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono font-bold"
                    required
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Supplier is credited exactly this amount per item sold regardless of final selling price.
                  </p>
                </div>
              )}

              {settlementMethod === 'FIXED_AMOUNT_PER_UNIT' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Fixed Remuneration per Unit (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(Number(e.target.value))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono font-bold"
                    required
                  />
                </div>
              )}

              {/* Effective Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Agreement Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Agreement Notes & Commercial Scope
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Master Weaver Jamdani standard seasonal agreement with 85% payout."
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  rows={2}
                />
              </div>

              {/* Form Footer */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-900 hover:bg-teal-950 rounded-lg shadow-xs"
                >
                  {editingAgreement ? 'Update Agreement' : 'Save Agreement'}
                </button>
              </div>
            </form>
          </div>
      </AdminModalShell>
    </div>
  );
};
