import { 
  Product, Category, Order, Customer, InventoryTransaction, 
  ExpenseRecord, AutomationJob, AuditLog, SiteContent, 
  PaymentTransaction, SettlementRecord, WebhookEndpoint, 
  WebhookDeliveryLog, NotificationTemplate, NotificationLog, 
  GatewayConfig, ContentRevision, BlacklistEntry, FraudRuleConfig,
  FraudRiskSettings, FraudRiskAssessment,
  WarehouseHub, WarehouseStockItem, StockTransferOrder, RoutingRuleConfig,
  PickList, DispatchManifest,
  CouponRule, FlashDeal, CustomerLoyaltyWallet, PromotionSystemStats,
  CustomerAddress, WishlistItem, CustomerReturnRequest, CustomerProfile,
  CustomerNotification
} from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Traditional Clothing',
    nameBn: 'ঐতিহ্যবাহী পোশাক',
    slug: 'traditional-clothing',
    description: 'Handwoven Jamdani, Tangail silk, and handcrafted panjabis.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
    itemCount: 14,
    featured: true
  },
  {
    id: 'cat-2',
    name: 'Handicrafts & Decor',
    nameBn: 'হস্তশিল্প ও গৃহসজ্জা',
    slug: 'handicrafts-decor',
    description: 'Authentic clay terracotta, brass art, jute crafts, and Nakshi Kantha.',
    image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&q=80&w=800',
    itemCount: 22,
    featured: true
  },
  {
    id: 'cat-3',
    name: 'Organic & Pantry',
    nameBn: 'খাঁটি ও প্রাকৃতিক খাদ্য',
    slug: 'organic-pantry',
    description: 'Sundarbans raw honey, cold-pressed mustard oil, and premium organic tea.',
    image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8c0a1?auto=format&fit=crop&q=80&w=800',
    itemCount: 18,
    featured: true
  },
  {
    id: 'cat-4',
    name: 'Leather Goods',
    nameBn: 'চামড়ার সামগ্রী',
    slug: 'leather-goods',
    description: 'Handcrafted genuine leather wallets, bags, and luxury accessories.',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800',
    itemCount: 9,
    featured: true
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'Heritage Dhakai Jamdani Saree (84 Count)',
    titleBn: 'ঐতিহ্যবাহী ঢাকাই জামদানি শাড়ি (৮৪ কাউন্ট)',
    slug: 'heritage-dhakai-jamdani-saree',
    description: 'Masterfully woven in Narayanganj by generational artisans. Features fine geometric floral motifs on a lightweight, breathable cotton-silk blend canvas.',
    descriptionBn: 'নারায়ণগঞ্জের ঐতিহ্যবাহী তাঁতশিল্পীদের হাতে বোনা প্রিমিয়াম জামদানি শাড়ি। সূক্ষ্ম কারুকাজ ও মানসম্মত সুতার মেলবন্ধন।',
    price: 4850,
    originalPrice: 5500,
    costPrice: 3200,
    sku: 'KSH-JAM-001',
    category: 'Traditional Clothing',
    categorySlug: 'traditional-clothing',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 12,
    rating: 4.9,
    reviewsCount: 38,
    badge: 'Artisan Crafted',
    badgeBn: 'তাঁতিদের তৈরি',
    isFeatured: true,
    readyToShip: true,
    variants: [
      { id: 'v1', name: 'Emerald Green & Gold', nameBn: 'পান্না সবুজ ও সোনালী', sku: 'KSH-JAM-001-GRN', price: 4850, stock: 6 },
      { id: 'v2', name: 'Crimson Red & Zari', nameBn: 'গাঢ় লাল ও জরি', sku: 'KSH-JAM-001-RED', price: 4850, stock: 6 }
    ],
    attributes: {
      material: '100% Handloom Cotton-Silk',
      origin: 'Rupganj, Narayanganj, Bangladesh',
      weight: '450g'
    }
  },
  {
    id: 'prod-2',
    title: 'Natural Terracotta Flora Vase (Hand-carved)',
    titleBn: 'হাতে খোদাইকৃত পোড়ামাটির ফুলদানি',
    slug: 'natural-terracotta-flora-vase',
    description: 'Hand-shaped from riverside alluvial clay and wood-kiln fired for organic earthy resilience. Treated with natural beeswax for a gentle satin sheen.',
    descriptionBn: 'নদী অববাহিকার প্রাকৃতিক কাদামাটি দিয়ে তৈরি এবং কাঠে পোড়ানো ঐতিহ্যবাহী টেরাকোটা ফুলদানি।',
    price: 1250,
    originalPrice: 1500,
    costPrice: 650,
    sku: 'KSH-TER-002',
    category: 'Handicrafts & Decor',
    categorySlug: 'handicrafts-decor',
    images: [
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 24,
    rating: 4.8,
    reviewsCount: 19,
    badge: 'Handmade',
    badgeBn: 'হস্তনির্মিত',
    isFeatured: true,
    readyToShip: true,
    attributes: {
      material: 'Natural Terracotta Clay',
      origin: 'Bijoypur, Cumilla, Bangladesh',
      weight: '1.2kg'
    }
  },
  {
    id: 'prod-3',
    title: 'Organic Sreemangal Single-Estate Green Tea (250g)',
    titleBn: 'শ্রীমঙ্গলের খাঁটি অর্গানিক গ্রিন টি (২৫০ গ্রাম)',
    slug: 'sreemangal-organic-green-tea',
    description: 'Hand-picked tender buds from the highlands of Sreemangal, Moulvibazar. High in antioxidants, delivering a brisk, floral, and naturally sweet finish.',
    descriptionBn: 'মৌলভীবাজারের শ্রীমঙ্গলের পাহাড় থেকে সংগৃহীত তাজা দুটি পাতা একটি কুঁড়ির খাঁটি অর্গানিক গ্রিন টি।',
    price: 650,
    costPrice: 380,
    sku: 'KSH-TEA-003',
    category: 'Organic & Pantry',
    categorySlug: 'organic-pantry',
    images: [
      'https://images.unsplash.com/photo-1594631252845-29fc4cc8c0a1?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 55,
    rating: 5.0,
    reviewsCount: 64,
    badge: '100% Organic',
    badgeBn: '১০০% খাঁটি',
    isFeatured: true,
    readyToShip: true,
    attributes: {
      material: 'Camellia Sinensis whole leaves',
      origin: 'Sreemangal, Sylhet, Bangladesh',
      weight: '250g'
    }
  },
  {
    id: 'prod-4',
    title: 'Hand-stitched Full Grain Leather Bi-Fold Wallet',
    titleBn: 'খাঁটি চামড়ার হ্যান্ড-স্টিচড মানিব্যাগ',
    slug: 'hand-stitched-full-grain-leather-wallet',
    description: 'Constructed from vegetable-tanned cowhide leather with waxed nylon thread stitching. Includes 8 card slots, dual cash compartments, and RFID blocking layer.',
    descriptionBn: 'প্রিমিয়াম ফুল-গ্রেইন লেদার এবং ওয়াক্সড নাইলন সুতায় হাতে সেলাই করা দীর্ঘস্থায়ী ক্লাসিক মানিব্যাগ।',
    price: 1650,
    originalPrice: 1950,
    costPrice: 900,
    sku: 'KSH-LEA-004',
    category: 'Leather Goods',
    categorySlug: 'leather-goods',
    images: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 18,
    rating: 4.7,
    reviewsCount: 29,
    badge: 'Genuine Leather',
    badgeBn: 'খাঁটি চামড়া',
    isFeatured: true,
    readyToShip: true,
    variants: [
      { id: 'v3', name: 'Vintage Havana Brown', nameBn: 'হাভানা বাদামী', sku: 'KSH-LEA-004-BRN', price: 1650, stock: 10 },
      { id: 'v4', name: 'Midnight Charcoal Black', nameBn: 'কালো', sku: 'KSH-LEA-004-BLK', price: 1650, stock: 8 }
    ],
    attributes: {
      material: 'Vegetable-Tanned Cowhide',
      origin: 'Hazaribagh / Savar, Bangladesh',
      weight: '110g'
    }
  },
  {
    id: 'prod-5',
    title: 'Sundarbans Raw Wildflower Honey (500g Glass Jar)',
    titleBn: 'সুন্দরবনের প্রাকৃতিক চাকের খাঁটি মধু (৫০০ গ্রাম)',
    slug: 'sundarbans-raw-wildflower-honey',
    description: 'Directly sourced from certified forest honey harvesters (Mouals). Unpasteurized, unfiltered, preserving all natural enzymes and pollen.',
    descriptionBn: 'সুন্দরবনের গভীর জঙ্গল থেকে সংগৃহীত অপ্রক্রিয়াজাত ও ১০০% খাঁটি খলিসা ও কেওড়া ফুলের মধু।',
    price: 950,
    costPrice: 600,
    sku: 'KSH-HON-005',
    category: 'Organic & Pantry',
    categorySlug: 'organic-pantry',
    images: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 35,
    rating: 4.9,
    reviewsCount: 47,
    badge: 'Raw & Pure',
    badgeBn: 'চাকের খাঁটি মধু',
    isFeatured: true,
    readyToShip: true,
    attributes: {
      material: '100% Raw Forest Honey',
      origin: 'Sundarbans Forest, Khulna, Bangladesh',
      weight: '500g net'
    }
  },
  {
    id: 'prod-6',
    title: 'Artisanal Nakshi Kantha Embroidered Wall Hanging',
    titleBn: 'নকশী কাঁথা হাতে তৈরি ঐতিহ্যবাহী ওয়াল হ্যাঙ্গিং',
    slug: 'nakshi-kantha-embroidered-wall-hanging',
    description: 'Each piece takes up to 45 days of painstaking embroidery on pure layered cotton, depicting folk motifs of village rivers and rural folklore.',
    descriptionBn: 'গ্রামবাংলার রূপ ও লোকশিল্পের চিত্রায়নে হাতে নিখুঁত সেলাই করা নকশী কাঁথা ওয়ালপিস।',
    price: 3400,
    originalPrice: 4200,
    costPrice: 2100,
    sku: 'KSH-NAK-006',
    category: 'Handicrafts & Decor',
    categorySlug: 'handicrafts-decor',
    images: [
      'https://images.unsplash.com/photo-1605814595856-d621536bafc9?auto=format&fit=crop&q=80&w=800'
    ],
    stock: 5,
    rating: 4.9,
    reviewsCount: 14,
    badge: 'Collector Edition',
    badgeBn: 'বিশেষ সংগ্রহ',
    isFeatured: true,
    readyToShip: true,
    attributes: {
      material: '100% Pure Cotton with Silk Threading',
      origin: 'Jessore, Bangladesh',
      weight: '600g'
    }
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'KSH-2026-0891',
    createdAt: '2026-08-29T14:32:00+06:00',
    customer: {
      id: 'cust-1',
      name: 'Tanzil Ahmed',
      phone: '+8801712345678',
      email: 'tanzil.ahmed@example.com'
    },
    shippingAddress: {
      firstName: 'Tanzil',
      lastName: 'Ahmed',
      phone: '+8801712345678',
      email: 'tanzil.ahmed@example.com',
      address: 'Flat 4B, House 18, Road 11, Banani',
      division: 'Dhaka',
      district: 'Dhaka',
      thana: 'Banani',
      postalCode: '1213'
    },
    items: [
      {
        productId: 'prod-1',
        title: 'Heritage Dhakai Jamdani Saree (84 Count)',
        titleBn: 'ঐতিহ্যবাহী ঢাকাই জামদানি শাড়ি',
        price: 4850,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200',
        sku: 'KSH-JAM-001',
        variantName: 'Emerald Green & Gold'
      }
    ],
    subtotal: 4850,
    shippingFee: 80,
    discount: 0,
    total: 4930,
    paymentMethod: 'COD',
    paymentStatus: 'UNPAID',
    settlementStatus: 'PENDING',
    orderStatus: 'READY_TO_SHIP',
    verificationStatus: 'PHONE_VERIFIED',
    verificationNotes: 'Customer confirmed order by phone call on 29 Aug.',
    fraudRisk: {
      riskScore: 15,
      riskRating: 'LOW',
      flags: ['RETURNING_CUSTOMER'],
      reasons: ['Customer has 4 prior successful deliveries with 100% completion.'],
      recommendation: 'AUTO_APPROVE',
      breakdown: {
        phoneScore: 0,
        addressScore: 5,
        valueScore: 10,
        velocityScore: 0,
        historyScore: -10,
        emailScore: 0
      },
      evaluatedAt: '2026-08-29T14:32:00+06:00'
    },
    courier: {
      provider: 'Steadfast',
      trackingId: 'SF-94821033',
      consignmentId: 'CID-884920',
      status: 'CREATED',
      estimatedDelivery: '2026-08-31'
    },
    timeline: [
      { status: 'PENDING', timestamp: '2026-08-29T14:32:00+06:00', note: 'Order placed by customer via Cash on Delivery.', updatedBy: 'SYSTEM' },
      { status: 'CONFIRMED', timestamp: '2026-08-29T14:45:00+06:00', note: 'Customer confirmed phone verification.', updatedBy: 'ORDER_MANAGER' },
      { status: 'PROCESSING', timestamp: '2026-08-29T15:10:00+06:00', note: 'Items packed in warehouse with barcode label.', updatedBy: 'INVENTORY_MANAGER' },
      { status: 'READY_TO_SHIP', timestamp: '2026-08-29T16:00:00+06:00', note: 'Courier consignment booked with Steadfast.', updatedBy: 'SYSTEM' }
    ]
  },
  {
    id: 'ord-102',
    orderNumber: 'KSH-2026-0890',
    createdAt: '2026-08-28T19:15:00+06:00',
    customer: {
      id: 'cust-2',
      name: 'Nusrat Jahan',
      phone: '+8801819988776',
      email: 'nusrat.jahan@example.com'
    },
    shippingAddress: {
      firstName: 'Nusrat',
      lastName: 'Jahan',
      phone: '+8801819988776',
      address: 'House 5, Road 2, O.R. Nizam Road',
      division: 'Chittagong',
      district: 'Chittagong',
      thana: 'Panchlaish',
      postalCode: '4000'
    },
    items: [
      {
        productId: 'prod-3',
        title: 'Organic Sreemangal Single-Estate Green Tea (250g)',
        titleBn: 'শ্রীমঙ্গলের খাঁটি অর্গানিক গ্রিন টি',
        price: 650,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8c0a1?auto=format&fit=crop&q=80&w=200',
        sku: 'KSH-TEA-003'
      },
      {
        productId: 'prod-5',
        title: 'Sundarbans Raw Wildflower Honey (500g Glass Jar)',
        titleBn: 'সুন্দরবনের প্রাকৃতিক চাকের খাঁটি মধু',
        price: 950,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=200',
        sku: 'KSH-HON-005'
      }
    ],
    subtotal: 2250,
    shippingFee: 150,
    discount: 100,
    total: 2300,
    paymentMethod: 'SSLCOMMERZ',
    paymentStatus: 'PAID',
    settlementStatus: 'ELIGIBLE',
    orderStatus: 'SHIPPED',
    verificationStatus: 'PHONE_VERIFIED',
    fraudRisk: {
      riskScore: 5,
      riskRating: 'LOW',
      flags: ['PREPAID_GATEWAY'],
      reasons: ['Payment fully settled via SSLCOMMERZ 3DS verified card.'],
      recommendation: 'AUTO_APPROVE',
      breakdown: {
        phoneScore: 0,
        addressScore: 0,
        valueScore: 5,
        velocityScore: 0,
        historyScore: 0,
        emailScore: 0
      },
      evaluatedAt: '2026-08-28T19:15:00+06:00'
    },
    courier: {
      provider: 'Steadfast',
      trackingId: 'SF-94819022',
      consignmentId: 'CID-884811',
      status: 'IN_TRANSIT',
      dispatchedAt: '2026-08-29T10:00:00+06:00',
      estimatedDelivery: '2026-08-31'
    },
    timeline: [
      { status: 'PENDING', timestamp: '2026-08-28T19:15:00+06:00', note: 'Order checkout initiated.', updatedBy: 'SYSTEM' },
      { status: 'CONFIRMED', timestamp: '2026-08-28T19:17:00+06:00', note: 'Payment verified via SSLCOMMERZ IPN server webhook.', updatedBy: 'GATEWAY_SERVICE' },
      { status: 'PROCESSING', timestamp: '2026-08-29T09:00:00+06:00', note: 'Packed at central fulfillment center.', updatedBy: 'INVENTORY_MANAGER' },
      { status: 'SHIPPED', timestamp: '2026-08-29T10:00:00+06:00', note: 'Handed over to Steadfast courier rider.', updatedBy: 'ORDER_MANAGER' }
    ]
  },
  {
    id: 'ord-103',
    orderNumber: 'KSH-2026-0889',
    createdAt: '2026-09-01T10:20:00+06:00',
    customer: {
      id: 'cust-4',
      name: 'Rahim Uddin',
      phone: '+8801755123987',
      email: 'rahim.uddin@gmail.com'
    },
    shippingAddress: {
      firstName: 'Rahim',
      lastName: 'Uddin',
      phone: '+8801755123987',
      address: 'Near Bazar, Thana Road',
      division: 'Sylhet',
      district: 'Habiganj',
      thana: 'Madhabpur',
      postalCode: '3330'
    },
    items: [
      {
        productId: 'prod-4',
        title: 'Pure Vegetable-Tanned Leather Long Wallet',
        titleBn: 'চামড়ার মানিব্যাগ',
        price: 2450,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200',
        sku: 'KSH-LEA-004'
      }
    ],
    subtotal: 4900,
    shippingFee: 150,
    discount: 0,
    total: 5050,
    paymentMethod: 'COD',
    paymentStatus: 'UNPAID',
    settlementStatus: 'PENDING',
    orderStatus: 'PENDING',
    verificationStatus: 'UNVERIFIED',
    fraudRisk: {
      riskScore: 50,
      riskRating: 'MEDIUM',
      flags: ['SHORT_VAGUE_ADDRESS', 'FIRST_TIME_HIGH_VALUE_COD'],
      reasons: [
        'Delivery address "Near Bazar, Thana Road" is generic and lacks house/holding number.',
        'First time buyer placing Cash-on-Delivery order exceeding ৳5,000 threshold.'
      ],
      recommendation: 'REQUIRE_PHONE_VERIFICATION',
      breakdown: {
        phoneScore: 5,
        addressScore: 25,
        valueScore: 20,
        velocityScore: 0,
        historyScore: 0,
        emailScore: 0
      },
      evaluatedAt: '2026-09-01T10:20:00+06:00'
    },
    courier: {
      provider: 'Steadfast',
      status: 'CREATED'
    },
    timeline: [
      { status: 'PENDING', timestamp: '2026-09-01T10:20:00+06:00', note: 'Order placed via COD. Triggered Medium Risk: Phone verification needed.', updatedBy: 'FRAUD_ENGINE' }
    ]
  },
  {
    id: 'ord-104',
    orderNumber: 'KSH-2026-0888',
    createdAt: '2026-09-01T15:40:00+06:00',
    customer: {
      id: 'cust-5',
      name: 'Kamrul Hasan',
      phone: '+8801988776655',
      email: 'kamrul.hasan@tempmail.com'
    },
    shippingAddress: {
      firstName: 'Kamrul',
      lastName: 'Hasan',
      phone: '+8801988776655',
      address: 'Village Char Madaripur, Ward 3',
      division: 'Barisal',
      district: 'Bhola',
      thana: 'Char Fasson',
      postalCode: '8340'
    },
    items: [
      {
        productId: 'prod-1',
        title: 'Heritage Dhakai Jamdani Saree (84 Count)',
        titleBn: 'ঐতিহ্যবাহী ঢাকাই জামদানি শাড়ি',
        price: 4850,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200',
        sku: 'KSH-JAM-001'
      }
    ],
    subtotal: 9700,
    shippingFee: 150,
    discount: 0,
    total: 9850,
    paymentMethod: 'COD',
    paymentStatus: 'UNPAID',
    settlementStatus: 'PENDING',
    orderStatus: 'PENDING',
    verificationStatus: 'UNVERIFIED',
    fraudRisk: {
      riskScore: 78,
      riskRating: 'HIGH',
      flags: ['EXTREME_VALUE_COD', 'DISPOSABLE_EMAIL', 'REMOTE_LOGISTICS_ZONE'],
      reasons: [
        'Extreme value COD order (৳9,850) for unverified first-time buyer.',
        'Disposable temporary email domain (tempmail.com) detected.',
        'Remote island delivery zone (Char Fasson, Bhola) with high courier return rate.'
      ],
      recommendation: 'REQUIRE_ADVANCE_SHIPPING_FEE',
      breakdown: {
        phoneScore: 10,
        addressScore: 20,
        valueScore: 35,
        velocityScore: 0,
        historyScore: 0,
        emailScore: 35
      },
      evaluatedAt: '2026-09-01T15:40:00+06:00'
    },
    courier: {
      provider: 'Steadfast',
      status: 'CREATED'
    },
    timeline: [
      { status: 'PENDING', timestamp: '2026-09-01T15:40:00+06:00', note: 'Order flagged as High Risk (Score: 78). Advance shipping charge (৳150) required.', updatedBy: 'FRAUD_ENGINE' }
    ]
  },
  {
    id: 'ord-105',
    orderNumber: 'KSH-2026-0887',
    createdAt: '2026-09-02T01:10:00+06:00',
    customer: {
      id: 'cust-6',
      name: 'Fake Buyer',
      phone: '+8801999999999',
      email: 'spambot@guerrillamail.com'
    },
    shippingAddress: {
      firstName: 'Fake',
      lastName: 'Buyer',
      phone: '+8801999999999',
      address: 'test 1234',
      division: 'Dhaka',
      district: 'Dhaka',
      thana: 'Mirpur',
      postalCode: '1216'
    },
    items: [
      {
        productId: 'prod-6',
        title: 'Artisanal Nakshi Kantha Embroidered Wall Hanging',
        titleBn: 'নকশী কাঁথা ওয়ালপিস',
        price: 3400,
        quantity: 3,
        image: 'https://images.unsplash.com/photo-1605814595856-d621536bafc9?auto=format&fit=crop&q=80&w=200',
        sku: 'KSH-NAK-006'
      }
    ],
    subtotal: 10200,
    shippingFee: 80,
    discount: 0,
    total: 10280,
    paymentMethod: 'COD',
    paymentStatus: 'CANCELLED',
    settlementStatus: 'CANCELLED',
    orderStatus: 'CANCELLED',
    verificationStatus: 'REJECTED',
    verificationNotes: 'Strict auto-block triggered: Phone number is on confirmed fraud blacklist.',
    fraudRisk: {
      riskScore: 98,
      riskRating: 'SUSPICIOUS',
      flags: ['PHONE_BLACKLISTED', 'SHORT_VAGUE_ADDRESS', 'DISPOSABLE_EMAIL'],
      reasons: [
        'CRITICAL: Phone number (+8801999999999) matches active fraud blacklist.',
        'Address "test 1234" is dummy test placeholder.',
        'Disposable email address domain detected.'
      ],
      recommendation: 'BLOCK',
      breakdown: {
        phoneScore: 90,
        addressScore: 30,
        valueScore: 35,
        velocityScore: 10,
        historyScore: 40,
        emailScore: 35
      },
      evaluatedAt: '2026-09-02T01:10:00+06:00'
    },
    courier: {
      provider: 'Manual',
      status: 'CANCELLED'
    },
    timeline: [
      { status: 'CANCELLED', timestamp: '2026-09-02T01:10:00+06:00', note: 'Auto-cancelled by Fraud Engine: Blacklisted phone number matched.', updatedBy: 'SECURITY_AUTOMATION' }
    ]
  },
  {
    id: 'ord-106',
    orderNumber: 'KSH-2026-0886',
    createdAt: '2026-09-02T16:20:00+06:00',
    orderSource: 'WHATSAPP',
    channelDetails: {
      channel: 'WHATSAPP',
      channelName: 'WhatsApp Business Chat',
      socialHandleOrChatId: '+8801718899001',
      whatsappNumber: '+8801718899001',
      operatorName: 'Sultana Razia (Sales Executive)',
      operatorRole: 'ORDER_MANAGER',
      chatNotes: 'Customer sent product screenshot on WhatsApp. Verified color and size. Paid ৳200 delivery fee advance via bKash Personal.',
      confirmedViaChat: true
    },
    advancePayment: {
      isPaid: true,
      amount: 200,
      method: 'BKASH',
      trxId: 'BKP98271034',
      receivedAt: '2026-09-02T16:15:00+06:00',
      receivedBy: 'Sultana Razia',
      verified: true,
      notes: 'bKash Transaction verified via SMS receipt.'
    },
    customer: {
      id: 'cust-7',
      name: 'Farhana Chowdhury',
      phone: '+8801718899001',
      email: 'farhana.chowdhury@gmail.com',
      whatsappNumber: '+8801718899001'
    },
    shippingAddress: {
      firstName: 'Farhana',
      lastName: 'Chowdhury',
      phone: '+8801718899001',
      address: 'House 24, Road 7, Block C, Uttara Sector 4',
      division: 'Dhaka',
      district: 'Dhaka',
      thana: 'Uttara',
      postalCode: '1230'
    },
    items: [
      {
        productId: 'prod-1',
        title: 'Heritage Dhakai Jamdani Saree (84 Count)',
        titleBn: 'ঐতিহ্যবাহী ঢাকাই জামদানি শাড়ি',
        price: 4850,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200',
        sku: 'KSH-JAM-001',
        variantName: 'Ruby Red & Gold'
      }
    ],
    subtotal: 4850,
    shippingFee: 80,
    discount: 150,
    total: 4780,
    balanceDueCod: 4580,
    paymentMethod: 'COD',
    paymentStatus: 'UNPAID',
    settlementStatus: 'PENDING',
    orderStatus: 'CONFIRMED',
    verificationStatus: 'ADVANCE_PAID',
    verificationNotes: 'WhatsApp Order: ৳200 delivery fee advance paid via bKash TrxID: BKP98271034. Balance COD ৳4,580.',
    fraudRisk: {
      riskScore: 8,
      riskRating: 'LOW',
      flags: ['WHATSAPP_ADVANCE_PAID'],
      reasons: ['Advance delivery payment received and verified via bKash.'],
      recommendation: 'AUTO_APPROVE',
      breakdown: {
        phoneScore: 0,
        addressScore: 0,
        valueScore: 5,
        velocityScore: 0,
        historyScore: 0,
        emailScore: 0
      },
      evaluatedAt: '2026-09-02T16:20:00+06:00'
    },
    courier: {
      provider: 'Steadfast',
      status: 'CREATED'
    },
    whatsappConfirmationSent: true,
    timeline: [
      { status: 'PENDING', timestamp: '2026-09-02T16:20:00+06:00', note: 'Assisted order booked via WhatsApp Chat by Sultana Razia.', updatedBy: 'Sultana Razia' },
      { status: 'CONFIRMED', timestamp: '2026-09-02T16:25:00+06:00', note: 'Advance ৳200 confirmed. WhatsApp confirmation invoice sent to customer.', updatedBy: 'Sultana Razia' }
    ]
  },
  {
    id: 'ord-107',
    orderNumber: 'KSH-2026-0885',
    createdAt: '2026-09-03T09:10:00+06:00',
    orderSource: 'MESSENGER',
    channelDetails: {
      channel: 'MESSENGER',
      channelName: 'Facebook Messenger Inbox',
      socialHandleOrChatId: 'fb.me/anwar.hossain.bd',
      operatorName: 'Muntasir Shihab',
      operatorRole: 'SUPER_ADMIN',
      chatNotes: 'Customer asked for discount on 2 leather wallets on Facebook page inbox.',
      confirmedViaChat: true
    },
    customer: {
      id: 'cust-8',
      name: 'Anwar Hossain',
      phone: '+8801612445566',
      email: 'anwar.hossain@yahoo.com',
      socialProfile: 'facebook.com/anwar.hossain.bd'
    },
    shippingAddress: {
      firstName: 'Anwar',
      lastName: 'Hossain',
      phone: '+8801612445566',
      address: 'Shahjalal Upashahar, Block B, Main Road',
      division: 'Sylhet',
      district: 'Sylhet',
      thana: 'Sylhet Sadar',
      postalCode: '3100'
    },
    items: [
      {
        productId: 'prod-4',
        title: 'Hand-stitched Full Grain Leather Bi-Fold Wallet',
        titleBn: 'খাঁটি চামড়ার মানিব্যাগ',
        price: 1650,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200',
        sku: 'KSH-LEA-004',
        variantName: 'Vintage Havana Brown'
      }
    ],
    subtotal: 3300,
    shippingFee: 130,
    discount: 200,
    total: 3230,
    balanceDueCod: 3230,
    paymentMethod: 'COD',
    paymentStatus: 'UNPAID',
    settlementStatus: 'PENDING',
    orderStatus: 'PROCESSING',
    verificationStatus: 'PHONE_VERIFIED',
    courier: {
      provider: 'Steadfast',
      status: 'CREATED'
    },
    timeline: [
      { status: 'PENDING', timestamp: '2026-09-03T09:10:00+06:00', note: 'Order created from Facebook Messenger conversation.', updatedBy: 'Muntasir Shihab' },
      { status: 'PROCESSING', timestamp: '2026-09-03T09:20:00+06:00', note: 'Sent to packing desk with custom greeting card.', updatedBy: 'INVENTORY_MANAGER' }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Tanzil Ahmed',
    phone: '+8801712345678',
    email: 'tanzil.ahmed@example.com',
    joinedDate: '2026-02-14',
    totalOrders: 4,
    totalSpent: 16800,
    defaultAddress: 'Flat 4B, House 18, Road 11, Banani, Dhaka',
    status: 'ACTIVE'
  },
  {
    id: 'cust-2',
    name: 'Nusrat Jahan',
    phone: '+8801819988776',
    email: 'nusrat.jahan@example.com',
    joinedDate: '2026-03-01',
    totalOrders: 2,
    totalSpent: 5150,
    defaultAddress: 'House 5, Road 2, O.R. Nizam Road, Chittagong',
    status: 'ACTIVE'
  },
  {
    id: 'cust-3',
    name: 'Shakil Mahmud',
    phone: '+8801911223344',
    email: 'shakil.m@example.com',
    joinedDate: '2026-05-19',
    totalOrders: 1,
    totalSpent: 1250,
    defaultAddress: 'Rajshahi City Center, Rajshahi',
    status: 'ACTIVE'
  }
];

export const INITIAL_CONTENT: SiteContent = {
  brandName: 'KISHOLOY',
  brandNameBn: 'কিশলয়',
  tagline: 'Artisanal Heritage & Natural Living',
  taglineBn: 'ঐতিহ্যবাহী হস্তশিল্প ও খাঁটি পণ্যের বিশ্বস্ত ঠিকানা',
  motto: 'Preserving Heritage, Empowering Artisans',
  mottoBn: 'বাংলার ঐতিহ্য সংরক্ষণ ও কারিগরদের ক্ষমতায়ন',
  logoUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200',
  logoDarkUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200',
  logoType: 'BOTH_IMAGE_AND_TEXT',
  logoHeight: 44,
  logoEmblemStyle: 'leaf_sprout',
  faviconUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=64',
  tradeLicense: 'TRAD/DNCC/094281/2026',
  announcementBar: {
    enabled: true,
    text: 'Free Delivery inside Dhaka on orders above ৳3,000 | Cash on Delivery Available Nationwide',
    textBn: '৳৩,০০০ এর বেশি অর্ডারে ঢাকায় ফ্রি ডেলিভারি | সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা',
    linkUrl: '/shop',
    linkLabel: 'Shop Now',
    linkLabelBn: 'এখনই কিনুন',
    theme: 'midnight'
  },
  hero: {
    eyebrow: 'Crafted with Soul in Bangladesh',
    eyebrowBn: 'বাংলার কারিগরদের হৃদয়ের ছোঁয়া',
    title: 'Discover Timeless Heritage & Natural Craftsmanship',
    titleBn: 'আবিষ্কার করুন আবহমান ঐতিহ্য ও খাঁটি জীবনের রূপ',
    subtitle: 'From authentic Dhakai Jamdani to hand-harvested Sundarbans honey, bringing the finest ethical products straight from generational creators to your home.',
    subtitleBn: 'ঐতিহ্যবাহী ঢাকাই জামদানি থেকে সুন্দরবনের খাঁটি মধু—সেরা দেশীয় পণ্য সরাসরি আপনার দোরগোড়ায়।',
    ctaPrimaryText: 'Explore Catalog',
    ctaPrimaryTextBn: 'পণ্যসমূহ দেখুন',
    ctaPrimaryUrl: '/shop',
    ctaSecondaryText: 'Our Artisans',
    ctaSecondaryTextBn: 'আমাদের কারিগর গল্প',
    ctaSecondaryUrl: '/pages/about',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1600',
    overlayOpacity: 45
  },
  promoBanners: [
    {
      id: 'promo-1',
      title: 'Heritage Jamdani Masterpieces',
      titleBn: 'ঐতিহ্যবাহী জামদানি কালেকশন',
      subtitle: 'Handwoven in Narayanganj with 84-count pure cotton-silk yarn.',
      subtitleBn: 'নারায়ণগঞ্জের ঐতিহ্যবাহী তাঁতিদের নিখুঁত বুনন ও নান্দনিক নকশা।',
      badge: 'Artisan Special',
      badgeBn: 'তাঁত উৎসব',
      ctaText: 'Shop Jamdani',
      ctaTextBn: 'জামদানি কিনুন',
      link: '/category/traditional-clothing',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
      position: 'TOP_CAROUSEL',
      enabled: true
    },
    {
      id: 'promo-2',
      title: 'Pure Sundarbans Wild Honey',
      titleBn: 'সুন্দরবনের প্রাকৃতিক খলিশা মধু',
      subtitle: 'Raw, unpasteurized, and ethically harvested by local Mawalis.',
      subtitleBn: '১০০% খাঁটি ও অপ্রক্রিয়াজাত সরাসরি সুন্দরবনের মৌয়ালদের সংগৃহীত।',
      badge: '100% Organic',
      badgeBn: '১০০% খাঁটি',
      ctaText: 'Order Pantry Items',
      ctaTextBn: 'অর্ডার করুন',
      link: '/category/organic-pantry',
      image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8c0a1?auto=format&fit=crop&q=80&w=800',
      position: 'MID_PAGE',
      enabled: true
    },
    {
      id: 'promo-3',
      title: 'Hand-Carved Clay Terracotta Decor',
      titleBn: 'পোড়ামাটির নান্দনিক গৃহসজ্জা',
      subtitle: 'Eco-friendly riverside alluvial clay fired in traditional wood kilns.',
      subtitleBn: 'পরিবেশবান্ধব পলিমাটি এবং কাঠের আগুনে পোড়ানো নিখুঁত টেরাকোটা।',
      badge: 'Eco Living',
      badgeBn: 'প্রাকৃতিক শিল্প',
      ctaText: 'Explore Decor',
      ctaTextBn: 'গৃহসজ্জা দেখুন',
      link: '/category/handicrafts-decor',
      image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&q=80&w=800',
      position: 'BOTTOM_CALLOUT',
      enabled: true
    }
  ],
  sectionSettings: {
    showAnnouncement: true,
    showHero: true,
    showCuratedCategories: true,
    showFeaturedProducts: true,
    showArtisanSpotlight: true,
    showPillars: true,
    categoriesTitle: 'Explore by Category',
    categoriesTitleBn: 'জনপ্রিয় ক্যাটাগরি',
    featuredTitle: 'Featured Masterpieces',
    featuredTitleBn: 'বিশেষ নির্বাচিত পণ্য',
    artisanTitle: 'Revitalizing Bangladesh’s Living Craft Traditions',
    artisanTitleBn: 'শতবর্ষের তাঁত ও মৃত্তিকা শিল্পের নতুন উন্মেষ',
    artisanStory: 'Every purchase at Kisholoy directly supports rural weavers in Rupganj, potters in Cumilla, and honey gatherers in the Sundarbans. We ensure fair pricing, ethical working conditions, and authentic quality.',
    artisanStoryBn: 'কিশলয়ের প্রতিটি কেনাকাটা সরাসরি গ্রামীণ কারিগরদের আর্থিক স্বাবলম্বিতা নিশ্চিত করে। আমরা নিশ্চিত করি ন্যায্য পারিশ্রমিক ও খাঁটি গুণমান।',
    artisanImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800'
  },
  navLinks: [
    { id: 'nav-1', name: 'Home', nameBn: 'হোম', path: '/', order: 1, enabled: true },
    { id: 'nav-2', name: 'Shop All', nameBn: 'সকল পণ্য', path: '/shop', order: 2, enabled: true },
    { id: 'nav-3', name: 'Apparel', nameBn: 'পোশাক', path: '/category/traditional-clothing', order: 3, enabled: true },
    { id: 'nav-4', name: 'Handicrafts', nameBn: 'হস্তশিল্প', path: '/category/handicrafts-decor', order: 4, enabled: true },
    { id: 'nav-5', name: 'Organic Food', nameBn: 'অর্গানিক ফুড', path: '/category/organic-pantry', order: 5, enabled: true },
    { id: 'nav-6', name: 'Track Order', nameBn: 'অর্ডার ট্র্যাক', path: '/track-order', order: 6, enabled: true }
  ],
  contact: {
    phone: '+880 1700-000000',
    email: 'hello@kisholoy.com.bd',
    whatsappNumber: '+8801700000000',
    address: 'Plot 12, Road 4, Sector 3, Uttara, Dhaka 1230, Bangladesh',
    addressBn: 'প্লট ১২, রোড ৪, সেক্টর ৩, উত্তরা, ঢাকা ১২৩০, বাংলাদেশ',
    hours: 'Saturday – Thursday: 9:00 AM – 9:00 PM (Friday Closed)',
    hoursBn: 'শনিবার – বৃহস্পতিবার: সকাল ৯:০০ – রাত ৯:০০ (শুক্রবার বন্ধ)',
    facebookUrl: 'https://facebook.com/kisholoy.bd',
    instagramUrl: 'https://instagram.com/kisholoy.bd',
    youtubeUrl: 'https://youtube.com/@kisholoy-bd'
  },
  shippingFees: {
    insideDhaka: 80,
    subDhaka: 110,
    outsideDhaka: 150,
    freeShippingThreshold: 3000,
    deliveryTimeInsideDhaka: '24-48 hours',
    deliveryTimeOutsideDhaka: '2-4 days'
  },
  policies: {
    terms: `Welcome to KISHOLOY (কিশলয়). By accessing our website and ordering goods, you acknowledge and agree to comply with all applicable Bangladesh trade and commerce guidelines.\n\n1. Pricing & Currency: All prices are denominated in Bangladesh Taka (BDT) and are inclusive of standard local VAT/taxes where applicable.\n2. Order Verification: To safeguard against fraudulent checkout, we may verify high-value or Cash-On-Delivery orders via phone or SMS confirmation prior to fulfillment.\n3. Fair Trade & Quality: All items are genuine, non-counterfeit, and verified directly from source artisan clusters in Bangladesh.`,
    privacy: `At KISHOLOY, protecting your personal data is a fundamental commitment. We only collect the minimal information necessary to deliver your artisanal parcels safely.\n\n• Information Collected: Customer name, delivery address, phone number, and optional email for order status notifications.\n• Data Security: We never sell or lease customer contact lists to third-party advertisers.\n• SMS & Communications: Transactional notifications (dispatched, delivered, OTP) are processed via secure encrypted gateway channels.`,
    returns: `We provide a hassle-free 7-Day Return and Replacement Policy for all our authentic products.\n\n• Apparel & Textiles: Must be unused, unwashed, and in original packaging with intact tags.\n• Pottery & Delicate Handicrafts: In case of transit damage, notify our hotline or WhatsApp within 24 hours with photos for an immediate free replacement.\n• Organic & Pantry Items: Sealed food products can be returned if defective or unsealed upon delivery.\n• Refund Timeline: Approved refunds are processed via bKash, Nagad, or original payment method within 3 to 5 business days.`,
    shipping: `We partner with Steadfast Courier and Pathao Courier to provide insured nationwide door-to-door delivery.\n\n• Inside Dhaka Metropolitan: ৳80 delivery fee | 24 to 48 Hours turnaround.\n• Dhaka Suburbs (Savar, Gazipur, Keraniganj, Narayanganj): ৳110 delivery fee | 48 Hours.\n• Outside Dhaka (All 64 Districts): ৳150 delivery fee | 2 to 4 Business Days.\n• Free Delivery: Automatic free shipping on all orders over ৳3,000 BDT nationwide.`,
    about: `KISHOLOY (কিশলয়) is an ethical Bangladesh lifestyle and heritage e-commerce platform dedicated to celebrating generational craftsmanship.\n\nWe connect skilled handloom weavers in Rupganj and Tangail, terracotta potters in Cumilla and Rayerbazar, and honey harvesters in the Sundarbans directly with conscious modern consumers across Bangladesh.\n\nBy eliminating exploitative middlemen, we guarantee that rural artisans earn living wages while preserving our country's endangered living heritage.`,
    faq: `Frequently Asked Questions:\n\nQ: Is Cash on Delivery (COD) available nationwide?\nA: Yes! We offer Cash on Delivery across all 64 districts of Bangladesh.\n\nQ: How do I track my order?\nA: Simply visit the "Track Order" page and enter your 11-digit phone number or order reference (e.g. KSH-2026-0891).\n\nQ: Are your Jamdani sarees authentic?\nA: Every single Jamdani is sourced directly from certified generational weavers in Narayanganj with verified thread count specifications.`
  }
};

export const INITIAL_CONTENT_REVISIONS: ContentRevision[] = [
  {
    id: 'rev-2',
    timestamp: '2026-08-29T17:30:00+06:00',
    operator: 'Super Admin',
    summary: 'Updated Eid promo banner copy and added free shipping threshold notice',
    snapshot: JSON.parse(JSON.stringify(INITIAL_CONTENT))
  },
  {
    id: 'rev-1',
    timestamp: '2026-08-25T11:00:00+06:00',
    operator: 'System Bootstrapper',
    summary: 'Initial baseline store branding and policy publication',
    snapshot: JSON.parse(JSON.stringify(INITIAL_CONTENT))
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-08-29T16:00:00+06:00',
    operator: 'Super Admin',
    role: 'SUPER_ADMIN',
    action: 'COURIER_DISPATCH',
    resource: 'Order',
    resourceId: 'KSH-2026-0891',
    details: 'Generated Steadfast Consignment ID SF-94821033',
    ipAddress: '103.145.118.22'
  },
  {
    id: 'aud-2',
    timestamp: '2026-08-29T15:10:00+06:00',
    operator: 'Farhan Kabir',
    role: 'INVENTORY_MANAGER',
    action: 'STOCK_RESERVATION_CONFIRMED',
    resource: 'Inventory',
    resourceId: 'KSH-JAM-001-GRN',
    details: 'Allocated 1 unit for Order KSH-2026-0891',
    ipAddress: '103.145.118.22'
  },
  {
    id: 'aud-3',
    timestamp: '2026-08-28T19:17:00+06:00',
    operator: 'SSLCOMMERZ Webhook',
    role: 'ADMIN',
    action: 'PAYMENT_CAPTURED',
    resource: 'Payment',
    resourceId: 'SSL-TXN-948291',
    details: 'Verified IPN signature, amount ৳2,300 match exact subtotal',
    ipAddress: '103.206.185.12'
  }
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    date: '2026-08-28',
    category: 'PACKAGING',
    vendor: 'EcoPack BD Ltd.',
    amount: 14500,
    reference: 'INV-EP-4920',
    notes: '500 custom branded recycled mailer boxes and tape rolls'
  },
  {
    id: 'exp-2',
    date: '2026-08-27',
    category: 'COURIER_FEES',
    vendor: 'Steadfast Courier',
    amount: 6800,
    reference: 'ST-BILL-8812',
    notes: 'Bi-weekly shipment settlement charge'
  },
  {
    id: 'exp-3',
    date: '2026-08-25',
    category: 'MARKETING',
    vendor: 'Meta Ads',
    amount: 12000,
    reference: 'FB-ACT-99120',
    notes: 'Bangla Jamdani Saree & Honey festive campaign'
  }
];

export const INITIAL_PAYMENT_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: 'ptx-1',
    orderNumber: 'KSH-2026-0891',
    gateway: 'SSLCOMMERZ',
    amount: 4910,
    currency: 'BDT',
    transactionId: 'SSL-TXN-948291',
    bankTranId: 'BNK-CITY-77291',
    valId: 'VAL-88392019',
    cardType: 'VISA-CITY-BANK',
    status: 'VALID',
    riskLevel: 'LOW',
    feeDeducted: 122.75, // 2.5%
    netDisbursed: 4787.25,
    settledAt: '2026-08-29T10:00:00+06:00',
    createdAt: '2026-08-29T09:30:00+06:00',
    rawIpnPayload: {
      tran_id: 'KSH-2026-0891',
      val_id: 'VAL-88392019',
      amount: '4910.00',
      card_type: 'VISA-CITY-BANK',
      bank_tran_id: 'BNK-CITY-77291',
      status: 'VALID',
      risk_level: '0',
      risk_title: 'Safe'
    }
  },
  {
    id: 'ptx-2',
    orderNumber: 'KSH-2026-0890',
    gateway: 'BKASH_TOKENIZED',
    amount: 1910,
    currency: 'BDT',
    transactionId: 'BKASH-TRX-9J44910',
    valId: 'BK-VAL-1192',
    cardType: 'BKASH-WALLET',
    status: 'VALID',
    riskLevel: 'LOW',
    feeDeducted: 28.65, // 1.5%
    netDisbursed: 1881.35,
    settledAt: '2026-08-28T20:00:00+06:00',
    createdAt: '2026-08-28T19:45:00+06:00',
    rawIpnPayload: {
      paymentID: 'BKASH_PID_9921',
      trxID: 'BKASH-TRX-9J44910',
      amount: '1910.00',
      transactionStatus: 'Completed'
    }
  },
  {
    id: 'ptx-3',
    orderNumber: 'KSH-2026-0888',
    gateway: 'COD_CASH',
    amount: 1040,
    currency: 'BDT',
    transactionId: 'COD-ST-88190',
    status: 'VALID',
    riskLevel: 'LOW',
    feeDeducted: 10.40, // 1% courier COD commission
    netDisbursed: 1029.60,
    settledAt: '2026-08-27T17:00:00+06:00',
    createdAt: '2026-08-27T16:00:00+06:00'
  }
];

export const INITIAL_SETTLEMENTS: SettlementRecord[] = [
  {
    id: 'set-1',
    batchNumber: 'SET-SSL-20260829',
    gateway: 'SSLCOMMERZ',
    bankAccount: 'City Bank AC ***4921 (Kisholoy Ent.)',
    periodStart: '2026-08-28T00:00:00+06:00',
    periodEnd: '2026-08-29T23:59:59+06:00',
    totalOrders: 4,
    grossAmount: 18450,
    gatewayFee: 461.25, // 2.5% MDR
    taxDeducted: 0,
    netPayout: 17988.75,
    status: 'SETTLED',
    payoutDate: '2026-08-30T11:45:00+06:00',
    utrOrReference: 'NPSB-CB-88391029',
    notes: 'Bi-daily automated batch transfer from SSLCOMMERZ merchant pool'
  },
  {
    id: 'set-2',
    batchNumber: 'SET-BKASH-20260828',
    gateway: 'BKASH',
    bankAccount: 'bKash Merchant 01700000000',
    periodStart: '2026-08-27T00:00:00+06:00',
    periodEnd: '2026-08-28T23:59:59+06:00',
    totalOrders: 3,
    grossAmount: 7650,
    gatewayFee: 114.75, // 1.5% commission
    taxDeducted: 0,
    netPayout: 7535.25,
    status: 'SETTLED',
    payoutDate: '2026-08-29T09:30:00+06:00',
    utrOrReference: 'BK-B2B-9918230',
    notes: 'Tokenized checkout settlement payout'
  },
  {
    id: 'set-3',
    batchNumber: 'SET-ST-COD-20260829',
    gateway: 'STEADFAST_COD',
    bankAccount: 'City Bank AC ***4921 (Kisholoy Ent.)',
    periodStart: '2026-08-25T00:00:00+06:00',
    periodEnd: '2026-08-29T23:59:59+06:00',
    totalOrders: 6,
    grossAmount: 24200,
    gatewayFee: 242.00, // 1% COD fee
    taxDeducted: 0,
    netPayout: 23958.00,
    status: 'PROCESSING',
    payoutDate: '2026-09-01T15:00:00+06:00',
    utrOrReference: 'ST-REMIT-582910',
    notes: 'Cash collected by riders awaiting weekly bank remittance'
  },
  {
    id: 'set-4',
    batchNumber: 'SET-SSL-20260830',
    gateway: 'SSLCOMMERZ',
    bankAccount: 'City Bank AC ***4921 (Kisholoy Ent.)',
    periodStart: '2026-08-30T00:00:00+06:00',
    periodEnd: '2026-08-30T23:59:59+06:00',
    totalOrders: 2,
    grossAmount: 9800,
    gatewayFee: 245.00,
    taxDeducted: 0,
    netPayout: 9555.00,
    status: 'ELIGIBLE',
    notes: 'Eligible for next T+2 banking day disbursement'
  }
];

export const INITIAL_AUTOMATION_JOBS: AutomationJob[] = [
  {
    id: 'job-1',
    type: 'COURIER_SYNC',
    priority: 'HIGH',
    status: 'SUCCESS',
    attempts: 1,
    maxAttempts: 5,
    lastAttemptAt: '2026-08-29T16:30:00+06:00',
    createdAt: '2026-08-29T16:29:50+06:00',
    completedAt: '2026-08-29T16:30:02+06:00',
    payloadSummary: 'Sync 4 active Steadfast consignments',
    payload: { provider: 'Steadfast', consignmentIds: ['CID-884811', 'CID-884920'] }
  },
  {
    id: 'job-2',
    type: 'SMS_DISPATCH',
    priority: 'CRITICAL',
    status: 'SUCCESS',
    attempts: 1,
    maxAttempts: 3,
    lastAttemptAt: '2026-08-29T14:45:00+06:00',
    createdAt: '2026-08-29T14:44:55+06:00',
    completedAt: '2026-08-29T14:45:01+06:00',
    payloadSummary: 'Send Order Confirmed SMS to +8801712345678',
    payload: { recipient: '+8801712345678', orderNumber: 'KSH-2026-0891', amount: 4930 }
  },
  {
    id: 'job-3',
    type: 'WEBHOOK_OUTBOUND',
    priority: 'NORMAL',
    status: 'SUCCESS',
    attempts: 1,
    maxAttempts: 4,
    lastAttemptAt: '2026-08-28T19:17:00+06:00',
    createdAt: '2026-08-28T19:16:50+06:00',
    completedAt: '2026-08-28T19:17:02+06:00',
    payloadSummary: 'Outbound order.paid webhook to ERP Gateway',
    payload: { event: 'order.paid', orderNumber: 'KSH-2026-0890', amount: 2300 }
  },
  {
    id: 'job-4',
    type: 'WEBHOOK_OUTBOUND',
    priority: 'HIGH',
    status: 'RETRYING',
    attempts: 2,
    maxAttempts: 4,
    lastAttemptAt: '2026-09-02T10:15:00+06:00',
    nextAttemptAt: '2026-09-02T10:18:00+06:00',
    createdAt: '2026-09-02T10:12:00+06:00',
    payloadSummary: 'Outbound shipment.dispatched webhook to Warehouse Hub',
    payload: { event: 'shipment.dispatched', orderNumber: 'KSH-2026-0891', courier: 'Steadfast' },
    errorMessage: 'ETIMEDOUT: Connection to endpoint https://erp.kisholoy-partners.com/webhooks/dispatch timed out after 5000ms'
  },
  {
    id: 'job-5',
    type: 'SMS_DISPATCH',
    priority: 'CRITICAL',
    status: 'DLQ_DEAD_LETTER',
    attempts: 4,
    maxAttempts: 4,
    lastAttemptAt: '2026-09-01T18:22:00+06:00',
    createdAt: '2026-09-01T18:10:00+06:00',
    payloadSummary: 'Send Delivery SMS to invalid phone +880120000000',
    payload: { recipient: '+880120000000', orderNumber: 'KSH-2026-0870' },
    errorMessage: 'Greenweb Gateway Error: Invalid MSISDN operator prefix 012',
    dlqReason: 'Exceeded max retry threshold (4/4 attempts) due to permanent upstream validation rejection'
  }
];

export const INITIAL_WEBHOOK_ENDPOINTS: WebhookEndpoint[] = [
  {
    id: 'wh-1',
    name: 'Primary Enterprise ERP Sync',
    url: 'https://erp.kisholoy-corp.internal/api/v1/webhooks',
    secret: 'whsec_bd_99281a8b27c63819024f',
    events: ['order.created', 'order.paid', 'shipment.dispatched', 'return.requested'],
    status: 'ACTIVE',
    createdAt: '2026-08-01T10:00:00+06:00',
    totalDelivered: 142,
    totalFailed: 2,
    lastDeliveryAt: '2026-09-02T11:20:00+06:00',
    lastHttpStatus: 200
  },
  {
    id: 'wh-2',
    name: 'Logistics WMS Dispatch Webhook',
    url: 'https://wms.dhaka-hub.com/kisholoy/intake',
    secret: 'whsec_wms_88391204859102834',
    events: ['order.paid', 'shipment.dispatched'],
    status: 'ACTIVE',
    createdAt: '2026-08-15T14:30:00+06:00',
    totalDelivered: 89,
    totalFailed: 1,
    lastDeliveryAt: '2026-09-02T09:45:00+06:00',
    lastHttpStatus: 200
  },
  {
    id: 'wh-3',
    name: 'Accounting Quickbooks Bridge',
    url: 'https://accounting.bridge-bd.net/webhooks/kisholoy',
    secret: 'whsec_acc_11928471029384756',
    events: ['order.paid', 'refund.processed'],
    status: 'PAUSED',
    createdAt: '2026-08-20T11:00:00+06:00',
    totalDelivered: 34,
    totalFailed: 6,
    lastDeliveryAt: '2026-08-30T16:00:00+06:00',
    lastHttpStatus: 503
  }
];

export const INITIAL_WEBHOOK_LOGS: WebhookDeliveryLog[] = [
  {
    id: 'whlog-1',
    webhookId: 'wh-1',
    webhookName: 'Primary Enterprise ERP Sync',
    event: 'order.paid',
    url: 'https://erp.kisholoy-corp.internal/api/v1/webhooks',
    status: 'SUCCESS',
    httpStatus: 200,
    requestPayload: {
      event: 'order.paid',
      orderNumber: 'KSH-2026-0890',
      customer: 'Nusrat Jahan',
      amount: 2300,
      paymentMethod: 'SSLCOMMERZ',
      timestamp: '2026-09-02T11:20:00+06:00'
    },
    responseBody: '{"received":true,"erpId":"ERP-ORD-99281"}',
    durationMs: 142,
    timestamp: '2026-09-02T11:20:00+06:00',
    signature: 'sha256=a8f9c7e42b109...'
  },
  {
    id: 'whlog-2',
    webhookId: 'wh-2',
    webhookName: 'Logistics WMS Dispatch Webhook',
    event: 'shipment.dispatched',
    url: 'https://wms.dhaka-hub.com/kisholoy/intake',
    status: 'SUCCESS',
    httpStatus: 200,
    requestPayload: {
      event: 'shipment.dispatched',
      orderNumber: 'KSH-2026-0891',
      courier: 'Steadfast',
      consignmentId: 'CID-884920'
    },
    responseBody: '{"status":"QUEUED_FOR_PICKING","wmsRef":"WMS-PK-102"}',
    durationMs: 88,
    timestamp: '2026-09-02T09:45:00+06:00',
    signature: 'sha256=f3b18c0e7d59...'
  }
];

export const INITIAL_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tpl-1',
    eventKey: 'ORDER_CONFIRMATION',
    title: 'Order Placed & Confirmed',
    titleBn: 'অর্ডার নিশ্চিতকরণ বার্তা',
    channels: ['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP'],
    smsBodyEn: 'Kisholoy: Order {orderNumber} confirmed for BDT {totalAmount}! Track live: {trackingUrl} Helpline: +8801700000000',
    smsBodyBn: 'কিশলয়: অর্ডার {orderNumber} সফলভাবে নিশ্চিত হয়েছে (৳{totalAmount})। ট্র্যাকিং লিংক: {trackingUrl}',
    whatsappBodyEn: '🌿 *KISHOLOY Artisanal Living*\n\nDear *{customerName}*,\nYour order *{orderNumber}* has been confirmed!\n\n• *Total Amount:* ৳{totalAmount}\n• *Payment Mode:* {paymentMethod}\n• *Dispatch Status:* Packing with artisanal care at Dhaka Hub\n\nYou can track your parcel live below:',
    whatsappBodyBn: '🌿 *কিশলয় হেরিটেজ ক্রাফটস*\n\nপ্রিয় *{customerName}*,\nআপনার অর্ডার *{orderNumber}* নিশ্চিত হয়েছে!\n\n• *মোট প্রদেয়:* ৳{totalAmount}\n• *পদ্ধতি:* {paymentMethod}\n• *স্ট্যাটাস:* ঢাকা ওয়্যারহাউসে প্যাকিং প্রক্রিয়াধীন\n\nনিচের লিংকে সরাসরি লাইভ ট্র্যাকিং দেখুন:',
    whatsappButtons: [
      { type: 'URL', text: '📦 Track Parcel', textBn: '📦 পার্সেল ট্র্যাক করুন', value: '{trackingUrl}' },
      { type: 'QUICK_REPLY', text: '💬 Customer Care', textBn: '💬 কাস্টমার কেয়ার' }
    ],
    emailSubjectEn: 'Order Confirmed: {orderNumber} - Kisholoy Artisanal Living',
    emailSubjectBn: 'আপনার অর্ডার {orderNumber} নিশ্চিত করা হয়েছে - কিশলয়',
    emailHtmlEn: '<p>Dear {customerName},</p><p>Thank you for shopping with Kisholoy. Your order <strong>{orderNumber}</strong> for <strong>৳{totalAmount}</strong> has been received and is being prepared with care.</p><p><a href="{trackingUrl}">Track your parcel live</a></p>',
    emailHtmlBn: '<p>প্রিয় {customerName},</p><p>কিশলয়ে অর্ডার করার জন্য ধন্যবাদ। আপনার অর্ডার <strong>{orderNumber}</strong> (মোট <strong>৳{totalAmount}</strong>) সফলভাবে গৃহীত হয়েছে।</p><p><a href="{trackingUrl}">লাইভ ট্র্যাক করুন</a></p>',
    variables: ['{orderNumber}', '{customerName}', '{totalAmount}', '{trackingUrl}', '{paymentMethod}'],
    isActive: true
  },
  {
    id: 'tpl-2',
    eventKey: 'ORDER_SHIPPED',
    title: 'Shipment Dispatched & Handed Over',
    titleBn: 'পার্সেল কুরিয়ারে হস্তান্তর ও ট্র্যাকিং',
    channels: ['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP'],
    smsBodyEn: 'Kisholoy: Order {orderNumber} is on the way via {courierName}! Tracking ID: {trackingId}. Keep BDT {codAmount} ready for COD.',
    smsBodyBn: 'কিশলয়: অর্ডার {orderNumber} কুরিয়ার {courierName}-এ পাঠানো হয়েছে। ট্র্যাকিং কোড: {trackingId}। সিওডি: ৳{codAmount} প্রস্তুত রাখুন।',
    whatsappBodyEn: '🚚 *KISHOLOY Dispatch Alert*\n\nHello *{customerName}*,\nYour parcel for order *{orderNumber}* has been handed over to *{courierName}*!\n\n• *Courier:* {courierName}\n• *Consignment ID:* {trackingId}\n• *Cash on Delivery:* ৳{codAmount}\n\nOur delivery hero will contact you before arrival.',
    whatsappBodyBn: '🚚 *কিশলয় পার্সেল ডিসপ্যাচ*\n\nপ্রিয় *{customerName}*,\nআপনার অর্ডার *{orderNumber}* কুরিয়ার *{courierName}*-এ হস্তান্তর করা হয়েছে।\n\n• *কুরিয়ার:* {courierName}\n• *ট্র্যাকিং কোড:* {trackingId}\n• *সিওডি টাকা:* ৳{codAmount}\n\nডেলিভারির আগে রাইডার আপনার সাথে ফোনে যোগাযোগ করবেন।',
    whatsappButtons: [
      { type: 'URL', text: '🚚 Live Courier Tracking', textBn: '🚚 কুরিয়ার ট্র্যাকিং', value: '{trackingUrl}' }
    ],
    emailSubjectEn: 'Your Kisholoy parcel {orderNumber} has been dispatched!',
    emailSubjectBn: 'আপনার কিশলয় পার্সেল {orderNumber} পাঠানো হয়েছে!',
    emailHtmlEn: '<p>Hello {customerName},</p><p>Great news! Your package is with {courierName} with tracking reference <strong>{trackingId}</strong>. Collect ready amount <strong>৳{codAmount}</strong> for COD delivery.</p>',
    emailHtmlBn: '<p>প্রিয় {customerName},</p><p>আপনার পার্সেলটি {courierName} কুরিয়ারে পাঠানো হয়েছে। ট্র্যাকিং কোড: <strong>{trackingId}</strong>। সিওডি ডেলিভারির জন্য <strong>৳{codAmount}</strong> প্রস্তুত রাখুন।</p>',
    variables: ['{orderNumber}', '{customerName}', '{courierName}', '{trackingId}', '{codAmount}', '{trackingUrl}'],
    isActive: true
  },
  {
    id: 'tpl-3',
    eventKey: 'OUT_FOR_DELIVERY',
    title: 'Out For Delivery (Same-Day / Final Mile)',
    titleBn: 'ডেলিভারির জন্য বের হয়েছে',
    channels: ['SMS', 'WHATSAPP'],
    smsBodyEn: 'Kisholoy: Rider is out for delivery today with order {orderNumber}! Amount due: BDT {codAmount}. Keep cash ready.',
    smsBodyBn: 'কিশলয়: আপনার অর্ডার {orderNumber} আজ ডেলিভারির জন্য বের হয়েছে! প্রদেয়: ৳{codAmount}। ফোনটি সচল রাখুন।',
    whatsappBodyEn: '🛵 *Out for Delivery Today!*\n\nDear *{customerName}*,\nOur delivery partner is in your area with order *{orderNumber}*.\n\n• *Due Amount:* ৳{codAmount}\n• *Rider Contact:* Available on call upon arrival\n\nPlease keep your phone reachable!',
    whatsappBodyBn: '🛵 *আজই ডেলিভারি পৌঁছে যাচ্ছে!*\n\nপ্রিয় *{customerName}*,\nআপনার এলাকায় ডেলিভারি রাইডার অর্ডার *{orderNumber}* নিয়ে বের হয়েছেন।\n\n• *প্রদেয় টাকা:* ৳{codAmount}\n\nঅনুগ্রহ করে ফোনটি সচল রাখুন।',
    emailSubjectEn: 'Out for delivery today - Kisholoy Order {orderNumber}',
    emailSubjectBn: 'আজই ডেলিভারি পৌঁছে যাচ্ছে - কিশলয় অর্ডার {orderNumber}',
    emailHtmlEn: '<p>Dear {customerName},</p><p>Our courier delivery partner is out in your delivery zone with order <strong>{orderNumber}</strong>. Please ensure <strong>৳{codAmount}</strong> is ready for payment.</p>',
    emailHtmlBn: '<p>প্রিয় {customerName},</p><p>আমাদের কুরিয়ার ডেলিভারি রাইডার আপনার অর্ডার <strong>{orderNumber}</strong> নিয়ে বের হয়েছেন। সিওডি বিল <strong>৳{codAmount}</strong> প্রস্তুত রাখুন।</p>',
    variables: ['{orderNumber}', '{customerName}', '{codAmount}'],
    isActive: true
  },
  {
    id: 'tpl-4',
    eventKey: 'ORDER_DELIVERED',
    title: 'Order Delivered Successfully',
    titleBn: 'অর্ডার সফলভাবে ডেলিভারি সম্পন্ন',
    channels: ['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP'],
    smsBodyEn: 'Kisholoy: Order {orderNumber} has been delivered. Thank you for supporting our heritage artisans! Review & earn points.',
    smsBodyBn: 'কিশলয়: আপনার অর্ডার {orderNumber} সফলভাবে ডেলিভার হয়েছে। আমাদের সাথে থাকার জন্য ধন্যবাদ! মতামত দিয়ে পয়েন্ট জিতুন।',
    whatsappBodyEn: '🎉 *Package Delivered!*\n\nDear *{customerName}*,\nYour order *{orderNumber}* has been successfully delivered!\n\nWe hope you cherish the authentic Bangladeshi craftsmanship. 🌿\n\nNeed assistance or size exchange? We offer hassle-free 7-day returns via your customer portal.',
    whatsappBodyBn: '🎉 *ডেলিভারি সম্পন্ন!*\n\nপ্রিয় *{customerName}*,\nআপনার অর্ডার *{orderNumber}* সফলভাবে আপনার হাতে পৌঁছে দেওয়া হয়েছে!\n\nকিশলয়ের সাথে থাকার জন্য ধন্যবাদ। কোনো প্রয়োজনে ৭ দিনের মধ্যে পোর্টাল থেকে সহজ রিটার্ন বা এক্সচেঞ্জ করতে পারেন।',
    whatsappButtons: [
      { type: 'QUICK_REPLY', text: '⭐ Leave Review', textBn: '⭐ মতামত দিন' },
      { type: 'URL', text: '🛍️ Shop Again', textBn: '🛍️ আরও কেনাকাটা করুন', value: 'https://kisholoy.com.bd' }
    ],
    emailSubjectEn: 'Order Delivered: Enjoy your Kisholoy treasures! ({orderNumber})',
    emailSubjectBn: 'ডেলিভারি সম্পন্ন: কিশলয়ের সাথে থাকার জন্য ধন্যবাদ! ({orderNumber})',
    emailHtmlEn: '<p>Dear {customerName},</p><p>Your order {orderNumber} was marked as delivered. We hope you love the handcrafted artisanal heritage products!</p>',
    emailHtmlBn: '<p>প্রিয় {customerName},</p><p>আপনার অর্ডার {orderNumber} সফলভাবে ডেলিভার হয়েছে। পণ্যের কোনো সমস্যা হলে ৭ দিনের মধ্যে রিটার্ন রিকোয়েস্ট করতে পারেন।</p>',
    variables: ['{orderNumber}', '{customerName}'],
    isActive: true
  },
  {
    id: 'tpl-5',
    eventKey: 'ORDER_CANCELLED',
    title: 'Order Cancelled Notification',
    titleBn: 'অর্ডার বাতিলকরণ বিজ্ঞপ্তি',
    channels: ['SMS', 'EMAIL', 'IN_APP'],
    smsBodyEn: 'Kisholoy: Order {orderNumber} has been cancelled ({cancelReason}). Any online payment will be refunded within 3-5 days.',
    smsBodyBn: 'কিশলয়: অর্ডার {orderNumber} বাতিল করা হয়েছে ({cancelReason})। অনলাইন পেমেন্ট ৩-৫ কার্যদিবসে রিফান্ড হবে।',
    emailSubjectEn: 'Order Cancellation Notice: {orderNumber} - Kisholoy',
    emailSubjectBn: 'অর্ডার বাতিল সংক্রান্ত তথ্য: {orderNumber} - কিশলয়',
    emailHtmlEn: '<p>Dear {customerName},</p><p>Order <strong>{orderNumber}</strong> has been cancelled. Reason: {cancelReason}. If you already paid online, our accounts team has queued an automated refund.</p>',
    emailHtmlBn: '<p>প্রিয় {customerName},</p><p>আপনার অর্ডার <strong>{orderNumber}</strong> বাতিল করা হয়েছে। কারণ: {cancelReason}। অনলাইন পেমেন্ট করা থাকলে দ্রুত রিফান্ড অ্যাকাউন্টে জমা হবে।</p>',
    variables: ['{orderNumber}', '{customerName}', '{cancelReason}'],
    isActive: true
  },
  {
    id: 'tpl-6',
    eventKey: 'RETURN_APPROVED',
    title: 'Return / RMA Approved',
    titleBn: 'রিটার্ন আবেদন অনুমোদিত হয়েছে',
    channels: ['SMS', 'EMAIL', 'IN_APP'],
    smsBodyEn: 'Kisholoy: Return RMA #{rmaNumber} for order {orderNumber} has been APPROVED. Courier pickup will be scheduled shortly.',
    smsBodyBn: 'কিশলয়: অর্ডার {orderNumber}-এর রিটার্ন রিকোয়েস্ট #{rmaNumber} অনুমোদিত হয়েছে। শীঘ্রই কুরিয়ার পিকআপ করা হবে।',
    emailSubjectEn: 'Return Request Approved: #{rmaNumber} - Kisholoy',
    emailSubjectBn: 'আপনার রিটার্ন আবেদন অনুমোদিত হয়েছে: #{rmaNumber} - কিশলয়',
    emailHtmlEn: '<p>Dear {customerName},</p><p>Your RMA request <strong>#{rmaNumber}</strong> for order {orderNumber} has been approved. Please pack the item securely in original packaging.</p>',
    emailHtmlBn: '<p>প্রিয় {customerName},</p><p>আপনার রিটার্ন আবেদন <strong>#{rmaNumber}</strong> অনুমোদিত হয়েছে। অনুগ্রহ করে পণ্যটি আসল প্যাকেজিংয়ে প্রস্তুত রাখুন।</p>',
    variables: ['{orderNumber}', '{customerName}', '{rmaNumber}'],
    isActive: true
  },
  {
    id: 'tpl-7',
    eventKey: 'REFUND_PROCESSED',
    title: 'Refund Disbursed & Completed',
    titleBn: 'রিফান্ড সম্পন্ন হওয়ার নোটিফিকেশন',
    channels: ['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP'],
    smsBodyEn: 'Kisholoy: Refund of BDT {refundAmount} for {orderNumber} has been processed via {refundMethod}. Ref: {gatewayRef}',
    smsBodyBn: 'কিশলয়: অর্ডার {orderNumber}-এর জন্য ৳{refundAmount} রিফান্ড সম্পন্ন হয়েছে ({refundMethod})। ট্রানজেকশন: {gatewayRef}',
    whatsappBodyEn: '💳 *Refund Processed Successfully*\n\nDear *{customerName}*,\nA refund of *৳{refundAmount}* for order *{orderNumber}* has been sent to your *{refundMethod}*.\n\n• Transaction Reference: {gatewayRef}\n\nThank you for your patience.',
    whatsappBodyBn: '💳 *রিফান্ড সম্পন্ন হয়েছে*\n\nপ্রিয় *{customerName}*,\nআপনার অর্ডার *{orderNumber}*-এর জন্য *৳{refundAmount}* রিফান্ড আপনার *{refundMethod}* অ্যাকাউন্টে পাঠানো হয়েছে।\n\n• ট্রানজেকশন আইডি: {gatewayRef}\n\nধন্যবাদ।',
    emailSubjectEn: 'Refund Processed for Order {orderNumber} - Kisholoy',
    emailSubjectBn: 'অর্ডার {orderNumber}-এর রিফান্ড সম্পন্ন হয়েছে - কিশলয়',
    emailHtmlEn: '<p>Dear {customerName},</p><p>A refund of <strong>৳{refundAmount}</strong> for order <strong>{orderNumber}</strong> has been disbursed to your {refundMethod} account.</p>',
    emailHtmlBn: '<p>প্রিয় {customerName},</p><p>অর্ডার <strong>{orderNumber}</strong>-এর জন্য <strong>৳{refundAmount}</strong> আপনার {refundMethod} একাউন্টে পাঠানো হয়েছে।</p>',
    variables: ['{orderNumber}', '{customerName}', '{refundAmount}', '{refundMethod}', '{gatewayRef}'],
    isActive: true
  },
  {
    id: 'tpl-8',
    eventKey: 'LOW_STOCK_ADMIN',
    title: 'Low Stock Replenishment Alert (Admin)',
    titleBn: 'লো-স্টক সতর্কতা নোটিফিকেশন (অ্যাডমিন)',
    channels: ['SMS', 'EMAIL'],
    smsBodyEn: 'KISHOLOY ALERT: SKU {sku} ({productTitle}) is LOW in stock ({remainingStock} units left at {warehouseName}). Reorder now.',
    smsBodyBn: 'কিশলয় সতর্কতা: এসকেইউ {sku} ({productTitle})-এর স্টক কমে {remainingStock} টিতে নেমেছে ({warehouseName})। রিস্টক করুন।',
    emailSubjectEn: '⚠️ Low Stock Alert: {sku} ({remainingStock} remaining) - Kisholoy Inventory',
    emailSubjectBn: '⚠️ লো-স্টক সতর্কতা: {sku} (অবশিষ্ট: {remainingStock} টি) - কিশলয় ইনভেন্টরি',
    emailHtmlEn: '<p>Admin Alert:</p><p>SKU <strong>{sku}</strong> has reached critical inventory threshold at <strong>{warehouseName}</strong>. Current remaining: <strong>{remainingStock}</strong> units.</p>',
    emailHtmlBn: '<p>অ্যাডমিন সতর্কতা:</p><p><strong>{warehouseName}</strong> ওয়্যারহাউসে <strong>{sku}</strong> পণ্যের স্টক কমে <strong>{remainingStock}</strong> এ পৌঁছেছে। দ্রুত সাপ্লায়ার পিও ইস্যু করুন।</p>',
    variables: ['{sku}', '{productTitle}', '{remainingStock}', '{warehouseName}'],
    isActive: true
  }
];

export const INITIAL_NOTIFICATION_LOGS: NotificationLog[] = [
  {
    id: 'nlog-1',
    channel: 'SMS',
    recipient: '+8801712345678',
    eventKey: 'ORDER_CONFIRMATION',
    language: 'EN',
    content: 'Kisholoy: Order KSH-2026-0891 confirmed for BDT 4930! Track live: /track/KSH-2026-0891 Helpline: +8801700000000',
    status: 'DELIVERED',
    parts: 1,
    costBdt: 0.35,
    messageId: 'SMS-GW-8839102',
    timestamp: '2026-08-29T14:45:00+06:00',
    gatewayResponse: '{"provider":"GREENWEB","status":"DELIVRD","msgId":"8839102","parts":1}'
  },
  {
    id: 'nlog-2',
    channel: 'WHATSAPP',
    recipient: '+8801712345678',
    eventKey: 'ORDER_CONFIRMATION',
    language: 'EN',
    content: '🌿 KISHOLOY Artisanal Living: Dear Tanzil Ahmed, Your order KSH-2026-0891 has been confirmed! Total: ৳4930.',
    status: 'READ',
    parts: 1,
    costBdt: 0.85,
    messageId: 'WA-MSG-9920194',
    timestamp: '2026-08-29T14:45:01+06:00',
    gatewayResponse: '{"provider":"WHATSAPP_CLOUD","status":"read","wamid":"wamid.HBgMOTkyMDE5NA=="}'
  },
  {
    id: 'nlog-3',
    channel: 'EMAIL',
    recipient: 'tanzil.ahmed@example.com',
    eventKey: 'ORDER_CONFIRMATION',
    language: 'EN',
    subject: 'Order Confirmed: KSH-2026-0891 - Kisholoy Artisanal Living',
    content: 'Dear Tanzil Ahmed, Thank you for shopping with Kisholoy. Your order KSH-2026-0891 for BDT 4930 has been received...',
    status: 'DELIVERED',
    parts: 1,
    costBdt: 0.05,
    messageId: 'EML-RESEND-773910',
    timestamp: '2026-08-29T14:45:02+06:00',
    gatewayResponse: '{"provider":"RESEND","id":"msg_884920194"}'
  },
  {
    id: 'nlog-4',
    channel: 'WHATSAPP',
    recipient: '+8801712345678',
    eventKey: 'ORDER_SHIPPED',
    language: 'BN',
    content: '🚚 কিশলয় পার্সেল ডিসপ্যাচ: প্রিয় Tanzil Ahmed, আপনার অর্ডার KSH-2026-0891 কুরিয়ার Steadfast-এ হস্তান্তর করা হয়েছে। ট্র্যাকিং: ST-772910। সিওডি: ৳০।',
    status: 'DELIVERED',
    parts: 1,
    costBdt: 0.85,
    messageId: 'WA-MSG-9920245',
    timestamp: '2026-08-30T10:15:00+06:00',
    gatewayResponse: '{"provider":"WHATSAPP_CLOUD","status":"delivered"}'
  },
  {
    id: 'nlog-5',
    channel: 'SMS',
    recipient: '+8801819999999',
    eventKey: 'ORDER_SHIPPED',
    language: 'BN',
    content: 'কিশলয়: অর্ডার KSH-2026-0892 কুরিয়ার Steadfast-এ পাঠানো হয়েছে। ট্র্যাকিং কোড: ST-882910। সিওডি: ৳৩২০০ প্রস্তুত রাখুন।',
    status: 'DELIVERED',
    parts: 2,
    costBdt: 0.70,
    messageId: 'SMS-SSL-773821',
    timestamp: '2026-09-01T11:20:00+06:00',
    gatewayResponse: '{"provider":"SSL_WIRELESS","status":"DELIVRD","parts":2}'
  }
];

export const INITIAL_GATEWAY_CONFIG: GatewayConfig = {
  smsProvider: 'GREENWEB',
  smsProviderSecondary: 'SSL_WIRELESS',
  smsMaskingName: 'KISHOLOY',
  smsSenderId: '8809612000000',
  smsBalanceBdt: 1450.70,
  smsApiKey: 'gw_live_key_99382019482',
  btrcApprovedMasking: true,
  whatsappProvider: 'WHATSAPP_CLOUD',
  whatsappPhoneNumberId: '108492049281094',
  whatsappBusinessAccountId: 'waba_99382019482',
  whatsappEnabled: true,
  whatsappFallbackToSms: true,
  emailProvider: 'RESEND',
  emailSenderAddress: 'orders@kisholoy.com.bd',
  emailSenderName: 'কিশলয় | Kisholoy Artisanal',
  emailSmtpHost: 'smtp.resend.com',
  emailSmtpPort: 587,
  autoWorkerEnabled: true,
  workerConcurrency: 3,
  maxRetryAttempts: 4,
  autoNotificationEvents: {
    orderCreated: true,
    orderShipped: true,
    orderDelivered: true,
    orderCancelled: true,
    returnSubmitted: true,
    returnApproved: true,
    lowStockAdmin: true
  }
};

export const INITIAL_CUSTOMER_NOTIFICATIONS: CustomerNotification[] = [
  {
    id: 'cnotif-1',
    customerId: 'cust-1',
    title: 'Order Confirmed',
    titleBn: 'অর্ডার নিশ্চিত হয়েছে',
    message: 'Your order KSH-2026-0891 for ৳4,930 has been confirmed and forwarded for packaging.',
    messageBn: 'আপনার অর্ডার KSH-2026-0891 (৳৪,৯৩০) সফলভাবে নিশ্চিত হয়েছে এবং প্যাকিং প্রক্রিয়াধীন।',
    type: 'ORDER',
    link: '/track/KSH-2026-0891',
    isRead: false,
    createdAt: '2026-08-29T14:45:00+06:00'
  },
  {
    id: 'cnotif-2',
    customerId: 'cust-1',
    title: 'Handed to Steadfast Courier',
    titleBn: 'কুরিয়ারে হস্তান্তর করা হয়েছে',
    message: 'Parcel is in transit with consignment code ST-772910. Expected delivery within 24-48 hours.',
    messageBn: 'পার্সেলটি Steadfast কুরিয়ারে হস্তান্তর করা হয়েছে (ট্র্যাকিং: ST-772910)। ২৪-৪৮ ঘণ্টার মধ্যে পৌঁছে যাবে।',
    type: 'SHIPMENT',
    link: '/track/KSH-2026-0891',
    isRead: true,
    createdAt: '2026-08-30T10:15:00+06:00'
  },
  {
    id: 'cnotif-3',
    customerId: 'cust-1',
    title: 'VIP Loyalty Bonus Credited',
    titleBn: 'ভিআইপি পয়েন্ট যোগ হয়েছে',
    message: 'You earned 49 Kisholoy Club Cash Points on order KSH-2026-0891! Current balance: ৳140.',
    messageBn: 'অর্ডার KSH-2026-0891 এ আপনি ৪৯টি পয়েন্ট জিতেছেন! বর্তমান ওয়ালেট ব্যালেন্স: ৳১৪০।',
    type: 'PROMO',
    link: '/account',
    isRead: true,
    createdAt: '2026-08-30T10:16:00+06:00'
  }
];

export const INITIAL_INVENTORY_TRANSACTIONS: InventoryTransaction[] = [
  {
    id: 'tx-101',
    timestamp: '2026-09-02T10:30:00+06:00',
    productId: 'prod-1',
    productTitle: 'Handcrafted Dhakai Jamdani Saree (84-Count Pure Cotton)',
    sku: 'KSH-JAM-001',
    type: 'STOCK_IN',
    quantityChange: 15,
    quantityBefore: 3,
    quantityAfter: 18,
    reason: 'Artisan Batch Intake - Sonargaon Weavers Guild',
    operator: 'INVENTORY_MANAGER',
    warehouseLocation: 'Tejgaon Central Fulfillment Hub, Dhaka',
    batchNumber: 'LOT-2026-JAM-08',
    supplier: 'Sonargaon Heritage Jamdani Artisans',
    unitCost: 7800,
    notes: 'Premium 84-count count verified by textile QC team. Excellent quality.'
  },
  {
    id: 'tx-102',
    timestamp: '2026-09-02T09:15:00+06:00',
    productId: 'prod-5',
    productTitle: 'Sundarbans Raw Wildflower Honey (500g Glass Jar)',
    sku: 'KSH-HON-005',
    type: 'SALE',
    quantityChange: -2,
    quantityBefore: 37,
    quantityAfter: 35,
    reason: 'Customer Order Checkout (KSH-2026-0891)',
    operator: 'SYSTEM_CHECKOUT',
    warehouseLocation: 'Tejgaon Central Fulfillment Hub, Dhaka',
    orderNumber: 'KSH-2026-0891',
    notes: 'Stock deducted automatically upon server order verification'
  },
  {
    id: 'tx-103',
    timestamp: '2026-09-01T16:45:00+06:00',
    productId: 'prod-2',
    productTitle: 'Traditional Cumilla Terracotta Clay Teapot Set',
    sku: 'KSH-TER-002',
    type: 'DAMAGE',
    quantityChange: -1,
    quantityBefore: 17,
    quantityAfter: 16,
    reason: 'Transit Damage - Crushed Spout during regional transfer',
    operator: 'QC_INSPECTOR',
    warehouseLocation: 'Chittagong Agrabad Hub',
    notes: 'Spout cracked during transit from Cumilla pottery kiln. Written off as scrap.'
  },
  {
    id: 'tx-104',
    timestamp: '2026-09-01T11:20:00+06:00',
    productId: 'prod-3',
    productTitle: 'Eco-Friendly Braided Golden Jute Area Rug (4x6 ft)',
    sku: 'KSH-JUT-003',
    type: 'RETURN',
    quantityChange: 1,
    quantityBefore: 7,
    quantityAfter: 8,
    reason: 'RMA Return Accepted - Perfect Condition Restocked',
    operator: 'RETURNS_SPECIALIST',
    warehouseLocation: 'Tejgaon Central Fulfillment Hub, Dhaka',
    orderNumber: 'KSH-2026-0850',
    notes: 'Customer ordered duplicate size; unopened packaging verified and restocked to shelf.'
  },
  {
    id: 'tx-105',
    timestamp: '2026-08-31T14:10:00+06:00',
    productId: 'prod-4',
    productTitle: 'Pure Vegetable-Tanned Bangladeshi Leather Long Wallet',
    sku: 'KSH-LEA-004',
    type: 'STOCK_IN',
    quantityChange: 25,
    quantityBefore: 4,
    quantityAfter: 29,
    reason: 'Restock Batch - Hazaribagh Tannery Craft Collective',
    operator: 'INVENTORY_MANAGER',
    warehouseLocation: 'Tejgaon Central Fulfillment Hub, Dhaka',
    batchNumber: 'LOT-2026-LEA-03',
    supplier: 'Hazaribagh Tannery Artisans Guild',
    unitCost: 1400,
    notes: 'Finished mahogany burnish passed stitching and zipper endurance checks.'
  },
  {
    id: 'tx-106',
    timestamp: '2026-08-30T17:00:00+06:00',
    productId: 'prod-6',
    productTitle: 'Artisanal Nakshi Kantha Embroidered Wall Hanging',
    sku: 'KSH-NAK-006',
    type: 'ADJUSTMENT',
    quantityChange: 1,
    quantityBefore: 4,
    quantityAfter: 5,
    reason: 'Quarterly Physical Audit Discrepancy Found in Vault',
    operator: 'SUPER_ADMIN',
    warehouseLocation: 'Tejgaon Central Fulfillment Hub, Dhaka',
    flaggedForReview: false,
    notes: 'Physical count showed 5 units on rack vs 4 in system ledger; reconciled after floor audit.'
  }
];

export const INITIAL_BLACKLIST: BlacklistEntry[] = [
  {
    id: 'bl-1',
    type: 'PHONE',
    value: '+8801999999999',
    reason: 'Repeat fake COD orders with refusal at doorstep (Steadfast 3x failed attempts)',
    severity: 'STRICT_BLOCK',
    addedAt: '2026-08-15T10:00:00+06:00',
    addedBy: 'OPS_MANAGER',
    hitCount: 4,
    lastHitAt: '2026-09-01T16:20:00+06:00',
    isActive: true
  },
  {
    id: 'bl-2',
    type: 'PHONE',
    value: '+8801700000000',
    reason: 'Spam bot test orders generator in Chittagong',
    severity: 'STRICT_BLOCK',
    addedAt: '2026-08-20T14:30:00+06:00',
    addedBy: 'SUPER_ADMIN',
    hitCount: 2,
    lastHitAt: '2026-08-28T11:15:00+06:00',
    isActive: true
  },
  {
    id: 'bl-3',
    type: 'IP',
    value: '103.145.23.45',
    reason: 'High-frequency scripted checkout attempts from non-residential proxy',
    severity: 'STRICT_BLOCK',
    addedAt: '2026-08-22T09:12:00+06:00',
    addedBy: 'SECURITY_AUTOMATION',
    hitCount: 12,
    lastHitAt: '2026-09-02T02:45:00+06:00',
    isActive: true
  },
  {
    id: 'bl-4',
    type: 'EMAIL',
    value: 'fakeuser99@tempmail.com',
    reason: 'Disposable temporary email domain associated with abusive COD cart reservations',
    severity: 'FLAG_FOR_REVIEW',
    addedAt: '2026-08-25T17:40:00+06:00',
    addedBy: 'SYSTEM_RULE',
    hitCount: 1,
    lastHitAt: '2026-08-25T17:40:00+06:00',
    isActive: true
  },
  {
    id: 'bl-5',
    type: 'ADDRESS',
    value: 'test address unknown 1234',
    reason: 'Bogus dummy delivery destination test pattern',
    severity: 'FLAG_FOR_REVIEW',
    addedAt: '2026-08-27T11:00:00+06:00',
    addedBy: 'ORDER_MANAGER',
    hitCount: 3,
    lastHitAt: '2026-08-30T19:00:00+06:00',
    isActive: true
  }
];

export const INITIAL_FRAUD_RULES: FraudRuleConfig[] = [
  {
    id: 'rule-1',
    code: 'PHONE_BLACKLISTED',
    name: 'Blacklisted Phone Match',
    nameBn: 'কালো তালিকাভুক্ত মোবাইল নম্বর',
    description: 'Direct match against confirmed fraud & abusive customer blacklist.',
    category: 'PHONE',
    enabled: true,
    weight: 90
  },
  {
    id: 'rule-2',
    code: 'HIGH_VALUE_COD_NEW_CUST',
    name: 'High-Value COD (>৳5,000) for New Customer',
    nameBn: 'নতুন গ্রাহকের উচ্চ মূল্যের সিওডি অর্ডার',
    description: 'Flag Cash-on-Delivery orders exceeding ৳5,000 for unverified first-time buyers.',
    category: 'PAYMENT',
    enabled: true,
    weight: 35,
    thresholdValue: 5000
  },
  {
    id: 'rule-3',
    code: 'EXTREME_VALUE_COD',
    name: 'Extreme High-Value COD (>৳10,000)',
    nameBn: 'অত্যধিক মূল্যের সিওডি অর্ডার (৳১০,০০০+)',
    description: 'Mandates advance shipping fee deposit (৳150) before fulfillment dispatch.',
    category: 'PAYMENT',
    enabled: true,
    weight: 45,
    thresholdValue: 10000
  },
  {
    id: 'rule-4',
    code: 'SHORT_VAGUE_ADDRESS',
    name: 'Short / Incomplete Delivery Address',
    nameBn: 'সংক্ষিপ্ত বা অসম্পূর্ণ ডেলিভারি ঠিকানা',
    description: 'Address text is under 12 characters or lacks house/road/area specifics.',
    category: 'ADDRESS',
    enabled: true,
    weight: 30,
    thresholdValue: 12
  },
  {
    id: 'rule-5',
    code: 'DISPOSABLE_EMAIL',
    name: 'Disposable / Temporary Email Domain',
    nameBn: 'অস্থায়ী বা ফেক ইমেইল ডোমেইন',
    description: 'Orders placed using tempmail, mailinator, 10minutemail or guerrilla domains.',
    category: 'CUSTOMER_HISTORY',
    enabled: true,
    weight: 35
  },
  {
    id: 'rule-6',
    code: 'RAPID_VELOCITY_SPIKE',
    name: 'Rapid Order Velocity (Same Phone/IP)',
    nameBn: 'স্বল্প সময়ে একাধিক অর্ডার চেষ্টা',
    description: 'More than 2 orders placed from the same phone number or IP within 15 minutes.',
    category: 'VELOCITY',
    enabled: true,
    weight: 40,
    thresholdValue: 2
  },
  {
    id: 'rule-7',
    code: 'PREVIOUS_FAILED_DELIVERY',
    name: 'Prior Return / Refusal History',
    nameBn: 'পূর্বে পার্সেল গ্রহণ না করার ইতিহাস',
    description: 'Customer history shows >40% order cancellation or doorstep rejection rate.',
    category: 'CUSTOMER_HISTORY',
    enabled: true,
    weight: 40
  },
  {
    id: 'rule-8',
    code: 'REMOTE_LOGISTICS_ZONE',
    name: 'Remote / High-Return Risk Zone',
    nameBn: 'দূরবর্তী ও ঝুঁকিপূর্ণ কুরিয়ার অঞ্চল',
    description: 'Deliveries to non-hub remote upazilas with known high COD courier return rates.',
    category: 'ADDRESS',
    enabled: true,
    weight: 20
  }
];

export const INITIAL_FRAUD_SETTINGS: FraudRiskSettings = {
  autoBlockThreshold: 80,
  phoneVerificationThreshold: 35,
  advanceFeeThresholdBdt: 5000,
  advanceFeeAmountBdt: 150,
  velocityWindowMinutes: 15,
  maxOrdersPerVelocityWindow: 2,
  blockDisposableEmails: true,
  blockVagueAddresses: true,
  rules: INITIAL_FRAUD_RULES
};

// ========================================================
// PHASE 13: MULTI-WAREHOUSE & LOGISTICS DATASETS
// ========================================================

export const INITIAL_WAREHOUSES: WarehouseHub[] = [
  {
    id: 'wh-tejgaon',
    code: 'DAC-01',
    name: 'Tejgaon Central Fulfillment Hub',
    nameBn: 'তেজগাঁও কেন্দ্রীয় ফুলফিলমেন্ট হাব',
    type: 'CENTRAL_HUB',
    address: 'Plot 42/B, Industrial Area, Tejgaon, Dhaka-1208',
    addressBn: 'প্লট ৪২/বি, শিল্প এলাকা, তেজগাঁও, ঢাকা-১২০৮',
    division: 'Dhaka',
    district: 'Dhaka',
    thana: 'Tejgaon',
    contactPerson: 'Rafiqul Islam (Hub Manager)',
    phone: '+8801711223344',
    email: 'hub.tejgaon@kisholoy.com.bd',
    isPrimary: true,
    isActive: true,
    capacityUnits: 50000,
    currentUnits: 34200,
    dispatchCutoffTime: '17:30',
    courierPartners: ['Steadfast', 'Pathao', 'RedX', 'Paperfly', 'eCourier'],
    coverageDivisions: ['Dhaka', 'Mymensingh', 'Barishal', 'Khulna'],
    coordinates: { lat: 23.7639, lng: 90.3892 }
  },
  {
    id: 'wh-chattogram',
    code: 'CTG-01',
    name: 'Agrabad Port Logistics Depot',
    nameBn: 'আগ্রাবাদ বন্দর লজিস্টিকস ডিপো',
    type: 'REGIONAL_DEPOT',
    address: 'Commerce House, 3rd Floor, Agrabad C/A, Chattogram',
    addressBn: 'কমার্স হাউস, ৩য় তলা, আগ্রাবাদ বাণিজ্যিক এলাকা, চট্টগ্রাম',
    division: 'Chattogram',
    district: 'Chattogram',
    thana: 'Double Mooring',
    contactPerson: 'Mehedi Hasan (Depot Lead)',
    phone: '+8801819334455',
    email: 'hub.chattogram@kisholoy.com.bd',
    isPrimary: false,
    isActive: true,
    capacityUnits: 20000,
    currentUnits: 12450,
    dispatchCutoffTime: '16:30',
    courierPartners: ['Steadfast', 'Pathao', 'RedX'],
    coverageDivisions: ['Chattogram'],
    coordinates: { lat: 22.3275, lng: 91.8123 }
  },
  {
    id: 'wh-sylhet',
    code: 'SYL-01',
    name: 'Sylhet Artisanal Craft Depot',
    nameBn: 'সিলেট হস্তশিল্প ও ঐতিহ্যবাহী ডিপো',
    type: 'REGIONAL_DEPOT',
    address: 'Surma Tower, Zindabazar, Sylhet-3100',
    addressBn: 'সুরমা টাওয়ার, জিন্দাবাজার, সিলেট-৩১০০',
    division: 'Sylhet',
    district: 'Sylhet',
    thana: 'Kotwali',
    contactPerson: 'Anwarul Haque (Depot Supervisor)',
    phone: '+8801712556677',
    email: 'hub.sylhet@kisholoy.com.bd',
    isPrimary: false,
    isActive: true,
    capacityUnits: 12000,
    currentUnits: 6800,
    dispatchCutoffTime: '16:00',
    courierPartners: ['Steadfast', 'Pathao'],
    coverageDivisions: ['Sylhet'],
    coordinates: { lat: 24.8949, lng: 91.8687 }
  },
  {
    id: 'wh-rajshahi',
    code: 'RAJ-01',
    name: 'Rajshahi Silk & Handloom Depot',
    nameBn: 'রাজশাহী সিল্ক ও হ্যান্ডলুম ডিপো',
    type: 'ARTISAN_COLLECTION_POINT',
    address: 'Barendra Market, Shaheb Bazar, Rajshahi-6000',
    addressBn: 'বরেন্দ্র মার্কেট, সাহেব বাজার, রাজশাহী-৬০০০',
    division: 'Rajshahi',
    district: 'Rajshahi',
    thana: 'Boalia',
    contactPerson: 'Shamsul Alam (Silk Sourcing Lead)',
    phone: '+8801713889900',
    email: 'hub.rajshahi@kisholoy.com.bd',
    isPrimary: false,
    isActive: true,
    capacityUnits: 15000,
    currentUnits: 8900,
    dispatchCutoffTime: '15:30',
    courierPartners: ['Steadfast', 'Pathao', 'RedX'],
    coverageDivisions: ['Rajshahi', 'Rangpur'],
    coordinates: { lat: 24.3636, lng: 88.6241 }
  },
  {
    id: 'wh-tangail',
    code: 'TNG-01',
    name: 'Tangail Weaver Direct Collection Hub',
    nameBn: 'টাঙ্গাইল তাঁতি ডিরেক্ট কালেকশন হাব',
    type: 'ARTISAN_COLLECTION_POINT',
    address: 'Bajitpur Saree Haat Road, Tangail Sadar',
    addressBn: 'বাজিতপুর শাড়ির হাট রোড, টাঙ্গাইল সদর',
    division: 'Dhaka',
    district: 'Tangail',
    thana: 'Tangail Sadar',
    contactPerson: 'Balaram Basak (Weaver Liaison)',
    phone: '+8801715443322',
    email: 'hub.tangail@kisholoy.com.bd',
    isPrimary: false,
    isActive: true,
    capacityUnits: 8000,
    currentUnits: 4300,
    dispatchCutoffTime: '15:00',
    courierPartners: ['Steadfast', 'eCourier'],
    coverageDivisions: ['Dhaka', 'Mymensingh'],
    coordinates: { lat: 24.2513, lng: 89.9167 }
  }
];

export const INITIAL_WAREHOUSE_STOCKS: WarehouseStockItem[] = [
  // Product 1: Heritage Dhakai Jamdani Saree (prod-1)
  {
    id: 'ws-1-1',
    warehouseId: 'wh-tejgaon',
    warehouseCode: 'DAC-01',
    warehouseName: 'Tejgaon Central Fulfillment Hub',
    productId: 'prod-1',
    productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)',
    sku: 'KSH-JAM-001',
    stock: 7,
    reserved: 1,
    available: 6,
    aisle: 'Aisle-A',
    shelf: 'Shelf-02',
    bin: 'Bin-08',
    reorderLevel: 3,
    reorderQuantity: 10,
    unitCost: 3200,
    lastRestockedAt: '2026-08-28T10:00:00+06:00'
  },
  {
    id: 'ws-1-2',
    warehouseId: 'wh-chattogram',
    warehouseCode: 'CTG-01',
    warehouseName: 'Agrabad Port Logistics Depot',
    productId: 'prod-1',
    productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)',
    sku: 'KSH-JAM-001',
    stock: 3,
    reserved: 0,
    available: 3,
    aisle: 'Aisle-C',
    shelf: 'Shelf-01',
    bin: 'Bin-04',
    reorderLevel: 2,
    reorderQuantity: 5,
    unitCost: 3200,
    lastRestockedAt: '2026-08-25T14:00:00+06:00'
  },
  {
    id: 'ws-1-3',
    warehouseId: 'wh-tangail',
    warehouseCode: 'TNG-01',
    warehouseName: 'Tangail Weaver Direct Collection Hub',
    productId: 'prod-1',
    productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)',
    sku: 'KSH-JAM-001',
    stock: 2,
    reserved: 0,
    available: 2,
    aisle: 'Aisle-W',
    shelf: 'Shelf-01',
    bin: 'Bin-01',
    reorderLevel: 2,
    reorderQuantity: 8,
    unitCost: 3200,
    lastRestockedAt: '2026-08-29T11:00:00+06:00'
  },

  // Product 2: Natural Terracotta Flora Vase (prod-2)
  {
    id: 'ws-2-1',
    warehouseId: 'wh-tejgaon',
    warehouseCode: 'DAC-01',
    warehouseName: 'Tejgaon Central Fulfillment Hub',
    productId: 'prod-2',
    productTitle: 'Natural Terracotta Flora Vase (Hand-carved)',
    sku: 'KSH-TER-002',
    stock: 25,
    reserved: 2,
    available: 23,
    aisle: 'Aisle-B',
    shelf: 'Shelf-03',
    bin: 'Bin-14',
    reorderLevel: 10,
    reorderQuantity: 30,
    unitCost: 650,
    lastRestockedAt: '2026-08-26T09:00:00+06:00'
  },
  {
    id: 'ws-2-2',
    warehouseId: 'wh-chattogram',
    warehouseCode: 'CTG-01',
    warehouseName: 'Agrabad Port Logistics Depot',
    productId: 'prod-2',
    productTitle: 'Natural Terracotta Flora Vase (Hand-carved)',
    sku: 'KSH-TER-002',
    stock: 15,
    reserved: 0,
    available: 15,
    aisle: 'Aisle-B',
    shelf: 'Shelf-02',
    bin: 'Bin-06',
    reorderLevel: 5,
    reorderQuantity: 20,
    unitCost: 650,
    lastRestockedAt: '2026-08-22T16:00:00+06:00'
  },

  // Product 3: Pure Raw Sundarbans Honey (prod-3)
  {
    id: 'ws-3-1',
    warehouseId: 'wh-tejgaon',
    warehouseCode: 'DAC-01',
    warehouseName: 'Tejgaon Central Fulfillment Hub',
    productId: 'prod-3',
    productTitle: 'Pure Raw Sundarbans Forest Wild Honey (500g)',
    sku: 'KSH-HON-003',
    stock: 35,
    reserved: 3,
    available: 32,
    aisle: 'Aisle-P',
    shelf: 'Shelf-01',
    bin: 'Bin-02',
    reorderLevel: 15,
    reorderQuantity: 50,
    unitCost: 480,
    lastRestockedAt: '2026-08-30T10:00:00+06:00'
  },
  {
    id: 'ws-3-2',
    warehouseId: 'wh-sylhet',
    warehouseCode: 'SYL-01',
    warehouseName: 'Sylhet Artisanal Craft Depot',
    productId: 'prod-3',
    productTitle: 'Pure Raw Sundarbans Forest Wild Honey (500g)',
    sku: 'KSH-HON-003',
    stock: 10,
    reserved: 0,
    available: 10,
    aisle: 'Aisle-F',
    shelf: 'Shelf-01',
    bin: 'Bin-03',
    reorderLevel: 5,
    reorderQuantity: 20,
    unitCost: 480,
    lastRestockedAt: '2026-08-24T12:00:00+06:00'
  },

  // Product 4: Hand-Burnished Full-Grain Leather Wallet (prod-4)
  {
    id: 'ws-4-1',
    warehouseId: 'wh-tejgaon',
    warehouseCode: 'DAC-01',
    warehouseName: 'Tejgaon Central Fulfillment Hub',
    productId: 'prod-4',
    productTitle: 'Hand-Burnished Full-Grain Leather Bifold Wallet',
    sku: 'KSH-LTH-004',
    stock: 12,
    reserved: 0,
    available: 12,
    aisle: 'Aisle-L',
    shelf: 'Shelf-01',
    bin: 'Bin-05',
    reorderLevel: 5,
    reorderQuantity: 25,
    unitCost: 850,
    lastRestockedAt: '2026-08-27T15:00:00+06:00'
  },
  {
    id: 'ws-4-2',
    warehouseId: 'wh-chattogram',
    warehouseCode: 'CTG-01',
    warehouseName: 'Agrabad Port Logistics Depot',
    productId: 'prod-4',
    productTitle: 'Hand-Burnished Full-Grain Leather Bifold Wallet',
    sku: 'KSH-LTH-004',
    stock: 8,
    reserved: 0,
    available: 8,
    aisle: 'Aisle-L',
    shelf: 'Shelf-02',
    bin: 'Bin-02',
    reorderLevel: 3,
    reorderQuantity: 15,
    unitCost: 850,
    lastRestockedAt: '2026-08-20T11:00:00+06:00'
  },

  // Product 5: Handloom Cotton-Silk Panjabi (prod-5)
  {
    id: 'ws-5-1',
    warehouseId: 'wh-tejgaon',
    warehouseCode: 'DAC-01',
    warehouseName: 'Tejgaon Central Fulfillment Hub',
    productId: 'prod-5',
    productTitle: 'Handloom Pure Cotton-Silk Embroidered Panjabi',
    sku: 'KSH-PAN-005',
    stock: 10,
    reserved: 1,
    available: 9,
    aisle: 'Aisle-A',
    shelf: 'Shelf-03',
    bin: 'Bin-10',
    reorderLevel: 5,
    reorderQuantity: 20,
    unitCost: 1450,
    lastRestockedAt: '2026-08-29T13:00:00+06:00'
  },
  {
    id: 'ws-5-2',
    warehouseId: 'wh-rajshahi',
    warehouseCode: 'RAJ-01',
    warehouseName: 'Rajshahi Silk & Handloom Depot',
    productId: 'prod-5',
    productTitle: 'Handloom Pure Cotton-Silk Embroidered Panjabi',
    sku: 'KSH-PAN-005',
    stock: 8,
    reserved: 0,
    available: 8,
    aisle: 'Aisle-S',
    shelf: 'Shelf-02',
    bin: 'Bin-04',
    reorderLevel: 3,
    reorderQuantity: 15,
    unitCost: 1450,
    lastRestockedAt: '2026-08-26T16:00:00+06:00'
  },

  // Product 6: Nakshi Kantha Wall Hanging (prod-6)
  {
    id: 'ws-6-1',
    warehouseId: 'wh-tejgaon',
    warehouseCode: 'DAC-01',
    warehouseName: 'Tejgaon Central Fulfillment Hub',
    productId: 'prod-6',
    productTitle: 'Artisanal Nakshi Kantha Embroidered Wall Hanging',
    sku: 'KSH-NAK-006',
    stock: 5,
    reserved: 1,
    available: 4,
    aisle: 'Aisle-C',
    shelf: 'Shelf-04',
    bin: 'Bin-18',
    reorderLevel: 2,
    reorderQuantity: 10,
    unitCost: 1900,
    lastRestockedAt: '2026-08-28T12:00:00+06:00'
  },
  {
    id: 'ws-6-2',
    warehouseId: 'wh-rajshahi',
    warehouseCode: 'RAJ-01',
    warehouseName: 'Rajshahi Silk & Handloom Depot',
    productId: 'prod-6',
    productTitle: 'Artisanal Nakshi Kantha Embroidered Wall Hanging',
    sku: 'KSH-NAK-006',
    stock: 4,
    reserved: 0,
    available: 4,
    aisle: 'Aisle-N',
    shelf: 'Shelf-01',
    bin: 'Bin-01',
    reorderLevel: 2,
    reorderQuantity: 8,
    unitCost: 1900,
    lastRestockedAt: '2026-08-21T10:00:00+06:00'
  }
];

export const INITIAL_STOCK_TRANSFERS: StockTransferOrder[] = [
  {
    id: 'sto-1',
    transferNumber: 'STO-2026-0041',
    sourceWarehouseId: 'wh-tangail',
    sourceWarehouseName: 'Tangail Weaver Direct Collection Hub',
    sourceWarehouseCode: 'TNG-01',
    destinationWarehouseId: 'wh-tejgaon',
    destinationWarehouseName: 'Tejgaon Central Fulfillment Hub',
    destinationWarehouseCode: 'DAC-01',
    status: 'RECEIVED',
    items: [
      {
        productId: 'prod-1',
        sku: 'KSH-JAM-001',
        productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)',
        quantityRequested: 10,
        quantitySent: 10,
        quantityReceived: 10,
        unitCost: 3200,
        notes: 'Handloom collection verified by master weaver'
      }
    ],
    totalUnitsRequested: 10,
    totalUnitsSent: 10,
    totalCostValue: 32000,
    carrier: 'Kisholoy Internal Logistics Fleet',
    trackingOrGatePass: 'GATE-TNG-DAC-8812',
    notes: 'Direct weaver batch transfer for festive season inventory build-up',
    requestedBy: 'Rafiqul Islam (Tejgaon Hub)',
    approvedBy: 'Balaram Basak (Tangail Liaison)',
    dispatchedAt: '2026-08-28T08:30:00+06:00',
    receivedAt: '2026-08-28T16:45:00+06:00',
    receivedBy: 'Tariqul Anam (Receiving Incharge)',
    createdAt: '2026-08-27T14:00:00+06:00',
    timeline: [
      { status: 'REQUESTED', timestamp: '2026-08-27T14:00:00+06:00', note: 'Inter-hub transfer requested.', operator: 'Rafiqul Islam' },
      { status: 'APPROVED', timestamp: '2026-08-27T17:00:00+06:00', note: 'Transfer approved and gate pass generated.', operator: 'Balaram Basak' },
      { status: 'IN_TRANSIT', timestamp: '2026-08-28T08:30:00+06:00', note: 'Dispatched via Kisholoy Van (DM-CHA-11-2233).', operator: 'Balaram Basak' },
      { status: 'RECEIVED', timestamp: '2026-08-28T16:45:00+06:00', note: 'All 10 units received in pristine condition. Stock booked into Aisle-A / Shelf-02 / Bin-08.', operator: 'Tariqul Anam' }
    ]
  },
  {
    id: 'sto-2',
    transferNumber: 'STO-2026-0042',
    sourceWarehouseId: 'wh-tejgaon',
    sourceWarehouseName: 'Tejgaon Central Fulfillment Hub',
    sourceWarehouseCode: 'DAC-01',
    destinationWarehouseId: 'wh-chattogram',
    destinationWarehouseName: 'Agrabad Port Logistics Depot',
    destinationWarehouseCode: 'CTG-01',
    status: 'IN_TRANSIT',
    items: [
      {
        productId: 'prod-2',
        sku: 'KSH-TER-002',
        productTitle: 'Natural Terracotta Flora Vase (Hand-carved)',
        quantityRequested: 15,
        quantitySent: 15,
        unitCost: 650,
        notes: 'Padded triple-layer protective packaging for fragile terracotta'
      },
      {
        productId: 'prod-4',
        sku: 'KSH-LTH-004',
        productTitle: 'Hand-Burnished Full-Grain Leather Bifold Wallet',
        quantityRequested: 10,
        quantitySent: 10,
        unitCost: 850,
        notes: 'Pre-boxed luxury gift units'
      }
    ],
    totalUnitsRequested: 25,
    totalUnitsSent: 25,
    totalCostValue: 18250,
    carrier: 'Sundarban Courier Express Cargo',
    trackingOrGatePass: 'SND-TRK-778899',
    notes: 'Replenishing Chattogram regional depot stock for rapid next-day deliveries in port city',
    requestedBy: 'Mehedi Hasan (CTG Hub)',
    approvedBy: 'Rafiqul Islam (Tejgaon Hub)',
    dispatchedAt: '2026-09-01T17:00:00+06:00',
    createdAt: '2026-09-01T11:00:00+06:00',
    timeline: [
      { status: 'REQUESTED', timestamp: '2026-09-01T11:00:00+06:00', note: 'Stock transfer requested for high-demand items.', operator: 'Mehedi Hasan' },
      { status: 'APPROVED', timestamp: '2026-09-01T13:30:00+06:00', note: 'Approved by Central Inventory Desk.', operator: 'Rafiqul Islam' },
      { status: 'IN_TRANSIT', timestamp: '2026-09-01T17:00:00+06:00', note: 'Dispatched via Sundarban Express Cargo (LR: 778899). Estimated arrival in Agrabad on 2026-09-02.', operator: 'Rafiqul Islam' }
    ]
  }
];

export const INITIAL_ROUTING_RULES: RoutingRuleConfig[] = [
  {
    id: 'rule-r1',
    name: 'Chattogram Division Local Hub Routing',
    nameBn: 'চট্টগ্রাম বিভাগীয় স্থানীয় হাব রাউটিং',
    description: 'Auto-route all orders destined for Chattogram, Cox\'s Bazar, and Cumilla to Agrabad Depot if stock is available.',
    enabled: true,
    priority: 1,
    conditionType: 'CUSTOMER_DIVISION',
    matchValue: 'Chattogram',
    targetWarehouseId: 'wh-chattogram'
  },
  {
    id: 'rule-r2',
    name: 'Sylhet Division Regional Depot Routing',
    nameBn: 'সিলেট বিভাগীয় আঞ্চলিক ডিপো রাউটিং',
    description: 'Auto-route orders for Sylhet, Moulvibazar, Habiganj, Sunamganj to Zindabazar Depot.',
    enabled: true,
    priority: 2,
    conditionType: 'CUSTOMER_DIVISION',
    matchValue: 'Sylhet',
    targetWarehouseId: 'wh-sylhet'
  },
  {
    id: 'rule-r3',
    name: 'North Bengal & Rajshahi Depot Routing',
    nameBn: 'উত্তরবঙ্গ ও রাজশাহী ডিপো রাউটিং',
    description: 'Route Rajshahi and Rangpur orders directly through Rajshahi Silk & Handloom Depot.',
    enabled: true,
    priority: 3,
    conditionType: 'CUSTOMER_DIVISION',
    matchValue: 'Rajshahi',
    targetWarehouseId: 'wh-rajshahi'
  }
];

export const INITIAL_PICK_LISTS: PickList[] = [
  {
    id: 'pl-101',
    pickListNumber: 'PL-2026-0128',
    warehouseId: 'wh-tejgaon',
    warehouseName: 'Tejgaon Central Fulfillment Hub',
    warehouseCode: 'DAC-01',
    orderIds: ['ord-101', 'ord-102'],
    orderNumbers: ['KSH-2026-0881', 'KSH-2026-0882'],
    status: 'PICKED',
    assignedPicker: 'Kamal Uddin (Picker #04)',
    items: [
      {
        productId: 'prod-1',
        sku: 'KSH-JAM-001',
        productTitle: 'Heritage Dhakai Jamdani Saree (84 Count)',
        quantity: 1,
        aisle: 'Aisle-A',
        shelf: 'Shelf-02',
        bin: 'Bin-08',
        orderNumbers: ['KSH-2026-0881'],
        picked: true
      },
      {
        productId: 'prod-3',
        sku: 'KSH-HON-003',
        productTitle: 'Pure Raw Sundarbans Forest Wild Honey (500g)',
        quantity: 2,
        aisle: 'Aisle-P',
        shelf: 'Shelf-01',
        bin: 'Bin-02',
        orderNumbers: ['KSH-2026-0882'],
        picked: true
      }
    ],
    totalUnits: 3,
    pickedUnits: 3,
    createdAt: '2026-09-01T10:30:00+06:00',
    completedAt: '2026-09-01T11:15:00+06:00'
  }
];

export const INITIAL_DISPATCH_MANIFESTS: DispatchManifest[] = [
  {
    id: 'mnf-201',
    manifestNumber: 'MNF-STDF-2026-0081',
    warehouseId: 'wh-tejgaon',
    warehouseName: 'Tejgaon Central Fulfillment Hub',
    warehouseCode: 'DAC-01',
    courier: 'Steadfast',
    ordersCount: 2,
    totalCodAmount: 6730,
    totalWeightKg: 1.8,
    driverName: 'Mohammad Selim',
    driverPhone: '+8801911998877',
    vehicleNumber: 'DHAKA-METRO-HA-55-9012',
    status: 'HANDED_OVER',
    handedOverAt: '2026-09-01T17:15:00+06:00',
    operator: 'Rafiqul Islam',
    createdAt: '2026-09-01T16:30:00+06:00',
    orders: [
      {
        orderId: 'ord-101',
        orderNumber: 'KSH-2026-0881',
        trackingId: 'STDF-881920',
        customerName: 'Tanzil Ahmed',
        customerPhone: '+8801711000001',
        district: 'Dhaka',
        codAmount: 4930,
        weightKg: 0.8,
        packageCount: 1
      },
      {
        orderId: 'ord-102',
        orderNumber: 'KSH-2026-0882',
        trackingId: 'STDF-881921',
        customerName: 'Nusrat Jahan',
        customerPhone: '+8801811000002',
        district: 'Dhaka',
        codAmount: 1800,
        weightKg: 1.0,
        packageCount: 1
      }
    ]
  }
];

// -------------------------------------------------------------
// Phase 14: Dynamic Coupons, Flash Deals & Loyalty Wallets
// -------------------------------------------------------------

export const INITIAL_COUPONS: CouponRule[] = [
  {
    id: 'cpn-001',
    code: 'KISHOLOY10',
    title: '10% Welcome Heritage Discount',
    titleBn: '১০% স্বাগতম হেরিটেজ ছাড়',
    description: 'Get 10% instant discount on traditional handcrafted items.',
    descriptionBn: 'ঐতিহ্যবাহী সকল পণ্যে উপভোগ করুন তাৎক্ষণিক ১০% বিশেষ মূল্যছাড়।',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxDiscountAmount: 500,
    minOrderSubtotal: 1000,
    startDate: '2026-01-01T00:00:00+06:00',
    endDate: '2026-12-31T23:59:59+06:00',
    usageLimitTotal: 1000,
    usageCount: 142,
    usageLimitPerCustomer: 2,
    categoryRestrictions: [],
    productRestrictions: [],
    firstOrderOnly: false,
    status: 'ACTIVE',
    totalDiscountDisbursedBdt: 42600,
    totalAttributedRevenueBdt: 426000,
    createdAt: '2026-01-01T10:00:00+06:00'
  },
  {
    id: 'cpn-002',
    code: 'BOISHAKH20',
    title: '20% Boishakh Festival Offer',
    titleBn: '২০% পহেলা বৈশাখ উৎসব ছাড়',
    description: '20% off on minimum cart value of ৳3,000 (Max ৳800 discount).',
    descriptionBn: 'ন্যূনতম ৩,০০০ টাকার অর্ডারে ২০% ছাড় (সর্বোচ্চ ৮০০ টাকা পর্যন্ত)।',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxDiscountAmount: 800,
    minOrderSubtotal: 3000,
    startDate: '2026-04-01T00:00:00+06:00',
    endDate: '2026-05-15T23:59:59+06:00',
    usageLimitTotal: 500,
    usageCount: 88,
    usageLimitPerCustomer: 1,
    categoryRestrictions: ['traditional-clothing', 'handicrafts-decor'],
    productRestrictions: [],
    firstOrderOnly: false,
    status: 'ACTIVE',
    totalDiscountDisbursedBdt: 52800,
    totalAttributedRevenueBdt: 264000,
    createdAt: '2026-04-01T09:00:00+06:00'
  },
  {
    id: 'cpn-003',
    code: 'FREESHIP',
    title: 'Complimentary Nationwide Delivery',
    titleBn: 'ফ্রি হোম ডেলিভারি অফার',
    description: '100% waiver on courier shipping fee across Bangladesh for orders above ৳1,500.',
    descriptionBn: 'দেশব্যাপী বিনামূল্যে ক্যাশ-অন-ডেলিভারি সুবিধা (ন্যূনতম ১,৫০০ টাকার অর্ডারে)।',
    discountType: 'FREE_SHIPPING',
    discountValue: 100,
    minOrderSubtotal: 1500,
    startDate: '2026-02-01T00:00:00+06:00',
    endDate: '2026-12-31T23:59:59+06:00',
    usageLimitTotal: 2000,
    usageCount: 310,
    usageLimitPerCustomer: 3,
    categoryRestrictions: [],
    productRestrictions: [],
    firstOrderOnly: false,
    status: 'ACTIVE',
    totalDiscountDisbursedBdt: 34100,
    totalAttributedRevenueBdt: 682000,
    createdAt: '2026-02-01T10:00:00+06:00'
  },
  {
    id: 'cpn-004',
    code: 'NEWKISHOLOY',
    title: '৳300 Flat First-Order Welcome Gift',
    titleBn: '৳৩০০ প্রথম অর্ডার উপহার',
    description: 'Flat ৳300 off on your very first order at Kisholoy.',
    descriptionBn: 'কিশলয়ে আপনার প্রথম অর্ডারে উপভোগ করুন ফ্ল্যাট ৩০০ টাকা উপহার ছাড়।',
    discountType: 'FIXED_AMOUNT',
    discountValue: 300,
    minOrderSubtotal: 2000,
    startDate: '2026-01-01T00:00:00+06:00',
    endDate: '2026-12-31T23:59:59+06:00',
    usageLimitTotal: 1000,
    usageCount: 95,
    usageLimitPerCustomer: 1,
    categoryRestrictions: [],
    productRestrictions: [],
    firstOrderOnly: true,
    status: 'ACTIVE',
    totalDiscountDisbursedBdt: 28500,
    totalAttributedRevenueBdt: 285000,
    createdAt: '2026-01-01T00:00:00+06:00'
  }
];

export const INITIAL_FLASH_DEALS: FlashDeal[] = [
  {
    id: 'flash-01',
    title: 'Eid Artisanal Midnight Flash Bazaar',
    titleBn: 'ঈদ কারুশিল্প মিডনাইট ফ্ল্যাশ বাজার',
    description: 'Limited-time handcrafted heritage clearance with up to 35% discount.',
    descriptionBn: 'সীমিত সময়ের জন্য ঐতিহ্যবাহী নকশী ও তাঁত পণ্যে সর্বোচ্চ ৩৫% স্পেশাল ছাড়।',
    badgeText: 'FLASH SALE 35% OFF',
    badgeTextBn: 'ফ্ল্যাশ সেল ৩৫% ছাড়',
    bannerImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200',
    startDate: '2026-09-01T18:00:00+06:00',
    endDate: '2026-09-05T23:59:59+06:00',
    status: 'ACTIVE',
    createdAt: '2026-09-01T12:00:00+06:00',
    items: [
      {
        productId: 'prod-1',
        productTitle: 'Handwoven Pure Cotton Tangail Saree',
        productTitleBn: 'হাতে বোনা খাঁটি সুতি টাঙ্গাইল শাড়ি',
        originalPrice: 4850,
        flashPrice: 3880,
        discountPercent: 20,
        quotaStock: 15,
        soldStock: 9
      },
      {
        productId: 'prod-3',
        productTitle: 'Pure Raw Sundarbans Forest Wild Honey (500g)',
        productTitleBn: 'সুন্দরবনের প্রাকৃতিক চাকের খাঁটি মধু (৫০০ গ্রাম)',
        originalPrice: 850,
        flashPrice: 680,
        discountPercent: 20,
        quotaStock: 30,
        soldStock: 22
      },
      {
        productId: 'prod-6',
        productTitle: 'Artisanal Nakshi Kantha Embroidered Wall Hanging',
        productTitleBn: 'নকশী কাঁথা ওয়ালপিস',
        originalPrice: 3400,
        flashPrice: 2550,
        discountPercent: 25,
        quotaStock: 10,
        soldStock: 4
      }
    ]
  }
];

export const INITIAL_LOYALTY_WALLETS: CustomerLoyaltyWallet[] = [
  {
    customerId: 'cust-1',
    customerName: 'Tanzil Ahmed',
    phone: '+8801712345678',
    email: 'tanzil.ahmed@example.com',
    tier: 'GOLD',
    pointsBalance: 420,
    lifetimeEarnedPoints: 580,
    lifetimeRedeemedPoints: 160,
    referralCode: 'TANZIL-KSH',
    referralCount: 3,
    totalWalletSavingsBdt: 160,
    joinedAt: '2026-02-14T10:00:00+06:00',
    lastActiveAt: '2026-09-01T14:30:00+06:00',
    transactions: [
      {
        id: 'tx-pts-01',
        type: 'WELCOME_BONUS',
        points: 50,
        bdtEquivalent: 50,
        note: 'Welcome bonus upon registration',
        timestamp: '2026-02-14T10:00:00+06:00'
      },
      {
        id: 'tx-pts-02',
        type: 'EARN_PURCHASE',
        points: 168,
        bdtEquivalent: 168,
        orderNumber: 'KSH-2026-0881',
        note: 'Earned 1.5x Gold Tier points on order ৳16,800',
        timestamp: '2026-03-10T16:00:00+06:00'
      },
      {
        id: 'tx-pts-03',
        type: 'REFERRAL_BONUS',
        points: 100,
        bdtEquivalent: 100,
        note: 'Referral reward: Nusrat Jahan placed first order',
        timestamp: '2026-03-15T12:00:00+06:00'
      },
      {
        id: 'tx-pts-04',
        type: 'REDEEM_ORDER',
        points: -160,
        bdtEquivalent: -160,
        orderNumber: 'KSH-2026-0890',
        note: 'Redeemed 160 points for ৳160 checkout discount',
        timestamp: '2026-08-20T19:00:00+06:00'
      }
    ]
  },
  {
    customerId: 'cust-2',
    customerName: 'Nusrat Jahan',
    phone: '+8801819988776',
    email: 'nusrat.jahan@example.com',
    tier: 'SILVER',
    pointsBalance: 180,
    lifetimeEarnedPoints: 180,
    lifetimeRedeemedPoints: 0,
    referralCode: 'NUSRAT-KSH',
    referredByCode: 'TANZIL-KSH',
    referralCount: 1,
    totalWalletSavingsBdt: 0,
    joinedAt: '2026-03-01T12:00:00+06:00',
    lastActiveAt: '2026-08-28T11:00:00+06:00',
    transactions: [
      {
        id: 'tx-pts-05',
        type: 'WELCOME_BONUS',
        points: 50,
        bdtEquivalent: 50,
        note: 'Welcome registration gift',
        timestamp: '2026-03-01T12:00:00+06:00'
      },
      {
        id: 'tx-pts-06',
        type: 'EARN_PURCHASE',
        points: 130,
        bdtEquivalent: 130,
        orderNumber: 'KSH-2026-0882',
        note: 'Earned 1.25x Silver Tier points on order ৳5,150',
        timestamp: '2026-03-12T14:00:00+06:00'
      }
    ]
  }
];

export const INITIAL_PROMOTION_STATS: PromotionSystemStats = {
  activeCouponsCount: 4,
  totalCouponsCreated: 4,
  totalDiscountDisbursedBdt: 158000,
  totalRevenueGeneratedBdt: 1657000,
  activeFlashDealsCount: 1,
  totalLoyaltyMembers: 240,
  totalPointsInCirculation: 18450,
  pointsRedeemedTotalBdt: 6850
};

export const INITIAL_CUSTOMER_ADDRESSES: CustomerAddress[] = [
  {
    id: 'addr-01',
    customerId: 'cust-1',
    label: 'Home',
    labelBn: 'বাসা',
    recipientName: 'Tanzil Ahmed',
    phone: '+880 1712345678',
    altPhone: '+880 1812345678',
    division: 'Dhaka',
    district: 'Dhaka',
    upazilaOrArea: 'Banani',
    addressLine: 'Flat 4B, House 18, Road 11, Block D',
    postalCode: '1213',
    isDefault: true,
    createdAt: '2026-01-10T10:00:00+06:00'
  },
  {
    id: 'addr-02',
    customerId: 'cust-1',
    label: 'Office',
    labelBn: 'অফিস',
    recipientName: 'Tanzil Ahmed (Tech Hub)',
    phone: '+880 1712345678',
    division: 'Dhaka',
    district: 'Dhaka',
    upazilaOrArea: 'Gulshan-1',
    addressLine: 'Level 8, Concord Tower, Gulshan Avenue',
    postalCode: '1212',
    isDefault: false,
    createdAt: '2026-02-15T14:30:00+06:00'
  },
  {
    id: 'addr-03',
    customerId: 'cust-2',
    label: 'Home',
    labelBn: 'বাসা',
    recipientName: 'Nusrat Jahan',
    phone: '+880 1819876543',
    division: 'Chattogram',
    district: 'Chattogram',
    upazilaOrArea: 'Khulshi',
    addressLine: 'House 42, Road 3, South Khulshi R/A',
    postalCode: '4225',
    isDefault: true,
    createdAt: '2026-03-01T12:00:00+06:00'
  }
];

export const INITIAL_WISHLISTS: WishlistItem[] = [
  {
    id: 'wish-01',
    customerId: 'cust-1',
    productId: 'prod-1',
    productTitle: 'Handcrafted Dhakai Jamdani Saree (Heritage Edition)',
    productTitleBn: 'হাতে বোনা খাঁটি ঢাকাই জামদানি শাড়ি (হেরিটেজ সংস্করণ)',
    price: 18500,
    originalPrice: 22000,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    category: 'Traditional Clothing',
    addedAt: '2026-08-20T10:30:00+06:00'
  },
  {
    id: 'wish-02',
    customerId: 'cust-1',
    productId: 'prod-3',
    productTitle: 'Pure Sundarbans Wildflower Honey (Raw & Unfiltered)',
    productTitleBn: 'সুন্দরবনের প্রাকৃতিক চাকের মধু (অপরিশোধিত)',
    price: 1250,
    originalPrice: 1450,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    category: 'Organic Food & Pantry',
    addedAt: '2026-08-22T15:45:00+06:00'
  },
  {
    id: 'wish-03',
    customerId: 'cust-1',
    productId: 'prod-4',
    productTitle: 'Artisanal Brass Nakshi Lamp (Shilpogram Series)',
    productTitleBn: 'ঐতিহ্যবাহী পিতলের নকশি প্রদীপ',
    price: 4200,
    originalPrice: 4800,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800',
    inStock: true,
    category: 'Handicrafts & Decor',
    addedAt: '2026-08-25T09:15:00+06:00'
  }
];

export const INITIAL_CUSTOMER_RETURNS: CustomerReturnRequest[] = [
  {
    id: 'ret-req-01',
    requestNumber: 'RMA-2026-001',
    customerId: 'cust-1',
    customerPhone: '+880 1712345678',
    orderId: 'ord-1',
    orderNumber: 'KSH-2026-0891',
    productId: 'prod-2',
    productTitle: 'Royal Bengal Silk Panjabi with Zari Embroidery',
    quantity: 1,
    reason: 'SIZE_FIT_ISSUE',
    reasonDetails: 'Chest size is slightly tighter than expected (Ordered Size 40, fits like 38). Requesting size 42 exchange.',
    preferredResolution: 'EXCHANGE',
    status: 'APPROVED',
    adminNotes: 'Customer approved for size 42 exchange. Delivery agent will collect the item.',
    createdAt: '2026-08-26T14:30:00+06:00',
    updatedAt: '2026-08-27T10:00:00+06:00'
  }
];

export const INITIAL_CUSTOMER_PROFILES: CustomerProfile[] = [
  {
    id: 'cust-1',
    name: 'Tanzil Ahmed',
    phone: '+880 1712345678',
    email: 'tanzil.ahmed@example.com',
    alternatePhone: '+880 1812345678',
    dateOfBirth: '1992-04-15',
    gender: 'MALE',
    joinedDate: '2026-01-10T10:00:00+06:00',
    tier: 'GOLD',
    addresses: INITIAL_CUSTOMER_ADDRESSES.filter(a => a.customerId === 'cust-1'),
    preferences: {
      newsletterSubscribed: true,
      smsOrderUpdates: true,
      promotionalOffers: true,
      preferredLanguage: 'BN'
    }
  },
  {
    id: 'cust-2',
    name: 'Nusrat Jahan',
    phone: '+880 1819876543',
    email: 'nusrat.jahan@example.com',
    gender: 'FEMALE',
    joinedDate: '2026-03-01T12:00:00+06:00',
    tier: 'SILVER',
    addresses: INITIAL_CUSTOMER_ADDRESSES.filter(a => a.customerId === 'cust-2'),
    preferences: {
      newsletterSubscribed: true,
      smsOrderUpdates: true,
      promotionalOffers: false,
      preferredLanguage: 'EN'
    }
  }
];






