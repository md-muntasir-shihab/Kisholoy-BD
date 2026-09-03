/**
 * Server-Side Multi-Warehouse, Hub Routing & Advanced Fulfillment Engine
 * @license Apache-2.0
 */

import { 
  WarehouseHub, WarehouseStockItem, StockTransferOrder, 
  FulfillmentRoutingDecision, RoutingRuleConfig, PickList, 
  DispatchManifest, Order, Product, InventoryTransaction 
} from '../src/types';
import { 
  INITIAL_WAREHOUSES, INITIAL_WAREHOUSE_STOCKS, 
  INITIAL_STOCK_TRANSFERS, INITIAL_ROUTING_RULES, 
  INITIAL_PICK_LISTS, INITIAL_DISPATCH_MANIFESTS 
} from '../src/data/mockData';
import { serverDb as db } from './db';

export class FulfillmentEngine {
  warehouses: WarehouseHub[] = JSON.parse(JSON.stringify(INITIAL_WAREHOUSES));
  warehouseStocks: WarehouseStockItem[] = JSON.parse(JSON.stringify(INITIAL_WAREHOUSE_STOCKS));
  stockTransfers: StockTransferOrder[] = JSON.parse(JSON.stringify(INITIAL_STOCK_TRANSFERS));
  routingRules: RoutingRuleConfig[] = JSON.parse(JSON.stringify(INITIAL_ROUTING_RULES));
  pickLists: PickList[] = JSON.parse(JSON.stringify(INITIAL_PICK_LISTS));
  dispatchManifests: DispatchManifest[] = JSON.parse(JSON.stringify(INITIAL_DISPATCH_MANIFESTS));

  // ==========================================
  // 1. WAREHOUSE HUBS & HUBS MANAGEMENT
  // ==========================================

  getWarehouses(): WarehouseHub[] {
    return this.warehouses;
  }

  getWarehouseById(id: string): WarehouseHub | undefined {
    return this.warehouses.find(w => w.id === id || w.code === id);
  }

  saveWarehouse(data: Partial<WarehouseHub> & { name: string; division: any; district: string }): WarehouseHub {
    if (data.id) {
      const idx = this.warehouses.findIndex(w => w.id === data.id);
      if (idx >= 0) {
        this.warehouses[idx] = { ...this.warehouses[idx], ...data };
        return this.warehouses[idx];
      }
    }

    // Create new warehouse
    const newId = `wh-${data.district.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newCode = `${data.district.substring(0, 3).toUpperCase()}-0${this.warehouses.length + 1}`;
    const newWarehouse: WarehouseHub = {
      id: newId,
      code: data.code || newCode,
      name: data.name,
      nameBn: data.nameBn || data.name,
      type: data.type || 'REGIONAL_DEPOT',
      address: data.address || `${data.district}, Bangladesh`,
      addressBn: data.addressBn,
      division: data.division,
      district: data.district,
      thana: data.thana || data.district,
      contactPerson: data.contactPerson || 'Hub Lead',
      phone: data.phone || '+8801700000000',
      email: data.email || `hub.${data.district.toLowerCase()}@kisholoy.com.bd`,
      isPrimary: Boolean(data.isPrimary),
      isActive: data.isActive !== undefined ? data.isActive : true,
      capacityUnits: data.capacityUnits || 10000,
      currentUnits: data.currentUnits || 0,
      dispatchCutoffTime: data.dispatchCutoffTime || '16:00',
      courierPartners: data.courierPartners || ['Steadfast', 'Pathao'],
      coverageDivisions: data.coverageDivisions || [data.division]
    };

    if (newWarehouse.isPrimary) {
      this.warehouses.forEach(w => w.isPrimary = false);
    }

    this.warehouses.push(newWarehouse);
    db.addAuditLog('WAREHOUSE_CREATED', 'Warehouse', newWarehouse.code, `New warehouse hub ${newWarehouse.name} added.`);
    return newWarehouse;
  }

  toggleWarehouse(id: string, active: boolean, operator = 'ADMIN'): boolean {
    const wh = this.getWarehouseById(id);
    if (!wh) return false;
    wh.isActive = active;
    db.addAuditLog('WAREHOUSE_STATUS_CHANGED', 'Warehouse', wh.code, `Warehouse ${wh.name} set to ${active ? 'ACTIVE' : 'INACTIVE'} by ${operator}`);
    return true;
  }

  // ==========================================
  // 2. STOCK MATRIX & BIN LOCATIONS
  // ==========================================

  getWarehouseStocks(warehouseId?: string, productId?: string): WarehouseStockItem[] {
    return this.warehouseStocks.filter(s => {
      if (warehouseId && warehouseId !== 'ALL' && s.warehouseId !== warehouseId && s.warehouseCode !== warehouseId) {
        return false;
      }
      if (productId && productId !== 'ALL' && s.productId !== productId && s.sku !== productId) {
        return false;
      }
      return true;
    });
  }

  updateBinLocation(params: {
    stockId: string;
    aisle: string;
    shelf: string;
    bin: string;
    reorderLevel?: number;
    reorderQuantity?: number;
    operator?: string;
  }): WarehouseStockItem | null {
    const item = this.warehouseStocks.find(s => s.id === params.stockId);
    if (!item) return null;

    item.aisle = params.aisle;
    item.shelf = params.shelf;
    item.bin = params.bin;
    if (params.reorderLevel !== undefined) item.reorderLevel = params.reorderLevel;
    if (params.reorderQuantity !== undefined) item.reorderQuantity = params.reorderQuantity;

    db.addAuditLog(
      'BIN_LOCATION_UPDATED',
      'Inventory',
      item.sku,
      `Bin coordinates updated for ${item.productTitle} at ${item.warehouseName}: ${params.aisle}/${params.shelf}/${params.bin}`
    );
    return item;
  }

  // ==========================================
  // 3. INTELLIGENT ORDER ROUTING ENGINE
  // ==========================================

  routeOrder(order: Order): FulfillmentRoutingDecision {
    const division = order.shippingAddress?.division || 'Dhaka';
    const district = order.shippingAddress?.district || 'Dhaka';

    // 1. Find matching rule
    const matchingRule = this.routingRules
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority)
      .find(r => {
        if (r.conditionType === 'CUSTOMER_DIVISION') {
          return r.matchValue.toLowerCase() === division.toLowerCase();
        }
        return false;
      });

    let targetWarehouse: WarehouseHub | undefined;
    let strategyUsed: FulfillmentRoutingDecision['strategyUsed'] = 'PROXIMITY_FIRST';
    let routingReason = '';

    if (matchingRule) {
      targetWarehouse = this.warehouses.find(w => w.id === matchingRule.targetWarehouseId && w.isActive);
      if (targetWarehouse) {
        routingReason = `Matched Rule: ${matchingRule.name} for ${division} Division.`;
      }
    }

    // If no target rule or target hub inactive, find by division coverage
    if (!targetWarehouse) {
      targetWarehouse = this.warehouses.find(w => w.isActive && w.coverageDivisions?.includes(division));
    }

    // Default to Primary Central Hub
    const primaryHub = this.warehouses.find(w => w.isPrimary && w.isActive) || this.warehouses[0];
    if (!targetWarehouse) {
      targetWarehouse = primaryHub;
      strategyUsed = 'SINGLE_HUB_CONSOLIDATION';
      routingReason = `Routed to Central Primary Hub (${primaryHub.name}) for broad nationwide distribution.`;
    }

    // 2. Inventory Availability Check across candidate hub
    const orderItems = order.items || [];
    let candidateHasAllStock = true;
    const splitCandidates: { warehouseId: string; warehouseName: string; itemSkus: string[]; quantity: number }[] = [];

    for (const item of orderItems) {
      const stockEntry = this.warehouseStocks.find(
        s => s.warehouseId === targetWarehouse!.id && (s.productId === item.productId || s.sku === item.sku)
      );

      if (!stockEntry || stockEntry.available < item.quantity) {
        candidateHasAllStock = false;
        break;
      }
    }

    // If candidate hub lacks stock, fallback to central hub or evaluate split
    if (!candidateHasAllStock && targetWarehouse.id !== primaryHub.id) {
      let centralHasAllStock = true;
      for (const item of orderItems) {
        const centralStock = this.warehouseStocks.find(
          s => s.warehouseId === primaryHub.id && (s.productId === item.productId || s.sku === item.sku)
        );
        if (!centralStock || centralStock.available < item.quantity) {
          centralHasAllStock = false;
          break;
        }
      }

      if (centralHasAllStock) {
        routingReason = `Regional Hub (${targetWarehouse.name}) lacked sufficient stock. Routed to Central Hub (${primaryHub.name}) which holds complete stock inventory.`;
        targetWarehouse = primaryHub;
        strategyUsed = 'STOCK_AVAILABILITY';
      } else {
        // Evaluate split shipment or consolidated sourcing
        strategyUsed = 'STOCK_AVAILABILITY';
        routingReason = `Stock distributed across multiple hubs. Assigned to primary hub with backorder/STO allocation.`;
        targetWarehouse = primaryHub;
      }
    }

    // 3. Calculate estimated dispatch cutoff
    const cutoffTime = targetWarehouse.dispatchCutoffTime || '17:00';
    const now = new Date();
    const [cutoffHours, cutoffMinutes] = cutoffTime.split(':').map(Number);
    const cutoffDate = new Date(now);
    cutoffDate.setHours(cutoffHours || 17, cutoffMinutes || 0, 0, 0);

    const isPastCutoff = now > cutoffDate;
    const dispatchDate = new Date(now);
    if (isPastCutoff) {
      dispatchDate.setDate(dispatchDate.getDate() + 1);
    }
    const estimatedDispatchTime = `${dispatchDate.toISOString().split('T')[0]} at ${cutoffTime} BST`;

    const decision: FulfillmentRoutingDecision = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      assignedWarehouseId: targetWarehouse.id,
      assignedWarehouseName: targetWarehouse.name,
      assignedWarehouseCode: targetWarehouse.code,
      routingReason: routingReason || `Optimal hub routing for ${district}, ${division}.`,
      strategyUsed,
      estimatedDispatchTime,
      isSplitShipment: splitCandidates.length > 1,
      splits: splitCandidates.length > 1 ? splitCandidates : undefined,
      evaluatedAt: new Date().toISOString()
    };

    // Update Order's fulfillment metadata
    order.fulfillment = {
      assignedWarehouseId: targetWarehouse.id,
      assignedWarehouseName: targetWarehouse.name,
      assignedWarehouseCode: targetWarehouse.code,
      routingReason: decision.routingReason,
      routedAt: decision.evaluatedAt,
      dispatchCutoff: estimatedDispatchTime
    };

    return decision;
  }

  // ==========================================
  // 4. STOCK TRANSFER ORDERS (STOs)
  // ==========================================

  getStockTransfers(): StockTransferOrder[] {
    return this.stockTransfers;
  }

  createStockTransfer(params: {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    items: { productId: string; sku: string; productTitle: string; quantityRequested: number; unitCost: number; notes?: string }[];
    carrier?: string;
    notes?: string;
    requestedBy: string;
  }): StockTransferOrder {
    const srcWh = this.getWarehouseById(params.sourceWarehouseId) || this.warehouses[0];
    const dstWh = this.getWarehouseById(params.destinationWarehouseId) || this.warehouses[1];

    const transferNum = `STO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalUnits = params.items.reduce((sum, item) => sum + item.quantityRequested, 0);
    const totalCost = params.items.reduce((sum, item) => sum + (item.quantityRequested * (item.unitCost || 0)), 0);

    const transferOrder: StockTransferOrder = {
      id: `sto-${Date.now()}`,
      transferNumber: transferNum,
      sourceWarehouseId: srcWh.id,
      sourceWarehouseName: srcWh.name,
      sourceWarehouseCode: srcWh.code,
      destinationWarehouseId: dstWh.id,
      destinationWarehouseName: dstWh.name,
      destinationWarehouseCode: dstWh.code,
      status: 'REQUESTED',
      items: params.items.map(item => ({
        ...item,
        quantitySent: item.quantityRequested
      })),
      totalUnitsRequested: totalUnits,
      totalUnitsSent: totalUnits,
      totalCostValue: totalCost,
      carrier: params.carrier || 'Kisholoy Internal Logistics Fleet',
      trackingOrGatePass: `GATE-${srcWh.code}-${dstWh.code}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: params.notes,
      requestedBy: params.requestedBy,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          status: 'REQUESTED',
          timestamp: new Date().toISOString(),
          note: `Inter-warehouse transfer requested for ${totalUnits} units (Valuation: ৳${totalCost.toLocaleString()}).`,
          operator: params.requestedBy
        }
      ]
    };

    this.stockTransfers.unshift(transferOrder);
    db.addAuditLog(
      'STOCK_TRANSFER_CREATED',
      'Inventory',
      transferNum,
      `STO ${transferNum} initiated from ${srcWh.code} to ${dstWh.code} (${totalUnits} units)`
    );

    return transferOrder;
  }

  approveStockTransfer(transferId: string, approvedBy: string): StockTransferOrder | null {
    const transfer = this.stockTransfers.find(t => t.id === transferId);
    if (!transfer) return null;

    transfer.status = 'APPROVED';
    transfer.approvedBy = approvedBy;
    transfer.timeline.push({
      status: 'APPROVED',
      timestamp: new Date().toISOString(),
      note: 'Transfer request approved. Ready for dispatch.',
      operator: approvedBy
    });

    db.addAuditLog('STOCK_TRANSFER_APPROVED', 'Inventory', transfer.transferNumber, `STO approved by ${approvedBy}`);
    return transfer;
  }

  dispatchStockTransfer(params: {
    transferId: string;
    trackingOrGatePass?: string;
    carrier?: string;
    operator: string;
  }): StockTransferOrder | null {
    const transfer = this.stockTransfers.find(t => t.id === params.transferId);
    if (!transfer) return null;

    transfer.status = 'IN_TRANSIT';
    transfer.dispatchedAt = new Date().toISOString();
    if (params.trackingOrGatePass) transfer.trackingOrGatePass = params.trackingOrGatePass;
    if (params.carrier) transfer.carrier = params.carrier;

    // Deduct stock from source warehouse
    transfer.items.forEach(item => {
      const srcStock = this.warehouseStocks.find(
        s => s.warehouseId === transfer.sourceWarehouseId && (s.productId === item.productId || s.sku === item.sku)
      );
      if (srcStock) {
        srcStock.stock = Math.max(0, srcStock.stock - item.quantitySent);
        srcStock.available = Math.max(0, srcStock.stock - srcStock.reserved);
      }
    });

    transfer.timeline.push({
      status: 'IN_TRANSIT',
      timestamp: new Date().toISOString(),
      note: `Dispatched via ${transfer.carrier}. Gate Pass: ${transfer.trackingOrGatePass}`,
      operator: params.operator
    });

    db.addAuditLog('STOCK_TRANSFER_DISPATCHED', 'Inventory', transfer.transferNumber, `STO dispatched via ${transfer.carrier}`);
    return transfer;
  }

  receiveStockTransfer(params: {
    transferId: string;
    receivedBy: string;
    notes?: string;
  }): StockTransferOrder | null {
    const transfer = this.stockTransfers.find(t => t.id === params.transferId);
    if (!transfer) return null;

    transfer.status = 'RECEIVED';
    transfer.receivedAt = new Date().toISOString();
    transfer.receivedBy = params.receivedBy;

    // Book stock into destination warehouse
    transfer.items.forEach(item => {
      item.quantityReceived = item.quantitySent;
      let dstStock = this.warehouseStocks.find(
        s => s.warehouseId === transfer.destinationWarehouseId && (s.productId === item.productId || s.sku === item.sku)
      );

      if (dstStock) {
        dstStock.stock += item.quantitySent;
        dstStock.available = Math.max(0, dstStock.stock - dstStock.reserved);
        dstStock.lastRestockedAt = new Date().toISOString();
      } else {
        // Create new warehouse stock item
        const newStockItem: WarehouseStockItem = {
          id: `ws-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          warehouseId: transfer.destinationWarehouseId,
          warehouseCode: transfer.destinationWarehouseCode,
          warehouseName: transfer.destinationWarehouseName,
          productId: item.productId,
          productTitle: item.productTitle,
          sku: item.sku,
          stock: item.quantitySent,
          reserved: 0,
          available: item.quantitySent,
          aisle: 'Aisle-A',
          shelf: 'Shelf-01',
          bin: 'Bin-01',
          reorderLevel: 3,
          reorderQuantity: 10,
          unitCost: item.unitCost,
          lastRestockedAt: new Date().toISOString()
        };
        this.warehouseStocks.push(newStockItem);
      }
    });

    transfer.timeline.push({
      status: 'RECEIVED',
      timestamp: new Date().toISOString(),
      note: `All units received and booked into inventory ledger. ${params.notes || ''}`,
      operator: params.receivedBy
    });

    db.addAuditLog('STOCK_TRANSFER_RECEIVED', 'Inventory', transfer.transferNumber, `STO successfully received by ${params.receivedBy}`);
    return transfer;
  }

  // ==========================================
  // 5. DIGITAL PICK LISTS & WAVE PLANNING
  // ==========================================

  getPickLists(): PickList[] {
    return this.pickLists;
  }

  generatePickList(params: {
    warehouseId: string;
    orderIds: string[];
    assignedPicker: string;
  }): PickList {
    const wh = this.getWarehouseById(params.warehouseId) || this.warehouses[0];
    const matchingOrders = db.orders.filter(o => params.orderIds.includes(o.id));

    // Aggregate items across orders
    const itemMap = new Map<string, PickList['items'][0]>();

    matchingOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const stock = this.warehouseStocks.find(
          s => s.warehouseId === wh.id && (s.productId === item.productId || s.sku === item.sku)
        );

        const aisle = stock?.aisle || 'Aisle-General';
        const shelf = stock?.shelf || 'Shelf-01';
        const bin = stock?.bin || 'Bin-01';
        const key = `${item.sku}-${aisle}-${shelf}-${bin}`;

        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!;
          existing.quantity += item.quantity;
          if (!existing.orderNumbers.includes(order.orderNumber)) {
            existing.orderNumbers.push(order.orderNumber);
          }
        } else {
          itemMap.set(key, {
            productId: item.productId,
            sku: item.sku,
            productTitle: item.title,
            quantity: item.quantity,
            aisle,
            shelf,
            bin,
            orderNumbers: [order.orderNumber],
            picked: false
          });
        }
      });
    });

    // Sort items by physical warehouse coordinates (Aisle -> Shelf -> Bin) for optimal walking route
    const sortedItems = Array.from(itemMap.values()).sort((a, b) => {
      if (a.aisle !== b.aisle) return a.aisle.localeCompare(b.aisle);
      if (a.shelf !== b.shelf) return a.shelf.localeCompare(b.shelf);
      return a.bin.localeCompare(b.bin);
    });

    const totalUnits = sortedItems.reduce((s, i) => s + i.quantity, 0);
    const pickListNum = `PL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const pickList: PickList = {
      id: `pl-${Date.now()}`,
      pickListNumber: pickListNum,
      warehouseId: wh.id,
      warehouseName: wh.name,
      warehouseCode: wh.code,
      orderIds: params.orderIds,
      orderNumbers: matchingOrders.map(o => o.orderNumber),
      status: 'GENERATED',
      assignedPicker: params.assignedPicker,
      items: sortedItems,
      totalUnits,
      pickedUnits: 0,
      createdAt: new Date().toISOString()
    };

    this.pickLists.unshift(pickList);

    // Update orders with pick list reference
    matchingOrders.forEach(o => {
      if (!o.fulfillment) {
        this.routeOrder(o);
      }
      if (o.fulfillment) {
        o.fulfillment.pickListId = pickList.id;
      }
    });

    db.addAuditLog('PICK_LIST_GENERATED', 'Fulfillment', pickListNum, `Pick list created for ${matchingOrders.length} orders (${totalUnits} units)`);
    return pickList;
  }

  togglePickItem(pickListId: string, sku: string, picked: boolean): PickList | null {
    const pl = this.pickLists.find(p => p.id === pickListId);
    if (!pl) return null;

    const item = pl.items.find(i => i.sku === sku);
    if (item) {
      item.picked = picked;
      pl.pickedUnits = pl.items.filter(i => i.picked).reduce((s, i) => s + i.quantity, 0);

      if (pl.pickedUnits === pl.totalUnits) {
        pl.status = 'PICKED';
        pl.completedAt = new Date().toISOString();
      } else if (pl.pickedUnits > 0) {
        pl.status = 'IN_PROGRESS';
      }
    }

    return pl;
  }

  // ==========================================
  // 6. DISPATCH MANIFEST BATCHING
  // ==========================================

  getDispatchManifests(): DispatchManifest[] {
    return this.dispatchManifests;
  }

  generateDispatchManifest(params: {
    warehouseId: string;
    courier: DispatchManifest['courier'];
    orderIds: string[];
    driverName?: string;
    driverPhone?: string;
    vehicleNumber?: string;
    operator: string;
  }): DispatchManifest {
    const wh = this.getWarehouseById(params.warehouseId) || this.warehouses[0];
    const orders = db.orders.filter(o => params.orderIds.includes(o.id));

    const manifestNum = `MNF-${params.courier.substring(0, 4).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const manifestOrders: DispatchManifest['orders'] = orders.map(o => ({
      orderId: o.id,
      orderNumber: o.orderNumber,
      trackingId: o.courier?.trackingId || `${params.courier.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: o.customer.name,
      customerPhone: o.customer.phone,
      district: o.shippingAddress?.district || 'Dhaka',
      codAmount: o.paymentMethod === 'COD' ? o.total : 0,
      weightKg: 0.8,
      packageCount: 1
    }));

    const totalCod = manifestOrders.reduce((sum, o) => sum + o.codAmount, 0);
    const totalWeight = manifestOrders.reduce((sum, o) => sum + o.weightKg, 0);

    const manifest: DispatchManifest = {
      id: `mnf-${Date.now()}`,
      manifestNumber: manifestNum,
      warehouseId: wh.id,
      warehouseName: wh.name,
      warehouseCode: wh.code,
      courier: params.courier,
      ordersCount: orders.length,
      totalCodAmount: totalCod,
      totalWeightKg: Number(totalWeight.toFixed(1)),
      driverName: params.driverName,
      driverPhone: params.driverPhone,
      vehicleNumber: params.vehicleNumber,
      status: 'CREATED',
      operator: params.operator,
      createdAt: new Date().toISOString(),
      orders: manifestOrders
    };

    this.dispatchManifests.unshift(manifest);

    // Update order statuses
    orders.forEach(o => {
      o.orderStatus = 'SHIPPED';
      if (!o.courier) {
        o.courier = { provider: params.courier, status: 'PICKED_UP' };
      } else {
        o.courier.status = 'PICKED_UP';
        o.courier.dispatchedAt = new Date().toISOString();
      }
      if (o.fulfillment) {
        o.fulfillment.manifestId = manifest.id;
      }
      o.timeline.push({
        status: 'SHIPPED',
        timestamp: new Date().toISOString(),
        note: `Dispatched on Courier Manifest ${manifestNum} via ${params.courier}.`,
        updatedBy: params.operator
      });
    });

    db.addAuditLog(
      'DISPATCH_MANIFEST_CREATED',
      'Fulfillment',
      manifestNum,
      `Batch dispatch manifest created for ${orders.length} orders via ${params.courier} (COD: ৳${totalCod.toLocaleString()})`
    );

    return manifest;
  }

  handoverManifest(manifestId: string, operator: string): DispatchManifest | null {
    const mnf = this.dispatchManifests.find(m => m.id === manifestId);
    if (!mnf) return null;

    mnf.status = 'HANDED_OVER';
    mnf.handedOverAt = new Date().toISOString();
    db.addAuditLog('MANIFEST_HANDED_OVER', 'Fulfillment', mnf.manifestNumber, `Manifest parcels handed over to ${mnf.courier} rider/driver`);
    return mnf;
  }
}

export const fulfillmentEngine = new FulfillmentEngine();
