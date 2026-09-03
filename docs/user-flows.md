# User Flows

## Checkout Flow (Guest & Authenticated)
1. User adds items to Cart.
2. User proceeds to Checkout.
3. Auth Check:
   - If Authenticated: Load saved addresses and preferences.
   - If Guest: Prompt for Mobile Number / OTP or quick Guest Details (Name, Phone).
4. User enters/selects Shipping Address (Division, District, Thana).
5. System validates Serviceable Area and calculates Shipping Cost and Taxes.
6. User selects Payment Method (COD, Online/SSLCOMMERZ).
7. Pre-flight check: System reserves stock (Transactional).
8. Order Placed -> Order Confirmation Page (if COD) or Redirect to Gateway (if Online).

## Order Flow (Customer Perspective)
1. Order Placed (PENDING).
2. Customer receives Order Confirmation via SMS/Email (CONFIRMED).
3. Order moves to Processing (PROCESSING) when warehouse starts packing.
4. Order handed to Courier (SHIPPED) with Tracking Link sent to Customer.
5. Order Delivered (DELIVERED) and Review Prompt sent.

## Payment Flow (Online / Gateway)
1. User selects Online Payment.
2. Order created with UNPAID status.
3. User redirected to Payment Gateway (SSLCOMMERZ/bKash).
4. Gateway processes payment.
5. User redirected back to Storefront (Success/Fail URL).
6. CRITICAL: Server receives IPN/Webhook in background.
7. Server verifies payment signature, amount, and currency.
8. System records `payment_transactions` and updates Order status to PAID.

## Shipping Flow (Fulfillment)
1. Admin packs order and requests Courier booking (e.g., Steadfast/Pathao).
2. System sends API request to Courier with delivery details.
3. Courier returns Consignment/Tracking ID.
4. System generates PDF Shipping Label + Barcode.
5. System updates Order to SHIPPED.
6. System polls Courier Webhook/Status API.
7. Courier marks DELIVERED -> System automatically updates Order to DELIVERED.

## Return / Refund Flow
1. Customer initiates Return from Account Dashboard or via Support within 7 days.
2. Admin reviews and approves Return -> Courier reverse pickup scheduled.
3. Item received at warehouse -> Admin inspects condition.
4. If accepted: System triggers Refund (Gateway Reversal or Bank Transfer).
5. System records `inventory_transactions` (restock/damage).
6. Order marked as RETURNED, Payment marked as REFUNDED.

## Order Cancellation Flow
1. Customer clicks "Cancel Order" (Only available if status is PENDING or CONFIRMED).
2. System prompts for Reason.
3. System reverses stock reservation (releases inventory).
4. If payment was made, system automatically queues a Refund task.
5. Order marked as CANCELLED, notification sent.
