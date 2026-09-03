# Information Architecture

## Sitemap
- / (Homepage - Dynamic Content Blocks)
- /shop (Product Listing, Filtering, Pagination)
- /product/:slug (Product Detail, Variations, Images, Related Products)
- /category/:slug (Category View, Sub-categories)
- /cart (Shopping Cart, Dynamic Totals)
- /checkout (Checkout Flow - Information, Shipping, Payment)
- /order-confirmation/:id (Order Success & Summary)
- /track-order (Public Order Tracking via Phone + Order ID)
- /account (Customer Dashboard - Protected)
  - /account/orders (History, Status, Reorder)
  - /account/returns (Initiate/Track Returns)
  - /account/addresses (Address Book)
  - /account/settings (Profile, Password)
- /pages/:slug (Static/Policy Pages - CMS Managed)

## Admin Sitemap
- /admin (Dashboard - KPI metrics, Alerts)
- /admin/products (List, Add, Edit, Variations, Media)
- /admin/categories (Tree view, Edit)
- /admin/inventory (Stock ledger, Adjustments, Low stock alerts)
- /admin/orders (Process, Print Documents, Cancel)
- /admin/customers (Profiles, Order History, Segmentation)
- /admin/payments (Transaction logs, Webhook hits)
- /admin/shipments (Courier integration, Labels, Tracking)
- /admin/returns (RMA processing, Inspections)
- /admin/refunds (Refund processing, Gateway sync)
- /admin/finance (Expenses, Settlement, Profit estimations)
- /admin/reports (Sales, Products, Customers exports)
- /admin/operations (Automation Jobs, Failed Webhooks, API Logs)
- /admin/content (Homepage Blocks, Banners, Policies, Menus)
- /admin/settings (Tax, Courier Config, Payment Config, Store Info)
- /admin/users (RBAC, Admin Roles)
- /admin/audit (System Audit Logs)
- /admin/backup (Trigger Backup, View History)

## Customer Navigation
- **Primary:** Home, Shop, Categories (Dynamic dropdown/Mega-menu), Track Order.
- **Utility:** Language Toggle (EN/BN), Global Search, Mini-Cart, Account/Login.
- **Footer:** About Us, Contact, Privacy Policy, Terms & Conditions, Return Policy, Social Links.

## Admin Navigation
- **Core Operations:** Dashboard, Orders, Products, Inventory, Customers.
- **Fulfillment & Finance:** Shipments, Payments, Returns, Refunds, Finance, Reconciliation.
- **System & CMS:** Content Management, Reports, Users/Roles, Settings, Audit Logs, Backups/DR.
