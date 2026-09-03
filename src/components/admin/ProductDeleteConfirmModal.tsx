import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Product } from '../../types';

interface ProductDeleteConfirmModalProps {
  product: Product | null;
  bulkCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  language: 'EN' | 'BN';
}

export function ProductDeleteConfirmModal({
  product,
  bulkCount = 0,
  isOpen,
  onClose,
  onConfirm,
  language
}: ProductDeleteConfirmModalProps) {
  if (!isOpen || (!product && bulkCount === 0)) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200">
        
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4 mx-auto border border-red-100">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-serif font-bold text-center text-stone-900">
            {bulkCount > 0 
              ? (language === 'BN' ? `${bulkCount}টি পণ্য অপসারণ নিশ্চিত করুন` : `Delete ${bulkCount} Products?`)
              : (language === 'BN' ? 'পণ্য অপসারণ নিশ্চিতকরণ' : 'Delete Product from Catalog?')}
          </h3>

          {bulkCount > 0 ? (
            <p className="text-xs text-stone-500 text-center mt-2 leading-relaxed">
              {language === 'BN'
                ? `আপনি কি নিশ্চিত যে আপনি নির্বাচিত ${bulkCount}টি পণ্য ক্যাটালগ থেকে সম্পূর্ণ অপসারণ করতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।`
                : `Are you sure you want to permanently delete the selected ${bulkCount} products from the live catalog? This action will be recorded in the security audit ledger.`}
            </p>
          ) : product && (
            <div className="mt-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover border border-stone-200" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-stone-200 flex items-center justify-center font-bold text-stone-400">
                    N/A
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-stone-900 truncate">{product.title}</p>
                  <p className="text-[11px] font-mono text-stone-500">{product.sku} · ৳{product.price.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-stone-500 text-center mt-3 leading-relaxed">
                {language === 'BN'
                  ? 'এই পণ্যটি অপসারণ করলে তা গ্রাহকদের কাছে দৃশ্যমান থাকবে না। আপনি কি নিশ্চিত?'
                  : 'Deleting this product will remove it from the online storefront and product listings. An audit log will be created.'}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-bold transition-colors"
          >
            {language === 'BN' ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'মুছে ফেলুন' : 'Confirm Delete'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
