/**
 * KISHOLOY Phase 05: Supplier Management & Procurement Ledger Contextual Help Definitions
 * Strictly satisfies the 11-Point Admin Function Explanation Requirement (Bangla + English)
 * @license Apache-2.0
 */

export interface SupplierFunctionHelp {
  id: string;
  titleEn: string;
  titleBn: string;
  shortDescEn: string;
  shortDescBn: string;
  pointsEn: {
    whatIsThis: string;
    whyUsed: string;
    howWorks: string;
    connectedTo: string;
    whatIfChanged: string;
    affects: string[];
    doesNotAffect: string[];
    required: string[];
    currentStatus: string;
    warningRisk: string;
    whoCanChange: string;
  };
  pointsBn: {
    whatIsThis: string;
    whyUsed: string;
    howWorks: string;
    connectedTo: string;
    whatIfChanged: string;
    affects: string[];
    doesNotAffect: string[];
    required: string[];
    currentStatus: string;
    warningRisk: string;
    whoCanChange: string;
  };
}

export const SUPPLIER_HELP_DEFINITIONS: Record<string, SupplierFunctionHelp> = {
  supplier_ledger: {
    id: 'supplier_ledger',
    titleEn: 'Server-Authoritative Supplier Financial Ledger',
    titleBn: 'সার্ভার-কর্তৃক নির্ধারিত সরবরাহকারী আর্থিক হিসাব (লেজার)',
    shortDescEn: 'Non-tamperable calculation of total purchased, paid, and outstanding due amounts.',
    shortDescBn: 'মোট ক্রয়, পরিশোধ এবং বকেয়া টাকার সার্ভার-ভিত্তিক সুরক্ষিত নির্ভুল গণনা।',
    pointsEn: {
      whatIsThis: 'A double-entry inspired procurement ledger tracking receivables, issued purchase orders, and recorded payment disbursements for each vendor.',
      whyUsed: 'Guarantees that suppliers are paid accurately and prevents financial discrepancies, duplicate payouts, and client-side arithmetic tampering.',
      howWorks: 'Whenever a Purchase Order is issued or a payment voucher is signed, the server recalculates totalPurchased, totalPaid, and totalDue in Asia/Dhaka time without trusting client input.',
      connectedTo: 'Procurement → Inventory Inflow → Accounts Payable (Finance) → Cash Flow Ledger.',
      whatIfChanged: 'Modifying payment terms or adding transaction vouchers automatically updates the outstanding balance.',
      affects: ['Supplier account balance', 'Finance accounts payable queue', 'Credit limit monitoring'],
      doesNotAffect: ['Customer storefront prices', 'Retail sales VAT', 'Customer delivery fees'],
      required: ['Verified Supplier Profile', 'Valid Purchase Order or Payment Voucher Reference'],
      currentStatus: 'Active & Verified Server-Side',
      warningRisk: 'MEDIUM - Inaccurate payment recording can create accounting discrepancies with vendors.',
      whoCanChange: 'Super Administrator, Finance Officer'
    },
    pointsBn: {
      whatIsThis: 'প্রতিটি সরবরাহকারীর সাথে কৃত মোট ক্রয়াদেশ ও পরিশোধিত অর্থ লিপিবদ্ধ রাখার সার্ভার-নিয়ন্ত্রিত সুরক্ষিত খতিয়ান।',
      whyUsed: 'ভেন্ডরকে সঠিক পরিমাণ বিল প্রদান নিশ্চিত করতে এবং ভুয়া বা দ্বৈত বিল প্রদান প্রতিরোধে ব্যবহৃত হয়।',
      howWorks: 'নতুন ক্রয়াদেশ তৈরি বা পেমেন্ট ভাউচার লিপিবদ্ধ হলে সার্ভার স্বয়ংক্রিয়ভাবে মোট ক্রয়, পরিশোধ ও বকেয়া হিসাব করে নেয়।',
      connectedTo: 'পণ্য সংগ্রহ → গুদাম স্টক বৃদ্ধি → অর্থ বিভাগ (হিসাব শাখা) → অডিট ট্রেইল।',
      whatIfChanged: 'পেমেন্ট শর্ত পরিবর্তন বা ভাউচার যোগ করলে সরবরাহকারীর বর্তমান বকেয়া তাৎক্ষণিক পুনর্গণনা হয়।',
      affects: ['সরবরাহকারীর বকেয়া হিসাব', 'অর্থ বিভাগের দেনা তালিকা', 'ক্রেডিট লিমিট সীমা'],
      doesNotAffect: ['গ্রাহকের খুচরা বিক্রয় মূল্য', 'ভ্যাট বা কর', 'ডেলিভারি চার্জ'],
      required: ['নিবন্ধিত সরবরাহকারী তথ্য', 'বৈধ ভাউচার নম্বর বা ক্রয়াদেশ রেফারেন্স'],
      currentStatus: 'সক্রিয় এবং সার্ভার-ভিত্তিক সুরক্ষিত',
      warningRisk: 'মাঝারি - ভুল পেমেন্ট এন্ট্রি সরবরাহকারীর সাথে হিসাবে অমিল তৈরি করতে পারে।',
      whoCanChange: 'সুপার অ্যাডমিন, অর্থ ও হিসাব কর্মকর্তা'
    }
  },

  purchase_orders: {
    id: 'purchase_orders',
    titleEn: 'Purchase Order (PO) & Inventory Receiving Automation',
    titleBn: 'ক্রয়াদেশ (পিও) এবং গুদাম স্টক গ্রহণ অটোমেশন',
    shortDescEn: 'Formal procurement contracts that automatically increment warehouse inventory upon arrival.',
    shortDescBn: 'প্রাতিষ্ঠানিক ক্রয়াদেশ যা পণ্য গুদামে পৌঁছার সাথে সাথে স্বয়ংক্রিয়ভাবে স্টক বৃদ্ধি করে।',
    pointsEn: {
      whatIsThis: 'A contractual procurement document specifying SKU quantities, agreed unit cost in BDT, target warehouse, and delivery milestones.',
      whyUsed: 'Eliminates blind purchasing, provides audit trails for stock inflow, and prevents phantom inventory.',
      howWorks: 'When warehouse staff marks a PO as RECEIVED, the server automatically updates stock quantities in the main product catalog.',
      connectedTo: 'Inventory Catalog → Warehouse Hubs → Cost of Goods Sold (COGS) → Supplier Ledger.',
      whatIfChanged: 'Changing PO status from ISSUED to RECEIVED directly alters live product inventory available for storefront sales.',
      affects: ['Available storefront product stock', 'Warehouse capacity metrics', 'Supplier accounts payable'],
      doesNotAffect: ['Customer order shipping status', 'Payment gateway webhooks'],
      required: ['Valid supplier ID', 'SKU item list with unit cost >= 0', 'Assigned fulfillment warehouse'],
      currentStatus: 'Fully Automated & Integrated',
      warningRisk: 'HIGH - Confirming receipt of a PO prematurely will artificially inflate storefront stock levels.',
      whoCanChange: 'Super Admin, Admin, Inventory Manager'
    },
    pointsBn: {
      whatIsThis: 'পণ্য সংগ্রহের একটি প্রাতিষ্ঠানিক চুক্তিপত্র যাতে নির্দিষ্ট এসকেইউ, প্রতি ইউনিটের দর (টাকা) এবং ডেলিভারি তারিখ উল্লেখ থাকে।',
      whyUsed: 'অগোছালো ক্রয় বন্ধ করতে, গুদামে পণ্য প্রবেশের প্রমাণ সংরক্ষণ এবং ভুয়া স্টক রোধ করতে ব্যবহৃত হয়।',
      howWorks: 'গুদাম কর্মী যখন পিও স্ট্যাটাস RECEIVED হিসেবে চিহ্নিত করেন, সার্ভার স্বয়ংক্রিয়ভাবে মূল ক্যাটালগে স্টক বাড়িয়ে দেয়।',
      connectedTo: 'পণ্য তালিকা → সেন্ট্রাল গুদাম → বিক্রিত পণ্যের ব্যয় (COGS) → সরবরাহকারী খতিয়ান।',
      whatIfChanged: 'স্ট্যাটাস RECEIVED করলে ওয়েবসাইটে তাৎক্ষণিক বিক্রির জন্য পণ্যের স্টক বৃদ্ধি পায়।',
      affects: ['ওয়েবসাইটে প্রদর্শনযোগ্য পণ্যের মজুদ', 'গুদাম ধারণক্ষমতা', 'সরবরাহকারীর মোট পাওনা'],
      doesNotAffect: ['চলমান গ্রাহক অর্ডারের কুরিয়ার ট্র্যাকিং', 'পেমেন্ট গেটওয়ে'],
      required: ['সঠিক সরবরাহকারী আইডি', 'আইটেম তালিকা ও ইউনিট দর', 'নির্দিষ্ট গুদাম বা হাব'],
      currentStatus: 'সম্পূর্ণ স্বয়ংক্রিয় এবং সংহত',
      warningRisk: 'উচ্চ - পণ্য হাতে পাওয়ার আগে রিসিভড করলে ওয়েবসাইটে অতিরিক্ত পণ্য বিক্রি হয়ে যেতে পারে।',
      whoCanChange: 'সুপার অ্যাডমিন, অ্যাডমিন, ইনভেন্টরি ম্যানেজার'
    }
  },

  payment_vouchers: {
    id: 'payment_vouchers',
    titleEn: 'Supplier Payment Vouchers & Step-Up MFA Authorization',
    titleBn: 'সরবরাহকারী পেমেন্ট ভাউচার এবং উচ্চ-মূল্যের জন্য টু-ফ্যাক্টর অনুমোদন',
    shortDescEn: 'Disbursement tracking with mandatory cryptographic confirmation for payouts ≥ 50,000 BDT.',
    shortDescBn: '৫০,০০০ টাকার অধিক পেমেন্টে ওটিপি/এমএফএ অনুমোদন বাধ্যতামূলক সংবলিত অর্থ প্রদান ব্যবস্থা।',
    pointsEn: {
      whatIsThis: 'A formal payment transaction recording bank transfers, bKash Merchant payouts, cheques, or cash releases to suppliers.',
      whyUsed: 'Prevents fraudulent cash drain, maintains complete banking audit trails, and reduces internal collusion risk.',
      howWorks: 'Payment disbursements over 50,000 BDT prompt a step-up MFA verification dialog. Once confirmed, the supplier due balance is deducted.',
      connectedTo: 'Finance Module → Bank Reconciliation → Audit Trail → Supplier Account Statement.',
      whatIfChanged: 'Recording a payment immediately reduces the outstanding balance owed to the vendor.',
      affects: ['Supplier due balance', 'Store operating cash ledger', 'Audit security log'],
      doesNotAffect: ['Product catalog stock', 'Customer refund allocations'],
      required: ['Valid supplier ID', 'Positive amount in BDT', 'Payment method & bank reference number'],
      currentStatus: 'Enforced with Step-Up Security',
      warningRisk: 'HIGH - Financial disbursement records cannot be erased; reverse adjustments require audit rationale.',
      whoCanChange: 'Super Admin, Finance Officer'
    },
    pointsBn: {
      whatIsThis: 'সরবরাহকারীকে ব্যাংক ট্রান্সফার, বিকাশ মার্চেন্ট, চেক বা ক্যাশে টাকা পরিশোধের প্রাতিষ্ঠানিক রসিদ রেকর্ড।',
      whyUsed: 'আর্থিক অপচয় ও অনিয়ম রোধ করতে এবং নির্ভুল ব্যাংক খতিয়ান বজায় রাখতে ব্যবহৃত হয়।',
      howWorks: '৫০,০০০ টাকার বেশি অর্থ প্রদানের ক্ষেত্রে স্টেপ-আপ টু-ফ্যাক্টর (MFA) যাচাইকরণ কোড প্রয়োজন হয়।',
      connectedTo: 'অর্থ বিভাগ → ব্যাংক রিকনসিলিয়েশন → অডিট লগ → সরবরাহকারী ব্যালেন্স।',
      whatIfChanged: 'পেমেন্ট লিপিবদ্ধ হওয়ার সাথে সাথে সরবরাহকারীর বকেয়া কমে যায়।',
      affects: ['সরবরাহকারীর বর্তমান বকেয়া', 'ব্যবসায়ের নগদ ব্যালেন্স', 'অডিট ট্রেইল লগ'],
      doesNotAffect: ['পণ্যের গুদাম মজুদ', 'গ্রাহকদের রিফান্ড বাজেট'],
      required: ['সরবরাহকারী আইডি', 'পরিশোধিত টাকার অঙ্ক', 'পেমেন্ট মাধ্যম ও ব্যাংক ট্রানজেকশন আইডি'],
      currentStatus: 'নিরাপদ টু-ফ্যাক্টর যাচাইকরণসহ সক্রিয়',
      warningRisk: 'উচ্চ - একবার পেমেন্ট নথিভুক্ত হলে তা মোছা যায় না; সংশোধনের জন্য অডিট নোট দিতে হয়।',
      whoCanChange: 'সুপার অ্যাডমিন, অর্থ ও হিসাব কর্মকর্তা'
    }
  },

  isolated_portal: {
    id: 'isolated_portal',
    titleEn: 'Isolated Supplier Self-Service Portal (Feature-Flagged)',
    titleBn: 'বিচ্ছিন্ন সরবরাহকারী সেলফ-সার্ভিস পোর্টাল (ফিচার-ফ্ল্যাগযুক্ত)',
    shortDescEn: 'Quarantined external vendor access completely segregated from internal staff and customer accounts.',
    shortDescBn: 'অভ্যন্তরীণ স্টাফ ও গ্রাহক অ্যাকাউন্ট থেকে সম্পূর্ণ বিচ্ছিন্ন বাহ্যিক ভেন্ডর লগইন ও পোর্টাল ব্যবস্থা।',
    pointsEn: {
      whatIsThis: 'A dedicated self-service portal allowing suppliers to review their purchase orders, delivery statuses, and payment statements.',
      whyUsed: 'Reduces manual telephone inquiries regarding order status and invoice settlements while strictly preserving internal network boundaries.',
      howWorks: 'Controlled via an explicit feature flag. Even when enabled, supplier tokens are quarantined and CANNOT access internal admin endpoints or customer PII.',
      connectedTo: 'Supplier Record → Feature Flag Registry → Scoped Supplier Read APIs.',
      whatIfChanged: 'Enabling/disabling toggles vendor web login. Disabling instantly terminates any active supplier portal sessions.',
      affects: ['Vendor self-service login', 'Purchase order status visibility for the vendor'],
      doesNotAffect: ['Internal admin operations', 'Storefront checkout', 'Customer user accounts'],
      required: ['Active Supplier Record', 'Admin toggle authorization', 'Secure temporary password'],
      currentStatus: 'Feature-Flagged & Quarantined for Future Release',
      warningRisk: 'LOW - Quarantined architecture prevents supplier credentials from escalating into staff privileges.',
      whoCanChange: 'Super Administrator ONLY'
    },
    pointsBn: {
      whatIsThis: 'সরবরাহকারীদের জন্য তৈরি একটি পৃথক পোর্টাল যেখানে তারা নিজেদের ক্রয়াদেশ ও পেমেন্ট রসিদ দেখতে পারে।',
      whyUsed: 'পেমেন্ট ও অর্ডার বিষয়ে অপ্রয়োজনীয় ফোন বা জিজ্ঞাসা কমাতে এবং সম্পূর্ণ সিস্টেম নিরাপত্তা অক্ষুণ্ণ রাখতে ব্যবহৃত হয়।',
      howWorks: 'এটি ফিচার-ফ্ল্যাগের মাধ্যমে নিয়ন্ত্রিত। সক্রিয় হলেও সরবরাহকারী কখনই অভ্যন্তরীণ স্টাফ মেনু বা গ্রাহকের তথ্যে প্রবেশ করতে পারে না।',
      connectedTo: 'সরবরাহকারী রেকর্ড → ফিচার ফ্ল্যাগ → সীমাবদ্ধ ভেন্ডর এপিআই।',
      whatIfChanged: 'অন বা অফ করার সাথে সাথে ভেন্ডরের পোর্টাল লগইন তাৎক্ষণিক চালু বা বন্ধ হয়ে যায়।',
      affects: ['ভেন্ডর সেলফ-সার্ভিস লগইন', 'সরবরাহকারীর নিজের অর্ডারের বিবরণ প্রদর্শন'],
      doesNotAffect: ['অভ্যন্তরীণ অ্যাডমিন কার্যক্রম', 'ওয়েবসাইটে কেনাকাটা', 'গ্রাহক তথ্য'],
      required: ['নিবন্ধিত সরবরাহকারী', 'সুপার অ্যাডমিন অনুমতি', 'পাসওয়ার্ড'],
      currentStatus: 'নিরাপত্তা নিশ্চিতকরণে ফিচার-ফ্ল্যাগে সংরক্ষিত',
      warningRisk: 'কম - সম্পূর্ণ আলাদা হওয়ায় সরবরাহকারী অভ্যন্তরীণ কোনো ক্ষতি করতে পারে না।',
      whoCanChange: 'শুধুমাত্র সুপার অ্যাডমিন'
    }
  },

  supplier_agreements: {
    id: 'supplier_agreements',
    titleEn: 'Supplier Commercial Agreements & Settlement Rules',
    titleBn: 'সরবরাহকারী বাণিজ্যিক চুক্তি এবং সেটেলমেন্টের নিয়মাবলী',
    shortDescEn: 'Configurable commercial models: Fixed Cost, Percentage of Sale, Fixed Amount/Unit, and Revenue Share.',
    shortDescBn: 'বাণিজ্যিক রূপরেখা: ফিক্সড কস্ট, বিক্রয়ের শতাংশ, ইউনিট প্রতি নির্দিষ্ট দর ও রেভিনিউ শেয়ার।',
    pointsEn: {
      whatIsThis: 'Legally binding commercial rules defining how KISHOLOY pays the supplier when a product is delivered to a customer.',
      whyUsed: 'Provides complete transparency and allows multi-tier commercial structures without manual calculation overhead.',
      howWorks: 'When an order is marked DELIVERED, the active agreement rule at that exact second is snapshotted into an immutable settlement sale record.',
      connectedTo: 'Delivered Orders → Cost of Goods Sold → Supplier Payable Queue → Finance Settlement.',
      whatIfChanged: 'Updating an agreement only affects future sales; historical eligible sales preserve their original snapshot rules.',
      affects: ['Future order margin split', 'Supplier earnings calculation', 'KISHOLOY net retained revenue'],
      doesNotAffect: ['Customer retail price', 'Already generated settlements or historical statements'],
      required: ['Supplier Profile', 'Settlement Method', 'Percentage or Cost Value', 'Effective Date'],
      currentStatus: 'Server-Authoritative & Immutable Audited',
      warningRisk: 'MEDIUM - Setting wrong percentages will alter future supplier earnings split.',
      whoCanChange: 'Super Admin, Finance Director'
    },
    pointsBn: {
      whatIsThis: 'কিশলয় এবং সরবরাহকারীর মধ্যকার বাণিজ্যিক নিয়মনীতি যা নির্ধারণ করে পণ্য বিক্রির পর সরবরাহকারী কত টাকা পাবেন।',
      whyUsed: 'স্বচ্ছতা বজায় রাখতে এবং ম্যানুয়াল হিসাবের ভুল এড়াতে স্বয়ংক্রিয় বাণিজ্যিক নীতি প্রয়োগ করা হয়।',
      howWorks: 'গ্রাহকের কাছে অর্ডার DELIVERED হওয়ার সাথে সাথে সেই মুহূর্তের চুক্তি অনুসারে স্বয়ংক্রিয়ভাবে সরবরাহকারীর শেয়ার ও কিশলয়ের মার্জিন তৈরি হয়।',
      connectedTo: 'ডেলিভার্ড অর্ডার → পণ্যের ক্রয়মূল্য → সরবরাহকারীর পাওনা হিসাব → অর্থ বিভাগ।',
      whatIfChanged: 'চুক্তি পরিবর্তন করলে তা কেবল ভবিষ্যতের বিক্রির উপর প্রযোজ্য হবে; অতীত বিক্রির সংরক্ষিত নিয়ম অপরিবর্তিত থাকবে।',
      affects: ['ভবিষ্যত অর্ডারের লাভ বণ্টন', 'সরবরাহকারীর আয়ের হিসাব', 'কিশলয়ের সংরক্ষিত রাজস্ব'],
      doesNotAffect: ['গ্রাহকের বিক্রয়মূল্য', 'পূর্বের তৈরি করা সেটেলমেন্ট বা স্টেটমেন্ট'],
      required: ['সরবরাহকারী প্রোফাইল', 'সেটেলমেন্ট পদ্ধতি', 'শতাংশ বা দর', 'কার্যকর হওয়ার তারিখ'],
      currentStatus: 'সার্ভার-কর্তৃক সুরক্ষিত এবং অপরিবর্তনীয় অডিটযুক্ত',
      warningRisk: 'মাঝারি - ভুল শতাংশ বসালে ভবিষ্যতের অর্ডারের লাভের হিসাবে গরমিল হতে পারে।',
      whoCanChange: 'সুপার অ্যাডমিন, অর্থ পরিচালক'
    }
  },

  supply_batches: {
    id: 'supply_batches',
    titleEn: 'Supply Batches & Multi-Unit Stock Tracking',
    titleBn: 'সাপ্লাই ব্যাচ এবং পণ্যের স্টক ব্যবস্থাপনা',
    shortDescEn: 'Tracks inventory received from suppliers with sold, remaining, returned, and damaged counts.',
    shortDescBn: 'সরবরাহকারীর থেকে প্রাপ্ত পণ্যের প্রাপ্তি, বিক্রি, মজুদ, রিটার্ন ও ড্যামেজ হিসাব সংরক্ষণ।',
    pointsEn: {
      whatIsThis: 'Lot/Batch tracking for incoming physical inventory tied directly to the supplier and purchase contract.',
      whyUsed: 'Eliminates inventory discrepancies, tracks exact batch aging, and prevents selling non-existent goods.',
      howWorks: 'Receiving a batch automatically increments storefront catalog stock and registers an immutable inventory ledger transaction.',
      connectedTo: 'Catalog Stock → Warehouse Bins → Delivered Sales Deduction → Supplier Settlement.',
      whatIfChanged: 'Logging a new batch increases live stock on the e-commerce storefront immediately.',
      affects: ['Storefront live inventory', 'Batch remaining count', 'Warehouse bin capacity'],
      doesNotAffect: ['Customer payment gateway balances', 'Delivery courier dispatch rates'],
      required: ['Supplier ID', 'Product SKU', 'Quantity Received', 'Batch Unit Cost'],
      currentStatus: 'Integrated with Live Inventory Ledger',
      warningRisk: 'HIGH - Premature batch entry inflates live storefront stock before physical arrival.',
      whoCanChange: 'Super Admin, Inventory Manager'
    },
    pointsBn: {
      whatIsThis: 'সরবরাহকারী থেকে আসা পণ্যের ব্যাচভিত্তিক ট্র্যাকিং যা পণ্য ও ক্রয় চুক্তির সাথে যুক্ত থাকে।',
      whyUsed: 'স্টকের অমিল রোধ করতে এবং প্রতিটি লটের কতটি বিক্রি হয়েছে ও কতটি অবশিষ্ট আছে তা নিরূপণ করতে ব্যবহৃত হয়।',
      howWorks: 'নতুন ব্যাচ রিসিভ করার সাথে সাথে ওয়েবসাইটের ক্যাটালগে স্টক বেড়ে যায় এবং ইনভেন্টরি লেজারে এন্ট্রি পড়ে।',
      connectedTo: 'ক্যাটালগ স্টক → গুদাম বিন → বিক্রিত স্টক হ্রাস → সরবরাহকারী সেটেলমেন্ট।',
      whatIfChanged: 'নতুন ব্যাচ যোগ করলে ওয়েবসাইটে তাৎক্ষণিক বিক্রির জন্য পণ্য প্রদর্শন শুরু হয়।',
      affects: ['ওয়েবসাইটে প্রদর্শনযোগ্য স্টক', 'ব্যাচের অবশিষ্ট পণ্যের সংখ্যা', 'গুদামের ধারণক্ষমতা'],
      doesNotAffect: ['পেমেন্ট গেটওয়ের ব্যালেন্স', 'কুরিয়ার ডেলিভারি চার্জ'],
      required: ['সরবরাহকারী আইডি', 'পণ্য এসকেইউ', 'প্রাপ্ত পণ্যের পরিমাণ', 'ইউনিট ক্রয়মূল্য'],
      currentStatus: 'লাইভ ইনভেন্টরি লেজারের সাথে সংহত',
      warningRisk: 'উচ্চ - পণ্য গুদামে পৌঁছার পূর্বে এন্ট্রি দিলে ভুয়া স্টক তৈরি হতে পারে।',
      whoCanChange: 'সুপার অ্যাডমিন, ইনভেন্টরি ম্যানেজার'
    }
  },

  supplier_settlements: {
    id: 'supplier_settlements',
    titleEn: 'Automated Supplier Settlements & Payable Disbursement',
    titleBn: 'স্বয়ংক্রিয় সরবরাহকারী সেটেলমেন্ট এবং বিল পরিশোধ',
    shortDescEn: 'Consolidates delivered sales, return adjustments, and net payable calculations for periodic disbursement.',
    shortDescBn: 'নির্দিষ্ট মেয়াদের ডেলিভার্ড বিক্রি, রিটার্ন সমন্বয় ও মোট প্রদেয় অর্থ হিসাব করে বিল প্রস্তুতকরণ।',
    pointsEn: {
      whatIsThis: 'Periodic financial reconciliation consolidating delivered order line items into a formal payable balance.',
      whyUsed: 'Ensures suppliers are paid systematically with complete accounting clarity on gross sales, return offsets, and previous dues.',
      howWorks: 'Aggregates all eligible delivered sales for a date range, subtracts customer returns/refunds, applies prior balances, and prepares a disbursement invoice.',
      connectedTo: 'Delivered Orders → Return Processing → Bank/MFS Payout → Supplier Statement.',
      whatIfChanged: 'Creating or paying a settlement updates the supplier due ledger and marks eligible sales as settled.',
      affects: ['Supplier outstanding balance', 'Accounts payable ledger', 'Payment voucher history'],
      doesNotAffect: ['Customer order status', 'Product descriptions'],
      required: ['Eligible Delivered Sales', 'Settlement Date Range', 'Finance Officer Authorization'],
      currentStatus: 'Server-Authoritative Double-Entry Protected',
      warningRisk: 'HIGH - Generating settlements binds payable liabilities; review return adjustments carefully.',
      whoCanChange: 'Super Admin, Chief Financial Officer'
    },
    pointsBn: {
      whatIsThis: 'নির্দিষ্ট সময়ের ডেলিভার্ড পণ্য বিক্রির হিসাব একত্র করে সরবরাহকারীর চূড়ান্ত বিল বা সেটেলমেন্ট প্রস্তুতকরণ।',
      whyUsed: 'সরবরাহকারীকে নিয়মমাফিক পাওনা পরিশোধ নিশ্চিত করতে এবং মোট বিক্রি ও রিটার্নের স্বচ্ছ হিসাব দিতে ব্যবহৃত হয়।',
      howWorks: 'নির্বাচিত মেয়াদের সকল সফল বিক্রির শেয়ার একত্র করে, রিটার্ন ও রিফান্ড বাবদ অর্থ সমন্বয় করে চূড়ান্ত প্রদেয় টাকা তৈরি করে।',
      connectedTo: 'ডেলিভার্ড অর্ডার → রিটার্ন প্রসেসিং → ব্যাংক/এমএফএস পেমেন্ট → সরবরাহকারী স্টেটমেন্ট।',
      whatIfChanged: 'সেটেলমেন্ট তৈরি বা পরিশোধ করলে সরবরাহকারীর মোট বকেয়া আপডেট হয় এবং সংশ্লিষ্ট বিক্রয়গুলো সেটেলড হিসেবে চিহ্নিত হয়।',
      affects: ['সরবরাহকারীর চূড়ান্ত বকেয়া', 'অর্থ বিভাগের প্রদেয় দায় খতিয়ান', 'পেমেন্ট ভাউচার ইতিহাস'],
      doesNotAffect: ['গ্রাহকের অর্ডারের অবস্থা', 'পণ্যের ডেসক্রিপশন'],
      required: ['ডেলিভার্ড বিক্রয় রেকর্ড', 'সেটেলমেন্টের সময়কাল', 'অর্থ কর্মকর্তার অনুমতি'],
      currentStatus: 'সার্ভার-কর্তৃক নির্ভুল ও দ্বৈত এন্ট্রি সংরক্ষিত',
      warningRisk: 'উচ্চ - সেটেলমেন্ট চূড়ান্ত হলে আর্থিক দায় তৈরি হয়; রিটার্ন সমন্বয় সাবধানে যাচাই করুন।',
      whoCanChange: 'সুপার অ্যাডমিন, প্রধান অর্থ কর্মকর্তা'
    }
  }
};
