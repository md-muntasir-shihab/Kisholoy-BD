/**
 * KISHOLOY Phase 19: Marketing Automation, Customer Segmentation, CRM & Referral Engine
 * @license Apache-2.0
 */

import { 
  Customer, Order, RfmScore, RfmSegmentSummary, CustomerSegmentType,
  AbandonedCart, AbandonedCartRecoveryLog, MarketingCampaign,
  ReferralProgramConfig, ReferralRecord, CrmCustomerNote, CrmCustomerDetails
} from '../src/types';
import { serverDb } from './db';

// In-Memory Storage for Phase 19 Entities
export const INITIAL_REFERRAL_CONFIG: ReferralProgramConfig = {
  isActive: true,
  referrerRewardType: 'STORE_CREDIT',
  referrerRewardAmount: 150, // ৳150 store credit for advocate
  refereeRewardType: 'FIXED_DISCOUNT',
  refereeRewardAmount: 100, // ৳100 off on first purchase
  refereeMinOrderValue: 1200, // minimum ৳1,200 order
  disbursementEvent: 'ON_DELIVERY',
  maxReferralsPerUser: 25,
  preventSelfReferral: true
};

export const INITIAL_ABANDONED_CARTS: AbandonedCart[] = [
  {
    id: 'cart-ab-101',
    sessionId: 'sess-bd-8942-01',
    customerId: 'cust-1',
    customerName: 'Tanzil Ahmed',
    customerPhone: '+8801712345678',
    customerEmail: 'tanzil.ahmed@example.com',
    district: 'Dhaka',
    thana: 'Dhanmondi',
    items: [
      {
        productId: 'prod-01',
        title: 'Handloom Tangail Cotton Saree - Indigo Motif',
        titleBn: 'তাঁতের তাঁগাইল সুতি শাড়ি - নীল নকশা',
        price: 3200,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400'
      },
      {
        productId: 'prod-04',
        title: 'Traditional Terracotta Clay Tea Cups (Set of 6)',
        titleBn: 'ঐতিহ্যবাহী পোড়ামাটির চায়ের কাপ (৬ টির সেট)',
        price: 650,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=400'
      }
    ],
    subtotal: 3850,
    abandonedStep: 'GATEWAY_DROPOFF',
    recoveryStatus: 'STAGE_1_SENT',
    lastActionAt: '2026-09-02T08:15:00+06:00',
    recoveryHistory: [
      {
        stage: 1,
        channel: 'SMS',
        sentAt: '2026-09-02T09:15:00+06:00',
        incentiveCoupon: 'RECOVER5',
        status: 'DELIVERED',
        notes: 'SMS sent: "প্রিয় Tanzil, আপনার কিশলয় কার্টে থাকা তাঁতের শাড়ি সংরক্ষিত আছে। দ্রুত অর্ডার সম্পন্ন করতে ক্লিক করুন: https://kisholoy.com.bd/cart?token=ab-101"'
      }
    ],
    createdAt: '2026-09-02T07:45:00+06:00',
    cartToken: 'tok-rec-tanzil-8942'
  },
  {
    id: 'cart-ab-102',
    sessionId: 'sess-bd-8942-02',
    customerId: 'cust-2',
    customerName: 'Nusrat Jahan',
    customerPhone: '+8801819988776',
    customerEmail: 'nusrat.jahan@example.com',
    district: 'Chittagong',
    thana: 'Panchlaish',
    items: [
      {
        productId: 'prod-02',
        title: 'Pure Rajshahi Mulberry Silk Scarf - Floral Weave',
        titleBn: 'রাজশাহী মালবেরি সিল্ক স্কার্ফ - ফুলেল বুনন',
        price: 2250,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=400'
      }
    ],
    subtotal: 2250,
    abandonedStep: 'PAYMENT_SELECTION',
    recoveryStatus: 'ABANDONED',
    lastActionAt: '2026-09-02T06:30:00+06:00',
    recoveryHistory: [],
    createdAt: '2026-09-02T06:20:00+06:00',
    cartToken: 'tok-rec-nusrat-8943'
  },
  {
    id: 'cart-ab-103',
    sessionId: 'sess-bd-8942-03',
    customerName: 'Farhana Akhter',
    customerPhone: '+8801912445566',
    district: 'Sylhet',
    thana: 'Zindabazar',
    items: [
      {
        productId: 'prod-05',
        title: 'Pure Sundarbans Wildflower Honey (500g)',
        titleBn: 'খাঁটি সুন্দরবনের খলিশা ফুলের মধু (৫০০ গ্রাম)',
        price: 950,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400'
      }
    ],
    subtotal: 1900,
    abandonedStep: 'SHIPPING_INFO',
    recoveryStatus: 'ABANDONED',
    lastActionAt: '2026-09-01T22:10:00+06:00',
    recoveryHistory: [],
    createdAt: '2026-09-01T21:50:00+06:00',
    cartToken: 'tok-rec-farhana-8944'
  },
  {
    id: 'cart-ab-104',
    sessionId: 'sess-bd-8942-04',
    customerName: 'Zubair Hossain',
    customerPhone: '+8801733889900',
    district: 'Dhaka',
    thana: 'Uttara',
    items: [
      {
        productId: 'prod-01',
        title: 'Handloom Tangail Cotton Saree - Indigo Motif',
        titleBn: 'তাঁতের তাঁগাইল সুতি শাড়ি - নীল নকশা',
        price: 3200,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400'
      }
    ],
    subtotal: 6400,
    abandonedStep: 'PAYMENT_SELECTION',
    recoveryStatus: 'RECOVERED',
    lastActionAt: '2026-08-30T15:20:00+06:00',
    recoveryHistory: [
      {
        stage: 1,
        channel: 'WHATSAPP',
        sentAt: '2026-08-30T16:00:00+06:00',
        incentiveCoupon: 'FREESHIP',
        status: 'CONVERTED',
        notes: 'Customer placed order KSH-2026-0891 via recovery link with free shipping'
      }
    ],
    recoveredOrderNumber: 'KSH-2026-0891',
    recoveredAt: '2026-08-30T16:45:00+06:00',
    createdAt: '2026-08-30T14:30:00+06:00',
    cartToken: 'tok-rec-zubair-8945'
  }
];

export const INITIAL_REFERRAL_RECORDS: ReferralRecord[] = [
  {
    id: 'ref-rec-001',
    referrerCustomerId: 'cust-1',
    referrerName: 'Tanzil Ahmed',
    referrerPhone: '+8801712345678',
    referralCode: 'TANZIL-KSH',
    refereeCustomerId: 'cust-2',
    refereeName: 'Nusrat Jahan',
    refereePhone: '+8801819988776',
    refereeEmail: 'nusrat.jahan@example.com',
    refereeOrderNumber: 'KSH-2026-0890',
    orderAmount: 2300,
    status: 'REWARDED',
    referrerRewardClaimed: true,
    fraudCheckNotes: 'Anti-fraud checks passed: Unique phone, unique IP, distinct delivery addresses (Dhanmondi vs Chittagong).',
    createdAt: '2026-08-20T11:00:00+06:00',
    rewardedAt: '2026-08-28T19:30:00+06:00'
  },
  {
    id: 'ref-rec-002',
    referrerCustomerId: 'cust-1',
    referrerName: 'Tanzil Ahmed',
    referrerPhone: '+8801712345678',
    referralCode: 'TANZIL-KSH',
    refereeCustomerId: 'cust-3',
    refereeName: 'Rahim Uddin',
    refereePhone: '+8801755123987',
    refereeEmail: 'rahim.uddin@example.com',
    refereeOrderNumber: 'KSH-2026-0889',
    orderAmount: 5050,
    status: 'ORDER_PLACED',
    referrerRewardClaimed: false,
    fraudCheckNotes: 'Order is currently in PENDING state. Reward of ৳150 will disburse upon successful delivery.',
    createdAt: '2026-08-31T14:15:00+06:00'
  },
  {
    id: 'ref-rec-003',
    referrerCustomerId: 'cust-2',
    referrerName: 'Nusrat Jahan',
    referrerPhone: '+8801819988776',
    referralCode: 'NUSRAT-KSH',
    refereeName: 'Sadia Sultana',
    refereePhone: '+8801677334455',
    status: 'SIGNED_UP',
    referrerRewardClaimed: false,
    fraudCheckNotes: 'Referee registered account; awaiting first qualified purchase over ৳1,200.',
    createdAt: '2026-09-01T17:40:00+06:00'
  },
  {
    id: 'ref-rec-004',
    referrerCustomerId: 'cust-3',
    referrerName: 'Rahim Uddin',
    referrerPhone: '+8801755123987',
    referralCode: 'RAHIM-KSH',
    refereeName: 'Rahim Uddin Alternate',
    refereePhone: '+8801755123987',
    status: 'FRAUD_REJECTED',
    referrerRewardClaimed: false,
    fraudCheckNotes: 'REJECTED: Self-referral attempt detected. Referrer phone and referee phone are identical (+8801755123987).',
    createdAt: '2026-08-25T10:00:00+06:00'
  }
];

export const INITIAL_MARKETING_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'camp-01',
    campaignName: 'Tangail Handloom Restock Alert',
    campaignNameBn: 'তাঁতের তাঁগাইল শাড়ির নতুন স্টক নোটিফিকেশন',
    type: 'NEW_ARRIVAL',
    targetSegment: 'CHAMPIONS_VIP',
    channel: 'MULTI_CHANNEL',
    status: 'COMPLETED',
    executedAt: '2026-08-25T11:00:00+06:00',
    contentEn: 'Dear VIP patron, our master weavers have replenished authentic indigo Tangail handlooms. Enjoy priority access with code VIPHANDLOOM.',
    contentBn: 'সম্মানিত ভিআইপি গ্রাহক, তাঁগাইলের তাঁত শিল্পীদের তৈরি নতুন নীল নকশার তাঁত শাড়ি কিশলয়ে যুক্ত হয়েছে। আপনার জন্য এক্সক্লুসিভ অ্যাক্সেস: VIPHANDLOOM',
    couponCode: 'VIPHANDLOOM',
    audienceCount: 140,
    deliveredCount: 138,
    failedCount: 2,
    clicksCount: 84,
    attributedOrders: 26,
    attributedRevenue: 84500,
    costBdt: 280,
    roi: 301.8,
    createdAt: '2026-08-24T15:00:00+06:00'
  },
  {
    id: 'camp-02',
    campaignName: 'Lapsed Customer Win-Back (৳150 Off)',
    campaignNameBn: 'নিষ্ক্রিয় ক্রেতাদের জন্য রি-অ্যাক্টিভেশন ভাউচার',
    type: 'WIN_BACK',
    targetSegment: 'AT_RISK',
    channel: 'SMS',
    status: 'RUNNING',
    executedAt: '2026-09-01T10:00:00+06:00',
    contentEn: 'We miss you at Kisholoy! Get ৳150 off your next handloom or organic grocery order using code COMEBACK150. Valid for 48 hours.',
    contentBn: 'কিশলয় আপনাকে মিস করছে! আপনার পরবর্তী অর্ডারে ৳১৫০ ছাড় পেতে কোড ব্যবহার করুন: COMEBACK150 (মেয়াদ ৪৮ ঘণ্টা)।',
    couponCode: 'COMEBACK150',
    audienceCount: 210,
    deliveredCount: 205,
    failedCount: 5,
    clicksCount: 62,
    attributedOrders: 14,
    attributedRevenue: 38200,
    costBdt: 420,
    roi: 90.9,
    createdAt: '2026-08-31T18:00:00+06:00'
  },
  {
    id: 'camp-03',
    campaignName: 'Cart Abandonment Automated Recovery Flow',
    campaignNameBn: 'পরিত্যক্ত কার্ট স্বয়ংক্রিয় পুনরুদ্ধার ক্যাম্পেইন',
    type: 'CART_RECOVERY',
    targetSegment: 'ABANDONED_CARTS',
    channel: 'WHATSAPP',
    status: 'RUNNING',
    executedAt: '2026-09-01T00:00:00+06:00',
    contentEn: 'Your selected handcrafted items are reserved in your Kisholoy cart! Complete checkout now for swift courier dispatch.',
    contentBn: 'আপনার বাছাইকৃত হস্তশিল্প পণ্যগুলো কিশলয় কার্টে সংরক্ষিত আছে। দ্রুততম ডেলিভারির জন্য এখনি অর্ডার সম্পন্ন করুন।',
    couponCode: 'RECOVER5',
    audienceCount: 45,
    deliveredCount: 44,
    failedCount: 1,
    clicksCount: 31,
    attributedOrders: 11,
    attributedRevenue: 33450,
    costBdt: 90,
    roi: 371.6,
    createdAt: '2026-08-20T10:00:00+06:00'
  }
];

export const INITIAL_CRM_NOTES: Record<string, CrmCustomerNote[]> = {
  'cust-1': [
    {
      id: 'note-01',
      author: 'Operations Admin',
      text: 'Verified high-value corporate buyer. Prefers evening courier delivery after 6 PM in Dhanmondi.',
      createdAt: '2026-08-15T14:30:00+06:00'
    },
    {
      id: 'note-02',
      author: 'Support Manager',
      text: 'Highly appreciative of eco-friendly muslin packaging. Eligible for VIP advance showcase.',
      createdAt: '2026-08-29T16:00:00+06:00'
    }
  ],
  'cust-2': [
    {
      id: 'note-03',
      author: 'Support Desk',
      text: 'Interested in Rajshahi Silk collections. Prompt online payment via SSLCOMMERZ.',
      createdAt: '2026-08-28T19:40:00+06:00'
    }
  ]
};

export const INITIAL_CUSTOMER_TAGS: Record<string, string[]> = {
  'cust-1': ['VIP', 'HANDLOOM_CONNOISSEUR', 'HIGH_AOV', 'DHAKA_CENTRAL'],
  'cust-2': ['ONLINE_PAYER', 'SILK_LOVER', 'CHITTAGONG_METRO'],
  'cust-3': ['ORGANIC_FOOD', 'COD_PREFERENCE', 'SYLHET_DIVISION']
};

class MarketingService {
  private referralConfig: ReferralProgramConfig = JSON.parse(JSON.stringify(INITIAL_REFERRAL_CONFIG));
  private abandonedCarts: AbandonedCart[] = JSON.parse(JSON.stringify(INITIAL_ABANDONED_CARTS));
  private referralRecords: ReferralRecord[] = JSON.parse(JSON.stringify(INITIAL_REFERRAL_RECORDS));
  private campaigns: MarketingCampaign[] = JSON.parse(JSON.stringify(INITIAL_MARKETING_CAMPAIGNS));
  private crmNotes: Record<string, CrmCustomerNote[]> = JSON.parse(JSON.stringify(INITIAL_CRM_NOTES));
  private customerTags: Record<string, string[]> = JSON.parse(JSON.stringify(INITIAL_CUSTOMER_TAGS));

  // -------------------------------------------------------------
  // 1. RFM Customer Segmentation & Intelligence Engine
  // -------------------------------------------------------------
  calculateRfmScores(): { scores: RfmScore[]; summaries: RfmSegmentSummary[] } {
    const customers = serverDb.customers;
    const orders = serverDb.orders;
    const now = new Date('2026-09-02T12:00:00+06:00').getTime();

    const scores: RfmScore[] = customers.map(c => {
      const custOrders = orders.filter(o => 
        (o.customer?.phone === c.phone || (o.customer?.name || '').toLowerCase() === c.name.toLowerCase()) &&
        o.orderStatus !== 'CANCELLED'
      );

      // Recency
      let recencyDays = 180;
      let lastOrderDate = '2026-01-01T00:00:00+06:00';
      if (custOrders.length > 0) {
        const sorted = [...custOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        lastOrderDate = sorted[0].createdAt;
        const diffMs = now - new Date(lastOrderDate).getTime();
        recencyDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      // Frequency
      const frequencyCount = custOrders.length;

      // Monetary
      const monetaryTotal = custOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const avgOrderValue = frequencyCount > 0 ? Math.round(monetaryTotal / frequencyCount) : 0;

      // Calculate R Score (1 to 5)
      let rScore = 1;
      if (recencyDays <= 7) rScore = 5;
      else if (recencyDays <= 21) rScore = 4;
      else if (recencyDays <= 45) rScore = 3;
      else if (recencyDays <= 90) rScore = 2;
      else rScore = 1;

      // Calculate F Score (1 to 5)
      let fScore = 1;
      if (frequencyCount >= 5) fScore = 5;
      else if (frequencyCount >= 3) fScore = 4;
      else if (frequencyCount === 2) fScore = 3;
      else if (frequencyCount === 1) fScore = 2;
      else fScore = 1;

      // Calculate M Score (1 to 5)
      let mScore = 1;
      if (monetaryTotal >= 20000) mScore = 5;
      else if (monetaryTotal >= 10000) mScore = 4;
      else if (monetaryTotal >= 5000) mScore = 3;
      else if (monetaryTotal >= 2000) mScore = 2;
      else mScore = 1;

      const compositeScore = Math.round((rScore * 0.3 + fScore * 0.35 + mScore * 0.35) * 20);

      // Determine Segment
      let segment: CustomerSegmentType = 'NEW_CUSTOMER';
      if (rScore >= 4 && fScore >= 3 && mScore >= 3) {
        segment = 'CHAMPIONS_VIP';
      } else if (fScore >= 3 && rScore >= 3) {
        segment = 'LOYAL';
      } else if (rScore >= 4 && fScore <= 2 && mScore >= 2) {
        segment = 'POTENTIAL_LOYALIST';
      } else if (rScore <= 2 && fScore >= 3) {
        segment = 'AT_RISK';
      } else if (rScore === 1 && fScore <= 2) {
        segment = 'HIBERNATING_LAPSED';
      } else if (frequencyCount === 1 && recencyDays <= 30) {
        segment = 'NEW_CUSTOMER';
      } else {
        segment = 'PRICE_SENSITIVE';
      }

      const tags = this.customerTags[c.id] || ['VERIFIED_BUYER'];
      const district = (c as any).district || (c.defaultAddress ? c.defaultAddress.split(',').pop()?.trim() || 'Dhaka' : 'Dhaka');

      return {
        customerId: c.id,
        customerName: c.name,
        phone: c.phone,
        email: c.email,
        district,
        recencyDays,
        frequencyCount,
        monetaryTotal,
        rScore,
        fScore,
        mScore,
        compositeScore,
        segment,
        lastOrderDate,
        avgOrderValue,
        tags
      };
    });

    // Generate Segment Summaries
    const segmentDefs: Array<{
      segment: CustomerSegmentType;
      nameEn: string;
      nameBn: string;
      recEn: string;
      recBn: string;
      color: string;
      badgeBg: string;
    }> = [
      {
        segment: 'CHAMPIONS_VIP',
        nameEn: 'Champions & VIP Buyers',
        nameBn: 'চ্যাম্পিয়ন ও ভিআইপি ক্রেতা',
        recEn: 'Offer concierge support, preview new handloom releases, and invite to VIP tastings.',
        recBn: 'বিশেষ গ্রাহক সেবা প্রদান, নতুন পণ্যের আগাম প্রদর্শনী ও ভিআইপি রিওয়ার্ড দিন।',
        color: 'text-amber-700 border-amber-300 bg-amber-50',
        badgeBg: 'bg-amber-100 text-amber-800'
      },
      {
        segment: 'LOYAL',
        nameEn: 'Loyal Repeat Customers',
        nameBn: 'বিশ্বস্ত নিয়মিত ক্রেতা',
        recEn: 'Incentivize with loyalty wallet point multipliers and refer-a-friend bonuses.',
        recBn: 'লয়্যালটি পয়েন্ট বোনাস ও রেফারেল সুবিধার মাধ্যমে উৎসাহিত করুন।',
        color: 'text-emerald-700 border-emerald-300 bg-emerald-50',
        badgeBg: 'bg-emerald-100 text-emerald-800'
      },
      {
        segment: 'POTENTIAL_LOYALIST',
        nameEn: 'Potential Loyalists',
        nameBn: 'সম্ভাব্য নিয়মিত ক্রেতা',
        recEn: 'Recommend complementary cross-sell products and offer second-purchase incentives.',
        recBn: 'সম্পর্কিত পণ্যের সুপারিশ এবং দ্বিতীয় অর্ডারের জন্য স্পেশাল ভাউচার দিন।',
        color: 'text-blue-700 border-blue-300 bg-blue-50',
        badgeBg: 'bg-blue-100 text-blue-800'
      },
      {
        segment: 'NEW_CUSTOMER',
        nameEn: 'New First-Time Buyers',
        nameBn: 'নতুন প্রথমবার ক্রেতা',
        recEn: 'Send onboarding care instructions and a thank-you note with delivery follow-up.',
        recBn: 'পণ্যের যত্ন সংক্রান্ত পরামর্শ এবং সন্তুষ্টি যাচাইয়ের জন্য ধন্যবাদ বার্তা পাঠান।',
        color: 'text-purple-700 border-purple-300 bg-purple-50',
        badgeBg: 'bg-purple-100 text-purple-800'
      },
      {
        segment: 'AT_RISK',
        nameEn: 'At-Risk / Churn Risk',
        nameBn: 'ঝুঁকিপূর্ণ / হারিয়ে যেতে বসা',
        recEn: 'Trigger personalized win-back SMS with exclusive comeback discount coupon.',
        recBn: 'বিশেষ উইন-ব্যাক ডিসকাউন্ট কোডসহ ব্যক্তিগত এসএমএস বার্তা পাঠিয়ে ফিরিয়ে আনুন।',
        color: 'text-rose-700 border-rose-300 bg-rose-50',
        badgeBg: 'bg-rose-100 text-rose-800'
      },
      {
        segment: 'HIBERNATING_LAPSED',
        nameEn: 'Hibernating / Lapsed',
        nameBn: 'নিষ্ক্রিয় দীর্ঘমেয়াদী গ্রাহক',
        recEn: 'Send seasonal revival newsletters showcasing new heritage collections.',
        recBn: 'মৌসুমী উৎসব বা নতুন কালেকশনের আকর্ষণীয় খবর পাঠিয়ে স্মরণ করিয়ে দিন।',
        color: 'text-stone-700 border-stone-300 bg-stone-50',
        badgeBg: 'bg-stone-200 text-stone-700'
      },
      {
        segment: 'PRICE_SENSITIVE',
        nameEn: 'Price Sensitive / Deal Seekers',
        nameBn: 'মূল্য-সংবেদনশীল / অফার শিকারী',
        recEn: 'Target during Flash Sales, clearance events, and bundle discount offers.',
        recBn: 'ফ্ল্যাশ সেল ও কম্বো অফারের সময় টার্গেটেড নোটিফিকেশন পাঠান।',
        color: 'text-orange-700 border-orange-300 bg-orange-50',
        badgeBg: 'bg-orange-100 text-orange-800'
      }
    ];

    const totalCustCount = Math.max(1, scores.length);
    const summaries: RfmSegmentSummary[] = segmentDefs.map(def => {
      const segScores = scores.filter(s => s.segment === def.segment);
      const count = segScores.length;
      const rev = segScores.reduce((sum, s) => sum + s.monetaryTotal, 0);
      return {
        segment: def.segment,
        segmentNameEn: def.nameEn,
        segmentNameBn: def.nameBn,
        customerCount: count,
        percentageOfBase: Number(((count / totalCustCount) * 100).toFixed(1)),
        totalRevenueBdt: rev,
        avgLtvBdt: count > 0 ? Math.round(rev / count) : 0,
        recommendedActionEn: def.recEn,
        recommendedActionBn: def.recBn,
        colorClass: def.color,
        badgeBg: def.badgeBg
      };
    });

    return { scores, summaries };
  }

  // -------------------------------------------------------------
  // 2. Abandoned Cart Recovery Engine
  // -------------------------------------------------------------
  getAbandonedCarts(): AbandonedCart[] {
    return this.abandonedCarts;
  }

  recoverAbandonedCartNudge(cartId: string, options: {
    stage: number;
    channel: 'SMS' | 'WHATSAPP' | 'EMAIL';
    customNote?: string;
    incentiveCoupon?: string;
  }): { success: boolean; cart?: AbandonedCart; message: string } {
    const cart = this.abandonedCarts.find(c => c.id === cartId);
    if (!cart) {
      return { success: false, message: 'Abandoned cart not found' };
    }

    const stageStatusMap: Record<number, AbandonedCart['recoveryStatus']> = {
      1: 'STAGE_1_SENT',
      2: 'STAGE_2_SENT',
      3: 'STAGE_3_SENT'
    };

    cart.recoveryStatus = stageStatusMap[options.stage] || 'STAGE_1_SENT';
    cart.lastActionAt = new Date().toISOString();

    const logEntry: AbandonedCartRecoveryLog = {
      stage: options.stage,
      channel: options.channel,
      sentAt: new Date().toISOString(),
      incentiveCoupon: options.incentiveCoupon || 'RECOVER5',
      status: 'DELIVERED',
      notes: options.customNote || `Automated nudge dispatched via ${options.channel} with coupon ${options.incentiveCoupon || 'RECOVER5'}`
    };

    cart.recoveryHistory.unshift(logEntry);

    serverDb.addAuditLog(
      'DISPATCH_CART_RECOVERY',
      'Marketing',
      cart.id,
      `Sent Stage ${options.stage} recovery nudge via ${options.channel} to ${cart.customerPhone} (Value: ৳${cart.subtotal})`
    );

    return {
      success: true,
      cart,
      message: `Recovery nudge sent successfully to ${cart.customerName} (${cart.customerPhone}) via ${options.channel}`
    };
  }

  simulateAbandonedCart(payload: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    district?: string;
    thana?: string;
    productId: string;
    quantity: number;
    abandonedStep: AbandonedCart['abandonedStep'];
  }): AbandonedCart {
    const product = serverDb.getProductById(payload.productId) || serverDb.products[0];
    const subtotal = product.price * payload.quantity;

    const newCart: AbandonedCart = {
      id: `cart-ab-${Date.now()}`,
      sessionId: `sess-bd-${Date.now()}`,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      district: payload.district || 'Dhaka',
      thana: payload.thana || 'Gulshan',
      items: [
        {
          productId: product.id,
          title: product.title,
          titleBn: product.titleBn,
          price: product.price,
          quantity: payload.quantity,
          image: product.images[0]
        }
      ],
      subtotal,
      abandonedStep: payload.abandonedStep,
      recoveryStatus: 'ABANDONED',
      lastActionAt: new Date().toISOString(),
      recoveryHistory: [],
      createdAt: new Date().toISOString(),
      cartToken: `tok-rec-${Math.random().toString(36).substring(2, 9)}`
    };

    this.abandonedCarts.unshift(newCart);

    serverDb.addAuditLog(
      'INGEST_ABANDONED_CART',
      'Marketing',
      newCart.id,
      `New abandoned cart registered for ${newCart.customerName} at step ${newCart.abandonedStep} (৳${subtotal})`
    );

    return newCart;
  }

  // -------------------------------------------------------------
  // 3. Referral & Affiliate Growth Engine
  // -------------------------------------------------------------
  getReferralConfig(): ReferralProgramConfig {
    return this.referralConfig;
  }

  updateReferralConfig(updates: Partial<ReferralProgramConfig>): ReferralProgramConfig {
    Object.assign(this.referralConfig, updates);
    serverDb.addAuditLog('UPDATE_REFERRAL_CONFIG', 'Marketing', 'CONFIG', 'Updated referral reward parameters');
    return this.referralConfig;
  }

  getReferralRecords(): ReferralRecord[] {
    return this.referralRecords;
  }

  disburseReferralReward(referralId: string): { success: boolean; message: string; record?: ReferralRecord } {
    const record = this.referralRecords.find(r => r.id === referralId);
    if (!record) {
      return { success: false, message: 'Referral record not found' };
    }

    if (record.status === 'REWARDED' || record.referrerRewardClaimed) {
      return { success: false, message: 'Reward has already been disbursed for this referral' };
    }

    if (record.status === 'FRAUD_REJECTED') {
      return { success: false, message: 'Cannot disburse reward for a rejected fraudulent referral' };
    }

    // Disburse reward to referrer's wallet
    const rewardAmount = this.referralConfig.referrerRewardAmount;
    const wallet = serverDb.loyaltyWallets.find(w => w.customerId === record.referrerCustomerId);

    if (wallet) {
      wallet.pointsBalance += rewardAmount;
      wallet.lifetimeEarnedPoints += rewardAmount;
      wallet.totalWalletSavingsBdt += rewardAmount;
      wallet.transactions.unshift({
        id: `tx-ref-${Date.now()}`,
        type: 'REFERRAL_BONUS',
        points: rewardAmount,
        bdtEquivalent: rewardAmount,
        orderNumber: record.refereeOrderNumber,
        note: `Referral reward for introducing ${record.refereeName}`,
        timestamp: new Date().toISOString()
      });
    }

    record.status = 'REWARDED';
    record.referrerRewardClaimed = true;
    record.rewardedAt = new Date().toISOString();

    serverDb.addAuditLog(
      'DISBURSE_REFERRAL_REWARD',
      'Marketing',
      record.id,
      `Disbursed ৳${rewardAmount} referral reward to ${record.referrerName} (${record.referrerPhone})`
    );

    return {
      success: true,
      message: `Successfully disbursed ৳${rewardAmount} credit to ${record.referrerName}`,
      record
    };
  }

  // -------------------------------------------------------------
  // 4. Multi-Channel Marketing Campaigns
  // -------------------------------------------------------------
  getCampaigns(): MarketingCampaign[] {
    return this.campaigns;
  }

  createCampaign(campaign: Omit<MarketingCampaign, 'id' | 'createdAt' | 'deliveredCount' | 'failedCount' | 'clicksCount' | 'attributedOrders' | 'attributedRevenue' | 'roi'>): MarketingCampaign {
    const newCamp: MarketingCampaign = {
      ...campaign,
      id: `camp-${Date.now()}`,
      deliveredCount: 0,
      failedCount: 0,
      clicksCount: 0,
      attributedOrders: 0,
      attributedRevenue: 0,
      roi: 0,
      createdAt: new Date().toISOString()
    };

    this.campaigns.unshift(newCamp);

    serverDb.addAuditLog(
      'CREATE_MARKETING_CAMPAIGN',
      'Marketing',
      newCamp.id,
      `Created campaign: ${newCamp.campaignName} targeting ${newCamp.targetSegment} via ${newCamp.channel}`
    );

    return newCamp;
  }

  dispatchCampaign(campaignId: string): { success: boolean; message: string; campaign?: MarketingCampaign } {
    const camp = this.campaigns.find(c => c.id === campaignId);
    if (!camp) {
      return { success: false, message: 'Campaign not found' };
    }

    camp.status = 'COMPLETED';
    camp.executedAt = new Date().toISOString();
    camp.deliveredCount = Math.floor(camp.audienceCount * 0.98);
    camp.failedCount = camp.audienceCount - camp.deliveredCount;
    camp.clicksCount = Math.floor(camp.deliveredCount * 0.42);
    camp.attributedOrders = Math.max(1, Math.floor(camp.clicksCount * 0.28));
    camp.attributedRevenue = camp.attributedOrders * 2850;
    camp.roi = camp.costBdt > 0 ? Number((((camp.attributedRevenue - camp.costBdt) / camp.costBdt) * 100).toFixed(1)) : 100;

    serverDb.addAuditLog(
      'EXECUTE_MARKETING_CAMPAIGN',
      'Marketing',
      camp.id,
      `Executed campaign ${camp.campaignName}. Dispatched to ${camp.deliveredCount} recipients with estimated ৳${camp.attributedRevenue} GMV attribution.`
    );

    return {
      success: true,
      message: `Campaign ${camp.campaignName} dispatched successfully to ${camp.deliveredCount} recipients!`,
      campaign: camp
    };
  }

  // -------------------------------------------------------------
  // 5. CRM Customer Details & Notes
  // -------------------------------------------------------------
  getCrmCustomerDetails(customerId: string): CrmCustomerDetails | null {
    const customer = serverDb.customers.find(c => c.id === customerId);
    if (!customer) return null;

    const { scores } = this.calculateRfmScores();
    const custDistrict = (customer as any).district || (customer.defaultAddress ? customer.defaultAddress.split(',').pop()?.trim() || 'Dhaka' : 'Dhaka');
    const rfm = scores.find(s => s.customerId === customerId) || {
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      district: custDistrict,
      recencyDays: 30,
      frequencyCount: customer.totalOrders,
      monetaryTotal: customer.totalSpent,
      rScore: 3,
      fScore: 3,
      mScore: 3,
      compositeScore: 60,
      segment: 'LOYAL',
      lastOrderDate: new Date().toISOString(),
      avgOrderValue: Math.round(customer.totalSpent / Math.max(1, customer.totalOrders)),
      tags: this.customerTags[customerId] || []
    };

    const recentOrders = serverDb.orders.filter(o => 
      o.customer?.phone === customer.phone || (o.customer?.name || '').toLowerCase() === customer.name.toLowerCase()
    ).slice(0, 10);

    const notes = this.crmNotes[customerId] || [];
    const tags = this.customerTags[customerId] || [];
    const loyaltyWallet = serverDb.loyaltyWallets.find(w => w.customerId === customerId);

    return {
      customer,
      rfm,
      recentOrders,
      notes,
      tags,
      loyaltyWallet
    };
  }

  addCrmNote(customerId: string, text: string, author: string = 'Admin Staff'): CrmCustomerNote {
    if (!this.crmNotes[customerId]) {
      this.crmNotes[customerId] = [];
    }

    const note: CrmCustomerNote = {
      id: `note-${Date.now()}`,
      author,
      text,
      createdAt: new Date().toISOString()
    };

    this.crmNotes[customerId].unshift(note);

    serverDb.addAuditLog(
      'ADD_CRM_NOTE',
      'Marketing',
      customerId,
      `Added internal CRM note for customer ID ${customerId}: "${text.substring(0, 40)}..."`
    );

    return note;
  }

  toggleCustomerTag(customerId: string, tag: string): string[] {
    if (!this.customerTags[customerId]) {
      this.customerTags[customerId] = [];
    }

    const tags = this.customerTags[customerId];
    const idx = tags.indexOf(tag);
    if (idx !== -1) {
      tags.splice(idx, 1);
    } else {
      tags.push(tag);
    }

    serverDb.addAuditLog(
      'UPDATE_CUSTOMER_TAG',
      'Marketing',
      customerId,
      `Updated tags for customer ID ${customerId}: ${tags.join(', ')}`
    );

    return tags;
  }

  getCustomerTags(customerId: string): string[] {
    return this.customerTags[customerId] || [];
  }
}

export const marketingService = new MarketingService();
