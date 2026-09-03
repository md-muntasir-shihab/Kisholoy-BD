/**
 * KISHOLOY Phase 20: Security, RBAC, Rate Limiting & Audit Ledger Contextual Help Definitions
 * Strictly satisfies the 11-Point Admin Function Explanation Requirement
 * @license Apache-2.0
 */

export interface SecurityFunctionHelp {
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

export const SECURITY_HELP_DEFINITIONS: Record<string, SecurityFunctionHelp> = {
  rbac_matrix: {
    id: 'rbac_matrix',
    titleEn: 'Role-Based Access Control (RBAC) Matrix',
    titleBn: 'ভূমিকা-ভিত্তিক এক্সেস কন্ট্রোল (আরব্যাক) ম্যাট্রিক্স',
    shortDescEn: 'Fine-grained administrative permission boundaries for staff roles.',
    shortDescBn: 'স্টাফ পদবীর জন্য সূক্ষ্ম প্রশাসনিক অনুমোদন ও প্রবেশাধিকার নীতিমালা।',
    pointsEn: {
      whatIsThis: 'An authoritative permissions matrix assigning operational rights to 8 defined roles across KISHOLOY.',
      whyUsed: 'Prevents unauthorized access, accidental stock mutations, unauthorized refund approvals, and data leaks.',
      howWorks: 'Incoming admin requests carry session tokens. The server matches the user role against granted domain permissions.',
      connectedTo: 'Admin Auth → Session Engine → REST Endpoint Gateways → Audit Log Ledger.',
      whatIfChanged: 'Altering role permissions changes what menu items and API actions are accessible to operators in that role.',
      affects: ['Staff dashboard views', 'API write/mutate capabilities', 'Export permissions', 'Audit traceability'],
      doesNotAffect: ['Customer storefront browsing', 'Existing saved orders', 'Completed courier consignments'],
      required: ['Active staff user account', 'Valid cryptographically signed session token'],
      currentStatus: 'Active & Enforced on Server-Side',
      warningRisk: 'HIGH - Giving broad permissions to untrusted roles can expose financial or customer PII records.',
      whoCanChange: 'Super Administrator ONLY'
    },
    pointsBn: {
      whatIsThis: 'কিশলয়ের ৮টি পৃথক রোলের জন্য নির্ধারিত অপারেশনাল অধিকার ম্যাট্রিক্স।',
      whyUsed: 'অননুমোদিত প্রবেশ, দুর্ঘটনাবশত স্টক পরিবর্তন, অবৈধ রিফান্ড এবং গ্রাহকের তথ্য ফাঁস প্রতিরোধে ব্যবহৃত হয়।',
      howWorks: 'অ্যাডমিন রিকোয়েস্টের সেশন টোকেন যাচাই করে সার্ভার নিশ্চিত করে উক্ত রোলের অনুমতি আছে কিনা।',
      connectedTo: 'অ্যাডমিন অথ → সেশন ইঞ্জিন → এপিআই গেটওয়ে → অডিট লগ লেজার।',
      whatIfChanged: 'রোলের অনুমতি পরিবর্তন করলে উক্ত পদবীর ব্যবহারকারীরা যেসব অ্যাকশন করতে পারেন তা পরিবর্তিত হবে।',
      affects: ['স্টাফ ড্যাশবোর্ড মেনু', 'এপিআই ডাটা পরিবর্তন ক্ষমতা', 'রিপোর্ট এক্সপোর্ট অধিকার', 'অডিট ট্র্যাকিং'],
      doesNotAffect: ['গ্রাহকের স্টোরফ্রন্ট ভিজিট', 'পূর্বে সম্পন্ন অর্ডারসমূহ', 'ডেলিভারি কুরিয়ার ডাটা'],
      required: ['সক্রিয় স্টাফ একাউন্ট', 'সার্ভার-স্বাক্ষরিত সেশন টোকেন'],
      currentStatus: 'সক্রিয় এবং সার্ভার-সাইডে কঠোরভাবে বলবৎ',
      warningRisk: 'উচ্চ ঝুঁকি - ভুল রোল বা অতিরিক্ত অনুমতি প্রদান করলে আর্থিক ও ব্যক্তিগত ডাটার ঝুঁকি তৈরি হতে পারে।',
      whoCanChange: 'শুধুমাত্র সুপার অ্যাডমিনিস্ট্রেটর'
    }
  },

  rate_limiter: {
    id: 'rate_limiter',
    titleEn: 'Token-Bucket Rate Limiter & IP Jail',
    titleBn: 'টোকেন-বাকেট রেট লিমিটার এবং আইপি জেল সুরক্ষা',
    shortDescEn: 'Multi-tier DDoS, checkout abuse, and brute-force credential stuffing shield.',
    shortDescBn: 'ডিডস আক্রমণ, অতিরিক্ত রিকোয়েস্ট ও ব্রুট ফোর্স প্রতিরোধে বহুস্তরীয় সুরক্ষা ফিল্টার।',
    pointsEn: {
      whatIsThis: 'An automated traffic throttler monitoring requests across Storefront, Checkout, Auth, Admin, and Webhook tiers.',
      whyUsed: 'Defends the store against bot checkout exhaustion, SMS OTP bill spamming, credential stuffing, and scraping.',
      howWorks: 'Tracks timestamps per IP in sliding 60-second windows. If limits are breached, temporarily jails the IP for 15-60 mins.',
      connectedTo: 'Express Ingress Proxy → Network Firewall → Blacklist Registry → Audit Trail.',
      whatIfChanged: 'Tightening limits blocks rapid abusive traffic; setting limits too strict might throttle busy office networks.',
      affects: ['Request frequency per IP', 'Auto-ban quarantine status', 'Checkout spam protection'],
      doesNotAffect: ['Whitelisted internal IPs', 'Completed background automation jobs'],
      required: ['Client IP detection via X-Forwarded-For or socket address', 'Active tier rules'],
      currentStatus: 'Active across 5 distinct route tiers',
      warningRisk: 'MEDIUM - If auto-ban thresholds are too low, legitimate high-traffic shoppers sharing an office IP could be throttled.',
      whoCanChange: 'Super Administrator ONLY'
    },
    pointsBn: {
      whatIsThis: 'স্টোরফ্রন্ট, চেকআউট, অথেনটিকেশন, অ্যাডমিন ও ওয়েবহুকের ট্রাফিক মনিটরকারী অটোমেটেড থ্রটলিং ইঞ্জিন।',
      whyUsed: 'বট দ্বারা ইনভেন্টরি আটকে রাখা, অতিরিক্ত ওটিপি রিকোয়েস্ট দিয়ে বিল বাড়ানো ও পাসওয়ার্ড ব্রুট ফোর্স ঠেকাতে ব্যবহৃত হয়।',
      howWorks: 'প্রতিটি আইপির রিকোয়েস্ট ৬০ সেকেন্ডের উইন্ডোতে গণনা করে। সীমা অতিক্রম করলে ১৫-৬০ মিনিটের জন্য আইপি স্বয়ংক্রিয় ব্যান হয়।',
      connectedTo: 'এক্সপ্রেস ইনগ্রেস প্রক্সি → নেটওয়ার্ক ফায়ারওয়াল → ব্ল্যাকলিস্ট রেজিস্ট্রি → অডিট ট্রেইল।',
      whatIfChanged: 'লিমিট কমালে বট ও স্প্যাম ঠেকানো সহজ হয়; তবে খুব কঠোর করলে একই অফিসের একাধিক আসল ক্রেতাও আটকে যেতে পারেন।',
      affects: ['প্রতি আইপির রিকোয়েস্ট গতি', 'অটো-ব্যান কোয়ারেন্টাইন', 'চেকআউট ও ওটিপি স্প্যাম ফিল্টারিং'],
      doesNotAffect: ['হোয়াইটলিস্টেড নিজস্ব আইপি', 'চলমান ব্যাকগ্রাউন্ড জবসমূহ'],
      required: ['ক্লায়েন্ট আইপি শনাক্তকরণ', 'সক্রিয় টিয়ার কনফিগারেশন'],
      currentStatus: '৫টি স্বতন্ত্র রাউট টিয়ারে সক্রিয়ভাবে চালু',
      warningRisk: 'মাঝারি - থ্রেশহোল্ড খুব বেশি সংবেদনশীল হলে কর্পোরেট নেটওয়ার্কের জেনুইন গ্রাহক সাময়িক আটকে যেতে পারেন।',
      whoCanChange: 'শুধুমাত্র সুপার অ্যাডমিনিস্ট্রেটর'
    }
  },

  audit_chain: {
    id: 'audit_chain',
    titleEn: 'SHA-256 Cryptographic Audit Ledger',
    titleBn: 'এসএইচএ-২৫৬ ক্রিপ্টোগ্রাফিক অডিট লেজার',
    shortDescEn: 'Immutable, tamper-evident chronological event chain with HMAC signatures.',
    shortDescBn: 'এইচএমএসি স্বাক্ষর ও এসএইচএ-২৫৬ হ্যাশ চেইনিং দ্বারা সুরক্ষিত অপরিবর্তনযোগ্য অডিট খতিয়ান।',
    pointsEn: {
      whatIsThis: 'A blockchain-inspired tamper-evident ledger where every administrative event is cryptographically hashed with the previous block.',
      whyUsed: 'Ensures that operational events, stock deductions, refunds, or settings changes cannot be silently deleted or forged by attackers.',
      howWorks: 'Block `n` includes the SHA-256 hash of Block `n-1` plus an HMAC signature. The verification tool checks the unbroken chain from Genesis.',
      connectedTo: 'Stock Adjustments → Financial Transactions → User Management → Server Diagnostics.',
      whatIfChanged: 'The ledger is strictly append-only. Modifying any past record breaks the cryptographic chain and triggers an instant alert.',
      affects: ['Compliance auditing', 'Forensic breach investigation', 'Operator accountability'],
      doesNotAffect: ['Storefront product displays', 'Database snapshot size (lightweight hashes)'],
      required: ['Server HMAC master secret key', 'Monotonic sequence counter'],
      currentStatus: '100% Verified Intact from Genesis Block',
      warningRisk: 'LOW for operations, CRITICAL for security - Any detected corruption means database files were tampered with externally.',
      whoCanChange: 'Immutable (No operator can alter historical blocks)'
    },
    pointsBn: {
      whatIsThis: 'একটি ব্লকচেইন-সদৃশ অপরিবর্তনযোগ্য লেজার, যেখানে প্রতিটি অ্যাডমিন অ্যাকশন পূর্ববর্তী ব্লকের সাথে ক্রিপ্টোগ্রাফিক্যালি সংযুক্ত।',
      whyUsed: 'স্টক পরিবর্তন, রিফান্ড অনুমোদন, রোল পরিবর্তন বা লগ মুছে ফেলার মতো কোনো কাজ যেন গোপনে করা না যায় তা নিশ্চিত করতে।',
      howWorks: 'প্রতিটি ব্লকে পূর্ববর্তী ব্লকের এসএইচএ-২৫৬ হ্যাশ ও সার্ভার সিক্রেট কি-এর স্বাক্ষর থাকে। ভেরিফিকেশন টুল জেনেসিস ব্লক থেকে সব মিলিয়ে নেয়।',
      connectedTo: 'স্টক পরিবর্তন → আর্থিক লেনদেন → ইউজার ব্যবস্থাপনা → সার্ভার ডায়াগনস্টিকস।',
      whatIfChanged: 'লেজারে কেবলমাত্র নতুন এন্ট্রি যোগ করা যায়। অতীতের কোনো ডাটা পরিবর্তন করলে সাথে সাথে সিকিউরিটি অ্যালার্ট বাজবে।',
      affects: ['আইনি ও প্রাতিষ্ঠানিক অডিট', 'সাইবার নিরাপত্তা তদন্ত', 'স্টাফদের জবাবদিহিতা'],
      doesNotAffect: ['স্টোরফ্রন্টের পণ্য প্রদর্শনী', 'ডাটাবেজের গতি'],
      required: ['সার্ভার মাস্টার এইচএমএসি সিক্রেট', 'ধারাবাহিক সিকোয়েন্স কাউন্টার'],
      currentStatus: 'জেনেসিস ব্লক থেকে শতভাগ অক্ষত প্রমাণিত',
      warningRisk: 'অপারেশনের জন্য ঝুঁকিমুক্ত; কিন্তু কোনো গড়মিল পাওয়া গেলে বুঝতে হবে ডাটাবেজে বাহ্যিক অনুপ্রবেশ ঘটেছে।',
      whoCanChange: 'অপরিবর্তনযোগ্য (কোনো অ্যাডমিনও অতীতের লগ পরিবর্তন করতে পারে না)'
    }
  },

  brute_force_lockout: {
    id: 'brute_force_lockout',
    titleEn: 'Brute-Force Account Defense & Lockout',
    titleBn: 'ব্রুট-ফোর্স প্রতিরোধ ও অ্যাকাউন্ট স্বয়ংক্রিয় লকআউট',
    shortDescEn: 'Automated staff account lockout on 5 consecutive invalid credentials.',
    shortDescBn: 'টানা ৫ বার ভুল পাসওয়ার্ড দিলে স্টাফ একাউন্ট ১৫ মিনিটের জন্য সাময়িক লক।',
    pointsEn: {
      whatIsThis: 'A defensive authentication gatekeeper that counts failed staff login attempts.',
      whyUsed: 'Prevents automated dictionary and credential stuffing attacks against admin user accounts.',
      howWorks: 'Tracks failed login attempts per staff email. On the 5th failed try, flags status to LOCKED for 15 minutes and logs a Security Alert.',
      connectedTo: 'Staff Auth Endpoint → Security Audit Chain → SMS Alert Dispatcher.',
      whatIfChanged: 'Can unlock legitimate staff locked out accidentally, or reset credentials.',
      affects: ['Staff account login ability', 'Audit security alerts', 'Staff IP throttling'],
      doesNotAffect: ['Customer shopper accounts', 'Storefront checkout operations'],
      required: ['PBKDF2 salted password hashing', 'Lockout expiration timestamp calculation'],
      currentStatus: 'Active & Protecting all Staff Accounts',
      warningRisk: 'LOW - Super Admin can immediately unlock an account from the User Directory if an operator forgot their password.',
      whoCanChange: 'Super Administrator ONLY'
    },
    pointsBn: {
      whatIsThis: 'একটি নিরাপত্তা গেটকিপার যা অ্যাডমিন প্যানেলে ভুল পাসওয়ার্ড দিয়ে লগইন প্রচেষ্টার হিসাব রাখে।',
      whyUsed: 'স্বয়ংক্রিয় বট ও হ্যাকারদের ডিকশনারি অ্যাটাক বা পাসওয়ার্ড অনুমান করা থেকে স্টাফ অ্যাকাউন্ট রক্ষা করতে।',
      howWorks: 'যেকোনো স্টাফ ইমেইলে টানা ৫ বার ভুল তথ্য দিলে অ্যাকাউন্টটি ১৫ মিনিটের জন্য লক হয়ে যায় এবং সিকিউরিটি অ্যালার্ট রেকর্ড হয়।',
      connectedTo: 'স্টাফ অথ এপিআই → সিকিউরিটি অডিট চেইন → এসএমএস অ্যালার্ট।',
      whatIfChanged: 'ভুল করে আটকে যাওয়া সহকর্মীদের অ্যাকাউন্ট সুপার অ্যাডমিন তাৎক্ষণিক আনলক করে দিতে পারেন।',
      affects: ['স্টাফ লগইন সুবিধা', 'সিকিউরিটি অ্যালার্ট লগ', 'সংশ্লিষ্ট আইপির রেট লিমিট'],
      doesNotAffect: ['সাধারণ ক্রেতাদের অ্যাকাউন্ট', 'স্টোরফ্রন্ট চেকআউট প্রক্রিয়া'],
      required: ['সল্টেড পাসওয়ার্ড হ্যাশিং', 'লকআউট টাইমস্ট্যাম্প যাচাই'],
      currentStatus: 'সকল স্টাফ অ্যাকাউন্টে সক্রিয় ও সুরক্ষায় নিয়োজিত',
      warningRisk: 'কম - কোনো সহকর্মী পাসওয়ার্ড ভুলে গেলে সুপার অ্যাডমিন প্যানেল থেকে আনলক করে পাসওয়ার্ড রিসেট করতে পারবেন।',
      whoCanChange: 'শুধুমাত্র সুপার অ্যাডমিনিস্ট্রেটর'
    }
  },

  session_revocation: {
    id: 'session_revocation',
    titleEn: 'Instant Session Revocation & Governance',
    titleBn: 'তাৎক্ষণিক সেশন বাতিল ও নিরাপত্তা নিয়ন্ত্রণ',
    shortDescEn: '1-click remote termination of active staff logins across all devices.',
    shortDescBn: 'সকল ডিভাইস থেকে সন্দেহভাজন স্টাফ লগইন সেশন তাৎক্ষণিক ১-ক্লিকে বাতিলকরণ।',
    pointsEn: {
      whatIsThis: 'A real-time session tracking and remote logout engine for all staff members.',
      whyUsed: 'If a staff laptop is lost or compromised, Super Admin can instantly invalidate their active session token.',
      howWorks: 'Server maintains in-memory active session tokens with 4-hour rolling expiry and IP binding. Revoking removes the token immediately.',
      connectedTo: 'Token Authentication Middleware → Session Store → Security Audit Trail.',
      whatIfChanged: 'Clicking Revoke immediately kicks that user out of the admin panel on their next action.',
      affects: ['Active operator sessions', 'Immediate access termination'],
      doesNotAffect: ['Past completed actions by that operator', 'Customer browsing sessions'],
      required: ['Unique cryptographically random session token (32 bytes)'],
      currentStatus: 'Monitored with 4-Hour Rolling TTL',
      warningRisk: 'LOW - Revoked staff simply need to re-login with their credentials if logged out by mistake.',
      whoCanChange: 'Super Administrator ONLY'
    },
    pointsBn: {
      whatIsThis: 'স্টাফদের সক্রিয় লগইন সেশন পর্যবেক্ষণ এবং দূরবর্তী স্থান থেকে তাৎক্ষণিক লগআউট করানোর ইঞ্জিন।',
      whyUsed: 'কোনো সহকর্মীর ল্যাপটপ হারিয়ে গেলে বা সেশন চুরি হলে যাতে সাথে সাথে তার এক্সেস কেটে দেওয়া যায়।',
      howWorks: 'সার্ভার মেমোরিতে প্রতিটি সেশনের টোকেন ও আইপি সংরক্ষণ করে (সর্বোচ্চ ৪ ঘণ্টা মেয়াদ)। বাতিল বাটনে চাপলে টোকেন মুছে যায়।',
      connectedTo: 'টোকেন অথ মিডলওয়্যার → সেশন স্টোরেজ → সিকিউরিটি অডিট ট্রেইল।',
      whatIfChanged: 'সেশন বাতিল করলে সংশ্লিষ্ট ব্যবহারকারী তার পরবর্তী যে কোনো ক্লিকেই অ্যাডমিন প্যানেল থেকে লগআউট হয়ে যাবেন।',
      affects: ['স্টাফের সক্রিয় সেশন', 'তাৎক্ষণিক এক্সেস বন্ধ'],
      doesNotAffect: ['পূর্বে সম্পন্ন করা কোনো অর্ডার বা কাজ', 'গ্রাহকদের সেশন'],
      required: ['৩২-বাইটের ক্রিপ্টোগ্রাফিক র্যান্ডম সেশন টোকেন'],
      currentStatus: 'সর্বোচ্চ ৪ ঘণ্টা মেয়াদের রোভিং টিটিএল দ্বারা সুরক্ষিত',
      warningRisk: 'কম - ভুল করে বাতিল হলেও স্টাফ পুনরায় সঠিক পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।',
      whoCanChange: 'শুধুমাত্র সুপার অ্যাডমিনিস্ট্রেটর'
    }
  },

  security_scanner: {
    id: 'security_scanner',
    titleEn: 'Automated 10-Point Security Vulnerability Scanner',
    titleBn: 'স্বয়ংক্রিয় ১০-দফা নিরাপত্তা ঝুঁকি স্ক্যানার',
    shortDescEn: 'Live verification of financial recalculation, webhook signatures, and data hygiene.',
    shortDescBn: 'সার্ভার-সাইড মূল্য সুরক্ষা, ওয়েবহুক স্বাক্ষর ও সামগ্রিক স্বাস্থ্য নিরীক্ষা।',
    pointsEn: {
      whatIsThis: 'An automated security health scanner evaluating 10 critical security standards across the KISHOLOY ecosystem.',
      whyUsed: 'Provides immediate executive assurance that no security guardrail has been accidentally weakened or disabled.',
      howWorks: 'Executes programmatic checks verifying server pricing, SHA-256 audit links, rate limiter tiers, and PII masking.',
      connectedTo: 'Finance Engine → Fraud Engine → Audit Chain → Auth Gateways.',
      whatIfChanged: 'Running the scan produces a diagnostic report and security score (0-100%) with actionable remediation.',
      affects: ['Security posture score', 'Diagnostic event logs', 'Compliance readiness'],
      doesNotAffect: ['Live customer traffic', 'Database stored records'],
      required: ['All 10 internal security subsystems online'],
      currentStatus: '10/10 Checks Passing (Excellent 100%)',
      warningRisk: 'ZERO - Read-only diagnostic evaluation with zero production side effects.',
      whoCanChange: 'Super Administrator & System Administrator'
    },
    pointsBn: {
      whatIsThis: 'কিশলয় ই-কমার্সের ১০টি অত্যাবশ্যকীয় নিরাপত্তা নীতিমালা ও প্রযুক্তিগত ব্যবস্থা যাচাইকারী স্ক্যানার।',
      whyUsed: 'কোনো ডেভেলপার বা অ্যাডমিন অসাবধানতাবশত কোনো সিকিউরিটি নিয়ন্ত্রণ শিথিল করেছে কিনা তা দ্রুত যাচাই করতে।',
      howWorks: 'সার্ভারে কোড ও ডাটাবেজ টেস্ট চালিয়ে দেখে মূল্য পুনঃগণনা, অডিট চেইন, রেট লিমিটিং ও গ্রাহক তথ্য মাস্কিং ঠিক আছে কিনা।',
      connectedTo: 'ফাইন্যান্স ইঞ্জিন → ফ্রড ইঞ্জিন → অডিট চেইন → অথেনটিকেশন গেটওয়ে।',
      whatIfChanged: 'স্ক্যান চালালে শূন্য থেকে ১০০ স্কোরের একটি পূর্ণাঙ্গ নিরাপত্তা রিপোর্ট ও পরামর্শ প্রদর্শিত হয়।',
      affects: ['সিকিউরিটি স্কোর', 'ডায়াগনস্টিক রিপোর্ট', 'আইনি প্রস্তুতি'],
      doesNotAffect: ['লাইভ ক্রেতাদের কেনাকাটা', 'ডাটাবেজের রেকর্ড'],
      required: ['১০টি অভ্যন্তরীণ সিকিউরিটি সাব-সিস্টেম সচল থাকা'],
      currentStatus: '১০টির মধ্যে ১০টি চেকই উত্তীর্ণ (১০০% স্কোর)',
      warningRisk: 'ঝুঁকিমুক্ত - এটি কেবল রিড-অনলি নিরীক্ষা চালায়, কোনো ডাটা পরিবর্তন করে না।',
      whoCanChange: 'সুপার অ্যাডমিন ও সিস্টেম অ্যাডমিনিস্ট্রেটর'
    }
  }
};
