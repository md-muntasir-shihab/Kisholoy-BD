import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Briefcase, Anchor, Sparkles, Activity, 
  Check, Save, DollarSign, Package, AlertCircle 
} from 'lucide-react';
import { Product, Category, Supplier } from '../../types';
import { productUpdateSchema, formatZodError } from '../../lib/validations';

interface ProductEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Partial<Product>) => void;
  categories: Category[];
  suppliers: Supplier[];
  language: 'EN' | 'BN';
}

export function ProductEditModal({
  product,
  isOpen,
  onClose,
  onSave,
  categories,
  suppliers,
  language
}: ProductEditModalProps) {
  if (!isOpen || !product) return null;

  const [activeTab, setActiveTab] = useState<'general' | 'finance' | 'logistics' | 'merchandising'>('general');

  // Form states initialized from product
  const [title, setTitle] = useState(product.title);
  const [titleBn, setTitleBn] = useState(product.titleBn || '');
  const [sku, setSku] = useState(product.sku);
  const [category, setCategory] = useState(product.category);
  const [slug, setSlug] = useState(product.slug);
  const [description, setDescription] = useState(product.description || '');
  const [descriptionBn, setDescriptionBn] = useState(product.descriptionBn || '');
  const [imageUrl, setImageUrl] = useState(product.images?.[0] || '');

  // Finance states
  const [price, setPrice] = useState(product.price);
  const [originalPrice, setOriginalPrice] = useState(product.originalPrice || product.price);
  const [costPrice, setCostPrice] = useState(product.costPrice || 0);
  const [taxRate, setTaxRate] = useState(product.taxRate || 0);
  const [supplierId, setSupplierId] = useState(product.supplierId || '');

  // Inventory & Logistics states
  const [stock, setStock] = useState(product.stock);
  const [lowStockThreshold, setLowStockThreshold] = useState(product.lowStockThreshold || 5);
  const [weight, setWeight] = useState(Number(product.attributes?.weight) || 0.5);
  const [material, setMaterial] = useState(product.attributes?.material || '');
  const [origin, setOrigin] = useState(product.attributes?.origin || '');

  // Merchandising & Status
  const [badge, setBadge] = useState(product.badge || '');
  const [badgeBn, setBadgeBn] = useState(product.badgeBn || '');
  const [readyToShip, setReadyToShip] = useState(product.readyToShip ?? true);
  const [isFeatured, setIsFeatured] = useState(product.isFeatured ?? false);

  // Re-sync when product changes
  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setTitleBn(product.titleBn || '');
      setSku(product.sku);
      setCategory(product.category);
      setSlug(product.slug);
      setDescription(product.description || '');
      setDescriptionBn(product.descriptionBn || '');
      setImageUrl(product.images?.[0] || '');
      setPrice(product.price);
      setOriginalPrice(product.originalPrice || product.price);
      setCostPrice(product.costPrice || 0);
      setTaxRate(product.taxRate || 0);
      setSupplierId(product.supplierId || '');
      setStock(product.stock);
      setLowStockThreshold(product.lowStockThreshold || 5);
      setWeight(Number(product.attributes?.weight) || 0.5);
      setMaterial(product.attributes?.material || '');
      setOrigin(product.attributes?.origin || '');
      setBadge(product.badge || '');
      setBadgeBn(product.badgeBn || '');
      setReadyToShip(product.readyToShip ?? true);
      setIsFeatured(product.isFeatured ?? false);
    }
  }, [product]);

  // Live margin calculations
  const postTaxPrice = price - (price * (taxRate / 100));
  const marginValue = postTaxPrice - costPrice;
  const marginPercent = postTaxPrice > 0 ? (((postTaxPrice - costPrice) / postTaxPrice) * 100).toFixed(1) : '0.0';

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const catObj = categories.find(c => c.name === category);

    const updatePayload = {
      title,
      titleBn: titleBn || title,
      sku: sku.toUpperCase().trim(),
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category,
      categorySlug: catObj?.slug || product.categorySlug,
      description,
      descriptionBn,
      images: imageUrl ? [imageUrl, ...(product.images.slice(1) || [])] : product.images,
      price: Number(price),
      originalPrice: Number(originalPrice) > Number(price) ? Number(originalPrice) : undefined,
      costPrice: Number(costPrice),
      taxRate: Number(taxRate),
      supplierId: supplierId || undefined,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      readyToShip,
      isFeatured,
      badge: badge || undefined,
      badgeBn: badgeBn || undefined,
      attributes: {
        ...product.attributes,
        weight: weight.toString(),
        material: material || product.attributes?.material,
        origin: origin || product.attributes?.origin
      }
    };

    const result = productUpdateSchema.safeParse(updatePayload);
    if (!result.success) {
      setValidationError(formatZodError(result.error));
      return;
    }

    onSave(result.data as Partial<Product>);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif font-bold text-stone-900">
                {language === 'BN' ? 'পণ্য সম্পাদনা করুন' : 'Edit Product Details'}
              </h3>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200">
                {product.sku}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {language === 'BN' ? 'মূল্য, সরবরাহকারী এবং ইনভেন্টরি প্যারামিটার আপডেট করুন।' : 'Modify catalog metadata, pricing, COGS, and logistics rules.'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{validationError}</div>
            <button type="button" onClick={() => setValidationError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
          </div>
        )}

        {/* Tab Navigation (Responsive horizontal scrolling on mobile) */}
        <div className="flex px-4 sm:px-6 border-b border-stone-200 bg-stone-50/70 overflow-x-auto scrollbar-none">
          <button 
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'general' ? 'border-teal-900 text-teal-950' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'সাধারণ তথ্য' : 'General Info'}</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'finance' ? 'border-teal-900 text-teal-950' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'মূল্য ও সরবরাহকারী' : 'Finance & Sourcing'}</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('logistics')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'logistics' ? 'border-teal-900 text-teal-950' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'স্টক ও লজিস্টিকস' : 'Stock & Logistics'}</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('merchandising')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'merchandising' ? 'border-teal-900 text-teal-950' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'মার্চেন্ডাইজিং' : 'Visibility & Badges'}</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-sm bg-white space-y-5">
            
            {/* Tab 1: General Info */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Title (English) *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Title (Bangla) *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={titleBn} 
                      onChange={(e) => setTitleBn(e.target.value)} 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white transition-colors font-bangla" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      SKU Code *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={sku} 
                      onChange={(e) => setSku(e.target.value)} 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg uppercase font-mono font-bold focus:outline-none focus:border-teal-900 focus:bg-white" 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Category *
                    </label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)} 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      URL Slug
                    </label>
                    <input 
                      type="text" 
                      value={slug} 
                      onChange={(e) => setSlug(e.target.value)} 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg font-mono text-xs focus:outline-none focus:border-teal-900 focus:bg-white" 
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                    Primary Image URL
                  </label>
                  <input 
                    type="url" 
                    required 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white text-xs font-mono" 
                  />
                  {imageUrl && (
                    <div className="mt-2 flex items-center gap-3">
                      <img src={imageUrl} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-stone-200" />
                      <span className="text-xs text-stone-500">Live preview of the main cover image.</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Description (English)
                    </label>
                    <textarea 
                      rows={3} 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white text-xs resize-none" 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Description (Bangla)
                    </label>
                    <textarea 
                      rows={3} 
                      value={descriptionBn} 
                      onChange={(e) => setDescriptionBn(e.target.value)} 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white text-xs resize-none font-bangla" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Finance & Sourcing */}
            {activeTab === 'finance' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Financial Projection KPI Banner */}
                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-emerald-800" />
                    <h4 className="font-bold text-xs uppercase text-emerald-900 tracking-wider">
                      Live Unit Economics Preview
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 uppercase font-bold block">Gross Selling Price</span>
                      <span className="font-mono font-bold text-base text-emerald-950">৳ {Number(price || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 uppercase font-bold block">Tax Deducted ({taxRate}%)</span>
                      <span className="font-mono font-bold text-base text-emerald-950">
                        ৳ {(price * (taxRate / 100)).toFixed(0)}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 uppercase font-bold block">Net Profit Margin</span>
                      <span className={`font-mono font-bold text-base ${Number(marginPercent) < 20 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {marginPercent}% <span className="text-xs font-normal">({marginValue >= 0 ? '+' : ''}৳{marginValue.toFixed(0)})</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Retail Selling Price (৳) *
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={price} 
                      onChange={(e) => setPrice(Number(e.target.value))} 
                      className="w-full p-2.5 border border-stone-200 rounded-lg font-mono font-bold focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Original / Compare-At Price (৳)
                    </label>
                    <input 
                      type="number" 
                      value={originalPrice} 
                      onChange={(e) => setOriginalPrice(Number(e.target.value))} 
                      className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                      placeholder="e.g. 1800 (for discount badge)"
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
                      value={costPrice} 
                      onChange={(e) => setCostPrice(Number(e.target.value))} 
                      className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Procurement cost linked to Weaver / Supplier Accounts Payable.
                    </p>
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Applicable Tax / VAT (%)
                    </label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={taxRate} 
                      onChange={(e) => setTaxRate(Number(e.target.value))} 
                      className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                    Associated Supplier / Weaver Partner
                  </label>
                  <select 
                    value={supplierId} 
                    onChange={(e) => setSupplierId(e.target.value)} 
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white font-medium"
                  >
                    <option value="">Internal Production / No External Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName} ({s.code}) — {s.contactPerson}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Directly syncs product sales with supplier balance ledgers and POs.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Inventory & Logistics */}
            {activeTab === 'logistics' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Warehouse Stock Quantity *
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={stock} 
                      onChange={(e) => setStock(Number(e.target.value))} 
                      className="w-full p-2.5 border border-stone-200 rounded-lg font-mono font-bold focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Low Stock Alert Threshold *
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={lowStockThreshold} 
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))} 
                      className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Triggers restocking alert when stock drops below this level.
                    </p>
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
                      value={weight} 
                      onChange={(e) => setWeight(Number(e.target.value))} 
                      className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white" 
                    />
                    <p className="text-[10px] text-stone-500 mt-1">Used for Pathao/Steadfast 3PL rate calc.</p>
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Primary Material
                    </label>
                    <input 
                      type="text" 
                      value={material} 
                      onChange={(e) => setMaterial(e.target.value)} 
                      placeholder="e.g. 100% Cotton Handloom" 
                      className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Craft Origin
                    </label>
                    <input 
                      type="text" 
                      value={origin} 
                      onChange={(e) => setOrigin(e.target.value)} 
                      placeholder="e.g. Tangail, Bangladesh" 
                      className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 bg-stone-50 focus:bg-white text-xs" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Merchandising & Status */}
            {activeTab === 'merchandising' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Badge Text (English)
                    </label>
                    <input 
                      type="text" 
                      value={badge} 
                      onChange={(e) => setBadge(e.target.value)} 
                      placeholder="e.g. Artisan Handcrafted" 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs uppercase tracking-wider">
                      Badge Text (Bangla)
                    </label>
                    <input 
                      type="text" 
                      value={badgeBn} 
                      onChange={(e) => setBadgeBn(e.target.value)} 
                      placeholder="e.g. খাঁটি তাঁতের কাজ" 
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-teal-900 focus:bg-white text-xs font-bangla" 
                    />
                  </div>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 block text-xs">Ready to Ship (Active in Storefront)</span>
                      <span className="text-[11px] text-stone-500">
                        When enabled, customers can buy this product directly online.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={readyToShip} 
                        onChange={(e) => setReadyToShip(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-900"></div>
                    </label>
                  </div>

                  <div className="border-t border-stone-200 pt-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 block text-xs">Featured Product (Home Spotlight)</span>
                      <span className="text-[11px] text-stone-500">
                        Display in primary homepage collections and artisan showcases.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isFeatured} 
                        onChange={(e) => setIsFeatured(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
            <span className="text-xs text-stone-400 font-mono hidden sm:inline">
              ID: {product.id}
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-bold transition-colors"
              >
                {language === 'BN' ? 'বাতিল' : 'Cancel'}
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-teal-900 hover:bg-teal-950 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{language === 'BN' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
