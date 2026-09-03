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
