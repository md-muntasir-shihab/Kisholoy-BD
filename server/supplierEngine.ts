/**
 * KISHOLOY Supplier & Procurement Engine
 * Handles artisan guilds, textile mills, raw material suppliers, purchase orders,
 * payment vouchers, and isolated feature-flagged supplier portal access.
 * 
 * Strict Financial Safety: Server-authoritative calculations, minor-unit accuracy,
 * zero client trust on prices or balances, full audit ledger logging.
 * @license Apache-2.0
 */

import { 
  Supplier, 
  SupplierPurchaseOrder, 
  SupplierPayment, 
  SupplierOverviewMetrics,
  SupplierStatus,
  SupplierInteraction,
  SupplierInteractionType,
  SupplierInteractionOutcome
} from '../src/types';
import { securityEngine } from './securityEngine';
import { serverDb } from './db';

class SupplierEngine {
  private suppliers: Map<string, Supplier> = new Map();
  private purchaseOrders: Map<string, SupplierPurchaseOrder> = new Map();
  private payments: Map<string, SupplierPayment> = new Map();
  private interactions: Map<string, SupplierInteraction> = new Map();

  constructor() {
    this.initializeSuppliers();
  }

  private initializeSuppliers() {
    // 1. Sonargaon Heritage Jamdani Artisans
    const sup1: Supplier = {
      id: 'sup-001',
      code: 'SUP-JAM-001',
      companyName: 'Sonargaon Heritage Jamdani Artisans',
      contactPerson: 'Master Weaver Alimuddin Mia',
      email: 'alimuddin@jamdanisonargaon.bd',
      phone: '+8801712345678',
      secondaryPhone: '+8801719876543',
      address: 'Rupganj Artisan Village, Sonargaon',
      district: 'Narayanganj',
      categoriesSupplied: ['Traditional Clothing', 'Handloom Sarees'],
      tradeLicenseNumber: 'TRAD/NRG/2021/8841',
      tinNumber: '7841-9923-1102',
      vatRegistrationNumber: 'BIN-002148759-0101',
      bankDetails: {
        bankName: 'Islami Bank Bangladesh PLC',
        accountName: 'Sonargaon Jamdani Weavers Coop',
        accountNumber: '2050148020054321',
        branchName: 'Sonargaon Branch',
        routingNumber: '125272145'
      },
      mfsDetails: {
        provider: 'BKASH',
        accountType: 'MERCHANT',
        accountNumber: '01712345678'
      },
      paymentTerms: 'NET_15',
      status: 'ACTIVE',
      totalPurchased: 450000,
      totalPaid: 375000,
      totalDue: 75000,
      portalAccess: {
        enabled: false, // Feature-flagged: disabled by default
        loginEmail: 'supplier.jamdani@kisholoy.com',
        loginIsolated: true
      },
      notes: 'Premier Jamdani master weaver coop producing 84-count authentic Dhakai Jamdani sarees.',
      createdAt: '2026-01-05T08:00:00.000Z',
      updatedAt: '2026-02-28T14:30:00.000Z'
    };

    // 2. ClayCraft Pottery & Terracotta Guild
    const sup2: Supplier = {
      id: 'sup-002',
      code: 'SUP-TER-002',
      companyName: 'ClayCraft Pottery & Terracotta Guild',
      contactPerson: 'Bikash Chandra Paul',
      email: 'bikash@claycraft.com.bd',
      phone: '+8801814567890',
      address: 'Palpara Clay Works, Shibpur',
      district: 'Narsingdi',
      categoriesSupplied: ['Handicrafts & Decor', 'Terracotta Art'],
      tradeLicenseNumber: 'TRAD/NSD/2022/4102',
      tinNumber: '5621-8812-4401',
      bankDetails: {
        bankName: 'Sonali Bank PLC',
        accountName: 'ClayCraft Pottery Guild',
        accountNumber: '4401128001923',
        branchName: 'Narsingdi Main Branch',
        routingNumber: '200261100'
      },
      paymentTerms: 'COD',
      status: 'ACTIVE',
      totalPurchased: 185000,
      totalPaid: 185000,
      totalDue: 0,
      portalAccess: {
        enabled: false,
        loginEmail: 'supplier.claycraft@kisholoy.com',
        loginIsolated: true
      },
      notes: 'Hand-carved natural red terracotta vases and artisanal interior accents.',
      createdAt: '2026-01-12T10:00:00.000Z',
      updatedAt: '2026-02-25T11:00:00.000Z'
    };

    // 3. Sreemangal Organic Tea Estates
    const sup3: Supplier = {
      id: 'sup-003',
      code: 'SUP-TEA-003',
      companyName: 'Sreemangal Organic Tea Estates',
      contactPerson: 'Kazi Farhan Ahmed',
      email: 'procurement@sreemangalteaco.bd',
      phone: '+8801919876543',
      address: 'Kalighat Road, Tea Valley Zone',
      district: 'Moulvibazar',
      categoriesSupplied: ['Organic & Pantry', 'Beverages'],
      tradeLicenseNumber: 'TRAD/MLB/2020/1908',
      tinNumber: '9921-3341-7788',
      vatRegistrationNumber: 'BIN-003319024-0202',
      bankDetails: {
        bankName: 'BRAC Bank PLC',
        accountName: 'Sreemangal Organic Tea Co Ltd',
        accountNumber: '1501204899120001',
        branchName: 'Sreemangal Branch',
        routingNumber: '060263412'
      },
      paymentTerms: 'NET_30',
      status: 'ACTIVE',
      totalPurchased: 290000,
      totalPaid: 210000,
      totalDue: 80000,
      portalAccess: {
        enabled: false,
        loginEmail: 'supplier.tea@kisholoy.com',
        loginIsolated: true
      },
      notes: 'Single-estate hand-picked green tea and artisan Orthodox black tea.',
      createdAt: '2026-01-18T09:15:00.000Z',
      updatedAt: '2026-03-01T16:00:00.000Z'
    };

    // 4. Hazaribagh Master Leather Crafts
    const sup4: Supplier = {
      id: 'sup-004',
      code: 'SUP-LEA-004',
      companyName: 'Hazaribagh Master Leather Crafts',
      contactPerson: 'Shahadat Hossain',
      email: 'info@hazaribaghleather.com',
      phone: '+8801618765432',
      address: 'Tannery Estate Road, Savar Leather Zone',
      district: 'Dhaka',
      categoriesSupplied: ['Leather Goods', 'Accessories'],
      tradeLicenseNumber: 'TRAD/DHK/2019/3321',
      tinNumber: '4412-7789-2211',
      bankDetails: {
        bankName: 'City Bank PLC',
        accountName: 'Hazaribagh Leather Crafts',
        accountNumber: '1102948172001',
        branchName: 'Dhanmondi Branch',
        routingNumber: '225271890'
      },
      paymentTerms: 'NET_15',
      status: 'ACTIVE',
      totalPurchased: 320000,
      totalPaid: 260000,
      totalDue: 60000,
      portalAccess: {
        enabled: false,
        loginEmail: 'supplier.leather@kisholoy.com',
        loginIsolated: true
      },
      notes: 'Full-grain vegetable-tanned leather bi-fold wallets, laptop sleeves, and belts.',
      createdAt: '2026-01-22T11:45:00.000Z',
      updatedAt: '2026-02-27T18:00:00.000Z'
    };

    // 5. Comilla Khadi Handloom Cooperative
    const sup5: Supplier = {
      id: 'sup-005',
      code: 'SUP-KHA-005',
      companyName: 'Comilla Khadi Handloom Cooperative',
      contactPerson: 'Prabir Devnath',
      email: 'comillakhadi@handloom.org.bd',
      phone: '+8801512348901',
      address: 'Chowdhury Bazar, Mainamoti',
      district: 'Comilla',
      categoriesSupplied: ['Traditional Clothing', 'Handloom Fabric'],
      paymentTerms: 'ADVANCE',
      status: 'ACTIVE',
      totalPurchased: 140000,
      totalPaid: 140000,
      totalDue: 0,
      portalAccess: {
        enabled: false,
        loginEmail: 'supplier.khadi@kisholoy.com',
        loginIsolated: true
      },
      notes: 'Hand-spun and hand-woven Khadi cotton fabric for traditional panjabis and kurtas.',
      createdAt: '2026-02-01T14:00:00.000Z',
      updatedAt: '2026-02-24T10:00:00.000Z'
    };

    this.suppliers.set(sup1.id, sup1);
    this.suppliers.set(sup2.id, sup2);
    this.suppliers.set(sup3.id, sup3);
    this.suppliers.set(sup4.id, sup4);
    this.suppliers.set(sup5.id, sup5);

    // Initialize historical Purchase Orders
    const po1: SupplierPurchaseOrder = {
      id: 'po-001',
      poNumber: 'PO-2026-001',
      supplierId: sup1.id,
      supplierName: sup1.companyName,
      orderDate: '2026-01-10T10:00:00.000Z',
      expectedDeliveryDate: '2026-01-25T18:00:00.000Z',
      items: [
        {
          productId: 'prod-1',
          productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)',
          sku: 'KSH-JAM-001',
          quantity: 50,
          unitCost: 3500,
          subtotal: 175000
        }
      ],
      totalAmount: 175000,
      paidAmount: 175000,
      dueAmount: 0,
      paymentStatus: 'PAID',
      deliveryStatus: 'RECEIVED',
      receivedAt: '2026-01-24T15:30:00.000Z',
      receivedByWarehouseId: 'wh-dhk-01',
      warehouseName: 'Dhaka Central Hub',
      notes: 'First batch of Eid Jamdani sarees. Quality certified.',
      createdById: 'adm-003',
      createdByName: 'Tanvir Ahmed (Inventory Lead)',
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-01-24T16:00:00.000Z'
    };

    const po2: SupplierPurchaseOrder = {
      id: 'po-002',
      poNumber: 'PO-2026-002',
      supplierId: sup1.id,
      supplierName: sup1.companyName,
      orderDate: '2026-02-15T11:30:00.000Z',
      expectedDeliveryDate: '2026-03-05T18:00:00.000Z',
      items: [
        {
          productId: 'prod-1',
          productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)',
          sku: 'KSH-JAM-001',
          quantity: 75,
          unitCost: 3666.66,
          subtotal: 275000
        }
      ],
      totalAmount: 275000,
      paidAmount: 200000,
      dueAmount: 75000,
      paymentStatus: 'PARTIAL',
      deliveryStatus: 'RECEIVED',
      receivedAt: '2026-02-28T14:00:00.000Z',
      receivedByWarehouseId: 'wh-dhk-01',
      warehouseName: 'Dhaka Central Hub',
      notes: 'Second batch replenishment for spring season.',
      createdById: 'adm-003',
      createdByName: 'Tanvir Ahmed (Inventory Lead)',
      createdAt: '2026-02-15T11:30:00.000Z',
      updatedAt: '2026-02-28T14:30:00.000Z'
    };

    const po3: SupplierPurchaseOrder = {
      id: 'po-003',
      poNumber: 'PO-2026-003',
      supplierId: sup3.id,
      supplierName: sup3.companyName,
      orderDate: '2026-02-10T09:00:00.000Z',
      expectedDeliveryDate: '2026-02-22T17:00:00.000Z',
      items: [
        {
          productId: 'prod-3',
          productTitle: 'Organic Sreemangal Single-Estate Green Tea (250g)',
          sku: 'KSH-TEA-003',
          quantity: 400,
          unitCost: 450,
          subtotal: 180000
        }
      ],
      totalAmount: 180000,
      paidAmount: 100000,
      dueAmount: 80000,
      paymentStatus: 'PARTIAL',
      deliveryStatus: 'RECEIVED',
      receivedAt: '2026-02-20T12:00:00.000Z',
      receivedByWarehouseId: 'wh-dhk-01',
      warehouseName: 'Dhaka Central Hub',
      notes: 'Fresh flush harvest organic green tea packaging.',
      createdById: 'adm-003',
      createdByName: 'Tanvir Ahmed (Inventory Lead)',
      createdAt: '2026-02-10T09:00:00.000Z',
      updatedAt: '2026-02-20T13:00:00.000Z'
    };

    const po4: SupplierPurchaseOrder = {
      id: 'po-004',
      poNumber: 'PO-2026-004',
      supplierId: sup4.id,
      supplierName: sup4.companyName,
      orderDate: '2026-02-12T14:00:00.000Z',
      expectedDeliveryDate: '2026-02-26T17:00:00.000Z',
      items: [
        {
          productId: 'prod-4',
          productTitle: 'Hand-stitched Full Grain Leather Bi-Fold Wallet',
          sku: 'KSH-LEA-004',
          quantity: 200,
          unitCost: 1100,
          subtotal: 220000
        }
      ],
      totalAmount: 220000,
      paidAmount: 160000,
      dueAmount: 60000,
      paymentStatus: 'PARTIAL',
      deliveryStatus: 'RECEIVED',
      receivedAt: '2026-02-25T16:30:00.000Z',
      receivedByWarehouseId: 'wh-dhk-01',
      warehouseName: 'Dhaka Central Hub',
      notes: 'Full-grain pull-up leather bi-fold wallets.',
      createdById: 'adm-003',
      createdByName: 'Tanvir Ahmed (Inventory Lead)',
      createdAt: '2026-02-12T14:00:00.000Z',
      updatedAt: '2026-02-25T17:00:00.000Z'
    };

    this.purchaseOrders.set(po1.id, po1);
    this.purchaseOrders.set(po2.id, po2);
    this.purchaseOrders.set(po3.id, po3);
    this.purchaseOrders.set(po4.id, po4);

    // Historical Payments
    const pay1: SupplierPayment = {
      id: 'pay-001',
      supplierId: sup1.id,
      purchaseOrderId: po1.id,
      amount: 175000,
      paymentDate: '2026-01-26T11:00:00.000Z',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'IBBL-FT-991204812',
      notes: 'Full clearance payment for PO-2026-001',
      recordedBy: 'Farhana Yasmin (Accounts)',
      createdAt: '2026-01-26T11:00:00.000Z'
    };

    const pay2: SupplierPayment = {
      id: 'pay-002',
      supplierId: sup1.id,
      purchaseOrderId: po2.id,
      amount: 200000,
      paymentDate: '2026-02-28T16:00:00.000Z',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'IBBL-FT-994812399',
      notes: 'Part payment for PO-2026-002. ৳75,000 due on Net 15 terms.',
      recordedBy: 'Farhana Yasmin (Accounts)',
      createdAt: '2026-02-28T16:00:00.000Z'
    };

    const pay3: SupplierPayment = {
      id: 'pay-003',
      supplierId: sup3.id,
      purchaseOrderId: po3.id,
      amount: 100000,
      paymentDate: '2026-02-22T15:30:00.000Z',
      paymentMethod: 'CHEQUE',
      referenceNumber: 'CHQ-BRAC-008129',
      notes: 'Advance cheque clearance for tea procurement.',
      recordedBy: 'Farhana Yasmin (Accounts)',
      createdAt: '2026-02-22T15:30:00.000Z'
    };

    const pay4: SupplierPayment = {
      id: 'pay-004',
      supplierId: sup4.id,
      purchaseOrderId: po4.id,
      amount: 160000,
      paymentDate: '2026-02-27T10:15:00.000Z',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'CITY-NPSB-441029',
      notes: 'Partial payment against delivered leather wallets.',
      recordedBy: 'Farhana Yasmin (Accounts)',
      createdAt: '2026-02-27T10:15:00.000Z'
    };

    this.payments.set(pay1.id, pay1);
    this.payments.set(pay2.id, pay2);
    this.payments.set(pay3.id, pay3);
    this.payments.set(pay4.id, pay4);

    // Seed Initial Supplier Interactions (Calls, Emails, Contract Discussions)
    const int1: SupplierInteraction = {
      id: 'int-001',
      supplierId: sup1.id,
      type: 'CONTRACT_DISCUSSION',
      subject: 'Pohela Boishakh Exclusive Jamdani Sourcing Agreement',
      contactPerson: 'Master Weaver Alimuddin Mia',
      direction: 'OUTBOUND',
      date: '2026-02-15T10:30:00.000Z',
      notes: 'Finalized contract terms for 50 fine Dhakai Jamdani sarees (84-count). Agreed on NET_15 terms with 20% advance bank transfer upon loom setup and artisan inspection at Rupganj village.',
      followUpDate: '2026-03-10T10:00:00.000Z',
      outcome: 'AGREED',
      loggedBy: 'Tanvir Ahmed (Procurement Lead)',
      createdAt: '2026-02-15T11:00:00.000Z',
      updatedAt: '2026-02-15T11:00:00.000Z'
    };

    const int2: SupplierInteraction = {
      id: 'int-002',
      supplierId: sup1.id,
      type: 'CALL',
      subject: 'Loom capacity verification & seasonal weaver scheduling',
      contactPerson: 'Master Weaver Alimuddin Mia',
      direction: 'OUTBOUND',
      date: '2026-02-20T14:15:00.000Z',
      notes: 'Inquired about additional master artisan capacity for the festival rush. Alimuddin confirmed 6 extra traditional handlooms active and ready for fast fulfillment.',
      outcome: 'COMPLETED',
      loggedBy: 'Farhana Yasmin (Supply Chain)',
      createdAt: '2026-02-20T14:30:00.000Z',
      updatedAt: '2026-02-20T14:30:00.000Z'
    };

    const int3: SupplierInteraction = {
      id: 'int-003',
      supplierId: sup1.id,
      type: 'EMAIL',
      subject: 'Natural vegetable dye shade swatches approval for Indigo & Maroon',
      contactPerson: 'alimuddin@jamdanisonargaon.bd',
      direction: 'INBOUND',
      date: '2026-02-24T09:00:00.000Z',
      notes: 'Guild emailed high-res photo swatches and courier tracking for physical vegetable indigo and maroon thread samples.',
      outcome: 'COMPLETED',
      loggedBy: 'Sadia Rahman (Design Team)',
      createdAt: '2026-02-24T09:30:00.000Z',
      updatedAt: '2026-02-24T09:30:00.000Z'
    };

    const int4: SupplierInteraction = {
      id: 'int-004',
      supplierId: sup2.id,
      type: 'CALL',
      subject: 'Terracotta packaging & transit cushioning improvement',
      contactPerson: 'Bikash Chandra Paul',
      direction: 'INBOUND',
      date: '2026-02-18T11:45:00.000Z',
      notes: 'Bikash phoned to propose upgraded double-corrugated boxing with molded straw cushions for fragile terracotta planters to eliminate damage during courier transit.',
      outcome: 'AGREED',
      loggedBy: 'Tanvir Ahmed (Procurement Lead)',
      createdAt: '2026-02-18T12:00:00.000Z',
      updatedAt: '2026-02-18T12:00:00.000Z'
    };

    const int5: SupplierInteraction = {
      id: 'int-005',
      supplierId: sup2.id,
      type: 'CONTRACT_DISCUSSION',
      subject: '2026 Annual Clay & Terracotta Supply MOU Renewal',
      contactPerson: 'Bikash Chandra Paul',
      direction: 'OUTBOUND',
      date: '2026-02-26T15:00:00.000Z',
      notes: 'Conducted annual review of artisanal pottery supply. Negotiated bulk unit pricing and guaranteed minimum quarterly orders for 2026.',
      followUpDate: '2026-05-15T00:00:00.000Z',
      outcome: 'AGREED',
      loggedBy: 'Tanvir Ahmed (Procurement Lead)',
      createdAt: '2026-02-26T15:45:00.000Z',
      updatedAt: '2026-02-26T15:45:00.000Z'
    };

    const int6: SupplierInteraction = {
      id: 'int-006',
      supplierId: sup3.id,
      type: 'EMAIL',
      subject: 'First Flush 2026 laboratory organic certification',
      contactPerson: 'procurement@sreemangalteaco.bd',
      direction: 'INBOUND',
      date: '2026-02-21T08:30:00.000Z',
      notes: 'Received laboratory test certificate confirming zero chemical pesticide residue and premium polyphenol levels for the Sreemangal Orthodox Black Tea harvest.',
      outcome: 'COMPLETED',
      loggedBy: 'Farhana Yasmin (Accounts & QA)',
      createdAt: '2026-02-21T09:10:00.000Z',
      updatedAt: '2026-02-21T09:10:00.000Z'
    };

    const int7: SupplierInteraction = {
      id: 'int-007',
      supplierId: sup4.id,
      type: 'CALL',
      subject: 'Leather wallet brass zipper hardware specification check',
      contactPerson: 'Shahadat Hossain',
      direction: 'OUTBOUND',
      date: '2026-02-27T16:20:00.000Z',
      notes: 'Discussed minor stitching tolerance and antique brass zipper specification for top-grain bifold wallets. Vendor agreed to implement on current production batch.',
      followUpDate: '2026-03-06T14:00:00.000Z',
      outcome: 'FOLLOW_UP_REQUIRED',
      loggedBy: 'Tanvir Ahmed (Procurement Lead)',
      createdAt: '2026-02-27T16:40:00.000Z',
      updatedAt: '2026-02-27T16:40:00.000Z'
    };

    this.interactions.set(int1.id, int1);
    this.interactions.set(int2.id, int2);
    this.interactions.set(int3.id, int3);
    this.interactions.set(int4.id, int4);
    this.interactions.set(int5.id, int5);
    this.interactions.set(int6.id, int6);
    this.interactions.set(int7.id, int7);
  }

  // =============================================================
  // Supplier Queries & Financial Recalculation
  // =============================================================

  public getAllSuppliers(): Supplier[] {
    return Array.from(this.suppliers.values()).map(s => {
      const pos = Array.from(this.purchaseOrders.values()).filter(p => p.supplierId === s.id);
      const payments = Array.from(this.payments.values()).filter(p => p.supplierId === s.id);
      const interactions = Array.from(this.interactions.values()).filter(i => i.supplierId === s.id);
      return {
        ...s,
        purchaseOrdersCount: pos.length,
        paymentsCount: payments.length,
        interactionsCount: interactions.length
      };
    });
  }

  public getInteractionsBySupplierId(supplierId: string): SupplierInteraction[] {
    return Array.from(this.interactions.values())
      .filter(i => i.supplierId === supplierId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getSupplierById(id: string): { 
    supplier: Supplier; 
    purchaseOrders: SupplierPurchaseOrder[]; 
    payments: SupplierPayment[];
    interactions: SupplierInteraction[];
  } | null {
    const supplier = this.suppliers.get(id);
    if (!supplier) return null;

    const purchaseOrders = Array.from(this.purchaseOrders.values())
      .filter(p => p.supplierId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const payments = Array.from(this.payments.values())
      .filter(p => p.supplierId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const interactions = this.getInteractionsBySupplierId(id);

    return {
      supplier: {
        ...supplier,
        purchaseOrdersCount: purchaseOrders.length,
        paymentsCount: payments.length,
        interactionsCount: interactions.length
      },
      purchaseOrders,
      payments,
      interactions
    };
  }

  public getOverviewMetrics(): SupplierOverviewMetrics {
    const allSuppliers = Array.from(this.suppliers.values());
    const allPOs = Array.from(this.purchaseOrders.values());
    const allPayments = Array.from(this.payments.values());

    const totalSuppliers = allSuppliers.length;
    const activeSuppliers = allSuppliers.filter(s => s.status === 'ACTIVE').length;
    const totalSourcedBdt = allSuppliers.reduce((sum, s) => sum + s.totalPurchased, 0);
    const totalPaidBdt = allSuppliers.reduce((sum, s) => sum + s.totalPaid, 0);
    const totalOutstandingDueBdt = Math.max(0, totalSourcedBdt - totalPaidBdt);
    const pendingDeliveriesCount = allPOs.filter(po => po.deliveryStatus === 'PENDING' || po.deliveryStatus === 'PARTIALLY_RECEIVED').length;

    return {
      totalSuppliers,
      activeSuppliers,
      totalSourcedBdt,
      totalPaidBdt,
      totalOutstandingDueBdt,
      pendingDeliveriesCount
    };
  }

  // =============================================================
  // Supplier Mutations (Server-authoritative)
  // =============================================================

  public createSupplier(data: Partial<Supplier>, operator: string): Supplier {
    const count = this.suppliers.size + 1;
    const code = data.code || `SUP-${String(count).padStart(3, '0')}`;
    const id = `sup-${Date.now()}`;

    const newSupplier: Supplier = {
      id,
      code,
      companyName: (data.companyName || '').trim(),
      contactPerson: (data.contactPerson || '').trim(),
      email: (data.email || '').trim().toLowerCase(),
      phone: (data.phone || '').trim(),
      secondaryPhone: data.secondaryPhone?.trim(),
      address: (data.address || '').trim(),
      district: data.district?.trim() || 'Dhaka',
      categoriesSupplied: Array.isArray(data.categoriesSupplied) ? data.categoriesSupplied : ['General Merchandise'],
      tradeLicenseNumber: data.tradeLicenseNumber?.trim(),
      tinNumber: data.tinNumber?.trim(),
      vatRegistrationNumber: data.vatRegistrationNumber?.trim(),
      bankDetails: data.bankDetails,
      mfsDetails: data.mfsDetails,
      paymentTerms: data.paymentTerms || 'NET_15',
      status: data.status || 'ACTIVE',
      totalPurchased: 0,
      totalPaid: 0,
      totalDue: 0,
      portalAccess: {
        enabled: false,
        loginEmail: data.email?.trim().toLowerCase(),
        loginIsolated: true
      },
      notes: data.notes?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.suppliers.set(id, newSupplier);

    securityEngine.logAudit({
      operator,
      role: 'INVENTORY_MANAGER',
      action: 'SUPPLIER_CREATED',
      resource: 'SupplierLedger',
      resourceId: id,
      severity: 'INFO',
      category: 'INVENTORY',
      details: `Registered new supplier: ${newSupplier.companyName} (${newSupplier.code}) from ${newSupplier.district}. Terms: ${newSupplier.paymentTerms}.`
    });

    return newSupplier;
  }

  public bulkImportSuppliers(
    items: any[],
    operator: string
  ): {
    imported: Supplier[];
    errors: { row: number; companyName?: string; error: string }[];
    total: number;
    successCount: number;
  } {
    const imported: Supplier[] = [];
    const errors: { row: number; companyName?: string; error: string }[] = [];

    if (!Array.isArray(items) || items.length === 0) {
      return { imported: [], errors: [{ row: 0, error: 'No supplier records provided in import payload.' }], total: 0, successCount: 0 };
    }

    items.forEach((item, index) => {
      const rowNumber = index + 1;
      const companyName = (item.companyName || item['Company Name'] || item['company_name'] || item['Company'] || '').toString().trim();
      const contactPerson = (item.contactPerson || item['Contact Person'] || item['contact_person'] || item['Contact'] || '').toString().trim();
      const phone = (item.phone || item['Phone'] || item['phone_number'] || item['Mobile'] || '').toString().trim();
      const email = (item.email || item['Email'] || item['email_address'] || '').toString().trim().toLowerCase();

      if (!companyName) {
        errors.push({ row: rowNumber, companyName: companyName || 'Unnamed Row', error: 'Company Name is required.' });
        return;
      }
      if (!phone) {
        errors.push({ row: rowNumber, companyName, error: 'Phone number is required.' });
        return;
      }

      // Check if phone or company name duplicate exists in current memory
      const existing = Array.from(this.suppliers.values()).find(
        s => s.companyName.toLowerCase() === companyName.toLowerCase() || (phone && s.phone === phone)
      );
      if (existing) {
        errors.push({ row: rowNumber, companyName, error: `Duplicate detected with existing supplier "${existing.companyName}" (${existing.code}).` });
        return;
      }

      // Check if duplicate in current batch
      const alreadyInBatch = imported.find(
        s => s.companyName.toLowerCase() === companyName.toLowerCase() || s.phone === phone
      );
      if (alreadyInBatch) {
        errors.push({ row: rowNumber, companyName, error: `Duplicate entry within this batch with company name or phone.` });
        return;
      }

      // Parse categories
      let categories: string[] = ['General Merchandise'];
      const rawCat = item.categoriesSupplied || item['Categories'] || item['categories'] || item['categories_supplied'];
      if (Array.isArray(rawCat)) {
        categories = rawCat.map(c => String(c).trim()).filter(Boolean);
      } else if (typeof rawCat === 'string' && rawCat.trim()) {
        categories = rawCat.split(/[,;|]/).map(c => c.trim()).filter(Boolean);
      }

      // Parse payment terms
      let paymentTerms: any = (item.paymentTerms || item['Payment Terms'] || item['payment_terms'] || 'NET_15').toString().trim().toUpperCase();
      if (!['ADVANCE', 'NET_15', 'NET_30', 'COD', 'CONSIGNMENT'].includes(paymentTerms)) {
        paymentTerms = 'NET_15';
      }

      // Bank & MFS details parsing
      let bankDetails = undefined;
      const bankName = item.bankDetails?.bankName || item['Bank Name'] || item['bank_name'];
      const accountNumber = item.bankDetails?.accountNumber || item['Bank Account Number'] || item['bank_account_number'];
      if (bankName && accountNumber) {
        bankDetails = {
          bankName: String(bankName).trim(),
          accountName: String(item.bankDetails?.accountName || item['Bank Account Name'] || companyName).trim(),
          accountNumber: String(accountNumber).trim(),
          branchName: String(item.bankDetails?.branchName || item['Bank Branch'] || 'Main Branch').trim(),
          routingNumber: item.bankDetails?.routingNumber || item['Routing Number'] ? String(item.bankDetails?.routingNumber || item['Routing Number']).trim() : undefined
        };
      }

      let mfsDetails = undefined;
      const mfsProvider = (item.mfsDetails?.provider || item['MFS Provider'] || item['mfs_provider'] || '').toString().trim().toUpperCase();
      const mfsAccount = (item.mfsDetails?.accountNumber || item['MFS Account Number'] || item['mfs_account'] || '').toString().trim();
      if (mfsAccount && (mfsProvider === 'BKASH' || mfsProvider === 'NAGAD')) {
        mfsDetails = {
          provider: mfsProvider as 'BKASH' | 'NAGAD',
          accountType: ((item.mfsDetails?.accountType || item['MFS Type'] || 'MERCHANT').toString().toUpperCase() === 'PERSONAL' ? 'PERSONAL' : 'MERCHANT') as 'MERCHANT' | 'PERSONAL',
          accountNumber: mfsAccount
        };
      }

      const count = this.suppliers.size + 1;
      const code = item.code || `SUP-${String(count).padStart(3, '0')}`;
      const id = `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newSupplier: Supplier = {
        id,
        code,
        companyName,
        contactPerson: contactPerson || 'Authorized Representative',
        email: email || `supplier.${count}@kisholoy-vendor.bd`,
        phone,
        secondaryPhone: item.secondaryPhone || item['Secondary Phone'] || item['secondary_phone'] || undefined,
        address: (item.address || item['Address'] || 'Bangladesh').toString().trim(),
        district: (item.district || item['District'] || 'Dhaka').toString().trim(),
        categoriesSupplied: categories.length > 0 ? categories : ['General Merchandise'],
        tradeLicenseNumber: item.tradeLicenseNumber || item['Trade License'] || item['trade_license'] || undefined,
        tinNumber: item.tinNumber || item['TIN'] || item['tin_number'] || undefined,
        vatRegistrationNumber: item.vatRegistrationNumber || item['BIN / VAT'] || item['vat_registration_number'] || undefined,
        bankDetails,
        mfsDetails,
        paymentTerms,
        status: (item.status === 'INACTIVE' || item.status === 'SUSPENDED') ? item.status : 'ACTIVE',
        totalPurchased: 0,
        totalPaid: 0,
        totalDue: 0,
        portalAccess: {
          enabled: false,
          loginEmail: email || `supplier.${count}@kisholoy-vendor.bd`,
          loginIsolated: true
        },
        notes: item.notes || item['Notes'] || item['notes'] || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.suppliers.set(id, newSupplier);
      imported.push(newSupplier);
    });

    if (imported.length > 0) {
      securityEngine.logAudit({
        operator,
        role: 'INVENTORY_MANAGER',
        action: 'SUPPLIER_CREATED',
        resource: 'SupplierLedger',
        resourceId: `bulk-import-${Date.now()}`,
        severity: 'INFO',
        category: 'INVENTORY',
        details: `Bulk imported ${imported.length} suppliers into database with ${errors.length} skipped/errors.`
      });
    }

    return {
      imported,
      errors,
      total: items.length,
      successCount: imported.length
    };
  }

  public updateSupplier(id: string, data: Partial<Supplier>, operator: string): Supplier | null {
    const existing = this.suppliers.get(id);
    if (!existing) return null;

    const updated: Supplier = {
      ...existing,
      ...data,
      id: existing.id,
      code: existing.code,
      // Protect financial balances from manual overriding:
      totalPurchased: existing.totalPurchased,
      totalPaid: existing.totalPaid,
      totalDue: existing.totalDue,
      updatedAt: new Date().toISOString()
    };

    this.suppliers.set(id, updated);

    securityEngine.logAudit({
      operator,
      role: 'INVENTORY_MANAGER',
      action: 'SUPPLIER_UPDATED',
      resource: 'SupplierLedger',
      resourceId: id,
      severity: 'INFO',
      category: 'INVENTORY',
      details: `Updated supplier profile: ${updated.companyName} (${updated.code}). Status: ${updated.status}.`
    });

    return updated;
  }

  public createPurchaseOrder(poData: {
    supplierId: string;
    expectedDeliveryDate?: string;
    items: { productId?: string; productTitle: string; sku: string; quantity: number; unitCost: number }[];
    warehouseId?: string;
    notes?: string;
  }, operatorUser: { id: string; name: string }): { success: boolean; po?: SupplierPurchaseOrder; error?: string } {
    const supplier = this.suppliers.get(poData.supplierId);
    if (!supplier) return { success: false, error: 'Supplier not found' };

    if (!poData.items || poData.items.length === 0) {
      return { success: false, error: 'At least one purchase line item is required' };
    }

    // Recalculate financial amounts server-side
    let calculatedTotal = 0;
    const validatedItems = poData.items.map(item => {
      const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
      const cost = Math.max(0, Math.round(Number(item.unitCost) || 0));
      const subtotal = qty * cost;
      calculatedTotal += subtotal;
      return {
        productId: item.productId,
        productTitle: (item.productTitle || 'Custom Sourced Goods').trim(),
        sku: (item.sku || 'SKU-GEN').trim().toUpperCase(),
        quantity: qty,
        unitCost: cost,
        subtotal
      };
    });

    const poCount = this.purchaseOrders.size + 1;
    const poNumber = `PO-2026-${String(poCount).padStart(3, '0')}`;
    const id = `po-${Date.now()}`;

    const newPO: SupplierPurchaseOrder = {
      id,
      poNumber,
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: poData.expectedDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      items: validatedItems,
      totalAmount: calculatedTotal,
      paidAmount: 0,
      dueAmount: calculatedTotal,
      paymentStatus: 'DUE',
      deliveryStatus: 'PENDING',
      receivedByWarehouseId: poData.warehouseId || 'wh-dhk-01',
      warehouseName: 'Dhaka Central Hub',
      notes: poData.notes?.trim(),
      createdById: operatorUser.id,
      createdByName: operatorUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.purchaseOrders.set(id, newPO);

    // Recalculate supplier financial totals
    this.recalculateSupplierLedger(supplier.id);

    securityEngine.logAudit({
      operator: operatorUser.name,
      role: 'INVENTORY_MANAGER',
      action: 'PURCHASE_ORDER_ISSUED',
      resource: 'PurchaseOrder',
      resourceId: id,
      severity: 'INFO',
      category: 'INVENTORY',
      details: `Issued ${poNumber} to ${supplier.companyName} for ৳${calculatedTotal.toLocaleString('en-BD')} (${validatedItems.length} items).`
    });

    return { success: true, po: newPO };
  }

  public recordSupplierPayment(payData: {
    supplierId: string;
    purchaseOrderId?: string;
    amount: number;
    paymentMethod: SupplierPayment['paymentMethod'];
    referenceNumber: string;
    notes?: string;
  }, operator: string): { success: boolean; payment?: SupplierPayment; error?: string } {
    const supplier = this.suppliers.get(payData.supplierId);
    if (!supplier) return { success: false, error: 'Supplier not found' };

    const amount = Math.max(0, Math.round(Number(payData.amount) || 0));
    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than zero' };

    if (!payData.referenceNumber?.trim()) {
      return { success: false, error: 'Transaction reference or cheque number is required for audit trails' };
    }

    const id = `pay-${Date.now()}`;
    const payment: SupplierPayment = {
      id,
      supplierId: supplier.id,
      purchaseOrderId: payData.purchaseOrderId,
      amount,
      paymentDate: new Date().toISOString(),
      paymentMethod: payData.paymentMethod || 'BANK_TRANSFER',
      referenceNumber: payData.referenceNumber.trim(),
      notes: payData.notes?.trim(),
      recordedBy: operator,
      createdAt: new Date().toISOString()
    };

    this.payments.set(id, payment);

    // If linked to a specific PO, update PO paid amount
    if (payData.purchaseOrderId) {
      const po = this.purchaseOrders.get(payData.purchaseOrderId);
      if (po) {
        po.paidAmount = Math.min(po.totalAmount, po.paidAmount + amount);
        po.dueAmount = Math.max(0, po.totalAmount - po.paidAmount);
        po.paymentStatus = po.dueAmount === 0 ? 'PAID' : 'PARTIAL';
        po.updatedAt = new Date().toISOString();
        this.purchaseOrders.set(po.id, po);
      }
    }

    // Recalculate supplier totals
    this.recalculateSupplierLedger(supplier.id);

    securityEngine.logAudit({
      operator,
      role: 'FINANCE',
      action: 'SUPPLIER_PAYMENT_DISBURSED',
      resource: 'SupplierPayment',
      resourceId: id,
      severity: 'INFO',
      category: 'FINANCIAL',
      details: `Disbursed ৳${amount.toLocaleString('en-BD')} to ${supplier.companyName} via ${payment.paymentMethod} (Ref: ${payment.referenceNumber}).`
    });

    return { success: true, payment };
  }

  public updateDeliveryStatus(poId: string, status: SupplierPurchaseOrder['deliveryStatus'], operator: string): boolean {
    const po = this.purchaseOrders.get(poId);
    if (!po) return false;

    po.deliveryStatus = status;
    po.updatedAt = new Date().toISOString();
    if (status === 'RECEIVED') {
      po.receivedAt = new Date().toISOString();

      // Automatically increment stock in active product catalog if matched
      for (const item of po.items) {
        if (item.productId) {
          const product = serverDb.products.find(p => p.id === item.productId);
          if (product) {
            const beforeStock = product.stock;
            product.stock += item.quantity;
            serverDb.inventoryTransactions.push({
              id: `tx-sup-${Date.now()}-${item.productId}`,
              timestamp: new Date().toISOString(),
              productId: item.productId,
              productTitle: item.productTitle,
              sku: product.sku || item.productId,
              type: 'STOCK_IN',
              quantityChange: item.quantity,
              quantityBefore: beforeStock,
              quantityAfter: product.stock,
              reason: `Supplier PO Delivery Received from ${po.supplierName}`,
              operator,
              supplier: po.supplierName,
              unitCost: item.unitCost,
              warehouseLocation: po.receivedByWarehouseId || 'Central Hub'
            });
          }
        }
      }
    }

    this.purchaseOrders.set(poId, po);

    securityEngine.logAudit({
      operator,
      role: 'INVENTORY_MANAGER',
      action: 'PURCHASE_ORDER_DELIVERY_STATUS',
      resource: 'PurchaseOrder',
      resourceId: poId,
      severity: 'INFO',
      category: 'INVENTORY',
      details: `Updated delivery status of ${po.poNumber} to ${status}.`
    });

    return true;
  }

  public togglePortalAccess(supplierId: string, enabled: boolean, operator: string): { success: boolean; supplier?: Supplier; error?: string } {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) return { success: false, error: 'Supplier not found' };

    supplier.portalAccess = {
      ...supplier.portalAccess,
      enabled,
      loginIsolated: true
    };
    supplier.updatedAt = new Date().toISOString();
    this.suppliers.set(supplierId, supplier);

    securityEngine.logAudit({
      operator,
      role: 'SUPER_ADMIN',
      action: 'SUPPLIER_PORTAL_FLAG_TOGGLED',
      resource: 'SupplierPortal',
      resourceId: supplierId,
      severity: 'WARNING',
      category: 'RBAC',
      details: `Toggled isolated supplier portal access for ${supplier.companyName}: ${enabled ? 'ENABLED' : 'DISABLED'}.`
    });

    return { success: true, supplier };
  }

  // Feature-flagged Isolated Supplier Portal Auth
  public authenticateSupplierPortal(email: string, pass: string, clientIp: string): { 
    success: boolean; 
    token?: string; 
    supplier?: Partial<Supplier>; 
    error?: string 
  } {
    const supplier = Array.from(this.suppliers.values()).find(
      s => s.portalAccess?.loginEmail?.toLowerCase() === email.toLowerCase().trim()
    );

    if (!supplier) {
      return { success: false, error: 'Invalid supplier credentials.' };
    }

    if (!supplier.portalAccess.enabled) {
      return { 
        success: false, 
        error: 'Supplier portal access is currently disabled for this organization. Contact Kisholoy administration.' 
      };
    }

    // Verify status
    if (supplier.status !== 'ACTIVE') {
      return { success: false, error: 'Supplier account is inactive or suspended.' };
    }

    // Isolated token generated for supplier self-service only
    const token = `ksh-sup-token-${supplier.id}-${Date.now()}`;
    supplier.portalAccess.lastLoginAt = new Date().toISOString();
    this.suppliers.set(supplier.id, supplier);

    securityEngine.logAudit({
      operator: supplier.contactPerson,
      role: 'MERCHANT',
      action: 'SUPPLIER_PORTAL_LOGIN',
      resource: 'SupplierPortal',
      resourceId: supplier.id,
      severity: 'INFO',
      category: 'AUTH',
      details: `Supplier ${supplier.companyName} logged into isolated self-service portal from IP ${clientIp}.`
    });

    const { bankDetails, mfsDetails, tradeLicenseNumber, tinNumber, ...safeProfile } = supplier;

    return {
      success: true,
      token,
      supplier: safeProfile
    };
  }

  private recalculateSupplierLedger(supplierId: string) {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) return;

    const supplierPOs = Array.from(this.purchaseOrders.values()).filter(p => p.supplierId === supplierId);
    const supplierPayments = Array.from(this.payments.values()).filter(p => p.supplierId === supplierId);

    const totalPurchased = supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0);
    const totalPaid = supplierPayments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalDue = Math.max(0, totalPurchased - totalPaid);

    supplier.totalPurchased = totalPurchased;
    supplier.totalPaid = totalPaid;
    supplier.totalDue = totalDue;
    supplier.updatedAt = new Date().toISOString();

    this.suppliers.set(supplierId, supplier);
  }
}

export const supplierEngine = new SupplierEngine();
