/**
 * Server-Side Outbound Webhook Dispatcher & Inbound Signature Verifier
 * Compliant with standard HMAC-SHA256 signature security
 * @license Apache-2.0
 */

import crypto from 'crypto';
import { serverDb } from './db';
import { WebhookEndpoint, WebhookDeliveryLog } from '../src/types';
import { queueService } from './queueService';

export class WebhookService {
  /**
   * Generates HMAC-SHA256 signature for webhook payload
   */
  generateSignature(payload: string, secret: string): string {
    return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Dispatches an outbound webhook event to all active subscribed endpoints
   */
  async dispatchEvent(event: string, data: any): Promise<WebhookDeliveryLog[]> {
    const activeEndpoints = serverDb.webhookEndpoints.filter(
      ep => ep.status === 'ACTIVE' && ep.events.includes(event)
    );

    const logs: WebhookDeliveryLog[] = [];

    for (const ep of activeEndpoints) {
      const log = await this.deliverToEndpoint(ep, event, data);
      logs.push(log);
    }

    return logs;
  }

  /**
   * Delivers payload to a single endpoint and creates delivery log
   */
  async deliverToEndpoint(ep: WebhookEndpoint, event: string, data: any): Promise<WebhookDeliveryLog> {
    const payload = {
      event,
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      data
    };

    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString, ep.secret);
    const startTime = Date.now();

    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let httpStatus = 200;
    let responseBody = '{"received":true}';

    // Simulate network delivery
    await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 120));

    // Simulated endpoint failure if URL contains specific flag or random edge case
    if (ep.url.includes('partners.com') || ep.url.includes('503')) {
      status = 'FAILED';
      httpStatus = 503;
      responseBody = '{"error":"Service Unavailable - Backpressure limit reached"}';
      ep.totalFailed += 1;

      // Auto enqueue retry job
      queueService.enqueue(
        'WEBHOOK_OUTBOUND',
        `Retry webhook ${event} to ${ep.name}`,
        {
          priority: 'HIGH',
          payload: { endpointId: ep.id, endpointUrl: ep.url, event, data }
        }
      );
    } else {
      ep.totalDelivered += 1;
      ep.lastHttpStatus = 200;
      ep.lastDeliveryAt = new Date().toISOString();
    }

    const durationMs = Date.now() - startTime;

    const deliveryLog: WebhookDeliveryLog = serverDb.addWebhookLog({
      webhookId: ep.id,
      webhookName: ep.name,
      event,
      url: ep.url,
      status,
      httpStatus,
      requestPayload: payload,
      responseBody,
      durationMs,
      timestamp: new Date().toISOString(),
      signature
    });

    serverDb.addAuditLog(
      'DISPATCH_WEBHOOK',
      'Webhook',
      ep.id,
      `Dispatched ${event} to ${ep.name} -> HTTP ${httpStatus} (${durationMs}ms)`
    );

    return deliveryLog;
  }

  /**
   * Send a test ping webhook event
   */
  async sendTestPing(endpointId: string): Promise<WebhookDeliveryLog | null> {
    const ep = serverDb.webhookEndpoints.find(w => w.id === endpointId);
    if (!ep) return null;

    const testData = {
      ping: true,
      message: 'Kisholoy Webhook Integration Health Check',
      dispatchedAt: new Date().toISOString(),
      testOrder: {
        orderNumber: 'KSH-TEST-0001',
        total: 1850,
        currency: 'BDT'
      }
    };

    return this.deliverToEndpoint(ep, 'system.ping', testData);
  }
}

export const webhookService = new WebhookService();
