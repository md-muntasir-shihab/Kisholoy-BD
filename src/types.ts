export type Language = 'EN' | 'BN';
export type ThemeMode = 'light' | 'dark' | 'system';

export type Division = 
  | 'Dhaka' 
  | 'Chattogram' 
  | 'Sylhet' 
  | 'Rajshahi' 
  | 'Khulna' 
  | 'Barishal' 
  | 'Rangpur' 
  | 'Mymensingh';

export type Role = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'ORDER_MANAGER' 
  | 'INVENTORY_MANAGER' 
  | 'FINANCE' 
  | 'SUPPORT' 
  | 'MERCHANT' 
  | 'CUSTOMER'
  | 'SUPPLIER';

export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PROCESSING' 
  | 'READY_TO_SHIP' 
  | 'SHIPPED' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'FAILED' 
  | 'RETURN_REQUESTED' 
  | 'RETURNED';

export type PaymentStatus = 
  | 'UNPAID' 
  | 'PENDING' 
  | 'AUTHORIZED' 
  | 'PAID' 
  | 'PARTIALLY_PAID'
  | 'FAILED' 
  | 'CANCELLED' 
  | 'REFUNDED' 
  | 'PARTIALLY_REFUNDED';

export type SettlementStatus = 
  | 'PENDING' 
  | 'ELIGIBLE' 
  | 'PROCESSING' 
  | 'SETTLED' 
  | 'PARTIALLY_SETTLED' 
  | 'ON_HOLD' 
  | 'CANCELLED'
  | 'FAILED';

export type ShipmentStatus = 
  | 'CREATED' 
  | 'PICKED_UP' 
  | 'IN_TRANSIT' 
  | 'AT_HUB' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'RETURNED' 
  | 'FAILED' 
  | 'CANCELLED';

export interface ProductVariant {
  id: string;
  name: string;
  nameBn?: string;
  sku: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
}

export interface Product {
  id: string;
  title: string;
  titleBn: string;
  slug: string;
  description: string;
  descriptionBn: string;
  price: number;
  originalPrice?: number;
  costPrice: number;
  taxRate?: number;
  supplierId?: string;
  sku: string;
  category: string;
  categorySlug: string;
  images: string[];
  stock: number;
  lowStockThreshold?: number;
  rating: number;
  reviewsCount: number;
  badge?: string;
  badgeBn?: string;
  isFeatured?: boolean;
  readyToShip: boolean;
  variants?: ProductVariant[];
  attributes?: {
    material?: string;
    origin?: string;
    weight?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  description: string;
  image: string;
  itemCount: number;
  featured?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  titleBn: string;
  price: number;
  image: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
  sku: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
  division: string;
  district: string;
  thana: string;
  postalCode?: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  titleBn: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
  variantName?: string;
}

export type OrderSourceChannel = 
  | 'WEB' 
  | 'WHATSAPP' 
  | 'MESSENGER' 
  | 'FACEBOOK' 
  | 'INSTAGRAM' 
  | 'PHONE' 
  | 'DIRECT' 
  | 'MANUAL_ADMIN';

export interface OrderChannelDetails {
  channel: OrderSourceChannel;
  channelName?: string;
  socialHandleOrChatId?: string;
  conversationLink?: string;
  operatorName?: string;
  operatorRole?: string;
  chatNotes?: string;
  whatsappNumber?: string;
  confirmedViaChat?: boolean;
}

export interface OrderAdvancePayment {
  isPaid: boolean;
  amount: number;
  method: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CASH' | 'OTHER';
  trxId?: string;
  receivedAt?: string;
  receivedBy?: string;
  verified: boolean;
  notes?: string;
}

export interface CustomCourierConfig {
  id: string;
  name: string;
  code: string;
  phone?: string;
  trackingUrlTemplate: string;
  defaultInsideDhakaFee: number;
  defaultOutsideDhakaFee: number;
  codPercentageFee?: number;
  isActive: boolean;
  isBuiltIn?: boolean;
  apiEndpoint?: string;
  apiKey?: string;
  secretKey?: string;
  notes?: string;
  createdAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  orderSource?: OrderSourceChannel;
  channelDetails?: OrderChannelDetails;
  advancePayment?: OrderAdvancePayment;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    whatsappNumber?: string;
    socialProfile?: string;
  };
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  balanceDueCod?: number;
  paymentMethod: 'COD' | 'SSLCOMMERZ' | 'BKASH' | 'MANUAL';
  paymentStatus: PaymentStatus;
  settlementStatus: SettlementStatus;
  orderStatus: OrderStatus;
  courier: {
    provider: 'Steadfast' | 'Pathao' | 'RedX' | 'Paperfly' | 'eCourier' | 'Manual' | string;
    trackingId?: string;
    status: ShipmentStatus;
    consignmentId?: string;
    dispatchedAt?: string;
    estimatedDelivery?: string;
  };
  notes?: string;
  fraudRisk?: FraudRiskAssessment;
  verificationStatus?: 'UNVERIFIED' | 'PHONE_VERIFIED' | 'ADVANCE_PAID' | 'MANUALLY_OVERRIDDEN' | 'REJECTED';
  verificationNotes?: string;
  advancePaymentTrxId?: string;
  advancePaymentAmount?: number;
  appliedCouponCode?: string;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  whatsappConfirmationSent?: boolean;
  fulfillment?: {
    assignedWarehouseId: string;
    assignedWarehouseName: string;
    assignedWarehouseCode: string;
    routingReason: string;
    routedAt: string;
    pickListId?: string;
    manifestId?: string;
    isSplitShipment?: boolean;
    dispatchCutoff?: string;
  };
  timeline: {
    status: OrderStatus;
    timestamp: string;
    note: string;
    updatedBy: string;
  }[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinedDate: string;
  totalOrders: number;
  totalSpent: number;
  defaultAddress: string;
  status: 'ACTIVE' | 'BLOCKED';
  whatsappNumber?: string;
  socialProfile?: string;
  preferredChannel?: OrderSourceChannel;
  source?: string;
  district?: string;
  thana?: string;
}

export interface InventoryTransaction {
  id: string;
  timestamp: string;
  productId: string;
  productTitle: string;
  sku: string;
  type: 'STOCK_IN' | 'SALE' | 'RETURN' | 'DAMAGE' | 'ADJUSTMENT' | 'RESERVATION';
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  operator: string;
  warehouseLocation?: string;
  batchNumber?: string;
  supplier?: string;
  unitCost?: number;
  flaggedForReview?: boolean;
  orderNumber?: string;
  notes?: string;
}

export interface BatchRestockItem {
  productId: string;
  sku: string;
  productTitle: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
}

export interface BatchRestockPayload {
  supplier: string;
  invoiceNumber: string;
  warehouseLocation: string;
  items: BatchRestockItem[];
  notes?: string;
  operator?: string;
}

export interface InventoryStats {
  totalSkus: number;
  totalUnitsOnHand: number;
  totalUnitsReserved: number;
  totalAvailableUnits: number;
  retailValuationBdt: number;
  costValuationBdt: number;
  estimatedMarginBdt: number;
  lowStockCount: number;
  outOfStockCount: number;
  warehouses: {
    name: string;
    code: string;
    units: number;
    valuationBdt: number;
  }[];
}

export interface ReturnRequest {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  items: {
    productTitle: string;
    quantity: number;
    reason: string;
  }[];
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'INSPECTED' | 'ACCEPTED' | 'REJECTED';
  refundAmount: number;
  restockDecision?: 'RESTOCK' | 'SCRAP' | 'NONE';
  operatorNotes?: string;
}

export interface RefundItem {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  method: 'ORIGINAL_GATEWAY' | 'BKASH' | 'NAGAD' | 'BANK_TRANSFER' | 'STORE_CREDIT';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  gatewayRef?: string;
  requestedAt: string;
  completedAt?: string;
  reason: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'PACKAGING' | 'COURIER_FEES' | 'MARKETING' | 'OFFICE_RENT' | 'SOFTWARE' | 'SALARY' | 'OTHER';
  vendor: string;
  amount: number;
  reference: string;
  notes?: string;
  recordedBy?: string;
}

export interface SettlementRecord {
  id: string;
  batchNumber: string;
  gateway: 'SSLCOMMERZ' | 'BKASH' | 'STEADFAST_COD' | 'PATHAO_COD';
  bankAccount: string;
  periodStart: string;
  periodEnd: string;
  totalOrders: number;
  grossAmount: number;
  gatewayFee: number;
  taxDeducted: number;
  netPayout: number;
  status: SettlementStatus;
  payoutDate?: string;
  utrOrReference?: string;
  notes?: string;
}

export interface ReconciliationAnomaly {
  id: string;
  orderNumber: string;
  type: 'MISSING_PAYMENT' | 'FEE_MISMATCH' | 'COD_UNREMITTED' | 'UNMATCHED_TRANSACTION';
  description: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface FinancialSummary {
  grossRevenue: number;
  netSales: number;
  totalCogs: number;
  grossProfit: number;
  grossMarginPct: number;
  totalOperatingExpenses: number;
  gatewayFeesTotal: number;
  courierFeesTotal: number;
  marketingTotal: number;
  packagingTotal: number;
  otherExpensesTotal: number;
  netOperatingProfit: number;
  netProfitMarginPct: number;
  settledFundsInBank: number;
  pendingSettlements: number;
}

export interface AutomationJob {
  id: string;
  type: 'WEBHOOK_RETRY' | 'COURIER_SYNC' | 'PAYMENT_VERIFY' | 'SMS_DISPATCH' | 'EMAIL_DISPATCH' | 'INVENTORY_ALERT' | 'WEBHOOK_OUTBOUND' | 'REFUND_DISBURSEMENT';
  priority?: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'RETRYING' | 'MANUAL_ACTION_REQUIRED' | 'DLQ_DEAD_LETTER';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: string;
  nextAttemptAt?: string;
  payloadSummary: string;
  payload?: any;
  errorMessage?: string;
  errorStack?: string;
  dlqReason?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
  createdAt: string;
  totalDelivered: number;
  totalFailed: number;
  lastDeliveryAt?: string;
  lastHttpStatus?: number;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  url: string;
  status: 'SUCCESS' | 'FAILED';
  httpStatus: number;
  requestPayload: any;
  responseBody: string;
  durationMs: number;
  timestamp: string;
  signature: string;
}

export type NotificationChannel = 'SMS' | 'WHATSAPP' | 'EMAIL' | 'IN_APP';

export type NotificationEventKey =
  | 'ORDER_CONFIRMATION'
  | 'ORDER_SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'RETURN_SUBMITTED'
  | 'RETURN_APPROVED'
  | 'REFUND_PROCESSED'
  | 'ABANDONED_CART'
  | 'OTP_VERIFICATION'
  | 'LOW_STOCK_ADMIN';

export interface WhatsAppButtonConfig {
  type: 'QUICK_REPLY' | 'URL' | 'CALL';
  text: string;
  textBn: string;
  value?: string;
}

export interface NotificationTemplate {
  id: string;
  eventKey: NotificationEventKey;
  title: string;
  titleBn: string;
  channels: NotificationChannel[];
  smsBodyEn: string;
  smsBodyBn: string;
  whatsappBodyEn?: string;
  whatsappBodyBn?: string;
  whatsappButtons?: WhatsAppButtonConfig[];
  emailSubjectEn: string;
  emailSubjectBn: string;
  emailHtmlEn: string;
  emailHtmlBn: string;
  variables: string[];
  isActive: boolean;
}

export interface NotificationLog {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  eventKey: string;
  language: 'EN' | 'BN';
  subject?: string;
  content: string;
  status: 'DELIVERED' | 'FAILED' | 'QUEUED' | 'READ' | 'SENT';
  parts: number;
  costBdt: number;
  messageId: string;
  timestamp: string;
  gatewayResponse?: string;
  retryCount?: number;
  fallbackChannel?: NotificationChannel;
  fallbackTriggered?: boolean;
}

export interface GatewayConfig {
  smsProvider: 'GREENWEB' | 'BULKSMS_BD' | 'SSL_WIRELESS' | 'ONNOROKOM' | 'MOCK';
  smsProviderSecondary: 'NONE' | 'GREENWEB' | 'BULKSMS_BD' | 'SSL_WIRELESS' | 'ONNOROKOM' | 'MOCK';
  smsMaskingName: string;
  smsSenderId: string;
  smsBalanceBdt: number;
  smsApiKey?: string;
  btrcApprovedMasking: boolean;
  whatsappProvider: 'WHATSAPP_CLOUD' | 'TWILIO_WA' | 'GREEN_API' | 'MOCK';
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;
  whatsappEnabled: boolean;
  whatsappFallbackToSms: boolean;
  emailProvider: 'RESEND' | 'SENDGRID' | 'SMTP' | 'MOCK';
  emailSenderAddress: string;
  emailSenderName: string;
  emailSmtpHost?: string;
  emailSmtpPort?: number;
  autoWorkerEnabled: boolean;
  workerConcurrency: number;
  maxRetryAttempts: number;
  autoNotificationEvents?: {
    orderCreated: boolean;
    orderShipped: boolean;
    orderDelivered: boolean;
    orderCancelled: boolean;
    returnSubmitted: boolean;
    returnApproved: boolean;
    lowStockAdmin: boolean;
  };
}

export interface CustomerNotification {
  id: string;
  customerId: string;
  title: string;
  titleBn: string;
  message: string;
  messageBn: string;
  type: 'ORDER' | 'SHIPMENT' | 'RETURN' | 'PROMO' | 'SYSTEM';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface QueueStats {
  totalJobs: number;
  pendingCount: number;
  processingCount: number;
  retryingCount: number;
  successCount: number;
  failedCount: number;
  dlqCount: number;
  workerActive: boolean;
  throughputPerMinute: number;
}

export interface PaymentTransaction {
  id: string;
  orderNumber: string;
  gateway: 'SSLCOMMERZ' | 'BKASH_TOKENIZED' | 'NAGAD_DIRECT' | 'COD_CASH';
  amount: number;
  currency: 'BDT';
  transactionId: string;
  bankTranId?: string;
  valId?: string;
  cardType?: string;
  status: 'VALID' | 'FAILED' | 'CANCELLED' | 'UNCHECKED' | 'REFUNDED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  feeDeducted: number;
  netDisbursed: number;
  settledAt?: string;
  createdAt: string;
  rawIpnPayload?: Record<string, any>;
}

export interface FraudRiskAssessment {
  riskScore: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'SUSPICIOUS';
  flags: string[];
  reasons: string[];
  recommendation: 'AUTO_APPROVE' | 'REQUIRE_PHONE_VERIFICATION' | 'REQUIRE_ADVANCE_SHIPPING_FEE' | 'BLOCK';
  breakdown: {
    phoneScore: number;
    addressScore: number;
    valueScore: number;
    velocityScore: number;
    historyScore: number;
    emailScore: number;
  };
  evaluatedAt: string;
}

export type BlacklistType = 'PHONE' | 'IP' | 'EMAIL' | 'ADDRESS';

export interface BlacklistEntry {
  id: string;
  type: BlacklistType;
  value: string;
  reason: string;
  severity: 'STRICT_BLOCK' | 'FLAG_FOR_REVIEW';
  addedAt: string;
  addedBy: string;
  hitCount: number;
  lastHitAt?: string;
  isActive: boolean;
}

export interface FraudRuleConfig {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  description: string;
  category: 'PHONE' | 'ADDRESS' | 'PAYMENT' | 'VELOCITY' | 'DEVICE' | 'CUSTOMER_HISTORY';
  enabled: boolean;
  weight: number;
  thresholdValue?: number;
}

export interface FraudRiskSettings {
  autoBlockThreshold: number;
  phoneVerificationThreshold: number;
  advanceFeeThresholdBdt: number;
  advanceFeeAmountBdt: number;
  velocityWindowMinutes: number;
  maxOrdersPerVelocityWindow: number;
  blockDisposableEmails: boolean;
  blockVagueAddresses: boolean;
  rules: FraudRuleConfig[];
}

export interface FraudStats {
  totalEvaluated: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalSuspiciousCount: number;
  blockedOrdersCount: number;
  verifiedOrdersCount: number;
  advanceFeeCollectedCount: number;
  preventedLossBdt: number;
  activeBlacklistCount: number;
  flaggedCodExposureBdt: number;
}

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY_ALERT';
export type AuditCategory = 'AUTH' | 'RBAC' | 'FINANCIAL' | 'INVENTORY' | 'ORDER' | 'CONFIG' | 'SYSTEM';

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  role: Role;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  // Phase 20 Cryptographic Tamper-Evident Ledger
  sequence?: number;
  severity?: AuditSeverity;
  category?: AuditCategory;
  previousHash?: string;
  currentHash?: string;
  signature?: string;
}

export interface SiteContent {
  brandName: string;
  brandNameBn: string;
  tagline: string;
  taglineBn: string;
  motto: string;
  mottoBn: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  logoType?: 'TEXT' | 'IMAGE' | 'BOTH_IMAGE_AND_TEXT' | 'EMBLEM_AND_TEXT';
  logoHeight?: number;
  logoEmblemStyle?: 'leaf_sprout' | 'jamdani_flower' | 'terracotta_seal' | 'heritage_loom' | 'bengal_royal' | 'minimalist_k';
  faviconUrl?: string;
  tradeLicense?: string;
  announcementBar: {
    enabled: boolean;
    text: string;
    textBn: string;
    linkUrl?: string;
    linkLabel?: string;
    linkLabelBn?: string;
    theme?: 'midnight' | 'teal' | 'amber' | 'crimson';
  };
  hero: {
    eyebrow: string;
    eyebrowBn: string;
    title: string;
    titleBn: string;
    subtitle: string;
    subtitleBn: string;
    ctaPrimaryText: string;
    ctaPrimaryTextBn: string;
    ctaPrimaryUrl?: string;
    ctaSecondaryText: string;
    ctaSecondaryTextBn: string;
    ctaSecondaryUrl?: string;
    image: string;
    overlayOpacity?: number;
  };
  promoBanners?: {
    id: string;
    title: string;
    titleBn: string;
    subtitle: string;
    subtitleBn: string;
    badge: string;
    badgeBn: string;
    ctaText: string;
    ctaTextBn: string;
    link: string;
    image: string;
    position: 'TOP_CAROUSEL' | 'MID_PAGE' | 'BOTTOM_CALLOUT';
    enabled: boolean;
  }[];
  sectionSettings?: {
    showAnnouncement: boolean;
    showHero: boolean;
    showCuratedCategories: boolean;
    showFeaturedProducts: boolean;
    showArtisanSpotlight: boolean;
    showPillars: boolean;
    categoriesTitle: string;
    categoriesTitleBn: string;
    featuredTitle: string;
    featuredTitleBn: string;
    artisanTitle: string;
    artisanTitleBn: string;
    artisanStory: string;
    artisanStoryBn: string;
    artisanImage: string;
  };
  navLinks?: {
    id: string;
    name: string;
    nameBn: string;
    path: string;
    order: number;
    enabled: boolean;
  }[];
  contact: {
    phone: string;
    email: string;
    whatsappNumber?: string;
    address: string;
    addressBn: string;
    hours?: string;
    hoursBn?: string;
    facebookUrl: string;
    instagramUrl: string;
    youtubeUrl?: string;
  };
  shippingFees: {
    insideDhaka: number;
    subDhaka: number;
    outsideDhaka: number;
    freeShippingThreshold: number;
    deliveryTimeInsideDhaka?: string;
    deliveryTimeOutsideDhaka?: string;
  };
  policies: {
    terms: string;
    privacy: string;
    returns: string;
    shipping: string;
    about: string;
    faq?: string;
  };
}

export interface ContentRevision {
  id: string;
  timestamp: string;
  operator: string;
  summary: string;
  snapshot: SiteContent;
}

export interface DistrictMetric {
  district: string;
  division?: string;
  orderCount: number;
  revenue: number;
  deliveredCount: number;
  deliverySuccessRate: number;
  rtoRate?: number;
  avgDeliveryHours: number;
  codSharePct: number;
  codRiskAmount?: number;
}

export interface CategoryMetric {
  categoryId: string;
  categoryName: string;
  categoryNameBn: string;
  unitsSold: number;
  grossSales: number;
  grossProfit: number;
  marginPct: number;
  inventoryValue: number;
  stockUnits: number;
}

export interface ArtisanSourcingMetric {
  originCluster: string;
  clusterBn: string;
  productCount: number;
  unitsSold: number;
  weaverPayoutDisbursed: number;
  retailSalesContribution: number;
  fairWageMarginPct?: number;
}

export interface TaxVatSummary {
  taxPeriod: string;
  grossTaxableSales: number;
  standardRatePct: number;
  vatCollected: number;
  inputTaxRebate: number;
  netVatPayable: number;
  binNumber: string;
  mushakForm: string;
  challanNumber?: string;
}

export interface InventoryVelocityMetric {
  sku: string;
  title: string;
  category: string;
  stock: number;
  costPrice: number;
  retailPrice: number;
  unitsSold: number;
  grossSales: number;
  daysOfSupply: number;
  velocityStatus: 'FAST_MOVING' | 'STABLE' | 'LOW_STOCK' | 'DEADSTOCK';
  stockValuationCost: number;
  stockValuationRetail: number;
}

export interface FinancialPnLReport {
  grossRevenue: number;
  discounts: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  expensesTotal: number;
  expensesByCategory: { category: string; amount: number; count: number }[];
  netOperatingProfit: number;
  netMarginPct: number;
}

export interface CustomerCohortMetric {
  totalCustomers: number;
  repeatCustomerCount: number;
  repeatPurchaseRate: number;
  avgCustomerLtv: number;
  firstTimeCount: number;
}

export interface CourierPerformanceMetric {
  provider: string;
  bookedCount: number;
  deliveredCount: number;
  rtoCount: number;
  inTransitCount: number;
  successRate: number;
  avgDeliveryHours: number;
  totalCodHandled: number;
}

export interface SalesTrendPoint {
  date: string;
  label: string;
  orders: number;
  revenue: number;
  profit: number;
}

// ==========================================
// PHASE 13: MULTI-WAREHOUSE & FULFILLMENT TYPES
// ==========================================

export type WarehouseType = 
  | 'CENTRAL_HUB' 
  | 'REGIONAL_DEPOT' 
  | 'ARTISAN_COLLECTION_POINT' 
  | 'DARK_STORE';

export interface WarehouseHub {
  id: string;
  code: string; // e.g. DAC-01, CTG-01, SYL-01, RAJ-01, TNG-01
  name: string;
  nameBn: string;
  type: WarehouseType;
  address: string;
  addressBn?: string;
  division: 'Dhaka' | 'Chattogram' | 'Sylhet' | 'Rajshahi' | 'Khulna' | 'Barishal' | 'Rangpur' | 'Mymensingh';
  district: string;
  thana: string;
  contactPerson: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  isActive: boolean;
  capacityUnits: number;
  currentUnits: number;
  dispatchCutoffTime: string; // e.g. '17:00'
  courierPartners: ('Steadfast' | 'Pathao' | 'RedX' | 'Paperfly' | 'eCourier')[];
  coverageDivisions: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface WarehouseStockItem {
  id: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  productId: string;
  productTitle: string;
  sku: string;
  stock: number;
  reserved: number;
  available: number;
  aisle: string; // e.g. "A-02"
  shelf: string; // e.g. "S-04"
  bin: string;   // e.g. "B-12"
  reorderLevel: number;
  reorderQuantity: number;
  unitCost: number;
  lastRestockedAt: string;
}

export type StockTransferStatus = 
  | 'DRAFT' 
  | 'REQUESTED' 
  | 'APPROVED' 
  | 'IN_TRANSIT' 
  | 'RECEIVED' 
  | 'REJECTED' 
  | 'CANCELLED';

export interface StockTransferItem {
  productId: string;
  sku: string;
  productTitle: string;
  quantityRequested: number;
  quantitySent: number;
  quantityReceived?: number;
  unitCost: number;
  notes?: string;
}

export interface StockTransferOrder {
  id: string;
  transferNumber: string; // e.g. STO-2026-0042
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  sourceWarehouseCode: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  destinationWarehouseCode: string;
  status: StockTransferStatus;
  items: StockTransferItem[];
  totalUnitsRequested: number;
  totalUnitsSent: number;
  totalCostValue: number;
  carrier: string; // e.g. "Internal Transport", "Sundarban Courier", "SA Paribahan"
  trackingOrGatePass: string;
  notes?: string;
  requestedBy: string;
  approvedBy?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  receivedBy?: string;
  createdAt: string;
  timeline: {
    status: string;
    timestamp: string;
    note: string;
    operator: string;
  }[];
}

export type RoutingStrategy = 
  | 'PROXIMITY_FIRST' 
  | 'SINGLE_HUB_CONSOLIDATION' 
  | 'STOCK_AVAILABILITY' 
  | 'CATEGORY_SPECIALTY';

export interface FulfillmentRoutingDecision {
  orderId: string;
  orderNumber: string;
  assignedWarehouseId: string;
  assignedWarehouseName: string;
  assignedWarehouseCode: string;
  routingReason: string;
  strategyUsed: RoutingStrategy;
  estimatedDispatchTime: string;
  isSplitShipment: boolean;
  splits?: {
    warehouseId: string;
    warehouseName: string;
    itemSkus: string[];
    quantity: number;
  }[];
  evaluatedAt: string;
}

export interface RoutingRuleConfig {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditionType: 'CUSTOMER_DIVISION' | 'PRODUCT_CATEGORY' | 'STOCK_LEVEL' | 'ORDER_VALUE';
  matchValue: string; // e.g. 'Chattogram' or 'Traditional Clothing'
  targetWarehouseId: string;
}

export type PickListStatus = 'GENERATED' | 'IN_PROGRESS' | 'PICKED' | 'PACKED';

export interface PickListItem {
  productId: string;
  sku: string;
  productTitle: string;
  quantity: number;
  aisle: string;
  shelf: string;
  bin: string;
  orderNumbers: string[];
  picked: boolean;
}

export interface PickList {
  id: string;
  pickListNumber: string; // e.g. PL-2026-0129
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  orderIds: string[];
  orderNumbers: string[];
  status: PickListStatus;
  assignedPicker: string;
  items: PickListItem[];
  totalUnits: number;
  pickedUnits: number;
  createdAt: string;
  completedAt?: string;
}

export type DispatchManifestStatus = 'CREATED' | 'HANDED_OVER' | 'IN_TRANSIT' | 'RECONCILED';

export interface DispatchManifestOrder {
  orderId: string;
  orderNumber: string;
  trackingId: string;
  customerName: string;
  customerPhone: string;
  district: string;
  codAmount: number;
  weightKg: number;
  packageCount: number;
}

export interface DispatchManifest {
  id: string;
  manifestNumber: string; // e.g. MNF-2026-0081
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  courier: 'Steadfast' | 'Pathao' | 'RedX' | 'Paperfly' | 'eCourier';
  ordersCount: number;
  totalCodAmount: number;
  totalWeightKg: number;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  status: DispatchManifestStatus;
  handedOverAt?: string;
  operator: string;
  createdAt: string;
  orders: DispatchManifestOrder[];
}

// -------------------------------------------------------------
// Phase 14: Promotions, Dynamic Coupons, Flash Deals & Loyalty
// -------------------------------------------------------------

export type CouponDiscountType = 
  | 'PERCENTAGE' 
  | 'FIXED_AMOUNT' 
  | 'FREE_SHIPPING' 
  | 'TIERED_BUNDLE';

export type CouponStatus = 
  | 'ACTIVE' 
  | 'SCHEDULED' 
  | 'EXPIRED' 
  | 'EXHAUSTED' 
  | 'DISABLED';

export interface CouponRule {
  id: string;
  code: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  discountType: CouponDiscountType;
  discountValue: number; // e.g. 15 for 15%, or 300 for ৳300
  maxDiscountAmount?: number; // Cap for percentage discounts (e.g. ৳500 max)
  minOrderSubtotal?: number; // Minimum cart value (e.g. ৳2,000)
  startDate: string;
  endDate: string;
  usageLimitTotal?: number; // Maximum total redemptions allowed
  usageCount: number; // Redemptions count so far
  usageLimitPerCustomer?: number; // Max per customer phone/account (default 1)
  categoryRestrictions?: string[]; // Empty means all categories
  productRestrictions?: string[]; // Empty means all products
  firstOrderOnly?: boolean; // New customer welcome promotion
  status: CouponStatus;
  totalDiscountDisbursedBdt: number; // Financial ledger sum
  totalAttributedRevenueBdt: number; // Total order gross GMV generated
  createdAt: string;
  updatedAt?: string;
}

export interface FlashDealItem {
  productId: string;
  productTitle: string;
  productTitleBn: string;
  originalPrice: number;
  flashPrice: number;
  discountPercent: number;
  quotaStock: number;
  soldStock: number;
}

export interface FlashDeal {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  badgeText: string;
  badgeTextBn: string;
  bannerImage: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';
  items: FlashDealItem[];
  createdAt: string;
}

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LoyaltyPointsTransaction {
  id: string;
  type: 'EARN_PURCHASE' | 'REDEEM_ORDER' | 'REFERRAL_BONUS' | 'ADMIN_ADJUSTMENT' | 'EXPIRY' | 'WELCOME_BONUS';
  points: number;
  bdtEquivalent: number;
  orderId?: string;
  orderNumber?: string;
  note: string;
  timestamp: string;
  performedBy?: string;
}

export interface CustomerLoyaltyWallet {
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  tier: LoyaltyTier;
  pointsBalance: number;
  lifetimeEarnedPoints: number;
  lifetimeRedeemedPoints: number;
  referralCode: string;
  referredByCode?: string;
  referralCount: number;
  totalWalletSavingsBdt: number;
  transactions: LoyaltyPointsTransaction[];
  joinedAt: string;
  lastActiveAt: string;
}

export interface PromotionSystemStats {
  activeCouponsCount: number;
  totalCouponsCreated: number;
  totalDiscountDisbursedBdt: number;
  totalRevenueGeneratedBdt: number;
  activeFlashDealsCount: number;
  totalLoyaltyMembers: number;
  totalPointsInCirculation: number;
  pointsRedeemedTotalBdt: number;
}

// Phase 15 Customer Account Portal & Wishlists Models
export interface CustomerAddress {
  id: string;
  customerId: string;
  label: 'Home' | 'Office' | 'Other';
  labelBn: string;
  recipientName: string;
  phone: string;
  altPhone?: string;
  division: string;
  district: string;
  upazilaOrArea: string;
  addressLine: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  customerId: string;
  productId: string;
  productTitle: string;
  productTitleBn: string;
  price: number;
  originalPrice?: number;
  image: string;
  inStock: boolean;
  category: string;
  addedAt: string;
}

export interface CustomerReturnRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  customerPhone: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productTitle: string;
  quantity: number;
  reason: 'DEFECTIVE_DAMAGED' | 'WRONG_ITEM' | 'NOT_AS_DESCRIBED' | 'SIZE_FIT_ISSUE' | 'CHANGED_MIND';
  reasonDetails: string;
  images?: string[];
  preferredResolution: 'REFUND_ORIGINAL' | 'STORE_CREDIT' | 'EXCHANGE';
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RETURN_IN_TRANSIT' | 'RESOLVED';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  joinedDate: string;
  tier: LoyaltyTier;
  addresses: CustomerAddress[];
  preferences: {
    newsletterSubscribed: boolean;
    smsOrderUpdates: boolean;
    whatsappOrderUpdates?: boolean;
    emailOrderUpdates?: boolean;
    promotionalOffers: boolean;
    preferredLanguage: 'BN' | 'EN';
  };
}

// Phase 19: Marketing Automation, RFM Segmentation, CRM & Referral Engine Types
export type CustomerSegmentType = 
  | 'CHAMPIONS_VIP'
  | 'LOYAL'
  | 'POTENTIAL_LOYALIST'
  | 'NEW_CUSTOMER'
  | 'AT_RISK'
  | 'HIBERNATING_LAPSED'
  | 'PRICE_SENSITIVE';

export interface RfmScore {
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  district: string;
  recencyDays: number;
  frequencyCount: number;
  monetaryTotal: number;
  rScore: number; // 1 to 5
  fScore: number; // 1 to 5
  mScore: number; // 1 to 5
  compositeScore: number;
  segment: CustomerSegmentType;
  lastOrderDate: string;
  avgOrderValue: number;
  tags: string[];
}

export interface RfmSegmentSummary {
  segment: CustomerSegmentType;
  segmentNameEn: string;
  segmentNameBn: string;
  customerCount: number;
  percentageOfBase: number;
  totalRevenueBdt: number;
  avgLtvBdt: number;
  recommendedActionEn: string;
  recommendedActionBn: string;
  colorClass: string;
  badgeBg: string;
}

export interface AbandonedCartItem {
  productId: string;
  title: string;
  titleBn?: string;
  price: number;
  quantity: number;
  image?: string;
}

export type AbandonmentStep = 'CART_PAGE' | 'SHIPPING_INFO' | 'PAYMENT_SELECTION' | 'GATEWAY_DROPOFF';
export type CartRecoveryStatus = 'ABANDONED' | 'STAGE_1_SENT' | 'STAGE_2_SENT' | 'STAGE_3_SENT' | 'RECOVERED' | 'EXPIRED';

export interface AbandonedCartRecoveryLog {
  stage: number;
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL';
  sentAt: string;
  incentiveCoupon?: string;
  status: 'SENT' | 'DELIVERED' | 'OPENED' | 'CONVERTED' | 'FAILED';
  notes?: string;
}

export interface AbandonedCart {
  id: string;
  sessionId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  district: string;
  thana?: string;
  items: AbandonedCartItem[];
  subtotal: number;
  abandonedStep: AbandonmentStep;
  recoveryStatus: CartRecoveryStatus;
  lastActionAt: string;
  recoveryHistory: AbandonedCartRecoveryLog[];
  recoveredOrderNumber?: string;
  recoveredAt?: string;
  createdAt: string;
  cartToken: string;
}

export type MarketingCampaignType = 
  | 'FLASH_SALE'
  | 'WIN_BACK'
  | 'VIP_EXCLUSIVE'
  | 'CART_RECOVERY'
  | 'SEASONAL_FESTIVAL'
  | 'NEW_ARRIVAL';

export type MarketingChannel = 'SMS' | 'WHATSAPP' | 'EMAIL' | 'MULTI_CHANNEL';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';

export interface MarketingCampaign {
  id: string;
  campaignName: string;
  campaignNameBn: string;
  type: MarketingCampaignType;
  targetSegment: CustomerSegmentType | 'ALL' | 'ABANDONED_CARTS';
  channel: MarketingChannel;
  status: CampaignStatus;
  scheduledAt?: string;
  executedAt?: string;
  contentEn: string;
  contentBn: string;
  couponCode?: string;
  audienceCount: number;
  deliveredCount: number;
  failedCount: number;
  clicksCount: number;
  attributedOrders: number;
  attributedRevenue: number;
  costBdt: number;
  roi: number;
  createdAt: string;
}

export interface ReferralProgramConfig {
  isActive: boolean;
  referrerRewardType: 'STORE_CREDIT' | 'LOYALTY_POINTS' | 'CASH_DISCOUNT';
  referrerRewardAmount: number; // e.g. 150 BDT credit
  refereeRewardType: 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT';
  refereeRewardAmount: number; // e.g. 100 BDT or 10%
  refereeMinOrderValue: number; // e.g. 1000 BDT
  disbursementEvent: 'ON_DELIVERY' | 'ON_ORDER_CONFIRMED';
  maxReferralsPerUser: number;
  preventSelfReferral: boolean; // anti-abuse
}

export type ReferralStatus = 
  | 'PENDING_INVITE'
  | 'SIGNED_UP'
  | 'ORDER_PLACED'
  | 'QUALIFIED_DELIVERED'
  | 'REWARDED'
  | 'FRAUD_REJECTED';

export interface ReferralRecord {
  id: string;
  referrerCustomerId: string;
  referrerName: string;
  referrerPhone: string;
  referralCode: string;
  refereeCustomerId?: string;
  refereeName: string;
  refereePhone: string;
  refereeEmail?: string;
  refereeOrderNumber?: string;
  orderAmount?: number;
  status: ReferralStatus;
  referrerRewardClaimed: boolean;
  fraudCheckNotes?: string;
  createdAt: string;
  rewardedAt?: string;
}

export interface CrmCustomerNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CrmCustomerDetails {
  customer: Customer;
  rfm: RfmScore;
  recentOrders: Order[];
  notes: CrmCustomerNote[];
  tags: string[];
  loyaltyWallet?: CustomerLoyaltyWallet;
  addresses?: CustomerAddress[];
  riskRating?: 'LOW' | 'MEDIUM' | 'HIGH';
}

// =============================================================
// Phase 20: Security Hardening, Strict RBAC, Rate Limiting & Audit Ledger
// =============================================================

export type AdminAccountStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DISABLED' | 'LOCKED';

export type StandardPermission = 
  | 'PRODUCT_VIEW'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_UPDATE'
  | 'PRODUCT_DELETE'
  | 'ORDER_VIEW'
  | 'ORDER_CREATE'
  | 'ORDER_UPDATE'
  | 'ORDER_CANCEL'
  | 'CUSTOMER_VIEW'
  | 'CUSTOMER_UPDATE'
  | 'INVENTORY_VIEW'
  | 'INVENTORY_ADJUST'
  | 'PAYMENT_VIEW'
  | 'PAYMENT_RECORD'
  | 'REFUND_VIEW'
  | 'REFUND_PROCESS'
  | 'PURCHASE_VIEW'
  | 'PURCHASE_CREATE'
  | 'PURCHASE_UPDATE'
  | 'SUPPLIER_VIEW'
  | 'SUPPLIER_MANAGE'
  | 'EXPENSE_VIEW'
  | 'EXPENSE_MANAGE'
  | 'REPORT_VIEW'
  | 'CONTENT_VIEW'
  | 'CONTENT_MANAGE'
  | 'SETTINGS_VIEW'
  | 'SETTINGS_MANAGE'
  | 'USER_VIEW'
  | 'USER_MANAGE'
  | 'SECURITY_MANAGE'
  | 'BACKUP_CREATE'
  | 'BACKUP_RESTORE';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: AdminAccountStatus;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'APP_TOTP' | 'SMS_OTP';
  failedLoginAttempts: number;
  lockoutUntil?: string | null;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
}

export interface AdminSession {
  sessionId: string;
  token: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: Role;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
}

export interface PermissionDefinition {
  id: string;
  domain: string;
  name: string;
  description: string;
}

export interface RolePermissionsConfig {
  role: Role;
  roleName: string;
  roleDescription: string;
  isSystem: boolean;
  permissions: string[];
}

export type RateLimitTier = 'STOREFRONT' | 'CHECKOUT' | 'AUTH' | 'ADMIN' | 'WEBHOOK';

export interface RateLimitTierConfig {
  tier: RateLimitTier;
  name: string;
  description: string;
  windowMs: number;
  maxRequests: number;
  burstAllowance: number;
  autoBanThreshold: number;
  autoBanDurationMs: number;
  enabled: boolean;
}

export interface RateLimitStatus {
  tier: RateLimitTier;
  totalRequestsToday: number;
  allowedRequests: number;
  throttledRequests: number;
  currentActiveClients: number;
  currentlyBannedIps: number;
}

export interface BannedIpRecord {
  ip: string;
  reason: string;
  tier: RateLimitTier;
  violationCount: number;
  bannedAt: string;
  expiresAt: string;
  manuallyAdded?: boolean;
}

export interface SecurityAuditCheckResult {
  id: string;
  code: string;
  category: string;
  title: string;
  titleBn: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  description: string;
  descriptionBn: string;
  technicalDetails: string;
  remediationAdvice?: string;
  verifiedAt: string;
}

export interface SecurityDiagnosticsSummary {
  overallScore: number;
  rating: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  checksPassed: number;
  checksWarning: number;
  checksFailed: number;
  totalChecks: number;
  lastScannedAt: string;
  chainIntegrity: {
    verified: boolean;
    totalBlocks: number;
    genesisHash: string;
    latestHash: string;
    corruptedBlockIndex?: number | null;
  };
  checks: SecurityAuditCheckResult[];
}

// ============================================================================
// PHASE 21: AUTOMATED BACKUPS, DISASTER RECOVERY, EXPORT/IMPORT & HEALTH
// ============================================================================

export type BackupTrigger = 
  | 'MANUAL' 
  | 'SCHEDULED_HOURLY' 
  | 'DAILY_AUTOMATED' 
  | 'PRE_RESTORE_FAILSAFE' 
  | 'DISASTER_DRILL';

export type BackupStorageTier = 
  | 'LOCAL_VAULT' 
  | 'S3_COLD_ARCHIVE' 
  | 'OFFSITE_REPLICA';

export type BackupHealthStatus = 
  | 'HEALTHY' 
  | 'VERIFIED' 
  | 'CORRUPTED' 
  | 'IN_PROGRESS';

export interface BackupSnapshotManifest {
  id: string;
  filename: string;
  createdAt: string;
  trigger: BackupTrigger;
  appVersion: string;
  environment: string;
  totalRecords: number;
  collectionCounts: {
    products: number;
    categories: number;
    orders: number;
    customers: number;
    auditLogs: number;
    expenses: number;
    settlements: number;
    inventoryTransactions: number;
    coupons: number;
    siteContent: number;
    warehouses: number;
    users: number;
  };
  sizeBytes: number;
  checksumSha256: string;
  storageTier: BackupStorageTier;
  status: BackupHealthStatus;
  verifiedAt?: string;
  createdBy: string;
  notes?: string;
}

export interface BackupScheduleConfig {
  enabled: boolean;
  frequency: 'HOURLY' | 'EVERY_6_HOURS' | 'DAILY' | 'WEEKLY';
  retentionDays: number;
  storageDestination: 'LOCAL_AND_S3' | 'LOCAL_ONLY' | 'OFFSITE_ONLY';
  autoPruneOld: boolean;
  lastRunAt: string;
  nextRunAt: string;
}

export interface DisasterRecoveryMetrics {
  rtoTargetMinutes: number; // Recovery Time Objective (target < 5 min)
  rpoTargetMinutes: number; // Recovery Point Objective (target < 60 min)
  actualRtoSeconds: number;
  actualRpoMinutes: number;
  lastDrillAt: string;
  drillStatus: 'PASSED' | 'WARNING' | 'FAILED';
  failoverReadiness: 'READY' | 'DEGRADED' | 'STANDBY';
  activeColdStorageVault: string;
  totalRestoresExecuted: number;
  lastFailsafeSnapshotId?: string;
}

export interface SubsystemHealthStatus {
  subsystem: 'DATABASE' | 'PAYMENT_GATEWAYS' | 'COURIER_SERVICES' | 'SMS_GATEWAY' | 'AUDIT_LEDGER' | 'RATE_LIMITER' | 'QUEUE_WORKER';
  name: string;
  nameBn: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';
  latencyMs: number;
  details: string;
  detailsBn: string;
  lastChecked: string;
}

export interface SystemHealthOverview {
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  uptimeSeconds: number;
  uptimeFormatted: string;
  nodeVersion: string;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    externalMb: number;
    memoryUsagePercent: number;
  };
  subsystems: SubsystemHealthStatus[];
  activeConnections: number;
  pendingQueueJobs: number;
  bannedIpsCount: number;
  auditChainBlocks: number;
  totalSnapshots: number;
  timestamp: string;
}

export interface DataImportRowError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface DataImportResult {
  entityType: 'PRODUCTS' | 'ORDERS' | 'CUSTOMERS';
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: DataImportRowError[];
  previewData: any[];
  dryRun: boolean;
  applied: boolean;
  message: string;
}

export interface RestoreDryRunResult {
  valid: boolean;
  snapshotId: string;
  appVersionMatch: boolean;
  checksumMatched: boolean;
  computedChecksum: string;
  manifestChecksum: string;
  collectionsToReplace: {
    name: string;
    currentCount: number;
    incomingCount: number;
    difference: number;
  }[];
  totalIncomingRecords: number;
  warnings: string[];
  safeToProceed: boolean;
}

// =============================================================
// Supplier Management & Procurement Ledger Types
// =============================================================

export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type SupplierPaymentTerms = 'ADVANCE' | 'NET_15' | 'NET_30' | 'COD' | 'CONSIGNMENT';

export type SupplierPaymentMethod = 'BANK_TRANSFER' | 'CHEQUE' | 'BKASH_BUSINESS' | 'NAGAD_BUSINESS' | 'CASH';

export interface SupplierPurchaseItem {
  productId?: string;
  productTitle: string;
  sku: string;
  quantity: number;
  unitCost: number; // Minor unit or BDT
  subtotal: number; // Server recalculated
}

export interface SupplierPurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-2026-001
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: SupplierPurchaseItem[];
  totalAmount: number; // BDT
  paidAmount: number; // BDT
  dueAmount: number; // BDT
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE';
  deliveryStatus: 'PENDING' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  receivedAt?: string;
  receivedByWarehouseId?: string;
  warehouseName?: string;
  notes?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  purchaseOrderId?: string;
  amount: number; // BDT
  paymentDate: string;
  paymentMethod: SupplierPaymentMethod;
  referenceNumber: string; // Cheque number, bank TxID, or MFS TrxID
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export type SupplierInteractionType = 'CALL' | 'EMAIL' | 'CONTRACT_DISCUSSION' | 'MEETING' | 'MESSAGING';

export type SupplierInteractionOutcome = 'COMPLETED' | 'FOLLOW_UP_REQUIRED' | 'AGREED' | 'PENDING_PROPOSAL' | 'CANCELLED';

export interface SupplierInteraction {
  id: string;
  supplierId: string;
  type: SupplierInteractionType;
  subject: string;
  contactPerson: string;
  direction?: 'OUTBOUND' | 'INBOUND';
  date: string;
  notes: string;
  followUpDate?: string;
  outcome?: SupplierInteractionOutcome;
  loggedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  code: string; // SUP-001
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  district: string; // Bangladesh District (e.g. Narayanganj, Sylhet, Comilla)
  categoriesSupplied: string[];
  tradeLicenseNumber?: string;
  tinNumber?: string;
  vatRegistrationNumber?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchName: string;
    routingNumber?: string;
  };
  mfsDetails?: {
    provider: 'BKASH' | 'NAGAD';
    accountType: 'MERCHANT' | 'PERSONAL';
    accountNumber: string;
  };
  paymentTerms: SupplierPaymentTerms;
  status: SupplierStatus;
  
  // Financial Summary (Server-authoritative)
  totalPurchased: number;
  totalPaid: number;
  totalDue: number;

  // Feature-flagged Supplier Portal Isolation
  portalAccess: {
    enabled: boolean; // Feature flag - disabled by default
    loginEmail?: string;
    lastLoginAt?: string;
    loginIsolated: boolean; // isolated from internal staff/customer DB
    password?: string;
  };

  purchaseOrdersCount?: number;
  paymentsCount?: number;
  interactionsCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOverviewMetrics {
  totalSuppliers: number;
  activeSuppliers: number;
  totalSourcedBdt: number;
  totalPaidBdt: number;
  totalOutstandingDueBdt: number;
  pendingDeliveriesCount: number;
}

export interface SourcedProductSummary {
  productId?: string;
  productTitle: string;
  productTitleBn?: string;
  sku: string;
  category?: string;
  image?: string;
  totalQuantityOrdered: number;
  totalQuantityReceived: number;
  totalSpend: number;
  averageUnitCost: number;
  currentStock: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  retailPrice: number;
  grossMargin: number;
  latestPoDate: string;
  poCount: number;
  poNumbers: string[];
}

export interface SupplierLedgerEntry {
  id: string;
  date: string;
  type: 'PURCHASE_ORDER' | 'PAYMENT_VOUCHER';
  referenceNumber: string;
  description: string;
  descriptionBn?: string;
  itemsSummary?: string;
  debit: number;
  credit: number;
  runningBalance: number;
  status: string;
  paymentMethod?: string;
  operator?: string;
}

export interface SupplierMonthlyFinancialTrend {
  monthKey: string; // e.g. "2025-10"
  monthLabel: string; // e.g. "Oct '25"
  monthLabelBn: string; // e.g. "অক্টো '২৫"
  purchased: number;
  paid: number;
  netBalance: number; // purchased - paid in that month
  cumulativeDue: number; // running due balance at month end
  poCount: number;
  paymentCount: number;
}

export interface SupplierFinancialSummary {
  totalPurchased: number;
  totalPaid: number;
  totalDue: number;
  totalOrdersCount: number;
  totalItemsProcuredCount: number;
  receivedOrdersCount: number;
  pendingOrdersCount: number;
  paymentFulfillmentRatio: number;
  averageOrderValue: number;
  earliestTransactionDate?: string;
  latestTransactionDate?: string;
  monthlyTrends?: SupplierMonthlyFinancialTrend[];
}

export interface SupplierDetailResponse {
  success: boolean;
  supplier: Supplier;
  purchaseOrders: SupplierPurchaseOrder[];
  payments: SupplierPayment[];
  interactions: SupplierInteraction[];
  sourcedProducts: SourcedProductSummary[];
  ledgerStatement: SupplierLedgerEntry[];
  financialSummary: SupplierFinancialSummary;
  monthlyTrends?: SupplierMonthlyFinancialTrend[];
}

// =============================================================
// Security, Sensitive Action Confirmation & MFA Types
// =============================================================

export interface SensitiveActionPayload {
  actionType: 'ROLE_MODIFICATION' | 'SUPPLIER_PAYOUT' | 'ACCOUNT_LOCKOUT' | 'DATA_RESTORE' | 'STAFF_PASSWORD_RESET' | 'PERMISSION_OVERRIDE';
  resourceId: string;
  resourceName: string;
  operator: string;
  reason: string;
  mfaCode?: string;
  details?: Record<string, any>;
}

export interface PasswordChangeRequest {
  currentPassword?: string;
  newPassword: string;
  confirmPassword?: string;
  operator?: string;
}


// =============================================================
// Supplier Commercial Agreement & Supply Chain
// =============================================================

export type SupplierSettlementMethod = 'FIXED_COST' | 'PERCENTAGE_OF_SALE' | 'FIXED_AMOUNT_PER_UNIT' | 'REVENUE_SHARE';
export type SupplierCalculationBasis = 'GROSS_SELLING_PRICE' | 'NET_SELLING_PRICE';

export interface SupplierAgreement {
  id: string;
  supplierId: string;
  productId?: string;
  variantId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  effectiveFrom: string;
  effectiveTo?: string;
  settlementMethod: SupplierSettlementMethod;
  calculationBasis?: SupplierCalculationBasis;
  percentage?: number;
  fixedAmount?: number;
  supplierCost?: number;
  notes?: string;
  createdAt: string;
}

export interface SupplyBatch {
  id: string;
  supplierId: string;
  productId: string;
  variantId?: string;
  batchNumber: string;
  quantityReceived: number;
  quantitySold: number;
  quantityRemaining: number;
  quantityReturned: number;
  quantityDamaged: number;
  supplierCost: number;
  referenceSellingPrice?: number;
  settlementMethod: SupplierSettlementMethod;
  agreementId?: string;
  receivedDate: string;
  expiryDate?: string;
  status: 'ACTIVE' | 'DEPLETED' | 'ON_HOLD';
  notes?: string;
}

export interface SupplierEligibleSale {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  variantId?: string;
  supplyBatchId?: string;
  quantity: number;
  sellingPrice: number; // Unit price
  netEligibleAmount: number; // Total amount after discount/returns
  supplierShare: number;
  kisholoyShare: number;
  settlementMethodSnapshot: string;
  calculationRuleSnapshot: string;
  status: 'PENDING_SETTLEMENT' | 'INCLUDED_IN_SETTLEMENT' | 'ADJUSTED_RETURNED';
  saleDate: string;
}

export interface SupplierSettlement {
  id: string;
  settlementNumber: string;
  supplierId: string;
  periodStart: string;
  periodEnd: string;
  grossSales: number;
  grossSalesAmount?: number;
  supplierShare: number;
  supplierShareAmount?: number;
  kisholoyShare: number;
  returnsAdjustment: number;
  refundAdjustment: number;
  previousSupplierDue?: number;
  paymentsAlreadyMade?: number;
  currentPayable: number;
  netPayable?: number;
  paidAmount?: number;
  remainingDue?: number;
  status: 'DRAFT' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  eligibleSalesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierStatement {
  supplier: {
    id: string;
    code: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    paymentTerms: string;
    taxIdentificationNumber?: string;
    tradeLicenseNumber?: string;
  };
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  summary: {
    totalSuppliedValue: number;
    totalSupplierEarnings: number;
    totalPaidOut: number;
    currentOutstandingDue: number;
  };
  batches: Array<{
    id: string;
    batchNumber: string;
    receivedDate: string;
    productName: string;
    receivedQuantity: number;
    soldQuantity: number;
    unitCost: number;
  }>;
  settlements: SupplierSettlement[];
}
