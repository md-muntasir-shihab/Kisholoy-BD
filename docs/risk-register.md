# Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payment Gateway Webhook Failure | High | Implement retry mechanism, robust error logging, and manual reconciliation tools. |
| Inventory Overselling | High | Use database transactions and pessimistic locking for stock reservations. |
| Compliance Changes (VAT/Tax) | Medium | Make tax profiles configurable via Admin rather than hardcoding. |
| Courier API Changes | Medium | Use adapter pattern for couriers to easily swap or update implementations. |
| Token Expiration / Auth Issues | Medium | Implement robust session management and clear error states for unauthorized actions. |
