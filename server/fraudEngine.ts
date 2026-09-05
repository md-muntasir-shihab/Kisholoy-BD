/**
 * Server-Side Fraud Detection, Risk Engine & Anti-Abuse Controls
 * Kisholoy Artisanal Commerce Authoritative Security Layer
 * @license Apache-2.0
 */

import { 
  Order, FraudRiskAssessment, BlacklistEntry, FraudRiskSettings, 
  FraudRuleConfig, FraudStats 
} from '../src/types';
import { serverDb } from './db';
import { normalizeBdMobilePhone } from '../src/lib/phone';

// Known disposable/temporary email provider domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', 'mailinator.com', '10minutemail.com', 'guerrillamail.com',
  'trashmail.com', 'sharklasers.com', 'yopmail.com', 'throwawaymail.com',
  'fakemail.net', 'dispostable.com', 'temp-mail.org', 'tempail.com'
]);

// High-return/remote upazilas & logistics risk zones
const REMOTE_RISK_DISTRICTS = new Set([
  'Bhola', 'Bandarban', 'Khagrachhari', 'Rangamati', 'Sunamganj', 'Patuakhali', 'Barguna'
]);

// Suspicious dummy keywords in Bangladeshi delivery addresses
const DUMMY_ADDRESS_KEYWORDS = [
  'test', 'dummy', 'fake', 'asdf', 'unknown', 'xyz', 'demo', 'checking',
  'testing', 'null', 'na', '1234', 'road 00', 'house 00'
];

export class FraudEngine {
  /**
   * Normalizes a Bangladeshi mobile number to standard +8801XXXXXXXXX format
   */
  normalizeBdPhone(phone: string): string {
    // Delegate to the single canonical implementation shared with the client
    // and the order/tracking layer, so blacklist hits and velocity counts key
    // off exactly the same string everywhere. When the input is not a valid BD
    // mobile we fall back to a digits-only form rather than returning the raw
    // text, so malformed values cannot accidentally collide.
    const canonical = normalizeBdMobilePhone(phone);
    if (canonical) return canonical;
    const digits = String(phone || '').replace(/\D/g, '');
    return digits || String(phone || '').trim();
  }

  /**
   * Comprehensive Multi-Factor Fraud & Risk Assessment
   */
  evaluateOrderRisk(params: {
    phone: string;
    email?: string;
    address: string;
    district: string;
    division?: string;
    thana?: string;
    paymentMethod: 'COD' | 'SSLCOMMERZ' | 'BKASH' | 'MANUAL';
    total: number;
    items?: any[];
    clientIp?: string;
    customerHistory?: {
      totalOrders: number;
      deliveredOrders: number;
      cancelledOrders: number;
    };
  }): FraudRiskAssessment {
    const settings = serverDb.fraudSettings;
    const rules = settings.rules.filter(r => r.enabled);
    const flags: string[] = [];
    const reasons: string[] = [];

    let phoneScore = 0;
    let addressScore = 0;
    let valueScore = 0;
    let velocityScore = 0;
    let historyScore = 0;
    let emailScore = 0;

    const normalizedPhone = this.normalizeBdPhone(params.phone);
    const normalizedEmail = (params.email || '').trim().toLowerCase();
    const normalizedAddress = params.address.trim().toLowerCase();
    const clientIp = params.clientIp || '127.0.0.1';

    // -------------------------------------------------------------
    // 1. Blacklist Checks (Immediate Strike)
    // -------------------------------------------------------------
    const activeBlacklists = serverDb.blacklists.filter(b => b.isActive);
    
    // Check Phone Blacklist
    const phoneBl = activeBlacklists.find(b => b.type === 'PHONE' && this.normalizeBdPhone(b.value) === normalizedPhone);
    if (phoneBl) {
      phoneBl.hitCount += 1;
      phoneBl.lastHitAt = new Date().toISOString();
      phoneScore += 90;
      flags.push('PHONE_BLACKLISTED');
      reasons.push(`CRITICAL: Phone number matches blacklist (${phoneBl.reason})`);
    }

    // Check IP Blacklist
    const ipBl = activeBlacklists.find(b => b.type === 'IP' && b.value === clientIp);
    if (ipBl) {
      ipBl.hitCount += 1;
      ipBl.lastHitAt = new Date().toISOString();
      velocityScore += 90;
      flags.push('IP_BLACKLISTED');
      reasons.push(`CRITICAL: Client IP (${clientIp}) is blacklisted (${ipBl.reason})`);
    }

    // Check Email Blacklist
    if (normalizedEmail) {
      const emailBl = activeBlacklists.find(b => b.type === 'EMAIL' && b.value.toLowerCase() === normalizedEmail);
      if (emailBl) {
        emailBl.hitCount += 1;
        emailBl.lastHitAt = new Date().toISOString();
        emailScore += 90;
        flags.push('EMAIL_BLACKLISTED');
        reasons.push(`CRITICAL: Email address matches blacklist (${emailBl.reason})`);
      }
    }

    // Check Address Blacklist match
    const addrBl = activeBlacklists.find(b => b.type === 'ADDRESS' && normalizedAddress.includes(b.value.toLowerCase()));
    if (addrBl) {
      addrBl.hitCount += 1;
      addrBl.lastHitAt = new Date().toISOString();
      addressScore += 50;
      flags.push('ADDRESS_BLACKLISTED');
      reasons.push(`Delivery address keyword matches watchlist (${addrBl.reason})`);
    }

    // -------------------------------------------------------------
    // 2. BD Phone Number Heuristics
    // -------------------------------------------------------------
    const bdPhoneRegex = /^\+8801[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(normalizedPhone)) {
      phoneScore += 35;
      flags.push('INVALID_PHONE_FORMAT');
      reasons.push('Phone number does not match standard Bangladesh mobile operator format (+8801[3-9]XXXXXXXX).');
    }

    // Check for obvious repeating digits (e.g. 01711111111 or 01800000000)
    const digitsOnly = normalizedPhone.replace(/\D/g, '');
    const last8Digits = digitsOnly.slice(-8);
    if (/^(\d)\1{7}$/.test(last8Digits) || last8Digits === '12345678') {
      phoneScore += 45;
      flags.push('SUSPICIOUS_PHONE_PATTERN');
      reasons.push('Phone number has unnatural repeating or sequential digits pattern.');
    }

    // -------------------------------------------------------------
    // 3. Address Heuristics
    // -------------------------------------------------------------
    const shortAddrRule = rules.find(r => r.code === 'SHORT_VAGUE_ADDRESS');
    const thresholdLen = shortAddrRule?.thresholdValue || 12;
    if (normalizedAddress.length < thresholdLen) {
      addressScore += (shortAddrRule?.weight || 30);
      flags.push('SHORT_VAGUE_ADDRESS');
      reasons.push(`Delivery address is too short (${normalizedAddress.length} chars), missing street or holding details.`);
    }

    // Check dummy keywords
    for (const kw of DUMMY_ADDRESS_KEYWORDS) {
      if (normalizedAddress.includes(kw)) {
        addressScore += 35;
        flags.push('DUMMY_ADDRESS_KEYWORD');
        reasons.push(`Suspicious dummy address keyword detected: "${kw}".`);
        break;
      }
    }

    // Remote logistics district check
    const remoteRule = rules.find(r => r.code === 'REMOTE_LOGISTICS_ZONE');
    if (remoteRule && REMOTE_RISK_DISTRICTS.has(params.district)) {
      addressScore += remoteRule.weight;
      flags.push('REMOTE_LOGISTICS_ZONE');
      reasons.push(`Destination (${params.district}) is a remote non-hub district with statistically higher return rate.`);
    }

    // -------------------------------------------------------------
    // 4. Payment & COD Exposure Heuristics
    // -------------------------------------------------------------
    if (params.paymentMethod === 'COD') {
      const highCodRule = rules.find(r => r.code === 'HIGH_VALUE_COD_NEW_CUST');
      const extremeCodRule = rules.find(r => r.code === 'EXTREME_VALUE_COD');

      if (extremeCodRule && params.total >= (extremeCodRule.thresholdValue || 10000)) {
        valueScore += extremeCodRule.weight;
        flags.push('EXTREME_VALUE_COD');
        reasons.push(`Cash on Delivery total (৳${params.total.toLocaleString()}) exceeds extreme limit (৳10,000).`);
      } else if (highCodRule && params.total >= (highCodRule.thresholdValue || 5000)) {
        valueScore += highCodRule.weight;
        flags.push('HIGH_VALUE_COD_NEW_CUST');
        reasons.push(`Cash on Delivery total (৳${params.total.toLocaleString()}) exceeds standard ৳5,000 threshold.`);
      }
    } else {
      // Prepaid bonus (reduces overall score)
      valueScore = Math.max(-10, valueScore - 15);
      flags.push('PREPAID_GATEWAY');
      reasons.push('Order is paid online via gateway/tokenized bKash with verified transaction ref.');
    }

    // -------------------------------------------------------------
    // 5. Disposable Email Domain Detection
    // -------------------------------------------------------------
    if (normalizedEmail) {
      const emailDomain = normalizedEmail.split('@')[1];
      if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
        const dispRule = rules.find(r => r.code === 'DISPOSABLE_EMAIL');
        emailScore += (dispRule?.weight || 35);
        flags.push('DISPOSABLE_EMAIL');
        reasons.push(`Email domain "@${emailDomain}" is a known temporary/throwaway inbox service.`);
      }
    }

    // -------------------------------------------------------------
    // 6. Velocity / Rapid Order Spikes
    // -------------------------------------------------------------
    const windowMs = settings.velocityWindowMinutes * 60 * 1000;
    const cutoffTime = new Date(Date.now() - windowMs).toISOString();

    const recentSamePhoneOrders = serverDb.orders.filter(
      o => o.customer.phone && this.normalizeBdPhone(o.customer.phone) === normalizedPhone && o.createdAt >= cutoffTime
    );

    if (recentSamePhoneOrders.length >= settings.maxOrdersPerVelocityWindow) {
      const velRule = rules.find(r => r.code === 'RAPID_VELOCITY_SPIKE');
      velocityScore += (velRule?.weight || 40);
      flags.push('RAPID_VELOCITY_SPIKE');
      reasons.push(`High order velocity: ${recentSamePhoneOrders.length + 1} orders in the last ${settings.velocityWindowMinutes} minutes.`);
    }

    // -------------------------------------------------------------
    // 7. Customer Historical Behavior
    // -------------------------------------------------------------
    const pastOrders = serverDb.orders.filter(
      o => o.customer.phone && this.normalizeBdPhone(o.customer.phone) === normalizedPhone
    );

    if (pastOrders.length >= 3) {
      const deliveredCount = pastOrders.filter(o => o.orderStatus === 'DELIVERED').length;
      const cancelledCount = pastOrders.filter(o => o.orderStatus === 'CANCELLED' || o.orderStatus === 'RETURNED').length;
      
      if (deliveredCount >= 3 && cancelledCount === 0) {
        historyScore -= 20; // Trusted VIP customer reward
        flags.push('TRUSTED_VIP_CUSTOMER');
        reasons.push(`Customer has ${deliveredCount} successfully delivered orders with 0 cancellations.`);
      } else if (cancelledCount >= 2 && (cancelledCount / pastOrders.length) > 0.4) {
        const prevFailRule = rules.find(r => r.code === 'PREVIOUS_FAILED_DELIVERY');
        historyScore += (prevFailRule?.weight || 40);
        flags.push('PREVIOUS_FAILED_DELIVERY');
        reasons.push(`Customer history shows ${cancelledCount} cancelled/refused parcels (${Math.round((cancelledCount/pastOrders.length)*100)}% failure rate).`);
      }
    }

    // -------------------------------------------------------------
    // 8. Aggregate Score & Final Recommendation
    // -------------------------------------------------------------
    const rawTotal = phoneScore + addressScore + valueScore + velocityScore + historyScore + emailScore;
    const finalScore = Math.max(0, Math.min(100, rawTotal));

    let riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'SUSPICIOUS' = 'LOW';
    let recommendation: 'AUTO_APPROVE' | 'REQUIRE_PHONE_VERIFICATION' | 'REQUIRE_ADVANCE_SHIPPING_FEE' | 'BLOCK' = 'AUTO_APPROVE';

    if (finalScore >= settings.autoBlockThreshold || flags.includes('PHONE_BLACKLISTED') || flags.includes('IP_BLACKLISTED')) {
      riskRating = 'SUSPICIOUS';
      recommendation = 'BLOCK';
    } else if (finalScore >= 60 || flags.includes('EXTREME_VALUE_COD') || flags.includes('PREVIOUS_FAILED_DELIVERY')) {
      riskRating = 'HIGH';
      recommendation = 'REQUIRE_ADVANCE_SHIPPING_FEE';
    } else if (finalScore >= settings.phoneVerificationThreshold) {
      riskRating = 'MEDIUM';
      recommendation = 'REQUIRE_PHONE_VERIFICATION';
    } else {
      riskRating = 'LOW';
      recommendation = 'AUTO_APPROVE';
    }

    return {
      riskScore: finalScore,
      riskRating,
      flags,
      reasons: reasons.length > 0 ? reasons : ['All standard Bangladesh e-commerce risk heuristics passed cleanly.'],
      recommendation,
      breakdown: {
        phoneScore,
        addressScore,
        valueScore,
        velocityScore,
        historyScore,
        emailScore
      },
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculates Real-Time Fraud & Abuse Analytics
   */
  getFraudStats(): FraudStats {
    const orders = serverDb.orders;
    let lowRiskCount = 0;
    let mediumRiskCount = 0;
    let highRiskCount = 0;
    let criticalSuspiciousCount = 0;
    let blockedOrdersCount = 0;
    let verifiedOrdersCount = 0;
    let advanceFeeCollectedCount = 0;
    let preventedLossBdt = 0;
    let flaggedCodExposureBdt = 0;

    for (const ord of orders) {
      const risk = ord.fraudRisk;
      if (!risk) continue;

      if (risk.riskRating === 'LOW') lowRiskCount++;
      else if (risk.riskRating === 'MEDIUM') mediumRiskCount++;
      else if (risk.riskRating === 'HIGH') {
        highRiskCount++;
        if (ord.paymentMethod === 'COD' && ord.orderStatus === 'PENDING') {
          flaggedCodExposureBdt += ord.total;
        }
      } else if (risk.riskRating === 'SUSPICIOUS') {
        criticalSuspiciousCount++;
        preventedLossBdt += ord.total;
      }

      if (ord.orderStatus === 'CANCELLED' && risk.riskRating === 'SUSPICIOUS') {
        blockedOrdersCount++;
      }

      if (ord.verificationStatus === 'PHONE_VERIFIED' || ord.verificationStatus === 'MANUALLY_OVERRIDDEN') {
        verifiedOrdersCount++;
      }

      if (ord.verificationStatus === 'ADVANCE_PAID') {
        advanceFeeCollectedCount++;
      }
    }

    return {
      totalEvaluated: orders.length,
      lowRiskCount,
      mediumRiskCount,
      highRiskCount,
      criticalSuspiciousCount,
      blockedOrdersCount,
      verifiedOrdersCount,
      advanceFeeCollectedCount,
      preventedLossBdt,
      activeBlacklistCount: serverDb.blacklists.filter(b => b.isActive).length,
      flaggedCodExposureBdt
    };
  }

  /**
   * Performs an operational risk verification action on an order
   */
  verifyOrder(params: {
    orderId: string;
    action: 'PHONE_VERIFIED' | 'ADVANCE_PAID' | 'MANUALLY_OVERRIDDEN' | 'REJECTED';
    notes: string;
    operator: string;
    advanceTrxId?: string;
    advanceAmount?: number;
    addToBlacklist?: boolean;
    blacklistReason?: string;
  }): { success: boolean; order?: Order; error?: string } {
    const order = serverDb.getOrderById(params.orderId);
    if (!order) {
      return { success: false, error: 'Order ID not found' };
    }

    const prevStatus = order.verificationStatus || 'UNVERIFIED';
    order.verificationStatus = params.action;
    order.verificationNotes = params.notes;

    if (!order.fraudRisk) {
      order.fraudRisk = this.evaluateOrderRisk({
        phone: order.customer.phone || '',
        email: order.customer.email,
        address: order.shippingAddress?.address || '',
        district: order.shippingAddress?.district || 'Dhaka',
        division: order.shippingAddress?.division || 'Dhaka',
        thana: order.shippingAddress?.thana || 'Central',
        paymentMethod: order.paymentMethod || 'COD',
        total: order.total || 0,
        items: order.items || []
      });
    }

    if (params.action === 'PHONE_VERIFIED') {
      if (order.fraudRisk) {
        order.fraudRisk.riskScore = Math.max(10, order.fraudRisk.riskScore - 30);
        order.fraudRisk.riskRating = order.fraudRisk.riskScore > 50 ? 'MEDIUM' : 'LOW';
        order.fraudRisk.recommendation = 'AUTO_APPROVE';
      }
      order.timeline.push({
        status: order.orderStatus,
        timestamp: new Date().toISOString(),
        note: `Phone verification confirmed by ${params.operator}: "${params.notes}"`,
        updatedBy: params.operator
      });
    } else if (params.action === 'ADVANCE_PAID') {
      order.advancePaymentTrxId = params.advanceTrxId || `BK-${Date.now()}`;
      order.advancePaymentAmount = params.advanceAmount || 150;
      if (order.fraudRisk) {
        order.fraudRisk.riskScore = Math.max(15, order.fraudRisk.riskScore - 40);
        order.fraudRisk.riskRating = 'LOW';
        order.fraudRisk.recommendation = 'AUTO_APPROVE';
      }
      order.timeline.push({
        status: order.orderStatus,
        timestamp: new Date().toISOString(),
        note: `Advance shipping fee (৳${order.advancePaymentAmount}) verified (TrxID: ${order.advancePaymentTrxId}) by ${params.operator}.`,
        updatedBy: params.operator
      });
    } else if (params.action === 'MANUALLY_OVERRIDDEN') {
      if (order.fraudRisk) {
        order.fraudRisk.recommendation = 'AUTO_APPROVE';
      }
      order.timeline.push({
        status: order.orderStatus,
        timestamp: new Date().toISOString(),
        note: `Risk rating manually overridden by ${params.operator}: "${params.notes}"`,
        updatedBy: params.operator
      });
    } else if (params.action === 'REJECTED') {
      order.orderStatus = 'CANCELLED';
      order.paymentStatus = 'CANCELLED';
      order.settlementStatus = 'CANCELLED';
      
      // Restock products since order is cancelled
      for (const item of order.items) {
        serverDb.adjustInventory({
          productId: item.productId,
          quantityChange: item.quantity,
          reason: `Fraud rejection auto-restock for order ${order.orderNumber}`,
          operator: params.operator
        });
      }

      order.timeline.push({
        status: 'CANCELLED',
        timestamp: new Date().toISOString(),
        note: `Order rejected as fraudulent by ${params.operator}. Reason: ${params.notes}`,
        updatedBy: params.operator
      });

      // Optionally blacklist the customer phone
      if (params.addToBlacklist && order.customer.phone) {
        serverDb.addBlacklistEntry({
          type: 'PHONE',
          value: order.customer.phone,
          reason: params.blacklistReason || `Cancelled fraudulent order ${order.orderNumber}: ${params.notes}`,
          severity: 'STRICT_BLOCK',
          addedBy: params.operator
        });
      }
    }

    serverDb.addAuditLog(
      `FRAUD_RISK_${params.action}`,
      'FraudRiskReview',
      order.orderNumber,
      `Updated verification state of ${order.orderNumber} from ${prevStatus} to ${params.action}. Notes: ${params.notes}`,
      params.operator
    );

    return { success: true, order };
  }
}

export const fraudEngine = new FraudEngine();
