import { z } from 'zod';

// ============================================================================
// PRODUCT VALIDATION SCHEMA
// ============================================================================

export const productAttributesSchema = z.object({
  weight: z.string().optional(),
  material: z.string().optional(),
  origin: z.string().optional(),
});

export const productSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(2, { message: 'English Title must be at least 2 characters long' })
    .max(200, { message: 'Title is too long (max 200 characters)' }),
  titleBn: z
    .string()
    .min(1, { message: 'Bangla Title is required' })
    .max(200, { message: 'Bangla Title is too long' }),
  slug: z.string().min(1, { message: 'Slug is required' }),
  sku: z
    .string()
    .min(3, { message: 'SKU must be at least 3 characters' })
    .regex(/^[A-Z0-9\-_]+$/, { message: 'SKU must contain uppercase letters, numbers, hyphens or underscores' }),
  category: z.string().min(1, { message: 'Category selection is required' }),
  categorySlug: z.string().default('traditional-clothing'),
  description: z.string().min(3, { message: 'Description must be at least 3 characters' }),
  descriptionBn: z.string().optional(),
  price: z.number().positive({ message: 'Price must be greater than 0' }),
  originalPrice: z.number().positive({ message: 'Original price must be greater than 0' }).optional(),
  costPrice: z.number().min(0, { message: 'Cost price (COGS) cannot be negative' }),
  taxRate: z.number().min(0, { message: 'Tax rate cannot be negative' }).max(100, { message: 'Tax rate cannot exceed 100%' }).default(0),
  stock: z.number().int({ message: 'Stock must be an integer' }).min(0, { message: 'Stock cannot be negative' }),
  lowStockThreshold: z.number().int().min(0).default(5),
  images: z.array(z.string().url({ message: 'Please provide valid image URLs' })).min(1, { message: 'At least one image URL is required' }),
  badge: z.string().optional(),
  badgeBn: z.string().optional(),
  supplierId: z.string().optional(),
  isFeatured: z.boolean().default(false),
  readyToShip: z.boolean().default(true),
  rating: z.number().min(0).max(5).default(5.0),
  reviewsCount: z.number().min(0).default(0),
  attributes: productAttributesSchema.optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

// Partial schema for updates
export const productUpdateSchema = productSchema.partial();

// ============================================================================
// SUPPLIER VALIDATION SCHEMA
// ============================================================================

export const supplierPaymentTermsSchema = z.enum([
  'ADVANCE',
  'NET_15',
  'NET_30',
  'COD',
  'CONSIGNMENT',
]);

export const supplierSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
  contactPerson: z.string().min(2, { message: 'Contact person name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .regex(/^[0-9+\-\s()]+$/, { message: 'Invalid phone number format' }),
  secondaryPhone: z.string().optional(),
  address: z.string().min(3, { message: 'Address must be at least 3 characters' }),
  district: z.string().default('Dhaka'),
  categoriesSupplied: z.array(z.string()).default([]),
  tradeLicenseNumber: z.string().optional(),
  tinNumber: z.string().optional(),
  vatRegistrationNumber: z.string().optional(),
  paymentTerms: supplierPaymentTermsSchema.default('NET_30'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

export const supplierUpdateSchema = supplierSchema.partial();

// ============================================================================
// PURCHASE ORDER VALIDATION SCHEMA
// ============================================================================

export const purchaseOrderItemSchema = z.object({
  productId: z.string().optional(),
  productTitle: z.string().min(1, { message: 'Product title is required' }),
  sku: z.string().default('SKU-GEN'),
  quantity: z.number().int({ message: 'Quantity must be a whole number' }).positive({ message: 'Quantity must be at least 1' }),
  unitCost: z.number().min(0, { message: 'Unit cost cannot be negative' }),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, { message: 'Supplier selection is required' }),
  expectedDeliveryDate: z.string().min(1, { message: 'Delivery date is required' }),
  warehouseId: z.string().min(1, { message: 'Warehouse selection is required' }),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, { message: 'At least one item is required in the PO' }),
  operatorName: z.string().optional(),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

/**
 * Format Zod validation errors into a clean, human-readable string for Toast notifications
 */
export function formatZodError(error: z.ZodError): string {
  if (!error || !error.issues || error.issues.length === 0) {
    return 'Invalid data submitted.';
  }
  return error.issues.map((issue) => issue.message).join(' | ');
}

// ============================================================================
// MARKETING COMMAND CENTER VALIDATION SCHEMAS (Phase MC-1 / MC-2 / MC-3)
// ============================================================================

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const marketingChannelCreateSchema = z.object({
  type: z.enum(['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'TELEGRAM', 'OTHER'], {
    message: 'Channel type must be FACEBOOK, INSTAGRAM, WHATSAPP, TELEGRAM or OTHER',
  }),
  name: z.string().min(2, { message: 'Channel name must be at least 2 characters' }).max(120),
  handle: z.string().min(1, { message: 'Page/Channel handle is required' }).max(120),
  pageUrl: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).default('ACTIVE'),
  utmSourcePatterns: z.array(z.string().min(1).max(40)).max(20).default([]),
  notes: z.string().max(500).optional().or(z.literal('')),
  actor: z.string().max(80).optional(),
});

export const marketingChannelUpdateSchema = z.object({
  name: z.string().min(2, { message: 'Channel name must be at least 2 characters' }).max(120).optional(),
  handle: z.string().min(1, { message: 'Page/Channel handle is required' }).max(120).optional(),
  pageUrl: z.string().max(500).optional().or(z.literal('')),
  utmSourcePatterns: z.array(z.string().min(1).max(40)).max(20).optional(),
  notes: z.string().max(500).optional().or(z.literal('')),
  actor: z.string().max(80).optional(),
});

export const marketingChannelStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED'], { message: 'Invalid status value' }),
  note: z.string().max(300).optional().or(z.literal('')),
  actor: z.string().max(80).optional(),
});

export const marketingSpendEntrySchema = z.object({
  entryType: z.enum(['AD', 'BOOST', 'SEND'], { message: 'Entry type must be AD, BOOST or SEND' }),
  channelId: z.string().min(1, { message: 'Marketing channel selection is required' }),
  campaignId: z.string().min(1).optional().or(z.literal('')),
  dateFrom: z.string().regex(ISO_DATE_RE, { message: 'Start date must be in YYYY-MM-DD format' }),
  dateTo: z.string().regex(ISO_DATE_RE, { message: 'End date must be in YYYY-MM-DD format' }),
  amountBdt: z
    .number({ message: 'Spend amount must be a number' })
    .min(0.01, { message: 'Spend amount must be greater than 0 BDT' })
    .max(100000000, { message: 'Spend amount exceeds the allowed ledger limit' }),
  impressions: z.number().int().min(0, { message: 'Impressions cannot be negative' }).default(0),
  clicks: z.number().int().min(0, { message: 'Clicks cannot be negative' }).default(0),
  sends: z.number().int().min(0, { message: 'Sends cannot be negative' }).default(0),
  utmSource: z.string().max(60).optional().or(z.literal('')),
  utmCampaign: z.string().max(120).optional().or(z.literal('')),
  utmContent: z.string().max(120).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  financeExpenseRef: z.string().max(60).optional().or(z.literal('')),
  actor: z.string().max(80).optional(),
});

export const marketingSpendUpdateSchema = z.object({
  entryType: z.enum(['AD', 'BOOST', 'SEND']).optional(),
  channelId: z.string().min(1, { message: 'Marketing channel selection is required' }).optional(),
  campaignId: z.string().min(1).optional().or(z.literal('')),
  dateFrom: z.string().regex(ISO_DATE_RE, { message: 'Start date must be in YYYY-MM-DD format' }).optional(),
  dateTo: z.string().regex(ISO_DATE_RE, { message: 'End date must be in YYYY-MM-DD format' }).optional(),
  amountBdt: z
    .number({ message: 'Spend amount must be a number' })
    .min(0.01, { message: 'Spend amount must be greater than 0 BDT' })
    .max(100000000, { message: 'Spend amount exceeds the allowed ledger limit' })
    .optional(),
  impressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  sends: z.number().int().min(0).optional(),
  utmSource: z.string().max(60).optional().or(z.literal('')),
  utmCampaign: z.string().max(120).optional().or(z.literal('')),
  utmContent: z.string().max(120).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  financeExpenseRef: z.string().max(60).optional().or(z.literal('')),
  actor: z.string().max(80).optional(),
});

export const marketingSpendVoidSchema = z.object({
  reason: z.string().min(3, { message: 'A void reason is required to preserve ledger history' }).max(300),
  actor: z.string().max(80).optional(),
});

export const marketingAttributionEntrySchema = z.object({
  channelId: z.string().min(1, { message: 'Attribution requires a marketing channel' }),
  campaignId: z.string().min(1).optional().or(z.literal('')),
  date: z.string().regex(ISO_DATE_RE, { message: 'Attribution date must be in YYYY-MM-DD format' }),
  attributedRevenueBdt: z
    .number({ message: 'Attributed revenue must be a number' })
    .min(0, { message: 'Attributed revenue cannot be negative' })
    .max(1000000000, { message: 'Attributed revenue exceeds the allowed ledger limit' }),
  attributedOrders: z
    .number()
    .int({ message: 'Attributed orders must be a whole number' })
    .min(0, { message: 'Attributed orders cannot be negative' })
    .default(0),
  orderNumbers: z.array(z.string().min(1).max(40)).max(200).default([]),
  source: z.enum(['UTM', 'ADS_MANAGER', 'WHATSAPP', 'TELEGRAM', 'MANUAL'], {
    message: 'Attribution source must be UTM, ADS_MANAGER, WHATSAPP, TELEGRAM or MANUAL',
  }),
  notes: z.string().max(500).optional().or(z.literal('')),
  actor: z.string().max(80).optional(),
});

export type MarketingChannelCreateInput = z.infer<typeof marketingChannelCreateSchema>;
export type MarketingSpendEntryInput = z.infer<typeof marketingSpendEntrySchema>;
export type MarketingAttributionEntryInput = z.infer<typeof marketingAttributionEntrySchema>;

