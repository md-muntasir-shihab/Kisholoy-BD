import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, RefreshCw, HelpCircle, CheckCircle2, AlertTriangle, 
  Layers, ShoppingCart, DollarSign, Calendar, Warehouse, ArrowDownRight,
  TrendingUp, Search, Filter
} from 'lucide-react';
import { Supplier, SupplyBatch, SupplierSettlementMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import { SUPPLIER_HELP_DEFINITIONS, SupplierFunctionHelp } from '../../admin/supplierHelpData';
import { AdminModalShell } from './AdminModalShell';
import { usePendingAction } from '../../hooks/usePendingAction';

interface SupplyBatchesViewProps {
  suppliers: Supplier[];
  onOpenHelp: (help: SupplierFunctionHelp) => void;
}

export const SupplyBatchesView: React.FC<SupplyBatchesViewProps> = ({
  suppliers,
  onOpenHelp
}) => {
  const { language, showToast, currentRole, products } = useApp();
  const [batches, setBatches] = useState<SupplyBatch[]>([]);
  // F-306: blocks duplicate submits while a mutation is in flight.
  const { run, isPending, isBusy } = usePendingAction();
  const [loading, setLoading] = useState(false);
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [warehouseId, setWarehouseId] = useState('hub-central-tejg');
  const [receivedQuantity, setReceivedQuantity] = useState<number>(50);
  const [unitCost, setUnitCost] = useState<number>(1800);
  const [sellingPrice, setSellingPrice] = useState<number>(2400);
  const [settlementMethod, setSettlementMethod] = useState<SupplierSettlementMethod>('PERCENTAGE_OF_SALE');
  const [supplierSharePercentage, setSupplierSharePercentage] = useState<number>(85);
  const [fixedAmountPerUnit, setFixedAmountPerUnit] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers/batches/all');
      const data = await res.json();
      if (data.success) {
        setBatches(data.batches);
      }
    } catch (err) {
      console.error('Failed to load supply batches', err);
      showToast?.('Failed to load supply batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const openCreateModal = () => {
    const firstSupplier = suppliers[0];
    const firstProduct = products[0];
    setSupplierId(firstSupplier?.id || '');
    setProductId(firstProduct?.id || '');
    setProductName(firstProduct?.title || '');
    setWarehouseId('hub-central-tejg');
    setReceivedQuantity(50);
    setUnitCost(firstProduct?.costPrice || 1800);
    setSellingPrice(firstProduct?.price || 2400);
    setSettlementMethod('PERCENTAGE_OF_SALE');
    setSupplierSharePercentage(85);
    setFixedAmountPerUnit(0);
    setNotes('');
    setCreateModalOpen(true);
  };

  const handleProductSelect = (selectedProdId: string) => {
    setProductId(selectedProdId);
    const prod = products.find(p => p.id === selectedProdId);
    if (prod) {
      setProductName(prod.title);
      if (prod.costPrice) setUnitCost(prod.costPrice);
      if (prod.price) setSellingPrice(prod.price);
    }
  };

  const handleSubmit = async (e: React.FormEvent) =>  run('handleSubmit', async () => {
    e.preventDefault();
    if (!supplierId || !productId || receivedQuantity <= 0) {
      showToast?.('Please specify supplier, product and a positive quantity.');
      return;
    }

    const payload = {
      supplierId,
      productId,
      productName: productName || 'Product Batch Item',
      warehouseId,
      receivedQuantity: Number(receivedQuantity),
      unitCost: Number(unitCost),
      sellingPrice: Number(sellingPrice),
      settlementMethod,
      supplierSharePercentage: settlementMethod === 'PERCENTAGE_OF_SALE' || settlementMethod === 'REVENUE_SHARE' ? Number(supplierSharePercentage) : undefined,
      fixedAmountPerUnit: settlementMethod === 'FIXED_AMOUNT_PER_UNIT' ? Number(fixedAmountPerUnit) : undefined,
      notes,
      operator: currentRole
    };

    try {
      const res = await fetch(`/api/suppliers/${supplierId}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast?.(`Supply batch ${data.batch.batchNumber} logged and catalog stock incremented.`);
        setCreateModalOpen(false);
        loadBatches();
      } else {
        showToast?.(data.error || 'Failed to record supply batch.');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Error recording batch.');
    }
  
  });

  const filteredBatches = batches.filter(b => {
    const matchesSupplier = selectedSupplierFilter === 'ALL' || b.supplierId === selectedSupplierFilter;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesSearch = b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.productId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSupplier && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-800" />
              {language === 'BN' ? 'সাপ্লাই ব্যাচ ও স্টক ট্র্যাকিং' : 'Supply Batches & Consignment Inflow'}
            </h2>
            <button
              type="button"
              onClick={() => onOpenHelp(SUPPLIER_HELP_DEFINITIONS.supply_batches)}
              className="text-stone-400 hover:text-teal-700 p-1 rounded hover:bg-stone-100"
              title="Explain Batches"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {language === 'BN'
              ? 'সরবরাহকারীদের কাছ থেকে আগত পণ্যের প্রতিটি ব্যাচ ট্র্যাক করুন (প্রাপ্ত, বিক্রিত, অবশিষ্ট এবং ডিফেক্ট স্টক)।'
              : 'Track distinct inventory lots received from suppliers: received, sold, returned, damaged, and remaining.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search batch or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
          </div>

          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="text-xs border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 text-stone-800 focus:outline-none"
          >
            <option value="ALL">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.companyName || s.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 text-stone-800 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DEPLETED">DEPLETED</option>
            <option value="RESERVED">RESERVED</option>
          </select>

          <button
            type="button"
            onClick={loadBatches}
            className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-3.5 py-2 text-xs font-bold text-white bg-teal-900 hover:bg-teal-950 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'BN' ? 'নতুন ব্যাচ গ্রহণ' : 'Intake Batch'}</span>
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-semibold border-b border-stone-200">
              <tr>
                <th className="p-3.5">Batch Details</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Product & SKU</th>
                <th className="p-3.5 text-center">Received / Sold / Remaining</th>
                <th className="p-3.5 text-right">Cost vs Retail</th>
                <th className="p-3.5">Settlement Rule</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {filteredBatches.map((batch) => {
                const supplier = suppliers.find(s => s.id === batch.supplierId);
                const progressPct = batch.receivedQuantity > 0 
                  ? Math.min(100, Math.round((batch.soldQuantity / batch.receivedQuantity) * 100))
                  : 0;

                return (
                  <tr key={batch.id} className="hover:bg-stone-50/70 transition-colors font-sans">
                    <td className="p-3.5">
                      <div className="font-bold text-stone-900 font-mono text-xs">{batch.batchNumber}</div>
                      <div className="text-[11px] text-stone-400 font-sans flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(batch.receivedDate).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-stone-900 text-xs">
                        {supplier?.companyName || supplier?.name || batch.supplierId}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {supplier?.code || 'VENDOR'}
                      </div>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <div className="font-semibold text-stone-800 truncate" title={batch.productName}>
                        {batch.productName}
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono">{batch.productId}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center justify-between text-xs mb-1 font-mono">
                        <span className="text-stone-700 font-bold">{batch.soldQuantity} sold</span>
                        <span className="text-teal-900 font-bold bg-teal-50 px-1.5 py-0.5 rounded text-[11px]">
                          {batch.remainingQuantity} left
                        </span>
                      </div>
                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${progressPct >= 100 ? 'bg-stone-500' : 'bg-teal-700'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-stone-400 text-right mt-1 font-mono">
                        Total {batch.receivedQuantity} received
                        {batch.returnedQuantity > 0 && <span className="text-amber-700 ml-1">({batch.returnedQuantity} ret)</span>}
                      </div>
                    </td>

                    <td className="p-3.5 text-right font-mono">
                      <div className="text-stone-900 font-bold">
                        ৳{batch.unitCost.toLocaleString('en-BD')}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        Retail: ৳{batch.sellingPrice?.toLocaleString('en-BD') || 'N/A'}
                      </div>
                    </td>

                    <td className="p-3.5 text-xs">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[11px] font-medium border border-stone-200">
                        {batch.settlementMethod.replace(/_/g, ' ')}
                      </span>
                      {batch.supplierSharePercentage && (
                        <div className="text-[11px] text-teal-800 font-mono font-bold mt-1">
                          {batch.supplierSharePercentage}% Supplier Share
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        batch.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        batch.status === 'DEPLETED' ? 'bg-stone-100 text-stone-600 border-stone-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBatches.length === 0 && !loading && (
          <div className="p-10 text-center text-stone-500 text-xs">
            No supply batches matching criteria.
          </div>
        )}
      </div>

      {/* Intake Batch Modal */}
      <AdminModalShell
        open={!!createModalOpen}
        onClose={() => setCreateModalOpen(null)}
        label="Intake Batch Modal"
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-sm">Intake Supply Batch (Stock Receipt)</h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-teal-200 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Supplier Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Supplier *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5 bg-stone-50 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  required
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName || s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Product *
                </label>
                <select
                  value={productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  required
                >
                  <option value="">-- Select Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.sku || p.id})</option>
                  ))}
                </select>
              </div>

              {/* Quantity and Costs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Received Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={receivedQuantity}
                    onChange={(e) => setReceivedQuantity(Number(e.target.value))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Unit Cost (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Selling Price (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Settlement Method & Share */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Settlement Method *
                  </label>
                  <select
                    value={settlementMethod}
                    onChange={(e) => setSettlementMethod(e.target.value as SupplierSettlementMethod)}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2.5 bg-white font-medium"
                  >
                    <option value="PERCENTAGE_OF_SALE">Percentage of Sale (%)</option>
                    <option value="FIXED_COST">Fixed Cost (৳)</option>
                    <option value="FIXED_AMOUNT_PER_UNIT">Fixed Unit Remuneration (৳)</option>
                    <option value="REVENUE_SHARE">Revenue Share (%)</option>
                  </select>
                </div>

                {settlementMethod === 'PERCENTAGE_OF_SALE' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Supplier Share % *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={supplierSharePercentage}
                      onChange={(e) => setSupplierSharePercentage(Number(e.target.value))}
                      className="w-full text-xs border border-stone-300 rounded-lg p-2.5 font-mono font-bold"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Batch Reference Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Received from Narayanganj weaving cluster; pristine condition QC checked."
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5"
                  rows={2}
                />
              </div>

              {/* Actions */}
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
                  Confirm Intake & Increment Stock
                </button>
              </div>
            </form>
          </div>
      </AdminModalShell>
    </div>
  );
};
