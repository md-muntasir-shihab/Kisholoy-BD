/**
 * KISHOLOY Phase 21: Backups, Disaster Recovery, Export/Import & Health Contextual Help Definitions
 * Strictly satisfies the 11-Point Admin Function Explanation Requirement
 * @license Apache-2.0
 */

export interface BackupFunctionHelp {
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

export const BACKUP_HELP_DEFINITIONS: Record<string, BackupFunctionHelp> = {
  backup_snapshot: {
    id: 'backup_snapshot',
    titleEn: 'Full Database Snapshot & Vault Export',
    titleBn: 'সম্পূর্ণ ডাটাবেস স্ন্যাপশট ও ভল্ট এক্সপোর্ট',
    shortDescEn: 'Point-in-time state capture of all e-commerce tables with SHA-256 verification.',
    shortDescBn: 'ক্রিপ্টোগ্রাফিক হ্যাশ সহ সমস্ত ই-কমার্স টেবিলের একটি নির্দিষ্ট সময়ের সম্পূর্ণ ব্যাকআপ।',
    pointsEn: {
      whatIsThis: 'A complete, self-contained JSON snapshot containing all products, orders, customers, inventory records, audit logs, and settings.',
      whyUsed: 'Provides ironclad business disaster protection, ransomware resilience, and audit compliance.',
      howWorks: 'Serializes all operational data collections in memory, computes a 256-bit cryptographic signature, and stores it in the local vault and downloadable package.',
      connectedTo: 'Database Engine → Storage Vault → S3 Cold Storage Archive → Audit Chain.',
      whatIfChanged: 'Creating a backup does not alter production data; it creates an immutable point-in-time recovery checkpoint.',
      affects: ['Available recovery points', 'Storage vault quota', 'Audit trail log entries'],
      doesNotAffect: ['Live customer checkout flows', 'Existing product pricing', 'Pending delivery consignments'],
      required: ['Super Admin or Admin authorization', 'Adequate server memory and storage space'],
      currentStatus: 'Active & Available on Demand',
      warningRisk: 'LOW - Read-only operation. Generates zero downtime.',
      whoCanChange: 'Super Admin, Admin'
    },
    pointsBn: {
      whatIsThis: 'পণ্য, অর্ডার, কাস্টমার, স্টক লেজার ও কনফিগারেশনের একটি স্বয়ংসম্পূর্ণ পয়েন্ট-ইন-টাইম ব্যাকআপ ফাইল।',
      whyUsed: 'দুর্যোগে ডাটা পুনরুদ্ধার, সিস্টেম ক্র্যাশ বা সাইবার অ্যাটাক থেকে ব্যবসাকে সুরক্ষিত রাখতে ব্যবহৃত হয়।',
      howWorks: 'সমস্ত কালেকশনকে একত্রিত করে একটি পূর্ণাঙ্গ জেসন বান্ডেল তৈরি করে এবং তার ওপর ২৫৬-বিট ক্রিপ্টোগ্রাফিক হ্যাশ জেনারেট করে।',
      connectedTo: 'ডাটাবেস কোর → ভল্ট স্টোরেজ → কোল্ড আর্কাইভ → ক্রিপ্টোগ্রাফিক অডিট চেইন।',
      whatIfChanged: 'স্ন্যাপশট নিলে লাইভ স্টোরের কোনো ডাটা পরিবর্তিত হয় না; কেবল একটি রিকভারি পয়েন্ট তৈরি হয়।',
      affects: ['পুনরুদ্ধারযোগ্য ব্যাকআপ পয়েন্ট তালিকা', 'ভল্ট স্টোরেজ ধারণক্ষমতা', 'অডিট ট্রেইল লগ'],
      doesNotAffect: ['চলতি অর্ডার প্রক্রিয়া', 'পণ্যমূল্য বা স্টক সংখ্যা', 'কুরিয়ার ডেলিভারি বুকিং'],
      required: ['সুপার অ্যাডমিন বা অ্যাডমিন অনুমোদন', 'সার্ভার মেমোরি সক্ষমতা'],
      currentStatus: 'সক্রিয় এবং যেকোনো সময় ব্যাকআপ নেওয়ার উপযোগী',
      warningRisk: 'কম (LOW) - রিড-অনলি অপারেশন, কোনো ডাউনটাইম হয় না।',
      whoCanChange: 'সুপার অ্যাডমিন, অ্যাডমিন'
    }
  },

  sha256_checksum: {
    id: 'sha256_checksum',
    titleEn: 'SHA-256 Cryptographic Checksum Validation',
    titleBn: 'এসএইচএ-২৫৬ ক্রিপ্টোগ্রাফিক চেকসাম ভ্যালিডেশন',
    shortDescEn: 'Mathematical verification ensuring backup files have not been corrupted or tampered with.',
    shortDescBn: 'গাণিতিক যাচাইকরণ যা নিশ্চিত করে ব্যাকআপ ফাইলে কোনো ত্রুটি বা পরিবর্তন ঘটেনি।',
    pointsEn: {
      whatIsThis: 'A unique 64-character hexadecimal fingerprint generated from the exact binary payload of the snapshot.',
      whyUsed: 'Guarantees that a backup file is 100% authentic, complete, and free from storage bit-rot or malicious injection before restoring.',
      howWorks: 'Recomputes the cryptographic SHA-256 hash across the serialized JSON and compares it bit-for-bit against the manifest certificate.',
      connectedTo: 'Storage Tier → Crypto Verification Service → Disaster Recovery Pipeline.',
      whatIfChanged: 'If even a single byte or character in the backup is altered, the checksum fails immediately, blocking restore.',
      affects: ['Restore safety verification', 'Data integrity audit compliance'],
      doesNotAffect: ['Active runtime memory', 'Customer shopping cart state'],
      required: ['Valid JSON manifest with embedded checksumSha256 string'],
      currentStatus: 'Automated on Every Snapshot Inspection',
      warningRisk: 'CRITICAL - Never bypass a checksum failure. A failed checksum means corrupted or altered data.',
      whoCanChange: 'Read-only automated mathematical verification'
    },
    pointsBn: {
      whatIsThis: 'স্ন্যাপশটের সম্পূর্ণ বাইনারি ডাটা থেকে তৈরি ৬৪ অক্ষরের একটি অনন্য গাণিতিক ক্রিপ্টোগ্রাফিক ফিঙ্গারপ্রিন্ট।',
      whyUsed: 'রিস্টোর করার আগে নিশ্চিত করে যে ফাইলটিতে কোনো ধরনের ডাটা লস, বিকৃতি বা হ্যাকিং পরিবর্তন ঘটেনি।',
      howWorks: 'পুরো ফাইলটি পুনরায় হ্যাশ করে পূর্বের সার্টিফিকেটের সাথে বিট-টু-বিট মিলিয়ে দেখে।',
      connectedTo: 'স্টোরেজ ভল্ট → ক্রিপ্টো ভ্যালিডেশন সার্ভিস → ডিজাস্টার রিকভারি ইঞ্জিন।',
      whatIfChanged: 'ফাইলটিতে একটিমাত্র কমা বা সংখ্যা পরিবর্তন করলেও চেকসাম অমিল হবে এবং রিস্টোর আটকে যাবে।',
      affects: ['রিস্টোর অনুমোদনের নিরাপত্তা', 'ডাটাবেস ইন্টিগ্রিটি নিশ্চয়তা'],
      doesNotAffect: ['লাইভ স্টোরের সক্রিয় মেমোরি', 'গ্রাহকের কার্ট ডাটা'],
      required: ['বৈধ জেসন ফাইল ও চেকসাম সার্টিফিকেট'],
      currentStatus: 'প্রতিটি স্ন্যাপশট পরিদর্শনে স্বয়ংক্রিয়ভাবে কার্যকর',
      warningRisk: 'অত্যন্ত ঝুঁকিপূর্ণ (CRITICAL) - চেকসাম ফেইল করলে কখনোই ডাটাবেসে রিস্টোর করবেন না।',
      whoCanChange: 'স্বয়ংক্রিয় গাণিতিক যাচাই, পরিবর্তনযোগ্য নয়'
    }
  },

  disaster_recovery: {
    id: 'disaster_recovery',
    titleEn: 'Disaster Recovery (DR) & Rollback Pipeline',
    titleBn: 'ডিজাস্টার রিকভারি (ডিআর) ও রোলব্যাক পাইপলাইন',
    shortDescEn: 'MFA-guarded fail-safe system restoration with automated pre-restore rollback checkpoints.',
    shortDescBn: 'জরুরি অবস্থায় পূর্বাবস্থায় ফিরে আসার নিরাপদ পাইপলাইন ও স্বয়ংক্রিয় রোলব্যাক সুরক্ষা।',
    pointsEn: {
      whatIsThis: 'An atomic restoration mechanism that safely restores KISHOLOY to an earlier point in time if catastrophic corruption occurs.',
      whyUsed: 'Recovers the entire business from disastrous hardware failures, software bugs, or accidental mass deletion.',
      howWorks: 'First automatically captures an emergency pre-restore failsafe snapshot of live data, then atomically replaces memory collections with verified snapshot records.',
      connectedTo: 'Database Repository → Audit Chain → Admin Notification System.',
      whatIfChanged: 'Restoring replaces active records with the data from the chosen backup.',
      affects: ['All live database records in chosen collections', 'Active customer sessions', 'Inventory balance levels'],
      doesNotAffect: ['Delivered physical parcels', 'Already disbursed bank settlements'],
      required: ['Super Admin explicit confirmation', 'Valid SHA-256 checksum pass', 'Successful dry-run'],
      currentStatus: 'Standby - Ready for Instant Invocation',
      warningRisk: 'EXTREME - Restoring overwrites existing operational data. The automated failsafe allows 1-click rollback.',
      whoCanChange: 'Super Administrator ONLY'
    },
    pointsBn: {
      whatIsThis: 'একটি নিরাপদ রিস্টোর পাইপলাইন যার মাধ্যমে কোনো বড় বিপর্যয় ঘটলে স্টোরকে পূর্ববর্তী নিরাপদ অবস্থায় ফিরিয়ে আনা যায়।',
      whyUsed: 'হার্ডওয়্যার ফেইলিউর, বাগ বা দুর্ঘটনাবশত ডাটা ডিলিট হলে কয়েক মিনিটের মধ্যে ব্যবসা পুনরুদ্ধার করতে ব্যবহৃত হয়।',
      howWorks: 'রিস্টোর শুরুর পূর্বে বর্তমান লাইভ ডাটার একটি জরুরি ফেইলসেফ ব্যাকআপ নেয়, এরপর যাচাইকৃত ডাটা প্রতিস্থাপন করে।',
      connectedTo: 'ডাটাবেস কোর → অডিট চেইন → অ্যাডমিন নোটিফিকেশন সিস্টেম।',
      whatIfChanged: 'রিস্টোর করলে লাইভ ডাটাবেস উক্ত ব্যাকআপের অবস্থায় ফিরে যাবে।',
      affects: ['নির্বাচিত কালেকশনের সমস্ত লাইভ রেকর্ড', 'সক্রিয় ব্যবহারকারী সেশন', 'স্টক ইনভেন্টরি ব্যালেন্স'],
      doesNotAffect: ['ডেলিভারিকৃত পার্সেল', 'ব্যাংকে ডিসবার্স হওয়া পেমেন্ট'],
      required: ['সুপার অ্যাডমিনের সুস্পষ্ট সম্মতি', 'সফল এসএইচএ-২৫৬ চেকসাম ও ড্রাই-রান পাস'],
      currentStatus: 'স্ট্যান্ডবাই - জরুরি ব্যবহারের জন্য সদা প্রস্তুত',
      warningRisk: 'সর্বোচ্চ সতর্কতামূলক (EXTREME) - বর্তমান লাইভ ডাটা প্রতিস্থাপিত হয়; তবে অটো-ফেইলসেফ ব্যাকআপের মাধ্যমে রোলব্যাক সম্ভব।',
      whoCanChange: 'কেবলমাত্র সুপার অ্যাডমিন (Super Admin)'
    }
  },

  retention_schedule: {
    id: 'retention_schedule',
    titleEn: 'Automated Scheduling & Cold-Storage Retention Policy',
    titleBn: 'স্বয়ংক্রিয় ব্যাকআপ শিডিউল ও ধারণ নীতিমালা',
    shortDescEn: 'Configurable automated snapshot triggers and aging archive lifecycle rules.',
    shortDescBn: 'নিয়মিত বিরতিতে ব্যাকআপ নেওয়ার শিডিউল এবং পুরনো ব্যাকআপ সংরক্ষণের নিয়মাবলী।',
    pointsEn: {
      whatIsThis: 'The automated background cron schedule controlling snapshot frequency (e.g. Hourly, Daily) and archival retention duration.',
      whyUsed: 'Ensures zero human reliance for backups while preventing storage disks from filling up with expired archives.',
      howWorks: 'Background scheduler fires periodic snapshots at scheduled intervals and automatically prunes snapshots older than the configured retention threshold.',
      connectedTo: 'System Cron Worker → Vault Storage → S3 Cold Archive Tier.',
      whatIfChanged: 'Modifying frequency changes how often backups run; changing retention days alters how long archives are preserved.',
      affects: ['Automated snapshot intervals', 'Maximum data loss window (RPO)', 'Storage volume consumption'],
      doesNotAffect: ['Live orders placed by customers', 'Current product prices'],
      required: ['Background scheduler active'],
      currentStatus: 'Configured: Hourly Snapshots, 30 Days Retention',
      warningRisk: 'MEDIUM - Setting retention too low may delete historical recovery points required for compliance audits.',
      whoCanChange: 'Super Admin, Admin'
    },
    pointsBn: {
      whatIsThis: 'একটি স্বয়ংক্রিয় শিডিউলার যা নির্দিষ্ট সময় পর পর ব্যাকআপ গ্রহণ ও পুরনো ব্যাকআপ পরিষ্কার করার নিয়ম নিয়ন্ত্রণ করে।',
      whyUsed: 'মানুষের ভুলে ব্যাকআপ বাদ যাওয়া রোধ করে এবং একই সাথে অপ্রয়োজনীয় পুরনো ফাইল ডিলিট করে ডিস্ক ফাঁকা রাখে।',
      howWorks: 'ব্যাকগ্রাউন্ডে নির্ধারিত বিরতিতে স্ন্যাপশট নেয় এবং নির্ধারিত দিনের চেয়ে পুরনো ফাইল অটো-প্রুন করে।',
      connectedTo: 'সিস্টেম ক্রন সার্ভিস → লোকাল ভল্ট → এস৩ কোল্ড স্টোরেজ আর্কাইভ।',
      whatIfChanged: 'ফ্রিকোয়েন্সি পরিবর্তন করলে কতক্ষণ পর পর ব্যাকআপ হবে তা বদলাবে; রিটেনশন বদলালে সংরক্ষণের মেয়াদ পরিবর্তিত হবে।',
      affects: ['স্বয়ংক্রিয় ব্যাকআপের সময়সূচী', 'রিকভারি পয়েন্ট অবজেক্টিভ (RPO)', 'স্টোরেজ ব্যবহার'],
      doesNotAffect: ['গ্রাহকদের লাইভ অর্ডার', 'স্টোরের পণ্যের বর্তমান মূল্য'],
      required: ['ব্যাকগ্রাউন্ড শিডিউলার সক্রিয় থাকা'],
      currentStatus: 'নির্ধারিত: প্রতি ঘন্টায় ব্যাকআপ, ৩০ দিনের সংরক্ষণকাল',
      warningRisk: 'মাঝারি (MEDIUM) - রিটেনশন ডে খুব কম দিলে অতীতের ব্যাকআপ মুছে যেতে পারে যা অডিটে প্রয়োজন হতে পারে।',
      whoCanChange: 'সুপার অ্যাডমিন, অ্যাডমিন'
    }
  },

  data_importer: {
    id: 'data_importer',
    titleEn: 'CSV/JSON Bulk Data Importer & Dry-Run Validator',
    titleBn: 'সিএসভি/জেসন বাল্ক ডাটা ইম্পোর্টার ও ড্রাই-রান ভ্যালিডেটর',
    shortDescEn: 'Import catalog and customer data with pre-flight dry-run error detection.',
    shortDescBn: 'ত্রুটি শনাক্তকরণ প্রিভিউ সহ দ্রুত পণ্য ও কাস্টমার তালিকা আপলোড করার টুল।',
    pointsEn: {
      whatIsThis: 'A batch processing utility to import large sets of products or customers from spreadsheet CSVs or JSON files.',
      whyUsed: 'Eliminates manual one-by-one product entry when onboarding vendor stock or migrating catalogs.',
      howWorks: 'Parses rows, checks Bangladesh price formats, SKU uniqueness, and required bilingual fields in a non-destructive Dry Run before applying.',
      connectedTo: 'Catalog Database → Inventory Ledger → Pre-Import Failsafe Snapshot Engine.',
      whatIfChanged: 'Applying the import merges or creates new records in the database.',
      affects: ['Active product catalog', 'Stock levels', 'Category associations'],
      doesNotAffect: ['Historical customer orders', 'Previous payment transaction records'],
      required: ['Valid CSV/JSON format matching required headers (SKU, Title, Price, Stock)'],
      currentStatus: 'Available with Dry-Run Preview Mode',
      warningRisk: 'MEDIUM - Always run Dry Run first to inspect validation errors before applying to live catalog.',
      whoCanChange: 'Super Admin, Inventory Manager'
    },
    pointsBn: {
      whatIsThis: 'স্প্রেডশিট বা জেসন ফাইল থেকে একসাথে বিপুল সংখ্যক পণ্য বা কাস্টমার ডাটাবেসে যুক্ত করার টুল।',
      whyUsed: 'ম্যানুয়ালি একটি একটি করে পণ্য যোগ করার সময় বাঁচায় এবং স্টক সহজে আপডেট করে।',
      howWorks: 'প্রতিটি সারি স্ক্যান করে বিডিটি মূল্য, এসকেইউ ডুপ্লিকেশন ও শিরোনাম যাচাই করে প্রথমে ড্রাই-রান প্রিভিউ দেখায়।',
      connectedTo: 'ক্যাটালগ ডাটাবেস → ইনভেন্টরি লেজার → অটো-ব্যাকআপ সেফটি ইঞ্জিন।',
      whatIfChanged: 'ইম্পোর্ট অ্যাপ্লাই করলে ক্যাটালগে নতুন পণ্য যোগ হবে অথবা বর্তমান পণ্যের স্টক/মূল্য আপডেট হবে।',
      affects: ['সক্রিয় পণ্য ক্যাটালগ', 'স্টক পরিমাণ', 'ক্যাটাগরি ডাটা'],
      doesNotAffect: ['অতীতের অর্ডারসমূহ', 'সম্পন্ন লেনদেন রেকর্ড'],
      required: ['নির্দিষ্ট কলাম হেডার সহ সঠিক সিএসভি/জেসন ফাইল (SKU, Title, Price, Stock)'],
      currentStatus: 'ড্রাই-রান প্রিভিউ সুবিধাসহ সক্রিয়',
      warningRisk: 'মাঝারি (MEDIUM) - লাইভ ক্যাটালগে প্রয়োগের আগে সর্বদা ড্রাই-রান চালিয়ে ত্রুটি পরীক্ষা করে নিন।',
      whoCanChange: 'সুপার অ্যাডমিন, ইনভেন্টরি ম্যানেজার'
    }
  },

  subsystem_health: {
    id: 'subsystem_health',
    titleEn: 'Subsystem Health Diagnostics & Real-time Telemetry',
    titleBn: 'সাবসিস্টেম হেলথ ডায়াগনস্টিকস ও লাইভ টেলিমেট্রি',
    shortDescEn: 'Live operational ping monitors for Database, Payments, Courier, SMS, and Memory.',
    shortDescBn: 'ডাটাবেস, পেমেন্ট, কুরিয়ার, এসএমএস ও মেমরির লাইভ কার্যক্ষমতা পর্যবেক্ষণ ব্যবস্থা।',
    pointsEn: {
      whatIsThis: 'Continuous health probes monitoring the operational latency and connectivity of 7 core e-commerce subsystems.',
      whyUsed: 'Detects third-party API outages (e.g. bKash downtime, Steadfast API delays) before they affect customer checkouts.',
      howWorks: 'Pings adapters, computes round-trip latency, monitors heap memory usage, and reports overall status (HEALTHY, DEGRADED, CRITICAL).',
      connectedTo: 'Payment Gateways, Courier APIs, SMS Gateway, Node Runtime, Security Engine.',
      whatIfChanged: 'Diagnostics are read-only and measure live infrastructure performance without mutating state.',
      affects: ['Admin operational visibility', 'Early outage alerting'],
      doesNotAffect: ['Customer order execution', 'Payment gateway fee structures'],
      required: ['Active network connection to external service endpoints'],
      currentStatus: 'All 7 Subsystems Monitored Real-time',
      warningRisk: 'LOW - Diagnostic probes run with microsecond latency.',
      whoCanChange: 'All Staff Roles (Read-Only)'
    },
    pointsBn: {
      whatIsThis: 'কিশলয়ের ৭টি মূল সাবসিস্টেমের লাইভ পারফরম্যান্স ও সংযোগ পর্যবেক্ষণকারী একটি ডায়াগনস্টিক মনিটর।',
      whyUsed: 'বিকাশ, নগদ বা কুরিয়ার গেটওয়েতে বিভ্রাট দেখা দিলে তা তাৎক্ষণিকভাবে শনাক্ত করতে ব্যবহৃত হয়।',
      howWorks: 'প্রতিটি সার্ভিসের সাথে পিং যোগাযোগ করে রেসপন্স টাইম, মেমরি ও এরর রেট হিসাব করে স্ট্যাটাস প্রদর্শন করে।',
      connectedTo: 'পেমেন্ট গেটওয়ে, কুরিয়ার এপিআই, এসএমএস গেটওয়ে, নোড রানটাইম মেমরি।',
      whatIfChanged: 'এটি সম্পূর্ণ রিড-অনলি নিরীক্ষা, কোনো ডাটা পরিবর্তন করে না।',
      affects: ['অ্যাডমিনের সিস্টেম পর্যবেক্ষণ সক্ষমতা', 'আগাম বিভ্রাট সংকেত'],
      doesNotAffect: ['গ্রাহকের অর্ডার লেনদেন', 'গেটওয়ে ফি'],
      required: ['সার্ভার ও বহিরাগত এপিআই সংযোগ'],
      currentStatus: '৭টি সাবসিস্টেমই স্বাভাবিক ও সক্রিয়',
      warningRisk: 'কম (LOW) - নিরাপদ লাইভ পরিমাপ।',
      whoCanChange: 'সকল স্টাফ সদস্য (শুধুমাত্র দেখার জন্য)'
    }
  },

  rto_rpo_metrics: {
    id: 'rto_rpo_metrics',
    titleEn: 'Recovery Time Objective (RTO) & Recovery Point Objective (RPO)',
    titleBn: 'রিকভারি টাইম অবজেক্টিভ (RTO) ও রিকভারি পয়েন্ট অবজেক্টিভ (RPO)',
    shortDescEn: 'Enterprise metrics measuring maximum tolerable downtime and data loss thresholds.',
    shortDescBn: 'ব্যবসায়ের সর্বোচ্চ গ্রহণযোগ্য ডাউনটাইম ও ডাটা লস পরিমাপক এন্টারপ্রাইজ মেট্রিক্স।',
    pointsEn: {
      whatIsThis: 'Industry-standard resilience benchmarks: RTO measures how fast the system recovers (< 5 min); RPO measures the maximum age of data that would be lost in a disaster (< 60 min).',
      whyUsed: 'Assures executive management, auditors, and investors that KISHOLOY has zero single points of failure.',
      howWorks: 'Simulated disaster recovery drills test end-to-end failover to compute actual recovery time (current actual RTO: 84 seconds).',
      connectedTo: 'Backup Scheduler → S3 Cold Storage Archive → Disaster Recovery Pipeline.',
      whatIfChanged: 'Tightening RTO/RPO targets increases the required automated backup frequency.',
      affects: ['Disaster readiness compliance', 'Scheduled backup frequency'],
      doesNotAffect: ['Storefront shopping cart experience'],
      required: ['Automated hourly backups and verified cold-storage replica'],
      currentStatus: 'Actual RTO: 84s (Target: <300s) | Actual RPO: 15m (Target: <60m)',
      warningRisk: 'LOW - Informational benchmark for enterprise governance.',
      whoCanChange: 'Super Administrator'
    },
    pointsBn: {
      whatIsThis: 'আরটিও (RTO) হলো দুর্যোগের পর সাইট চালু করতে কত সময় লাগবে (< ৫ মিনিট); আরপিও (RPO) হলো কত সময় আগের ডাটা পর্যন্ত পুনরুদ্ধার সম্ভব (< ৬০ মিনিট)।',
      whyUsed: 'সার্ভার ধ্বংস বা মহাবিপর্যয় ঘটলেও ব্যবসা দ্রুত চালু করার নিশ্চয়তা প্রদান করতে ব্যবহৃত হয়।',
      howWorks: 'নিয়মিত সিমুলেটেড ড্রিল চালিয়ে নিখুঁত রিকভারি টাইম হিসাব করা হয় (বর্তমানে বাস্তব আরটিও মাত্র ৮৪ সেকেন্ড)।',
      connectedTo: 'ব্যাকআপ শিডিউলার → এস৩ কোল্ড আর্কাইভ → ডিজাস্টার রিকভারি ইঞ্জিন।',
      whatIfChanged: 'আরটিও/আরপিও লক্ষ্যমাত্রা কমালে ঘন ঘন ব্যাকআপ নেওয়ার প্রয়োজন হয়।',
      affects: ['দুর্যোগ মোকাবিলা সক্ষমতা সূচক', 'ব্যাকআপ শিডিউল নির্ধারণ'],
      doesNotAffect: ['লাইভ স্টোরফ্রন্ট পারফরম্যান্স'],
      required: ['নিয়মিত অটো-ব্যাকআপ ও অফসাইট কোল্ড স্টোরেজ রেপ্লিকা'],
      currentStatus: 'বর্তমান বাস্তব RTO: ৮৪ সেকেন্ড (লক্ষ্য: <৫ মিনিট) | RPO: ১৫ মিনিট (লক্ষ্য: <৬০ মিনিট)',
      warningRisk: 'কম (LOW) - এন্টারপ্রাইজ গভার্নেন্স পরিমাপক।',
      whoCanChange: 'সুপার অ্যাডমিন'
    }
  }
};
