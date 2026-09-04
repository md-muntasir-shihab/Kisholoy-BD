# PHASE 1B addendum — Orphans

_Generated 2026-09-04 by `scripts/audit/build-inventory.mjs`_

## Orphan server endpoints (52 of 272)

No client file references these paths. Decide per endpoint: **(a) wire into UI**, **(b) document as internal/webhook**, **(c) flag deprecated**. Do not delete.

| Method | Path | Handler | Engines | Classification |
|---|---|---|---|---|
| GET | `/api/health` | server.ts:109 | - | EXTERNAL/INFRA by design — document, do not wire |
| POST | `/api/checkout/calculate` | server.ts:121 | - | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/payments/sslcommerz/init` | server.ts:665 | serverDb, paymentService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/payments/bkash/create` | server.ts:706 | paymentService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/payments/ipn` | server.ts:754 | paymentService, serverDb | EXTERNAL/INFRA by design — document, do not wire |
| POST | `/api/operations/jobs/enqueue` | server.ts:953 | queueService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/operations/jobs/retry` | server.ts:962 | queueService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/operations/worker/tick` | server.ts:971 | queueService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/operations/worker/toggle` | server.ts:981 | queueService, serverDb | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/operations/dlq/replay-all` | server.ts:989 | queueService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/operations/dlq/purge` | server.ts:998 | queueService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/webhooks/test-ping` | server.ts:1049 | webhookService | EXTERNAL/INFRA by design — document, do not wire |
| POST | `/api/notifications/whatsapp-link` | server.ts:1170 | notificationService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/notifications/sms/send` | server.ts:1197 | smsService, queueService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/inventory/stats` | server.ts:1211 | serverDb | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/inventory/transactions` | server.ts:1220 | serverDb | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/inventory/export` | server.ts:1303 | serverDb | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/admin/returns` | server.ts:1335 | serverDb | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/admin/returns/approve` | server.ts:1340 | serverDb, supplierEngine, notificationService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/admin/refunds` | server.ts:1386 | serverDb | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/admin/refunds/process` | server.ts:1394 | serverDb, paymentService, notificationService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/reports/districts` | server.ts:1551 | reportService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/reports/financial-pnl` | server.ts:1565 | reportService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/reports/inventory-health` | server.ts:1575 | reportService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/reports/customer-cohorts` | server.ts:1584 | reportService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/reports/documents/invoice/:orderNumber` | server.ts:1593 | reportService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/reports/documents/manifest` | server.ts:1606 | reportService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/print/bulk` | server.ts:1754 | - | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/content/upload-image` | server.ts:1851 | serverDb | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/admin/audit-logs` | server.ts:1887 | serverDb | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/admin/backup/export` | server.ts:1891 | serverDb | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/promotions/stats` | server.ts:2508 | promotionEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/marketing/customers-crm` | server.ts:2683 | marketingService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/marketing/abandoned-carts/simulate` | server.ts:3007 | marketingService | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/security/audit-chain/log` | server.ts:3398 | securityEngine | EXTERNAL/INFRA by design — document, do not wire |
| POST | `/api/security/auth/login` | server.ts:3476 | securityEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/security/auth/logout` | server.ts:3503 | securityEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/security/auth/verify` | server.ts:3515 | securityEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/security/auth/change-password` | server.ts:3541 | securityEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/security/auth/reset-password-request` | server.ts:3566 | securityEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/security/auth/reset-password-confirm` | server.ts:3582 | securityEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/security/auth/mfa-verify` | server.ts:3602 | securityEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/security/users/toggle-mfa` | server.ts:3620 | securityEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/suppliers/:id/set-portal-password` | server.ts:3875 | supplierEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| PUT | `/api/suppliers/batches/:id` | server.ts:3972 | supplierEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/suppliers/:id/eligible-sales` | server.ts:3993 | supplierEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/suppliers/eligible-sales/process-order` | server.ts:4002 | supplierEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/suppliers/settlements/:id` | server.ts:4061 | supplierEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/suppliers/supply-chain/metrics` | server.ts:4141 | supplierEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/customer/auth/logout` | server.ts:4256 | - | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| POST | `/api/security/sessions/revoke-all-others` | server.ts:4366 | securityEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |
| GET | `/api/system/go-live-audit` | server.ts:4668 | backupEngine, securityEngine | UNSURFACED capability — decide: wire into UI, or mark deprecated |

## Orphan admin components (3)

| Component | File | Note |
|---|---|---|
| PromotionsAdmin | `src/admin/PromotionsAdmin.tsx` | not routed in App.tsx and not rendered by any other file |
| RefundsAdmin | `src/admin/RefundsAdmin.tsx` | not routed in App.tsx and not rendered by any other file |
| ReturnsAdmin | `src/admin/ReturnsAdmin.tsx` | not routed in App.tsx and not rendered by any other file |
