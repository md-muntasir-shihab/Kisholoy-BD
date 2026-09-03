import React from 'react';
import { 
  LayoutDashboard, ShoppingCart, ShieldAlert, Truck, Building2, Cpu, 
  RotateCcw, DollarSign, CreditCard, Package, Folders, Warehouse, 
  Users, Megaphone, Gift, BarChart3, FileText, Settings, ShieldCheck, 
  History, Database
} from 'lucide-react';

export interface AdminModuleItem {
  id: string;
  sectionId: 'sales-operations' | 'catalog-inventory' | 'customer-management' | 'system-administration';
  label: string;
  labelBn: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  role: string;
  roleBn: string;
  tagline: string;
  taglineBn: string;
  description: string;
  descriptionBn: string;
  tasksEn: string[];
  tasksBn: string[];
  badgeKey?: 'pendingOrders' | 'lowStock' | 'fraudAlerts';
}

export interface AdminSectionGroup {
  id: 'sales-operations' | 'catalog-inventory' | 'customer-management' | 'system-administration';
  title: string;
  titleBn: string;
  summary: string;
  summaryBn: string;
  badgeText?: string;
  badgeTextBn?: string;
  accentColor: string;
  items: AdminModuleItem[];
}

export const ADMIN_SECTIONS_DATA: AdminSectionGroup[] = [
  {
    id: 'sales-operations',
    title: 'Sales & Operations',
    titleBn: 'বিক্রয় ও দৈনিক অপারেশনস',
    summary: 'Manage incoming customer orders, fraud screening, warehouse fulfillment, dispatch couriers, returns, and daily payment reconciliations.',
    summaryBn: 'গ্রাহকদের অর্ডার গ্রহণ, প্রতারণা যাচাই, ওয়্যারহাউস প্যাকিং, কুরিয়ার হ্যান্ডওভার, রিটার্ন-রিফান্ড এবং পেমেন্ট রিকনসিলিয়েশন পরিচালনা করুন।',
    badgeText: '10 Operational Desks',
    badgeTextBn: '১০টি অপারেশনাল ডেস্ক',
    accentColor: 'teal',
    items: [
      {
        id: 'admin-nav-dashboard',
        sectionId: 'sales-operations',
        label: 'Dashboard Overview',
        labelBn: 'অপারেশনস ড্যাশবোর্ড',
        path: '/admin',
        icon: LayoutDashboard,
        role: 'All Staff',
        roleBn: 'সকল স্টাফ',
        tagline: 'Real-time telemetry, revenue figures, pending orders, and rapid actions',
        taglineBn: 'রিয়েল-টাইম রাজস্ব, পেন্ডিং অর্ডার, লো-স্টক অ্যালার্ট ও কুইক অ্যাকশন হাব',
        description: 'The central operational nerve center displaying high-level KPI cards, daily Gross Order Value (GOV), fulfillment queues, live courier statuses, and immediate attention alerts.',
        descriptionBn: 'কেন্দ্রীয় নিয়ন্ত্রণ ড্যাশবোর্ড যা লাইভ রাজস্ব (GOV), পেন্ডিং অর্ডারের কিউ, লো-স্টক সতর্কতা, সাম্প্রতিক ট্রানজাকশন এবং এক ক্লিকে অর্ডার কনফার্মেশনের সুযোগ দেয়।',
        tasksEn: [
          'Monitor real-time revenue and daily order growth',
          'Review active alerts for low inventory and high-risk orders',
          'Fast-track order verification directly from the live feed',
          'Check system health and active operational bottlenecks'
        ],
        tasksBn: [
          'দৈনিক মোট রাজস্ব ও অর্ডার বৃদ্ধির হার পর্যবেক্ষণ',
          'পেন্ডিং অর্ডার ও লো-স্টক অ্যালার্ট তাৎক্ষণিক খতিয়ে দেখা',
          'সরাসরি লাইভ টেবিল থেকে দ্রুত অর্ডার কনফার্ম ও প্রসেসিং',
          'কুরিয়ার ডেলিভারি স্ট্যাটাস ও সিস্টেম পারফরম্যান্স ট্র্যাকিং'
        ]
      },
      {
        id: 'admin-nav-orders',
        sectionId: 'sales-operations',
        label: 'Orders Desk',
        labelBn: 'অর্ডার প্রসেসিং ডেস্ক',
        path: '/admin/orders',
        icon: ShoppingCart,
        role: 'Order Manager, Admin',
        roleBn: 'অর্ডার ম্যানেজার, অ্যাডমিন',
        tagline: 'Order lifecycle management, phone verification, invoice generation, and status dispatch',
        taglineBn: 'অর্ডার ভেরিফিকেশন, ফোন কল কনফার্মেশন, চালান প্রিন্ট ও স্ট্যাটাস রূপান্তর',
        badgeKey: 'pendingOrders',
        description: 'Process every incoming customer order from PENDING to CONFIRMED, PROCESSING, and SHIPPED. Generate branded PDF/HTML invoices, verify shipping addresses, and log phone notes.',
        descriptionBn: 'নতুন অর্ডারের তথ্য যাচাই, গ্রাহকের ফোন নম্বর ভেরিফিকেশন, চালান বা ইনভয়েস প্রিন্ট, অ্যাড্রেস কারেকশন এবং প্যাকেজিং টিমে অর্ডার হ্যান্ডওভার সম্পন্ন করুন।',
        tasksEn: [
          'Verify customer phone numbers and confirm purchase intent',
          'Update status across lifecycle (Pending → Confirmed → Processing → Shipped)',
          'Print formal packaging slips and customer invoice bills',
          'Manage shipping address corrections and cancellation requests'
        ],
        tasksBn: [
          'গ্রাহকের সাথে ফোনে কথা বলে অর্ডারের সত্যতা নিশ্চিত করা',
          'অর্ডার স্ট্যাটাস ধাপে ধাপে আপডেট করা (পেন্ডিং থেকে ডেলিভার্ড)',
          'অফিসিয়াল প্যাকিং স্লিপ ও ট্যাক্স চালান প্রিন্ট করা',
          'ডেলিভারি ঠিকানা ও পণ্য পরিমাণ প্রয়োজনে সংশোধন করা'
        ]
      },
      {
        id: 'admin-nav-fraud',
        sectionId: 'sales-operations',
        label: 'Fraud & Anti-Abuse',
        labelBn: 'প্রতারণা ও ঝুঁকি প্রতিরোধ',
        path: '/admin/fraud',
        icon: ShieldAlert,
        role: 'Admin, Risk Officer',
        roleBn: 'অ্যাডমিন, রিস্ক অফিসার',
        tagline: 'Automated fraud scoring, fake order detection, courier blacklist lookup, and IP velocity analysis',
        taglineBn: 'ভুয়া অর্ডার শনাক্তকরণ, কুরিয়ার রিটার্ন ঝুঁকি বিশ্লেষণ ও ব্ল্যাকলিস্ট চেকার',
        badgeKey: 'fraudAlerts',
        description: 'Mitigate Cash-on-Delivery (COD) loss and high courier return ratios with automated heuristics, historic return records, suspicious IP tracking, and customer blacklists.',
        descriptionBn: 'ক্যাশ-অন-ডেলিভারিতে ক্ষতি ও কুরিয়ার রিটার্ন চার্জ ঠেকাতে স্বয়ংক্রিয় রিস্ক স্কোরিং, অতীতে পণ্য না নিয়ে ফেরত দেওয়ার ইতিহাস ও ফোন নম্বর ব্ল্যাকলিস্ট পরিচালনা করুন।',
        tasksEn: [
          'Review suspicious orders with high risk scores (>60)',
          'Audit customer history across courier return databases',
          'Manage blacklist of toxic phone numbers and fraudulent devices',
          'Require advance delivery charge OTP/bKash deposit for risky orders'
        ],
        tasksBn: [
          'উচ্চ ঝুঁকিপূর্ণ (স্কোর ৬০+) অর্ডারগুলোর ঝুঁকি কারণ খতিয়ে দেখা',
          'অতীতে পার্সেল রিটার্নের প্রবণতা রয়েছে কিনা তা বিশ্লেষণ করা',
          'প্রতারক বা অসৎ গ্রাহকদের ফোন নম্বর ব্ল্যাকলিস্টে যুক্ত করা',
          'সন্দেহজনক ক্ষেত্রে অগ্রিম ডেলিভারি চার্জ বা ওটিপি ভেরিফিকেশন চাওয়া'
        ]
      },
      {
        id: 'admin-nav-shipments',
        sectionId: 'sales-operations',
        label: 'Shipments & Courier',
        labelBn: 'কুরিয়ার ও শিপমেন্ট ট্র্যাকিং',
        path: '/admin/shipments',
        icon: Truck,
        role: 'Order Manager, Fulfillment',
        roleBn: 'অর্ডার ম্যানেজার, ফুলফিলমেন্ট',
        tagline: 'Integration with Steadfast, Pathao, RedX, bulk booking, consignment slips, and tracking logs',
        taglineBn: 'স্টেডফাস্ট, পাঠাও ও রেডএক্স এপিআই বুকিং, কনসাইনমেন্ট ট্র্যাকিং ও ডেলিভারি লগ',
        description: 'Seamless dispatch gateway to leading Bangladeshi couriers. Auto-generate tracking consignment numbers, print adhesive courier labels, and track delivery progress across districts.',
        descriptionBn: 'বাংলাদেশের শীর্ষ কুরিয়ার (স্টেডফাস্ট, পাঠাও) সার্ভিসে এক ক্লিকে পার্সেল বুকিং, ট্র্যাকিং আইডি পাওয়া, বারকোড স্টিকার প্রিন্ট ও জেলাভিত্তিক ডেলিভারি আপডেট দেখা।',
        tasksEn: [
          'Book parcels to courier APIs (Steadfast, Pathao, Paperfly)',
          'Generate and print shipping labels with customer phone & barcode',
          'Track live shipment transit across Dhaka and outside-Dhaka hubs',
          'Handle delivery exceptions, customer unreachable issues, and reschedule'
        ],
        tasksBn: [
          'কুরিয়ার সিস্টেমে এক ক্লিকে বা বাল্ক অর্ডারের পার্সেল বুকিং করা',
          'বারকোডসহ শিপিং লেবেল ও অ্যাড্রেস স্টিকার প্রিন্ট করা',
          'সারাদেশের বিভিন্ন হাব ও রাইডার পর্যায়ে পার্সেল ট্র্যাকিং দেখা',
          'গ্রাহক রিসিভ না করলে বা ফোন বন্ধ থাকলে ফলোআপ ও রিশিডিউল করা'
        ]
      },
      {
        id: 'admin-nav-fulfillment',
        sectionId: 'sales-operations',
        label: 'Hubs & Fulfillment',
        labelBn: 'হাব ও ওয়্যারহাউস ফুলফিলমেন্ট',
        path: '/admin/fulfillment',
        icon: Building2,
        role: 'Warehouse Staff, Admin',
        roleBn: 'ওয়্যারহাউস স্টাফ, অ্যাডমিন',
        tagline: 'Warehouse zones, shelf bin locations, pick & pack workflow, and dispatch logs',
        taglineBn: 'ওয়্যারহাউস জোন, তাক ও বিন লোকেশন, পিকিং-প্যাকিং এবং হাব ট্রান্সফার',
        description: 'Manage warehouse floor logistics. Coordinate order picking lists, QC inspections, barcoded packing stations, and handover to courier sorting vans.',
        descriptionBn: 'গুদাম ও ওয়্যারহাউসের পণ্য সাজানো, আইটেম পিকিং লিস্ট জেনারেট, মান নিয়ন্ত্রণ (QC) পরিদর্শন, শক্ত কার্টনিং এবং কুরিয়ার গাড়িতে হস্তান্তর নিশ্চিতকরণ।',
        tasksEn: [
          'Generate warehouse batch-picking lists by shelf location',
          'Conduct quality check (QC) and item barcode verification',
          'Package products with protective air-bubbles and tamper tape',
          'Coordinate inter-hub transfers and sorting center dispatches'
        ],
        tasksBn: [
          'তাক ও বিন নম্বর অনুযায়ী ব্যাচ পিকিং লিস্ট বের করা',
          'পণ্য প্যাকিংয়ের পূর্বে নিখুঁত মান যাচাই (QC) সম্পন্ন করা',
          'সিকিউরিটি সিল ও টেপ দিয়ে নিরাপদ প্যাকেট প্রস্তুত করা',
          'বিভিন্ন আঞ্চলিক হাব ও ডিপোর মধ্যে মালামাল স্থানান্তর দেখা'
        ]
      },
      {
        id: 'admin-nav-operations',
        sectionId: 'sales-operations',
        label: 'Operations & Queue',
        labelBn: 'অপারেশনস ব্যাকগ্রাউন্ড কিউ',
        path: '/admin/operations',
        icon: Cpu,
        role: 'System Engineer, Admin',
        roleBn: 'সিস্টেম ইঞ্জিনিয়ার, অ্যাডমিন',
        tagline: 'Asynchronous task queues, background workers, webhook delivery, and scheduled cron jobs',
        taglineBn: 'ব্যাকগ্রাউন্ড টাস্ক কিউ, অটো এসএমএস নোটিফিকেশন, ওয়েবহুক ডেলিভারি ও ক্রন জব',
        description: 'Supervise automated background processes including SMS alerts, email confirmations, courier status webhooks, inventory sync, and failed task retries.',
        descriptionBn: 'স্বয়ংক্রিয় ব্যাকগ্রাউন্ড কাজের স্বাস্থ্য পরীক্ষা—যেমন স্বয়ংক্রিয় এসএমএস পাঠানো, কুরিয়ার ওয়েবহুক গ্রহণ, ব্যর্থ ট্রানজাকশন রিট্রাই এবং ক্রন জব মনিটরিং।',
        tasksEn: [
          'Inspect background job queues and retry failed tasks',
          'Monitor SMS gateway delivery logs and customer alerts',
          'Audit courier and payment webhook callbacks for missed events',
          'Run scheduled maintenance, cache purges, and cleanup'
        ],
        tasksBn: [
          'ব্যাকগ্রাউন্ড টাস্ক কিউ পরীক্ষা এবং ফেইল্ড জবস পুনরায় চালু করা',
          'এসএমএস গেটওয়ে ডেলিভারি লগ ও কাস্টমার নোটিফিকেশন যাচাই',
          'পেমেন্ট ও কুরিয়ার ওয়েবহুকের রেসপন্স স্ট্যাটাস মনিটর করা',
          'সিস্টেম ক্যাশ রিফ্রেশ এবং শিডিউল্ড ক্লিনআপ সম্পন্ন করা'
        ]
      },
      {
        id: 'admin-nav-returns',
        sectionId: 'sales-operations',
        label: 'Returns (RMA)',
        labelBn: 'পণ্য রিটার্ন ও এক্সচেঞ্জ (RMA)',
        path: '/admin/returns',
        icon: RotateCcw,
        role: 'Support, Inventory Manager',
        roleBn: 'সাপোর্ট, ইনভেন্টরি ম্যানেজার',
        tagline: 'Return Merchandise Authorization (RMA), defect inspection, restocking, and replacements',
        taglineBn: 'পণ্য ফেরত অনুরোধ যাচাই, ত্রুটি পরীক্ষা, পুনরায় স্টকে যুক্ত ও এক্সচেঞ্জ ডেলিভারি',
        description: 'Handle customer return and exchange claims systematically. Log returned items, inspect defect claims with photo evidence, approve exchanges, or route to refunds.',
        descriptionBn: 'গ্রাহকদের পণ্য ফেরত ও বদলানোর আবেদন পরিচালনা। নষ্ট বা ভুল সাইজের পণ্য ওয়্যারহাউসে রিসিভ করা, ত্রুটি পরীক্ষা, ইনভেন্টরিতে ব্যাক করা বা নতুন পণ্য পাঠানো।',
        tasksEn: [
          'Receive customer RMA tickets with proof photos and reason',
          'Conduct warehouse receiving inspection for returned goods',
          'Authorize replacement item dispatch or forward to refund queue',
          'Restock undamaged goods back into active sellable inventory'
        ],
        tasksBn: [
          'গ্রাহকের রিটার্ন আবেদন ও পণ্যের ছবি/ভিডিও প্রমাণ পর্যালোচনা',
          'ওয়্যারহাউসে ফেরত আসা পণ্য ফিজিক্যাল চেক ও কোয়ালিটি টেষ্ট',
          'গ্রাহককে নতুন পণ্য এক্সচেঞ্জ পাঠানো অথবা রিফান্ডের অনুমোদন',
          'ভালো পণ্য পুনরায় সক্রিয় ইনভেন্টরি লেজারে যুক্ত করা'
        ]
      },
      {
        id: 'admin-nav-refunds',
        sectionId: 'sales-operations',
        label: 'Refunds Queue',
        labelBn: 'রিফান্ড ও মানি ব্যাক কিউ',
        path: '/admin/refunds',
        icon: DollarSign,
        role: 'Finance, Super Admin',
        roleBn: 'ফাইন্যান্স, সুপার অ্যাডমিন',
        tagline: 'bKash, Nagad, and bank refund processing, accounting approval, and payout vouchers',
        taglineBn: 'বিকাশ, নগদ ও ব্যাংক রিফান্ড অনুমোদন, টাকা ফেরত রসিদ ও ব্যালেন্স সমন্বয়',
        description: 'Review authorized customer money-back requests. Execute instant bKash/Nagad reverse transactions or bank transfers with strict ledger double-entry checks.',
        descriptionBn: 'অনুমোদিত রিফান্ড আবেদনগুলোর জন্য বিকাশ, নগদ বা ব্যাংক একাউন্টে টাকা ফেরত পাঠানো। হিসাবরক্ষণ বিভাগে ভাউচার এন্ট্রি এবং গ্রাহককে কনফার্মেশন এসএমএস প্রদান।',
        tasksEn: [
          'Verify refund eligibility based on returned goods inspection',
          'Disburse payments via bKash/Nagad Merchant B2C or bank EFT',
          'Record formal accounting vouchers and balance deductions',
          'Notify customer with payment transaction ID (TrxID) via SMS'
        ],
        tasksBn: [
          'পণ্য ফেরত পাওয়ার পর রিফান্ডের টাকার পরিমাণ যাচাই করা',
          'বিকাশ, নগদ বা ব্যাংক ট্রান্সফারের মাধ্যমে গ্রাহককে টাকা পাঠানো',
          'আর্থিক খতিয়ানে ডেবিট-ক্রেডিট হিসাব লিপিবদ্ধ করা',
          'লেনদেনের ট্রানজাকশন আইডি (TrxID) সহ গ্রাহককে অবহিত করা'
        ]
      },
      {
        id: 'admin-nav-payments',
        sectionId: 'sales-operations',
        label: 'Payments & Ledger',
        labelBn: 'পেমেন্ট ভেরিফিকেশন ও লেজার',
        path: '/admin/payments',
        icon: CreditCard,
        role: 'Finance, Admin',
        roleBn: 'ফাইন্যান্স, অ্যাডমিন',
        tagline: 'Online payment gateways (bKash, Nagad, SSLCommerz, Shurjopay), COD reconciliation, and IPN logs',
        taglineBn: 'অনলাইন পেমেন্ট গেটওয়ে, ক্যাশ-অন-ডেলিভারি টাকা কালেকশন ও ইনস্ট্যান্ট আইপিএন ভেরিফিকেশন',
        description: 'Audit every financial transaction across payment gateways and courier COD reconciliations. Verify instant payment notifications (IPN) and eliminate unverified claims.',
        descriptionBn: 'অনলাইন গেটওয়ে (বিকাশ, নগদ, কার্ড) এবং কুরিয়ার থেকে প্রাপ্ত ক্যাশ-অন-ডেলিভারির টাকার নিখুঁত মেলবন্ধন। কোনো ভুয়া বা অসমাপ্ত পেমেন্ট থাকলে তা শনাক্ত করা।',
        tasksEn: [
          'Verify bKash / Nagad TrxIDs directly against gateway query APIs',
          'Reconcile courier COD payout invoices and delivery commission fees',
          'Identify payment mismatches, partial payments, and overdue accounts',
          'Export daily payment reconciliation sheets for accounting'
        ],
        tasksBn: [
          'গেটওয়ে এপিআই এর মাধ্যমে বিকাশ/নগদ ট্রানজাকশন আইডি ভেরিফাই করা',
          'কুরিয়ারের পাঠানো ক্যাশ কালেকশন শীট ও কমিশন হিসাব মেলানো',
          'অসম্পূর্ণ পেমেন্ট বা ভুল তথ্য দ্রুত সমাধান করা',
          'প্রতিদিনের পেমেন্ট রিকনসিলিয়েশন রিপোর্ট এক্সপোর্ট করা'
        ]
      },
      {
        id: 'admin-nav-finance',
        sectionId: 'sales-operations',
        label: 'Finance & P&L',
        labelBn: 'ফাইন্যান্স ও লাভ-ক্ষতি হিসাব',
        path: '/admin/finance',
        icon: DollarSign,
        role: 'Finance, Super Admin',
        roleBn: 'ফাইন্যান্স, সুপার অ্যাডমিন',
        tagline: 'Cost of Goods Sold (COGS), net operating profit, packaging overhead, and courier expense analytics',
        taglineBn: 'পণ্যের ক্রয়মূল্য (COGS), কুরিয়ার খরচ, প্যাকিং খরচ ও প্রকৃত নিট মুনাফা বিশ্লেষণ',
        description: 'Comprehensive financial statements and profit-and-loss intelligence. Track gross margins, delivery subsidies, marketing cost per acquisition, and net profit margins.',
        descriptionBn: 'প্রতিষ্ঠানের বিস্তারিত লাভ-ক্ষতির হিসাব। পণ্যের ক্রয়মূল্য, কুরিয়ার চার্জ, প্যাকিং সামগ্রীর খরচ এবং বিপণন ব্যয় বাদ দিয়ে প্রকৃত নিট লাভ নির্ধারণ।',
        tasksEn: [
          'Calculate Net Profit after subtracting COGS, courier, and packing',
          'Track courier return expense burden and identify loss-making products',
          'Review balance sheets, gross margin percentages, and operating cash flow',
          'Forecast tax liabilities and prepare monthly financial statements'
        ],
        tasksBn: [
          'ক্রয়মূল্য, ডেলিভারি ও প্যাকেজিং খরচ বাদে নিট লাভ হিসাব করা',
          'কুরিয়ার রিটার্নজনিত ক্ষতির পরিমাণ চিহ্নিত করে প্রতিরোধ করা',
          'গ্রস মার্জিন, ক্যাশ ফ্লো ও ব্যালেন্স শীট পর্যালোচনা করা',
          'মাসিক আর্থিক বিবরণী ও কর সংক্রান্ত হিসাব তৈরি করা'
        ]
      }
    ]
  },
  {
    id: 'catalog-inventory',
    title: 'Catalog & Inventory',
    titleBn: 'ক্যাটালগ ও ইনভেন্টরি ম্যানেজমেন্ট',
    summary: 'Manage master product SKUs, categories, variants, inventory ledgers, stock alerts, and vendor supplier procurement.',
    summaryBn: 'পণ্য ক্যাটালগ তৈরি, ক্যাটাগরি ও মেনু সাজানো, স্টক লেজার ট্র্যাকিং, রি-অর্ডার অ্যালার্ট এবং সরবরাহকারী থেকে পণ্য সংগ্রহ।',
    badgeText: '4 Inventory Desks',
    badgeTextBn: '৪টি ইনভেন্টরি ডেস্ক',
    accentColor: 'amber',
    items: [
      {
        id: 'admin-nav-products',
        sectionId: 'catalog-inventory',
        label: 'Products Catalog',
        labelBn: 'পণ্য ক্যাটালগ ও ভ্যারিয়েন্ট',
        path: '/admin/products',
        icon: Package,
        role: 'Catalog Specialist, Admin',
        roleBn: 'ক্যাটালগ স্পেশালিস্ট, অ্যাডমিন',
        tagline: 'Product listings, Bangla/English descriptions, variant matrices, high-res photos, and pricing',
        taglineBn: 'নতুন পণ্য তৈরি, বাংলা-ইংরেজি বিবরণ, ভ্যারিয়েন্ট (সাইজ/রং), ছবি ও মূল্য নির্ধারণ',
        description: 'Add and edit products with multi-image galleries, Bangla/English descriptions, wholesale vs retail prices, weight/dimensions for shipping, and SEO metadata.',
        descriptionBn: 'দোকানের সকল পণ্য পরিচালনা। পণ্যের স্পষ্ট ছবি, বাংলা ও ইংরেজিতে আকর্ষণীয় বিবরণ, সাইজ/রঙের ভ্যারিয়েন্ট, ওজন এবং সার্চ ইঞ্জিন (SEO) তথ্য যুক্ত করুন।',
        tasksEn: [
          'Create new products with high-resolution image uploads',
          'Configure size, color, weight, and price variant options',
          'Write bilingual product titles, bullet features, and specifications',
          'Toggle product visibility, featured flags, and discount labels'
        ],
        tasksBn: [
          'উচ্চমানের ছবি ও বিস্তারিত বিবরণসহ নতুন পণ্য আপলোড করা',
          'সাইজ, রঙ, ওজন এবং ভ্যারিয়েন্ট অনুযায়ী আলাদা মূল্য নির্ধারণ',
          'বাংলা ও ইংরেজিতে সহজবোধ্য শিরোনাম ও স্পেসিফিকেশন লেখা',
          'পণ্য প্রদর্শন অন/অফ করা এবং স্পেশাল অফার ট্যাগ যুক্ত করা'
        ]
      },
      {
        id: 'admin-nav-categories',
        sectionId: 'catalog-inventory',
        label: 'Categories & Menus',
        labelBn: 'ক্যাটাগরি ও মেনু কাঠামো',
        path: '/admin/categories',
        icon: Folders,
        role: 'Catalog Specialist, Admin',
        roleBn: 'ক্যাটালগ স্পেশালিস্ট, অ্যাডমিন',
        tagline: 'Hierarchical category tree, storefront navigation menus, icon badges, and banner associations',
        taglineBn: 'ক্যাটাগরি-সাবক্যাটাগরি তৈরি, স্টোরফ্রন্ট নেভিগেশন মেনু ও ব্যানার লিংক',
        description: 'Structure your storefront taxonomy. Organize items into categories and sub-categories with clean URL slugs, thumbnail icons, and featured showcase banners.',
        descriptionBn: 'গ্রাহকদের সহজে পণ্য খুঁজে পাওয়ার জন্য সুশৃঙ্খল ক্যাটাগরি ও সাব-ক্যাটাগরি তৈরি। ক্যাটাগরি ব্যানার, আইকন এবং মূল মেনু নেভিগেশন সাজানো।',
        tasksEn: [
          'Create primary categories and nested sub-category trees',
          'Assign banner images and icons for storefront navigation',
          'Configure slug URLs for optimized Google search indexing',
          'Reorder display priorities for seasonal campaigns'
        ],
        tasksBn: [
          'মূল ক্যাটাগরি ও সাব-ক্যাটাগরি ক্রমানুসারে তৈরি করা',
          'ক্যাটাগরির ছবি ও আইকন সেট করে ওয়েবসাইটের সৌন্দর্য বাড়ানো',
          'সার্চ ইঞ্জিনের জন্য সুন্দর ও এসইও-বান্ধব ইউআরএল লিংক তৈরি',
          'সিজন বা ট্রেন্ড অনুযায়ী ক্যাটাগরির সিরিয়াল সাজানো'
        ]
      },
      {
        id: 'admin-nav-inventory',
        sectionId: 'catalog-inventory',
        label: 'Inventory Ledger',
        labelBn: 'ইনভেন্টরি স্টক লেজার',
        path: '/admin/inventory',
        icon: Warehouse,
        role: 'Inventory Manager, Admin',
        roleBn: 'ইনভেন্টরি ম্যানেজার, অ্যাডমিন',
        tagline: 'Live SKU stock counts, low-stock threshold triggers, adjustment logs, and warehouse audit history',
        taglineBn: 'লাইভ স্টক হিসাব, ঘাটতি অ্যালার্ট, স্টক সমন্বয় হিস্ট্রি ও ক্ষতিসাধন ট্র্যাকিং',
        badgeKey: 'lowStock',
        description: 'Audit warehouse shelf quantities in real time. Track incoming replenishment batches, reserved order quantities, damaged write-offs, and automated low-stock warnings.',
        descriptionBn: 'দোকানের গুদামে কতটি পণ্য আছে তার লাইভ হিসাব। কোনো পণ্য ৫টির নিচে নামলে সতর্কবার্তা পাওয়া, নতুন লট যোগ করা এবং নষ্ট বা হারানো পণ্যের অ্যাডজাস্টমেন্ট রেকর্ড রাখা।',
        tasksEn: [
          'Monitor real-time inventory levels across all product SKUs',
          'Receive low-stock warnings before popular items go out of stock',
          'Execute manual inventory adjustments with mandatory reason audit logs',
          'Track reserved units locked by pending unconfirmed orders'
        ],
        tasksBn: [
          'প্রতিটি পণ্যের বর্তমান মজুত সংখ্যা সরাসরি স্ক্রিনে দেখা',
          'স্টক শেষ হওয়ার আগেই স্বয়ংক্রিয় সতর্কবার্তা পেয়ে রি-অর্ডার করা',
          'পণ্য নষ্ট বা মিসিং হলে কারণ উল্লেখ করে স্টক অ্যাডজাস্ট করা',
          'পেন্ডিং অর্ডারের জন্য লক হয়ে থাকা স্টক সংখ্যা পর্যবেক্ষণ'
        ]
      },
      {
        id: 'admin-nav-suppliers',
        sectionId: 'catalog-inventory',
        label: 'Suppliers & Procurement',
        labelBn: 'সাপ্লায়ার ও সংগ্রহ ম্যানেজমেন্ট',
        path: '/admin/suppliers',
        icon: Building2,
        role: 'Procurement Officer, Admin',
        roleBn: 'প্রকিউরমেন্ট অফিসার, অ্যাডমিন',
        tagline: 'Vendor directory, purchase orders (PO), factory lead times, unit costs, and receiving docks',
        taglineBn: 'সরবরাহকারী তালিকা, পারচেজ অর্ডার (PO), পাইকারি ক্রয়মূল্য ও মালামাল রিসিভিং ডক',
        description: 'Manage manufacturer and vendor partnerships. Issue formal purchase orders, track unit procurement costs, schedule delivery dates, and receive wholesale stock.',
        descriptionBn: 'পাইকারি সাপ্লায়ার ও কারখানার সাথে যোগাযোগ। অফিসিয়াল পারচেজ অর্ডার (PO) পাঠানো, পণ্যের ক্রয়মূল্য ও বকেয়া হিসাব রাখা এবং মালপত্র গুদামে রিসিভ করা।',
        tasksEn: [
          'Maintain verified vendor contact info, bank details, and terms',
          'Draft and dispatch purchase orders (PO) with itemized costs',
          'Log incoming shipments at the warehouse receiving dock',
          'Track supplier payable balances and purchase payment history'
        ],
        tasksBn: [
          'সাপ্লায়ারদের নাম, ফোন, ফ্যাক্টরি ঠিকানা ও পেমেন্ট শর্ত সংরক্ষণ',
          'ক্রয়মূল্য উল্লেখ করে ডিজিটাল পারচেজ অর্ডার (PO) তৈরি ও প্রেরণ',
          'ওয়্যারহাউসে চালান অনুযায়ী মালামাল গুনে রিসিভ করা',
          'সাপ্লায়ারদের দেনা-পাওনার হিসাব ও পেমেন্ট হিস্ট্রি মেইনটেইন করা'
        ]
      }
    ]
  },
  {
    id: 'customer-management',
    title: 'Customer Management',
    titleBn: 'গ্রাহক ও প্রচারণা ব্যবস্থাপনা',
    summary: 'Manage customer accounts, purchase history, lifetime value (LTV), targeted SMS marketing, coupons, and reward loyalty points.',
    summaryBn: 'গ্রাহকদের তালিকা ও প্রোফাইল, লাইফটাইম ভ্যালু, এসএমএস প্রচারণা, ডিসকাউন্ট কুপন ও লয়্যালটি রিওয়ার্ড পরিচালনা।',
    badgeText: '3 Relationship Desks',
    badgeTextBn: '৩টি রিলেশনশিপ ডেস্ক',
    accentColor: 'emerald',
    items: [
      {
        id: 'admin-nav-customers',
        sectionId: 'customer-management',
        label: 'Customers Directory',
        labelBn: 'গ্রাহক তালিকা ও প্রোফাইল',
        path: '/admin/customers',
        icon: Users,
        role: 'Support, CRM Manager, Admin',
        roleBn: 'সাপোর্ট, সিআরএম ম্যানেজার, অ্যাডমিন',
        tagline: 'Comprehensive customer database, delivery addresses, order frequencies, and lifetime value',
        taglineBn: 'সকল নিবন্ধিত গ্রাহকের তথ্য, ঠিকানার বই, মোট কেনাকাটা ও কাস্টমার লাইফটাইম ভ্যালু',
        description: 'Complete view of every customer who has purchased or registered. Inspect full order histories, verified phone numbers, preferred delivery addresses, and customer VIP tiers.',
        descriptionBn: 'দোকানের সকল কাস্টমারের বিস্তারিত প্রোফাইল। তাদের সম্পূর্ণ কেনাকাটার রেকর্ড, ফোন ভেরিফিকেশন স্ট্যাটাস, ডেলিভারি ঠিকানা এবং বিশ্বস্ত লয়াল কাস্টমার চিহ্নিতকরণ।',
        tasksEn: [
          'Search customers by phone number, name, or city district',
          'View past order frequency, average order value (AOV), and total spend',
          'Review customer delivery notes, address history, and contact issues',
          'Manage customer account statuses (Active, Flagged, Restricted)'
        ],
        tasksBn: [
          'ফোন নম্বর, নাম বা জেলা দিয়ে সহজেই নির্দিষ্ট গ্রাহককে খুঁজে বের করা',
          'পূর্বে কত টাকার অর্ডার করেছেন এবং কয়টি সফলভাবে ডেলিভারি হয়েছে তা দেখা',
          'গ্রাহকের সংরক্ষিত ঠিকানা ও স্পেশাল ডেলিভারি নোট পর্যালোচনা',
          'বিশ্বস্ত কাস্টমারদের ভিআইপি মর্যাদা প্রদান বা সমস্যাযুক্ত একাউন্ট ফ্ল্যাগ করা'
        ]
      },
      {
        id: 'admin-nav-marketing',
        sectionId: 'customer-management',
        label: 'Marketing & CRM',
        labelBn: 'মার্কেটিং ও এসএমএস ক্যাম্পেইন',
        path: '/admin/marketing',
        icon: Megaphone,
        role: 'Marketing Manager, Admin',
        roleBn: 'মার্কেটিং ম্যানেজার, অ্যাডমিন',
        tagline: 'Targeted SMS marketing, automated cart recovery, promotional emails, and campaign conversion telemetry',
        taglineBn: 'টার্গেটেড এসএমএস পাঠানো, পরিত্যক্ত কার্ট রিকভারি, অফার প্রচার ও কনভার্সন বিশ্লেষণ',
        description: 'Engage customers and boost repeat purchases. Broadcast personalized SMS promotions to segmented audiences, re-engage abandoned carts, and track marketing ROI.',
        descriptionBn: 'গ্রাহকদের কেনাকাটায় উৎসাহিত করতে বাল্ক এসএমএস পাঠানো, যারা কার্টে পণ্য রেখে চলে গেছে তাদের ডিসকাউন্ট মেসেজ দেওয়া এবং ক্যাম্পেইনের ফলাফল বিশ্লেষণ করা।',
        tasksEn: [
          'Compose and send targeted Bangla/English SMS campaigns to buyer segments',
          'Trigger automated discount reminders for abandoned shopping carts',
          'Track campaign conversion rates, clicked links, and generated revenue',
          'Manage customer opt-in preferences and promotional sender IDs'
        ],
        tasksBn: [
          'নির্বাচিত গ্রাহকদের জন্য বাংলা বা ইংরেজিতে অফারের এসএমএস পাঠানো',
          'অর্ডার না করে চলে যাওয়া কাস্টমারদের রিকভারি নোটিফিকেশন দেওয়া',
          'ক্যাম্পেইন থেকে কতটি নতুন অর্ডার ও বিক্রি এসেছে তা পরিমাপ করা',
          'গ্রাহকদের এসএমএস সাবস্ক্রিপশন ও প্রমোশনাল আইডি পরিচালনা'
        ]
      },
      {
        id: 'admin-nav-promotions',
        sectionId: 'customer-management',
        label: 'Promotions & Loyalty',
        labelBn: 'ভাউচার, ডিসকাউন্ট ও লয়্যালটি',
        path: '/admin/promotions',
        icon: Gift,
        role: 'Marketing, Admin',
        roleBn: 'মার্কেটিং, অ্যাডমিন',
        tagline: 'Discount coupon codes, tiered percentage vouchers, minimum cart thresholds, and customer reward points',
        taglineBn: 'কুপন কোড তৈরি, ফ্ল্যাট বা পারসেন্টেজ ছাড়, মিনিমাম কার্ট লিমিট ও পয়েন্ট সিস্টেম',
        description: 'Drive sales velocity with flexible coupon promotions. Set start/expiry dates, maximum usage limits, category restrictions, and award customer loyalty reward points.',
        descriptionBn: 'বিক্রি বাড়াতে কুপন কোড (যেমন: EID2026, FIRST50) তৈরি। নির্দিষ্ট পরিমাণ কেনাকাটায় ছাড়, ক্যাটাগরিভিত্তিক অফার এবং পয়েন্টের মাধ্যমে লয়াল কাস্টমার রিওয়ার্ড দেওয়া।',
        tasksEn: [
          'Create promo codes with fixed BDT off or percentage discounts',
          'Set expiration dates, minimum cart thresholds, and per-user usage limits',
          'Configure product or category-exclusive promotional rules',
          'Monitor coupon usage frequency and measure promotion profitability'
        ],
        tasksBn: [
          'নির্দিষ্ট টাকার বা শতকরা ছাড়ের প্রমো কোড তৈরি করা',
          'অফারের মেয়াদ, সর্বনিম্ন অর্ডারের লিমিট ও ব্যবহার সংখ্যা নির্ধারণ',
          'নির্দিষ্ট ক্যাটাগরি বা পণ্যের জন্য এক্সক্লুসিভ অফার সেট করা',
          'কোন কুপন কতবার ব্যবহার হয়েছে এবং লাভজনক কিনা তা নিরীক্ষণ'
        ]
      }
    ]
  },
  {
    id: 'system-administration',
    title: 'System Administration',
    titleBn: 'সিস্টেম প্রশাসন ও নিরাপত্তা',
    summary: 'Enterprise controls including analytics reports, storefront CMS, payment & courier configurations, role-based staff access, audit logs, and database backups.',
    summaryBn: 'প্রতিষ্ঠানের নিরাপত্তা ও কনফিগারেশন: অ্যানালিটিক্স রিপোর্ট, সাইট কনটেন্ট ও ব্যানার CMS, স্টাফদের একাউন্ট পারমিশন, অডিট ট্রেইল এবং ব্যাকআপ।',
    badgeText: '6 Admin Desks',
    badgeTextBn: '৬টি অ্যাডমিন ডেস্ক',
    accentColor: 'indigo',
    items: [
      {
        id: 'admin-nav-reports',
        sectionId: 'system-administration',
        label: 'Reports & Analytics',
        labelBn: 'বিজনেস অ্যানালিটিক্স ও রিপোর্ট',
        path: '/admin/reports',
        icon: BarChart3,
        role: 'Super Admin, Finance, Analyst',
        roleBn: 'সুপার অ্যাডমিন, ফাইন্যান্স, অ্যানালিস্ট',
        tagline: 'Sales charts, top-selling SKUs, regional heatmaps, revenue breakdowns, and CSV data export',
        taglineBn: 'বিক্রয় ট্রেন্ড চার্ট, সর্বোচ্চ বিক্রীত পণ্য, জেলাভিত্তিক বিক্রয় ও এক্সেল/সিএসভি এক্সপোর্ট',
        description: 'Empower leadership with data-driven intelligence. Analyze revenue curves, bestselling products, customer retention rates, delivery performance, and export clean CSV reports.',
        descriptionBn: 'ব্যবসার প্রতিটি বিষয়ের তথ্যভিত্তিক বিশ্লেষণ। দৈনিক ও মাসিক বিক্রির চার্ট, সর্বোচ্চ বিক্রীত পণ্যের তালিকা, কুরিয়ার পারফরম্যান্স এবং এক্সেল বা সিএসভিতে ডাটা ডাউনলোড।',
        tasksEn: [
          'Analyze weekly, monthly, and yearly sales velocity trends',
          'Identify top 10 bestselling products and highest margin categories',
          'Evaluate delivery success rates across Dhaka vs Outside Dhaka',
          'Export formatted CSV/Excel reports for accounting and tax audits'
        ],
        tasksBn: [
          'দৈনিক, সাপ্তাহিক ও মাসিক বিক্রির গ্রাফ ও তুলনামূলক চিত্র দেখা',
          'সবচেয়ে বেশি বিক্রি হওয়া ১০টি পণ্য ও লাভজনক ক্যাটাগরি জানা',
          'ঢাকার ভেতর ও বাইরে কুরিয়ার ডেলিভারি সফলতার হার তুলনা করা',
          'হিসাবরক্ষণ ও ট্যাক্স ফাইলিংয়ের জন্য বিস্তারিত এক্সেল ফাইল ডাউনলোড'
        ]
      },
      {
        id: 'admin-nav-content',
        sectionId: 'system-administration',
        label: 'Content CMS',
        labelBn: 'সাইট কনটেন্ট ও ব্যানার CMS',
        path: '/admin/content',
        icon: FileText,
        role: 'Content Editor, Admin',
        roleBn: 'কনটেন্ট এডিটর, অ্যাডমিন',
        tagline: 'Admin-editable homepage hero sliders, announcement banners, terms, privacy, and return policies',
        taglineBn: 'হোমপেজ হিরো ব্যানার পরিবর্তন, ঘোষণা বার, নোটিশ, রিটার্ন পলিসি ও ওয়েবসাইট তথ্য এডিটর',
        description: 'Complete control over every public-facing word and image. Edit homepage promotional hero slides, top announcement tickers, contact information, FAQ questions, and formal policy pages.',
        descriptionBn: 'ওয়েবসাইটের সাধারণ কনটেন্ট পরিবর্তনের জন্য সহজ সিএমএস। হোমপেজের আকর্ষণীয় ব্যানার পরিবর্তন, অফার ঘোষণা বার, যোগাযোগের ঠিকানা ও পলিসি পেজ সরাসরি এডিট করুন।',
        tasksEn: [
          'Upload and configure homepage carousel banners with call-to-action links',
          'Update top announcement bar text for ongoing sales or holiday notices',
          'Edit store contact info, WhatsApp support numbers, and social links',
          'Revise official terms, privacy guidelines, and return policy wording'
        ],
        tasksBn: [
          'হোমপেজের স্লাইডার ব্যানার ও ক্লিক করলে কোন পেজে যাবে তা সেট করা',
          'ওয়েবসাইটের উপরের অফার ঘোষণা বা জরুরি ছুটির নোটিশ পরিবর্তন করা',
          'দোকানের যোগাযোগের ঠিকানা, ফোন ও হোয়াটসঅ্যাপ নম্বর আপডেট করা',
          'রিটার্ন পলিসি, প্রাইভেসি ও শর্তাবলী সহজেই এডিট ও সেভ করা'
        ]
      },
      {
        id: 'admin-nav-settings',
        sectionId: 'system-administration',
        label: 'Store Settings',
        labelBn: 'স্টোর কনফিগারেশন ও সেটিংস',
        path: '/admin/settings',
        icon: Settings,
        role: 'Super Admin',
        roleBn: 'সুপার অ্যাডমিন',
        tagline: 'Delivery fee matrix (Inside/Outside Dhaka), VAT/tax rates, courier API keys, and store profile',
        taglineBn: 'ডেলিভারি চার্জ (ঢাকার ভেতর/বাইরে), ভ্যাট হার, কুরিয়ার এপিআই কি ও স্টোর তথ্য কনফিগ',
        description: 'Configure foundational business parameters. Update flat delivery charges for inside Dhaka vs across Bangladesh, free shipping thresholds, VAT percentage, and payment gateway credentials.',
        descriptionBn: 'ব্যবসার মৌলিক নীতিমালা সেট করা। ঢাকা সিটির ভেতরের ডেলিভারি চার্জ, ঢাকার বাইরের চার্জ, ফ্রি ডেলিভারি লিমিট, ভ্যাট ও ট্যাক্সের হার এবং পেমেন্ট গেটওয়ের সেটিংস।',
        tasksEn: [
          'Configure delivery charges for Dhaka metropolitan and divisional zones',
          'Set minimum cart value required for automatic free shipping',
          'Set applicable VAT/Tax percentages for invoice calculation',
          'Manage payment gateway merchant credentials and store currency'
        ],
        tasksBn: [
          'ঢাকার ভেতর ও বাইরের জন্য আলাদা ডেলিভারি ফি নির্ধারণ করা',
          'কত টাকার বেশি কিনলে কাস্টমার ফ্রি ডেলিভারি পাবে তা সেট করা',
          'চালানের ভ্যাট/ট্যাক্স শতকরা হার কনফিগার করা',
          'পেমেন্ট গেটওয়ের মার্চেন্ট ক্রেডেনশিয়াল ও স্টোরের নাম ঠিক করা'
        ]
      },
      {
        id: 'admin-nav-users',
        sectionId: 'system-administration',
        label: 'Users & RBAC',
        labelBn: 'ইউজার ও ভূমিকা (RBAC)',
        path: '/admin/users',
        icon: ShieldCheck,
        role: 'Super Admin',
        roleBn: 'সুপার অ্যাডমিন',
        tagline: 'Staff account management, Role-Based Access Control (RBAC), multi-factor authentication, and security',
        taglineBn: 'স্টাফ একাউন্ট তৈরি, দায়িত্বভিত্তিক পারমিশন (RBAC), পাসওয়ার্ড ও নিরাপত্তা নিয়ন্ত্রণ',
        description: 'Enforce enterprise security through Role-Based Access Control (RBAC). Create individual staff logins, assign permissions (Order Manager, Inventory, Finance, Support), and disable ex-employee access.',
        descriptionBn: 'কর্মচারী ও কর্মকর্তাদের একাউন্ট তৈরি ও নিয়ন্ত্রণ। কাকে কোন পেজ দেখার অনুমতি দেওয়া হবে (যেমন: অর্ডার ম্যানেজার, ইনভেন্টরি, ফাইন্যান্স) তা নিখুঁতভাবে নির্ধারণ করা।',
        tasksEn: [
          'Create and provision accounts for new administrative employees',
          'Assign granular roles (Super Admin, Order Manager, Inventory, Finance, Support)',
          'Enforce password policies and monitor active login sessions',
          'Instantly revoke access or suspend accounts to safeguard store data'
        ],
        tasksBn: [
          'নতুন স্টাফদের জন্য অফিসিয়াল ইউজার একাউন্ট তৈরি করা',
          'নির্দিষ্ট ভূমিকা (সুপার অ্যাডমিন, অর্ডার ম্যানেজার, ফাইন্যান্স) অ্যাসাইন করা',
          'কর্মকর্তাদের শেষ লগইন সময় ও সিকিউরিটি স্ট্যাটাস দেখা',
          'প্রয়োজনে তাৎক্ষণিকভাবে কোনো একাউন্টের অ্যাক্সেস বন্ধ করে দেওয়া'
        ]
      },
      {
        id: 'admin-nav-audit',
        sectionId: 'system-administration',
        label: 'Audit Trail',
        labelBn: 'সিস্টেম অডিট ট্রেইল',
        path: '/admin/audit',
        icon: History,
        role: 'Super Admin, Auditor',
        roleBn: 'সুপার অ্যাডমিন, অডিটর',
        tagline: 'Immutable tamper-proof logs of administrative actions, price modifications, stock overrides, and security events',
        taglineBn: 'প্রতিটি পরিবর্তনের স্থায়ী লগ, কে কখন মূল্য পরিবর্তন বা স্টক বাড়িয়েছে তার টাইমস্ট্যাম্পযুক্ত প্রমাণ',
        description: 'Ensure full operational accountability. Every admin order update, stock quantity change, price adjustment, and refund approval is logged with timestamp, user ID, and IP address.',
        descriptionBn: 'সম্পূর্ণ স্বচ্ছতা ও জবাবদিহিতা নিশ্চিতকরণ। কোন কর্মকর্তা কখন কোন পণ্যের দাম বাড়িয়েছেন, কার অর্ডারে ডিসকাউন্ট দিয়েছেন বা টাকা ফেরত পাঠিয়েছেন তার পাকা রেকর্ড।',
        tasksEn: [
          'Inspect immutable event log of all admin modifications and overrides',
          'Filter activities by specific staff member, order number, or date range',
          'Trace exact before-and-after values for price or stock adjustments',
          'Export cryptographically verifiable logs for internal security audits'
        ],
        tasksBn: [
          'সিস্টেমে হওয়া প্রতিটি কাজের অপরিবর্তনীয় হিস্ট্রি ও টাইমস্ট্যাম্প দেখা',
          'নির্দিষ্ট স্টাফ সদস্য বা অর্ডার নম্বর দিয়ে কাজের রেকর্ড ফিল্টার করা',
          'দাম বা স্টক পরিবর্তনের পূর্বে ও পরের সঠিক মান যাচাই করা',
          'নিরাপত্তা অডিটের জন্য অফিসিয়াল অ্যাক্টিভিটি রিপোর্ট ডাউনলোড করা'
        ]
      },
      {
        id: 'admin-nav-backup',
        sectionId: 'system-administration',
        label: 'Database Backup',
        labelBn: 'ডাটাবেজ ব্যাকআপ ও রিস্টোর',
        path: '/admin/backup',
        icon: Database,
        role: 'Super Admin, System Engineer',
        roleBn: 'সুপার অ্যাডমিন, সিস্টেম ইঞ্জিনিয়ার',
        tagline: 'Automated snapshots, full database JSON/SQL exports, point-in-time disaster recovery, and data health verification',
        taglineBn: 'স্বয়ংক্রিয় ব্যাকআপ স্ন্যাপশট, সম্পূর্ণ ডাটাবেজ এক্সপোর্ট ও যেকোনো সময়ে ডাটা রিস্টোর করার সুবিধা',
        description: 'Safeguard your entire business against data loss. Trigger on-demand complete database snapshots, download encrypted offline backups of orders/inventory/customers, and test restore health.',
        descriptionBn: 'ব্যবসার সকল ডাটা চিরতরে সুরক্ষিত রাখতে ব্যাকআপ ব্যবস্থা। এক ক্লিকে সম্পূর্ণ ডাটাবেজ ডাউনলোড, স্বয়ংক্রিয় ক্লাউড স্ন্যাপশট এবং জরুরি প্রয়োজনে ব্যাকআপ থেকে ডাটা ফিরিয়ে আনা।',
        tasksEn: [
          'Generate instant on-demand snapshots of all store databases',
          'Download secure JSON/SQL backup files for safe offline storage',
          'Verify cryptographic checksums to confirm database integrity',
          'Test disaster recovery procedures to ensure business continuity'
        ],
        tasksBn: [
          'যেকোনো সময় তাৎক্ষণিক সম্পূর্ণ ডাটাবেজের ব্যাকআপ ফাইল তৈরি করা',
          'নিরাপদে কম্পিউটার বা ড্রাইভে রাখার জন্য ব্যাকআপ ফাইল ডাউনলোড করা',
          'ডাটাবেজের ব্যাকআপ ফাইল অক্ষত ও সুস্থ রয়েছে কিনা তা চেক করা',
          'জরুরি পরিস্থিতিতে আগের যেকোনো ব্যাকআপ থেকে ডাটা ফিরিয়ে আনার ব্যবস্থা'
        ]
      }
    ]
  }
];

export function getSectionBadgeCount(
  badgeKey: 'pendingOrders' | 'lowStock' | 'fraudAlerts' | undefined,
  counts: { pendingOrders: number; lowStock: number; fraudAlerts: number }
): { count: number; label: string; labelBn: string; color: string } | null {
  if (!badgeKey) return null;

  if (badgeKey === 'pendingOrders' && counts.pendingOrders > 0) {
    return {
      count: counts.pendingOrders,
      label: `${counts.pendingOrders} pending`,
      labelBn: `${counts.pendingOrders}টি পেন্ডিং`,
      color: 'bg-teal-700 text-white'
    };
  }

  if (badgeKey === 'lowStock' && counts.lowStock > 0) {
    return {
      count: counts.lowStock,
      label: `${counts.lowStock} low`,
      labelBn: `${counts.lowStock}টি ঘাটতি`,
      color: 'bg-amber-700 text-white'
    };
  }

  if (badgeKey === 'fraudAlerts' && counts.fraudAlerts > 0) {
    return {
      count: counts.fraudAlerts,
      label: `${counts.fraudAlerts} alert`,
      labelBn: `${counts.fraudAlerts}টি অ্যালার্ট`,
      color: 'bg-rose-700 text-white'
    };
  }

  return null;
}
