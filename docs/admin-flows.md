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
