/**
 * Declarative route → permission map.
 *
 * PHASE 4 batch 2 put a blanket staff gate on the API: any signed-in staffer
 * could call any endpoint, so a SUPPORT rep could delete products or a
 * MODERATOR could mint SUPER_ADMIN users. This table completes S1-1 by giving
 * every guarded surface the permission it actually requires.
 *
 * It is a table rather than 164 hand-annotated `requirePermission(...)` calls
 * because a table can be reviewed in one screen, cannot drift out of order with
 * the route list, and lets an unmatched route fail closed.
 *
 * Matching: first rule whose method matches and whose path regex matches wins.
 * Permission strings are resolved by `securityEngine.hasPermission`, which
 * understands both the coarse `DOMAIN_ACTION` names and the fine
 * `domain:action` / `domain:*` forms.
 *
 * @license Apache-2.0
 */

export interface RoutePermissionRule {
  /** HTTP methods this rule covers. `*` means any. */
  methods: '*' | string[];
  /** Path matcher, tested against `req.path`. */
  pattern: RegExp;
  /** Permission required, or `null` to require only a staff session. */
  permission: string | null;
  /** Short reason, surfaced in audit rows to explain a denial. */
  note?: string;
}

const READ = ['GET', 'HEAD'];
const WRITE = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const ROUTE_PERMISSIONS: RoutePermissionRule[] = [
  // ---- Security & identity: the crown jewels -------------------------------
  // Creating users or editing RBAC is SUPER_ADMIN-only in practice; the '*'
  // wildcard is the only permission that satisfies SECURITY_ADMIN.
  { methods: WRITE, pattern: /^\/api\/security\/(users|rbac|roles)/, permission: 'SECURITY_ADMIN', note: 'staff account & role administration' },
  { methods: WRITE, pattern: /^\/api\/security\/sessions\/revoke/, permission: 'SECURITY_ADMIN', note: 'session revocation' },
  { methods: WRITE, pattern: /^\/api\/security\//, permission: 'SECURITY_ADMIN', note: 'security configuration' },
  { methods: READ, pattern: /^\/api\/security\/audit/, permission: 'audit:read', note: 'audit ledger' },
  { methods: READ, pattern: /^\/api\/security\//, permission: 'SECURITY_ADMIN', note: 'security surface' },

  // ---- System, backup & disaster recovery ----------------------------------
  { methods: WRITE, pattern: /^\/api\/system\//, permission: 'SYSTEM_ADMIN', note: 'backup / restore / export' },
  { methods: READ, pattern: /^\/api\/system\//, permission: 'SYSTEM_ADMIN', note: 'system diagnostics' },

  // ---- Finance -------------------------------------------------------------
  { methods: WRITE, pattern: /^\/api\/finance\/(expenses|settlements)/, permission: 'EXPENSE_MANAGE', note: 'expense & settlement entry' },
  { methods: WRITE, pattern: /^\/api\/finance\//, permission: 'finance:settle' },
  { methods: READ, pattern: /^\/api\/finance\//, permission: 'finance:read' },
  { methods: WRITE, pattern: /^\/api\/payments\/refund/, permission: 'REFUND_PROCESS', note: 'issuing money back' },
  { methods: WRITE, pattern: /^\/api\/payments\//, permission: 'PAYMENT_RECORD' },
  { methods: READ, pattern: /^\/api\/payments\//, permission: 'PAYMENT_VIEW' },

  // ---- Catalog -------------------------------------------------------------
  { methods: ['DELETE'], pattern: /^\/api\/products/, permission: 'PRODUCT_DELETE' },
  { methods: ['POST'], pattern: /^\/api\/products/, permission: 'PRODUCT_CREATE' },
  { methods: ['PUT', 'PATCH'], pattern: /^\/api\/products/, permission: 'PRODUCT_UPDATE' },
  { methods: READ, pattern: /^\/api\/products/, permission: null, note: 'storefront read' },
  { methods: WRITE, pattern: /^\/api\/categories/, permission: 'catalog:write' },
  { methods: READ, pattern: /^\/api\/categories/, permission: null, note: 'storefront read' },

  // ---- Inventory & warehouses ---------------------------------------------
  { methods: WRITE, pattern: /^\/api\/inventory\//, permission: 'INVENTORY_ADJUST' },
  { methods: READ, pattern: /^\/api\/inventory\//, permission: 'INVENTORY_VIEW' },
  { methods: WRITE, pattern: /^\/api\/warehouses/, permission: 'warehouses:*' },
  { methods: READ, pattern: /^\/api\/warehouses/, permission: 'INVENTORY_VIEW' },

  // ---- Orders, fulfilment, shipping ---------------------------------------
  { methods: WRITE, pattern: /^\/api\/orders\/[^/]+\/cancel/, permission: 'ORDER_CANCEL' },
  { methods: WRITE, pattern: /^\/api\/orders\//, permission: 'ORDER_UPDATE' },
  { methods: READ, pattern: /^\/api\/orders/, permission: 'ORDER_VIEW' },
  { methods: WRITE, pattern: /^\/api\/fulfillment\//, permission: 'orders:dispatch' },
  { methods: READ, pattern: /^\/api\/fulfillment\//, permission: 'ORDER_VIEW' },
  { methods: WRITE, pattern: /^\/api\/courier\//, permission: 'orders:dispatch' },
  { methods: READ, pattern: /^\/api\/courier\//, permission: 'ORDER_VIEW' },
  { methods: WRITE, pattern: /^\/api\/operations\//, permission: 'ORDER_UPDATE' },
  { methods: READ, pattern: /^\/api\/operations\//, permission: 'ORDER_VIEW' },

  // ---- Suppliers & purchasing ---------------------------------------------
  // Minting a portal token is impersonation, not vendor bookkeeping. It must
  // NOT fall under SUPPLIER_MANAGE, which INVENTORY_MANAGER holds via
  // 'suppliers:write' so it can receive stock. Require the security authority.
  { methods: WRITE, pattern: /^\/api\/suppliers\/[^/]+\/portal-token/, permission: 'SECURITY_ADMIN', note: 'vendor impersonation' },
  { methods: WRITE, pattern: /^\/api\/suppliers\/.*\/(pos|purchase-orders)/, permission: 'PURCHASE_CREATE' },
  { methods: WRITE, pattern: /^\/api\/suppliers\/.*settlement/, permission: 'suppliers:pay', note: 'paying a vendor' },
  { methods: WRITE, pattern: /^\/api\/suppliers/, permission: 'SUPPLIER_MANAGE' },
  { methods: READ, pattern: /^\/api\/suppliers/, permission: 'SUPPLIER_VIEW' },

  // ---- Customers -----------------------------------------------------------
  { methods: WRITE, pattern: /^\/api\/customers/, permission: 'CUSTOMER_UPDATE' },
  { methods: READ, pattern: /^\/api\/customers/, permission: 'CUSTOMER_VIEW' },

  // ---- Fraud & risk --------------------------------------------------------
  { methods: WRITE, pattern: /^\/api\/fraud\//, permission: 'SECURITY_ADMIN', note: 'blacklist & risk policy' },
  { methods: READ, pattern: /^\/api\/fraud\//, permission: 'ORDER_VIEW' },

  // ---- Marketing, promotions, content -------------------------------------
  { methods: WRITE, pattern: /^\/api\/marketing\//, permission: 'marketing:*' },
  { methods: READ, pattern: /^\/api\/marketing\//, permission: 'marketing:*' },
  { methods: WRITE, pattern: /^\/api\/promotions/, permission: 'marketing:*' },
  { methods: WRITE, pattern: /^\/api\/content/, permission: 'CONTENT_MANAGE' },
  { methods: WRITE, pattern: /^\/api\/notifications\//, permission: 'communications:send' },

  // ---- Reporting -----------------------------------------------------------
  { methods: READ, pattern: /^\/api\/reports/, permission: 'REPORT_VIEW' },

  // ---- Settings & webhooks -------------------------------------------------
  { methods: WRITE, pattern: /^\/api\/settings/, permission: 'SETTINGS_MANAGE' },
  { methods: READ, pattern: /^\/api\/settings/, permission: 'SETTINGS_VIEW' },
  { methods: WRITE, pattern: /^\/api\/webhooks\/(endpoints|config)/, permission: 'SETTINGS_MANAGE' },
];

/**
 * Resolve the permission required for a request, or `undefined` when no rule
 * matches (caller decides the default).
 */
export function requiredPermissionFor(method: string, path: string): RoutePermissionRule | undefined {
  const m = method.toUpperCase();
  return ROUTE_PERMISSIONS.find(
    (r) => (r.methods === '*' || r.methods.includes(m)) && r.pattern.test(path)
  );
}
