import React, { useState, useMemo } from 'react';
import { 
  Warehouse, Package, Boxes, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle2, ArrowUpDown, Plus, Minus, 
  Search, Filter, Download, QrCode, Truck, FileText, 
  RefreshCw, ShieldCheck, History, Sparkles, Clock, 
  ArrowRight, Trash2, Layers, Building2, HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, InventoryTransaction, BatchRestockItem } from '../types';
import { AdminModalShell } from '../components/admin/AdminModalShell';

export function InventoryAdmin() {
  const { 
    products, 
    inventoryTransactions, 
    adjustInventory, 
    batchRestock, 
    language, 
    currentRole 
  } = useApp();

  // Active Main View Tab
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'PO_WIZARD' | 'TRANSACTIONS' | 'FORECAST'>('LEDGER');

  // Warehouse filter
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');

  // Search & Filter for Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockLevelFilter, setStockLevelFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Adjustment Modal State
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustReason, setAdjustReason] = useState('Supplier Batch Restock');
  const [adjustWarehouse, setAdjustWarehouse] = useState('Tejgaon Central Fulfillment Hub, Dhaka');
  const [adjustBatchNo, setAdjustBatchNo] = useState('');
  const [adjustUnitCost, setAdjustUnitCost] = useState<number>(0);
  const [adjustNote, setAdjustNote] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Barcode Modal State
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);

  // Transaction Ledger Filters
  const [txTypeFilter, setTxTypeFilter] = useState<string>('ALL');
  const [txSearchQuery, setTxSearchQuery] = useState('');

  // PO Restock Intake Form State
  const [poSupplier, setPoSupplier] = useState('Sonargaon Heritage Jamdani Artisans');
  const [poInvoiceNo, setPoInvoiceNo] = useState(`PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [poWarehouse, setPoWarehouse] = useState('Tejgaon Central Fulfillment Hub, Dhaka');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<BatchRestockItem[]>([
    {
      productId: products[0]?.id || 'prod-1',
      sku: products[0]?.sku || 'KSH-JAM-001',
      productTitle: products[0]?.title || 'Handcrafted Jamdani Saree',
      quantity: 10,
      unitCost: products[0]?.costPrice || Math.round((products[0]?.price || 10000) * 0.6),
      batchNumber: `LOT-${new Date().getFullYear()}-01`
    }
  ]);
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);
  const [poSuccessMessage, setPoSuccessMessage] = useState<string | null>(null);

  // Computed Inventory KPIs
  const inventoryStats = useMemo(() => {
    let totalUnitsOnHand = 0;
    let retailValuationBdt = 0;
    let costValuationBdt = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      totalUnitsOnHand += p.stock;
      const cost = p.costPrice || (p.price * 0.6);
      retailValuationBdt += (p.price * p.stock);
      costValuationBdt += (cost * p.stock);

      if (p.stock === 0) {
        outOfStockCount++;
      } else if (p.stock <= 5) {
        lowStockCount++;
      }
    });

    const grossMarginBdt = Math.max(0, retailValuationBdt - costValuationBdt);
    const grossMarginPct = retailValuationBdt > 0 ? ((grossMarginBdt / retailValuationBdt) * 100).toFixed(1) : '0';

    return {
      totalSkus: products.length,
      totalUnitsOnHand,
      retailValuationBdt,
      costValuationBdt,
      grossMarginBdt,
      grossMarginPct,
      lowStockCount,
      outOfStockCount
    };
  }, [products]);

  // Filtered Products for Ledger Table
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.titleBn && p.titleBn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

      let matchesStock = true;
      if (stockLevelFilter === 'IN_STOCK') matchesStock = p.stock > 5;
      else if (stockLevelFilter === 'LOW_STOCK') matchesStock = p.stock > 0 && p.stock <= 5;
      else if (stockLevelFilter === 'OUT_OF_STOCK') matchesStock = p.stock === 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockLevelFilter]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return inventoryTransactions.filter(tx => {
      const matchesSearch = 
        tx.sku.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
        tx.productTitle.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
        tx.reason.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
        tx.operator.toLowerCase().includes(txSearchQuery.toLowerCase());
      
      const matchesType = txTypeFilter === 'ALL' || tx.type === txTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [inventoryTransactions, txSearchQuery, txTypeFilter]);

  // Open Adjust Modal
  const handleOpenAdjustModal = (product: Product) => {
    setAdjustModalProduct(product);
    setAdjustQty(5);
    setAdjustType('ADD');
    setAdjustReason('Supplier Batch Restock');
    setAdjustWarehouse('Tejgaon Central Fulfillment Hub, Dhaka');
    setAdjustBatchNo(`LOT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
    setAdjustUnitCost(product.costPrice || Math.round(product.price * 0.6));
    setAdjustNote('');
  };

  // Submit Single Adjustment
  const handleSubmitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;

    setIsSubmittingAdjust(true);
    const finalChange = adjustType === 'ADD' ? Math.abs(adjustQty) : -Math.abs(adjustQty);

    await adjustInventory(
      adjustModalProduct.id,
      finalChange,
      `${adjustReason}: ${adjustNote || 'Manual stock reconciliation'}`,
      {
        warehouseLocation: adjustWarehouse,
        batchNumber: adjustBatchNo,
        notes: adjustNote,
        unitCost: adjustUnitCost
      }
    );

    setIsSubmittingAdjust(false);
    setAdjustModalProduct(null);
  };

  // Add line item to PO
  const handleAddPoItem = () => {
    const defaultProd = products[0];
    if (!defaultProd) return;
    setPoItems(prev => [
      ...prev,
      {
        productId: defaultProd.id,
        sku: defaultProd.sku,
        productTitle: defaultProd.title,
        quantity: 10,
        unitCost: defaultProd.costPrice || Math.round(defaultProd.price * 0.6),
        batchNumber: `LOT-${new Date().getFullYear()}-${prev.length + 1}`
      }
    ]);
  };

  const handleUpdatePoItem = (index: number, updates: Partial<BatchRestockItem>) => {
    setPoItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const updated = { ...item, ...updates };
      if (updates.productId) {
        const prod = products.find(p => p.id === updates.productId);
        if (prod) {
          updated.sku = prod.sku;
          updated.productTitle = prod.title;
          if (!updates.unitCost) {
            updated.unitCost = prod.costPrice || Math.round(prod.price * 0.6);
          }
        }
      }
      return updated;
    }));
  };

  const handleRemovePoItem = (index: number) => {
    setPoItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit Batch PO
  const handleSubmitPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) return;

    setIsSubmittingPO(true);
    const success = await batchRestock({
      supplier: poSupplier,
      invoiceNumber: poInvoiceNo,
      warehouseLocation: poWarehouse,
      items: poItems,
      notes: poNotes
    });

    setIsSubmittingPO(false);
    if (success) {
      setPoSuccessMessage(`Purchase Order ${poInvoiceNo} successfully received & logged to ledger!`);
      // Reset PO form
      setPoInvoiceNo(`PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setPoNotes('');
      setTimeout(() => {
        setPoSuccessMessage(null);
        setActiveTab('LEDGER');
      }, 2000);
    }
  };

  // Export Stock Ledger as CSV
  const handleExportCSV = () => {
    const headers = ['SKU', 'Product Title', 'Category', 'Retail Price (BDT)', 'Unit Cost (BDT)', 'Stock On Hand', 'Stock Valuation (BDT)', 'Status'];
    const rows = products.map(p => [
      `"${p.sku}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.price,
      p.costPrice || Math.round(p.price * 0.6),
      p.stock,
      p.price * p.stock,
      p.stock === 0 ? 'OUT_OF_STOCK' : (p.stock <= 5 ? 'LOW_STOCK' : 'OPTIMAL')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kisholoy_stock_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Global Warehouse Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-900 text-white rounded-xl shadow-xs">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900">
                {language === 'BN' ? 'ইনভেন্টরি ও স্টক লেজার' : 'Inventory & Stock Ledger'}
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                {language === 'BN' 
                  ? 'গুদামভিত্তিক মজুদ পর্যবেক্ষণ, পিও ব্যাচ গ্রহণ ও নিরীক্ষাযোগ্য স্টক সমন্বয়।' 
                  : 'Multi-warehouse physical inventory, automated safety stocks, and auditable ledger movements.'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Warehouse Selection & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-xs">
            <Building2 className="w-4 h-4 text-stone-600 ml-1.5" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-transparent font-medium text-stone-800 border-none outline-hidden pr-2 cursor-pointer"
            >
              <option value="ALL">All Regional Hubs (National)</option>
              <option value="DAC-01">Tejgaon Central Hub (Dhaka)</option>
              <option value="CTG-02">Agrabad Regional Hub (Chittagong)</option>
              <option value="SYL-03">Zindabazar Hub (Sylhet)</option>
            </select>
          </div>

          <button
            onClick={() => setActiveTab('PO_WIZARD')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'নতুন পিও স্টক ইন' : 'Batch PO Restock (+)'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl font-bold text-xs transition-colors"
            title="Download CSV Audit"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock on Hand */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {language === 'BN' ? 'মোট মজুদ ইউনিট' : 'Total Stock on Hand'}
            </span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-stone-900">
              {inventoryStats.totalUnitsOnHand.toLocaleString()}
            </span>
            <span className="text-xs text-stone-500 font-medium">units</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Across {inventoryStats.totalSkus} active artisan SKUs
          </p>
        </div>

        {/* Retail Inventory Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {language === 'BN' ? 'খুচরা মূল্যায়ন (৳)' : 'Retail Valuation'}
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-emerald-950">
              ৳{inventoryStats.retailValuationBdt.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-stone-400">
            Cost basis: ৳{inventoryStats.costValuationBdt.toLocaleString()}
          </p>
        </div>

        {/* Gross Inventory Margin */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {language === 'BN' ? 'প্রত্যাশিত মোট মার্জিন' : 'Expected Margin'}
            </span>
            <div className="p-2 bg-teal-50 rounded-xl text-teal-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-teal-900">
              {inventoryStats.grossMarginPct}%
            </span>
            <span className="text-xs text-teal-700 font-mono">
              (৳{inventoryStats.grossMarginBdt.toLocaleString()})
            </span>
          </div>
          <p className="text-[11px] text-stone-400">
            Artisan fair trade pricing margin
          </p>
        </div>

        {/* Critical & Low Stock */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {language === 'BN' ? 'পুনঃঅর্ডার প্রয়োজন' : 'Low Stock Alerts'}
            </span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-rose-600">
              {inventoryStats.lowStockCount + inventoryStats.outOfStockCount}
            </span>
            <span className="text-xs text-rose-500 font-medium">
              ({inventoryStats.outOfStockCount} out of stock)
            </span>
          </div>
          <p className="text-[11px] text-stone-400">
            Immediate weaver restock needed
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'LEDGER'
              ? 'border-teal-900 text-teal-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{language === 'BN' ? 'স্টক লেজার ও ক্যাটালগ' : 'Stock Ledger & Catalog'}</span>
          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-mono">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PO_WIZARD')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'PO_WIZARD'
              ? 'border-teal-900 text-teal-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'BN' ? 'ব্যাচ পিও রিস্টক উইজার্ড' : 'Batch PO Restock Wizard'}</span>
        </button>

        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'TRANSACTIONS'
              ? 'border-teal-900 text-teal-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{language === 'BN' ? 'নিরীক্ষাযোগ্য স্টক চলাচল' : 'Movement & Audit Trail'}</span>
          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-mono">
            {inventoryTransactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('FORECAST')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'FORECAST'
              ? 'border-teal-900 text-teal-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{language === 'BN' ? 'পুনঃঅর্ডার পূর্বাভাস' : 'Safety Stock & Forecasting'}</span>
        </button>
      </div>

      {/* TAB 1: Stock Ledger & Catalog */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder={language === 'BN' ? 'নাম বা SKU দিয়ে খুঁজুন...' : 'Search by product title, Bengali name, or SKU...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700"
              >
                <option value="ALL">All Categories</option>
                <option value="Traditional Clothing">Traditional Clothing</option>
                <option value="Handicrafts & Decor">Handicrafts & Decor</option>
                <option value="Organic Food">Organic Food</option>
                <option value="Jute Crafts">Jute Crafts</option>
                <option value="Leather Goods">Leather Goods</option>
              </select>

              <select
                value={stockLevelFilter}
                onChange={(e) => setStockLevelFilter(e.target.value as any)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="IN_STOCK">Optimal Stock (&gt; 5)</option>
                <option value="LOW_STOCK">Low Stock (1 - 5)</option>
                <option value="OUT_OF_STOCK">Out of Stock (0)</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4">SKU / Item</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Retail (৳) / Cost</th>
                    <th className="p-4">Stock on Hand</th>
                    <th className="p-4">Available</th>
                    <th className="p-4">Primary Hub</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">
                        No products match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const costPrice = product.costPrice || Math.round(product.price * 0.6);
                      const isLowStock = product.stock > 0 && product.stock <= 5;
                      const isOutOfStock = product.stock === 0;

                      return (
                        <tr key={product.id} className="hover:bg-stone-50/75 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.images[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200'}
                                alt={product.title}
                                className="w-11 h-11 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px] border border-stone-200">
                                    {product.sku}
                                  </span>
                                  {product.featured && (
                                    <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                      Featured
                                    </span>
                                  )}
                                </div>
                                <p className="font-bold text-stone-900 mt-1 line-clamp-1">
                                  {product.title}
                                </p>
                                {product.titleBn && (
                                  <p className="text-[11px] text-stone-500 font-serif line-clamp-1">
                                    {product.titleBn}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-stone-600 font-medium">
                            {product.category}
                          </td>

                          <td className="p-4 font-mono">
                            <div className="font-bold text-stone-900">৳{product.price.toLocaleString()}</div>
                            <div className="text-[10px] text-stone-400">Cost: ৳{costPrice.toLocaleString()}</div>
                          </td>

                          <td className="p-4 font-mono font-bold text-stone-900 text-sm">
                            {product.stock} <span className="text-xs font-normal text-stone-400">units</span>
                          </td>

                          <td className="p-4 font-mono text-stone-700">
                            {Math.max(0, product.stock - 1)} <span className="text-[10px] text-stone-400">avail</span>
                          </td>

                          <td className="p-4 text-stone-500 text-[11px]">
                            Tejgaon Hub (WH-DAC-01)
                          </td>

                          <td className="p-4">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-600" /> Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-bold border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock ({product.stock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Optimal Stock
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setBarcodeProduct(product)}
                                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                                title="Generate Barcode / SKU Tag"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenAdjustModal(product)}
                                className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center gap-1"
                              >
                                <ArrowUpDown className="w-3 h-3" />
                                <span>Adjust</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Batch Purchase Order (PO) Intake Wizard */}
      {activeTab === 'PO_WIZARD' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div className="border-b border-stone-200 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                {language === 'BN' ? 'ব্যাচ পারচেজ অর্ডার (PO) স্টক ইনটেক' : 'Batch Purchase Order (PO) Stock Intake'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Record multi-item bulk delivery from artisan guilds with invoice tracking and atomic ledger updates.
              </p>
            </div>
            <span className="px-3 py-1 bg-teal-50 text-teal-900 text-xs font-mono font-bold rounded-lg border border-teal-200">
              Audit-Enforced
            </span>
          </div>

          {poSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{poSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitPO} className="space-y-6">
            {/* Header info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Artisan Guild / Supplier *
                </label>
                <select
                  value={poSupplier}
                  onChange={(e) => setPoSupplier(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-teal-900"
                >
                  <option value="Sonargaon Heritage Jamdani Artisans">Sonargaon Heritage Jamdani Artisans (Narayanganj)</option>
                  <option value="Cumilla Terracotta Pottery Collective">Cumilla Terracotta Pottery Collective</option>
                  <option value="Sundarbans Wild Honey Harvesters Cooperative">Sundarbans Wild Honey Harvesters Cooperative</option>
                  <option value="Hazaribagh Leather Craftsmen Guild">Hazaribagh Leather Craftsmen Guild</option>
                  <option value="Tangail Silk Handloom Masters">Tangail Silk Handloom Masters</option>
                  <option value="Rajshahi Silk Board Certified Weavers">Rajshahi Silk Board Certified Weavers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  PO / Invoice Ref # *
                </label>
                <input
                  type="text"
                  required
                  value={poInvoiceNo}
                  onChange={(e) => setPoInvoiceNo(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Receiving Fulfillment Hub *
                </label>
                <select
                  value={poWarehouse}
                  onChange={(e) => setPoWarehouse(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs font-medium"
                >
                  <option value="Tejgaon Central Fulfillment Hub, Dhaka">Tejgaon Central Fulfillment Hub, Dhaka (WH-DAC-01)</option>
                  <option value="Chittagong Agrabad Regional Hub">Chittagong Agrabad Regional Hub (WH-CTG-02)</option>
                  <option value="Sylhet Zindabazar Hub">Sylhet Zindabazar Hub (WH-SYL-03)</option>
                </select>
              </div>
            </div>

            {/* Multi-item Line Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Line Items for Receiving ({poItems.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddPoItem}
                  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add SKU Line</span>
                </button>
              </div>

              {/* overflow-x-auto (not overflow-hidden) so the table can scroll
                  sideways on phones; the rounding still clips visually. */}
              <div className="border border-stone-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-3 w-1/3">Target SKU / Product</th>
                      <th className="p-3 w-28">Quantity (+)</th>
                      <th className="p-3 w-36">Unit Cost (৳)</th>
                      <th className="p-3 w-36">Lot Batch #</th>
                      <th className="p-3">Line Valuation</th>
                      <th className="p-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {poItems.map((item, index) => (
                      <tr key={index} className="hover:bg-stone-50">
                        <td className="p-3">
                          <select
                            value={item.productId}
                            onChange={(e) => handleUpdatePoItem(index, { productId: e.target.value })}
                            className="w-full p-2 border border-stone-300 rounded-lg text-xs font-medium"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                [{p.sku}] {p.title} (Stock: {p.stock})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-3">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleUpdatePoItem(index, { quantity: Number(e.target.value) })}
                            className="w-full p-2 border border-stone-300 rounded-lg text-xs font-mono font-bold"
                          />
                        </td>

                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            required
                            value={item.unitCost}
                            onChange={(e) => handleUpdatePoItem(index, { unitCost: Number(e.target.value) })}
                            className="w-full p-2 border border-stone-300 rounded-lg text-xs font-mono"
                          />
                        </td>

                        <td className="p-3">
                          <input
                            type="text"
                            value={item.batchNumber || ''}
                            onChange={(e) => handleUpdatePoItem(index, { batchNumber: e.target.value })}
                            className="w-full p-2 border border-stone-300 rounded-lg text-xs font-mono text-stone-600"
                            placeholder="LOT-2026-01"
                          />
                        </td>

                        <td className="p-3 font-mono font-bold text-stone-900">
                          ৳{(item.quantity * item.unitCost).toLocaleString()}
                        </td>

                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemovePoItem(index)}
                            disabled={poItems.length <= 1}
                            className="p-1.5 text-stone-400 hover:text-rose-600 disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Artisan Quality Control Notes & Verification
                </label>
                <textarea
                  rows={3}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Received directly from Sonargaon loom workshop. Thread count and natural dyes inspected and approved by QC officer."
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex flex-col justify-center space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Total Intake Units:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {poItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} units
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Total PO Cost Valuation:</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    ৳{poItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-teal-800 font-bold border-t border-stone-200 pt-2">
                  <span>Operator Signature:</span>
                  <span className="font-mono">{currentRole}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('LEDGER')}
                className="px-5 py-2.5 bg-stone-100 text-stone-800 rounded-xl font-bold text-xs hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPO}
                className="px-6 py-2.5 bg-teal-900 hover:bg-teal-950 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmittingPO ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Intake...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Execute PO Intake</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Immutable Stock Audit & Movement Trail */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Filter audit trail by SKU, reason, or operator..."
                value={txSearchQuery}
                onChange={(e) => setTxSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700"
              >
                <option value="ALL">All Movement Types</option>
                <option value="STOCK_IN">STOCK_IN (Intake / PO)</option>
                <option value="SALE">SALE (Order Checkout)</option>
                <option value="RETURN">RETURN (RMA Restock)</option>
                <option value="DAMAGE">DAMAGE (Scrap / QC)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (Audit)</option>
                <option value="RESERVATION">RESERVATION (Locked)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">SKU / Product</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Change Delta</th>
                    <th className="p-4">Balance (Before → After)</th>
                    <th className="p-4">Reason & Justification</th>
                    <th className="p-4">Warehouse</th>
                    <th className="p-4">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isPositive = tx.quantityChange > 0;
                      return (
                        <tr key={tx.id} className="hover:bg-stone-50/75 transition-colors">
                          <td className="p-4 font-mono text-stone-500 text-[11px]">
                            {new Date(tx.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>

                          <td className="p-4">
                            <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                              {tx.sku}
                            </span>
                            <p className="text-stone-700 font-medium mt-0.5 line-clamp-1">{tx.productTitle}</p>
                          </td>

                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              tx.type === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                              tx.type === 'SALE' ? 'bg-sky-100 text-sky-900 border border-sky-300' :
                              tx.type === 'RETURN' ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' :
                              tx.type === 'DAMAGE' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                              'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {tx.type}
                            </span>
                          </td>

                          <td className="p-4 font-mono font-bold text-sm">
                            <span className={isPositive ? 'text-emerald-700' : 'text-rose-600'}>
                              {isPositive ? `+${tx.quantityChange}` : tx.quantityChange}
                            </span>
                          </td>

                          <td className="p-4 font-mono text-stone-600">
                            {tx.quantityBefore} <ArrowRight className="w-3 h-3 inline text-stone-400 mx-0.5" /> <strong className="text-stone-900">{tx.quantityAfter}</strong>
                          </td>

                          <td className="p-4 text-stone-800">
                            <p className="font-medium">{tx.reason}</p>
                            {tx.flaggedForReview && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 font-bold">
                                <AlertTriangle className="w-3 h-3" /> High-Volume Review Flagged
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-stone-500 text-[11px]">
                            {tx.warehouseLocation || 'Tejgaon Central Hub'}
                          </td>

                          <td className="p-4 font-mono text-[11px] text-stone-700">
                            <span className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                              {tx.operator}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Safety Stock & Forecasting */}
      {activeTab === 'FORECAST' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-stone-900">
                  {language === 'BN' ? 'আর্টিসান পুনঃঅর্ডার ও লিড টাইম পূর্বাভাস' : 'Artisan Reorder & Lead-Time Forecasting'}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Automated buffer calculations taking into account Jamdani weaving cycles (14–21 days) and organic harvest seasons.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-900 text-xs font-bold rounded-lg border border-amber-200">
                Safety Stock Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                <span className="text-xs font-bold text-stone-600 uppercase">Jamdani Weaving Hub</span>
                <p className="text-sm font-bold text-stone-900">Sonargaon & Rupganj Looms</p>
                <div className="text-xs text-stone-500 space-y-1 pt-1">
                  <div>Avg Production Lead Time: <strong>14 Days</strong></div>
                  <div>Recommended Safety Stock: <strong>15 units</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                <span className="text-xs font-bold text-stone-600 uppercase">Clay & Pottery Cluster</span>
                <p className="text-sm font-bold text-stone-900">Cumilla Terracotta Artisans</p>
                <div className="text-xs text-stone-500 space-y-1 pt-1">
                  <div>Avg Production Lead Time: <strong>7 Days</strong></div>
                  <div>Recommended Safety Stock: <strong>20 units</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                <span className="text-xs font-bold text-stone-600 uppercase">Sundarbans Forest Reserve</span>
                <p className="text-sm font-bold text-stone-900">Wild Harvesters Federation</p>
                <div className="text-xs text-stone-500 space-y-1 pt-1">
                  <div>Avg Extraction & Jarring: <strong>5 Days</strong></div>
                  <div>Recommended Safety Stock: <strong>30 units</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Items List */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              SKUs Requiring Immediate Artisan Work Order
            </h3>
            <div className="space-y-3">
              {products.filter(p => p.stock <= 5).map(product => (
                <div key={product.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={product.images[0]} alt={product.title} className="w-12 h-12 rounded-xl object-cover border" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-xs">
                          {product.sku}
                        </span>
                        <span className="text-xs text-rose-700 font-bold">
                          {product.stock === 0 ? 'CRITICAL: OUT OF STOCK' : `Only ${product.stock} units remaining`}
                        </span>
                      </div>
                      <p className="font-bold text-stone-900 text-sm mt-0.5">{product.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setActiveTab('PO_WIZARD');
                        setPoItems([{
                          productId: product.id,
                          sku: product.sku,
                          productTitle: product.title,
                          quantity: 20,
                          unitCost: product.costPrice || Math.round(product.price * 0.6),
                          batchNumber: `LOT-${new Date().getFullYear()}-RESTOCK`
                        }]);
                      }}
                      className="px-4 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Work Order (+20 units)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Single Product Stock Adjust Modal */}
      <AdminModalShell
        open={!!adjustModalProduct}
        onClose={() => setAdjustModalProduct(null)}
        label="Single Product Stock Adjust Modal"
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {language === 'BN' ? 'স্টক সমন্বয় করুন' : 'Adjust Inventory Stock'}
                </h3>
                <span className="text-xs text-stone-500 font-mono">
                  {adjustModalProduct.sku} • {adjustModalProduct.title}
                </span>
              </div>
              <button 
                onClick={() => setAdjustModalProduct(null)} 
                className="text-stone-400 hover:text-stone-900 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdjust} className="space-y-4 text-xs">
              {/* Current Quantity Card */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center">
                <div>
                  <span className="text-stone-500 block">Current Ledger Stock</span>
                  <span className="font-bold text-xl font-mono text-stone-900">{adjustModalProduct.stock} units</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 block">Projected Balance</span>
                  <span className={`font-bold text-xl font-mono ${
                    adjustType === 'ADD' ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {adjustType === 'ADD' 
                      ? adjustModalProduct.stock + Math.abs(adjustQty)
                      : Math.max(0, adjustModalProduct.stock - Math.abs(adjustQty))} units
                  </span>
                </div>
              </div>

              {/* Adjustment Mode (ADD vs DEDUCT) */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5">Adjustment Direction *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('ADD');
                      setAdjustReason('Supplier Batch Restock');
                    }}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustType === 'ADD'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Stock In (Addition)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('DEDUCT');
                      setAdjustReason('Damaged / Scrap Write-off');
                    }}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustType === 'DEDUCT'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Stock Out (Deduction)</span>
                  </button>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Quantity to {adjustType === 'ADD' ? 'Add' : 'Deduct'} *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Math.abs(Number(e.target.value)))}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-sm font-mono font-bold"
                  />
                  <div className="flex gap-1">
                    {[1, 5, 10, 25, 50].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setAdjustQty(step)}
                        className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-mono font-bold text-stone-700"
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* High-Volume Alert Banner */}
              {adjustQty >= 50 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-900 text-[11px] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">High-Volume Adjustment Notice:</strong>
                    Changes exceeding 50 units require Super Admin audit trail verification and will be flagged for review.
                  </div>
                </div>
              )}

              {/* Reason Selection */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Mandatory Audit Reason *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl font-medium"
                >
                  {adjustType === 'ADD' ? (
                    <>
                      <option value="Supplier Batch Restock">Supplier Batch Restock (Artisan Intake)</option>
                      <option value="Customer Return Restock">Customer Return Restock (RMA Inspected)</option>
                      <option value="Physical Inventory Count Gain">Physical Inventory Count Gain (Audit Reconcile)</option>
                    </>
                  ) : (
                    <>
                      <option value="Damaged / Scrap Write-off">Damaged / Scrap Write-off</option>
                      <option value="QC Rejection at Warehouse Hub">QC Rejection at Warehouse Hub</option>
                      <option value="Transit Broken / Destroyed">Transit Broken / Destroyed</option>
                      <option value="Display / Artisan Sample Dispatch">Display / Artisan Sample Dispatch</option>
                      <option value="Physical Inventory Shrinkage">Physical Inventory Shrinkage / Missing Count</option>
                    </>
                  )}
                </select>
              </div>

              {/* Warehouse & Lot Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Warehouse Hub</label>
                  <select
                    value={adjustWarehouse}
                    onChange={(e) => setAdjustWarehouse(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  >
                    <option value="Tejgaon Central Fulfillment Hub, Dhaka">Tejgaon Hub, Dhaka</option>
                    <option value="Chittagong Agrabad Regional Hub">Agrabad Hub, CTG</option>
                    <option value="Sylhet Zindabazar Hub">Zindabazar Hub, Sylhet</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Lot / Batch Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. LOT-2026-08"
                    value={adjustBatchNo}
                    onChange={(e) => setAdjustBatchNo(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Operator Notes */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Operator Notes / PO Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Batch inspected by textile QC officer"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-4 py-2 bg-stone-100 text-stone-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmittingAdjust ? 'Recording Audit...' : 'Execute Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
      </AdminModalShell>

      {/* Barcode & SKU Thermal Tag Generator Modal */}
      <AdminModalShell
        open={!!barcodeProduct}
        onClose={() => setBarcodeProduct(null)}
        label="Barcode & SKU Thermal Tag Generator Modal"
        overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-stone-700" />
                <h3 className="text-base font-serif font-bold text-stone-900">Thermal SKU Barcode Tag</h3>
              </div>
              <button onClick={() => setBarcodeProduct(null)} className="text-stone-400 hover:text-stone-900">✕</button>
            </div>

            {/* Visual Tag Simulation */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-300 text-center space-y-3 font-mono">
              <div className="text-[10px] tracking-widest text-stone-500 uppercase font-bold">
                কিশলয় | KISHOLOY ARTISANAL BD
              </div>
              <div className="text-xs font-bold text-stone-900 line-clamp-1 font-serif">
                {barcodeProduct.title}
              </div>
              {barcodeProduct.titleBn && (
                <div className="text-[11px] text-stone-600 font-serif">
                  {barcodeProduct.titleBn}
                </div>
              )}

              {/* 1D Barcode CSS visual simulation */}
              <div className="py-2 flex items-center justify-center">
                <div className="space-y-1">
                  <div className="flex items-end justify-center h-14 gap-0.5 bg-white p-2 border border-stone-300 rounded">
                    {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3, 2, 7].map((h, idx) => (
                      <div
                        key={idx}
                        className="bg-black"
                        style={{
                          width: `${(idx % 3 === 0 ? 2 : 1)}px`,
                          height: `${40 + (h % 5) * 3}px`
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-[11px] font-bold text-stone-900 tracking-wider">
                    {barcodeProduct.sku}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-stone-200">
                <span className="text-stone-500">Retail Price:</span>
                <span className="text-stone-900 text-sm">৳{barcodeProduct.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setBarcodeProduct(null)}
                className="px-4 py-2 bg-stone-100 text-stone-800 rounded-xl font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-xs hover:bg-black"
              >
                Print Thermal Label
              </button>
            </div>
          </div>
      </AdminModalShell>
    </div>
  );
}
