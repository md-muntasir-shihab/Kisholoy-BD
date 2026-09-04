# Architecture Decision Log

## 1. Stack Selection
- **Frontend:** React 19 (Vite) + Tailwind CSS 4.
- **Backend:** Express.js (Node.js).
- **Database:** PostgreSQL (using Drizzle ORM or Prisma).

## 2. Payment Architecture
- Separate payment success from redirect; rely on IPN/Webhook for confirmation.
- Implement a generic `PaymentService` interface.

## 3. Localization
- Bilingual (Bangla/English) support via i18n context.
- Bangla-specific web fonts for optimal rendering.

## 4. State Management
- React Context for lightweight global state (Auth, Cart, UI).
- Server state using SWR or React Query if needed, otherwise fetch directly.

## 5. Security & Validation
- Validate all financial and cart operations on the backend.
- Role-Based Access Control (RBAC) middleware for admin routes.

## 6. Marketing Command Center (MC Phases)
- Own in-memory ledger (`server/marketingCommandCenter.ts`) parallel to Finance: marketing spend (AD/BOOST/SEND) is logged in its own registry-backed ledger and is NEVER auto-posted to, or mutated in, the Finance module. A read-only reconciliation endpoint mirrors Finance's MARKETING category for gap analysis only.
- Attribution policy: Orders are tagged additively with first-touch UTM metadata at creation time (`utm` field, sanitized server-side); revenue attribution is derived server-side from these tags plus manual entries. Manual attribution entries claim their order numbers so auto-counting skips them (no double counting). Order money fields are never rewritten.
- History retention: no hard deletes anywhere in the module — spend entries are VOIDED (then immutable), channels are ARCHIVED, and every mutation appends to the chained audit log plus per-entry amendment trails.
- All ROI math (ROAS, ROI%, CPO, cost/click, cost/conversation, monthly buckets) is computed by the engine; the admin UI only renders engine output.
- API auto-sync (Meta CAPI / WhatsApp Business Cloud / Telegram Bot) is registered as FUTURE connectors with `autoSyncImplemented: false` — no simulated imports are ever generated.

## 7. Security, Auth & Delivery Data Flow (Audit Phases 1–6)
- Password storage: all three principal types (staff, storefront customers, supplier portal) share ONE hashing pipeline — `server/passwordHash.ts`, scrypt with OWASP parameters (N=2^15, r=8, p=1, 64-byte key) and per-account random salts. scrypt ships inside `node:crypto`; argon2/bcrypt npm packages were rejected deliberately to avoid native deps against this repo's `bun.lock` (CI cannot regenerate it in the sandbox) while keeping the OWASP posture identical in class.
- No built-in public credentials: the previous hard-coded defaults ('Kisholoy@2026!', shared fixed salt, 'KisholoyStaff@2026') and the pre-authenticated 4-hour `SUPER_ADMIN` boot session token are removed. Staff bootstrap password = `KISHOLOY_ADMIN_INIT_PASSWORD` env, else a random one-time password printed to the server console; new staff accounts get a random one-time password returned exactly once by `POST /api/security/users/create`. The supplier `kisholoy2026` value survives only as hashed SEED data for the five demo portals, and the universal-fallback comparison is gone.
- Sessions are server-side state only (`securityEngine`): staff `AdminSession` plus a unified `PortalSession` store (`CUSTOMER` 7d / `SUPPLIER` 12h TTLs) with random 192-bit tokens. Tokens are the single identity source for `/api/customer/*`, `/api/suppliers/portal/*` and staff-guarded routes; query/body `customerId`/`supplierId` can never widen access (IDOR closure) and mismatched claims 403. Password change revokes all other sessions of that principal (zero-trust hygiene).
- RBAC enforcement moved server-side (audit C7): a middleware chokepoint in `server.ts` applies `verifySession` + role tiers to `/api/admin`, `/api/security` (except login/verify/reset public pair), `/api/finance`, `/api/customers`, `/api/suppliers` (except portal), `/api/orders` (mutations; GET list = staff or customer-scoped) and `/api/marketing/command`. The client-side role persona switcher remains a UI preview device only — it grants nothing. `skipOldCheck` is no longer client-controlled: the old-password override applies only when an authenticated `SUPER_ADMIN` session resets ANOTHER user's password.
- Frontend token transport: `src/lib/apiAuth.ts` wraps `window.fetch` ONCE (instead of rewriting ~24 call sites) to attach the right bearer per path family, broadcasts `kisholoy-auth-expired` on 401, and `StaffLoginGate` locks `/admin/*` behind a real verified login. Supplier portal impersonation by admins is an audited, short-lived server-issued session (`POST /api/suppliers/:id/portal-impersonate`), not a fabricated token string.
- Delivery data flow (audit C10–C12): courier bookings resolve the recipient from `shippingAddress` (`firstName/lastName/phone`, gift/third-party deliveries) and fall back to the purchasing customer only when absent; booking responses echo the exact recipient identity sent. Orders validate + canonicalize BD mobile numbers (`01X…`/`8801X…`/`+8801X…` → `+8801XXXXXXXXX`) for both customer and recipient at creation, and reject malformed postal codes/thana strings. Blacklist/COD-duplicate comparisons normalize both sides, so stored canonical forms change no business outcomes.
- Additional backdoors closed beyond the audit list: empty-password supplier login acceptance, `portalAccess.password` plaintext leaking in login/dashboard/portal-leaving responses, the master reset OTP `'998877'`, and the `verifySession` root-token special case. `simulatedOtp` on staff reset stays dev-only (`NODE_ENV !== 'production'` gate that already existed).
- Scope discipline: no finance/order money logic changed (ROI & ledger suites re-verified identical after the guards); history is untouched; MFA remains the pre-existing documented simulation (FUTURE), no OAuth, no new frameworks (per the audit's own guidance to harden `securityEngine` rather than adopt one).
