import React from 'react';
import { Product } from '../../types';
import { AdminConfirmDialog, ConfirmItemSummary } from './AdminConfirmDialog';

interface ProductDeleteConfirmModalProps {
  product: Product | null;
  bulkCount?: number;
  productsList?: Product[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  language: 'EN' | 'BN';
}

export function ProductDeleteConfirmModal({
  product,
  bulkCount = 0,
  productsList = [],
  isOpen,
  onClose,
  onConfirm,
  language,
}: ProductDeleteConfirmModalProps) {
  const isBulk = bulkCount > 0;

  const items: ConfirmItemSummary[] = isBulk
    ? productsList.map((p) => ({
        id: p.id,
        label: p.title,
        subtext: `${p.sku} · ৳${p.price.toLocaleString()}`,
        badge: p.category,
        imageUrl: p.images?.[0],
      }))
    : product
    ? [
        {
          id: product.id,
          label: product.title,
          subtext: `${product.sku} · ৳${product.price.toLocaleString()}`,
          badge: product.category,
          imageUrl: product.images?.[0],
        },
      ]
    : [];

  return (
    <AdminConfirmDialog
      isOpen={isOpen && (isBulk || !!product)}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      language={language}
      count={isBulk ? bulkCount : undefined}
      itemTypeLabel="product"
      itemTypeLabelBn="টি পণ্য"
      title={isBulk ? `Delete ${bulkCount} Products from Catalog?` : 'Delete Product from Catalog?'}
      titleBn={isBulk ? `${bulkCount}টি পণ্য অপসারণ নিশ্চিত করুন` : 'ক্যাটালগ থেকে পণ্য অপসারণ'}
      description={
        isBulk
          ? `Are you sure you want to permanently delete the selected ${bulkCount} products? This will remove them from the storefront and customer searches.`
          : `Are you sure you want to remove "${product?.title || 'this product'}" from the active catalog?`
      }
      descriptionBn={
        isBulk
          ? `আপনি কি নিশ্চিত যে নির্বাচিত ${bulkCount}টি পণ্য স্থায়ীভাবে অপসারণ করতে চান? এর ফলে গ্রাহকরা পণ্যগুলি দেখতে পাবেন না।`
          : `আপনি কি নিশ্চিত যে "${product?.title || 'এই পণ্যটি'}" ক্যাটালগ থেকে মুছে ফেলতে চান?`
      }
      confirmLabel={isBulk ? `Delete ${bulkCount} Products` : 'Delete Product'}
      confirmLabelBn={isBulk ? `${bulkCount}টি পণ্য মুছুন` : 'পণ্যটি মুছুন'}
      items={items}
      requiresTypedConfirmation={isBulk && bulkCount >= 5}
      confirmationKeyword="DELETE"
      auditWarning={true}
    />
  );
}
