# Admin Flows

## Content Publishing Flow
1. Admin navigates to `/admin/content`.
2. Admin selects a section to edit (e.g., Homepage Hero, Announcement Bar).
3. Admin inputs text (in Bangla and English) and uploads images.
4. System uploads images to Object Storage and returns URL.
5. Admin clicks 'Preview'.
6. Admin clicks 'Publish' -> Database updates `content_blocks` table.
7. Storefront immediately reflects changes (cache invalidated if applicable).

## Failure / Recovery Flow (Webhooks & Automation)
1. Webhook endpoint receives event (e.g., Payment Success).
2. If processing fails (e.g., DB deadlock, Network timeout):
   - Event logged in `webhook_events` as FAILED.
   - Automation Job created for retry.
3. Automation Job retries with exponential backoff (e.g., 1m, 5m, 15m).
4. If max retries reached -> Status MANAUL_ACTION_REQUIRED.
5. Admin views `/admin/operations` and sees Alert.
6. Admin manually resolves discrepancy (e.g., marks Order as Paid after checking Gateway dashboard) and dismisses alert.

## Inventory Adjustment & Audit Flow
1. Admin navigates to `/admin/inventory`.
2. Admin selects Product/Variant.
3. Admin clicks 'Adjust Stock'.
4. Admin enters quantity (+/-) and mandatory Reason (e.g., "Damage", "Restock").
5. System creates `inventory_transactions` record linked to Admin ID (auditable).
6. System updates `inventory_items` available quantity.
7. High-volume adjustments flag a notification for SUPER_ADMIN review.

## Order Reconciliation Flow
1. Admin navigates to `/admin/finance/reconciliation`.
2. System compares local Payment records (PAID) against Gateway API Settlement records.
3. System flags mismatches (e.g., Order marked UNPAID but Gateway shows PAID, or vice versa).
4. Admin selects a mismatch case.
5. Admin clicks "Force Sync with Gateway".
6. System verifies via server-to-server call and resolves state, appending an Audit Log.

## Manual Refund Processing Flow
1. Admin navigates to `/admin/refunds`.
2. Admin selects an approved Return or a Cancelled paid order.
3. Admin selects Refund Method (Original Gateway, Bank Transfer, Store Credit).
4. Admin inputs reference number/transaction ID.
5. System creates `refunds` record and marks Payment as `REFUNDED` or `PARTIALLY_REFUNDED`.
6. Notification sent to Customer.

## Marketing Command Center Flow (Spend → Attribution → ROI)
1. Admin opens `/admin/marketing?tab=command` (Marketing Command Center tab of the Marketing module).
2. New channels (FACEBOOK/INSTAGRAM/WHATSAPP/TELEGRAM/OTHER with page handle + UTM aliases) are registered in the Channel Registry. Status changes (PAUSE/ARCHIVE) are lifecycle events appended to a permanent status history — channels are never deleted.
3. Every boost, ad campaign, or broadcast send is logged in the Spend Ledger: period (dateFrom/dateTo), amount in BDT, impressions/clicks/sends, UTM link parameters, and notes. Entries optionally link to an existing Campaigns module campaign and a read-only Finance expense reference (link only — never written back).
4. Storefront orders are auto-tagged with first-touch `utm_source` / `utm_campaign` (plus gclid/fbclid) at creation time; the server re-sanitizes the tag as additive metadata only — money fields are untouched.
5. Attributed revenue & orders from Ads Manager, WhatsApp or Telegram reports are recorded manually. The server verifies every referenced order number against the order book and excludes claimed orders from auto-counting (no double counting). Orders placed through the WhatsApp/Messenger/Facebook desk are attributed to their registry twin via `orderSource` when no UTM tag exists.
6. The ROI engine (server-side, authoritative) computes per-channel and per-campaign totals — spend, attributed revenue, orders, ROAS, ROI%, CPO, cost/click, cost/conversation — plus monthly summaries. The dashboard renders tables & charts in Bangla/English, light/dark, responsive; the client performs no financial math.
7. The Finance Reconciliation panel compares the marketing ledger against Finance MARKETING expenses strictly read-only and shows the unlogged gap. Nothing is auto-posted from this module to Finance.
8. Corrections follow history-preserving rules: spend entries can be amended (immutable amendment trail per edit) or VOIDED with a mandatory reason; voided entries are excluded from math but retained everywhere else. Every mutation lands in the chained audit log (`MC_*` actions).
9. Reports export as CSV (channel ROI, campaign ROI, spends, attributions + auto-tagged orders, monthly summary, registry) generated server-side with UTF-8 BOM for Bangla Excel.
10. API auto-import (Meta Conversion API, WhatsApp Business Cloud API, Telegram Bot API) is exposed only as FUTURE/OPTIONAL connectors with `autoSyncImplemented: false` — no simulated or fabricated sync data is ever produced.

## Staff / Customer / Supplier Sign-in Flow (security audit)
1. **Storefront customer** — `CustomerAuthModal`/`AccountPage` → `POST /api/customer/auth/login` (email or BD phone + password; uniform 401 on any mismatch) → server issues a `PortalSession` token (`ksh-cust-sess-…`, 7-day TTL) stored in `localStorage['ksh_customer_token']`. Every later `/api/customer/*` call carries it as `Authorization: Bearer …` (auto-attached by `src/lib/apiAuth.ts`); requests for another customer's ids 403, and a password change kills all other devices' sessions.
2. **Supplier portal** — `SupplierLoginPage` → `POST /api/suppliers/portal/login` (password ALWAYS required; sealed scrypt check) → token `ksh-sup-sess-…` (12h). Dashboard/profile/password calls derive the supplier solely from the token; admin "Open Live Vendor Hub" goes through the audited `portal-impersonate` route instead of forging a token.
3. **Admin staff** — `/admin/*` renders `StaffLoginGate` first: verify any stored `sessionStorage['ksh_staff_token']` via `/api/security/auth/verify`, otherwise the login card (email + password; bootstrap password = `KISHOLOY_ADMIN_INIT_PASSWORD` or console-printed one-time value) → server `AdminSession`. The topbar sign-out button revokes the session server-side. Server RBAC tiers then govern every admin API: finance→`SUPER_ADMIN/ADMIN/FINANCE`, orders/returns/refunds→+`ORDER_MANAGER/SUPPORT`, security users/RBAC/backup→`SUPER_ADMIN(/ADMIN)`. A 401 anywhere re-locks the gate automatically.
