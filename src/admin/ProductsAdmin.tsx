import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Plus, Search, Trash2, Edit2, Boxes, Filter, 
  Eye, Activity, Tag, ArrowUpRight, ArrowDownRight, Archive, 
  Briefcase, FileText, Anchor, Copy, Download, ExternalLink, 
  CheckSquare, Square, Check, X, SlidersHorizontal, AlertCircle, 
  Truck, DollarSign, Globe, Sparkles, LayoutGrid, List, ChevronRight,
  ArrowUpDown, RefreshCw, Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, Supplier } from '../types';
import { ProductQuickViewModal } from '../components/admin/ProductQuickViewModal';
import { ProductEditModal } from '../components/admin/ProductEditModal';
import { ProductDeleteConfirmModal } from '../components/admin/ProductDeleteConfirmModal';
import { productSchema, formatZodError } from '../lib/validations';
import { AdminModalShell } from '../components/admin/AdminModalShell';

export function ProductsAdmin() {
  const { products, categories, addProduct, updateProduct, deleteProduct, language, showToast } = useApp();

  // Search, Filters & Sorting
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [stockFilter, setStockFilter] = useState('All Status');
  const [supplierFilter, setSupplierFilter] = useState('All Suppliers');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'title-asc'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProductForView, setSelectedProductForView] = useState<Product | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Add Product Form State
  const [addTitle, setAddTitle] = useState('');
  const [addTitleBn, setAddTitleBn] = useState('');
  const [addSku, setAddSku] = useState('');
  const [addCategory, setAddCategory] = useState(categories[0]?.name || 'Traditional Clothing');
  const [addPrice, setAddPrice] = useState(1500);
  const [addOriginalPrice, setAddOriginalPrice] = useState<number | ''>('');
  const [addCostPrice, setAddCostPrice] = useState(900);
  const [addTaxRate, setAddTaxRate] = useState(0);
  const [addStock, setAddStock] = useState(20);
  const [addLowStockThreshold, setAddLowStockThreshold] = useState(5);
  const [addWeight, setAddWeight] = useState(0.5);
  const [addMaterial, setAddMaterial] = useState('');
  const [addOrigin, setAddOrigin] = useState('');
  const [addImageUrl, setAddImageUrl] = useState('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800');
  const [addDescription, setAddDescription] = useState('');
  const [addDescriptionBn, setAddDescriptionBn] = useState('');
  const [addBadge, setAddBadge] = useState('Artisan Handcrafted');
  const [addBadgeBn, setAddBadgeBn] = useState('হস্তনির্মিত');
  const [addReadyToShip, setAddReadyToShip] = useState(true);
  const [addIsFeatured, setAddIsFeatured] = useState(true);
  const [addSupplierId, setAddSupplierId] = useState('');
  const [addFormTab, setAddFormTab] = useState<'general' | 'finance' | 'logistics'>('general');

  useEffect(() => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.suppliers) {
          setSuppliers(data.suppliers);
          if (data.suppliers.length > 0 && !addSupplierId) {
            setAddSupplierId(data.suppliers[0].id);
          }
        }
      })
      .catch(err => {
        // An empty supplier dropdown looks like "no suppliers exist" rather
        // than "the list failed to load" (F-305).
        console.error(err);
        showToast('Could not load the supplier list — the supplier field may be empty.');
      });
  }, []);

  // Financial KPI Metrics
  const metrics = useMemo(() => {
    let totalRetailVal = 0;
    let totalCostVal = 0;
    let lowStock = 0;
    let outOfStock = 0;
    const uniqueCats = new Set<string>();

    products.forEach(p => {
      totalRetailVal += p.price * p.stock;
      totalCostVal += (p.costPrice || 0) * p.stock;
      const threshold = p.lowStockThreshold || 5;
      if (p.stock === 0) outOfStock++;
      else if (p.stock <= threshold) lowStock++;
      uniqueCats.add(p.category);
    });

    return { 
      totalRetailVal, 
      totalCostVal, 
      projectedProfit: totalRetailVal - totalCostVal,
      lowStock, 
      outOfStock, 
      activeCategories: uniqueCats.size 
    };
  }, [products]);

  // Margin calculation helpers
  const getMargin = (price: number, cost: number, taxRate: number = 0) => {
    if (!price || !cost) return '0.0';
    const postTaxPrice = price - (price * (taxRate / 100));
    return (((postTaxPrice - cost) / postTaxPrice) * 100).toFixed(1);
  };

  const getMarginValue = (price: number, cost: number, taxRate: number = 0) => {
    const postTaxPrice = price - (price * (taxRate / 100));
    return postTaxPrice - cost;
  };

  // Filter and Sort Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const q = search.toLowerCase().trim();
        const matchesSearch = 
          !q ||
          p.title.toLowerCase().includes(q) ||
          (p.titleBn && p.titleBn.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);

        const matchesCategory = categoryFilter === 'All Categories' || p.category === categoryFilter;

        let matchesStock = true;
        const threshold = p.lowStockThreshold || 5;
        if (stockFilter === 'In Stock') matchesStock = p.stock > threshold;
        if (stockFilter === 'Low Stock') matchesStock = p.stock > 0 && p.stock <= threshold;
        if (stockFilter === 'Out of Stock') matchesStock = p.stock === 0;

        const matchesSupplier = 
          supplierFilter === 'All Suppliers' || 
          (supplierFilter === 'internal' && !p.supplierId) ||
          p.supplierId === supplierFilter;

        return matchesSearch && matchesCategory && matchesStock && matchesSupplier;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'stock-asc') return a.stock - b.stock;
        if (sortBy === 'stock-desc') return b.stock - a.stock;
        if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
        return 0; // Default order
      });
  }, [products, search, categoryFilter, stockFilter, supplierFilter, sortBy]);

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Quick Stock Adjustment (+ / -)
  const handleAdjustStock = (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    updateProduct(product.id, { stock: newStock });
    showToast(
      language === 'BN' 
        ? `${product.title}: স্টক আপডেট হয়েছে (${newStock} টি)` 
        : `${product.title}: stock updated to ${newStock} units`
    );
  };

  // Quick Status Toggle (Ready to Ship / Featured)
  const handleToggleStatus = (product: Product, field: 'readyToShip' | 'isFeatured') => {
    const updatedVal = !product[field];
    updateProduct(product.id, { [field]: updatedVal });
    showToast(
      language === 'BN'
        ? `${product.title}: ${field === 'readyToShip' ? 'রেডি টু শিপ' : 'ফিচার্ড'} স্ট্যাটাস পরিবর্তিত`
        : `${product.title}: ${field === 'readyToShip' ? 'Ready to ship' : 'Featured'} set to ${updatedVal ? 'Active' : 'Inactive'}`
    );
  };

  // Duplicate / Clone Product
  const handleDuplicateProduct = (product: Product) => {
    const newSku = `${product.sku}-CPY${Math.floor(Math.random() * 90 + 10)}`;
    const newSlug = `${product.slug}-copy-${Date.now().toString().slice(-4)}`;

    addProduct({
      ...product,
      title: `${product.title} (Copy)`,
      titleBn: product.titleBn ? `${product.titleBn} (কপি)` : `${product.title} (Copy)`,
      sku: newSku,
      slug: newSlug,
      stock: 5,
      isFeatured: false
    });

    showToast(
      language === 'BN'
        ? `পণ্যটি ডুপ্লিকেট করা হয়েছে (নতুন SKU: ${newSku})`
        : `Product cloned successfully (New SKU: ${newSku})`
    );
  };

  // Create Product Handler
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const catObj = categories.find((c) => c.name === addCategory);
    const slug = addTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const rawProduct = {
      title: addTitle.trim(),
      titleBn: addTitleBn.trim() || addTitle.trim(),
      slug,
      sku: addSku.toUpperCase().trim(),
      category: addCategory,
      categorySlug: catObj?.slug || 'traditional-clothing',
      description: addDescription.trim() || 'Artisanal authentic handcrafted masterpiece.',
      descriptionBn: addDescriptionBn.trim() || addTitleBn.trim() || 'হস্তনির্মিত ঐতিহ্যবাহী খাঁটি পণ্য।',
      price: Number(addPrice),
      originalPrice: addOriginalPrice && Number(addOriginalPrice) > Number(addPrice) ? Number(addOriginalPrice) : undefined,
      costPrice: Number(addCostPrice || 0),
      taxRate: Number(addTaxRate || 0),
      stock: Number(addStock || 0),
      lowStockThreshold: Number(addLowStockThreshold || 5),
      images: [addImageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'],
      badge: addBadge || undefined,
      badgeBn: addBadgeBn || undefined,
      isFeatured: addIsFeatured,
      readyToShip: addReadyToShip,
      supplierId: addSupplierId || undefined,
      rating: 5.0,
      reviewsCount: 0,
      attributes: {
        weight: addWeight.toString(),
        material: addMaterial.trim() || undefined,
        origin: addOrigin.trim() || undefined
      }
    };

    // Zod validation check
    const validationResult = productSchema.safeParse(rawProduct);
    if (!validationResult.success) {
      const errorMsg = formatZodError(validationResult.error);
      showToast('error', errorMsg);
      return;
    }

    // Call addProduct with validated data
    addProduct(validationResult.data as any);

    setShowAddModal(false);
    setAddTitle('');
    setAddTitleBn('');
    setAddSku('');
    setAddDescription('');
    setAddDescriptionBn('');
    setAddOriginalPrice('');
    setAddMaterial('');
    setAddOrigin('');
    setAddFormTab('general');
  };

  // Bulk Actions
  const handleBulkDeleteConfirm = () => {
    selectedIds.forEach(id => deleteProduct(id));
    setSelectedIds([]);
    setIsBulkDeleteModalOpen(false);
    showToast(
      language === 'BN'
        ? 'নির্বাচিত পণ্যসমূহ সফলভাবে অপসারণ করা হয়েছে'
        : 'Selected products removed from catalog'
    );
  };

  const handleBulkReadyToShip = (ready: boolean) => {
    selectedIds.forEach(id => updateProduct(id, { readyToShip: ready }));
    setSelectedIds([]);
    showToast(
      language === 'BN'
        ? `${selectedIds.length}টি পণ্যের স্থিতি পরিবর্তন করা হয়েছে`
        : `Updated visibility for ${selectedIds.length} products`
    );
  };

  // Export CSV
  const handleExportCSV = (exportSelectedOnly: boolean = false) => {
    const listToExport = exportSelectedOnly && selectedIds.length > 0
      ? products.filter(p => selectedIds.includes(p.id))
      : filteredProducts;

    if (listToExport.length === 0) {
      showToast(language === 'BN' ? 'এক্সপোর্ট করার জন্য কোনো পণ্য নেই' : 'No products to export');
      return;
    }

    const headers = [
      'SKU', 'Title (EN)', 'Title (BN)', 'Category', 'Price (BDT)', 
      'Cost Price (COGS)', 'Tax Rate (%)', 'Margin (%)', 'Stock', 
      'Low Stock Threshold', 'Supplier', 'Ready To Ship', 'Featured'
    ];

    const rows = listToExport.map(p => {
      const sup = suppliers.find(s => s.id === p.supplierId);
      const margin = getMargin(p.price, p.costPrice, p.taxRate || 0);
      return [
        `"${p.sku}"`,
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${(p.titleBn || '').replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.price,
        p.costPrice,
        p.taxRate || 0,
        margin,
        p.stock,
        p.lowStockThreshold || 5,
        `"${(sup?.companyName || 'Internal').replace(/"/g, '""')}"`,
        p.readyToShip ? 'Yes' : 'No',
        p.isFeatured ? 'Yes' : 'No'
      ].join(',');
    });

    // UTF-8 BOM for Excel Bengali character compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kisholoy_products_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(
      language === 'BN'
        ? `${listToExport.length}টি পণ্যের তালিকা CSV ফাইলে এক্সপোর্ট হয়েছে`
        : `Exported ${listToExport.length} products to CSV`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-3 sm:px-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {language === 'BN' ? 'পণ্য ক্যাটালগ ব্যবস্থাপনা' : 'Products Catalog Management'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200">
              {products.length} {language === 'BN' ? 'টি পণ্য' : 'Items'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {language === 'BN' 
              ? 'বহুভাষিক পণ্য, মূল্য, COGS হিসাব, স্টক নিরীক্ষণ এবং লাইভ ক্যাটালগ দৃশ্যমানতা পরিচালনা করুন।' 
              : 'Manage multilingual merchandise, pricing, COGS unit economics, live stock levels, and procurement ledgers.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleExportCSV(false)}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-stone-200 shadow-2xs transition-colors min-h-[40px]"
            title="Export catalog data to CSV"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>{language === 'BN' ? 'CSV এক্সপোর্ট' : 'Export CSV'}</span>
          </button>

          <Link
            to="/admin/inventory"
            className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-stone-200 shadow-2xs transition-colors min-h-[40px]"
          >
            <Boxes className="w-4 h-4 text-stone-500" />
            <span>{language === 'BN' ? 'স্টক লেজার ও পিও' : 'Stock Ledger & POs'}</span>
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'BN' ? 'নতুন পণ্য যোগ করুন' : 'Add New Product'}</span>
          </button>
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500">Live Products</span>
            <span className="p-1.5 bg-stone-100 rounded-lg text-stone-600"><Package className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-stone-900">{products.length}</span>
            <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded">Active</span>
          </div>
        </div>
        
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500">Inventory Valuation</span>
            <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><DollarSign className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-stone-900 font-mono">৳{(metrics.totalRetailVal / 1000).toFixed(1)}k</span>
            <span className="text-[10px] text-stone-400 font-mono">Cost: ৳{(metrics.totalCostVal / 1000).toFixed(1)}k</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500">Stock Alerts</span>
            <span className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><Archive className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-amber-600">{metrics.lowStock}</span>
              <span className="text-[10px] text-stone-400 font-semibold uppercase">Low</span>
            </div>
            <div className="w-px h-5 bg-stone-200"></div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-red-600">{metrics.outOfStock}</span>
              <span className="text-[10px] text-stone-400 font-semibold uppercase">Empty</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500">Projected Margin</span>
            <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><Activity className="w-4 h-4" /></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-stone-900 font-mono">৳{(metrics.projectedProfit / 1000).toFixed(1)}k</span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              {metrics.totalRetailVal > 0 ? `${((metrics.projectedProfit / metrics.totalRetailVal) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={language === 'BN' ? 'শিরোনাম, SKU বা ক্যাটাগরি দিয়ে খুঁজুন...' : 'Search by title, SKU, or category...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-10 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-900/20 focus:bg-white transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')} 
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-900/20 font-semibold text-stone-700 cursor-pointer min-h-[38px]"
            >
              <option value="All Categories">{language === 'BN' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-900/20 font-semibold text-stone-700 cursor-pointer min-h-[38px]"
            >
              <option value="All Status">{language === 'BN' ? 'সকল স্টক অবস্থা' : 'All Stock Status'}</option>
              <option value="In Stock">{language === 'BN' ? 'মজুদ আছে (নিরাপদ)' : 'In Stock (Safe)'}</option>
              <option value="Low Stock">{language === 'BN' ? 'স্বল্প মজুদ (সতর্কতা)' : 'Low Stock (Alert)'}</option>
              <option value="Out of Stock">{language === 'BN' ? 'মজুদ শেষ' : 'Out of Stock'}</option>
            </select>

            {/* Supplier Filter */}
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-900/20 font-semibold text-stone-700 cursor-pointer min-h-[38px]"
            >
              <option value="All Suppliers">{language === 'BN' ? 'সকল সরবরাহকারী' : 'All Suppliers'}</option>
              <option value="internal">{language === 'BN' ? 'অভ্যন্তরীণ উৎপাদন' : 'Internal / Direct'}</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-900/20 font-semibold text-stone-700 cursor-pointer min-h-[38px]"
            >
              <option value="newest">{language === 'BN' ? 'সর্বশেষ তালিকাভুক্ত' : 'Sort: Default / New'}</option>
              <option value="price-asc">{language === 'BN' ? 'মূল্য: কম থেকে বেশি' : 'Price: Low to High'}</option>
              <option value="price-desc">{language === 'BN' ? 'মূল্য: বেশি থেকে কম' : 'Price: High to Low'}</option>
              <option value="stock-asc">{language === 'BN' ? 'মজুদ: কম থেকে বেশি' : 'Stock: Low to High'}</option>
              <option value="stock-desc">{language === 'BN' ? 'মজুদ: বেশি থেকে কম' : 'Stock: High to Low'}</option>
              <option value="title-asc">{language === 'BN' ? 'নাম: ক-হ (A-Z)' : 'Name: A to Z'}</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-700'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-700'
                }`}
                title="Cards View"
                aria-label="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Bulk Actions Banner */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              <span className="text-xs font-bold text-teal-950">
                {selectedIds.length} {language === 'BN' ? 'টি পণ্য নির্বাচিত' : 'products selected'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExportCSV(true)}
                className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 rounded-lg text-xs font-bold border border-stone-300 shadow-2xs transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5 text-stone-500" />
                <span>Export Selected</span>
              </button>

              <button
                onClick={() => handleBulkReadyToShip(true)}
                className="px-3 py-1.5 bg-teal-900 hover:bg-teal-950 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
              >
                Set Active
              </button>

              <button
                onClick={() => handleBulkReadyToShip(false)}
                className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-bold border border-stone-300 shadow-2xs transition-colors"
              >
                Pause Selected
              </button>

              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 text-stone-500 hover:text-stone-800 text-xs font-semibold"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Content Container */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center shadow-2xs">
          <Package className="w-12 h-12 mx-auto mb-3 text-stone-300" />
          <h3 className="text-base font-bold text-stone-900">
            {language === 'BN' ? 'কোনো পণ্য খুঁজে পাওয়া যায়নি' : 'No products found'}
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {language === 'BN' 
              ? 'আপনার অনুসন্ধান শব্দ বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।' 
              : 'Try changing your search terms or clearing your category and stock filters.'}
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('All Categories');
              setStockFilter('All Status');
              setSupplierFilter('All Suppliers');
            }}
            className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* 1. Mobile Cards Layout (Shown on mobile or when cards mode is active) */}
          <div className={`${viewMode === 'cards' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'block md:hidden space-y-3'}`}>
            {filteredProducts.map((p) => {
              const threshold = p.lowStockThreshold || 5;
              const marginPercent = getMargin(p.price, p.costPrice, p.taxRate || 0);
              const marginVal = getMarginValue(p.price, p.costPrice, p.taxRate || 0);
              const isLow = p.stock > 0 && p.stock <= threshold;
              const isOut = p.stock === 0;
              const supplier = suppliers.find(s => s.id === p.supplierId);
              const isSelected = selectedIds.includes(p.id);

              return (
                <div 
                  key={p.id} 
                  className={`bg-white rounded-xl border p-4 shadow-2xs transition-all flex flex-col justify-between ${
                    isSelected ? 'border-teal-900 ring-2 ring-teal-900/10' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div>
                    {/* Top Row: Checkbox, Status & SKU */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSelect(p.id)}
                          className="text-stone-400 hover:text-teal-900 p-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-teal-900" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <span className="font-mono font-bold text-xs text-stone-700">{p.sku}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isOut 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : isLow 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>

                    {/* Product Image & Info */}
                    <div className="flex gap-3 mb-3">
                      <img 
                        src={p.images[0]} 
                        alt={p.title} 
                        className="w-16 h-16 rounded-lg object-cover border border-stone-200 flex-shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-stone-900 text-sm truncate leading-snug" title={p.title}>
                          {p.title}
                        </h4>
                        {p.titleBn && (
                          <p className="font-bangla text-stone-500 text-xs truncate mt-0.5" title={p.titleBn}>
                            {p.titleBn}
                          </p>
                        )}
                        <p className="text-[11px] text-stone-400 mt-1">
                          {p.category} {supplier ? `· ${supplier.companyName}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Pricing & Stock Grid */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Selling Price</span>
                        <span className="font-bold font-mono text-stone-900">৳{p.price.toLocaleString()}</span>
                        <span className="text-[10px] text-stone-500 block font-mono">Cost: ৳{p.costPrice.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Margin & Unit Profit</span>
                        <span className={`font-mono font-bold ${Number(marginPercent) < 20 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {marginPercent}% (৳{marginVal.toFixed(0)})
                        </span>
                        <span className="text-[10px] text-stone-400 block">{p.taxRate ? `Tax: ${p.taxRate}%` : 'Tax Exempt'}</span>
                      </div>
                    </div>

                    {/* Stock Counter Stepper */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-stone-100/70 border border-stone-200 mb-3">
                      <span className="text-xs font-semibold text-stone-600">Stock Qty:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAdjustStock(p, -1)}
                          disabled={p.stock <= 0}
                          className="w-7 h-7 bg-white hover:bg-stone-200 disabled:opacity-40 rounded flex items-center justify-center font-bold text-stone-700 border border-stone-300 shadow-2xs"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs px-2 text-stone-900 min-w-[28px] text-center">
                          {p.stock}
                        </span>
                        <button
                          onClick={() => handleAdjustStock(p, 1)}
                          className="w-7 h-7 bg-white hover:bg-stone-200 rounded flex items-center justify-center font-bold text-stone-700 border border-stone-300 shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Action Buttons (Full Width & Touch-Optimized) */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => setSelectedProductForView(p)}
                      className="py-2 bg-stone-100 hover:bg-teal-50 hover:text-teal-900 text-stone-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 min-h-[40px]"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </button>

                    <button
                      onClick={() => setSelectedProductForEdit(p)}
                      className="py-2 bg-stone-100 hover:bg-amber-50 hover:text-amber-800 text-stone-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 min-h-[40px]"
                      title="Edit Product"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      onClick={() => handleDuplicateProduct(p)}
                      className="py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 min-h-[40px]"
                      title="Duplicate Product"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="hidden sm:inline">Clone</span>
                    </button>

                    <button
                      onClick={() => setProductToDelete(p)}
                      className="py-2 bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 min-h-[40px]"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Desktop Table Layout (Shown on tablet and desktop when in table mode) */}
          <div className={`${viewMode === 'table' ? 'hidden md:block' : 'hidden'} bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-200 text-[10px]">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <button 
                        onClick={handleSelectAll}
                        className="text-stone-400 hover:text-teal-900"
                        title="Select All"
                      >
                        {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-teal-900" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-3.5 w-8">Status</th>
                    <th className="p-3.5">Product Details</th>
                    <th className="p-3.5">SKU / Category</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Pricing & Margin</th>
                    <th className="p-3.5">Stock Level</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map((p) => {
                    const threshold = p.lowStockThreshold || 5;
                    const marginPercent = getMargin(p.price, p.costPrice, p.taxRate || 0);
                    const marginValue = getMarginValue(p.price, p.costPrice, p.taxRate || 0);
                    const isLow = p.stock > 0 && p.stock <= threshold;
                    const isOut = p.stock === 0;
                    const supplier = suppliers.find(s => s.id === p.supplierId);
                    const isSelected = selectedIds.includes(p.id);

                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-stone-50/90 transition-colors group ${isSelected ? 'bg-teal-50/40' : ''}`}
                      >
                        {/* Checkbox Column */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleToggleSelect(p.id)}
                            className="text-stone-400 hover:text-teal-900"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-teal-900" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Status Indicator Dot */}
                        <td className="p-3.5">
                          <div 
                            className={`w-2.5 h-2.5 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-emerald-500'} shadow-2xs`}
                            title={isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          />
                        </td>

                        {/* Product Title & Thumbnail */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img 
                              src={p.images[0]} 
                              alt={p.title} 
                              className="w-11 h-11 rounded-lg object-cover border border-stone-200 shadow-2xs flex-shrink-0" 
                            />
                            <div className="max-w-[220px]">
                              <span className="font-bold text-stone-900 block truncate" title={p.title}>
                                {p.title}
                              </span>
                              <span className="text-stone-500 font-bangla text-[11px] block truncate" title={p.titleBn}>
                                {p.titleBn}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* SKU & Category */}
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-stone-700">{p.sku}</div>
                          <div className="text-stone-500 text-[11px] mt-0.5">{p.category}</div>
                        </td>

                        {/* Associated Supplier */}
                        <td className="p-3.5">
                          <div className="max-w-[130px] truncate text-stone-700 font-medium" title={supplier?.companyName || 'Internal / N/A'}>
                            {supplier?.companyName || <span className="text-stone-400 italic">Internal</span>}
                          </div>
                          {supplier?.code && (
                            <span className="font-mono text-[10px] text-stone-400 block">{supplier.code}</span>
                          )}
                        </td>

                        {/* Pricing & Margin Breakdown */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div>
                              <div className="font-bold text-stone-900 font-mono">৳{p.price.toLocaleString()}</div>
                              <div className="text-stone-400 font-mono text-[10px]">
                                C: ৳{p.costPrice.toLocaleString()} {p.taxRate ? `| T: ${p.taxRate}%` : ''}
                              </div>
                            </div>
                            <div 
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                Number(marginPercent) < 20 
                                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`} 
                              title={`Unit Margin: ৳${marginValue.toFixed(0)}`}
                            >
                              {marginPercent}%
                            </div>
                          </div>
                        </td>

                        {/* Stock Level with Quick Adjustment Stepper */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                              isOut 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : isLow 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {p.stock} units
                            </span>

                            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleAdjustStock(p, -1)}
                                disabled={p.stock <= 0}
                                className="w-5 h-5 bg-stone-100 hover:bg-stone-200 disabled:opacity-30 rounded text-stone-700 flex items-center justify-center font-bold text-[10px]"
                                title="Subtract 1"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleAdjustStock(p, 1)}
                                className="w-5 h-5 bg-stone-100 hover:bg-stone-200 rounded text-stone-700 flex items-center justify-center font-bold text-[10px]"
                                title="Add 1"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Action Buttons Column */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedProductForView(p)}
                              className="p-1.5 text-stone-400 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSelectedProductForEdit(p)}
                              className="p-1.5 text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateProduct(p)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                              title="Duplicate Product"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Count */}
            <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
              <span>Showing {filteredProducts.length} of {products.length} products</span>
              <span>Sorted by: {sortBy.replace('-', ' ')}</span>
            </div>
          </div>
        </>
      )}

      {/* Product Quick View Modal */}
      <ProductQuickViewModal
        product={selectedProductForView}
        onClose={() => setSelectedProductForView(null)}
        onEdit={(prod) => {
          setSelectedProductForView(null);
          setSelectedProductForEdit(prod);
        }}
        suppliers={suppliers}
        onAdjustStock={handleAdjustStock}
        onToggleStatus={handleToggleStatus}
        language={language}
      />

      {/* Product Edit Modal */}
      <ProductEditModal
        product={selectedProductForEdit}
        isOpen={!!selectedProductForEdit}
        onClose={() => setSelectedProductForEdit(null)}
        onSave={(updates) => {
          if (selectedProductForEdit) {
            updateProduct(selectedProductForEdit.id, updates);
            setSelectedProductForEdit(null);
          }
        }}
        categories={categories}
        suppliers={suppliers}
        language={language}
      />

      {/* Single Product Delete Modal */}
      <ProductDeleteConfirmModal
        product={productToDelete}
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) {
            deleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        language={language}
      />

      {/* Bulk Delete Modal */}
      <ProductDeleteConfirmModal
        product={null}
        bulkCount={selectedIds.length}
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        language={language}
      />

      {/* Add New Product Modal */}
      <AdminModalShell
        open={!!showAddModal}
        onClose={() => setShowAddModal(false)}
        label="Add New Product Modal"
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      >
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-stone-100">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-stone-200 bg-white z-10">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {language === 'BN' ? 'নতুন পণ্য তালিকা তৈরি করুন' : 'Create Product Listing'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  {language === 'BN' ? 'ক্যাটালগ, ফিন্যান্স এবং লজিস্টিকস প্যারামিটার কনফিগার করুন।' : 'Configure catalog, finance unit economics, and logistics parameters.'}
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tabs (Responsive horizontal scroll) */}
            <div className="flex px-4 sm:px-6 border-b border-stone-200 bg-stone-50/70 overflow-x-auto scrollbar-none">
              <button 
                type="button"
                onClick={() => setAddFormTab('general')}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  addFormTab === 'general' ? 'border-teal-900 text-teal-950' : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'BN' ? 'সাধারণ তথ্য' : 'General Info'}</span>
              </button>
              <button 
                type="button"
                onClick={() => setAddFormTab('finance')}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  addFormTab === 'finance' ? 'border-teal-900 text-teal-950' : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{language === 'BN' ? 'মূল্য ও সরবরাহকারী' : 'Finance & Sourcing'}</span>
              </button>
              <button 
                type="button"
                onClick={() => setAddFormTab('logistics')}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  addFormTab === 'logistics' ? 'border-teal-900 text-teal-950' : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                <Anchor className="w-3.5 h-3.5" />
                <span>{language === 'BN' ? 'স্টক ও লজিস্টিকস' : 'Stock & Logistics'}</span>
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-sm bg-white space-y-4">
                
                {/* General Info Tab */}
                <div className={addFormTab === 'general' ? 'space-y-4 animate-in fade-in duration-150' : 'hidden'}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Product Title (English) *
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Tangail Pure Silk Handloom Saree" 
                        value={addTitle} 
                        onChange={(e) => setAddTitle(e.target.value)} 
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Product Title (Bangla) *
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. টাঙ্গাইল পিউর সিল্ক তাঁতের শাড়ি" 
                        value={addTitleBn} 
                        onChange={(e) => setAddTitleBn(e.target.value)} 
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white transition-colors font-bangla" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        SKU Code *
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. KSH-TNG-007" 
                        value={addSku} 
                        onChange={(e) => setAddSku(e.target.value)} 
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg uppercase font-mono font-bold focus:outline-none focus:border-teal-900 focus:bg-white" 
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Category *
                      </label>
                      <select 
                        value={addCategory} 
                        onChange={(e) => setAddCategory(e.target.value)} 
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white cursor-pointer font-medium"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Image URL (Unsplash or CDN) *
                    </label>
                    <input 
                      type="url" 
                      required 
                      value={addImageUrl} 
                      onChange={(e) => setAddImageUrl(e.target.value)} 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 text-xs font-mono" 
                    />
                    {addImageUrl && (
                      <div className="mt-2 flex items-center gap-3">
                        <img src={addImageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-stone-200" />
                        <span className="text-xs text-stone-500">Live preview of cover thumbnail image.</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Product Description (English)
                      </label>
                      <textarea 
                        rows={3} 
                        value={addDescription} 
                        onChange={(e) => setAddDescription(e.target.value)} 
                        placeholder="Authentic artisan handcrafted masterpiece..." 
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white resize-none text-xs" 
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Product Description (Bangla)
                      </label>
                      <textarea 
                        rows={3} 
                        value={addDescriptionBn} 
                        onChange={(e) => setAddDescriptionBn(e.target.value)} 
                        placeholder="হস্তনির্মিত ঐতিহ্যবাহী খাঁটি দেশীয় কারুপণ্য..." 
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white resize-none text-xs font-bangla" 
                      />
                    </div>
                  </div>
                </div>

                {/* Finance & Sourcing Tab */}
                <div className={addFormTab === 'finance' ? 'space-y-4 animate-in fade-in duration-150' : 'hidden'}>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-emerald-700" />
                      <h4 className="font-bold text-xs uppercase text-emerald-900 tracking-wider">
                        Financial Margin Projection
                      </h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold block">Gross Price</span>
                        <span className="font-mono font-bold text-base text-emerald-900">৳{Number(addPrice || 0).toLocaleString()}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold block">Tax Deducted</span>
                        <span className="font-mono font-bold text-base text-emerald-900">৳{(addPrice * (addTaxRate / 100)).toFixed(0)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold block">Profit Margin</span>
                        <span className="font-mono font-bold text-base text-emerald-900">{getMargin(addPrice, addCostPrice, addTaxRate)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Retail Price (৳) *
                      </label>
                      <input 
                        type="number" 
                        required 
                        value={addPrice} 
                        onChange={(e) => setAddPrice(Number(e.target.value))} 
                        className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Original Price (৳) <span className="text-stone-400 font-normal">(Optional)</span>
                      </label>
                      <input 
                        type="number" 
                        value={addOriginalPrice} 
                        onChange={(e) => setAddOriginalPrice(e.target.value ? Number(e.target.value) : '')} 
                        placeholder="e.g. 1800 (for cross-out discount)"
                        className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white text-xs" 
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Applicable Tax / VAT (%)
                      </label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={addTaxRate} 
                        onChange={(e) => setAddTaxRate(Number(e.target.value))} 
                        className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Cost Price (COGS ৳) *
                      </label>
                      <input 
                        type="number" 
                        required 
                        value={addCostPrice} 
                        onChange={(e) => setAddCostPrice(Number(e.target.value))} 
                        className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                      />
                      <p className="text-[10px] text-stone-500 mt-1">Base procurement cost for weaver accounts payable.</p>
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Associated Supplier
                      </label>
                      <select 
                        value={addSupplierId} 
                        onChange={(e) => setAddSupplierId(e.target.value)} 
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white cursor-pointer font-medium"
                      >
                        <option value="">Internal / No External Supplier</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.companyName} ({s.code})</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-stone-500 mt-1">Links product sales directly to supplier balance ledgers.</p>
                    </div>
                  </div>
                </div>

                {/* Stock & Logistics Tab */}
                <div className={addFormTab === 'logistics' ? 'space-y-4 animate-in fade-in duration-150' : 'hidden'}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Initial Stock Qty *
                      </label>
                      <input 
                        type="number" 
                        required 
                        value={addStock} 
                        onChange={(e) => setAddStock(Number(e.target.value))} 
                        className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Low Stock Threshold *
                      </label>
                      <input 
                        type="number" 
                        required 
                        value={addLowStockThreshold} 
                        onChange={(e) => setAddLowStockThreshold(Number(e.target.value))} 
                        className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                      />
                      <p className="text-[10px] text-stone-500 mt-1">Triggers reorder alert when stock falls below this number.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Unit Weight (kg) *
                      </label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        value={addWeight} 
                        onChange={(e) => setAddWeight(Number(e.target.value))} 
                        className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Material
                      </label>
                      <input 
                        type="text" 
                        value={addMaterial} 
                        onChange={(e) => setAddMaterial(e.target.value)} 
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white text-xs" 
                        placeholder="e.g. Pure Silk / Handloom Cotton" 
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Origin Hub
                      </label>
                      <input 
                        type="text" 
                        value={addOrigin} 
                        onChange={(e) => setAddOrigin(e.target.value)} 
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white text-xs" 
                        placeholder="e.g. Tangail, Bangladesh" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Badge Tag (English)
                      </label>
                      <input 
                        type="text" 
                        value={addBadge} 
                        onChange={(e) => setAddBadge(e.target.value)} 
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white text-xs" 
                        placeholder="e.g. Masterpiece Edition" 
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                        Badge Tag (Bangla)
                      </label>
                      <input 
                        type="text" 
                        value={addBadgeBn} 
                        onChange={(e) => setAddBadgeBn(e.target.value)} 
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white text-xs font-bangla" 
                        placeholder="e.g. হস্তনির্মিত মাস্টারপিস" 
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2 border-t border-stone-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={addReadyToShip} 
                        onChange={(e) => setAddReadyToShip(e.target.checked)} 
                        className="w-4 h-4 text-teal-900 rounded accent-teal-900 cursor-pointer" 
                      />
                      <span className="text-xs font-bold text-stone-800">Ready to Ship (In Hub)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={addIsFeatured} 
                        onChange={(e) => setAddIsFeatured(e.target.checked)} 
                        className="w-4 h-4 text-teal-900 rounded accent-teal-900 cursor-pointer" 
                      />
                      <span className="text-xs font-bold text-stone-800">Featured Showcase</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="k-sticky-actions px-6 py-4 border-t border-stone-200 bg-stone-50 dark:bg-slate-900/95 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-stone-500 hidden sm:block">
                  Fields with <span className="text-red-500 font-bold">*</span> are required.
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  {addFormTab !== 'general' && (
                    <button 
                      type="button" 
                      onClick={() => setAddFormTab(addFormTab === 'logistics' ? 'finance' : 'general')} 
                      className="px-3.5 py-2 text-stone-700 hover:bg-stone-200 bg-stone-100 rounded-lg font-bold text-xs transition-colors"
                    >
                      Previous
                    </button>
                  )}
                  {addFormTab !== 'logistics' && (
                    <button 
                      type="button" 
                      onClick={() => setAddFormTab(addFormTab === 'general' ? 'finance' : 'logistics')} 
                      className="px-4 py-2 bg-stone-800 text-white rounded-lg font-bold text-xs hover:bg-stone-900 transition-colors"
                    >
                      Next Step →
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)} 
                    className="px-4 py-2 text-stone-700 hover:bg-stone-200 bg-stone-100 rounded-lg font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-teal-900 text-white rounded-lg font-bold text-xs hover:bg-teal-950 transition-colors shadow-2xs"
                  >
                    Publish to Catalog
                  </button>
                </div>
              </div>
            </form>
          </div>
      </AdminModalShell>

    </div>
  );
}
