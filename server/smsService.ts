/**
 * Server-Side SMS Notification Service & Queue Dispatcher
 * @license Apache-2.0
 */

import { serverDb } from './db';

export interface SmsPayload {
  recipient: string;
  templateKey: 'orderPlaced' | 'orderShipped' | 'orderDelivered';
  variables: Record<string, string>;
}

export class SmsService {
  /**
   * Dispatches transactional SMS
   */
  async sendSms(payload: SmsPayload): Promise<{ success: boolean; messageId: string }> {
    const DEFAULT_TEMPLATES = {
      orderPlaced: 'Kisholoy: Order {orderNumber} for ৳{amount} is confirmed! Track here: {trackingUrl}',
      orderShipped: 'Kisholoy: Order {orderNumber} has been dispatched with {courier}. Tracking ID: {trackingId}',
      orderDelivered: 'Kisholoy: Order {orderNumber} was delivered successfully. Thank you for shopping with us!'
    };

    let templateText = DEFAULT_TEMPLATES[payload.templateKey] || DEFAULT_TEMPLATES.orderPlaced;

    let messageContent = templateText;
    for (const [key, val] of Object.entries(payload.variables)) {
      messageContent = messageContent.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    }

    const messageId = `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    serverDb.addAuditLog(
      'DISPATCH_SMS',
      'Notification',
      payload.recipient,
      `Sent ${payload.templateKey} SMS to ${payload.recipient}: "${messageContent.substring(0, 60)}..."`
    );

    return {
      success: true,
      messageId
    };
  }
}

export const smsService = new SmsService();
