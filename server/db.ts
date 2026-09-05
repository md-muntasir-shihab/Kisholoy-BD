/**
 * Server-Side In-Memory Data Store & Authoritative State Repository
 * @license Apache-2.0
 */

import { 
  Product, Category, Order, Customer, AuditLog, SiteContent, 
  ExpenseRecord, AutomationJob, PaymentTransaction, FraudRiskAssessment, 
  SettlementRecord, WebhookEndpoint, WebhookDeliveryLog, 
  NotificationTemplate, NotificationLog, GatewayConfig, ContentRevision,
  InventoryTransaction, BatchRestockPayload, InventoryStats,
  BlacklistEntry, FraudRiskSettings, FraudRuleConfig,
  WarehouseHub, WarehouseStockItem, StockTransferOrder, RoutingRuleConfig,
  PickList, DispatchManifest,
  CouponRule, FlashDeal, CustomerLoyaltyWallet, PromotionSystemStats, LoyaltyPointsTransaction,
  CustomerAddress, WishlistItem, CustomerReturnRequest, CustomerProfile, CustomerNotification,
  AuditSeverity, AuditCategory, PrintSettings, RmaRecord
} from '../src/types';
import { securityEngine } from './securityEngine';
import { normalizeBdMobilePhone } from '../src/lib/phone';
import { defaultPrintSettings } from '../src/lib/printFormats';
import { 
  INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_ORDERS, 
  INITIAL_CUSTOMERS, INITIAL_CONTENT, INITIAL_AUDIT_LOGS, 
  INITIAL_EXPENSES, INITIAL_AUTOMATION_JOBS, INITIAL_PAYMENT_TRANSACTIONS,
  INITIAL_SETTLEMENTS, INITIAL_WEBHOOK_ENDPOINTS, INITIAL_WEBHOOK_LOGS,
  INITIAL_NOTIFICATION_TEMPLATES, INITIAL_NOTIFICATION_LOGS, INITIAL_GATEWAY_CONFIG,
  INITIAL_CONTENT_REVISIONS, INITIAL_INVENTORY_TRANSACTIONS,
  INITIAL_BLACKLIST, INITIAL_FRAUD_SETTINGS,
  INITIAL_WAREHOUSES, INITIAL_WAREHOUSE_STOCKS, INITIAL_STOCK_TRANSFERS, INITIAL_ROUTING_RULES,
  INITIAL_PICK_LISTS, INITIAL_DISPATCH_MANIFESTS,
  INITIAL_COUPONS, INITIAL_FLASH_DEALS, INITIAL_LOYALTY_WALLETS, INITIAL_PROMOTION_STATS,
  INITIAL_CUSTOMER_ADDRESSES, INITIAL_WISHLISTS, INITIAL_CUSTOMER_RETURNS, INITIAL_CUSTOMER_PROFILES,
  INITIAL_CUSTOMER_NOTIFICATIONS, INITIAL_RMA_RECORDS
} from '../src/data/mockData';

class ServerDatabase {
  products: Product[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  categories: Category[] = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
  orders: Order[] = JSON.parse(JSON.stringify(INITIAL_ORDERS));
  customers: Customer[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
  siteContent: SiteContent = JSON.parse(JSON.stringify(INITIAL_CONTENT));
  contentRevisions: ContentRevision[] = JSON.parse(JSON.stringify(INITIAL_CONTENT_REVISIONS));
  auditLogs: AuditLog[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  expenses: ExpenseRecord[] = JSON.parse(JSON.stringify(INITIAL_EXPENSES));
  rmaRecords: RmaRecord[] = JSON.parse(JSON.stringify(INITIAL_RMA_RECORDS));
  settlements: SettlementRecord[] = JSON.parse(JSON.stringify(INITIAL_SETTLEMENTS));
  automationJobs: AutomationJob[] = JSON.parse(JSON.stringify(INITIAL_AUTOMATION_JOBS));
  paymentTransactions: PaymentTransaction[] = JSON.parse(JSON.stringify(INITIAL_PAYMENT_TRANSACTIONS));
  inventoryTransactions: InventoryTransaction[] = JSON.parse(JSON.stringify(INITIAL_INVENTORY_TRANSACTIONS));
  webhookEndpoints: WebhookEndpoint[] = JSON.parse(JSON.stringify(INITIAL_WEBHOOK_ENDPOINTS));
  webhookLogs: WebhookDeliveryLog[] = JSON.parse(JSON.stringify(INITIAL_WEBHOOK_LOGS));
  notificationTemplates: NotificationTemplate[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATION_TEMPLATES));
  notificationLogs: NotificationLog[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATION_LOGS));
  gatewayConfig: GatewayConfig = JSON.parse(JSON.stringify(INITIAL_GATEWAY_CONFIG));
  customerNotifications: CustomerNotification[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMER_NOTIFICATIONS));
  blacklists: BlacklistEntry[] = JSON.parse(JSON.stringify(INITIAL_BLACKLIST));
  fraudSettings: FraudRiskSettings = JSON.parse(JSON.stringify(INITIAL_FRAUD_SETTINGS));
  warehouses: WarehouseHub[] = JSON.parse(JSON.stringify(INITIAL_WAREHOUSES));
  warehouseStock: WarehouseStockItem[] = JSON.parse(JSON.stringify(INITIAL_WAREHOUSE_STOCKS));
  stos: StockTransferOrder[] = JSON.parse(JSON.stringify(INITIAL_STOCK_TRANSFERS));
  routingRules: RoutingRuleConfig[] = JSON.parse(JSON.stringify(INITIAL_ROUTING_RULES));
  pickLists: PickList[] = JSON.parse(JSON.stringify(INITIAL_PICK_LISTS));
  dispatchManifests: DispatchManifest[] = JSON.parse(JSON.stringify(INITIAL_DISPATCH_MANIFESTS));
  coupons: CouponRule[] = JSON.parse(JSON.stringify(INITIAL_COUPONS));
  flashDeals: FlashDeal[] = JSON.parse(JSON.stringify(INITIAL_FLASH_DEALS));
  loyaltyWallets: CustomerLoyaltyWallet[] = JSON.parse(JSON.stringify(INITIAL_LOYALTY_WALLETS));
  promotionStats: PromotionSystemStats = JSON.parse(JSON.stringify(INITIAL_PROMOTION_STATS));
  customerAddresses: CustomerAddress[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMER_ADDRESSES));
  wishlists: WishlistItem[] = JSON.parse(JSON.stringify(INITIAL_WISHLISTS));
  customerReturns: CustomerReturnRequest[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMER_RETURNS));
  customerProfiles: CustomerProfile[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMER_PROFILES));

  // Unified Print & Document Engine settings (output-only, non-mutating)
  printSettings: PrintSettings = JSON.parse(JSON.stringify(defaultPrintSettings()));

  // Product methods
  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getProductBySku(sku: string): Product | undefined {
    return this.products.find(p => p.sku === sku);
  }

  addProduct(newProdData: Omit<Product, 'id'>, operator = 'ADMIN'): Product {
    const newProd: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`
    };
    this.products.unshift(newProd);
    this.addAuditLog('CREATE_PRODUCT', 'Product', newProd.sku, `Created product "${newProd.title}"`, operator);
    return newProd;
  }

  updateProduct(id: string, updates: Partial<Product>, operator = 'ADMIN'): Product | null {
    const prod = this.getProductById(id);
    if (!prod) return null;
    Object.assign(prod, updates);
    this.addAuditLog('UPDATE_PRODUCT', 'Product', prod.sku || id, `Updated product "${prod.title}" details`, operator);
    return prod;
  }

  deleteProduct(id: string, operator = 'ADMIN'): boolean {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    const removed = this.products.splice(idx, 1)[0];
    this.addAuditLog('DELETE_PRODUCT', 'Product', removed.sku || id, `Deleted product "${removed.title}" from catalog`, operator);
    return true;
  }

  // Category methods
  getCategoryById(id: string): Category | undefined {
    return this.categories.find(c => c.id === id);
  }

  addCategory(catData: Omit<Category, 'id'>, operator = 'ADMIN'): Category {
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`
    };
    this.categories.push(newCat);
    this.addAuditLog('CREATE_CATEGORY', 'Category', newCat.slug, `Added category "${newCat.name}"`, operator);
    return newCat;
  }

  updateCategory(id: string, updates: Partial<Category>, operator = 'ADMIN'): Category | null {
    const cat = this.getCategoryById(id);
    if (!cat) return null;
    Object.assign(cat, updates);
    this.addAuditLog('UPDATE_CATEGORY', 'Category', cat.slug || id, `Updated category "${cat.name}"`, operator);
    return cat;
  }

  deleteCategory(id: string, operator = 'ADMIN'): boolean {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const removed = this.categories.splice(idx, 1)[0];
    this.addAuditLog('DELETE_CATEGORY', 'Category', removed.slug || id, `Deleted category "${removed.name}"`, operator);
    return true;
  }

  /**
   * Allocate (sell) stock for an order line.
   *
   * This MUST go through `adjustInventory` so that every outflow produces an
   * `InventoryTransaction` row + audit entry, exactly like every inflow
   * (restock / return / manual adjust) already does. Writing `product.stock`
   * directly here used to make the ledger asymmetric: sales were invisible
   * while restocks were recorded, so any reconciliation over-stated stock.
   *
   * The availability check stays *before* the mutation so over-selling is
   * still rejected atomically by the caller's rollback logic.
   */
  updateProductStock(productId: string, quantityToDeduct: number, context?: { orderNumber?: string; operator?: string }): boolean {
    const product = this.getProductById(productId) || this.getProductBySku(productId);
    if (!product) return false;
    if (quantityToDeduct <= 0) return false;
    if (product.stock < quantityToDeduct) return false;

    const result = this.adjustInventory({
      productId: product.id,
      quantityChange: -quantityToDeduct,
      reason: context?.orderNumber
        ? `Sale allocation for order ${context.orderNumber}`
        : 'Sale allocation for customer order',
      operator: context?.operator || 'ORDER_ENGINE'
    });

    return result.success;
  }

  // Inventory & Stock Ledger Methods
  adjustInventory(params: {
    productId: string;
    quantityChange: number;
    reason: string;
    operator?: string;
    warehouseLocation?: string;
    batchNumber?: string;
    notes?: string;
    unitCost?: number;
  }): { success: boolean; product?: Product; transaction?: InventoryTransaction; error?: string } {
    const product = this.getProductById(params.productId) || this.getProductBySku(params.productId);
    if (!product) {
      return { success: false, error: 'Product SKU / ID not found' };
    }

    const quantityBefore = product.stock;
    const quantityAfter = Math.max(0, quantityBefore + params.quantityChange);
    product.stock = quantityAfter;

    // Detect high-volume adjustment (Threshold: >= 50 units)
    const isHighVolume = Math.abs(params.quantityChange) >= 50;

    // Determine movement type
    let type: InventoryTransaction['type'] = 'ADJUSTMENT';
    if (params.quantityChange > 0) {
      if (params.reason.toLowerCase().includes('restock') || params.reason.toLowerCase().includes('intake')) {
        type = 'STOCK_IN';
      } else if (params.reason.toLowerCase().includes('return')) {
        type = 'RETURN';
      }
    } else {
      if (params.reason.toLowerCase().includes('damage') || params.reason.toLowerCase().includes('scrap')) {
        type = 'DAMAGE';
      } else if (params.reason.toLowerCase().includes('sale') || params.reason.toLowerCase().includes('order')) {
        type = 'SALE';
      }
    }

    const transaction: InventoryTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      productId: product.id,
      productTitle: product.title,
      sku: product.sku,
      type,
      quantityChange: params.quantityChange,
      quantityBefore,
      quantityAfter,
      reason: params.reason,
      operator: params.operator || 'INVENTORY_ADMIN',
      warehouseLocation: params.warehouseLocation || 'Tejgaon Central Fulfillment Hub, Dhaka',
      batchNumber: params.batchNumber,
      notes: params.notes,
      unitCost: params.unitCost || product.costPrice,
      flaggedForReview: isHighVolume
    };

    this.inventoryTransactions.unshift(transaction);
    if (this.inventoryTransactions.length > 500) this.inventoryTransactions.pop();

    const auditAction = isHighVolume ? 'HIGH_VOLUME_INVENTORY_ADJUSTMENT' : 'INVENTORY_ADJUSTMENT';
    const auditNotes = isHighVolume 
      ? `[HIGH-VOLUME FLAG] Stock adjusted by ${params.quantityChange > 0 ? '+' : ''}${params.quantityChange} units (${quantityBefore} -> ${quantityAfter}). Reason: ${params.reason}. Mandatory review queued.`
      : `Stock adjusted by ${params.quantityChange > 0 ? '+' : ''}${params.quantityChange} units (${quantityBefore} -> ${quantityAfter}). Reason: ${params.reason}`;

    this.addAuditLog(auditAction, 'Inventory', product.sku, auditNotes, params.operator || 'INVENTORY_ADMIN');

    return {
      success: true,
      product,
      transaction
    };
  }

  batchRestock(payload: BatchRestockPayload): { success: boolean; totalUnitsAdded: number; totalCostValuationBdt: number; transactions: InventoryTransaction[] } {
    const createdTransactions: InventoryTransaction[] = [];
    let totalUnits = 0;
    let totalCost = 0;

    for (const item of payload.items) {
      const product = this.getProductById(item.productId) || this.getProductBySku(item.sku);
      if (!product) continue;

      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitCost = Number(item.unitCost) || product.costPrice || (product.price * 0.6);
      const qtyBefore = product.stock;
      const qtyAfter = qtyBefore + qty;
      product.stock = qtyAfter;
      if (item.unitCost) {
        product.costPrice = unitCost;
      }

      totalUnits += qty;
      totalCost += qty * unitCost;

      const tx: InventoryTransaction = {
        id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        timestamp: new Date().toISOString(),
        productId: product.id,
        productTitle: product.title,
        sku: product.sku,
        type: 'STOCK_IN',
        quantityChange: qty,
        quantityBefore: qtyBefore,
        quantityAfter: qtyAfter,
        reason: `PO Restock Intake: ${payload.supplier} (Inv #${payload.invoiceNumber})`,
        operator: payload.operator || 'SUPER_ADMIN',
        warehouseLocation: payload.warehouseLocation || 'Tejgaon Central Fulfillment Hub, Dhaka',
        batchNumber: item.batchNumber || `LOT-${payload.invoiceNumber}`,
        supplier: payload.supplier,
        unitCost,
        notes: payload.notes || `PO Intake under invoice #${payload.invoiceNumber}`
      };

      this.inventoryTransactions.unshift(tx);
      createdTransactions.push(tx);
    }

    this.addAuditLog(
      'BATCH_RESTOCK_INTAKE',
      'Inventory',
      payload.invoiceNumber,
      `Batch intake of ${totalUnits} units across ${payload.items.length} SKUs from "${payload.supplier}" (Valuation: ৳${totalCost.toLocaleString()})`,
      payload.operator || 'SUPER_ADMIN'
    );

    return {
      success: true,
      totalUnitsAdded: totalUnits,
      totalCostValuationBdt: totalCost,
      transactions: createdTransactions
    };
  }

  getInventoryTransactions(filters?: { sku?: string; type?: string; operator?: string }): InventoryTransaction[] {
    let txs = this.inventoryTransactions;
    if (filters?.sku) {
      txs = txs.filter(t => t.sku.toLowerCase().includes(filters.sku!.toLowerCase()) || t.productTitle.toLowerCase().includes(filters.sku!.toLowerCase()));
    }
    if (filters?.type && filters.type !== 'ALL') {
      txs = txs.filter(t => t.type === filters.type);
    }
    if (filters?.operator && filters.operator !== 'ALL') {
      txs = txs.filter(t => t.operator.toLowerCase().includes(filters.operator!.toLowerCase()));
    }
    return txs;
  }

  getInventoryStats(): InventoryStats {
    let totalUnitsOnHand = 0;
    let totalUnitsReserved = 0;
    let retailValuationBdt = 0;
    let costValuationBdt = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    // Calculate reserved stock from pending orders
    const pendingOrders = this.orders.filter(o => o.orderStatus === 'PENDING' || o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PROCESSING');
    for (const order of pendingOrders) {
      for (const item of order.items) {
        totalUnitsReserved += item.quantity;
      }
    }

    for (const p of this.products) {
      totalUnitsOnHand += p.stock;
      const cost = p.costPrice || (p.price * 0.6);
      retailValuationBdt += (p.price * p.stock);
      costValuationBdt += (cost * p.stock);

      if (p.stock === 0) {
        outOfStockCount++;
      } else if (p.stock <= 5) {
        lowStockCount++;
      }
    }

    const availableUnits = Math.max(0, totalUnitsOnHand - totalUnitsReserved);
    const estimatedMarginBdt = Math.max(0, retailValuationBdt - costValuationBdt);

    return {
      totalSkus: this.products.length,
      totalUnitsOnHand,
      totalUnitsReserved,
      totalAvailableUnits: availableUnits,
      retailValuationBdt,
      costValuationBdt,
      estimatedMarginBdt,
      lowStockCount,
      outOfStockCount,
      warehouses: [
        {
          name: 'Tejgaon Central Fulfillment Hub, Dhaka',
          code: 'WH-DAC-01',
          units: Math.round(totalUnitsOnHand * 0.65),
          valuationBdt: Math.round(retailValuationBdt * 0.65)
        },
        {
          name: 'Chittagong Agrabad Regional Hub',
          code: 'WH-CTG-02',
          units: Math.round(totalUnitsOnHand * 0.22),
          valuationBdt: Math.round(retailValuationBdt * 0.22)
        },
        {
          name: 'Sylhet Zindabazar Distribution Hub',
          code: 'WH-SYL-03',
          units: Math.round(totalUnitsOnHand * 0.13),
          valuationBdt: Math.round(retailValuationBdt * 0.13)
        }
      ]
    };
  }

  // Order methods
  getOrderById(id: string): Order | undefined {
    return this.orders.find(o => o.id === id);
  }

  getOrderByNumber(orderNumber: string): Order | undefined {
    return this.orders.find(o => o.orderNumber === orderNumber);
  }

  addOrder(order: Order): void {
    this.orders.unshift(order);
  }

  updateOrderStatus(orderId: string, status: Order['orderStatus'], note?: string, updatedBy = 'SYSTEM'): Order | undefined {
    const order = this.getOrderById(orderId);
    if (!order) return undefined;

    order.orderStatus = status;
    if (status === 'DELIVERED' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'PAID';
    }

    order.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status transitioned to ${status}`,
      updatedBy
    });

    this.addAuditLog('UPDATE_ORDER_STATUS', 'Order', order.orderNumber, `Order status set to ${status}`);
    return order;
  }

  // Payment Transactions methods
  addPaymentTransaction(tx: PaymentTransaction): void {
    this.paymentTransactions.unshift(tx);
  }

  getPaymentTransactions(): PaymentTransaction[] {
    return this.paymentTransactions;
  }

  getTransactionByOrder(orderNumber: string): PaymentTransaction | undefined {
    return this.paymentTransactions.find(t => t.orderNumber === orderNumber);
  }

  // Fraud Sentinel
  evaluateOrderFraudRisk(order: {
    customerPhone: string;
    total: number;
    paymentMethod: string;
    district: string;
  }): FraudRiskAssessment {
    let score = 5;
    const flags: string[] = [];

    // High value COD check (> 8,000 BDT)
    if (order.paymentMethod === 'COD' && order.total > 8000) {
      score += 40;
      flags.push('High-value Cash On Delivery (> ৳8,000)');
    }

    // Velocity check: count past orders by this phone
    const pastOrders = this.orders.filter(o => o.customer.phone === order.customerPhone);
    const returnedOrders = pastOrders.filter(o => o.orderStatus === 'RETURNED' || o.orderStatus === 'CANCELLED');
    if (returnedOrders.length > 0) {
      score += 35;
      flags.push(`Customer has ${returnedOrders.length} previous returned/cancelled order(s)`);
    }

    // High return remote zone check
    const remoteHighRiskDistricts = ['bandarban', 'khagrachhari', 'rangamati', 'sunamganj'];
    if (remoteHighRiskDistricts.includes((order.district || '').toLowerCase().trim())) {
      score += 15;
      flags.push('Delivery destination is in high-transit courier remote zone');
    }

    let riskRating: FraudRiskAssessment['riskRating'] = 'LOW';
    let recommendation: FraudRiskAssessment['recommendation'] = 'AUTO_APPROVE';

    if (score >= 60) {
      riskRating = 'HIGH';
      recommendation = 'REQUIRE_ADVANCE_SHIPPING_FEE';
    } else if (score >= 30) {
      riskRating = 'MEDIUM';
      recommendation = 'REQUIRE_PHONE_VERIFICATION';
    }

    return {
      riskScore: Math.min(100, score),
      riskRating,
      flags,
      reasons: flags.length > 0 ? flags : ['Order parameters within normal operational baseline.'],
      recommendation,
      breakdown: {
        phoneScore: 0,
        addressScore: 0,
        valueScore: score > 20 ? 20 : 0,
        velocityScore: 0,
        historyScore: returnedOrders.length > 0 ? 35 : 0,
        emailScore: 0
      },
      evaluatedAt: new Date().toISOString()
    };
  }

  // ---------------------------------------------------------------
  // RMA methods (S2-3)
  //
  // Returns used to be per-browser localStorage state, so two operators saw
  // two different worlds and the server's restock/refund logic was never
  // reachable from the admin UI. These records are now authoritative.
  // ---------------------------------------------------------------
  createRma(input: Omit<RmaRecord, 'id' | 'rmaNumber'> & { rmaNumber?: string }): RmaRecord {
    const year = new Date().getFullYear();
    const record: RmaRecord = {
      ...input,
      id: `rma-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rmaNumber: input.rmaNumber || `RMA-${year}-${String(this.rmaRecords.length + 1).padStart(4, '0')}`
    };
    this.rmaRecords.unshift(record);
    this.addAuditLog('CREATE_RMA', 'Order', record.rmaNumber, `Created return authorization for ${record.orderNumber}`);
    return record;
  }

  updateRma(id: string, patch: Partial<RmaRecord>): RmaRecord | null {
    const record = this.rmaRecords.find(r => r.id === id);
    if (!record) return null;
    // id and rmaNumber are the case's identity; a patch must never move them.
    const { id: _ignoredId, rmaNumber: _ignoredNumber, ...safe } = patch;
    Object.assign(record, safe);
    this.addAuditLog('UPDATE_RMA', 'Order', record.rmaNumber, `Return case moved to ${record.stage}`);
    return record;
  }

  // Expense methods
  addExpense(expense: Omit<ExpenseRecord, 'id'>): ExpenseRecord {
    const newExp: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    this.expenses.unshift(newExp);
    this.addAuditLog('ADD_EXPENSE', 'Finance', newExp.reference, `Recorded expense ৳${newExp.amount} for ${newExp.category} (${newExp.vendor})`);
    return newExp;
  }

  deleteExpense(id: string): boolean {
    const exp = this.expenses.find(e => e.id === id);
    if (!exp) return false;
    this.expenses = this.expenses.filter(e => e.id !== id);
    this.addAuditLog('DELETE_EXPENSE', 'Finance', exp.reference, `Deleted expense ৳${exp.amount} for ${exp.category}`);
    return true;
  }

  // Settlement methods
  addSettlement(settlement: Omit<SettlementRecord, 'id'>): SettlementRecord {
    const newSet: SettlementRecord = {
      ...settlement,
      id: `set-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    this.settlements.unshift(newSet);
    this.addAuditLog('CREATE_SETTLEMENT', 'Finance', newSet.batchNumber, `Created settlement batch for ৳${newSet.netPayout} (${newSet.gateway})`);
    return newSet;
  }

  updateSettlementStatus(id: string, status: SettlementRecord['status'], utr?: string): SettlementRecord | undefined {
    const set = this.settlements.find(s => s.id === id);
    if (!set) return undefined;
    set.status = status;
    if (utr) set.utrOrReference = utr;
    if (status === 'SETTLED' && !set.payoutDate) {
      set.payoutDate = new Date().toISOString();
    }
    this.addAuditLog('UPDATE_SETTLEMENT', 'Finance', set.batchNumber, `Updated settlement batch status to ${status}`);
    return set;
  }

  // Webhook Endpoints
  addWebhookEndpoint(endpoint: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'totalDelivered' | 'totalFailed'>): WebhookEndpoint {
    const newEp: WebhookEndpoint = {
      ...endpoint,
      id: `wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      totalDelivered: 0,
      totalFailed: 0
    };
    this.webhookEndpoints.unshift(newEp);
    this.addAuditLog('CREATE_WEBHOOK', 'Operations', newEp.id, `Created webhook endpoint ${newEp.name} (${newEp.url})`);
    return newEp;
  }

  updateWebhookEndpoint(id: string, updates: Partial<WebhookEndpoint>): WebhookEndpoint | undefined {
    const ep = this.webhookEndpoints.find(w => w.id === id);
    if (!ep) return undefined;
    Object.assign(ep, updates);
    this.addAuditLog('UPDATE_WEBHOOK', 'Operations', id, `Updated webhook endpoint ${ep.name}`);
    return ep;
  }

  deleteWebhookEndpoint(id: string): boolean {
    const ep = this.webhookEndpoints.find(w => w.id === id);
    if (!ep) return false;
    this.webhookEndpoints = this.webhookEndpoints.filter(w => w.id !== id);
    this.addAuditLog('DELETE_WEBHOOK', 'Operations', id, `Deleted webhook endpoint ${ep.name}`);
    return true;
  }

  addWebhookLog(log: Omit<WebhookDeliveryLog, 'id'>): WebhookDeliveryLog {
    const newLog: WebhookDeliveryLog = {
      ...log,
      id: `whlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    this.webhookLogs.unshift(newLog);
    if (this.webhookLogs.length > 100) this.webhookLogs.pop(); // keep last 100 logs
    return newLog;
  }

  // Notification Templates
  updateNotificationTemplate(id: string, updates: Partial<NotificationTemplate>): NotificationTemplate | undefined {
    const tpl = this.notificationTemplates.find(t => t.id === id);
    if (!tpl) return undefined;
    Object.assign(tpl, updates);
    this.addAuditLog('UPDATE_NOTIFICATION_TEMPLATE', 'Operations', id, `Updated template ${tpl.title}`);
    return tpl;
  }

  // Notification Logs
  addNotificationLog(log: Omit<NotificationLog, 'id'>): NotificationLog {
    const newLog: NotificationLog = {
      ...log,
      id: `nlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    this.notificationLogs.unshift(newLog);
    if (this.notificationLogs.length > 150) this.notificationLogs.pop();
    return newLog;
  }

  retryNotificationLog(id: string): NotificationLog | undefined {
    const log = this.notificationLogs.find(l => l.id === id);
    if (!log) return undefined;
    log.status = 'DELIVERED';
    log.retryCount = (log.retryCount || 0) + 1;
    log.timestamp = new Date().toISOString();
    log.gatewayResponse = JSON.stringify({
      provider: log.channel === 'WHATSAPP' ? this.gatewayConfig.whatsappProvider : (log.channel === 'SMS' ? this.gatewayConfig.smsProvider : this.gatewayConfig.emailProvider),
      status: 'DELIVRD_RETRY_SUCCESS',
      retry: log.retryCount,
      timestamp: log.timestamp
    });
    this.addAuditLog('RETRY_NOTIFICATION', 'Operations', id, `Manually retried dispatching ${log.channel} to ${log.recipient}`);
    return log;
  }

  // Customer In-App Notifications
  getCustomerNotifications(customerId: string): CustomerNotification[] {
    return this.customerNotifications.filter(n => n.customerId === customerId);
  }

  addCustomerNotification(notif: Omit<CustomerNotification, 'id' | 'createdAt'>): CustomerNotification {
    const newNotif: CustomerNotification = {
      ...notif,
      id: `cnotif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    this.customerNotifications.unshift(newNotif);
    if (this.customerNotifications.length > 100) this.customerNotifications.pop();
    return newNotif;
  }

  markNotificationAsRead(id: string): boolean {
    const notif = this.customerNotifications.find(n => n.id === id);
    if (!notif) return false;
    notif.isRead = true;
    return true;
  }

  markAllNotificationsAsRead(customerId: string): boolean {
    const notifs = this.customerNotifications.filter(n => n.customerId === customerId);
    notifs.forEach(n => { n.isRead = true; });
    return true;
  }

  // Content CMS & Publishing Flow
  getContent(): SiteContent {
    return this.siteContent;
  }

  updateContent(updates: Partial<SiteContent>, operator = 'SUPER_ADMIN', summary = 'Updated website content and CMS blocks'): { content: SiteContent; revision: ContentRevision } {
    this.siteContent = {
      ...this.siteContent,
      ...updates
    };

    const revision: ContentRevision = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      operator,
      summary,
      snapshot: JSON.parse(JSON.stringify(this.siteContent))
    };

    this.contentRevisions.unshift(revision);
    if (this.contentRevisions.length > 30) this.contentRevisions.pop(); // keep last 30 revisions

    this.addAuditLog('PUBLISH_CONTENT', 'ContentCMS', revision.id, summary, operator);
    return { content: this.siteContent, revision };
  }

  restoreContentRevision(revisionId: string, operator = 'SUPER_ADMIN'): SiteContent | undefined {
    const rev = this.contentRevisions.find(r => r.id === revisionId);
    if (!rev) return undefined;

    this.siteContent = JSON.parse(JSON.stringify(rev.snapshot));
    
    // Add rollback revision record
    const rollbackRevision: ContentRevision = {
      id: `rev-${Date.now()}-rollback`,
      timestamp: new Date().toISOString(),
      operator,
      summary: `Restored to snapshot from ${rev.timestamp} (${rev.summary})`,
      snapshot: JSON.parse(JSON.stringify(this.siteContent))
    };
    this.contentRevisions.unshift(rollbackRevision);

    this.addAuditLog('RESTORE_CONTENT_REVISION', 'ContentCMS', revisionId, `Restored content version from ${rev.timestamp}`, operator);
    return this.siteContent;
  }

  getContentRevisions(): ContentRevision[] {
    return this.contentRevisions;
  }

  // Audit Logs with Cryptographic Chaining
  addAuditLog(action: string, resource: string, resourceId: string, details: string, operator = 'SYSTEM', ip = '127.0.0.1', severity: AuditSeverity = 'INFO', category: AuditCategory = 'SYSTEM'): AuditLog {
    try {
      const chainedLog = securityEngine.logAudit({
        operator,
        role: 'SUPER_ADMIN',
        action,
        resource,
        resourceId,
        details,
        ipAddress: ip,
        severity,
        category
      });
      this.auditLogs.unshift(chainedLog);
      return chainedLog;
    } catch {
      const log: AuditLog = {
        id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        operator,
        role: 'SUPER_ADMIN',
        action,
        resource,
        resourceId,
        details,
        ipAddress: ip,
        severity,
        category
      };
      this.auditLogs.unshift(log);
      return log;
    }
  }

  // Blacklist Management Methods
  addBlacklistEntry(entry: {
    type: 'PHONE' | 'IP' | 'EMAIL' | 'ADDRESS';
    value: string;
    reason: string;
    severity?: 'STRICT_BLOCK' | 'FLAG_FOR_REVIEW';
    addedBy?: string;
  }): BlacklistEntry {
    const newEntry: BlacklistEntry = {
      id: `bl-${Date.now()}`,
      type: entry.type,
      value: entry.value.trim(),
      reason: entry.reason.trim(),
      severity: entry.severity || 'STRICT_BLOCK',
      addedAt: new Date().toISOString(),
      addedBy: entry.addedBy || 'OPERATOR',
      hitCount: 0,
      isActive: true
    };
    this.blacklists.unshift(newEntry);
    this.addAuditLog('ADD_BLACKLIST_ENTRY', 'FraudBlacklist', newEntry.id, `Blacklisted ${entry.type}: ${entry.value} (${entry.reason})`, entry.addedBy || 'OPERATOR');
    return newEntry;
  }

  deleteBlacklistEntry(id: string, operator = 'OPERATOR'): boolean {
    const idx = this.blacklists.findIndex(b => b.id === id);
    if (idx === -1) return false;
    const removed = this.blacklists.splice(idx, 1)[0];
    this.addAuditLog('REMOVE_BLACKLIST_ENTRY', 'FraudBlacklist', id, `Removed ${removed.type}: ${removed.value} from blacklist`, operator);
    return true;
  }

  toggleBlacklistStatus(id: string, operator = 'OPERATOR'): BlacklistEntry | undefined {
    const entry = this.blacklists.find(b => b.id === id);
    if (!entry) return undefined;
    entry.isActive = !entry.isActive;
    this.addAuditLog('TOGGLE_BLACKLIST_STATUS', 'FraudBlacklist', id, `Toggled active state of ${entry.value} to ${entry.isActive}`, operator);
    return entry;
  }

  updateFraudSettings(settings: Partial<FraudRiskSettings>, operator = 'SUPER_ADMIN'): FraudRiskSettings {
    this.fraudSettings = {
      ...this.fraudSettings,
      ...settings,
      rules: settings.rules || this.fraudSettings.rules
    };
    this.addAuditLog('UPDATE_FRAUD_SETTINGS', 'FraudRiskEngine', 'global-config', 'Updated fraud risk thresholds & heuristics weights', operator);
    return this.fraudSettings;
  }

  // -------------------------------------------------------------
  // Phase 14: Promotions, Coupons, Flash Deals & Loyalty Methods
  // -------------------------------------------------------------

  getCouponByCode(code: string): CouponRule | undefined {
    const cleanCode = (code || '').trim().toUpperCase();
    return this.coupons.find(c => c.code.toUpperCase() === cleanCode);
  }

  addCoupon(coupon: Omit<CouponRule, 'id' | 'usageCount' | 'totalDiscountDisbursedBdt' | 'totalAttributedRevenueBdt' | 'createdAt'>, operator = 'OPERATOR'): CouponRule {
    const newCoupon: CouponRule = {
      ...coupon,
      id: `cpn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code: coupon.code.trim().toUpperCase(),
      usageCount: 0,
      totalDiscountDisbursedBdt: 0,
      totalAttributedRevenueBdt: 0,
      createdAt: new Date().toISOString()
    };
    this.coupons.unshift(newCoupon);
    this.addAuditLog('CREATE_COUPON', 'PromotionsEngine', newCoupon.id, `Created coupon ${newCoupon.code} (${newCoupon.discountType}: ${newCoupon.discountValue})`, operator);
    return newCoupon;
  }

  updateCoupon(id: string, updates: Partial<CouponRule>, operator = 'OPERATOR'): CouponRule | undefined {
    const coupon = this.coupons.find(c => c.id === id);
    if (!coupon) return undefined;
    Object.assign(coupon, updates, { updatedAt: new Date().toISOString() });
    if (updates.code) coupon.code = updates.code.trim().toUpperCase();
    this.addAuditLog('UPDATE_COUPON', 'PromotionsEngine', id, `Updated coupon ${coupon.code}`, operator);
    return coupon;
  }

  deleteCoupon(id: string, operator = 'OPERATOR'): boolean {
    const idx = this.coupons.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const removed = this.coupons.splice(idx, 1)[0];
    this.addAuditLog('DELETE_COUPON', 'PromotionsEngine', id, `Deleted coupon ${removed.code}`, operator);
    return true;
  }

  recordCouponUsage(code: string, discountAmount: number, orderGrossGmv: number): void {
    const coupon = this.getCouponByCode(code);
    if (!coupon) return;
    coupon.usageCount += 1;
    coupon.totalDiscountDisbursedBdt += discountAmount;
    coupon.totalAttributedRevenueBdt += orderGrossGmv;
    if (coupon.usageLimitTotal && coupon.usageCount >= coupon.usageLimitTotal) {
      coupon.status = 'EXHAUSTED';
    }
  }

  getLoyaltyWalletByPhone(phone: string): CustomerLoyaltyWallet | undefined {
    const clean = phone.replace(/[^0-9]/g, '');
    return this.loyaltyWallets.find(w => w.phone.replace(/[^0-9]/g, '').endsWith(clean.slice(-10)));
  }

  getOrCreateLoyaltyWallet(customerId: string, customerName: string, phone: string, email?: string): CustomerLoyaltyWallet {
    let wallet = this.getLoyaltyWalletByPhone(phone);
    if (!wallet) {
      const referralCode = `${customerName.split(' ')[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      wallet = {
        customerId,
        customerName,
        phone,
        email,
        tier: 'BRONZE',
        pointsBalance: 50, // Welcome gift 50 points
        lifetimeEarnedPoints: 50,
        lifetimeRedeemedPoints: 0,
        referralCode,
        referralCount: 0,
        totalWalletSavingsBdt: 0,
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        transactions: [
          {
            id: `tx-pts-${Date.now()}`,
            type: 'WELCOME_BONUS',
            points: 50,
            bdtEquivalent: 50,
            note: '50 Welcome Points upon joining Kisholoy Club',
            timestamp: new Date().toISOString()
          }
        ]
      };
      this.loyaltyWallets.push(wallet);
      this.addAuditLog('CREATE_LOYALTY_WALLET', 'LoyaltyEngine', customerId, `Created loyalty wallet for ${customerName} (${phone})`);
    }
    return wallet;
  }

  adjustLoyaltyPoints(params: {
    phone: string;
    points: number;
    type: LoyaltyPointsTransaction['type'];
    note: string;
    orderId?: string;
    orderNumber?: string;
    performedBy?: string;
  }): CustomerLoyaltyWallet | undefined {
    const wallet = this.getLoyaltyWalletByPhone(params.phone);
    if (!wallet) return undefined;

    wallet.pointsBalance = Math.max(0, wallet.pointsBalance + params.points);
    if (params.points > 0) {
      wallet.lifetimeEarnedPoints += params.points;
    } else {
      wallet.lifetimeRedeemedPoints += Math.abs(params.points);
      wallet.totalWalletSavingsBdt += Math.abs(params.points);
    }

    // Auto calculate tier progression:
    // Bronze: 0 - 249 lifetime points
    // Silver: 250 - 499 lifetime points
    // Gold: 500 - 999 lifetime points
    // Platinum: 1000+ lifetime points
    if (wallet.lifetimeEarnedPoints >= 1000) {
      wallet.tier = 'PLATINUM';
    } else if (wallet.lifetimeEarnedPoints >= 500) {
      wallet.tier = 'GOLD';
    } else if (wallet.lifetimeEarnedPoints >= 250) {
      wallet.tier = 'SILVER';
    } else {
      wallet.tier = 'BRONZE';
    }

    wallet.lastActiveAt = new Date().toISOString();

    const tx: LoyaltyPointsTransaction = {
      id: `tx-pts-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: params.type,
      points: params.points,
      bdtEquivalent: params.points,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      note: params.note,
      timestamp: new Date().toISOString(),
      performedBy: params.performedBy || 'SYSTEM'
    };

    wallet.transactions.unshift(tx);
    this.addAuditLog(
      'ADJUST_LOYALTY_POINTS',
      'LoyaltyEngine',
      wallet.customerId,
      `${params.points >= 0 ? 'Awarded' : 'Deducted'} ${Math.abs(params.points)} pts for ${wallet.customerName} (${params.note})`,
      params.performedBy || 'SYSTEM'
    );

    return wallet;
  }

  // ---------------------------------------------------------------
  // Customer identity resolution (canonical-phone keyed)
  // ---------------------------------------------------------------

  /**
   * Find a customer by phone number in ANY format. Matching is done on the
   * canonical `+8801XXXXXXXXX` form so `01712345678`, `8801712345678`,
   * `+880 1712-345678` and `+8801712345678` all resolve to the same person.
   * Falls back to a digits-only comparison for legacy/non-BD records.
   */
  findCustomerByPhone(phone?: string | null): Customer | undefined {
    if (!phone) return undefined;
    const canonical = normalizeBdMobilePhone(phone);
    if (canonical) {
      const hit = this.customers.find(c => normalizeBdMobilePhone(c.phone) === canonical);
      if (hit) return hit;
    }
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length < 10) return undefined;
    return this.customers.find(c => {
      const cd = String(c.phone || '').replace(/\D/g, '');
      return cd.length >= 10 && (cd === digits || cd.endsWith(digits) || digits.endsWith(cd));
    });
  }

  /**
   * Resolve the CRM customer record for an incoming order, creating one when
   * the buyer is new. Without this, guest checkouts minted a throwaway
   * `cust-<timestamp>` id that matched nothing, so Customer 360, RFM/CRM
   * segmentation and repeat-purchase metrics never saw guest buyers.
   */
  upsertCustomerFromOrder(params: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    district?: string;
    thana?: string;
    source?: string;
  }): Customer {
    const canonical = normalizeBdMobilePhone(params.phone) || params.phone.trim();
    const existing = this.findCustomerByPhone(params.phone);

    if (existing) {
      // Keep the CRM record fresh, but never overwrite good data with blanks.
      if (canonical && normalizeBdMobilePhone(existing.phone) === normalizeBdMobilePhone(canonical)) {
        existing.phone = canonical;
      }
      if (params.email && !existing.email.includes('@customer.kisholoy.com')) {
        // keep the real email already on file
      } else if (params.email) {
        existing.email = params.email.trim();
      }
      if (params.district && !existing.district) existing.district = params.district;
      if (params.thana && !existing.thana) existing.thana = params.thana;
      if (params.address && (!existing.defaultAddress || existing.defaultAddress === 'Dhaka, Bangladesh')) {
        existing.defaultAddress = params.address;
      }
      return existing;
    }

    const digits = canonical.replace(/\D/g, '');
    const created: Customer = {
      id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: params.name.trim(),
      phone: canonical,
      email: params.email?.trim() || `${digits}@customer.kisholoy.com`,
      joinedDate: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      totalSpent: 0,
      defaultAddress: params.address?.trim() || 'Bangladesh',
      status: 'ACTIVE',
      district: params.district,
      thana: params.thana,
      source: params.source || 'ORDER'
    };
    this.customers.unshift(created);
    this.addAuditLog(
      'CREATE_CUSTOMER',
      'Customer',
      created.id,
      `Auto-created CRM record for ${created.name} (${created.phone}) from a new order.`,
      'ORDER_ENGINE'
    );
    return created;
  }

  /** Roll an order's value into the customer's lifetime CRM aggregates. */
  recordCustomerOrderStats(customerId: string, orderTotal: number): void {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) return;
    customer.totalOrders = (customer.totalOrders || 0) + 1;
    customer.totalSpent = (customer.totalSpent || 0) + (orderTotal || 0);
  }

  // Customer Portal Methods
  getCustomerProfile(customerId: string): CustomerProfile | undefined {
    let profile = this.customerProfiles.find(p => p.id === customerId);
    if (!profile) {
      const customer = this.customers.find(c => c.id === customerId);
      if (customer) {
        profile = {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          joinedDate: customer.joinedDate,
          tier: 'BRONZE',
          addresses: this.customerAddresses.filter(a => a.customerId === customer.id),
          preferences: {
            newsletterSubscribed: true,
            smsOrderUpdates: true,
            promotionalOffers: true,
            preferredLanguage: 'BN'
          }
        };
        this.customerProfiles.push(profile);
      }
    }
    if (profile) {
      profile.addresses = this.customerAddresses.filter(a => a.customerId === customerId);
    }
    return profile;
  }

  updateCustomerProfile(customerId: string, updates: Partial<CustomerProfile>): CustomerProfile | null {
    const profile = this.getCustomerProfile(customerId);
    if (!profile) return null;
    
    if (updates.name) profile.name = updates.name;
    if (updates.email) profile.email = updates.email;
    if (updates.alternatePhone !== undefined) profile.alternatePhone = updates.alternatePhone;
    if (updates.dateOfBirth !== undefined) profile.dateOfBirth = updates.dateOfBirth;
    if (updates.gender !== undefined) profile.gender = updates.gender;
    if (updates.preferences) {
      profile.preferences = { ...profile.preferences, ...updates.preferences };
    }

    // Sync to customers list
    const customer = this.customers.find(c => c.id === customerId);
    if (customer) {
      if (updates.name) customer.name = updates.name;
      if (updates.email) customer.email = updates.email;
    }

    this.addAuditLog('UPDATE_PROFILE', 'CustomerPortal', customerId, `Updated profile for customer ${profile.name}`);
    return profile;
  }

  getCustomerAddresses(customerId: string): CustomerAddress[] {
    return this.customerAddresses.filter(a => a.customerId === customerId);
  }

  addCustomerAddress(address: Omit<CustomerAddress, 'id' | 'createdAt'>): CustomerAddress {
    if (address.isDefault) {
      this.customerAddresses
        .filter(a => a.customerId === address.customerId)
        .forEach(a => { a.isDefault = false; });
    }
    const newAddress: CustomerAddress = {
      ...address,
      id: `addr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    this.customerAddresses.push(newAddress);

    // Sync default address to customer profile view in admin
    if (newAddress.isDefault) {
      const cust = this.customers.find(c => c.id === address.customerId);
      if (cust) {
        cust.defaultAddress = `${newAddress.addressLine}, ${newAddress.district}`;
        cust.district = newAddress.district;
        cust.thana = newAddress.upazilaOrArea;
      }
    }
    return newAddress;
  }

  updateCustomerAddress(addressId: string, updates: Partial<CustomerAddress>): CustomerAddress | null {
    const address = this.customerAddresses.find(a => a.id === addressId);
    if (!address) return null;
    
    if (updates.isDefault) {
      this.customerAddresses
        .filter(a => a.customerId === address.customerId && a.id !== addressId)
        .forEach(a => { a.isDefault = false; });
    }
    Object.assign(address, updates);

    // Sync default address to customer profile view in admin
    if (address.isDefault) {
      const cust = this.customers.find(c => c.id === address.customerId);
      if (cust) {
        cust.defaultAddress = `${address.addressLine}, ${address.district}`;
        cust.district = address.district;
        cust.thana = address.upazilaOrArea;
      }
    }
    return address;
  }

  deleteCustomerAddress(addressId: string, customerId: string): boolean {
    const idx = this.customerAddresses.findIndex(a => a.id === addressId && a.customerId === customerId);
    if (idx === -1) return false;
    this.customerAddresses.splice(idx, 1);
    return true;
  }

  // Wishlist Methods
  getWishlist(customerId: string): WishlistItem[] {
    return this.wishlists.filter(w => w.customerId === customerId);
  }

  toggleWishlist(customerId: string, productId: string): { action: 'ADDED' | 'REMOVED'; item?: WishlistItem } {
    const existingIdx = this.wishlists.findIndex(w => w.customerId === customerId && w.productId === productId);
    if (existingIdx !== -1) {
      this.wishlists.splice(existingIdx, 1);
      return { action: 'REMOVED' };
    }
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    const newItem: WishlistItem = {
      id: `wish-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId,
      productId: product.id,
      productTitle: product.title,
      productTitleBn: product.titleBn || product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0] || '',
      inStock: product.stock > 0,
      category: product.category,
      addedAt: new Date().toISOString()
    };
    this.wishlists.unshift(newItem);
    return { action: 'ADDED', item: newItem };
  }

  // Return Requests
  getCustomerReturnRequests(customerId: string): CustomerReturnRequest[] {
    return this.customerReturns.filter(r => r.customerId === customerId);
  }

  getAllReturnRequests(): CustomerReturnRequest[] {
    return this.customerReturns;
  }

  createReturnRequest(req: Omit<CustomerReturnRequest, 'id' | 'requestNumber' | 'status' | 'createdAt' | 'updatedAt'>): CustomerReturnRequest {
    const newReq: CustomerReturnRequest = {
      ...req,
      id: `ret-req-${Date.now()}`,
      requestNumber: `RMA-${new Date().getFullYear()}-${String(this.customerReturns.length + 1).padStart(3, '0')}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.customerReturns.unshift(newReq);
    this.addAuditLog('CREATE_RETURN_REQUEST', 'CustomerPortal', newReq.id, `Created return request ${newReq.requestNumber} for order ${newReq.orderNumber}`);
    return newReq;
  }

  updateReturnRequestStatus(requestId: string, status: CustomerReturnRequest['status'], adminNotes?: string): CustomerReturnRequest | null {
    const req = this.customerReturns.find(r => r.id === requestId);
    if (!req) return null;
    req.status = status;
    if (adminNotes) req.adminNotes = adminNotes;
    req.updatedAt = new Date().toISOString();
    this.addAuditLog('UPDATE_RETURN_STATUS', 'CustomerPortal', req.id, `Status updated to ${status} for ${req.requestNumber}`);
    return req;
  }
}

export const serverDb = new ServerDatabase();
