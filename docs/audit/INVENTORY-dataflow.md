# PHASE 1C — Data Flow Map

_Generated 2026-09-04 · source of truth = `server/db.ts` (`ServerDatabase`, in-memory, seeded from `src/data/mockData.ts`)_

For every core entity: where it lives, who writes it, who reads it, which client state mirrors it,
which screens show it, and **which side-effects are obligatory on write** (these obligations become
the PASS/FAIL criteria in PHASE 2 & PHASE 3).

Legend for the *Obligatory side-effects* column: these are the things that **must** happen together.
If any one is missing in code, PHASE 2 marks that connectivity row `BROKEN`.

---

## 0. Storage layers (important context)

| Layer | What lives there | Persistence | Risk |
|---|---|---|---|
| `serverDb` (in-memory) | 30+ collections, authoritative | **lost on server restart** | S-arch: no durable DB; documented, not a PHASE 4 fix |
| `marketingCommandCenter` private arrays | channels, spends, attributions | in-memory, **outside `serverDb`** | not covered by `/api/system/export` backup → verify in PHASE 3 |
| `securityEngine` private arrays | chained audit ledger, rate-limit buckets, sessions | in-memory | not in backup either |
| `localStorage` (browser) | `kisholoy_rma_records`, `kisholoy_cart`, `kisholoy_customer_id`, `kisholoy-theme`, `kisholoy_custom_couriers`, `kisholoy_fulfillment_optional`, telemetry events, `kisholoy_staff_token`, `kisholoy_customer_token`, `ksh_supplier_token` | per-browser | **RMA + telemetry are business data in localStorage → S2** |

---

## 1. Order

| | |
|---|---|
| **Source of truth** | `serverDb.orders: Order[]` |
| **Writes** | `POST /api/orders/create` · `POST /api/orders/:id/status` · `POST /api/orders/:id/note` · courier webhook `POST /api/courier/webhook` · `POST /api/admin/returns/approve` *(orphan)* · `POST /api/payments/ipn` *(orphan)* · `supplierEngine.processDeliveredOrder` |
| **Reads** | `GET /api/orders` (staff = all, customer bearer = scoped) · `GET /api/orders/track` · `GET /api/reports/*` · `GET /api/finance/*` · `GET /api/fraud/*` · `GET /api/print/order/:orderNumber` |
| **Client mirror** | `AppContext.orders` (hydrated via `apiFetchJson('/api/orders')`, re-runs on `currentCustomerId` change) |
| **Admin UIs** | Dashboard (KPI + live feed), OrdersAdmin, FraudRiskDashboard, ShipmentsAdmin, FulfillmentAdmin, ReturnsRefundsAdmin, PaymentsAdmin, FinanceAdmin, ReportsAdmin, Customer360Modal, DateWiseDataHubModal |
| **Storefront UIs** | Checkout → OrderConfirmation, TrackOrder, AccountPage (order history) |
| **Obligatory side-effects on create** | ① server-side price recompute ② atomic stock deduct + rollback ③ `fraudEngine.evaluateOrderRisk` persisted on order ④ coupon/loyalty usage counter ⑤ `inventoryTransactions` ledger row ⑥ `auditLogs` row ⑦ customer SMS/notification ⑧ UTM attribution capture ⑨ finance summary recompute ⑩ admin list refresh |
| **Obligatory on status change** | CONFIRMED → payment consistency · SHIPPED → courier booking + consignment persisted + timeline + SMS · DELIVERED → COD→finance, `supplierEngine.processDeliveredOrder`, loyalty award, RFM recompute · CANCELLED → stock restore **once** (`stockRestoredOnCancel`) + refund path + finance + audit · RETURNED → stock restore **once** (`stockRestoredOnReturn`) + refund record + supplier return adjustment |
| **Known gaps to verify** | `/api/admin/returns/approve`, `/api/admin/refunds/process`, `/api/payments/ipn` are all **orphan** — the RMA UI writes localStorage instead. Courier webhook has no client caller (correct — external), but is it reachable/authenticated? |

## 2. Product

| | |
|---|---|
| **Source of truth** | `serverDb.products` |
| **Writes** | `POST /api/products` · `PUT /api/products/:id` · `DELETE /api/products/:id` · `POST /api/inventory/adjust` · `POST /api/inventory/batch-restock` · order create (stock deduct) · cancel/return (stock restore) |
| **Reads** | `GET /api/products` · storefront pages · `GET /api/inventory/*` |
| **Client mirror** | `AppContext.products` |
| **Admin UIs** | ProductsAdmin, InventoryAdmin, ProductEditModal, ProductQuickViewModal, ProductDeleteConfirmModal, SuppliersAdmin (supply price), Dashboard (low-stock badge) |
| **Storefront UIs** | Home, Shop, CategoryPage, ProductDetail, Cart, Checkout |
| **Obligatory side-effects** | any stock change → `inventoryTransactions` row (qty, reason, operator) + low-stock badge recompute + audit log; product delete → **must not break historical order line snapshots**; SKU/barcode uniqueness |

## 3. Category

| | |
|---|---|
| **Source of truth** | `serverDb.categories` |
| **Writes** | `POST/PUT/DELETE /api/categories[/:id]` |
| **Client mirror** | `AppContext.categories` |
| **UIs** | CategoriesAdmin, ProductsAdmin (assignment), storefront nav/menu, CategoryPage, Home |
| **Obligatory** | delete → orphan-product policy (reassign or block) + audit log + storefront menu refresh |

## 4. Inventory / Stock ledger

| | |
|---|---|
| **Source of truth** | `serverDb.inventoryTransactions` + `product.stock` + `serverDb.warehouseStock` (multi-hub) |
| **Writes** | `POST /api/inventory/adjust` · `POST /api/inventory/batch-restock` · order create/cancel/return · supplier batch stock-in · warehouse transfers |
| **Reads** | `GET /api/inventory/stats` *(orphan)* · `GET /api/inventory/transactions` *(orphan)* · `GET /api/inventory/export` *(orphan)* · `GET /api/warehouses/stock-matrix` |
| **UIs** | InventoryAdmin, FulfillmentAdmin, Dashboard badge, ProductsAdmin |
| **Obligatory** | every quantity delta has exactly one ledger row with reason + operator; restore guards prevent double-restore; warehouse matrix stays consistent with product totals |
| **Gap (S2-4, confirmed)** | `AppContext.inventoryTransactions` is seeded from mock data and **never replaced by a server payload**; `InventoryAdmin` makes zero API calls. Server ledger had 7 rows while the UI can only show the 6 seeded ones. `/api/inventory/stats\|transactions\|export` all orphan. |

## 5. Customer

| | |
|---|---|
| **Source of truth** | `serverDb.customers` + `customerProfiles` + `customerAddresses` + `wishlists` + `customerReturns` + `loyaltyWallets` + `customerNotifications` |
| **Writes** | `POST /api/customers` · `POST /api/customers/:id/status|notes|tags` · `POST /api/customer/auth/register|login|change-password|link-guest-order` · `POST /api/customer/addresses` · `POST /api/customer/wishlist/toggle` · `POST /api/customer/returns` |
| **Reads** | `GET /api/customers` · `GET /api/customers/:id` (360) · `GET /api/customer/profile|addresses|wishlist|returns|notifications/:custId` · `GET /api/marketing/customers-crm/:id` |
| **Client mirror** | `AppContext.customers`, `customerProfile`, `savedAddresses`, `wishlist`, `returnRequests`, `customerLoyalty`, `customerNotifications` |
| **UIs** | CustomersAdmin, Customer360Modal, CreateCustomerModal, CustomerQuickMessageModal, MarketingAdmin (RFM/CRM), FraudRiskDashboard (blacklist), AccountPage, CustomerAuthModal |
| **Obligatory** | phone stored canonical via `normalizeBdMobilePhone`; status=BLOCKED must block checkout; customer↔order linkage by id **and** canonical phone; every CRM mutation → audit log |
| **Gap to verify** | IDOR — `GET /api/customer/profile/:custId` etc. accept any id with no ownership check. |

## 6. Supplier / Procurement

| | |
|---|---|
| **Source of truth** | `serverDb` supplier collections + `supplierEngine` (POs, batches, agreements, settlements, eligible sales) |
| **Writes** | `POST /api/suppliers` · `PUT /api/suppliers/:id` · `POST /api/suppliers/bulk-import` · `POST /api/suppliers/:id/purchase-orders` · `POST /api/suppliers/:id/pos/:poId/delivery` · `POST /api/suppliers/:id/payments` · settlements pay/status · agreements CRUD · `POST /api/suppliers/eligible-sales/sync-delivered` · `POST /api/suppliers/:id/toggle-portal` · `POST /api/suppliers/:id/set-portal-password` *(orphan)* |
| **Reads** | `GET /api/suppliers[/:id]` · `/statement` · `/batches` · `/agreements` · `/settlements` · `/eligible-sales` *(orphan)* · `/supply-chain/metrics` *(orphan)* · portal dashboard |
| **UIs** | SuppliersAdmin, SupplyBatchesView, SupplierSettlementsView, SupplierAgreementsView, AdvancedSupplierLedgerModal, SupplierFinancialTrendChart, BulkSupplierImportModal, SupplierPortalModal, `/supplier` portal pages, ProductsAdmin, Dashboard |
| **Obligatory** | PO → delivery → batch → **inventory stock-in** → payable; DELIVERED order → eligible sale; settlement pay → **finance expense row** + audit; return → settlement adjustment; portal token (`ksh_supplier_token`) stays separate from staff/customer tokens |

## 7. Payment / Refund

| | |
|---|---|
| **Source of truth** | `serverDb.paymentTransactions`, `gatewayConfig`, order `paymentStatus`/`refundProcessed` |
| **Writes** | `POST /api/payments/sslcommerz/init|validate` · `POST /api/payments/bkash/create|execute` · `POST /api/payments/ipn` *(orphan)* · `POST /api/payments/refund` · `POST /api/admin/refunds/process` *(orphan)* |
| **Reads** | `GET /api/payments/transactions` |
| **UIs** | PaymentsAdmin, Checkout, FinanceAdmin, ReturnsRefundsAdmin |
| **Obligatory** | refund idempotency guard (already fixed once — must not regress); gateway callback → order status + ledger + notification; money never computed client-side |
| **Gap (S4-2, clarified)** | `sslcommerz/init` and `bkash/create` are uncalled; Checkout opens gateway **modals** and then posts `validate`/`execute` (both wired). The simulated path works end-to-end; the real init handshake is merely unsurfaced. |

## 8. Shipment / Courier

| | |
|---|---|
| **Source of truth** | order shipping fields + consignment/tracking + courier config; custom couriers in `localStorage('kisholoy_custom_couriers')` |
| **Writes** | `POST /api/courier/book` · `POST /api/courier/webhook` (external) |
| **Reads** | `GET /api/courier/config` · `GET /api/courier/track/:id` |
| **UIs** | ShipmentsAdmin, OrderCourierDispatchModal, OrderLiveTrackingTimeline, print label, TrackOrder (storefront) |
| **Obligatory** | booking persists consignment id on the order + timeline row + customer SMS; webhook status → order status transition + timeline; label carries canonical phone + barcode |
| **Gap** | custom courier configs live only in the admin's browser localStorage → invisible to other staff/devices. |

## 9. Finance (expenses, settlements, P&L)

| | |
|---|---|
| **Source of truth** | `serverDb.expenses`, `serverDb.settlements`, derived by `financeEngine` |
| **Writes** | `POST/PUT/DELETE /api/finance/expenses[/:id]` · `POST /api/finance/settlements/:id/status` · supplier settlement payments |
| **Reads** | `GET /api/finance/summary|reconciliation|expenses|settlements` · `GET /api/reports/financial-pnl` *(orphan)* |
| **UIs** | FinanceAdmin, Dashboard, ReportsAdmin, SupplierSettlementsView |
| **Obligatory** | revenue from DELIVERED/paid orders only; courier fee counted once (recorded **or** estimate, never both — regression guard); refunds/returns subtract; supplier settlement = expense |

## 10. Promotions / Loyalty

| | |
|---|---|
| **Source of truth** | `serverDb.coupons`, `flashDeals`, `loyaltyWallets`, `promotionStats` |
| **Writes** | coupon CRUD · `POST /api/promotions/loyalty/adjust` · order create (usage++, points) |
| **Reads** | `GET /api/promotions/coupons|flash-deals|loyalty|stats` *(stats orphan)* · `POST /api/promotions/validate` (checkout) |
| **UIs** | **PromotionsAdmin — ORPHAN COMPONENT, not routed** (`/admin/promotions` → redirect to `/admin`); Checkout coupon box |
| **Obligatory** | coupon validation server-side only; usage limit enforced atomically; loyalty award on DELIVERED; **the entire promotions admin surface is currently unreachable → S2** |

## 11. Marketing / Attribution

| | |
|---|---|
| **Source of truth** | `marketingService` (campaigns, RFM, carts, referrals) + `marketingCommandCenter` **private arrays** (channels, spends, attributions) |
| **Writes** | campaign dispatch · CRM notes/tags · referral disburse · cart recover · channel CRUD/status · spend create/update/void · attribution entry · order create (UTM auto-tag) |
| **Reads** | RFM segments, ROI, finance-reconciliation, auto-orders, sync-status, export |
| **UIs** | MarketingAdmin (+ MarketingCommandCenter tab) |
| **Obligatory** | `utmCapture` (sessionStorage) → `order.utm` → attribution → ROI → finance reconciliation chain intact; spend void recomputes ROI |
| **Gaps** | command-center data not inside `serverDb` → **excluded from backup/export**; a UI badge literally says "Not implemented" (`MarketingCommandCenter.tsx:1136`) |

## 12. Content / CMS / Settings

| | |
|---|---|
| **Source of truth** | `serverDb.siteContent` + `contentRevisions` + `printSettings` |
| **Writes** | `PUT /api/content` · `POST /api/content/publish` · `POST /api/content/restore/:revisionId` · `POST /api/content/upload-image` *(orphan)* · `PUT /api/print/settings` |
| **Reads** | `GET /api/content|/revisions` · `GET /api/print/settings` |
| **UIs** | ContentAdmin, SettingsAdmin, PrintSettingsPanel, storefront Home/Footer/PolicyPage |
| **Obligatory** | publish → storefront reflects immediately; every change → revision row; **store settings (shipping/COD/tax) must reach checkout math server-side** |
| **Verified OK** | SettingsAdmin → `updateSiteContent()` → `PUT /api/content` persists, and `financeEngine` consumes `siteContent.shippingFees` for checkout math (live-probed). |

## 13. Security / RBAC / Audit

| | |
|---|---|
| **Source of truth** | `securityEngine` (staff users, sessions, roles/permissions, rate-limit, chained ledger) + `serverDb.auditLogs` |
| **Writes** | user create/update-role/update-status · rbac update-permissions · session revoke · rate-limit ban/unban · `auth/login|logout|verify|mfa-verify|change-password|reset-*` *(all orphan)* · every mutating endpoint should append an audit row |
| **Reads** | `GET /api/security/users|sessions|rbac/roles|rate-limit/*|audit-chain/ledger|verify|diagnostics` |
| **UIs** | UsersAdmin, AuditAdmin, IdentityAccessModal, AdminLayout `ROUTE_PERMISSIONS` |
| **Obligatory** | client route guard **and** server-side permission guard for every mutating route; audit row for every mutation; hash-chain verifiable |
| **Gaps** | **no staff login UI** (role is a dropdown) → 10 orphan `/api/security/auth/*` endpoints; most mutating routes have **no server-side RBAC check** (`auth_in_handler=n` in `INVENTORY-api.csv`) |

## 14. Backup / DR

| | |
|---|---|
| **Source of truth** | `backupEngine` snapshots + `/api/system/export|import` over `serverDb` |
| **UIs** | BackupAdmin |
| **Obligatory** | pre-restore snapshot before restore; export covers **every** collection |
| **Gap (S1-3, confirmed)** | `extractDatabaseSnapshotPayload()` covers **11 of 35** `serverDb` collections; restore covers 10. 24 collections (incl. `paymentTransactions`, `blacklists`, `loyaltyWallets`, `customerAddresses`, `gatewayConfig`, `fraudSettings`) are in neither. `marketingCommandCenter` + `securityEngine` state is outside `serverDb` entirely. A restore would silently destroy them. |

---

## Cross-entity chain summary (what PHASE 2 will assert)

```
Checkout ──► POST /api/orders/create ──┬─► stock deduct ──► inventoryTransactions ──► low-stock badge
                                       ├─► fraudEngine ──► order.fraudRisk ──► FraudRiskDashboard
                                       ├─► promotionEngine ──► coupon usage / loyalty
                                       ├─► marketingCommandCenter ──► order.utm ──► attribution ──► ROI
                                       ├─► notificationService ──► SMS/in-app
                                       ├─► auditLogs
                                       └─► financeEngine ──► summary / P&L

Order status ──► CONFIRMED ─► pick-list ─► manifest ─► courier book ─► consignment ─► timeline ─► SMS
             ──► DELIVERED ─► COD→finance, supplierEngine.processDeliveredOrder, loyalty, RFM
             ──► CANCELLED ─► stock restore (once) ─► refund? ─► finance ─► audit
             ──► RETURNED  ─► stock restore (once) ─► refund record ─► supplier adj ─► finance
```
