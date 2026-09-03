# Research & Documentation

## VERIFIED
- Bangladesh Currency: BDT
- Timezone: Asia/Dhaka
- Major Couriers: Steadfast, Pathao, RedX, Paperfly.
- Payment Gateways: SSLCOMMERZ, bKash, Nagad.
- Regulatory bodies: Bangladesh Bank, NBR (National Board of Revenue), Ministry of Commerce.

## DOCUMENTED
- SSLCOMMERZ API requires Store ID and Store Password. Supports IPN (webhook) for server-side verification.
- Courier APIs (e.g., Steadfast, Pathao) require API key/secret and specific area/thana codes for delivery mapping.

## ASSUMED
- Use of PostgreSQL for relational data.
- Standard Node.js backend using Express to serve API and Vite SPA in production.
- Cloud storage (e.g., Cloudflare R2 or Firebase Storage) for product media.

## UNKNOWN
- Client's exact API credentials for payment gateways and SMS (to be configured via `.env`).
- Final NBR tax/VAT rules for specific product categories (requires compliance check at launch).
