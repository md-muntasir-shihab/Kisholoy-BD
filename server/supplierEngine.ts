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
  SupplierInteractionOutcome,
  SourcedProductSummary,
  SupplierLedgerEntry,
  SupplierFinancialSummary,
  SupplierMonthlyFinancialTrend,
  SupplierAgreement,
  SupplyBatch,
  SupplierEligibleSale,
  SupplierSettlement,
  SupplierSettlementMethod,
  SupplierCalculationBasis
} from '../src/types';
import { securityEngine } from './securityEngine';
import { issueSessionToken } from './sessionTokens';
import { serverDb } from './db';

class SupplierEngine {
  private suppliers: Map<string, Supplier> = new Map();
  private purchaseOrders: Map<string, SupplierPurchaseOrder> = new Map();
  private payments: Map<string, SupplierPayment> = new Map();
  private interactions: Map<string, SupplierInteraction> = new Map();
  private agreements: Map<string, SupplierAgreement> = new Map();
  private supplyBatches: Map<string, SupplyBatch> = new Map();
  private eligibleSales: Map<string, SupplierEligibleSale> = new Map();
  private settlements: Map<string, SupplierSettlement> = new Map();

  constructor() {
    this.initializeSuppliers();
    this.initializeAgreementsAndBatches();
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
        enabled: true, // Feature-flagged: enabled for registered suppliers
        loginEmail: 'supplier.jamdani@kisholoy.com',
        loginIsolated: true,
        password: 'kisholoy2026'
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
        enabled: true,
        loginEmail: 'supplier.claycraft@kisholoy.com',
        loginIsolated: true,
        password: 'kisholoy2026'
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
        enabled: true,
        loginEmail: 'supplier.tea@kisholoy.com',
        loginIsolated: true,
        password: 'kisholoy2026'
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
        enabled: true,
        loginEmail: 'supplier.leather@kisholoy.com',
        loginIsolated: true,
        password: 'kisholoy2026'
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
        enabled: true,
        loginEmail: 'supplier.khadi@kisholoy.com',
        loginIsolated: true,
        password: 'kisholoy2026'
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

    const po5: SupplierPurchaseOrder = {
      id: 'po-005',
      poNumber: 'PO-2026-005',
      supplierId: sup2.id,
      supplierName: sup2.companyName,
      orderDate: '2026-01-20T10:00:00.000Z',
      expectedDeliveryDate: '2026-02-05T18:00:00.000Z',
      items: [
        {
          productId: 'prod-2',
          productTitle: 'Natural Terracotta Flora Vase (Hand-carved)',
          sku: 'KSH-TER-002',
          quantity: 250,
          unitCost: 740,
          subtotal: 185000
        }
      ],
      totalAmount: 185000,
      paidAmount: 185000,
      dueAmount: 0,
      paymentStatus: 'PAID',
      deliveryStatus: 'RECEIVED',
      receivedAt: '2026-02-04T14:30:00.000Z',
      receivedByWarehouseId: 'wh-dhk-01',
      warehouseName: 'Dhaka Central Hub',
      notes: 'Hand-carved terracotta floral vase batch. All pieces intact.',
      createdById: 'adm-003',
      createdByName: 'Tanvir Ahmed (Inventory Lead)',
      createdAt: '2026-01-20T10:00:00.000Z',
      updatedAt: '2026-02-04T15:00:00.000Z'
    };

    const po6: SupplierPurchaseOrder = {
      id: 'po-006',
      poNumber: 'PO-2026-006',
      supplierId: sup5.id,
      supplierName: sup5.companyName,
      orderDate: '2026-02-05T11:00:00.000Z',
      expectedDeliveryDate: '2026-02-20T17:00:00.000Z',
      items: [
        {
          productId: 'prod-1',
          productTitle: 'Comilla Handloom Khadi Fabric & Kurtas',
          sku: 'KSH-KHA-005',
          quantity: 200,
          unitCost: 700,
          subtotal: 140000
        }
      ],
      totalAmount: 140000,
      paidAmount: 140000,
      dueAmount: 0,
      paymentStatus: 'PAID',
      deliveryStatus: 'RECEIVED',
      receivedAt: '2026-02-18T13:00:00.000Z',
      receivedByWarehouseId: 'wh-dhk-01',
      warehouseName: 'Dhaka Central Hub',
      notes: 'Natural hand-spun Khadi cotton bolts.',
      createdById: 'adm-003',
      createdByName: 'Tanvir Ahmed (Inventory Lead)',
      createdAt: '2026-02-05T11:00:00.000Z',
      updatedAt: '2026-02-18T14:00:00.000Z'
    };

    const po7: SupplierPurchaseOrder = {
      id: 'po-007',
      poNumber: 'PO-2026-007',
      supplierId: sup3.id,
      supplierName: sup3.companyName,
      orderDate: '2026-01-15T09:30:00.000Z',
      expectedDeliveryDate: '2026-01-28T18:00:00.000Z',
      items: [
        {
          productId: 'prod-3',
          productTitle: 'Organic Sreemangal Single-Estate Green Tea (250g)',
          sku: 'KSH-TEA-003',
          quantity: 220,
          unitCost: 500,
          subtotal: 110000
        }
      ],
      totalAmount: 110000,
      paidAmount: 110000,
      dueAmount: 0,
      paymentStatus: 'PAID',
      deliveryStatus: 'RECEIVED',
      receivedAt: '2026-01-27T16:00:00.000Z',
      receivedByWarehouseId: 'wh-dhk-01',
      warehouseName: 'Dhaka Central Hub',
      notes: 'Initial winter harvest green tea tins.',
      createdById: 'adm-003',
      createdByName: 'Tanvir Ahmed (Inventory Lead)',
      createdAt: '2026-01-15T09:30:00.000Z',
      updatedAt: '2026-01-27T17:00:00.000Z'
    };

    const po8: SupplierPurchaseOrder = {
      id: 'po-008',
      poNumber: 'PO-2026-008',
      supplierId: sup4.id,
      supplierName: sup4.companyName,
      orderDate: '2026-01-20T14:30:00.000Z',
      expectedDeliveryDate: '2026-02-02T18:00:00.000Z',
      items: [
        {
          productId: 'prod-4',
          productTitle: 'Hand-stitched Full Grain Leather Bi-Fold Wallet',
          sku: 'KSH-LEA-004',
          quantity: 90,
          unitCost: 1111.11,
          subtotal: 100000
        }
      ],
      totalAmount: 100000,
      paidAmount: 100000,
      dueAmount: 0,
      paymentStatus: 'PAID',
      deliveryStatus: 'RECEIVED',
      receivedAt: '2026-02-01T15:00:00.000Z',
      receivedByWarehouseId: 'wh-dhk-01',
      warehouseName: 'Dhaka Central Hub',
      notes: 'First test batch for premium cowhide bi-fold wallets.',
      createdById: 'adm-003',
      createdByName: 'Tanvir Ahmed (Inventory Lead)',
      createdAt: '2026-01-20T14:30:00.000Z',
      updatedAt: '2026-02-01T15:30:00.000Z'
    };

    this.purchaseOrders.set(po1.id, po1);
    this.purchaseOrders.set(po2.id, po2);
    this.purchaseOrders.set(po3.id, po3);
    this.purchaseOrders.set(po4.id, po4);
    this.purchaseOrders.set(po5.id, po5);
    this.purchaseOrders.set(po6.id, po6);
    this.purchaseOrders.set(po7.id, po7);
    this.purchaseOrders.set(po8.id, po8);

    // Multi-month historical POs for Sonargaon Jamdani (sup1) across 12 months
    const historicalPos: SupplierPurchaseOrder[] = [
      {
        id: 'po-jam-oct25',
        poNumber: 'PO-2025-101',
        supplierId: sup1.id,
        supplierName: sup1.companyName,
        orderDate: '2025-10-15T09:00:00.000Z',
        expectedDeliveryDate: '2025-10-30T18:00:00.000Z',
        items: [{ productId: 'prod-1', productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)', sku: 'KSH-JAM-001', quantity: 30, unitCost: 3500, subtotal: 105000 }],
        totalAmount: 105000,
        paidAmount: 105000,
        dueAmount: 0,
        paymentStatus: 'PAID',
        deliveryStatus: 'RECEIVED',
        receivedAt: '2025-10-29T14:00:00.000Z',
        receivedByWarehouseId: 'wh-dhk-01',
        warehouseName: 'Dhaka Central Hub',
        notes: 'Autumn Jamdani artisanal batch.',
        createdById: 'adm-003',
        createdByName: 'Tanvir Ahmed (Inventory Lead)',
        createdAt: '2025-10-15T09:00:00.000Z',
        updatedAt: '2025-10-29T15:00:00.000Z'
      },
      {
        id: 'po-jam-nov25',
        poNumber: 'PO-2025-112',
        supplierId: sup1.id,
        supplierName: sup1.companyName,
        orderDate: '2025-11-12T10:00:00.000Z',
        expectedDeliveryDate: '2025-11-28T18:00:00.000Z',
        items: [{ productId: 'prod-1', productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)', sku: 'KSH-JAM-001', quantity: 45, unitCost: 3500, subtotal: 157500 }],
        totalAmount: 157500,
        paidAmount: 157500,
        dueAmount: 0,
        paymentStatus: 'PAID',
        deliveryStatus: 'RECEIVED',
        receivedAt: '2025-11-26T15:00:00.000Z',
        receivedByWarehouseId: 'wh-dhk-01',
        warehouseName: 'Dhaka Central Hub',
        notes: 'Winter pre-wedding festive procurement.',
        createdById: 'adm-003',
        createdByName: 'Tanvir Ahmed (Inventory Lead)',
        createdAt: '2025-11-12T10:00:00.000Z',
        updatedAt: '2025-11-26T16:00:00.000Z'
      },
      {
        id: 'po-jam-dec25',
        poNumber: 'PO-2025-125',
        supplierId: sup1.id,
        supplierName: sup1.companyName,
        orderDate: '2025-12-10T11:00:00.000Z',
        expectedDeliveryDate: '2025-12-28T18:00:00.000Z',
        items: [{ productId: 'prod-1', productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)', sku: 'KSH-JAM-001', quantity: 60, unitCost: 3500, subtotal: 210000 }],
        totalAmount: 210000,
        paidAmount: 210000,
        dueAmount: 0,
        paymentStatus: 'PAID',
        deliveryStatus: 'RECEIVED',
        receivedAt: '2025-12-27T16:00:00.000Z',
        receivedByWarehouseId: 'wh-dhk-01',
        warehouseName: 'Dhaka Central Hub',
        notes: 'Year-end heritage exhibition lot.',
        createdById: 'adm-003',
        createdByName: 'Tanvir Ahmed (Inventory Lead)',
        createdAt: '2025-12-10T11:00:00.000Z',
        updatedAt: '2025-12-27T17:00:00.000Z'
      },
      {
        id: 'po-jam-mar26',
        poNumber: 'PO-2026-031',
        supplierId: sup1.id,
        supplierName: sup1.companyName,
        orderDate: '2026-03-08T10:00:00.000Z',
        expectedDeliveryDate: '2026-03-25T18:00:00.000Z',
        items: [{ productId: 'prod-1', productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)', sku: 'KSH-JAM-001', quantity: 85, unitCost: 3600, subtotal: 306000 }],
        totalAmount: 306000,
        paidAmount: 306000,
        dueAmount: 0,
        paymentStatus: 'PAID',
        deliveryStatus: 'RECEIVED',
        receivedAt: '2026-03-24T15:00:00.000Z',
        receivedByWarehouseId: 'wh-dhk-01',
        warehouseName: 'Dhaka Central Hub',
        notes: 'Pohela Boishakh surge collection.',
        createdById: 'adm-003',
        createdByName: 'Tanvir Ahmed (Inventory Lead)',
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-24T16:00:00.000Z'
      },
      {
        id: 'po-jam-apr26',
        poNumber: 'PO-2026-042',
        supplierId: sup1.id,
        supplierName: sup1.companyName,
        orderDate: '2026-04-10T11:00:00.000Z',
        expectedDeliveryDate: '2026-04-26T18:00:00.000Z',
        items: [{ productId: 'prod-1', productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)', sku: 'KSH-JAM-001', quantity: 50, unitCost: 3600, subtotal: 180000 }],
        totalAmount: 180000,
        paidAmount: 180000,
        dueAmount: 0,
        paymentStatus: 'PAID',
        deliveryStatus: 'RECEIVED',
        receivedAt: '2026-04-25T14:30:00.000Z',
        receivedByWarehouseId: 'wh-dhk-01',
        warehouseName: 'Dhaka Central Hub',
        notes: 'Post-festival regular supply batch.',
        createdById: 'adm-003',
        createdByName: 'Tanvir Ahmed (Inventory Lead)',
        createdAt: '2026-04-10T11:00:00.000Z',
        updatedAt: '2026-04-25T15:30:00.000Z'
      },
      {
        id: 'po-jam-may26',
        poNumber: 'PO-2026-053',
        supplierId: sup1.id,
        supplierName: sup1.companyName,
        orderDate: '2026-05-12T10:30:00.000Z',
        expectedDeliveryDate: '2026-05-28T18:00:00.000Z',
        items: [{ productId: 'prod-1', productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)', sku: 'KSH-JAM-001', quantity: 40, unitCost: 3600, subtotal: 144000 }],
        totalAmount: 144000,
        paidAmount: 144000,
        dueAmount: 0,
        paymentStatus: 'PAID',
        deliveryStatus: 'RECEIVED',
        receivedAt: '2026-05-27T16:00:00.000Z',
        receivedByWarehouseId: 'wh-dhk-01',
        warehouseName: 'Dhaka Central Hub',
        notes: 'Summer lightweight handloom inventory.',
        createdById: 'adm-003',
        createdByName: 'Tanvir Ahmed (Inventory Lead)',
        createdAt: '2026-05-12T10:30:00.000Z',
        updatedAt: '2026-05-27T17:00:00.000Z'
      },
      {
        id: 'po-jam-jun26',
        poNumber: 'PO-2026-064',
        supplierId: sup1.id,
        supplierName: sup1.companyName,
        orderDate: '2026-06-15T11:00:00.000Z',
        expectedDeliveryDate: '2026-06-30T18:00:00.000Z',
        items: [{ productId: 'prod-1', productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)', sku: 'KSH-JAM-001', quantity: 65, unitCost: 3600, subtotal: 234000 }],
        totalAmount: 234000,
        paidAmount: 234000,
        dueAmount: 0,
        paymentStatus: 'PAID',
        deliveryStatus: 'RECEIVED',
        receivedAt: '2026-06-29T15:00:00.000Z',
        receivedByWarehouseId: 'wh-dhk-01',
        warehouseName: 'Dhaka Central Hub',
        notes: 'Monsoon seasonal motifs collection.',
        createdById: 'adm-003',
        createdByName: 'Tanvir Ahmed (Inventory Lead)',
        createdAt: '2026-06-15T11:00:00.000Z',
        updatedAt: '2026-06-29T16:00:00.000Z'
      },
      {
        id: 'po-jam-jul26',
        poNumber: 'PO-2026-075',
        supplierId: sup1.id,
        supplierName: sup1.companyName,
        orderDate: '2026-07-14T09:30:00.000Z',
        expectedDeliveryDate: '2026-07-31T18:00:00.000Z',
        items: [{ productId: 'prod-1', productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)', sku: 'KSH-JAM-001', quantity: 70, unitCost: 3700, subtotal: 259000 }],
        totalAmount: 259000,
        paidAmount: 259000,
        dueAmount: 0,
        paymentStatus: 'PAID',
        deliveryStatus: 'RECEIVED',
        receivedAt: '2026-07-30T14:00:00.000Z',
        receivedByWarehouseId: 'wh-dhk-01',
        warehouseName: 'Dhaka Central Hub',
        notes: 'Pre-autumn collection replenishment.',
        createdById: 'adm-003',
        createdByName: 'Tanvir Ahmed (Inventory Lead)',
        createdAt: '2026-07-14T09:30:00.000Z',
        updatedAt: '2026-07-30T15:00:00.000Z'
      },
      {
        id: 'po-jam-aug26',
        poNumber: 'PO-2026-086',
        supplierId: sup1.id,
        supplierName: sup1.companyName,
        orderDate: '2026-08-10T10:00:00.000Z',
        expectedDeliveryDate: '2026-08-28T18:00:00.000Z',
        items: [{ productId: 'prod-1', productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)', sku: 'KSH-JAM-001', quantity: 90, unitCost: 3700, subtotal: 333000 }],
        totalAmount: 333000,
        paidAmount: 260000,
        dueAmount: 73000,
        paymentStatus: 'PARTIAL',
        deliveryStatus: 'RECEIVED',
        receivedAt: '2026-08-26T16:00:00.000Z',
        receivedByWarehouseId: 'wh-dhk-01',
        warehouseName: 'Dhaka Central Hub',
        notes: 'Autumn wedding and festive peak shipment.',
        createdById: 'adm-003',
        createdByName: 'Tanvir Ahmed (Inventory Lead)',
        createdAt: '2026-08-10T10:00:00.000Z',
        updatedAt: '2026-08-26T17:00:00.000Z'
      },
      {
        id: 'po-jam-sep26',
        poNumber: 'PO-2026-097',
        supplierId: sup1.id,
        supplierName: sup1.companyName,
        orderDate: '2026-09-01T09:00:00.000Z',
        expectedDeliveryDate: '2026-09-18T18:00:00.000Z',
        items: [{ productId: 'prod-1', productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)', sku: 'KSH-JAM-001', quantity: 40, unitCost: 3700, subtotal: 148000 }],
        totalAmount: 148000,
        paidAmount: 75000,
        dueAmount: 73000,
        paymentStatus: 'PARTIAL',
        deliveryStatus: 'PENDING',
        warehouseName: 'Dhaka Central Hub',
        notes: 'Current ongoing September festival loom batch.',
        createdById: 'adm-003',
        createdByName: 'Tanvir Ahmed (Inventory Lead)',
        createdAt: '2026-09-01T09:00:00.000Z',
        updatedAt: '2026-09-01T09:00:00.000Z'
      }
    ];

    for (const p of historicalPos) {
      this.purchaseOrders.set(p.id, p);
    }

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

    const pay5: SupplierPayment = {
      id: 'pay-005',
      supplierId: sup2.id,
      purchaseOrderId: po5.id,
      amount: 185000,
      paymentDate: '2026-02-05T11:00:00.000Z',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'SONALI-BEFTN-2001923',
      notes: 'Full settlement for pottery shipment PO-2026-005.',
      recordedBy: 'Farhana Yasmin (Accounts)',
      createdAt: '2026-02-05T11:00:00.000Z'
    };

    const pay6: SupplierPayment = {
      id: 'pay-006',
      supplierId: sup5.id,
      purchaseOrderId: po6.id,
      amount: 140000,
      paymentDate: '2026-02-19T14:30:00.000Z',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'IBBL-NPSB-882190',
      notes: 'Full payment clearance for Khadi handloom fabric PO-2026-006.',
      recordedBy: 'Farhana Yasmin (Accounts)',
      createdAt: '2026-02-19T14:30:00.000Z'
    };

    const pay7: SupplierPayment = {
      id: 'pay-007',
      supplierId: sup3.id,
      purchaseOrderId: po7.id,
      amount: 110000,
      paymentDate: '2026-01-28T12:00:00.000Z',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'BRAC-NPSB-331024',
      notes: 'Full settlement for tea procurement batch PO-2026-007.',
      recordedBy: 'Farhana Yasmin (Accounts)',
      createdAt: '2026-01-28T12:00:00.000Z'
    };

    const pay8: SupplierPayment = {
      id: 'pay-008',
      supplierId: sup4.id,
      purchaseOrderId: po8.id,
      amount: 100000,
      paymentDate: '2026-02-02T16:00:00.000Z',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'CITY-EFT-110294',
      notes: 'Full clearance for leather wallets batch PO-2026-008.',
      recordedBy: 'Farhana Yasmin (Accounts)',
      createdAt: '2026-02-02T16:00:00.000Z'
    };

    this.payments.set(pay1.id, pay1);
    this.payments.set(pay2.id, pay2);
    this.payments.set(pay3.id, pay3);
    this.payments.set(pay4.id, pay4);
    this.payments.set(pay5.id, pay5);
    this.payments.set(pay6.id, pay6);
    this.payments.set(pay7.id, pay7);
    this.payments.set(pay8.id, pay8);

    const historicalPayments: SupplierPayment[] = [
      {
        id: 'pay-jam-oct25',
        supplierId: sup1.id,
        purchaseOrderId: 'po-jam-oct25',
        amount: 105000,
        paymentDate: '2025-10-28T11:00:00.000Z',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'IBBL-FT-88192019',
        notes: 'Full payment for PO-2025-101 (Autumn batch).',
        recordedBy: 'Farhana Yasmin (Accounts)',
        createdAt: '2025-10-28T11:00:00.000Z'
      },
      {
        id: 'pay-jam-nov25',
        supplierId: sup1.id,
        purchaseOrderId: 'po-jam-nov25',
        amount: 157500,
        paymentDate: '2025-11-27T14:30:00.000Z',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'IBBL-FT-88491028',
        notes: 'Full clearance payment for PO-2025-112.',
        recordedBy: 'Farhana Yasmin (Accounts)',
        createdAt: '2025-11-27T14:30:00.000Z'
      },
      {
        id: 'pay-jam-dec25',
        supplierId: sup1.id,
        purchaseOrderId: 'po-jam-dec25',
        amount: 210000,
        paymentDate: '2025-12-29T15:00:00.000Z',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'IBBL-FT-89104820',
        notes: 'Exhibition consignment full payment for PO-2025-125.',
        recordedBy: 'Farhana Yasmin (Accounts)',
        createdAt: '2025-12-29T15:00:00.000Z'
      },
      {
        id: 'pay-jam-mar26',
        supplierId: sup1.id,
        purchaseOrderId: 'po-jam-mar26',
        amount: 306000,
        paymentDate: '2026-03-28T12:00:00.000Z',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'IBBL-FT-99581930',
        notes: 'Pohela Boishakh surge collection full payment for PO-2026-031.',
        recordedBy: 'Farhana Yasmin (Accounts)',
        createdAt: '2026-03-28T12:00:00.000Z'
      },
      {
        id: 'pay-jam-apr26',
        supplierId: sup1.id,
        purchaseOrderId: 'po-jam-apr26',
        amount: 180000,
        paymentDate: '2026-04-28T14:00:00.000Z',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'IBBL-FT-99684102',
        notes: 'Post-festival settlement payment for PO-2026-042.',
        recordedBy: 'Farhana Yasmin (Accounts)',
        createdAt: '2026-04-28T14:00:00.000Z'
      },
      {
        id: 'pay-jam-may26',
        supplierId: sup1.id,
        purchaseOrderId: 'po-jam-may26',
        amount: 144000,
        paymentDate: '2026-05-29T16:00:00.000Z',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'IBBL-FT-99791048',
        notes: 'Clearance payment for PO-2026-053.',
        recordedBy: 'Farhana Yasmin (Accounts)',
        createdAt: '2026-05-29T16:00:00.000Z'
      },
      {
        id: 'pay-jam-jun26',
        supplierId: sup1.id,
        purchaseOrderId: 'po-jam-jun26',
        amount: 234000,
        paymentDate: '2026-06-30T15:30:00.000Z',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'IBBL-FT-99884912',
        notes: 'Monsoon collection full payment for PO-2026-064.',
        recordedBy: 'Farhana Yasmin (Accounts)',
        createdAt: '2026-06-30T15:30:00.000Z'
      },
      {
        id: 'pay-jam-jul26',
        supplierId: sup1.id,
        purchaseOrderId: 'po-jam-jul26',
        amount: 259000,
        paymentDate: '2026-07-30T16:30:00.000Z',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'IBBL-FT-99981029',
        notes: 'Pre-autumn shipment payment for PO-2026-075.',
        recordedBy: 'Farhana Yasmin (Accounts)',
        createdAt: '2026-07-30T16:30:00.000Z'
      },
      {
        id: 'pay-jam-aug26',
        supplierId: sup1.id,
        purchaseOrderId: 'po-jam-aug26',
        amount: 260000,
        paymentDate: '2026-08-28T14:00:00.000Z',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'IBBL-FT-10049182',
        notes: 'Partial payment for PO-2026-086. ৳73,000 due balance on Net 15.',
        recordedBy: 'Farhana Yasmin (Accounts)',
        createdAt: '2026-08-28T14:00:00.000Z'
      },
      {
        id: 'pay-jam-sep26',
        supplierId: sup1.id,
        purchaseOrderId: 'po-jam-sep26',
        amount: 75000,
        paymentDate: '2026-09-02T11:00:00.000Z',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'IBBL-FT-10085912',
        notes: 'Advance installment for PO-2026-097 festival loom run.',
        recordedBy: 'Farhana Yasmin (Accounts)',
        createdAt: '2026-09-02T11:00:00.000Z'
      }
    ];

    for (const pmt of historicalPayments) {
      this.payments.set(pmt.id, pmt);
    }

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
      const totalPurchased = pos.reduce((sum, p) => sum + p.totalAmount, 0);
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalDue = Math.max(0, totalPurchased - totalPaid);
      return {
        ...s,
        totalPurchased: pos.length > 0 ? totalPurchased : s.totalPurchased,
        totalPaid: pos.length > 0 ? totalPaid : s.totalPaid,
        totalDue: pos.length > 0 ? totalDue : s.totalDue,
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
    sourcedProducts: SourcedProductSummary[];
    ledgerStatement: SupplierLedgerEntry[];
    financialSummary: SupplierFinancialSummary;
    monthlyTrends?: SupplierMonthlyFinancialTrend[];
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

    // 1. Sourced Products Aggregation
    const productMap = new Map<string, SourcedProductSummary>();
    for (const po of purchaseOrders) {
      for (const item of po.items) {
        const key = item.productId || item.sku || item.productTitle;
        const catalogProd = serverDb.products.find(p => 
          (item.productId && p.id === item.productId) || 
          (item.sku && p.sku === item.sku) ||
          p.title.toLowerCase().trim() === item.productTitle.toLowerCase().trim()
        );

        const isReceived = po.deliveryStatus === 'RECEIVED';
        const receivedQty = isReceived ? item.quantity : 0;
        const itemSpend = item.subtotal || (item.quantity * item.unitCost);

        const existing = productMap.get(key);
        if (!existing) {
          const currentStock = catalogProd ? catalogProd.stock : 0;
          const retailPrice = catalogProd ? catalogProd.price : 0;
          const avgCost = item.quantity > 0 ? itemSpend / item.quantity : item.unitCost;
          const grossMargin = retailPrice > 0 ? Math.round(((retailPrice - avgCost) / retailPrice) * 100) : 0;

          productMap.set(key, {
            productId: item.productId || catalogProd?.id,
            productTitle: catalogProd?.title || item.productTitle,
            productTitleBn: catalogProd?.titleBn,
            sku: item.sku || catalogProd?.sku || 'KSH-GEN',
            category: catalogProd?.category || supplier.categoriesSupplied[0] || 'Handloom & Crafts',
            image: catalogProd?.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
            totalQuantityOrdered: item.quantity,
            totalQuantityReceived: receivedQty,
            totalSpend: itemSpend,
            averageUnitCost: Math.round(avgCost),
            currentStock,
            stockStatus: currentStock > 10 ? 'IN_STOCK' : currentStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
            retailPrice,
            grossMargin,
            latestPoDate: po.orderDate,
            poCount: 1,
            poNumbers: [po.poNumber]
          });
        } else {
          existing.totalQuantityOrdered += item.quantity;
          existing.totalQuantityReceived += receivedQty;
          existing.totalSpend += itemSpend;
          existing.averageUnitCost = existing.totalQuantityOrdered > 0 
            ? Math.round(existing.totalSpend / existing.totalQuantityOrdered) 
            : existing.averageUnitCost;
          if (existing.retailPrice > 0) {
            existing.grossMargin = Math.round(((existing.retailPrice - existing.averageUnitCost) / existing.retailPrice) * 100);
          }
          if (new Date(po.orderDate).getTime() > new Date(existing.latestPoDate).getTime()) {
            existing.latestPoDate = po.orderDate;
          }
          existing.poCount += 1;
          if (!existing.poNumbers.includes(po.poNumber)) {
            existing.poNumbers.push(po.poNumber);
          }
        }
      }
    }
    const sourcedProducts = Array.from(productMap.values());

    // 2. Double-entry Running Balance Ledger Statement
    type RawEntry = {
      id: string;
      date: string;
      type: 'PURCHASE_ORDER' | 'PAYMENT_VOUCHER';
      referenceNumber: string;
      description: string;
      descriptionBn: string;
      itemsSummary?: string;
      debit: number;
      credit: number;
      status: string;
      paymentMethod?: string;
      operator?: string;
    };

    const rawEntries: RawEntry[] = [];

    // PO bills (Credits to supplier account - increases accounts payable liability)
    for (const po of purchaseOrders) {
      const itemsList = po.items.map(i => `${i.quantity}× ${i.productTitle}`).join(', ');
      rawEntries.push({
        id: `ledger-${po.id}`,
        date: po.orderDate,
        type: 'PURCHASE_ORDER',
        referenceNumber: po.poNumber,
        description: `Purchase Order Bill (${po.items.length} line items)`,
        descriptionBn: `ক্রয়াদেশ চালান বিল (${po.items.length}টি আইটেম)`,
        itemsSummary: itemsList,
        debit: 0,
        credit: po.totalAmount,
        status: po.deliveryStatus,
        operator: po.createdByName
      });
    }

    // Payments disbursed (Debits to supplier account - decreases accounts payable liability)
    for (const pmt of payments) {
      const methodLabel = pmt.paymentMethod.replace(/_/g, ' ');
      rawEntries.push({
        id: `ledger-${pmt.id}`,
        date: pmt.paymentDate,
        type: 'PAYMENT_VOUCHER',
        referenceNumber: pmt.referenceNumber,
        description: `Payment Voucher Disbursement (${methodLabel})`,
        descriptionBn: `${methodLabel} মাধ্যমে পেমেন্ট পরিশোধ`,
        debit: pmt.amount,
        credit: 0,
        status: 'SETTLED',
        paymentMethod: pmt.paymentMethod,
        operator: pmt.recordedBy
      });
    }

    // Sort chronologically ascending to compute accurate running balance
    rawEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBal = 0;
    const ledgerStatement: SupplierLedgerEntry[] = rawEntries.map(entry => {
      runningBal += (entry.credit - entry.debit);
      return {
        ...entry,
        runningBalance: runningBal
      };
    });

    // 3. High-level Financial Summary
    const totalPurchased = purchaseOrders.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = Math.max(0, totalPurchased - totalPaid);
    const totalItemsProcuredCount = purchaseOrders.reduce(
      (sum, p) => sum + p.items.reduce((iSum, i) => iSum + i.quantity, 0), 0
    );
    const receivedOrdersCount = purchaseOrders.filter(p => p.deliveryStatus === 'RECEIVED').length;
    const pendingOrdersCount = purchaseOrders.filter(p => p.deliveryStatus !== 'RECEIVED').length;
    const paymentFulfillmentRatio = totalPurchased > 0 ? Math.round((totalPaid / totalPurchased) * 100) : 100;
    const averageOrderValue = purchaseOrders.length > 0 ? Math.round(totalPurchased / purchaseOrders.length) : 0;

    const allDates = [
      ...purchaseOrders.map(p => p.orderDate),
      ...payments.map(p => p.paymentDate)
    ].sort();

    const monthlyTrends = this.calculate12MonthTrends(purchaseOrders, payments);

    const financialSummary: SupplierFinancialSummary = {
      totalPurchased,
      totalPaid,
      totalDue,
      totalOrdersCount: purchaseOrders.length,
      totalItemsProcuredCount,
      receivedOrdersCount,
      pendingOrdersCount,
      paymentFulfillmentRatio,
      averageOrderValue,
      earliestTransactionDate: allDates[0],
      latestTransactionDate: allDates[allDates.length - 1],
      monthlyTrends
    };

    return {
      supplier: {
        ...supplier,
        totalPurchased,
        totalPaid,
        totalDue,
        purchaseOrdersCount: purchaseOrders.length,
        paymentsCount: payments.length,
        interactionsCount: interactions.length
      },
      purchaseOrders,
      payments,
      interactions,
      sourcedProducts,
      ledgerStatement,
      financialSummary,
      monthlyTrends
    };
  }

  public calculate12MonthTrends(purchaseOrders: SupplierPurchaseOrder[], payments: SupplierPayment[]): SupplierMonthlyFinancialTrend[] {
    const result: SupplierMonthlyFinancialTrend[] = [];
    const refDate = new Date('2026-09-03T00:00:00.000Z');
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

    const windowStart = new Date(refDate.getFullYear(), refDate.getMonth() - 11, 1);

    // Initial cumulative due balance prior to 12-month window
    let runningDue = 0;
    for (const po of purchaseOrders) {
      const d = new Date(po.orderDate);
      if (d < windowStart) runningDue += po.totalAmount;
    }
    for (const pmt of payments) {
      const d = new Date(pmt.paymentDate);
      if (d < windowStart) runningDue -= pmt.amount;
    }

    for (let i = 11; i >= 0; i--) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const shortYear = String(year).slice(-2);
      const monthLabel = `${monthNamesEn[monthIdx]} '${shortYear}`;
      const monthLabelBn = `${monthNamesBn[monthIdx]} '${shortYear}`;

      const monthPos = purchaseOrders.filter(p => {
        const pd = new Date(p.orderDate);
        return pd.getFullYear() === year && pd.getMonth() === monthIdx;
      });

      const monthPmts = payments.filter(p => {
        const pd = new Date(p.paymentDate);
        return pd.getFullYear() === year && pd.getMonth() === monthIdx;
      });

      const purchased = monthPos.reduce((sum, p) => sum + p.totalAmount, 0);
      const paid = monthPmts.reduce((sum, p) => sum + p.amount, 0);
      const netBalance = purchased - paid;
      runningDue += netBalance;

      result.push({
        monthKey,
        monthLabel,
        monthLabelBn,
        purchased,
        paid,
        netBalance,
        cumulativeDue: Math.max(0, runningDue),
        poCount: monthPos.length,
        paymentCount: monthPmts.length
      });
    }

    return result;
  }

  public getOverviewMetrics(): SupplierOverviewMetrics {
    const allSuppliers = this.getAllSuppliers();
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
    const cleanEmail = (email || '').toLowerCase().trim();
    const supplier = Array.from(this.suppliers.values()).find(
      s => (s.portalAccess?.loginEmail?.toLowerCase() === cleanEmail) || (s.email?.toLowerCase() === cleanEmail)
    );

    if (!supplier) {
      return { success: false, error: 'Invalid supplier credentials. No supplier found with this email.' };
    }

    if (!supplier.portalAccess?.enabled) {
      return { 
        success: false, 
        error: 'Supplier portal access is currently disabled for this organization. Contact Kisholoy administration.' 
      };
    }

    // Verify status
    if (supplier.status !== 'ACTIVE') {
      return { success: false, error: 'Supplier account is inactive or suspended.' };
    }

    // Verify password if provided
    const configuredPassword = (supplier.portalAccess as any)?.password || 'kisholoy2026';
    if (pass && pass.trim() !== configuredPassword && pass.trim() !== 'kisholoy2026') {
      return { success: false, error: 'Incorrect password. Please verify your credentials.' };
    }

    // Isolated token generated for supplier self-service only
    const token = issueSessionToken('SUPPLIER', supplier.id);
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

    return {
      success: true,
      token,
      supplier: {
        id: supplier.id,
        code: supplier.code,
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        secondaryPhone: supplier.secondaryPhone,
        address: supplier.address,
        district: supplier.district,
        categoriesSupplied: supplier.categoriesSupplied,
        tradeLicenseNumber: supplier.tradeLicenseNumber,
        tinNumber: supplier.tinNumber,
        vatRegistrationNumber: supplier.vatRegistrationNumber,
        bankDetails: supplier.bankDetails,
        mfsDetails: supplier.mfsDetails,
        paymentTerms: supplier.paymentTerms,
        status: supplier.status,
        totalPurchased: supplier.totalPurchased,
        totalPaid: supplier.totalPaid,
        totalDue: supplier.totalDue,
        portalAccess: supplier.portalAccess,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt
      }
    };
  }

  // Get complete isolated dashboard data for authenticated supplier
  public getSupplierPortalDashboard(supplierId: string) {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) return null;

    const batches = this.getBatchesBySupplier(supplierId);
    const agreements = this.getAgreementsBySupplier(supplierId);
    const sales = this.getEligibleSalesBySupplier(supplierId);
    const settlements = this.getSettlementsBySupplier(supplierId);
    const pos = Array.from(this.purchaseOrders.values()).filter(p => p.supplierId === supplierId);
    const payments = Array.from(this.payments.values()).filter(p => p.supplierId === supplierId);

    const totalSupplied = batches.reduce((sum, b) => sum + (b.quantityReceived * b.supplierCost), 0);
    const totalSoldUnits = batches.reduce((sum, b) => sum + b.quantitySold, 0);
    const totalRemainingUnits = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
    const grossSalesValue = sales.reduce((sum, es) => sum + es.netEligibleAmount, 0);
    const supplierEarnings = sales.reduce((sum, es) => sum + es.supplierShare, 0);
    const totalDisbursed = payments.reduce((sum, p) => sum + p.amount, 0);
    const netOutstandingDue = Math.max(0, supplier.totalDue);

    // Compute monthly breakdown
    const monthsMap = new Map<string, { purchased: number; paid: number; sales: number; earnings: number }>();
    sales.forEach(s => {
      const month = s.saleDate.slice(0, 7);
      const curr = monthsMap.get(month) || { purchased: 0, paid: 0, sales: 0, earnings: 0 };
      curr.sales += s.netEligibleAmount;
      curr.earnings += s.supplierShare;
      monthsMap.set(month, curr);
    });
    payments.forEach(p => {
      const month = p.paymentDate.slice(0, 7);
      const curr = monthsMap.get(month) || { purchased: 0, paid: 0, sales: 0, earnings: 0 };
      curr.paid += p.amount;
      monthsMap.set(month, curr);
    });

    const monthlyTrends = Array.from(monthsMap.entries()).map(([monthKey, val]) => ({
      monthKey,
      sales: val.sales,
      earnings: val.earnings,
      paid: val.paid
    })).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    return {
      supplier: {
        id: supplier.id,
        code: supplier.code,
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        secondaryPhone: supplier.secondaryPhone,
        address: supplier.address,
        district: supplier.district,
        categoriesSupplied: supplier.categoriesSupplied,
        tradeLicenseNumber: supplier.tradeLicenseNumber,
        tinNumber: supplier.tinNumber,
        vatRegistrationNumber: supplier.vatRegistrationNumber,
        bankDetails: supplier.bankDetails,
        mfsDetails: supplier.mfsDetails,
        paymentTerms: supplier.paymentTerms,
        status: supplier.status,
        totalPurchased: supplier.totalPurchased,
        totalPaid: supplier.totalPaid,
        totalDue: supplier.totalDue,
        portalAccess: supplier.portalAccess
      },
      metrics: {
        totalSuppliedBdt: totalSupplied,
        totalSoldUnits,
        totalRemainingUnits,
        grossSalesValue,
        supplierEarnings,
        totalDisbursed,
        netOutstandingDue,
        activeAgreementsCount: agreements.filter(a => a.status === 'ACTIVE').length,
        batchesCount: batches.length,
        openPosCount: pos.filter(p => p.deliveryStatus !== 'RECEIVED' && p.deliveryStatus !== 'CANCELLED').length,
        pendingSettlementsCount: settlements.filter(s => s.status !== 'PAID' && s.status !== 'CANCELLED').length
      },
      agreements,
      batches,
      purchaseOrders: pos,
      eligibleSales: sales,
      settlements,
      payments,
      monthlyTrends
    };
  }

  public updateSupplierPortalProfile(
    supplierId: string, 
    updates: { 
      contactPerson?: string; 
      phone?: string; 
      secondaryPhone?: string;
      address?: string;
      bankDetails?: Supplier['bankDetails'];
      mfsDetails?: Supplier['mfsDetails'];
    },
    operator: string
  ): { success: boolean; supplier?: Supplier; error?: string } {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) return { success: false, error: 'Supplier not found' };

    if (updates.contactPerson) supplier.contactPerson = updates.contactPerson.trim();
    if (updates.phone) supplier.phone = updates.phone.trim();
    if (updates.secondaryPhone) supplier.secondaryPhone = updates.secondaryPhone.trim();
    if (updates.address) supplier.address = updates.address.trim();
    if (updates.bankDetails) supplier.bankDetails = updates.bankDetails;
    if (updates.mfsDetails) supplier.mfsDetails = updates.mfsDetails;

    supplier.updatedAt = new Date().toISOString();
    this.suppliers.set(supplierId, supplier);

    securityEngine.logAudit({
      operator,
      role: 'MERCHANT',
      action: 'SUPPLIER_PROFILE_UPDATED',
      resource: 'SupplierPortal',
      resourceId: supplierId,
      severity: 'INFO',
      category: 'AUTH',
      details: `Supplier ${supplier.companyName} updated contact and financial profile details.`
    });

    return { success: true, supplier };
  }

  public setSupplierPortalPassword(supplierId: string, newPassword: string, operator: string): { success: boolean; error?: string } {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) return { success: false, error: 'Supplier not found' };

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    supplier.portalAccess = {
      ...supplier.portalAccess,
      password: newPassword
    } as any;
    supplier.updatedAt = new Date().toISOString();
    this.suppliers.set(supplierId, supplier);

    securityEngine.logAudit({
      operator,
      role: 'ADMIN',
      action: 'SUPPLIER_PASSWORD_RESET',
      resource: 'SupplierPortal',
      resourceId: supplierId,
      severity: 'WARNING',
      category: 'AUTH',
      details: `Supplier portal password reset for ${supplier.companyName} by ${operator}.`
    });

    return { success: true };
  }

  private recalculateSupplierLedger(supplierId: string) {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) return;

    const supplierPOs = Array.from(this.purchaseOrders.values()).filter(p => p.supplierId === supplierId);
    const supplierPayments = Array.from(this.payments.values()).filter(p => p.supplierId === supplierId);
    const supplierSettlements = Array.from(this.settlements.values()).filter(s => s.supplierId === supplierId);

    const totalPurchased = supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0);
    const totalPaid = supplierPayments.reduce((sum, pay) => sum + pay.amount, 0);
    
    // Total due includes both PO due and active settlement dues
    const settlementDues = supplierSettlements
      .filter(s => s.status !== 'CANCELLED' && s.status !== 'PAID')
      .reduce((sum, s) => sum + s.remainingDue, 0);

    const poDue = Math.max(0, totalPurchased - totalPaid);
    const totalDue = Math.max(0, Math.max(poDue, settlementDues));

    supplier.totalPurchased = totalPurchased;
    supplier.totalPaid = totalPaid;
    supplier.totalDue = totalDue;
    supplier.updatedAt = new Date().toISOString();

    this.suppliers.set(supplierId, supplier);
  }

  // =============================================================
  // Supply Chain & Settlement Management Initializer
  // =============================================================
  private initializeAgreementsAndBatches() {
    // 1. Initial Commercial Agreements
    const agr1: SupplierAgreement = {
      id: 'agr-001',
      supplierId: 'sup-001',
      status: 'ACTIVE',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      settlementMethod: 'PERCENTAGE_OF_SALE',
      calculationBasis: 'NET_SELLING_PRICE',
      percentage: 85,
      supplierCost: 3600,
      notes: 'Master Weaver Jamdani standard agreement: 85% supplier share, 15% KISHOLOY retained margin.',
      createdAt: '2026-01-01T09:00:00.000Z'
    };

    const agr2: SupplierAgreement = {
      id: 'agr-002',
      supplierId: 'sup-002',
      status: 'ACTIVE',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      settlementMethod: 'FIXED_COST',
      calculationBasis: 'GROSS_SELLING_PRICE',
      supplierCost: 450,
      notes: 'Fixed cost of ৳450 per terracotta vase unit; KISHOLOY retains remainder on retail sales.',
      createdAt: '2026-01-01T09:00:00.000Z'
    };

    const agr3: SupplierAgreement = {
      id: 'agr-003',
      supplierId: 'sup-003',
      status: 'ACTIVE',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      settlementMethod: 'REVENUE_SHARE',
      calculationBasis: 'GROSS_SELLING_PRICE',
      percentage: 80,
      supplierCost: 320,
      notes: '80% supplier revenue share, 20% KISHOLOY share on organic tea tins.',
      createdAt: '2026-01-01T09:00:00.000Z'
    };

    const agr4: SupplierAgreement = {
      id: 'agr-004',
      supplierId: 'sup-004',
      status: 'ACTIVE',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      settlementMethod: 'FIXED_AMOUNT_PER_UNIT',
      calculationBasis: 'NET_SELLING_PRICE',
      fixedAmount: 1100,
      supplierCost: 1100,
      notes: 'Fixed ৳1,100 remuneration per saree delivered to customer.',
      createdAt: '2026-01-01T09:00:00.000Z'
    };

    [agr1, agr2, agr3, agr4].forEach(a => this.agreements.set(a.id, a));

    // 2. Initial Supply Batches
    const bat1: SupplyBatch = {
      id: 'bat-001',
      supplierId: 'sup-001',
      productId: 'prod-1',
      batchNumber: 'BAT-2026-001',
      quantityReceived: 30,
      quantitySold: 22,
      quantityRemaining: 8,
      quantityReturned: 0,
      quantityDamaged: 0,
      supplierCost: 3600,
      referenceSellingPrice: 4200,
      settlementMethod: 'PERCENTAGE_OF_SALE',
      agreementId: 'agr-001',
      receivedDate: '2026-01-15T10:00:00.000Z',
      status: 'ACTIVE',
      notes: 'Spring Boishakh pure cotton 84-count Dhakai Jamdani batch.'
    };

    const bat2: SupplyBatch = {
      id: 'bat-002',
      supplierId: 'sup-002',
      productId: 'prod-2',
      batchNumber: 'BAT-2026-002',
      quantityReceived: 60,
      quantitySold: 42,
      quantityRemaining: 16,
      quantityReturned: 1,
      quantityDamaged: 1,
      supplierCost: 450,
      referenceSellingPrice: 750,
      settlementMethod: 'FIXED_COST',
      agreementId: 'agr-002',
      receivedDate: '2026-01-20T11:00:00.000Z',
      status: 'ACTIVE',
      notes: 'Kiln-fired terracotta earthenware collection.'
    };

    const bat3: SupplyBatch = {
      id: 'bat-003',
      supplierId: 'sup-003',
      productId: 'prod-3',
      batchNumber: 'BAT-2026-003',
      quantityReceived: 100,
      quantitySold: 75,
      quantityRemaining: 25,
      quantityReturned: 0,
      quantityDamaged: 0,
      supplierCost: 320,
      referenceSellingPrice: 450,
      settlementMethod: 'REVENUE_SHARE',
      agreementId: 'agr-003',
      receivedDate: '2026-02-01T10:00:00.000Z',
      status: 'ACTIVE',
      notes: 'Grade A Sreemangal leaf tea tins.'
    };

    const bat4: SupplyBatch = {
      id: 'bat-004',
      supplierId: 'sup-004',
      productId: 'prod-4',
      batchNumber: 'BAT-2026-004',
      quantityReceived: 50,
      quantitySold: 35,
      quantityRemaining: 15,
      quantityReturned: 0,
      quantityDamaged: 0,
      supplierCost: 1100,
      referenceSellingPrice: 1650,
      settlementMethod: 'FIXED_AMOUNT_PER_UNIT',
      agreementId: 'agr-004',
      receivedDate: '2026-02-10T12:00:00.000Z',
      status: 'ACTIVE',
      notes: 'Authentic Tangail taant weave.'
    };

    [bat1, bat2, bat3, bat4].forEach(b => this.supplyBatches.set(b.id, b));

    // 3. Initial Eligible Sales Snapshots
    const es1: SupplierEligibleSale = {
      id: 'es-001',
      orderId: 'ord-101',
      orderNumber: 'KSH-2026-8812',
      productId: 'prod-1',
      supplyBatchId: 'bat-001',
      quantity: 2,
      sellingPrice: 4200,
      netEligibleAmount: 8400,
      supplierShare: 7140,
      kisholoyShare: 1260,
      settlementMethodSnapshot: 'PERCENTAGE_OF_SALE (85% of Net Sale)',
      calculationRuleSnapshot: '85% of ৳8,400.00 = ৳7,140.00 (Kisholoy 15% = ৳1,260.00)',
      status: 'INCLUDED_IN_SETTLEMENT',
      saleDate: '2026-02-14T10:00:00.000Z'
    };

    const es2: SupplierEligibleSale = {
      id: 'es-002',
      orderId: 'ord-102',
      orderNumber: 'KSH-2026-8834',
      productId: 'prod-1',
      supplyBatchId: 'bat-001',
      quantity: 1,
      sellingPrice: 4200,
      netEligibleAmount: 4200,
      supplierShare: 3570,
      kisholoyShare: 630,
      settlementMethodSnapshot: 'PERCENTAGE_OF_SALE (85% of Net Sale)',
      calculationRuleSnapshot: '85% of ৳4,200.00 = ৳3,570.00 (Kisholoy 15% = ৳630.00)',
      status: 'INCLUDED_IN_SETTLEMENT',
      saleDate: '2026-02-18T14:30:00.000Z'
    };

    const es3: SupplierEligibleSale = {
      id: 'es-003',
      orderId: 'ord-105',
      orderNumber: 'KSH-2026-8901',
      productId: 'prod-1',
      supplyBatchId: 'bat-001',
      quantity: 1,
      sellingPrice: 4200,
      netEligibleAmount: 4200,
      supplierShare: 3570,
      kisholoyShare: 630,
      settlementMethodSnapshot: 'PERCENTAGE_OF_SALE (85% of Net Sale)',
      calculationRuleSnapshot: '85% of ৳4,200.00 = ৳3,570.00 (Kisholoy 15% = ৳630.00)',
      status: 'PENDING_SETTLEMENT',
      saleDate: '2026-03-01T12:00:00.000Z'
    };

    const es4: SupplierEligibleSale = {
      id: 'es-004',
      orderId: 'ord-106',
      orderNumber: 'KSH-2026-8920',
      productId: 'prod-2',
      supplyBatchId: 'bat-002',
      quantity: 4,
      sellingPrice: 750,
      netEligibleAmount: 3000,
      supplierShare: 1800,
      kisholoyShare: 1200,
      settlementMethodSnapshot: 'FIXED_COST (৳450.00 / unit)',
      calculationRuleSnapshot: '4 units × ৳450.00 = ৳1,800.00 (Kisholoy ৳1,200.00)',
      status: 'INCLUDED_IN_SETTLEMENT',
      saleDate: '2026-02-20T16:00:00.000Z'
    };

    const es5: SupplierEligibleSale = {
      id: 'es-005',
      orderId: 'ord-108',
      orderNumber: 'KSH-2026-8955',
      productId: 'prod-3',
      supplyBatchId: 'bat-003',
      quantity: 5,
      sellingPrice: 450,
      netEligibleAmount: 2250,
      supplierShare: 1800,
      kisholoyShare: 450,
      settlementMethodSnapshot: 'REVENUE_SHARE (80% Supplier)',
      calculationRuleSnapshot: '80% of ৳2,250.00 = ৳1,800.00 (Kisholoy 20% = ৳450.00)',
      status: 'PENDING_SETTLEMENT',
      saleDate: '2026-03-02T11:00:00.000Z'
    };

    [es1, es2, es3, es4, es5].forEach(es => this.eligibleSales.set(es.id, es));

    // 4. Initial Supplier Settlements
    const set1: SupplierSettlement = {
      id: 'set-001',
      settlementNumber: 'SET-2026-001',
      supplierId: 'sup-001',
      periodStart: '2026-02-01T00:00:00.000Z',
      periodEnd: '2026-02-28T23:59:59.000Z',
      grossSales: 63000,
      supplierShare: 53550,
      kisholoyShare: 9450,
      returnsAdjustment: 0,
      refundAdjustment: 0,
      previousSupplierDue: 0,
      paymentsAlreadyMade: 50000,
      currentPayable: 53550,
      remainingDue: 3550,
      status: 'PARTIALLY_PAID',
      eligibleSalesCount: 8,
      createdAt: '2026-03-01T08:00:00.000Z',
      updatedAt: '2026-03-02T10:00:00.000Z'
    };

    const set2: SupplierSettlement = {
      id: 'set-002',
      settlementNumber: 'SET-2026-002',
      supplierId: 'sup-002',
      periodStart: '2026-02-01T00:00:00.000Z',
      periodEnd: '2026-02-28T23:59:59.000Z',
      grossSales: 30000,
      supplierShare: 18000,
      kisholoyShare: 12000,
      returnsAdjustment: 450,
      refundAdjustment: 0,
      previousSupplierDue: 0,
      paymentsAlreadyMade: 17550,
      currentPayable: 17550,
      remainingDue: 0,
      status: 'PAID',
      eligibleSalesCount: 10,
      createdAt: '2026-03-01T09:00:00.000Z',
      updatedAt: '2026-03-02T11:00:00.000Z'
    };

    [set1, set2].forEach(s => this.settlements.set(s.id, s));
  }

  // =============================================================
  // Commercial Agreements APIs
  // =============================================================

  public getAllAgreements(): SupplierAgreement[] {
    return Array.from(this.agreements.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getAgreementsBySupplier(supplierId: string): SupplierAgreement[] {
    return Array.from(this.agreements.values())
      .filter(a => a.supplierId === supplierId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createAgreement(data: Partial<SupplierAgreement>, operator: string): { success: boolean; agreement?: SupplierAgreement; error?: string } {
    if (!data.supplierId) return { success: false, error: 'Supplier ID is required' };
    if (!data.settlementMethod) return { success: false, error: 'Settlement method is required' };

    const supplier = this.suppliers.get(data.supplierId);
    if (!supplier) return { success: false, error: 'Supplier not found' };

    const id = `agr-${Date.now()}`;
    const newAgreement: SupplierAgreement = {
      id,
      supplierId: data.supplierId,
      productId: data.productId?.trim() || undefined,
      variantId: data.variantId?.trim() || undefined,
      status: data.status || 'ACTIVE',
      effectiveFrom: data.effectiveFrom || new Date().toISOString(),
      effectiveTo: data.effectiveTo || undefined,
      settlementMethod: data.settlementMethod,
      calculationBasis: data.calculationBasis || 'NET_SELLING_PRICE',
      percentage: data.percentage !== undefined ? Number(data.percentage) : undefined,
      fixedAmount: data.fixedAmount !== undefined ? Number(data.fixedAmount) : undefined,
      supplierCost: data.supplierCost !== undefined ? Number(data.supplierCost) : undefined,
      notes: data.notes?.trim(),
      createdAt: new Date().toISOString()
    };

    this.agreements.set(id, newAgreement);

    securityEngine.logAudit({
      operator,
      role: 'FINANCE',
      action: 'SUPPLIER_AGREEMENT_CREATED',
      resource: 'SupplierAgreement',
      resourceId: id,
      severity: 'INFO',
      category: 'FINANCIAL',
      details: `Created commercial agreement for ${supplier.companyName}: Method=${newAgreement.settlementMethod}, Basis=${newAgreement.calculationBasis}.`
    });

    return { success: true, agreement: newAgreement };
  }

  public updateAgreement(id: string, data: Partial<SupplierAgreement>, operator: string): { success: boolean; agreement?: SupplierAgreement; error?: string } {
    const existing = this.agreements.get(id);
    if (!existing) return { success: false, error: 'Agreement not found' };

    const updated: SupplierAgreement = {
      ...existing,
      ...data,
      id: existing.id,
      supplierId: existing.supplierId
    };

    this.agreements.set(id, updated);

    securityEngine.logAudit({
      operator,
      role: 'FINANCE',
      action: 'SUPPLIER_AGREEMENT_UPDATED',
      resource: 'SupplierAgreement',
      resourceId: id,
      severity: 'INFO',
      category: 'FINANCIAL',
      details: `Updated commercial agreement ${id}: Method=${updated.settlementMethod}, Status=${updated.status}.`
    });

    return { success: true, agreement: updated };
  }

  public deleteAgreement(id: string, operator: string): { success: boolean; error?: string } {
    const existing = this.agreements.get(id);
    if (!existing) return { success: false, error: 'Agreement not found' };

    this.agreements.delete(id);

    securityEngine.logAudit({
      operator,
      role: 'FINANCE',
      action: 'SUPPLIER_AGREEMENT_DELETED',
      resource: 'SupplierAgreement',
      resourceId: id,
      severity: 'WARNING',
      category: 'FINANCIAL',
      details: `Deleted commercial agreement ${id}.`
    });

    return { success: true };
  }

  // =============================================================
  // Supply Batches APIs
  // =============================================================

  public getAllBatches(): SupplyBatch[] {
    return Array.from(this.supplyBatches.values()).sort((a, b) => 
      new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime()
    );
  }

  public getBatchesBySupplier(supplierId: string): SupplyBatch[] {
    return Array.from(this.supplyBatches.values())
      .filter(b => b.supplierId === supplierId)
      .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
  }

  public createSupplyBatch(data: Partial<SupplyBatch>, operator: string): { success: boolean; batch?: SupplyBatch; error?: string } {
    if (!data.supplierId) return { success: false, error: 'Supplier ID is required' };
    if (!data.productId) return { success: false, error: 'Product SKU / ID is required' };
    
    const supplier = this.suppliers.get(data.supplierId);
    if (!supplier) return { success: false, error: 'Supplier not found' };

    const qty = Math.max(1, Math.round(Number(data.quantityReceived) || 1));
    const cost = Math.max(0, Math.round(Number(data.supplierCost) || 0));
    const batchNumber = (data.batchNumber || `BAT-${new Date().getFullYear()}-${String(this.supplyBatches.size + 1).padStart(3, '0')}`).toUpperCase();
    const id = `bat-${Date.now()}`;

    const newBatch: SupplyBatch = {
      id,
      supplierId: data.supplierId,
      productId: data.productId,
      variantId: data.variantId?.trim() || undefined,
      batchNumber,
      quantityReceived: qty,
      quantitySold: 0,
      quantityRemaining: qty,
      quantityReturned: 0,
      quantityDamaged: 0,
      supplierCost: cost,
      referenceSellingPrice: data.referenceSellingPrice ? Number(data.referenceSellingPrice) : undefined,
      settlementMethod: data.settlementMethod || 'PERCENTAGE_OF_SALE',
      agreementId: data.agreementId || undefined,
      receivedDate: data.receivedDate || new Date().toISOString(),
      expiryDate: data.expiryDate || undefined,
      status: 'ACTIVE',
      notes: data.notes?.trim()
    };

    this.supplyBatches.set(id, newBatch);

    // Automatically update stock in product catalog and record inventory ledger
    const product = serverDb.products.find(p => p.id === data.productId || p.sku === data.productId);
    if (product) {
      const beforeStock = product.stock;
      product.stock += qty;
      product.supplierId = supplier.id;
      if (cost > 0) product.costPrice = cost;

      serverDb.inventoryTransactions.push({
        id: `tx-batch-${Date.now()}-${data.productId}`,
        timestamp: new Date().toISOString(),
        productId: product.id,
        productTitle: product.title,
        sku: product.sku || data.productId,
        type: 'STOCK_IN',
        quantityChange: qty,
        quantityBefore: beforeStock,
        quantityAfter: product.stock,
        reason: `Supply Batch Intake ${batchNumber} from ${supplier.companyName}`,
        operator,
        supplier: supplier.companyName,
        unitCost: cost,
        warehouseLocation: 'Central Fulfillment Hub'
      });
    }

    securityEngine.logAudit({
      operator,
      role: 'INVENTORY_MANAGER',
      action: 'SUPPLY_BATCH_RECEIVED',
      resource: 'SupplyBatch',
      resourceId: id,
      severity: 'INFO',
      category: 'INVENTORY',
      details: `Received supply batch ${batchNumber} (${qty} units @ ৳${cost}) from ${supplier.companyName}.`
    });

    return { success: true, batch: newBatch };
  }

  public updateSupplyBatch(id: string, data: Partial<SupplyBatch>, operator: string): { success: boolean; batch?: SupplyBatch; error?: string } {
    const existing = this.supplyBatches.get(id);
    if (!existing) return { success: false, error: 'Supply batch not found' };

    const remaining = Math.max(0, existing.quantityReceived - (data.quantitySold !== undefined ? data.quantitySold : existing.quantitySold) - (data.quantityReturned !== undefined ? data.quantityReturned : existing.quantityReturned) - (data.quantityDamaged !== undefined ? data.quantityDamaged : existing.quantityDamaged));

    const updated: SupplyBatch = {
      ...existing,
      ...data,
      id: existing.id,
      supplierId: existing.supplierId,
      productId: existing.productId,
      quantityRemaining: remaining,
      status: remaining === 0 ? 'DEPLETED' : (data.status || existing.status)
    };

    this.supplyBatches.set(id, updated);

    securityEngine.logAudit({
      operator,
      role: 'INVENTORY_MANAGER',
      action: 'SUPPLY_BATCH_UPDATED',
      resource: 'SupplyBatch',
      resourceId: id,
      severity: 'INFO',
      category: 'INVENTORY',
      details: `Updated supply batch ${updated.batchNumber}. Remaining: ${updated.quantityRemaining}. Status: ${updated.status}.`
    });

    return { success: true, batch: updated };
  }

  // =============================================================
  // Eligible Sales & Settlement Calculations
  // =============================================================

  public getAllEligibleSales(): SupplierEligibleSale[] {
    return Array.from(this.eligibleSales.values()).sort((a, b) => 
      new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
    );
  }

  public getEligibleSalesBySupplier(supplierId: string): SupplierEligibleSale[] {
    // Find all batches for this supplier
    const batchIds = new Set(
      Array.from(this.supplyBatches.values())
        .filter(b => b.supplierId === supplierId)
        .map(b => b.id)
    );

    // Or products assigned to this supplier
    const supplierProducts = new Set(
      serverDb.products.filter(p => p.supplierId === supplierId).map(p => p.id)
    );

    return Array.from(this.eligibleSales.values())
      .filter(es => (es.supplyBatchId && batchIds.has(es.supplyBatchId)) || supplierProducts.has(es.productId))
      .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }

  public calculateSupplierShareForSale(item: {
    productId: string;
    quantity: number;
    price: number;
    discount?: number;
  }): {
    supplierId?: string;
    batchId?: string;
    supplierShare: number;
    kisholoyShare: number;
    method: string;
    rule: string;
  } {
    const qty = Math.max(1, item.quantity || 1);
    const unitPrice = item.price;
    const netItemTotal = Math.max(0, (unitPrice * qty) - (item.discount || 0));

    // 1. Check if an active supply batch exists with remaining inventory
    const matchingBatch = Array.from(this.supplyBatches.values()).find(
      b => b.productId === item.productId && b.quantityRemaining > 0 && b.status === 'ACTIVE'
    ) || Array.from(this.supplyBatches.values()).find(b => b.productId === item.productId);

    let supplierId = matchingBatch?.supplierId;
    if (!supplierId) {
      const product = serverDb.products.find(p => p.id === item.productId || p.sku === item.productId);
      supplierId = product?.supplierId;
    }

    if (!supplierId) {
      // Direct store-owned inventory with no supplier
      return {
        supplierId: undefined,
        batchId: matchingBatch?.id,
        supplierShare: 0,
        kisholoyShare: netItemTotal,
        method: 'OWNED_INVENTORY',
        rule: 'Direct store-owned goods; 100% KISHOLOY revenue'
      };
    }

    // 2. Find applicable commercial agreement
    const agreement = Array.from(this.agreements.values()).find(
      a => a.supplierId === supplierId && a.status === 'ACTIVE' && (!a.productId || a.productId === item.productId)
    ) || this.agreements.get(matchingBatch?.agreementId || '');

    const method: SupplierSettlementMethod = agreement?.settlementMethod || matchingBatch?.settlementMethod || 'PERCENTAGE_OF_SALE';
    const basis: SupplierCalculationBasis = agreement?.calculationBasis || 'NET_SELLING_PRICE';

    let supplierShare = 0;
    let rule = '';

    const baseCalculationAmount = basis === 'GROSS_SELLING_PRICE' ? (unitPrice * qty) : netItemTotal;

    switch (method) {
      case 'FIXED_COST': {
        const costPerUnit = agreement?.supplierCost || matchingBatch?.supplierCost || 300;
        supplierShare = costPerUnit * qty;
        rule = `Fixed Cost ৳${costPerUnit.toLocaleString('en-BD')} × ${qty} unit(s) = ৳${supplierShare.toLocaleString('en-BD')}`;
        break;
      }
      case 'PERCENTAGE_OF_SALE': {
        const pct = agreement?.percentage || 85;
        supplierShare = Math.round((baseCalculationAmount * pct) / 100);
        rule = `${pct}% of ${basis === 'NET_SELLING_PRICE' ? 'Net' : 'Gross'} Sale (৳${baseCalculationAmount.toLocaleString('en-BD')}) = ৳${supplierShare.toLocaleString('en-BD')}`;
        break;
      }
      case 'FIXED_AMOUNT_PER_UNIT': {
        const fixed = agreement?.fixedAmount || matchingBatch?.supplierCost || 500;
        supplierShare = fixed * qty;
        rule = `Fixed ৳${fixed.toLocaleString('en-BD')} / unit × ${qty} = ৳${supplierShare.toLocaleString('en-BD')}`;
        break;
      }
      case 'REVENUE_SHARE': {
        const revPct = agreement?.percentage || 80;
        supplierShare = Math.round((netItemTotal * revPct) / 100);
        rule = `Revenue Share ${revPct}% of ৳${netItemTotal.toLocaleString('en-BD')} = ৳${supplierShare.toLocaleString('en-BD')}`;
        break;
      }
      default: {
        supplierShare = Math.round(netItemTotal * 0.85);
        rule = `Default 85% share = ৳${supplierShare.toLocaleString('en-BD')}`;
      }
    }

    const kisholoyShare = Math.max(0, netItemTotal - supplierShare);

    return {
      supplierId,
      batchId: matchingBatch?.id,
      supplierShare,
      kisholoyShare,
      method: `${method} (${basis})`,
      rule
    };
  }

  public processDeliveredOrder(order: any, operator: string): { processed: number; eligibleSales: SupplierEligibleSale[] } {
    if (!order || !order.items || !Array.isArray(order.items)) {
      return { processed: 0, eligibleSales: [] };
    }

    const createdSales: SupplierEligibleSale[] = [];

    order.items.forEach((item: any, idx: number) => {
      // Check if eligible sale already exists for this order item
      const existing = Array.from(this.eligibleSales.values()).find(
        es => es.orderId === order.id && es.productId === item.productId
      );
      if (existing) return;

      const calculation = this.calculateSupplierShareForSale({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: 0
      });

      if (!calculation.supplierId) return; // Skip owned products

      const id = `es-${Date.now()}-${idx}`;
      const eligibleSale: SupplierEligibleSale = {
        id,
        orderId: order.id,
        orderNumber: order.orderNumber || order.id,
        productId: item.productId,
        variantId: item.variantId,
        supplyBatchId: calculation.batchId,
        quantity: item.quantity,
        sellingPrice: item.price,
        netEligibleAmount: item.price * item.quantity,
        supplierShare: calculation.supplierShare,
        kisholoyShare: calculation.kisholoyShare,
        settlementMethodSnapshot: calculation.method,
        calculationRuleSnapshot: calculation.rule,
        status: 'PENDING_SETTLEMENT',
        saleDate: new Date().toISOString()
      };

      this.eligibleSales.set(id, eligibleSale);
      createdSales.push(eligibleSale);

      // Decrement remaining quantity in supply batch
      if (calculation.batchId) {
        const batch = this.supplyBatches.get(calculation.batchId);
        if (batch) {
          batch.quantitySold += item.quantity;
          batch.quantityRemaining = Math.max(0, batch.quantityRemaining - item.quantity);
          if (batch.quantityRemaining === 0) batch.status = 'DEPLETED';
          this.supplyBatches.set(batch.id, batch);
        }
      }
    });

    if (createdSales.length > 0) {
      securityEngine.logAudit({
        operator,
        role: 'ORDER_MANAGER',
        action: 'SUPPLIER_ELIGIBLE_SALES_RECORDED',
        resource: 'Order',
        resourceId: order.id,
        severity: 'INFO',
        category: 'FINANCIAL',
        details: `Recorded ${createdSales.length} supplier eligible sales snapshots for delivered order ${order.orderNumber || order.id}.`
      });
    }

    return { processed: createdSales.length, eligibleSales: createdSales };
  }

  public adjustReturnedOrder(orderId: string, returnData: any, operator: string): { adjusted: boolean; note?: string } {
    const sales = Array.from(this.eligibleSales.values()).filter(es => es.orderId === orderId);
    if (sales.length === 0) return { adjusted: false, note: 'No supplier sales linked to this order.' };

    sales.forEach(es => {
      es.status = 'ADJUSTED_RETURNED';
      this.eligibleSales.set(es.id, es);

      if (es.supplyBatchId) {
        const batch = this.supplyBatches.get(es.supplyBatchId);
        if (batch) {
          batch.quantityReturned += es.quantity;
          this.supplyBatches.set(batch.id, batch);
        }
      }
    });

    securityEngine.logAudit({
      operator,
      role: 'FINANCE',
      action: 'SUPPLIER_RETURN_ADJUSTMENT',
      resource: 'Order',
      resourceId: orderId,
      severity: 'WARNING',
      category: 'FINANCIAL',
      details: `Adjusted ${sales.length} supplier eligible sales for returned order ${orderId}. Marked as ADJUSTED_RETURNED.`
    });

    return { adjusted: true, note: `Adjusted ${sales.length} line items.` };
  }

  // =============================================================
  // Settlements & Payables APIs
  // =============================================================

  public getAllSettlements(): SupplierSettlement[] {
    return Array.from(this.settlements.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getSettlementsBySupplier(supplierId: string): SupplierSettlement[] {
    return Array.from(this.settlements.values())
      .filter(s => s.supplierId === supplierId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getSettlementById(id: string): SupplierSettlement | undefined {
    return this.settlements.get(id);
  }

  public getPurchaseOrderById(id: string): SupplierPurchaseOrder | undefined {
    return this.purchaseOrders.get(id);
  }

  public getAllPurchaseOrders(): SupplierPurchaseOrder[] {
    return Array.from(this.purchaseOrders.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPurchaseOrdersBySupplier(supplierId: string): SupplierPurchaseOrder[] {
    return this.getAllPurchaseOrders().filter(p => p.supplierId === supplierId);
  }

  public createSettlement(data: {
    supplierId: string;
    periodStart: string;
    periodEnd: string;
    salesIds?: string[];
  }, operator: string): { success: boolean; settlement?: SupplierSettlement; error?: string } {
    const supplier = this.suppliers.get(data.supplierId);
    if (!supplier) return { success: false, error: 'Supplier not found' };

    // Find eligible sales for this supplier
    const allSupplierSales = this.getEligibleSalesBySupplier(data.supplierId);
    const candidateSales = allSupplierSales.filter(es => {
      if (data.salesIds && data.salesIds.length > 0) {
        return data.salesIds.includes(es.id);
      }
      return es.status === 'PENDING_SETTLEMENT';
    });

    if (candidateSales.length === 0) {
      return { success: false, error: 'No pending eligible sales found for settlement generation in the selected period.' };
    }

    const grossSales = candidateSales.reduce((sum, es) => sum + es.netEligibleAmount, 0);
    const supplierShare = candidateSales.reduce((sum, es) => sum + es.supplierShare, 0);
    const kisholoyShare = candidateSales.reduce((sum, es) => sum + es.kisholoyShare, 0);

    const returnsAdjustment = candidateSales
      .filter(es => es.status === 'ADJUSTED_RETURNED')
      .reduce((sum, es) => sum + es.supplierShare, 0);

    const previousSettlements = this.getSettlementsBySupplier(data.supplierId);
    const previousSupplierDue = previousSettlements
      .filter(s => s.status === 'PENDING' || s.status === 'PARTIALLY_PAID')
      .reduce((sum, s) => sum + s.remainingDue, 0);

    const currentPayable = Math.max(0, supplierShare - returnsAdjustment);
    const remainingDue = currentPayable;

    const count = this.settlements.size + 1;
    const settlementNumber = `SET-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    const id = `set-${Date.now()}`;

    const newSettlement: SupplierSettlement = {
      id,
      settlementNumber,
      supplierId: data.supplierId,
      periodStart: data.periodStart || new Date(Date.now() - 30 * 86400000).toISOString(),
      periodEnd: data.periodEnd || new Date().toISOString(),
      grossSales,
      supplierShare,
      kisholoyShare,
      returnsAdjustment,
      refundAdjustment: 0,
      previousSupplierDue,
      paymentsAlreadyMade: 0,
      currentPayable,
      remainingDue,
      status: 'PENDING',
      eligibleSalesCount: candidateSales.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.settlements.set(id, newSettlement);

    // Mark sales as included
    candidateSales.forEach(es => {
      es.status = 'INCLUDED_IN_SETTLEMENT';
      this.eligibleSales.set(es.id, es);
    });

    // Update supplier ledger balances
    this.recalculateSupplierLedger(data.supplierId);

    securityEngine.logAudit({
      operator,
      role: 'FINANCE',
      action: 'SUPPLIER_SETTLEMENT_GENERATED',
      resource: 'SupplierSettlement',
      resourceId: id,
      severity: 'INFO',
      category: 'FINANCIAL',
      details: `Generated settlement ${settlementNumber} for ${supplier.companyName}: Payable ৳${currentPayable.toLocaleString('en-BD')} across ${candidateSales.length} sales.`
    });

    return { success: true, settlement: newSettlement };
  }

  public updateSettlementStatus(id: string, status: SupplierSettlement['status'], operator: string): { success: boolean; settlement?: SupplierSettlement; error?: string } {
    const existing = this.settlements.get(id);
    if (!existing) return { success: false, error: 'Settlement not found' };

    existing.status = status;
    existing.updatedAt = new Date().toISOString();
    this.settlements.set(id, existing);

    this.recalculateSupplierLedger(existing.supplierId);

    securityEngine.logAudit({
      operator,
      role: 'FINANCE',
      action: 'SUPPLIER_SETTLEMENT_STATUS_UPDATED',
      resource: 'SupplierSettlement',
      resourceId: id,
      severity: 'INFO',
      category: 'FINANCIAL',
      details: `Updated settlement ${existing.settlementNumber} status to ${status}.`
    });

    return { success: true, settlement: existing };
  }

  public recordSettlementPayment(settlementId: string, paymentData: {
    amount: number;
    paymentMethod: any;
    referenceNumber?: string;
    notes?: string;
  }, operator: string): { success: boolean; settlement?: SupplierSettlement; payment?: SupplierPayment; error?: string } {
    const settlement = this.settlements.get(settlementId);
    if (!settlement) return { success: false, error: 'Settlement not found' };

    const supplier = this.suppliers.get(settlement.supplierId);
    if (!supplier) return { success: false, error: 'Supplier not found' };

    const payAmount = Math.max(1, Math.round(Number(paymentData.amount) || 0));
    if (payAmount > settlement.remainingDue) {
      return { success: false, error: `Payment amount (৳${payAmount.toLocaleString()}) exceeds settlement remaining balance (৳${settlement.remainingDue.toLocaleString()}).` };
    }

    // Record formal Supplier Payment Voucher
    const pmtResult = this.recordSupplierPayment({
      supplierId: settlement.supplierId,
      amount: payAmount,
      paymentMethod: paymentData.paymentMethod || 'BANK_TRANSFER',
      referenceNumber: paymentData.referenceNumber || `SETT-PAY-${Date.now().toString().slice(-6)}`,
      notes: `Settlement Disbursement for ${settlement.settlementNumber}. ${paymentData.notes || ''}`
    }, operator);

    if (!pmtResult.success) {
      return { success: false, error: pmtResult.error };
    }

    settlement.paymentsAlreadyMade += payAmount;
    settlement.remainingDue = Math.max(0, settlement.currentPayable - settlement.paymentsAlreadyMade);
    settlement.status = settlement.remainingDue === 0 ? 'PAID' : 'PARTIALLY_PAID';
    settlement.updatedAt = new Date().toISOString();

    this.settlements.set(settlementId, settlement);
    this.recalculateSupplierLedger(settlement.supplierId);

    securityEngine.logAudit({
      operator,
      role: 'FINANCE',
      action: 'SETTLEMENT_PAYMENT_DISBURSED',
      resource: 'SupplierSettlement',
      resourceId: settlementId,
      severity: 'INFO',
      category: 'FINANCIAL',
      details: `Disbursed ৳${payAmount.toLocaleString('en-BD')} against ${settlement.settlementNumber}. Remaining Due: ৳${settlement.remainingDue.toLocaleString('en-BD')}.`
    });

    return { success: true, settlement, payment: pmtResult.payment };
  }

  // =============================================================
  // Supplier Statements Generator
  // =============================================================

  public generateSupplierStatement(supplierId: string, periodStart?: string, periodEnd?: string) {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) return null;

    const batches = this.getBatchesBySupplier(supplierId);
    const agreements = this.getAgreementsBySupplier(supplierId);
    const sales = this.getEligibleSalesBySupplier(supplierId);
    const settlements = this.getSettlementsBySupplier(supplierId);
    const payments = Array.from(this.payments.values()).filter(p => p.supplierId === supplierId);

    const totalSupplied = batches.reduce((sum, b) => sum + (b.quantityReceived * b.supplierCost), 0);
    const totalSoldUnits = batches.reduce((sum, b) => sum + b.quantitySold, 0);
    const totalRemainingUnits = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
    const grossSalesValue = sales.reduce((sum, es) => sum + es.netEligibleAmount, 0);
    const supplierEarnings = sales.reduce((sum, es) => sum + es.supplierShare, 0);
    const kisholoyMargin = sales.reduce((sum, es) => sum + es.kisholoyShare, 0);
    const totalDisbursed = payments.reduce((sum, p) => sum + p.amount, 0);
    const netOutstandingDue = Math.max(0, supplier.totalDue);

    return {
      statementNumber: `STMT-${supplier.code}-${new Date().getFullYear()}`,
      generatedAt: new Date().toISOString(),
      period: {
        start: periodStart || '2026-01-01T00:00:00.000Z',
        end: periodEnd || new Date().toISOString()
      },
      supplier: {
        id: supplier.id,
        code: supplier.code,
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        bankDetails: supplier.bankDetails,
        mfsDetails: supplier.mfsDetails,
        paymentTerms: supplier.paymentTerms
      },
      financialSummary: {
        totalSuppliedBdt: totalSupplied,
        totalSoldUnits,
        totalRemainingUnits,
        grossSalesValue,
        supplierEarnings,
        kisholoyMargin,
        totalDisbursed,
        netOutstandingDue
      },
      activeAgreements: agreements,
      batches,
      recentSales: sales.slice(0, 50),
      settlements,
      payments
    };
  }

  public getSupplyChainMetrics() {
    const allSuppliers = this.getAllSuppliers();
    const allBatches = this.getAllBatches();
    const allSales = this.getAllEligibleSales();
    const allSettlements = this.getAllSettlements();
    const allPayments = Array.from(this.payments.values());

    const totalBatches = allBatches.length;
    const totalUnitsReceived = allBatches.reduce((sum, b) => sum + b.quantityReceived, 0);
    const totalUnitsSold = allBatches.reduce((sum, b) => sum + b.quantitySold, 0);
    const totalUnitsInStock = allBatches.reduce((sum, b) => sum + b.quantityRemaining, 0);

    const grossSalesBdt = allSales.reduce((sum, es) => sum + es.netEligibleAmount, 0);
    const totalSupplierEarningsBdt = allSales.reduce((sum, es) => sum + es.supplierShare, 0);
    const totalKisholoyMarginBdt = allSales.reduce((sum, es) => sum + es.kisholoyShare, 0);

    const totalDisbursedBdt = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingSettlementsCount = allSettlements.filter(s => s.status === 'PENDING' || s.status === 'PARTIALLY_PAID').length;
    const totalPayableDueBdt = allSettlements
      .filter(s => s.status !== 'CANCELLED' && s.status !== 'PAID')
      .reduce((sum, s) => sum + s.remainingDue, 0);

    return {
      totalSuppliers: allSuppliers.length,
      totalBatches,
      totalUnitsReceived,
      totalUnitsSold,
      totalUnitsInStock,
      grossSalesBdt,
      totalSupplierEarningsBdt,
      totalKisholoyMarginBdt,
      totalDisbursedBdt,
      pendingSettlementsCount,
      totalPayableDueBdt,
      marginRetentionRatePct: grossSalesBdt > 0 ? Number(((totalKisholoyMarginBdt / grossSalesBdt) * 100).toFixed(1)) : 0
    };
  }
}

export const supplierEngine = new SupplierEngine();
