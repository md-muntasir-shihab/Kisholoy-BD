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
