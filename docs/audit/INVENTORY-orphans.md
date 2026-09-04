# PHASE 1B addendum — Orphans

_Generated 2026-09-04 by `scripts/audit/build-inventory.mjs`_

## Orphan server endpoints (52 of 272)

No client file references these paths. Decide per endpoint: **(a) wire into UI**, **(b) document as internal/webhook**, **(c) flag deprecated**. Do not delete.

| Method | Path | Handler | Engines |
|---|---|---|---|
| GET | `/api/health` | server.ts:109 | - |
| POST | `/api/checkout/calculate` | server.ts:121 | - |
| POST | `/api/payments/sslcommerz/init` | server.ts:665 | serverDb, paymentService |
| POST | `/api/payments/bkash/create` | server.ts:706 | paymentService |
| POST | `/api/payments/ipn` | server.ts:754 | paymentService, serverDb |
| POST | `/api/operations/jobs/enqueue` | server.ts:953 | queueService |
| POST | `/api/operations/jobs/retry` | server.ts:962 | queueService |
| POST | `/api/operations/worker/tick` | server.ts:971 | queueService |
| POST | `/api/operations/worker/toggle` | server.ts:981 | queueService, serverDb |
| POST | `/api/operations/dlq/replay-all` | server.ts:989 | queueService |
| POST | `/api/operations/dlq/purge` | server.ts:998 | queueService |
| POST | `/api/webhooks/test-ping` | server.ts:1049 | webhookService |
| POST | `/api/notifications/whatsapp-link` | server.ts:1170 | notificationService |
| POST | `/api/notifications/sms/send` | server.ts:1197 | smsService, queueService |
| GET | `/api/inventory/stats` | server.ts:1211 | serverDb |
| GET | `/api/inventory/transactions` | server.ts:1220 | serverDb |
| GET | `/api/inventory/export` | server.ts:1303 | serverDb |
| GET | `/api/admin/returns` | server.ts:1335 | serverDb |
| POST | `/api/admin/returns/approve` | server.ts:1340 | serverDb, supplierEngine, notificationService |
| GET | `/api/admin/refunds` | server.ts:1386 | serverDb |
| POST | `/api/admin/refunds/process` | server.ts:1394 | serverDb, paymentService, notificationService |
| GET | `/api/reports/districts` | server.ts:1551 | reportService |
| GET | `/api/reports/financial-pnl` | server.ts:1565 | reportService |
| GET | `/api/reports/inventory-health` | server.ts:1575 | reportService |
| GET | `/api/reports/customer-cohorts` | server.ts:1584 | reportService |
| GET | `/api/reports/documents/invoice/:orderNumber` | server.ts:1593 | reportService |
| GET | `/api/reports/documents/manifest` | server.ts:1606 | reportService |
| POST | `/api/print/bulk` | server.ts:1754 | - |
| POST | `/api/content/upload-image` | server.ts:1851 | serverDb |
| GET | `/api/admin/audit-logs` | server.ts:1887 | serverDb |
| GET | `/api/admin/backup/export` | server.ts:1891 | serverDb |
| GET | `/api/promotions/stats` | server.ts:2508 | promotionEngine |
| GET | `/api/marketing/customers-crm` | server.ts:2683 | marketingService |
| POST | `/api/marketing/abandoned-carts/simulate` | server.ts:3007 | marketingService |
| POST | `/api/security/audit-chain/log` | server.ts:3398 | securityEngine |
| POST | `/api/security/auth/login` | server.ts:3476 | securityEngine |
| POST | `/api/security/auth/logout` | server.ts:3503 | securityEngine |
| POST | `/api/security/auth/verify` | server.ts:3515 | securityEngine |
| POST | `/api/security/auth/change-password` | server.ts:3541 | securityEngine |
| POST | `/api/security/auth/reset-password-request` | server.ts:3566 | securityEngine |
| POST | `/api/security/auth/reset-password-confirm` | server.ts:3582 | securityEngine |
| POST | `/api/security/auth/mfa-verify` | server.ts:3602 | securityEngine |
| POST | `/api/security/users/toggle-mfa` | server.ts:3620 | securityEngine |
| POST | `/api/suppliers/:id/set-portal-password` | server.ts:3875 | supplierEngine |
| PUT | `/api/suppliers/batches/:id` | server.ts:3972 | supplierEngine |
| GET | `/api/suppliers/:id/eligible-sales` | server.ts:3993 | supplierEngine |
| POST | `/api/suppliers/eligible-sales/process-order` | server.ts:4002 | supplierEngine |
| GET | `/api/suppliers/settlements/:id` | server.ts:4061 | supplierEngine |
| GET | `/api/suppliers/supply-chain/metrics` | server.ts:4141 | supplierEngine |
| POST | `/api/customer/auth/logout` | server.ts:4256 | - |
| POST | `/api/security/sessions/revoke-all-others` | server.ts:4366 | securityEngine |
| GET | `/api/system/go-live-audit` | server.ts:4668 | backupEngine, securityEngine |

## Orphan admin components (3)

| Component | File | Note |
|---|---|---|
| PromotionsAdmin | `src/admin/PromotionsAdmin.tsx` | not routed in App.tsx and not rendered by any other file |
| RefundsAdmin | `src/admin/RefundsAdmin.tsx` | not routed in App.tsx and not rendered by any other file |
| ReturnsAdmin | `src/admin/ReturnsAdmin.tsx` | not routed in App.tsx and not rendered by any other file |
