# KISHOLOY-BD — Admin Panel Full Audit & Fix Prompt
### (যেকোনো AI এজেন্টকে এই ফাইলটা দিলেই সে পুরো কাজটা ধাপে ধাপে করতে পারবে)

> **এই ফাইলটা কী:** Kisholoy-BD প্রজেক্টের অ্যাডমিন প্যানেলের **প্রতিটি সাইডবার সেকশন → প্রতিটি ট্যাব → প্রতিটি ফাংশন/বাটন** ধরে ধরে অডিট করে, "কোনটার সাথে কোনটা কানেক্টেড থাকা দরকার" সেটা যাচাই করে, ফাঁক থাকলে ফিক্স করে — এবং পুরো সাইটকে মোবাইল/ট্যাব/ডেস্কটপ-ফ্রেন্ডলি করার সম্পূর্ণ, এক্সিকিউটেবল নির্দেশনা।
>
> **এটা কীভাবে ব্যবহার করবেন:** পুরো ফাইলটা এজেন্টকে দিন এবং বলুন — *"Execute PHASE 0 through PHASE 9 in order. Do not skip. Produce every required artifact."*

---

## 0. এজেন্টের জন্য মূল নিয়ম (READ FIRST — NON-NEGOTIABLE)

1. **অডিট আগে, ফিক্স পরে।** কোনো কোড বদলানোর আগে PHASE 1–3 এর অডিট আর্টিফ্যাক্ট তৈরি করতে হবে। অডিট ছাড়া কোনো "improvement" নয়।
2. **এক সময়ে একটা ফাংশন।** প্রতিটি সেকশনের প্রতিটি ফাংশন আলাদা ইউনিট। প্রতিটির জন্য আলাদা checklist row পূরণ করতে হবে। বাল্ক-রিরাইট নিষিদ্ধ।
3. **Root cause only.** লক্ষণ ঢাকা দেওয়া (try/catch দিয়ে চুপ করানো, `any` ঢালা, ফিচার সরিয়ে ফেলা) নিষিদ্ধ।
4. **কোনো ফিচার ডিলিট নয়।** কোনো মডিউল "unused" মনে হলেও ডিলিট করা যাবে না — রিপোর্টে ফ্ল্যাগ করে ইউজারের সিদ্ধান্তের জন্য রেখে দিতে হবে।
5. **প্রতিটি ফিক্সের পর সংযুক্ত সিস্টেম রি-চেক।** উদাহরণ: অর্ডার স্ট্যাটাস বদলালে → stock ledger, finance summary, courier state, notification, audit log — সব যাচাই।
6. **প্রতি ফিক্স-ব্যাচে গেট:** `npx tsc --noEmit` = 0 error, `npm run build` সফল, dev server ওঠে, প্রভাবিত API গুলো curl-এ 2xx।
7. **Money math কখনো ক্লায়েন্টে নয়।** দাম/ডিসকাউন্ট/শিপিং/টোটাল সবসময় সার্ভার-অথরিটেটিভ।
8. **বাংলা + ইংরেজি দুটো ল্যাঙ্গুয়েজেই** নতুন/পরিবর্তিত প্রতিটি UI স্ট্রিং থাকতে হবে (`language === 'BN'` প্যাটার্ন)। কোনো হার্ডকোড ইংরেজি-only লেবেল নয়।
9. **ডার্ক মোড** প্রতিটি নতুন/পরিবর্তিত UI-তে সাপোর্টেড থাকতে হবে (`dark:` ক্লাস)।
10. **কাজ একটাই ব্রাঞ্চে**, ছোট ছোট থিমযুক্ত কমিটে। প্রতিটি কমিট মেসেজে কোন PHASE + কোন সেকশন লিখতে হবে।

---

## 1. প্রজেক্ট কনটেক্সট (এজেন্টের যা জানা দরকার)

**Stack:** React 19 + React Router 7 + Vite 6 + Tailwind 4 (frontend) · Express 4 on `tsx` (backend, `server.ts` ~4,750 লাইন) · in-memory authoritative store `server/db.ts` seeded from `src/data/mockData.ts` · Firebase (auth/firestore, partial).

**Entry points**
| জিনিস | ফাইল |
|---|---|
| Route table (storefront + admin + supplier) | `src/App.tsx` |
| Admin shell, RBAC route matrix, sidebar | `src/admin/AdminLayout.tsx` |
| Sidebar section/module metadata (4 sections, 21 modules) | `src/admin/adminModulesData.ts` |
| Global state (2,100 লাইন, সব ডোমেইন) | `src/context/AppContext.tsx` |
| API client, token, 401 gate | `src/lib/apiClient.ts` |
| BD phone canonicalization | `src/lib/phone.ts` |
| Backend, 272 routes | `server.ts` |
| Domain engines | `server/{financeEngine,paymentService,courierService,fraudEngine,supplierEngine,fulfillmentEngine,promotionEngine,marketingService,marketingCommandCenter,notificationService,securityEngine,backupEngine,queueService,reportService,webhookService,smsService}.ts` |
| Print/document engine | `src/lib/documentEngine.tsx`, `src/lib/printFormats.ts`, `src/components/print/*` |
| আগের অডিট | `AUDIT_REPORT.md` (পড়ে নিন — ওখানে ঠিক হওয়া বাগ আবার "ফিক্স" করবেন না) |

**সাইডবারের ৪টি সেকশন ও ২১টি মডিউল** (`adminModulesData.ts` অনুযায়ী):

| Section | Modules |
|---|---|
| `sales-operations` | Dashboard `/admin` · Orders `/admin/orders` · Fraud `/admin/fraud` · Shipments `/admin/shipments` · Fulfillment `/admin/fulfillment` · Returns & Refunds `/admin/returns` · Payments `/admin/payments` · Finance `/admin/finance` |
| `catalog-inventory` | Products `/admin/products` · Categories `/admin/categories` · Inventory `/admin/inventory` · Suppliers `/admin/suppliers` |
| `customer-management` | Customers `/admin/customers` · Marketing Command Center `/admin/marketing` |
| `system-administration` | Analytics `/admin/analytics` · Reports `/admin/reports` · Content CMS `/admin/content` · Settings `/admin/settings` · Users & RBAC `/admin/users` · Audit `/admin/audit` · Backup `/admin/backup` |

---

## PHASE 0 — Baseline & Safety Net

**করণীয়:**
1. `AUDIT_REPORT.md`, `docs/admin-flows.md`, `docs/state-machines.md`, `docs/information-architecture.md`, `docs/decision-log.md` পড়ুন।
2. `npm install` → `npx tsc --noEmit` → `npm run build` চালান। বেসলাইন ইরর সংখ্যা রেকর্ড করুন (এখন হওয়া উচিত **0**)।
3. `npm run dev` (0.0.0.0:3000) চালিয়ে `/api/health` হিট করুন।
4. একটি স্ক্রিপ্ট লিখুন `scripts/audit/smoke-endpoints.sh` — `server.ts` থেকে সব `app.get(...)` রুট বের করে প্রতিটিতে curl মারবে এবং status code সহ টেবিল ছাপবে। এই স্ক্রিপ্ট PHASE 8-এ আবার লাগবে।

**Artifact:** `docs/audit/PHASE0-baseline.md` — tsc/build result, health output, GET-endpoint status table.

---

## PHASE 1 — Inventory (কী কী আছে, তালিকা বানাও)

কোনো ফিক্স নয়। শুধু তথ্য সংগ্রহ। তিনটি মেশিন-জেনারেটেড ইনভেন্টরি বানাতে হবে:

### 1A. Function Inventory — `docs/audit/INVENTORY-functions.csv`
প্রতিটি অ্যাডমিন ফাইলের (`src/admin/*.tsx` + `src/components/admin/*.tsx`) **প্রতিটি ইউজার-ট্রিগারড ফাংশন** — মানে প্রতিটি `handleX`, প্রতিটি `onClick`/`onSubmit`/`onChange` হ্যান্ডলার, প্রতিটি `useEffect` ডেটা-লোডার, প্রতিটি export/print অ্যাকশন, প্রতিটি মোডাল-ওপেনার।

কলাম:
```
section, module, route, file, function_name, ui_trigger(button/menu/tab/effect),
purpose_1line, calls_api(list), reads_context(list), writes_context(list),
writes_localStorage(list), emits_audit_log(y/n), emits_notification(y/n),
guarded_by_permission(name|none)
```

### 1B. API Contract Map — `docs/audit/INVENTORY-api.csv`
`server.ts`-এর ২৭২টি রুট বনাম ক্লায়েন্ট কল।
```
method, path, handler_line, engine_used, mutates(entity list),
called_from(files|NONE), auth_required(y/n), rbac_permission, notes
```
ইতিমধ্যে জানা: **~৫৮টি সার্ভার এন্ডপয়েন্ট কোনো ক্লায়েন্ট থেকে কল হয় না** (নিচের PHASE 3-C দেখুন)।

### 1C. Data Flow Map — `docs/audit/INVENTORY-dataflow.md`
প্রতিটি কোর এনটিটির জন্য (Order, Product, Category, Inventory/Stock, Customer, Supplier, Payment, Refund/RMA, Shipment, Expense, Settlement, Coupon, Campaign, StaffUser, AuditLog, Backup, SiteContent) একটা ডায়াগ্রাম-টেবিল:
```
Entity → Source of truth (serverDb field) → API endpoints that write it
       → API endpoints that read it → AppContext state that mirrors it
       → Admin UIs that display it → Storefront UIs that display it
       → Downstream side-effects that MUST fire on write
```

---

## PHASE 2 — Connectivity Rules (কোনটার সাথে কোনটা কানেক্টেড থাকা *উচিত*)

এটাই অডিটের হৃদয়। নিচের **Expected Connectivity Matrix** হলো "সঠিক অবস্থা"। এজেন্ট প্রতিটি সারি ধরে ধরে কোডে যাচাই করবে এবং `docs/audit/PHASE2-connectivity.md` টেবিলে `OK / BROKEN / MISSING / PARTIAL` মার্ক করবে, প্রমাণ (file:line) সহ।

### 2A. Order lifecycle (সবচেয়ে বেশি সংযোগ)
অর্ডার তৈরি/স্ট্যাটাস বদল হলে **যা যা একসাথে ঘটা বাধ্যতামূলক**:

| ট্রিগার | অবশ্যই সংযুক্ত থাকতে হবে |
|---|---|
| Order create (`POST /api/orders/create`) | ① server-side price recalculation (কখনো ক্লায়েন্ট টোটাল বিশ্বাস নয়) ② atomic stock deduction + rollback on partial failure ③ fraud evaluation (`fraudEngine`) + auto-BLOCK ④ coupon/loyalty apply + usage counter ⑤ inventory transaction ledger row ⑥ audit log ⑦ customer SMS/notification ⑧ UTM/marketing attribution ⑨ finance summary refresh ⑩ Dashboard/Orders list refresh |
| CONFIRMED | payment status consistency, pick-list eligibility |
| SHIPPED / dispatch | courier booking, consignment ID persisted, tracking timeline row, customer SMS |
| DELIVERED | COD collection → finance ledger, supplier eligible-sale sync (`supplierEngine.processDeliveredOrder`), loyalty points award, RFM/marketing recompute |
| CANCELLED | stock restore **exactly once** (`stockRestoredOnCancel` guard), refund path if prepaid, finance adjust, audit |
| RETURNED / RMA approve | stock restore **exactly once** (`stockRestoredOnReturn`), refund record, supplier return adjustment, finance adjust |
| REFUNDED | idempotency guard, payment ledger row, finance summary, customer notification |

প্রতিটি ট্রানজিশনের জন্য এজেন্টকে যাচাই করতে হবে: **UI বাটন → API → engine → serverDb → AppContext refetch → অন্য সব স্ক্রিনে প্রতিফলন**। যেকোনো একটা লিঙ্ক ছুটে গেলে `BROKEN`।

### 2B. Cross-module connectivity rules (module-by-module)

| Module | অবশ্যই যার সাথে কানেক্টেড | যাচাই করার প্রশ্ন |
|---|---|---|
| **Dashboard** | Orders, Inventory, Fraud, Finance, Reports analytics | KPI কার্ডের সংখ্যা কি লাইভ `/api/reports/analytics` থেকে? নাকি লোকাল মক? "Quick confirm" বাটন কি সত্যিই স্ট্যাটাস API কল করে? সাইডবার badge count (`getSectionBadgeCount`) কি একই সোর্স ব্যবহার করে? |
| **Orders Desk** | Products (item snapshot), Customers (360 modal), Inventory, Payments, Shipments/courier, Returns, Fraud badge, Print engine, Audit, Notifications | রো-অ্যাকশন প্রতিটি (confirm/cancel/print/dispatch/refund/note) কি সার্ভার হিট করে? ফিল্টার+সার্চ+ডেট রেঞ্জ কি সার্ভার-সাইড না ক্লায়েন্ট-সাইড, আর বড় ডেটায় টেকসই? Excel/CSV export কি ফিল্টার-করা ডেটা এক্সপোর্ট করে? |
| **Fraud & Anti-Abuse** | Orders (risk badge), Customers (blacklist), Payments (hold), phone canonicalization | ব্ল্যাকলিস্ট ফোন কি `normalizeBdMobilePhone` দিয়ে ম্যাচ হয়? `/api/fraud/evaluate` এর ফল কি অর্ডারে persist হয়? |
| **Shipments & Couriers** | Orders, courier config, tracking timeline, print label, webhook `/api/courier/webhook` | কুরিয়ার webhook এলে কি অর্ডার স্ট্যাটাস অটো আপডেট হয়? লেবেল প্রিন্টে কি canonical ফোন যায়? |
| **Fulfillment (Hubs)** | Warehouses, stock matrix, transfers, pick-lists, manifests, Orders routing | transfer approve→dispatch→receive চেইনে কি স্টক ম্যাট্রিক্স আপডেট হয়? optional-mode অফ থাকলে UI কি gracefully লুকায়? |
| **Returns & Refunds (RMA)** | Orders, Inventory restore, Payments refund, Finance, Customer notification, Print | ⚠️ **জানা সমস্যা:** `ReturnsRefundsAdmin.tsx` RMA রেকর্ড `localStorage('kisholoy_rma_records')`-এ রাখে — সার্ভারে নয়। এটা সার্ভার-ব্যাকড করতে হবে (`/api/admin/returns*`, `/api/admin/refunds*` ইতিমধ্যে সার্ভারে আছে কিন্তু UI কল করে না)। |
| **Payments & Ledger** | Orders, refunds, IPN `/api/payments/ipn`, gateway init/execute, Finance | IPN হ্যান্ডলার কি সত্যিই অর্ডার/পেমেন্ট আপডেট করে? refund কি idempotent? |
| **Finance & P&L** | Orders (revenue), Expenses, Settlements, Suppliers (payable), Returns (negative), Reports | courier fee double-count regression ফেরেনি তো? P&L এর প্রতিটি লাইন কি ট্রেসেবল সোর্স থেকে? |
| **Products Catalog** | Categories, Inventory stock, Suppliers, Storefront (Shop/ProductDetail/Home), Print/barcode, Orders snapshot | প্রোডাক্ট এডিট করলে কি স্টোরফ্রন্টে সাথে সাথে দেখা যায় (`/api/products` refetch)? ডিলিট করলে কি অর্ডার-হিস্ট্রি ভাঙে না (snapshot preserved)? SKU/barcode ইউনিক? |
| **Categories & Menus** | Products, storefront nav/menu, CMS | ক্যাটাগরি ডিলিট করলে ওই ক্যাটাগরির প্রোডাক্টের কী হয়? orphan হয় কি? |
| **Inventory Ledger** | Products, Orders (deduct/restore), Warehouses, Suppliers (restock), low-stock alerts → Dashboard badge | প্রতিটি স্টক পরিবর্তনের কি ledger row + reason + operator আছে? manual adjust কি audit-logged? |
| **Suppliers & Procurement** | Products (supply price), Purchase Orders, Supply Batches → Inventory, Settlements → Finance, Agreements, Supplier Portal (`/supplier`), Bulk import | PO → delivery → batch → stock-in চেইন কি পুরো? Settlement pay কি Finance-এ expense তৈরি করে? পোর্টাল টোকেন কি অ্যাডমিন টোকেনের থেকে আলাদা (এখন আলাদা রাখা হয়েছে — ভাঙবেন না)? |
| **Customers Directory** | Orders (history), Customer360, notes/tags/status, Marketing RFM, Fraud blacklist, Loyalty, storefront account | Customer360-এর অর্ডার লিস্ট কি canonical phone/id দুটোতেই ম্যাচ করে? status=BLOCKED করলে কি চেকআউটে আটকায়? |
| **Marketing Command Center** | Orders (attribution/UTM), Campaigns, Channels, Spend, ROI, RFM, Abandoned carts, Referrals, Finance reconciliation | UTM ক্যাপচার (`src/utils/utmCapture.ts`) → order.utm → attribution → ROI চেইন কি পুরো? spend void কি ROI রিকম্পিউট করে? "Not implemented" ব্যাজ (`MarketingCommandCenter.tsx:1136`) — সেটা কি সত্যি, নাকি লেবেল বাসি? |
| **Analytics** | Telemetry logger (`src/utils/telemetryLogger.ts`), auth events, traffic | ডেটা কি localStorage-only? তাহলে সার্ভার-সাইড করা দরকার কিনা রিপোর্ট করুন। |
| **Reports** | Orders, Finance, Inventory, Customers cohorts, districts, export | প্রতিটি রিপোর্ট টাইপের export endpoint কি বিদ্যমান ও কাজ করে? ডেট-রেঞ্জ ফিল্টার কি সব রিপোর্টে সমান আচরণ করে (`src/utils/dateFilterUtils.ts`)? |
| **Content CMS** | Storefront (Home/Footer/Policy pages), revisions, publish/restore, image upload | পাবলিশ করলে কি স্টোরফ্রন্ট সাথে সাথে আপডেট? revision restore কি কাজ করে? `/api/content/upload-image` কি UI থেকে ব্যবহৃত? |
| **Store Settings** | SiteContent, shipping/COD rules → Checkout math, payment config, print settings | ⚠️ `SettingsAdmin.tsx`-এ কোনো `/api/` কল নেই — শুধু `updateSiteContent` context। সেটিংস কি সত্যিই সার্ভারে persist হয় ও চেকআউট ম্যাথে প্রভাব ফেলে? |
| **Users & RBAC** | `ROUTE_PERMISSIONS` matrix, sessions, rate-limit/ban, MFA, audit, staff auth (`/api/security/auth/*`) | ⚠️ **বড় ফাঁক:** `/api/security/auth/login|verify|logout` সার্ভারে আছে কিন্তু কোনো UI লগইন স্ক্রিন নেই — `currentRole` শুধু ড্রপডাউন। এটা রিপোর্ট + প্রস্তাব করতে হবে (real staff login screen → staff token → `apiFetch` staff bearer → `kisholoy-auth-expired` gate যা ইতিমধ্যে আছে)। |
| **Audit Trail** | সব mutating action, hash-chain verify, export | কোন কোন mutation audit log লেখে না? তালিকা করুন এবং সেগুলো যোগ করুন। |
| **Backup** | Full DB export/import, schedule, drive sync, DR drill, restore | pre-restore snapshot কি নেওয়া হয়? restore কি সব `serverDb` কালেকশন কভার করে (নতুন এনটিটি বাদ পড়েনি তো)? |

### 2C. Known-suspicious findings (এগুলো PHASE 2-তে আলাদা করে ভেরিফাই করতে হবে)
1. **~৫৮টি orphan server endpoint** (কোনো UI কল করে না) — যেমন `/api/admin/returns`, `/api/admin/refunds/process`, `/api/inventory/stats`, `/api/inventory/transactions`, `/api/reports/financial-pnl`, `/api/reports/inventory-health`, `/api/reports/customer-cohorts`, `/api/reports/districts`, `/api/promotions/stats`, `/api/operations/dlq/*`, `/api/operations/worker/*`, `/api/security/auth/*`, `/api/security/users/toggle-mfa`, `/api/suppliers/supply-chain/metrics`, `/api/system/go-live-audit`, `/api/webhooks/test-ping`, `/api/notifications/whatsapp-link`, `/api/checkout/calculate`, `/api/courier/track/:id`, `/api/marketing/abandoned-carts/simulate`।
   → প্রতিটির জন্য সিদ্ধান্ত: **(a) UI-তে ওয়্যার করো** (যদি ইউজার-ভ্যালু থাকে), **(b) internal/webhook বলে ডকুমেন্ট করো**, নাকি **(c) deprecated ফ্ল্যাগ করো**। ডিলিট নয়।
2. **Orphan components:** `src/admin/PromotionsAdmin.tsx` (1,323 লাইন) কোনো রুটে নেই — `/admin/promotions` → `<Navigate to="/admin">`. `src/admin/ReturnsAdmin.tsx` এবং `src/admin/RefundsAdmin.tsx`-ও unrouted (`ReturnsRefundsAdmin` ব্যবহৃত হয়)। → ইউজারকে জিজ্ঞাসা/রিপোর্ট: restore করব নাকি archive?
3. **`PromotionsAdmin.tsx`-এ ৫টি `alert()`** — প্রোডাকশন UI-তে native alert; `showToast` ব্যবহার করা উচিত।
4. **`ReturnsRefundsAdmin` localStorage persistence** (উপরে বর্ণিত)।
5. **`SettingsAdmin` সার্ভার-persist করে না।**
6. **staff auth UI অনুপস্থিত** (উপরে)।
7. **Analytics/telemetry localStorage-only।**
8. প্রতিটি অ্যাডমিন ফাইলে **লোকাল `useState([...])` সিড-করা অ্যারে** (Marketing/Users/Operations/Suppliers-এ ৩–৬টি করে) — এগুলোর কোনটা সত্যিকারের সার্ভার ডেটা হওয়া উচিত, বের করুন।

---

## PHASE 3 — Function-by-Function Audit (একটা একটা করে)

**পদ্ধতি:** PHASE 1A-এর CSV-এর প্রতিটি সারি নিয়ে ক্রমানুসারে কাজ করুন। সেকশন অর্ডার:
`sales-operations` → `catalog-inventory` → `customer-management` → `system-administration`।
প্রতিটি মডিউলের ভিতরে: **প্রতিটি ট্যাব → প্রতিটি বাটন → প্রতিটি ফর্ম ফিল্ড → প্রতিটি টেবিল কলাম → প্রতিটি মোডাল**।

প্রতিটি ফাংশনের জন্য এই ১৪-পয়েন্ট চেকলিস্ট পূরণ করুন (`docs/audit/PHASE3-<section>.md`):

```
[F-###] <module> › <tab> › <function name>
 1. Wired?            বাটন/ট্রিগার আদৌ কোনো হ্যান্ডলারে যুক্ত? (dead button?)
 2. Server-backed?    সার্ভারে persist হয়, নাকি শুধু লোকাল state/localStorage?
 3. Correct endpoint? method + path + payload shape সার্ভারের প্রত্যাশার সাথে মেলে?
 4. Auth/RBAC         staff bearer যায়? ROUTE_PERMISSIONS + সার্ভার-সাইড গার্ড দুটোই আছে?
 5. Validation        client + server দুই জায়গায়? BD phone → normalizeBdMobilePhone?
                      টাকা/সংখ্যা negative/NaN গার্ড? ফাইল আপলোড টাইপ/সাইজ গার্ড?
 6. Optimistic/refetch সফল হলে UI রিফ্রেশ হয়? ব্যর্থ হলে rollback হয়?
 7. Side effects      audit log / notification / inventory / finance — যেগুলো ফায়ার হওয়ার
                      কথা (PHASE 2A/2B ম্যাট্রিক্স) সেগুলো ফায়ার হয়?
 8. Idempotency       ডাবল-ক্লিক/রিট্রাই করলে ডুপ্লিকেট ডেটা বা ডাবল টাকা হয়?
 9. Error UX          ব্যর্থতায় ইউজার-বোধগম্য বার্তা (bn+en)? silent catch নেই?
10. Loading/disabled  in-flight অবস্থায় বাটন disabled + spinner?
11. Empty/edge state  ডেটা শূন্য হলে সুন্দর empty state? বিশাল লিস্টে পারফরম্যান্স?
12. i18n              BN + EN দুটোই?
13. Responsive        মোবাইলে (৩২০/৩৭৫px) ট্রিগার ও ফলাফল ব্যবহারযোগ্য? (PHASE 5 রুল)
14. A11y              keyboard reachable, focus ring, aria-label, modal focus-trap + Esc?

 → VERDICT: PASS | FIX-NEEDED (severity S1..S4) | NEEDS-DECISION
 → Evidence: file:line
 → Proposed fix: <১–৩ বাক্য>
```

**Severity স্কেল:**
- **S1 Critical** — ডেটা/টাকা ভুল, স্টক লিক, নিরাপত্তা ফাঁক, ডেটা লস। *সাথে সাথে ফিক্স।*
- **S2 High** — কোর ফাংশন কাজ করে না বা persist হয় না, ভাঙা সংযোগ।
- **S3 Medium** — UX/ভ্যালিডেশন/রেসপন্সিভ/i18n ফাঁক।
- **S4 Low** — কসমেটিক, কনসিসটেন্সি, রিফ্যাক্টর সুযোগ।

---

## PHASE 4 — Fix Execution (severity অনুসারে, ব্যাচে)

**অর্ডার:** সব S1 → সব S2 → S3 → S4।

**প্রতিটি ফিক্সের বাধ্যতামূলক রুটিন:**
1. Root cause এক বাক্যে লিখুন।
2. সবচেয়ে ছোট সঠিক পরিবর্তনটা করুন (UI + API + engine যেখানে দরকার)।
3. **সংযুক্ত সিস্টেম রি-চেক** (PHASE 2 ম্যাট্রিক্সের সংশ্লিষ্ট সারিগুলো)।
4. `npx tsc --noEmit` = 0, প্রভাবিত এন্ডপয়েন্ট curl-verify।
5. `docs/audit/PHASE4-fixlog.md`-এ সারি যোগ: `id | severity | module | root cause | fix | files | verification`।
6. থিমযুক্ত কমিট।

**ফিক্সের সময় শেয়ার্ড হেল্পার ব্যবহার বাধ্যতামূলক (ডুপ্লিকেট লজিক নয়):**
- ফোন: `src/lib/phone.ts` → `normalizeBdMobilePhone` / `isSameBdMobilePhone`
- API + টোকেন + 401: `src/lib/apiClient.ts` → `apiFetch` / `apiFetchJson` (raw `fetch` নতুন করে যোগ করবেন না; বিদ্যমান raw `fetch` গুলোও ধাপে ধাপে migrate করুন)
- টাকা ফরম্যাট, ডেট রেঞ্জ: `src/utils/dateFilterUtils.ts`, বিদ্যমান formatter — নতুন বানাবেন না
- টোস্ট: `showToast` (native `alert()` নয়)
- প্রিন্ট: `src/lib/documentEngine.tsx` (এক অর্ডার → এক প্রিন্ট → এক PDF নীতি ভাঙবেন না)

---

## PHASE 5 — Responsive / Any-Device Pass (পুরো ওয়েবসাইট, শুধু অ্যাডমিন নয়)

**টার্গেট ব্রেকপয়েন্ট (প্রতিটি স্ক্রিন এই ৬টায় যাচাই):**
`320px` (small Android) · `375px` (iPhone SE/12 mini) · `414px` · `768px` (tablet portrait) · `1024px` (tablet landscape/small laptop) · `1440px+` (desktop)। সাথে **landscape** ওরিয়েন্টেশন এবং **dark mode**।

**Hard rules:**
1. **কোনো হরাইজন্টাল পেজ-স্ক্রল নয়।** `document.body.scrollWidth <= viewport width` প্রতিটি রুটে।
2. **প্রতিটি `<table>` অবশ্যই** `overflow-x-auto` র‍্যাপারে থাকবে **অথবা** মোবাইলে card-list-এ রূপান্তরিত হবে। বর্তমানে ২৭টি ফাইলে টেবিল আছে — প্রতিটি ম্যানুয়ালি যাচাই করুন (কিছু ফাইলে টেবিলের সংখ্যা > `overflow-x-auto` সংখ্যা → সন্দেহজনক: `AuditAdmin`, `BulkSupplierImportModal`, `Dashboard`, `ShipmentsAdmin`, `SuppliersAdmin`, `SupplierSettlementsView`, `SupplyBatchesView`, `DateWiseDataHubModal`, `AdvancedSupplierLedgerModal`, `BusinessDocumentModal`)।
   - **প্রেফার্ড প্যাটার্ন:** `< md` → স্ট্যাক করা কার্ড (প্রতিটি রো = কার্ড, লেবেল:ভ্যালু জোড়া, অ্যাকশন বাটন নিচে); `>= md` → সাধারণ টেবিল।
3. **টাচ টার্গেট ≥ 44×44px** (icon-only বাটনে `p-2.5` + যথেষ্ট hit area)। বর্তমানে অনেক `w-3.5 h-3.5` আইকন-বাটন আছে — র‍্যাপার প্যাডিং যাচাই করুন।
4. **মোডাল:** মোবাইলে full-screen বা bottom-sheet; `max-h-[90vh]` + ভিতরে স্ক্রল; হেডার/ফুটার sticky; Esc + backdrop close; body scroll-lock; focus trap.
5. **ফর্ম:** মোবাইলে single-column; `inputMode="numeric"`/`type="tel"` BD ফোন ও টাকার ফিল্ডে (iOS zoom এড়াতে ফন্ট ≥16px বা `text-base`)।
6. **সাইডবার:** মোবাইলে off-canvas drawer + backdrop, রুট বদলালে অটো-ক্লোজ, বডি স্ক্রল-লক, স্ক্রিন-রিডারে ঠিকঠাক।
7. **চার্ট (recharts):** `ResponsiveContainer`, মোবাইলে লেজেন্ড/লেবেল কমানো, কোনো ফিক্সড `width` নয়।
8. **KPI গ্রিড:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` ধরনের; কোনো ফিক্সড `min-w` যা 320px ভাঙে।
9. **লম্বা টেক্সট/ID/ইমেইল:** `truncate` + `title`, অথবা `break-words`; overflow দিয়ে লেআউট ভাঙা নয়।
10. **স্টোরফ্রন্টও কভার করুন:** Home, Shop, CategoryPage, ProductDetail, Cart, Checkout (মাল্টি-স্টেপ মোবাইলে), OrderConfirmation, TrackOrder, AccountPage, PolicyPage, Header (মোবাইল মেনু/সার্চ/কার্ট), Footer, CustomerAuthModal, Supplier portal (`/supplier`, `/supplier/login`)।
11. **Print CSS** যেন responsive পরিবর্তনে না ভাঙে — প্রিন্ট আউটপুট আগের মতোই থাকতে হবে।

**Artifact:** `docs/audit/PHASE5-responsive.md` — route × breakpoint ম্যাট্রিক্স, প্রতিটি সেল PASS/FIXED/ISSUE, স্ক্রিনশট বা মাপা `scrollWidth` সহ।

---

## PHASE 6 — Cross-cutting Quality Pass

1. **Accessibility:** প্রতিটি ইন্টারঅ্যাকটিভ এলিমেন্ট keyboard-reachable, দৃশ্যমান focus ring, আইকন-বাটনে `aria-label`, ফর্ম ইনপুটে `<label>`/`aria-labelledby`, টেবিলে `<th scope>`, মোডালে `role="dialog" aria-modal`, লাইভ আপডেটে `aria-live`, কনট্রাস্ট WCAG AA (light + dark)।
2. **i18n:** সব হার্ডকোড ইংরেজি স্ট্রিং খুঁজে BN যোগ করুন; বাংলা সংখ্যা/তারিখ/টাকা ফরম্যাট কনসিসটেন্ট; `৳` চিহ্ন সব জায়গায় একরকম।
3. **Performance:** অ্যাডমিন রুটগুলোতে `React.lazy` + `Suspense` (২১টা ভারী পেজ একসাথে বান্ডলে ঢুকছে); বড় লিস্টে pagination/virtualization; `useMemo` ভারী derive-এ; ইমেজে `loading="lazy"` + width/height; `npm run build` বান্ডল সাইজ রিপোর্ট।
4. **Security:** সার্ভার-সাইড RBAC গার্ড (এখন অনেক mutating রুট গার্ডহীন), rate-limit সংবেদনশীল রুটে, input sanitization, কোনো সিক্রেট ক্লায়েন্ট বান্ডলে নেই, error message-এ internal detail লিক নেই, IDOR চেক (`/api/customer/*/:id` — অন্যের id দিলে ডেটা দেয় কি?)।
5. **Consistency:** সব অ্যাডমিন পেজে একই page-header, filter bar, empty state, loading skeleton, toast, confirm-modal প্যাটার্ন। ভিন্নতা থাকলে শেয়ার্ড কম্পোনেন্টে আনুন।
6. **Error boundaries:** অ্যাডমিন শেল ও স্টোরফ্রন্ট শেলে React error boundary যাতে এক পেজ ক্র্যাশ করলে পুরো অ্যাপ সাদা না হয়।

---

## PHASE 7 — Second-Pass Re-Audit

PHASE 3-এর চেকলিস্ট **আবার** চালান (এবার দ্রুত, শুধু verdict), যাতে ফিক্স করতে গিয়ে নতুন কিছু ভাঙেনি নিশ্চিত হয়। বিশেষ নজর:
- আগের অডিটে ঠিক হওয়া ৬টি বাগ (`AUDIT_REPORT.md` §2) regress করেনি তো?
- গত রাউন্ডে ঠিক হওয়া ৩টি: canonical phone tracking, staff-scoped 401 gate, customer-scoped `/api/orders` — অক্ষত তো?
- `tsc` 0, `build` সফল, সব GET এন্ডপয়েন্ট 2xx।

**Artifact:** `docs/audit/PHASE7-reaudit.md`

---

## PHASE 8 — End-to-End Acceptance Scenarios

প্রতিটি সিনারিও **মোবাইল ভিউপোর্ট (375px) + ডেস্কটপ** দুটোতেই চালিয়ে পাস করাতে হবে, এবং প্রতিটি ধাপে সংশ্লিষ্ট অ্যাডমিন স্ক্রিনে প্রতিফলন দেখাতে হবে:

1. **Guest COD order:** browse → cart → checkout (কুপন সহ) → order → Admin Orders-এ দেখা যায় → stock কমেছে → fraud score আছে → finance summary বেড়েছে → audit log আছে → `/track-order`-এ ফোনের চার ফরম্যাটেই (`+8801…`, `8801…`, `01…`, `+880 1…`) পাওয়া যায়।
2. **Prepaid order + refund:** gateway init → success → payment ledger → refund → idempotency (দ্বিতীয় refund রিজেক্ট) → finance adjust।
3. **Full fulfillment:** confirm → pick-list → manifest → courier book → consignment → tracking timeline → DELIVERED → COD collection → supplier eligible-sale → loyalty points।
4. **Cancel & Return:** CANCELLED → stock ঠিক একবার ফেরে; RMA approve → stock ঠিক একবার ফেরে + refund রেকর্ড + কাস্টমার নোটিফিকেশন।
5. **Catalog:** নতুন প্রোডাক্ট + ক্যাটাগরি → স্টোরফ্রন্টে দৃশ্যমান → স্টক অ্যাডজাস্ট → low-stock ব্যাজ → Dashboard-এ প্রতিফলন।
6. **Supplier chain:** সাপ্লায়ার তৈরি → PO → delivery → batch → stock-in → settlement → Finance-এ expense → supplier portal-এ statement।
7. **Customer:** register → login → order → `/account`-এ **শুধু নিজের** অর্ডার (scoping) → address/wishlist/return request → Admin Customer360-এ সব দেখা যায়।
8. **Marketing:** UTM সহ ল্যান্ডিং → order → attribution → channel spend → ROI → finance reconciliation।
9. **Security:** rate-limit ban/unban, session revoke, RBAC — কম-প্রিভিলেজড রোলে সীমিত রুট, সার্ভার ৪০৩ দেয়; customer-token 401 অ্যাডমিন প্যানেল লগআউট করায় না।
10. **Backup/DR:** export → import → verify → DR drill → restore (pre-restore snapshot সহ) → ডেটা অক্ষত।

**Artifact:** `docs/audit/PHASE8-acceptance.md` — প্রতিটি সিনারিও PASS/FAIL + প্রমাণ।

---

## PHASE 9 — Final Report & Delivery

`docs/audit/FINAL-REPORT.md` তৈরি করুন:
- Executive summary (কতগুলো ফাংশন অডিট হলো, কত S1/S2/S3/S4 পাওয়া গেল, কত ফিক্স হলো)
- Fix log (severity, root cause, fix, verification)
- Connectivity matrix — before vs after
- Responsive matrix — before vs after
- **Open decisions for the owner** (ডিলিট নয়, সিদ্ধান্তের জন্য): orphan modules (`PromotionsAdmin`, `ReturnsAdmin`, `RefundsAdmin`), orphan endpoints, staff-login UI চালু করা হবে কিনা, analytics সার্ভার-সাইড করা হবে কিনা
- Known limitations & recommended next steps (যেমন in-memory DB → persistent DB migration path)
- সব কমিট + PR লিঙ্ক

---

## পরিশিষ্ট A — এজেন্টের জন্য দরকারি কমান্ড

```bash
# টাইপচেক ও বিল্ড
npx tsc --noEmit && npm run build

# dev server (preview-friendly)
npm run dev            # 0.0.0.0:3000

# সব সার্ভার রুট বের করা
grep -oE "app\.(get|post|put|patch|delete)\('[^']+'" server.ts | sort -u

# ক্লায়েন্ট থেকে ব্যবহৃত সব API path
grep -rhoE "/api/[A-Za-z0-9_/:\$\{\}.-]+" src --include=*.tsx --include=*.ts | sort -u

# orphan endpoint নির্ণয় (উপরের দুটির diff)

# টেবিল বনাম overflow wrapper
grep -c "<table" src/admin/*.tsx src/components/admin/*.tsx
grep -c "overflow-x-auto" src/admin/*.tsx src/components/admin/*.tsx

# native alert (নিষিদ্ধ)
grep -rn "alert(" src --include=*.tsx

# raw fetch যেগুলো apiFetch-এ migrate করা দরকার
grep -rn "fetch('/api" src --include=*.tsx --include=*.ts
```

## পরিশিষ্ট B — Definition of Done

- [ ] PHASE 0–9 সবগুলো আর্টিফ্যাক্ট `docs/audit/`-এ আছে
- [ ] প্রতিটি অ্যাডমিন ফাংশনের জন্য ১৪-পয়েন্ট চেকলিস্ট রো পূরণ
- [ ] সব S1 ও S2 ফিক্সড ও ভেরিফায়েড
- [ ] `npx tsc --noEmit` = 0 error, `npm run build` সফল
- [ ] ৬টি ব্রেকপয়েন্টে কোনো হরাইজন্টাল পেজ-স্ক্রল নেই, প্রতিটি টেবিল/মোডাল/ফর্ম মোবাইলে ব্যবহারযোগ্য
- [ ] ১০টি acceptance সিনারিও মোবাইল + ডেস্কটপ দুটোতেই PASS
- [ ] নতুন/পরিবর্তিত প্রতিটি UI স্ট্রিং BN + EN এবং dark-mode সাপোর্টেড
- [ ] কোনো ফিচার/এন্ডপয়েন্ট ডিলিট হয়নি; সন্দেহজনকগুলো রিপোর্টে ফ্ল্যাগড
- [ ] সব কাজ `arena/01a06c54-kisholoy-bd` ব্রাঞ্চে কমিটেড ও পুশড
