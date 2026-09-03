/**
 * Authoritative Server-Side Promotions, Dynamic Coupons, Flash Deals & Loyalty Points Engine
 * Enforces strict financial integrity, anti-tampering, usage quotas & tier multipliers.
 * @license Apache-2.0
 */

import { serverDb } from './db';
import { CouponRule, FlashDeal, CustomerLoyaltyWallet, LoyaltyTier } from '../src/types';

export interface CouponValidationInput {
  couponCode?: string;
  items: Array<{ productId: string; quantity: number; price: number; category?: string }>;
  subtotal: number;
  shippingFee: number;
  customerPhone?: string;
  customerId?: string;
}

export interface CouponEvaluationResult {
  valid: boolean;
  code?: string;
  discountAmount: number;
  adjustedShippingFee: number;
  description?: string;
  discountType?: string;
  errorReason?: string;
  rule?: CouponRule;
}

export class PromotionEngine {
  /**
   * Authoritative Server-Side Coupon Verification & Discount Computation
   * NEVER trust client discounts. Every calculation is performed against active server database rules.
   */
  evaluateCoupon(input: CouponValidationInput): CouponEvaluationResult {
    const { couponCode, items, subtotal, shippingFee, customerPhone } = input;

    if (!couponCode || !couponCode.trim()) {
      return {
        valid: false,
        discountAmount: 0,
        adjustedShippingFee: shippingFee
      };
    }

    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = serverDb.getCouponByCode(cleanCode);

    if (!coupon) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        adjustedShippingFee: shippingFee,
        errorReason: `Coupon code "${cleanCode}" is invalid or does not exist.`
      };
    }

    // 1. Status check
    if (coupon.status !== 'ACTIVE') {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        adjustedShippingFee: shippingFee,
        errorReason: `Coupon "${cleanCode}" is currently ${coupon.status.toLowerCase()} and cannot be applied.`
      };
    }

    // 2. Date Window check
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (now < startDate) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        adjustedShippingFee: shippingFee,
        errorReason: `Coupon "${cleanCode}" has not started yet. Valid from ${startDate.toLocaleDateString('en-GB')}.`
      };
    }

    if (now > endDate) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        adjustedShippingFee: shippingFee,
        errorReason: `Coupon "${cleanCode}" expired on ${endDate.toLocaleDateString('en-GB')}.`
      };
    }

    // 3. Global Usage Limit check
    if (coupon.usageLimitTotal && coupon.usageCount >= coupon.usageLimitTotal) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        adjustedShippingFee: shippingFee,
        errorReason: `Coupon "${cleanCode}" redemption quota has been fully exhausted.`
      };
    }

    // 4. Per-Customer Usage Limit check
    if (customerPhone && coupon.usageLimitPerCustomer) {
      const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
      const pastOrdersWithCoupon = serverDb.orders.filter(o => 
        o.customer.phone.replace(/[^0-9]/g, '').endsWith(cleanPhone.slice(-10)) &&
        o.appliedCouponCode?.toUpperCase() === cleanCode &&
        o.orderStatus !== 'CANCELLED' &&
        o.orderStatus !== 'FAILED'
      ).length;

      if (pastOrdersWithCoupon >= coupon.usageLimitPerCustomer) {
        return {
          valid: false,
          code: cleanCode,
          discountAmount: 0,
          adjustedShippingFee: shippingFee,
          errorReason: `You have reached the maximum allowed uses (${coupon.usageLimitPerCustomer}) for coupon "${cleanCode}".`
        };
      }
    }

    // 5. First Order Only Constraint
    if (coupon.firstOrderOnly && customerPhone) {
      const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
      const priorCompletedOrders = serverDb.orders.filter(o =>
        o.customer.phone.replace(/[^0-9]/g, '').endsWith(cleanPhone.slice(-10)) &&
        o.orderStatus !== 'CANCELLED' &&
        o.orderStatus !== 'FAILED'
      ).length;

      if (priorCompletedOrders > 0) {
        return {
          valid: false,
          code: cleanCode,
          discountAmount: 0,
          adjustedShippingFee: shippingFee,
          errorReason: `Coupon "${cleanCode}" is exclusively reserved for first-time shoppers.`
        };
      }
    }

    // 6. Minimum Cart Subtotal check
    if (coupon.minOrderSubtotal && subtotal < coupon.minOrderSubtotal) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        adjustedShippingFee: shippingFee,
        errorReason: `Minimum cart subtotal of ৳${coupon.minOrderSubtotal.toLocaleString()} is required for coupon "${cleanCode}" (current subtotal: ৳${subtotal.toLocaleString()}).`
      };
    }

    // 7. Category & Product Scope filtering
    let eligibleSubtotal = 0;
    if (coupon.categoryRestrictions && coupon.categoryRestrictions.length > 0) {
      const eligibleItems = items.filter(item => {
        const prod = serverDb.getProductById(item.productId);
        return prod && coupon.categoryRestrictions!.includes(prod.categorySlug);
      });
      eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      if (eligibleSubtotal === 0) {
        return {
          valid: false,
          code: cleanCode,
          discountAmount: 0,
          adjustedShippingFee: shippingFee,
          errorReason: `Coupon "${cleanCode}" is only applicable on specific categories (${coupon.categoryRestrictions.join(', ')}).`
        };
      }
    } else if (coupon.productRestrictions && coupon.productRestrictions.length > 0) {
      const eligibleItems = items.filter(item => coupon.productRestrictions!.includes(item.productId));
      eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      if (eligibleSubtotal === 0) {
        return {
          valid: false,
          code: cleanCode,
          discountAmount: 0,
          adjustedShippingFee: shippingFee,
          errorReason: `Coupon "${cleanCode}" is not applicable to any items in your cart.`
        };
      }
    } else {
      eligibleSubtotal = subtotal;
    }

    // 8. Calculate Discount by Type
    let discountAmount = 0;
    let adjustedShippingFee = shippingFee;

    switch (coupon.discountType) {
      case 'PERCENTAGE': {
        const rawDiscount = (eligibleSubtotal * coupon.discountValue) / 100;
        discountAmount = Math.round(rawDiscount);
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
        break;
      }
      case 'FIXED_AMOUNT': {
        discountAmount = Math.min(eligibleSubtotal, coupon.discountValue);
        break;
      }
      case 'FREE_SHIPPING': {
        discountAmount = shippingFee;
        adjustedShippingFee = 0;
        break;
      }
      case 'TIERED_BUNDLE': {
        // e.g. Buy 2+ items get 15% off
        const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
        if (totalItemsCount >= 3) {
          discountAmount = Math.round(eligibleSubtotal * 0.15);
        } else if (totalItemsCount >= 2) {
          discountAmount = Math.round(eligibleSubtotal * 0.10);
        } else {
          return {
            valid: false,
            code: cleanCode,
            discountAmount: 0,
            adjustedShippingFee: shippingFee,
            errorReason: `Add at least 2 items to unlock bundle savings with "${cleanCode}".`
          };
        }
        break;
      }
    }

    // Financial Safety: discount can never exceed total payable
    discountAmount = Math.max(0, Math.min(discountAmount, subtotal + shippingFee));

    return {
      valid: true,
      code: cleanCode,
      discountAmount,
      adjustedShippingFee,
      description: coupon.description || `${coupon.title} applied`,
      discountType: coupon.discountType,
      rule: coupon
    };
  }

  /**
   * Evaluates active Flash Deal pricing overrides
   */
  evaluateFlashDealPricing(productId: string): { hasFlashDeal: boolean; flashPrice?: number; discountPercent?: number; dealTitle?: string } {
    const activeDeal = serverDb.flashDeals.find(d => d.status === 'ACTIVE');
    if (!activeDeal) return { hasFlashDeal: false };

    const item = activeDeal.items.find(i => i.productId === productId && (i.quotaStock - i.soldStock) > 0);
    if (!item) return { hasFlashDeal: false };

    return {
      hasFlashDeal: true,
      flashPrice: item.flashPrice,
      discountPercent: item.discountPercent,
      dealTitle: activeDeal.title
    };
  }

  /**
   * Computes points earned for completed order based on Customer Loyalty Tier
   */
  calculatePointsEarned(subtotal: number, tier: LoyaltyTier = 'BRONZE'): { pointsEarned: number; multiplier: number } {
    // Base: 1 point per ৳100 spent
    const basePoints = Math.floor(subtotal / 100);
    let multiplier = 1.0;

    switch (tier) {
      case 'PLATINUM':
        multiplier = 2.0;
        break;
      case 'GOLD':
        multiplier = 1.5;
        break;
      case 'SILVER':
        multiplier = 1.25;
        break;
      case 'BRONZE':
      default:
        multiplier = 1.0;
        break;
    }

    const pointsEarned = Math.round(basePoints * multiplier);
    return { pointsEarned, multiplier };
  }

  /**
   * System Promotion Statistics Overview
   */
  getSystemPromotionStats() {
    const activeCoupons = serverDb.coupons.filter(c => c.status === 'ACTIVE').length;
    const totalDisbursed = serverDb.coupons.reduce((sum, c) => sum + (c.totalDiscountDisbursedBdt || 0), 0);
    const totalRevenue = serverDb.coupons.reduce((sum, c) => sum + (c.totalAttributedRevenueBdt || 0), 0);
    const activeFlash = serverDb.flashDeals.filter(f => f.status === 'ACTIVE').length;
    const totalWallets = serverDb.loyaltyWallets.length;
    const circulatingPoints = serverDb.loyaltyWallets.reduce((sum, w) => sum + (w.pointsBalance || 0), 0);
    const totalRedeemedSavings = serverDb.loyaltyWallets.reduce((sum, w) => sum + (w.totalWalletSavingsBdt || 0), 0);

    return {
      activeCouponsCount: activeCoupons,
      totalCouponsCreated: serverDb.coupons.length,
      totalDiscountDisbursedBdt: totalDisbursed,
      totalRevenueGeneratedBdt: totalRevenue,
      activeFlashDealsCount: activeFlash,
      totalLoyaltyMembers: totalWallets,
      totalPointsInCirculation: circulatingPoints,
      pointsRedeemedTotalBdt: totalRedeemedSavings
    };
  }
}

export const promotionEngine = new PromotionEngine();
