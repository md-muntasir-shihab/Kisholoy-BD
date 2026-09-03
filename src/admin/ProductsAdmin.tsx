import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Search, Trash2, Edit2, CheckCircle2, AlertTriangle, Boxes, ArrowUpDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';

export function ProductsAdmin() {
  const { products, categories, addProduct, updateProduct, deleteProduct, language } = useApp();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for new product
  const [title, setTitle] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Traditional Clothing');
  const [price, setPrice] = useState(1500);
  const [costPrice, setCostPrice] = useState(900);
  const [stock, setStock] = useState(20);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('Artisan Handcrafted');

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const catObj = categories.find((c) => c.name === category);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    addProduct({
      title,
      titleBn: titleBn || title,
      slug,
      description: description || 'Artisanal authentic handcrafted masterpiece.',
      descriptionBn: titleBn || 'হস্তনির্মিত ঐতিহ্যবাহী খাঁটি পণ্য।',
      price: Number(price),
      costPrice: Number(costPrice),
      sku: sku.toUpperCase(),
      category,
      categorySlug: catObj?.slug || 'traditional-clothing',
      images: [imageUrl],
      stock: Number(stock),
      rating: 5.0,
      reviewsCount: 0,
      badge,
      badgeBn: 'হস্তনির্মিত',
      isFeatured: true,
      readyToShip: true
    });

    setShowAddModal(false);
    setTitle('');
    setTitleBn('');
    setSku('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">Products Catalog Management</h1>
          <p className="text-xs text-stone-500">Manage multilingual merchandise, pricing, cost tracking, and live catalog visibility.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/inventory"
            className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-stone-300"
          >
            <Boxes className="w-4 h-4 text-stone-600" />
            <span>Stock Ledger & POs</span>
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-teal-900 text-white rounded-lg text-xs font-bold hover:bg-teal-950 flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
          />
        </div>
        <span className="text-xs font-semibold text-stone-500">
          Total Products: {products.length}
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Retail Price</th>
                <th className="p-4">Cost Price</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-stone-200" />
                      <div>
                        <span className="font-bold text-stone-900 block">{p.title}</span>
                        <span className="text-stone-400 font-bangla text-[11px]">{p.titleBn}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-semibold text-stone-600">
                    {p.sku}
                  </td>
                  <td className="p-4 text-stone-600">
                    {p.category}
                  </td>
                  <td className="p-4 font-bold text-stone-900 font-mono">
                    ৳ {p.price.toLocaleString()}
                  </td>
                  <td className="p-4 text-stone-500 font-mono">
                    ৳ {p.costPrice.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      p.stock <= 5 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-50 text-emerald-800'
                    }`}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded hover:bg-stone-100"
                      title="Delete Product"
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <h3 className="text-base font-serif font-bold text-stone-900">Add New Artisan Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-900">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Product Title (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tangail Pure Silk Handloom Saree"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Product Title (Bangla) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. টাঙ্গাইল পিউর সিল্ক তাঁতের শাড়ি"
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 font-bangla"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KSH-TNG-007"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-lg uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-lg"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Retail Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Cost Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full p-2.5 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Image URL (Unsplash or direct asset)</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-lg"
                  placeholder="e.g. Masterpiece Edition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-800 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-900 text-white rounded-lg font-bold hover:bg-teal-950"
                >
                  Publish Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
