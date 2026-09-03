/**
 * Server-Side Logistics & Courier Services (Steadfast & Pathao)
 * @license Apache-2.0
 */

import { serverDb } from './db';

export interface ConsignmentBookingRequest {
  orderId: string;
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number;
  note?: string;
  courierProvider: 'Steadfast' | 'Pathao';
}

export interface ConsignmentBookingResponse {
  success: boolean;
  trackingId: string;
  consignmentId: string;
  provider: 'Steadfast' | 'Pathao';
  status: string;
  estimatedDeliveryDate: string;
}

export class CourierService {
  /**
   * Book consignment order with courier API
   */
  async bookConsignment(req: ConsignmentBookingRequest): Promise<ConsignmentBookingResponse> {
    const trackingId = `${req.courierProvider.substring(0, 2).toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const consignmentId = `CID-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // In production, this would call Steadfast API POST /create_order or Pathao API POST /aladdin/api/v1/orders
    const order = serverDb.getOrderById(req.orderId);
    if (order) {
      order.orderStatus = 'READY_TO_SHIP';
      order.courier = {
        provider: req.courierProvider,
        trackingId,
        consignmentId,
        status: 'CREATED',
        dispatchedAt: new Date().toISOString(),
        estimatedDelivery: '2026-09-03'
      };

      order.timeline.push({
        status: 'READY_TO_SHIP',
        timestamp: new Date().toISOString(),
        note: `Consignment booked with ${req.courierProvider}. Tracking Code: ${trackingId}`,
        updatedBy: 'COURIER_API'
      });

      serverDb.addAuditLog(
        'COURIER_BOOKING',
        'Logistics',
        req.orderNumber,
        `Consignment ${consignmentId} booked with ${req.courierProvider} (Tracking: ${trackingId})`
      );
    }

    return {
      success: true,
      trackingId,
      consignmentId,
      provider: req.courierProvider,
      status: 'CREATED',
      estimatedDeliveryDate: '2026-09-03'
    };
  }

  /**
   * Process incoming webhook status updates from courier
   */
  async processCourierWebhook(payload: {
    consignment_id: string;
    tracking_id: string;
    status: 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'cancelled';
    note?: string;
  }): Promise<{ updated: boolean; message: string }> {
    const order = serverDb.orders.find(o => 
      o.courier?.consignmentId === payload.consignment_id ||
      o.courier?.trackingId === payload.tracking_id
    );

    if (!order) {
      return { updated: false, message: 'No matching order found for courier tracking reference.' };
    }

    let nextOrderStatus = order.orderStatus;
    let nextCourierStatus = order.courier?.status || 'CREATED';

    if (payload.status === 'in_transit') {
      nextOrderStatus = 'SHIPPED';
      nextCourierStatus = 'IN_TRANSIT';
    } else if (payload.status === 'out_for_delivery') {
      nextOrderStatus = 'OUT_FOR_DELIVERY';
      nextCourierStatus = 'OUT_FOR_DELIVERY';
    } else if (payload.status === 'delivered') {
      nextOrderStatus = 'DELIVERED';
      nextCourierStatus = 'DELIVERED';
      if (order.paymentMethod === 'COD') {
        order.paymentStatus = 'PAID';
      }
    } else if (payload.status === 'returned') {
      nextOrderStatus = 'RETURNED';
      nextCourierStatus = 'RETURNED';
    }

    order.orderStatus = nextOrderStatus;
    if (order.courier) {
      order.courier.status = nextCourierStatus;
    }

    order.timeline.push({
      status: nextOrderStatus,
      timestamp: new Date().toISOString(),
      note: `Courier update: ${payload.status}. ${payload.note || ''}`,
      updatedBy: 'COURIER_WEBHOOK'
    });

    if (nextOrderStatus === 'SHIPPED') {
      import('./queueService').then(({ queueService }) => {
        queueService.enqueue(
          'SMS_DISPATCH',
          `Order Shipped SMS for ${order.orderNumber}`,
          3
        );
      });
    } else if (nextOrderStatus === 'DELIVERED') {
      import('./queueService').then(({ queueService }) => {
        queueService.enqueue(
          'SMS_DISPATCH',
          `Order Delivered SMS for ${order.orderNumber}`,
          3
        );
      });
    }

    serverDb.addAuditLog(
      'COURIER_WEBHOOK_EVENT',
      'Logistics',
      order.orderNumber,
      `Status transitioned to ${payload.status} via webhook`
    );

    return { updated: true, message: `Order ${order.orderNumber} transitioned to ${nextOrderStatus}` };
  }
}

export const courierService = new CourierService();
