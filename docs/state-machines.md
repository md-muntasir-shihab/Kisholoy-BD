# State Machines & Transitions

## Order States
- `PENDING`: Created, awaiting confirmation/payment.
- `CONFIRMED`: Acknowledged by store.
- `PROCESSING`: Being packed.
- `READY_TO_SHIP`: Packed, awaiting courier pickup.
- `SHIPPED`: Picked up by courier.
- `OUT_FOR_DELIVERY`: Courier is out for delivery.
- `DELIVERED`: Successfully handed to customer.
- `CANCELLED`: Cancelled by customer or admin.
- `FAILED`: E.g., stock allocation failed post-payment.
- `RETURN_REQUESTED`: Customer requested return.
- `RETURNED`: Item returned to inventory.

**Valid Transitions:**
- PENDING -> CONFIRMED, CANCELLED, FAILED
- CONFIRMED -> PROCESSING, CANCELLED
- PROCESSING -> READY_TO_SHIP, CANCELLED
- READY_TO_SHIP -> SHIPPED, CANCELLED
- SHIPPED -> OUT_FOR_DELIVERY, RETURN_REQUESTED (if rejected at door)
- OUT_FOR_DELIVERY -> DELIVERED, RETURN_REQUESTED
- DELIVERED -> RETURN_REQUESTED
- RETURN_REQUESTED -> RETURNED, DELIVERED (if return rejected)

**Invalid Transitions (Guarded):**
- DELIVERED -> CANCELLED (Cannot cancel after delivery)
- SHIPPED -> PROCESSING (Cannot go backward in fulfillment)
- CANCELLED -> DELIVERED (Terminal state)

## Payment States
- `UNPAID`: Default state.
- `PENDING`: User initiated payment, awaiting gateway response.
- `AUTHORIZED`: Gateway authorized, awaiting capture.
- `PAID`: Payment successfully captured.
- `FAILED`: Payment failed or rejected.
- `CANCELLED`: User abandoned payment.
- `REFUNDED`: Fully refunded.
- `PARTIALLY_REFUNDED`: Partially refunded.

**Valid Transitions:**
- UNPAID -> PENDING, PAID (COD delivery)
- PENDING -> AUTHORIZED, PAID, FAILED, CANCELLED
- AUTHORIZED -> PAID, FAILED, CANCELLED
- PAID -> REFUNDED, PARTIALLY_REFUNDED
- PARTIALLY_REFUNDED -> REFUNDED

**Invalid Transitions (Guarded):**
- PAID -> PENDING (Cannot un-pay)
- FAILED -> PAID (Must create new transaction/attempt)
- REFUNDED -> PAID (Terminal state)

## Settlement States (Gateway to Bank)
- `PENDING`: Awaiting settlement.
- `ELIGIBLE`: Gateway marked eligible for payout.
- `PROCESSING`: Payout initiated.
- `SETTLED`: Funds in merchant bank.
- `PARTIALLY_SETTLED`: Partial funds received.
- `ON_HOLD`: Held by gateway (e.g., dispute).
- `FAILED`: Payout failed.

## Shipment States
- `CREATED`: Label generated.
- `PICKED_UP`: Handed to courier.
- `IN_TRANSIT`: Moving between hubs.
- `AT_HUB`: At local distribution center.
- `OUT_FOR_DELIVERY`: Rider is out.
- `DELIVERED`: Customer received.
- `RETURNED`: Returned to merchant.
- `FAILED`: Delivery attempt failed (e.g., customer unreachable).
- `CANCELLED`: Shipment cancelled before pickup.

**Valid Transitions:**
- CREATED -> PICKED_UP, CANCELLED
- PICKED_UP -> IN_TRANSIT, CANCELLED
- IN_TRANSIT -> AT_HUB, RETURNED
- AT_HUB -> OUT_FOR_DELIVERY, RETURNED
- OUT_FOR_DELIVERY -> DELIVERED, FAILED
- FAILED -> OUT_FOR_DELIVERY (Retry), RETURNED

## Automation / Job States
- `PENDING`: Queued.
- `PROCESSING`: Currently running.
- `SUCCESS`: Completed successfully.
- `FAILED`: Hard failure.
- `RETRYING`: Waiting for next attempt.
- `TIMEOUT`: Exceeded execution time.
- `PARTIAL_SUCCESS`: Some sub-tasks failed.
- `MANUAL_ACTION_REQUIRED`: Max retries exceeded.
- `CANCELLED`: Interrupted.
