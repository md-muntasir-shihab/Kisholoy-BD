import React, { useState } from 'react';
import { Folders, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Category } from '../types';

export function CategoriesAdmin() {
  // Use the context CRUD helpers, not setCategories: they persist to
  // /api/categories and emit the audit trail. Writing straight to state made
  // every created or deleted category vanish on reload (F-301).
  const { categories, products, addCategory, deleteCategory } = useApp();
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setSaving(true);
    try {
      await addCategory({
        name,
        nameBn: nameBn || name,
        slug,
        description,
        image: image || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800',
        itemCount: 0,
      });
      setName('');
      setNameBn('');
      setDescription('');
      setImage('');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900">Category Hierarchy Management</h1>
        <p className="text-xs text-stone-500">Manage storefront taxonomies, Bengali translations, and navigation tiles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Category Form */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs h-fit">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-teal-900" />
            Add New Category
          </h2>

          <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Name (English) *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pure Honey & Organic"
                className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Name (Bangla) *</label>
              <input
                type="text"
                required
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="e.g. খাঁটি সুন্দরবনের মধু"
                className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 font-bangla"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short tagline for category header..."
                className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Banner Image URL</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 border border-stone-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-900 text-white rounded-lg font-bold hover:bg-teal-950 shadow-xs"
            >
              Save Category
            </button>
          </form>
        </div>

        {/* Existing Categories List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex justify-between items-center text-xs font-bold text-stone-700 uppercase tracking-wider">
              <span>Active Taxonomies ({categories.length})</span>
            </div>

            <div className="divide-y divide-stone-200">
              {categories.map((cat) => {
                const count = products.filter(p => p.categorySlug === cat.slug).length;
                return (
                  <div key={cat.id} className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50">
                    <div className="flex items-center gap-3">
                      <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-lg object-cover border border-stone-200" />
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">{cat.name}</h4>
                        <span className="text-[11px] text-stone-400 font-bangla">{cat.nameBn}</span>
                        <span className="text-[10px] text-stone-500 block font-mono">Slug: /{cat.slug}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-1 bg-stone-100 rounded-full text-xs font-semibold text-stone-700">
                        {count} items
                      </span>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
