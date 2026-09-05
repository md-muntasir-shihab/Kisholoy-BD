import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, testFirestoreConnection } from '../lib/firebase';
import { 
  Language, Role, Product, Category, CartItem, Order, OrderStatus, 
  Customer, InventoryTransaction, ExpenseRecord, AutomationJob, 
  AuditLog, SiteContent, SettlementRecord, SettlementStatus, ContentRevision,
  BatchRestockPayload,
  WarehouseHub, WarehouseStockItem, StockTransferOrder, RoutingRuleConfig,
  PickList, DispatchManifest, FulfillmentRoutingDecision,
  CustomerAddress, WishlistItem, CustomerReturnRequest, CustomerProfile, CustomerLoyaltyWallet,
  CustomerNotification, CustomCourierConfig
} from '../types';
import { logAuthEvent } from '../utils/telemetryLogger';
import { apiFetch, apiFetchJson, setCustomerToken } from '../lib/apiClient';
import { 
  INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_ORDERS, 
  INITIAL_CUSTOMERS, INITIAL_CONTENT, INITIAL_AUDIT_LOGS, 
  INITIAL_EXPENSES, INITIAL_AUTOMATION_JOBS, INITIAL_SETTLEMENTS,
  INITIAL_CONTENT_REVISIONS, INITIAL_INVENTORY_TRANSACTIONS,
  INITIAL_WAREHOUSES, INITIAL_WAREHOUSE_STOCKS, INITIAL_STOCK_TRANSFERS,
  INITIAL_ROUTING_RULES, INITIAL_PICK_LISTS, INITIAL_DISPATCH_MANIFESTS,
  INITIAL_CUSTOMER_ADDRESSES, INITIAL_WISHLISTS, INITIAL_CUSTOMER_RETURNS, INITIAL_CUSTOMER_PROFILES,
  INITIAL_LOYALTY_WALLETS, INITIAL_CUSTOMER_NOTIFICATIONS
} from '../data/mockData';

export type ThemePreference = 'light' | 'dark' | 'system';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
  
  // Products & Categories
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => Promise<boolean>;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => Promise<boolean>;
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variantId?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  
  // Orders
  orders: Order[];
  refreshOrders: () => Promise<void>;
  syncServerOrder: (order: Order) => void;
  createOrder: (orderData: {
    customer: { name: string; phone: string; email?: string };
    shippingAddress: Order['shippingAddress'];
    paymentMethod: Order['paymentMethod'];
    items: Order['items'];
    shippingFee: number;
    discount?: number;
    notes?: string;
    fraudRisk?: Order['fraudRisk'];
    id?: string;
    orderNumber?: string;
    orderStatus?: Order['orderStatus'];
  }) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
  dispatchCourier: (orderId: string, courierName: string, customTrackingId?: string) => void;

  // Visual Custom Couriers Management
  customCouriers: CustomCourierConfig[];
  addCustomCourier: (courier: Omit<CustomCourierConfig, 'id'>) => void;
  updateCustomCourier: (id: string, updates: Partial<CustomCourierConfig>) => void;
  deleteCustomCourier: (id: string) => void;
  toggleCustomCourier: (id: string) => void;

  // Hubs & Fulfillment Mode (Optional vs Mandatory)
  isFulfillmentOptional: boolean;
  setIsFulfillmentOptional: (val: boolean) => void;
  
  // Customers
  customers: Customer[];
  updateCustomerStatus: (id: string, status: 'ACTIVE' | 'BLOCKED', reason?: string) => Promise<boolean>;
  addAdminCustomer: (customerData: { name: string; phone: string; email?: string; address?: string; district?: string; thana?: string }) => Promise<Customer | null>;
  
  // Inventory
  inventoryTransactions: InventoryTransaction[];
  adjustInventory: (productId: string, quantityChange: number, reason: string, options?: { warehouseLocation?: string; batchNumber?: string; notes?: string; unitCost?: number }) => Promise<boolean>;
  adjustStock: (productId: string, quantityChange: number, reason: string) => void;
  batchRestock: (payload: BatchRestockPayload) => Promise<boolean>;
  
  // Finance & Expenses & Settlements
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id'> | ExpenseRecord) => void;
  deleteExpense: (id: string) => void;
  settlements: SettlementRecord[];
  addSettlement: (settlement: Omit<SettlementRecord, 'id'>) => void;
  updateSettlementStatus: (id: string, status: SettlementStatus, utr?: string) => void;
  
  // Automation & Audit
  automationJobs: AutomationJob[];
  retryAutomationJob: (jobId: string) => void;
  auditLogs: AuditLog[];
  logAudit: (action: string, resource: string, detailsOrId: string, details?: string) => void;
  addAuditLog: (action: string, resource: string, resourceId: string, details: string) => void;
  
  // Content CMS
  siteContent: SiteContent;
  updateSiteContent: (updates: Partial<SiteContent>, summary?: string) => void;
  publishSiteContent: (content: SiteContent, summary?: string) => Promise<boolean>;
  contentRevisions: ContentRevision[];
  restoreContentRevision: (revisionId: string) => Promise<boolean>;

  // Multi-Warehouse, Hub Routing & Advanced Fulfillment
  warehouses: WarehouseHub[];
  warehouseStocks: WarehouseStockItem[];
  stockTransfers: StockTransferOrder[];
  routingRules: RoutingRuleConfig[];
  pickLists: PickList[];
  dispatchManifests: DispatchManifest[];
  saveWarehouse: (warehouseData: Partial<WarehouseHub> & { name: string; division: any; district: string }) => Promise<WarehouseHub | null>;
  toggleWarehouse: (id: string, active: boolean) => Promise<boolean>;
  updateBinLocation: (params: { stockId: string; aisle: string; shelf: string; bin: string; reorderLevel?: number; reorderQuantity?: number }) => Promise<boolean>;
  createStockTransfer: (params: { sourceWarehouseId: string; destinationWarehouseId: string; items: { productId: string; sku: string; productTitle: string; quantityRequested: number; unitCost: number; notes?: string }[]; carrier?: string; notes?: string }) => Promise<StockTransferOrder | null>;
  approveStockTransfer: (id: string) => Promise<boolean>;
  dispatchStockTransfer: (params: { transferId: string; trackingOrGatePass?: string; carrier?: string }) => Promise<boolean>;
  receiveStockTransfer: (params: { transferId: string; notes?: string }) => Promise<boolean>;
  generatePickList: (params: { warehouseId: string; orderIds: string[]; assignedPicker?: string }) => Promise<PickList | null>;
  togglePickItem: (pickListId: string, sku: string, picked: boolean) => Promise<boolean>;
  generateDispatchManifest: (params: { warehouseId: string; courier: DispatchManifest['courier']; orderIds: string[]; driverName?: string; driverPhone?: string; vehicleNumber?: string }) => Promise<DispatchManifest | null>;
  handoverManifest: (manifestId: string) => Promise<boolean>;
  routeOrderSimulation: (order: Order) => Promise<FulfillmentRoutingDecision | null>;

  // Customer Account Portal & Wishlists (Phase 15)
  currentCustomerId: string;
  setCurrentCustomerId: (id: string) => void;
  loginCustomer: (customerId: string, profile?: CustomerProfile, sessionToken?: string | null) => void;
  logoutCustomer: () => void;
  customerProfile: CustomerProfile | null;
  savedAddresses: CustomerAddress[];
  wishlist: WishlistItem[];
  returnRequests: CustomerReturnRequest[];
  customerLoyalty: CustomerLoyaltyWallet | null;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isWishlisted: (productId: string) => boolean;
  saveAddress: (address: Omit<CustomerAddress, 'id' | 'createdAt' | 'customerId'> & { id?: string }) => Promise<boolean>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  updateCustomerProfile: (updates: Partial<CustomerProfile>) => Promise<boolean>;
  submitReturnRequest: (data: Omit<CustomerReturnRequest, 'id' | 'requestNumber' | 'status' | 'createdAt' | 'updatedAt' | 'customerId' | 'customerPhone'>) => Promise<boolean>;
  
  // Customer Notifications & Communication (Phase 16)
  customerNotifications: CustomerNotification[];
  unreadNotificationsCount: number;
  markCustomerNotificationRead: (id: string) => Promise<boolean>;
  markAllCustomerNotificationsRead: () => Promise<boolean>;
  fetchCustomerNotifications: () => Promise<void>;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msgOrType: string, msgOptional?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('EN');
  const [currentRole, setCurrentRole] = useState<Role>('SUPER_ADMIN');
  // ---------------- Theme (Light / Dark) Default: Day Theme ----------------
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kisholoy-theme');
      const valid: ThemePreference[] = ['light', 'dark', 'system'];
      if (saved && valid.includes(saved as ThemePreference)) return saved as ThemePreference;
      const legacy = localStorage.getItem('theme');
      if (legacy) return legacy === 'dark' ? 'dark' : 'light';
      return 'system';
    }
    return 'light';
  });
  const [systemDark, setSystemDark] = useState<boolean>(false);

  const isDarkMode = theme === 'dark' || (theme === 'system' && systemDark);

  // Keep the resolved theme applied without a page reload.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    try {
      localStorage.setItem('kisholoy-theme', theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme, isDarkMode]);

  // Follow the OS preference when on "system".
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = (t: ThemePreference) => setThemeState(t);
  const toggleDarkMode = () => setThemeState(isDarkMode ? 'light' : 'dark');
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [settlements, setSettlements] = useState<SettlementRecord[]>(INITIAL_SETTLEMENTS);
  const [automationJobs, setAutomationJobs] = useState<AutomationJob[]>(INITIAL_AUTOMATION_JOBS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [siteContent, setSiteContent] = useState<SiteContent>(INITIAL_CONTENT);
  const [contentRevisions, setContentRevisions] = useState<ContentRevision[]>(INITIAL_CONTENT_REVISIONS);
  
  // Phase 13: Multi-Warehouse, STO, Pick Lists & Manifests
  const [warehouses, setWarehouses] = useState<WarehouseHub[]>(INITIAL_WAREHOUSES);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStockItem[]>(INITIAL_WAREHOUSE_STOCKS);
  const [stockTransfers, setStockTransfers] = useState<StockTransferOrder[]>(INITIAL_STOCK_TRANSFERS);
  const [routingRules, setRoutingRules] = useState<RoutingRuleConfig[]>(INITIAL_ROUTING_RULES);
  const [pickLists, setPickLists] = useState<PickList[]>(INITIAL_PICK_LISTS);
  const [dispatchManifests, setDispatchManifests] = useState<DispatchManifest[]>(INITIAL_DISPATCH_MANIFESTS);

  // Phase 15: Customer Account Portal, Wishlists & Self-Service
  const [currentCustomerId, setCurrentCustomerId] = useState<string>('cust-1');
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(INITIAL_CUSTOMER_PROFILES[0] || null);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>(INITIAL_CUSTOMER_ADDRESSES.filter(a => a.customerId === 'cust-1'));
  const [wishlist, setWishlist] = useState<WishlistItem[]>(INITIAL_WISHLISTS.filter(w => w.customerId === 'cust-1'));
  const [returnRequests, setReturnRequests] = useState<CustomerReturnRequest[]>(INITIAL_CUSTOMER_RETURNS.filter(r => r.customerId === 'cust-1'));
  const [customerLoyalty, setCustomerLoyalty] = useState<CustomerLoyaltyWallet | null>(INITIAL_LOYALTY_WALLETS.find(w => w.customerId === 'cust-1') || null);
  
  // Phase 16: Customer In-App Notifications & Multi-Channel Communications
  const [customerNotifications, setCustomerNotifications] = useState<CustomerNotification[]>(
    INITIAL_CUSTOMER_NOTIFICATIONS.filter(n => n.customerId === 'cust-1')
  );
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync content and fulfillment data with backend API on mount
  useEffect(() => {
    const safeFetchJson = (url: string) =>
      fetch(url)
        .then(r => r.ok && (r.headers.get('content-type') || '').includes('application/json') ? r.json() : null)
        .catch(() => null);

    safeFetchJson('/api/content').then(data => {
      if (data?.success && data.content) {
        setSiteContent(data.content);
      }
    });

    safeFetchJson('/api/content/revisions').then(data => {
      if (data?.success && data.revisions) {
        setContentRevisions(data.revisions);
      }
    });


    // Sync authoritative products catalog from server API
    safeFetchJson('/api/products').then(data => {
      if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      }
    });

    // Sync categories from server API
    safeFetchJson('/api/categories').then(data => {
      if (data?.success && Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      }
    });

    // Sync warehouses
    safeFetchJson('/api/warehouses').then(data => {
      if (data?.success && Array.isArray(data.warehouses)) {
        setWarehouses(data.warehouses);
      }
    });

    // Sync stock matrix
    safeFetchJson('/api/warehouses/stock-matrix').then(data => {
      if (data?.success && Array.isArray(data.matrix)) {
        setWarehouseStocks(data.matrix);
      }
    });

    // Sync the authoritative inventory ledger. Without this the admin
    // Inventory screen rendered the mock seed forever, so real stock movements
    // (sales, restocks, adjustments) were invisible to operators.
    safeFetchJson('/api/inventory/transactions').then(data => {
      if (data?.success && Array.isArray(data.transactions)) {
        setInventoryTransactions(data.transactions);
      }
    });

    // Sync the CRM customer directory so every consumer of `customers`
    // (dashboards, Customer 360 links, fraud/marketing cross-references)
    // sees server truth rather than the seeded list.
    safeFetchJson('/api/customers').then(data => {
      if (data?.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
    });

    // Sync STOs
    safeFetchJson('/api/fulfillment/transfers').then(data => {
      if (data?.success && Array.isArray(data.transfers)) {
        setStockTransfers(data.transfers);
      }
    });

    // Sync pick lists
    safeFetchJson('/api/fulfillment/pick-lists').then(data => {
      if (data?.success && Array.isArray(data.pickLists)) {
        setPickLists(data.pickLists);
      }
    });

    // Sync manifests
    safeFetchJson('/api/fulfillment/manifests').then(data => {
      if (data?.success && Array.isArray(data.manifests)) {
        setDispatchManifests(data.manifests);
      }
    });

    // Test Firestore connection on boot
    testFirestoreConnection();

    // Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        console.log('Firebase user logged in:', fbUser.email, fbUser.uid);
        // If logged in as admin email, escalate role to SUPER_ADMIN
        if (fbUser.email === 'mdmuntasirshihab@gmail.com') {
          setCurrentRole('SUPER_ADMIN');
        }
        setCustomerProfile(prev => prev ? {
          ...prev,
          name: fbUser.displayName || prev.name,
          email: fbUser.email || prev.email,
        } : {
          id: fbUser.uid,
          name: fbUser.displayName || 'Kisholoy User',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '01700000000',
          tier: 'GOLD',
          points: 150,
          joinedDate: new Date().toISOString().split('T')[0],
          defaultAddressId: 'addr-1',
          totalOrdersCount: 1,
          totalSpentAmount: 2500
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Cart state initialized from localStorage if available
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('kisholoy_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kisholoy_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Initial Courier Partners (Built-in + Default Custom Partners)
  const INITIAL_CUSTOM_COURIERS: CustomCourierConfig[] = [
    {
      id: 'courier-steadfast',
      name: 'Steadfast Courier',
      code: 'steadfast',
      phone: '09678-045045',
      trackingUrlTemplate: 'https://steadfast.com.bd/t/{trackingId}',
      defaultInsideDhakaFee: 60,
      defaultOutsideDhakaFee: 120,
      codPercentageFee: 1.0,
      isActive: true,
      isBuiltIn: true,
      notes: 'Primary courier partner across 64 districts in Bangladesh with doorstep delivery and API booking.'
    },
    {
      id: 'courier-pathao',
      name: 'Pathao Courier',
      code: 'pathao',
      phone: '09610-003030',
      trackingUrlTemplate: 'https://pathao.com/courier/tracking/?consignment_id={trackingId}',
      defaultInsideDhakaFee: 60,
      defaultOutsideDhakaFee: 130,
      codPercentageFee: 1.0,
      isActive: true,
      isBuiltIn: true,
      notes: 'Fast intra-city express in Dhaka metropolitan zone and nation-wide network.'
    },
    {
      id: 'courier-redx',
      name: 'RedX Logistics',
      code: 'redx',
      phone: '09612-223344',
      trackingUrlTemplate: 'https://redx.com.bd/track/{trackingId}',
      defaultInsideDhakaFee: 70,
      defaultOutsideDhakaFee: 130,
      codPercentageFee: 1.0,
      isActive: true,
      isBuiltIn: true,
      notes: 'Wide divisional logistics coverage with return management.'
    },
    {
      id: 'courier-paperfly',
      name: 'Paperfly',
      code: 'paperfly',
      phone: '09666-774433',
      trackingUrlTemplate: 'https://paperfly.com.bd/tracking/{trackingId}',
      defaultInsideDhakaFee: 60,
      defaultOutsideDhakaFee: 120,
      codPercentageFee: 1.0,
      isActive: true,
      isBuiltIn: true,
      notes: 'Thana and union level door-to-door delivery network.'
    },
    {
      id: 'courier-sundarban',
      name: 'Sundarban Courier Service',
      code: 'sundarban',
      phone: '01979-994400',
      trackingUrlTemplate: 'https://sundarbancourierltd.com/tracking?id={trackingId}',
      defaultInsideDhakaFee: 80,
      defaultOutsideDhakaFee: 140,
      codPercentageFee: 1.5,
      isActive: true,
      isBuiltIn: false,
      notes: 'Oldest legacy branch-to-branch parcel service in Bangladesh.'
    },
    {
      id: 'courier-sa-paribahan',
      name: 'SA Paribahan',
      code: 'sa_paribahan',
      phone: '01711-556677',
      trackingUrlTemplate: 'https://saparibahan.com/track?cn={trackingId}',
      defaultInsideDhakaFee: 90,
      defaultOutsideDhakaFee: 150,
      codPercentageFee: 2.0,
      isActive: true,
      isBuiltIn: false,
      notes: 'Specializes in high-value parcel delivery and heavy bulk orders.'
    }
  ];

  const [customCouriers, setCustomCouriers] = useState<CustomCourierConfig[]>(() => {
    try {
      const saved = localStorage.getItem('kisholoy_custom_couriers');
      return saved ? JSON.parse(saved) : INITIAL_CUSTOM_COURIERS;
    } catch {
      return INITIAL_CUSTOM_COURIERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kisholoy_custom_couriers', JSON.stringify(customCouriers));
    } catch (e) {
      console.error('Error saving custom couriers', e);
    }
  }, [customCouriers]);

  const addCustomCourier = (courier: Omit<CustomCourierConfig, 'id'>) => {
    const newCourier: CustomCourierConfig = {
      ...courier,
      id: `courier-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setCustomCouriers(prev => [...prev, newCourier]);
    addAuditLog('ADD_COURIER', 'Shipment', newCourier.name, `Added courier partner ${newCourier.name} (${newCourier.code})`);
    showToast(`Added courier partner: ${newCourier.name}`);
  };

  const updateCustomCourier = (id: string, updates: Partial<CustomCourierConfig>) => {
    setCustomCouriers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addAuditLog('UPDATE_COURIER', 'Shipment', id, `Updated courier partner configuration`);
    showToast('Courier partner settings updated');
  };

  const deleteCustomCourier = (id: string) => {
    const target = customCouriers.find(c => c.id === id);
    if (target?.isBuiltIn) {
      showToast('Built-in courier partners cannot be deleted; you may deactivate them instead.');
      return;
    }
    setCustomCouriers(prev => prev.filter(c => c.id !== id));
    addAuditLog('DELETE_COURIER', 'Shipment', id, `Deleted custom courier ${target?.name || id}`);
    showToast(`Removed courier partner ${target?.name || ''}`);
  };

  const toggleCustomCourier = (id: string) => {
    setCustomCouriers(prev => prev.map(c => {
      if (c.id === id) {
        const nextState = !c.isActive;
        addAuditLog('TOGGLE_COURIER', 'Shipment', c.name, `${nextState ? 'Activated' : 'Deactivated'} courier ${c.name}`);
        showToast(`${c.name} is now ${nextState ? 'Active' : 'Disabled'}`);
        return { ...c, isActive: nextState };
      }
      return c;
    }));
  };

  // Fulfillment Hub Routing Optional vs Mandatory Mode
  const [isFulfillmentOptional, setIsFulfillmentOptionalState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kisholoy_fulfillment_optional');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const setIsFulfillmentOptional = (val: boolean) => {
    setIsFulfillmentOptionalState(val);
    try {
      localStorage.setItem('kisholoy_fulfillment_optional', JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
    showToast(val ? 'Multi-Hub routing is now OPTIONAL (Direct Dispatch Preferred)' : 'Enterprise Multi-Hub routing is now ACTIVE');
  };

  const showToast = (msgOrType: string, msgOptional?: string) => {
    const message = msgOptional !== undefined ? msgOptional : msgOrType;
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  const addAuditLog = (action: string, resource: string, resourceId: string, details?: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      operator: currentRole === 'SUPER_ADMIN' ? 'Super Admin' : currentRole,
      role: currentRole,
      action,
      resource,
      resourceId: details !== undefined ? resourceId : '-',
      details: details !== undefined ? details : resourceId,
      ipAddress: '103.145.118.22'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const logAudit = (action: string, resource: string, detailsOrId: string, details?: string) => {
    addAuditLog(action, resource, details !== undefined ? detailsOrId : '-', details !== undefined ? details : detailsOrId);
  };

  // Inventory Transactions
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(INITIAL_INVENTORY_TRANSACTIONS);

  // Cart operations
  const addToCart = (product: Product, quantity = 1, variantId?: string) => {
    const variant = variantId ? product.variants?.find(v => v.id === variantId) : undefined;
    const cartItemId = variantId ? `${product.id}-${variantId}` : product.id;
    const itemPrice = variant ? variant.price : product.price;
    const itemSku = variant ? variant.sku : product.sku;
    const variantName = variant ? (language === 'BN' && variant.nameBn ? variant.nameBn : variant.name) : undefined;

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item => 
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        return [
          ...prev,
          {
            id: cartItemId,
            productId: product.id,
            title: product.title,
            titleBn: product.titleBn,
            price: itemPrice,
            image: product.images[0],
            quantity,
            variantId,
            variantName,
            sku: itemSku
          }
        ];
      }
    });

    showToast(
      language === 'BN' 
        ? `"${product.titleBn || product.title}" কার্টে যুক্ত হয়েছে!` 
        : `"${product.title}" added to your cart!`
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    showToast(language === 'BN' ? 'পণ্যটি কার্ট থেকে সরানো হয়েছে' : 'Item removed from cart');
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Products CRUD
  const addProduct = (newProdData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [newProd, ...prev]);
    // Sync with backend API
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newProd, operator: currentRole })
    }).catch(err => console.warn('Failed to sync product to server:', err));

    addAuditLog('CREATE_PRODUCT', 'Product', newProd.sku, `Created product "${newProd.title}"`);
    showToast('Product added successfully to catalog');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    // Sync with backend API
    fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, operator: currentRole })
    }).catch(err => console.warn('Failed to sync product update to server:', err));

    addAuditLog('UPDATE_PRODUCT', 'Product', id, `Updated product details`);
    showToast('Product updated successfully');
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    // Sync with backend API
    fetch(`/api/products/${id}?operator=${encodeURIComponent(currentRole)}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Failed to sync product deletion to server:', err));

    addAuditLog('DELETE_PRODUCT', 'Product', prod?.sku || id, `Deleted product "${prod?.title}"`);
    showToast('Product removed from catalog');
  };

  // Categories CRUD
  /**
   * Create a category. The server is the source of truth: we adopt the record
   * it returns (so the id is the persisted one) and roll back the optimistic
   * row if the write fails, rather than leaving a phantom category on screen.
   */
  const addCategory = async (catData: Omit<Category, 'id'>): Promise<boolean> => {
    const optimisticId = `cat-${Date.now()}`;
    const optimistic: Category = { ...catData, id: optimisticId };
    setCategories(prev => [...prev, optimistic]);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...optimistic, operator: currentRole })
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data.category) {
        setCategories(prev => prev.filter(c => c.id !== optimisticId));
        showToast(data?.error || 'Could not save the category. Please try again.');
        return false;
      }

      setCategories(prev => prev.map(c => (c.id === optimisticId ? data.category : c)));
      addAuditLog('CREATE_CATEGORY', 'Category', data.category.slug, `Added category "${data.category.name}"`);
      showToast('Category created');
      return true;
    } catch {
      setCategories(prev => prev.filter(c => c.id !== optimisticId));
      showToast('Network error — the category was not saved.');
      return false;
    }
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    // Sync with backend API
    fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, operator: currentRole })
    }).catch(err => console.warn('Failed to sync category update to server:', err));

    showToast('Category updated');
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    const target = categories.find(c => c.id === id);
    const snapshot = categories;
    setCategories(prev => prev.filter(c => c.id !== id));

    try {
      const res = await fetch(`/api/categories/${id}?operator=${encodeURIComponent(currentRole)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        setCategories(snapshot); // restore — the server still has it
        const data = await res.json().catch(() => null);
        showToast(data?.error || 'Could not delete the category.');
        return false;
      }
    } catch {
      setCategories(snapshot);
      showToast('Network error — the category was not deleted.');
      return false;
    }

    addAuditLog('DELETE_CATEGORY', 'Category', target?.slug || id, `Deleted category "${target?.name}"`);
    showToast('Category removed');
  };

  // Inventory Adjustment & Audit
  const adjustInventory = async (
    productId: string, 
    quantityChange: number, 
    reason: string,
    options?: { warehouseLocation?: string; batchNumber?: string; notes?: string; unitCost?: number }
  ): Promise<boolean> => {
    const product = products.find(p => p.id === productId || p.sku === productId);
    if (!product) return false;

    const quantityBefore = product.stock;
    const quantityAfter = Math.max(0, quantityBefore + quantityChange);

    // Optimistic update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: quantityAfter } : p));

    const isHighVolume = Math.abs(quantityChange) >= 50;
    let type: InventoryTransaction['type'] = 'ADJUSTMENT';
    if (quantityChange > 0) {
      if (reason.toLowerCase().includes('restock') || reason.toLowerCase().includes('intake')) {
        type = 'STOCK_IN';
      } else if (reason.toLowerCase().includes('return')) {
        type = 'RETURN';
      }
    } else {
      if (reason.toLowerCase().includes('damage') || reason.toLowerCase().includes('scrap')) {
        type = 'DAMAGE';
      } else if (reason.toLowerCase().includes('sale') || reason.toLowerCase().includes('order')) {
        type = 'SALE';
      }
    }

    const newTx: InventoryTransaction = {
      id: `tx-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: product.id,
      productTitle: product.title,
      sku: product.sku,
      type,
      quantityChange,
      quantityBefore,
      quantityAfter,
      reason,
      operator: currentRole,
      warehouseLocation: options?.warehouseLocation || 'Tejgaon Central Fulfillment Hub, Dhaka',
      batchNumber: options?.batchNumber,
      notes: options?.notes,
      unitCost: options?.unitCost || product.costPrice,
      flaggedForReview: isHighVolume
    };

    setInventoryTransactions(prev => [newTx, ...prev]);
    
    // Audit Log
    const auditAction = isHighVolume ? 'HIGH_VOLUME_INVENTORY_ADJUSTMENT' : 'INVENTORY_ADJUSTMENT';
    addAuditLog(auditAction, 'Inventory', product.sku, `Adjusted stock by ${quantityChange > 0 ? '+' : ''}${quantityChange} (${reason})`);

    // Sync with backend API
    try {
      await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantityChange,
          reason,
          operator: currentRole,
          warehouseLocation: options?.warehouseLocation,
          batchNumber: options?.batchNumber,
          notes: options?.notes,
          unitCost: options?.unitCost
        })
      });
      // Re-read the authoritative ledger so the Inventory screen reflects the
      // server's row (id, before/after quantities, flags) rather than only the
      // optimistic local entry.
      const ledger = await apiFetchJson('/api/inventory/transactions');
      if (ledger?.success && Array.isArray(ledger.transactions)) {
        setInventoryTransactions(ledger.transactions);
      }
    } catch (e) {
      console.error('Failed to sync inventory adjustment with server:', e);
    }

    showToast(isHighVolume ? `[Review Queued] Stock adjusted for ${product.title}` : `Stock updated for ${product.title}`);
    return true;
  };

  const adjustStock = (productId: string, quantityChange: number, reason: string) => {
    adjustInventory(productId, quantityChange, reason);
  };

  const batchRestock = async (payload: BatchRestockPayload): Promise<boolean> => {
    try {
      const res = await fetch('/api/inventory/batch-restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          operator: currentRole
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Update local products
        setProducts(prev => prev.map(p => {
          const matchingItem = payload.items.find(it => it.productId === p.id || it.sku === p.sku);
          if (matchingItem) {
            return {
              ...p,
              stock: p.stock + matchingItem.quantity,
              costPrice: matchingItem.unitCost || p.costPrice
            };
          }
          return p;
        }));

        // Append new transactions
        if (data.transactions && Array.isArray(data.transactions)) {
          setInventoryTransactions(prev => [...data.transactions, ...prev]);
        }

        addAuditLog(
          'BATCH_RESTOCK_INTAKE',
          'Inventory',
          payload.invoiceNumber,
          `Intake of ${data.totalUnitsAdded} units from "${payload.supplier}" (Inv #${payload.invoiceNumber})`
        );

        showToast(`Batch restock successful: +${data.totalUnitsAdded} units added`);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Batch restock failed:', e);
      showToast('Error executing batch restock');
      return false;
    }
  };

  // Sync full server order into local context
  const syncServerOrder = (serverOrder: Order) => {
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === serverOrder.id || o.orderNumber === serverOrder.orderNumber);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = serverOrder;
        return copy;
      }
      return [serverOrder, ...prev];
    });
  };

  // Create Order (Simulated Server Transaction)
  const createOrder = (orderData: {
    customer: { name: string; phone: string; email?: string };
    shippingAddress: Order['shippingAddress'];
    paymentMethod: Order['paymentMethod'];
    items: Order['items'];
    shippingFee: number;
    discount?: number;
    notes?: string;
    fraudRisk?: Order['fraudRisk'];
    id?: string;
    orderNumber?: string;
    orderStatus?: Order['orderStatus'];
  }): Order => {
    const orderNum = orderData.orderNumber || `KSH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + orderData.shippingFee - (orderData.discount || 0);

    const newOrder: Order = {
      id: orderData.id || `ord-${Date.now()}`,
      orderNumber: orderNum,
      createdAt: new Date().toISOString(),
      customer: {
        id: `cust-${Date.now()}`,
        name: orderData.customer.name,
        phone: orderData.customer.phone,
        email: orderData.customer.email
      },
      shippingAddress: orderData.shippingAddress,
      items: orderData.items,
      subtotal,
      shippingFee: orderData.shippingFee,
      discount: orderData.discount || 0,
      total,
      paymentMethod: orderData.paymentMethod,
      // Never mark the order as paid from the client. COD = unpaid until
      // courier collects; online gateways = pending until verified server-side.
      paymentStatus: orderData.paymentMethod === 'COD' ? 'UNPAID' : 'PENDING',
      settlementStatus: 'PENDING',
      orderStatus: orderData.orderStatus || 'PENDING',
      courier: {
        provider: 'Steadfast',
        status: 'CREATED'
      },
      notes: orderData.notes,
      fraudRisk: orderData.fraudRisk,
      timeline: [
        {
          status: orderData.orderStatus || 'PENDING',
          timestamp: new Date().toISOString(),
          note: `Order placed via ${orderData.paymentMethod}.`,
          updatedBy: 'SYSTEM'
        }
      ]
    };

    // Deduct stock safely
    orderData.items.forEach(item => {
      setProducts(prev => prev.map(p => {
        if (p.id === item.productId) {
          return { ...p, stock: Math.max(0, p.stock - item.quantity) };
        }
        return p;
      }));
    });

    setOrders(prev => {
      const exists = prev.some(o => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber);
      if (exists) {
        return prev.map(o => (o.id === newOrder.id || o.orderNumber === newOrder.orderNumber) ? newOrder : o);
      }
      return [newOrder, ...prev];
    });
    clearCart();
    addAuditLog('ORDER_CREATED', 'Order', orderNum, `New order placed for total ৳${total}`);
    return newOrder;
  };

  const refreshOrders = async () => {
    try {
      const res = await apiFetch('/api/orders');
      const data = await res.json();
      if (data?.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to refresh orders:', err);
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, note?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const newTimeline = [
          ...order.timeline,
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: note || `Order status transitioned to ${newStatus}`,
            updatedBy: currentRole
          }
        ];
        
        let newPaymentStatus = order.paymentStatus;
        if (newStatus === 'DELIVERED' && order.paymentMethod === 'COD') {
          newPaymentStatus = 'PAID';
        }

        return {
          ...order,
          orderStatus: newStatus,
          paymentStatus: newPaymentStatus,
          timeline: newTimeline
        };
      }
      return order;
    }));

    addAuditLog('UPDATE_ORDER_STATUS', 'Order', orderId, `Changed status to ${newStatus}`);

    // Multi-Channel Automated Gateway Notification Trigger (SMS, WhatsApp, Email, In-App)
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      let eventKey = 'ORDER_CONFIRMATION';
      if (newStatus === 'SHIPPED') eventKey = 'ORDER_SHIPPED';
      else if (newStatus === 'OUT_FOR_DELIVERY') eventKey = 'OUT_FOR_DELIVERY';
      else if (newStatus === 'DELIVERED') eventKey = 'ORDER_DELIVERED';
      else if (newStatus === 'CANCELLED') eventKey = 'ORDER_CANCELLED';
      else if (newStatus === 'RETURNED') eventKey = 'RETURN_APPROVED';

      const codAmt = targetOrder.balanceDueCod ?? (targetOrder.paymentMethod === 'COD' ? targetOrder.total : 0);

      // Call server endpoint for status sync & automated notification dispatch
      fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: note || `Order status updated to ${newStatus}`,
          operator: currentRole
        })
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success) {
          if (data.notificationsDispatched > 0) {
            showToast(`Status set to ${newStatus} & notification sent via SMS/WhatsApp to ${targetOrder.customer.phone}`);
          } else {
            showToast(`Order status updated to ${newStatus}`);
          }
          if (targetOrder.customer.id === currentCustomerId) {
            fetchCustomerNotifications();
          }
        } else {
          // Fallback direct dispatch if server order status route returns standard response
          fetch('/api/notifications/dispatch-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventKey,
              data: {
                orderNumber: targetOrder.orderNumber,
                customerName: targetOrder.customer.name,
                customerPhone: targetOrder.customer.phone,
                customerEmail: targetOrder.customer.email,
                customerId: targetOrder.customer.id || currentCustomerId,
                totalAmount: targetOrder.total,
                paymentMethod: targetOrder.paymentMethod,
                courierName: targetOrder.courier?.provider || (targetOrder.shippingAddress.division === 'Dhaka' ? 'Pathao Courier' : 'Steadfast Courier'),
                trackingId: targetOrder.courier?.trackingId || 'TRK-98210',
                trackingUrl: `https://kisholoy.com.bd/track/${targetOrder.orderNumber}`,
                codAmount: codAmt
              }
            })
          }).catch(e => console.error('Fallback notification error', e));
          showToast(`Order status updated to ${newStatus}`);
        }
      })
      .catch(() => {
        showToast(`Order status updated to ${newStatus}`);
      });
    } else {
      showToast(`Order status updated to ${newStatus}`);
    }
  };

  const dispatchCourier = (orderId: string, courierName: string, customTrackingId?: string) => {
    const courierObj = customCouriers.find(c => c.name.toLowerCase() === courierName.toLowerCase() || c.code.toLowerCase() === courierName.toLowerCase());
    const prefix = (courierObj?.code || courierName.substring(0, 3)).toUpperCase().replace(/[^A-Z]/g, '') || 'TRK';
    const trackingCode = customTrackingId && customTrackingId.trim() 
      ? customTrackingId.trim() 
      : `${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const consignmentCode = `CID-${Math.floor(100000 + Math.random() * 900000)}`;

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          orderStatus: 'READY_TO_SHIP',
          courier: {
            provider: courierObj?.name || courierName,
            trackingId: trackingCode,
            consignmentId: consignmentCode,
            status: 'CREATED',
            dispatchedAt: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          timeline: [
            ...order.timeline,
            {
              status: 'READY_TO_SHIP',
              timestamp: new Date().toISOString(),
              note: `Booked delivery with ${courierObj?.name || courierName}. Tracking: ${trackingCode}`,
              updatedBy: currentRole
            }
          ]
        };
      }
      return order;
    }));

    addAuditLog('COURIER_DISPATCH', 'Order', orderId, `Dispatched with ${courierObj?.name || courierName} (${trackingCode})`);

    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      const courierProvider = courierObj?.name || courierName;
      const codAmt = targetOrder.balanceDueCod ?? (targetOrder.paymentMethod === 'COD' ? targetOrder.total : 0);

      fetch('/api/notifications/dispatch-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventKey: 'ORDER_SHIPPED',
          data: {
            orderNumber: targetOrder.orderNumber,
            customerName: targetOrder.customer.name,
            customerPhone: targetOrder.customer.phone,
            customerEmail: targetOrder.customer.email,
            customerId: targetOrder.customer.id,
            totalAmount: targetOrder.total,
            paymentMethod: targetOrder.paymentMethod,
            courierName: courierProvider,
            trackingId: trackingCode,
            trackingUrl: `https://kisholoy.com.bd/track/${targetOrder.orderNumber}`,
            codAmount: codAmt
          }
        })
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success) {
          showToast(`Consignment booked (${trackingCode}) & confirmation SMS/WhatsApp sent to ${targetOrder.customer.phone}`);
        } else {
          showToast(`Courier consignment booked: ${trackingCode}`);
        }
      })
      .catch(() => {
        showToast(`Courier consignment booked: ${trackingCode}`);
      });
    } else {
      showToast(`Courier consignment booked: ${trackingCode}`);
    }
  };

  /**
   * Record an expense in local state.
   *
   * Callers that already persisted the row must pass the SERVER record so both
   * sides share one id. Previously FinanceAdmin POSTed and then called this
   * with the raw form values, minting a second `exp-<Date.now()>` copy that
   * never reconciled with the ledger — the P&L on screen silently drifted from
   * the persisted one (F-302).
   */
  const addExpense = (expense: Omit<ExpenseRecord, 'id'> | ExpenseRecord) => {
    const newExp: ExpenseRecord = 'id' in expense && expense.id
      ? (expense as ExpenseRecord)
      : { ...(expense as Omit<ExpenseRecord, 'id'>), id: `exp-${Date.now()}` };
    setExpenses(prev => [newExp, ...prev]);
    addAuditLog('ADD_EXPENSE', 'Finance', newExp.reference, `Added expense ৳${newExp.amount} for ${newExp.category}`);
    showToast('Expense recorded');
  };

  const deleteExpense = (id: string) => {
    const exp = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (exp) {
      addAuditLog('DELETE_EXPENSE', 'Finance', exp.reference, `Deleted expense ৳${exp.amount} for ${exp.category}`);
    }
    showToast('Expense record deleted');
  };

  const addSettlement = (settlement: Omit<SettlementRecord, 'id'>) => {
    const newSet: SettlementRecord = {
      ...settlement,
      id: `set-${Date.now()}`
    };
    setSettlements(prev => [newSet, ...prev]);
    addAuditLog('CREATE_SETTLEMENT', 'Finance', newSet.batchNumber, `Created settlement batch ৳${newSet.netPayout} (${newSet.gateway})`);
    showToast('Settlement batch created');
  };

  const updateSettlementStatus = (id: string, status: SettlementStatus, utr?: string) => {
    setSettlements(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status,
          utrOrReference: utr || s.utrOrReference,
          payoutDate: status === 'SETTLED' ? (s.payoutDate || new Date().toISOString()) : s.payoutDate
        };
      }
      return s;
    }));
    addAuditLog('UPDATE_SETTLEMENT', 'Finance', id, `Updated settlement status to ${status}`);
    showToast(`Settlement marked as ${status}`);
  };

  const retryAutomationJob = (jobId: string) => {
    setAutomationJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          status: 'SUCCESS',
          attempts: j.attempts + 1,
          lastAttemptAt: new Date().toISOString(),
          errorMessage: undefined
        };
      }
      return j;
    }));
    addAuditLog('RETRY_AUTOMATION', 'AutomationJob', jobId, 'Manually triggered job retry');
    showToast('Automation job executed successfully');
  };

  const updateSiteContent = (updates: Partial<SiteContent>, summary?: string) => {
    const updated = { ...siteContent, ...updates };
    setSiteContent(updated);
    
    // Asynchronously sync with server API
    fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: updated,
        operator: currentRole,
        summary: summary || 'Draft content update'
      })
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data?.revision) {
        setContentRevisions(prev => [data.revision, ...prev.filter(r => r.id !== data.revision.id)]);
      }
    })
    .catch(() => {});

    addAuditLog('UPDATE_SITE_CONTENT', 'ContentCMS', 'GlobalContent', summary || 'Updated site content');
    showToast('Content updated successfully');
  };

  const publishSiteContent = async (newContent: SiteContent, summary?: string): Promise<boolean> => {
    try {
      setSiteContent(newContent);
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          operator: currentRole,
          summary: summary || `Published site changes at ${new Date().toLocaleTimeString('en-US')}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.revision) {
          setContentRevisions(prev => [data.revision, ...prev]);
        }
        addAuditLog('PUBLISH_CONTENT', 'ContentCMS', data?.revision?.id || 'live-content', summary || 'Published changes to live storefront');
        showToast('Site published successfully to live storefront!');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to publish content:', e);
      showToast('Error publishing content to server');
      return false;
    }
  };

  const restoreContentRevision = async (revisionId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/content/restore/${revisionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: currentRole })
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.content) {
          setSiteContent(data.content);
        }
        // Refresh revisions
        const revRes = await fetch('/api/content/revisions');
        if (revRes.ok) {
          const revData = await revRes.json();
          if (revData?.revisions) setContentRevisions(revData.revisions);
        }
        addAuditLog('RESTORE_CONTENT', 'ContentCMS', revisionId, `Restored site content to version ${revisionId}`);
        showToast(`Successfully rolled back to version ${revisionId}`);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to restore revision:', e);
      showToast('Error restoring content version');
      return false;
    }
  };

  // ============================================================
  // Phase 13: Multi-Warehouse & Fulfillment Methods
  // ============================================================

  const saveWarehouse = async (warehouseData: Partial<WarehouseHub> & { name: string; division: any; district: string }): Promise<WarehouseHub | null> => {
    try {
      const res = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warehouseData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.warehouse) {
          setWarehouses(prev => {
            const idx = prev.findIndex(w => w.id === data.warehouse.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = data.warehouse;
              return updated;
            }
            return [...prev, data.warehouse];
          });
          showToast(`Warehouse Hub "${data.warehouse.name}" saved successfully`);
          return data.warehouse;
        }
      }
      showToast('Failed to save warehouse hub');
      return null;
    } catch (e) {
      console.error(e);
      showToast('Error connecting to warehouse service');
      return null;
    }
  };

  const toggleWarehouse = async (id: string, active: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`/api/warehouses/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active, operator: currentRole })
      });
      if (res.ok) {
        setWarehouses(prev => prev.map(w => w.id === id ? { ...w, isActive: active } : w));
        showToast(`Warehouse status set to ${active ? 'Active' : 'Inactive'}`);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateBinLocation = async (params: {
    stockId: string;
    aisle: string;
    shelf: string;
    bin: string;
    reorderLevel?: number;
    reorderQuantity?: number;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/warehouses/stock-matrix/bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, operator: currentRole })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setWarehouseStocks(prev => prev.map(s => s.id === params.stockId ? data.item : s));
          showToast(`Bin coordinates updated to ${params.aisle}/${params.shelf}/${params.bin}`);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const createStockTransfer = async (params: {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    items: { productId: string; sku: string; productTitle: string; quantityRequested: number; unitCost: number; notes?: string }[];
    carrier?: string;
    notes?: string;
  }): Promise<StockTransferOrder | null> => {
    try {
      const res = await fetch('/api/fulfillment/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, requestedBy: currentRole })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transfer) {
          setStockTransfers(prev => [data.transfer, ...prev]);
          showToast(`Stock Transfer Order ${data.transfer.transferNumber} created`);
          return data.transfer;
        }
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const approveStockTransfer = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/fulfillment/transfers/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: currentRole })
      });
      if (res.ok) {
        const data = await res.json();
        setStockTransfers(prev => prev.map(t => t.id === id ? data.transfer : t));
        showToast('Stock transfer order approved for dispatch');
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const dispatchStockTransfer = async (params: {
    transferId: string;
    trackingOrGatePass?: string;
    carrier?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/fulfillment/transfers/${params.transferId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, operator: currentRole })
      });
      if (res.ok) {
        const data = await res.json();
        setStockTransfers(prev => prev.map(t => t.id === params.transferId ? data.transfer : t));
        // Refresh stock matrix
        const mRes = await fetch('/api/warehouses/stock-matrix');
        if (mRes.ok) {
          const mData = await mRes.json();
          if (mData.matrix) setWarehouseStocks(mData.matrix);
        }
        showToast('Stock transfer dispatched with Gate Pass');
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const receiveStockTransfer = async (params: { transferId: string; notes?: string }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/fulfillment/transfers/${params.transferId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, receivedBy: currentRole })
      });
      if (res.ok) {
        const data = await res.json();
        setStockTransfers(prev => prev.map(t => t.id === params.transferId ? data.transfer : t));
        // Refresh stock matrix
        const mRes = await fetch('/api/warehouses/stock-matrix');
        if (mRes.ok) {
          const mData = await mRes.json();
          if (mData.matrix) setWarehouseStocks(mData.matrix);
        }
        showToast('Stock received and booked into destination warehouse ledger');
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const generatePickList = async (params: {
    warehouseId: string;
    orderIds: string[];
    assignedPicker?: string;
  }): Promise<PickList | null> => {
    try {
      const res = await fetch('/api/fulfillment/pick-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, assignedPicker: params.assignedPicker || 'Warehouse Picker #01' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pickList) {
          setPickLists(prev => [data.pickList, ...prev]);
          showToast(`Digital Pick List ${data.pickList.pickListNumber} generated (${data.pickList.totalUnits} units)`);
          return data.pickList;
        }
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const togglePickItem = async (pickListId: string, sku: string, picked: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`/api/fulfillment/pick-lists/${pickListId}/toggle-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, picked })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pickList) {
          setPickLists(prev => prev.map(p => p.id === pickListId ? data.pickList : p));
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const generateDispatchManifest = async (params: {
    warehouseId: string;
    courier: DispatchManifest['courier'];
    orderIds: string[];
    driverName?: string;
    driverPhone?: string;
    vehicleNumber?: string;
  }): Promise<DispatchManifest | null> => {
    try {
      const res = await fetch('/api/fulfillment/manifests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, operator: currentRole })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.manifest) {
          setDispatchManifests(prev => [data.manifest, ...prev]);
          // Refresh orders since their courier status was updated to SHIPPED
          const oRes = await apiFetch('/api/orders');
          if (oRes.ok) {
            const oData = await oRes.json();
            if (oData.orders) setOrders(oData.orders);
          }
          showToast(`Batch Manifest ${data.manifest.manifestNumber} generated for ${data.manifest.courier}`);
          return data.manifest;
        }
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handoverManifest = async (manifestId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/fulfillment/manifests/${manifestId}/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: currentRole })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.manifest) {
          setDispatchManifests(prev => prev.map(m => m.id === manifestId ? data.manifest : m));
          showToast(`Manifest ${data.manifest.manifestNumber} marked as Handed Over to Courier`);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const routeOrderSimulation = async (order: Order): Promise<FulfillmentRoutingDecision | null> => {
    try {
      const res = await fetch('/api/fulfillment/route-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });
      if (res.ok) {
        const data = await res.json();
        return data.decision;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Safe JSON fetcher helper that prevents parsing HTML fallback responses
  const fetchJsonSafe = async (url: string) => {
    try {
      const res = await fetch(url);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  };

  // -------------------------------------------------------------
  // Customer Account Portal & Wishlist Handlers (Phase 15)
  // -------------------------------------------------------------
  const loadCustomerData = async (custId: string) => {
    if (!custId) {
      setCustomerProfile(null);
      setSavedAddresses([]);
      setWishlist([]);
      setReturnRequests([]);
      setCustomerNotifications([]);
      setCustomerLoyalty(null);
      return;
    }
    try {
      // 1. Profile
      const profData = await fetchJsonSafe(`/api/customer/profile/${custId}`);
      if (profData?.profile) setCustomerProfile(profData.profile);

      // 2. Addresses
      const addrData = await fetchJsonSafe(`/api/customer/addresses/${custId}`);
      if (addrData?.addresses) setSavedAddresses(addrData.addresses);

      // 3. Wishlist
      const wishData = await fetchJsonSafe(`/api/customer/wishlist/${custId}`);
      if (wishData?.wishlist) setWishlist(wishData.wishlist);

      // 4. Returns
      const retData = await fetchJsonSafe(`/api/customer/returns/${custId}`);
      if (retData?.returns) setReturnRequests(retData.returns);

      // 5. In-App Notifications
      const notifData = await fetchJsonSafe(`/api/customer/notifications/${custId}`);
      if (Array.isArray(notifData?.notifications)) {
        setCustomerNotifications(notifData.notifications);
      }
    } catch (e) {
      console.error('Failed loading customer data:', e);
    }
  };

  // Orders hydration. Runs on mount and whenever the customer session changes,
  // always through apiFetch so the staff token (admin tabs) or the customer
  // session token (storefront tabs) is attached — without a bearer the server
  // can never return the scoped list.
  useEffect(() => {
    let cancelled = false;
    apiFetchJson('/api/orders').then(data => {
      if (cancelled) return;
      if (data?.success && Array.isArray(data.orders) && data.orders.length > 0) {
        setOrders(data.orders);
      }
    });
    return () => { cancelled = true; };
  }, [currentCustomerId]);

  const loginCustomer = (customerId: string, profile?: CustomerProfile, sessionToken?: string | null) => {
    setCurrentCustomerId(customerId);
    // Persist the customer session bearer so scoped endpoints (e.g. GET /api/orders)
    // receive an identity even when no staff token exists in this tab.
    if (sessionToken !== undefined) setCustomerToken(sessionToken || null);
    try {
      localStorage.setItem('kisholoy_customer_id', customerId);
    } catch {}
    if (profile) setCustomerProfile(profile);
    loadCustomerData(customerId);
    
    // Telemetry Auth Event Logging
    const matchedCustomer = customers.find(c => c.id === customerId);
    logAuthEvent({
      userId: customerId,
      userName: profile?.name || matchedCustomer?.name || 'Customer User',
      userPhone: profile?.phone || matchedCustomer?.phone || '01711000000',
      userEmail: profile?.email || matchedCustomer?.email,
      role: 'CUSTOMER',
      eventType: 'LOGIN_SUCCESS',
      district: (profile as any)?.district || matchedCustomer?.district || 'Dhaka',
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile (Browser)' : 'Desktop (Browser)',
      status: 'SUCCESS'
    });
  };

  const logoutCustomer = () => {
    const custId = currentCustomerId;
    const matchedCustomer = customers.find(c => c.id === custId);
    
    // Telemetry Auth Event Logging
    if (custId) {
      logAuthEvent({
        userId: custId,
        userName: customerProfile?.name || matchedCustomer?.name || 'Customer User',
        userPhone: customerProfile?.phone || matchedCustomer?.phone || '01711000000',
        role: 'CUSTOMER',
        eventType: 'LOGOUT',
        district: (customerProfile as any)?.district || matchedCustomer?.district || 'Dhaka',
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile (Browser)' : 'Desktop (Browser)',
        status: 'SUCCESS'
      });
    }

    setCurrentCustomerId('');
    setCustomerProfile(null);
    setSavedAddresses([]);
    setWishlist([]);
    setReturnRequests([]);
    setCustomerNotifications([]);
    setCustomerLoyalty(null);
    setCustomerToken(null);
    try {
      localStorage.removeItem('kisholoy_customer_id');
    } catch {}
    showToast('Logged out of customer account.');
  };

  const unreadNotificationsCount = customerNotifications.filter(n => !n.isRead).length;

  const markCustomerNotificationRead = async (id: string): Promise<boolean> => {
    try {
      setCustomerNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      await fetch(`/api/customer/notifications/${id}/read`, { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  };

  const markAllCustomerNotificationsRead = async (): Promise<boolean> => {
    try {
      setCustomerNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await fetch('/api/customer/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: currentCustomerId })
      });
      showToast('All notifications marked as read');
      return true;
    } catch {
      return false;
    }
  };

  const fetchCustomerNotifications = async () => {
    try {
      const res = await fetch(`/api/customer/notifications/${currentCustomerId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          setCustomerNotifications(data.notifications);
        }
      }
    } catch (e) {
      console.error('Failed fetching customer notifications:', e);
    }
  };

  useEffect(() => {
    loadCustomerData(currentCustomerId);
  }, [currentCustomerId]);

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/customer/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: currentCustomerId, productId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.wishlist) {
          setWishlist(data.wishlist);
          showToast(data.action === 'ADDED' ? 'Item added to Wishlist' : 'Item removed from Wishlist');
          return true;
        }
      }
      // Fallback local toggle
      const existing = wishlist.find(w => w.productId === productId);
      if (existing) {
        setWishlist(prev => prev.filter(w => w.productId !== productId));
        showToast('Item removed from Wishlist');
      } else {
        const prod = products.find(p => p.id === productId);
        if (prod) {
          const item: WishlistItem = {
            id: `wish-${Date.now()}`,
            customerId: currentCustomerId,
            productId: prod.id,
            productTitle: prod.title,
            productTitleBn: prod.titleBn || prod.title,
            price: prod.price,
            originalPrice: prod.originalPrice,
            image: prod.images[0] || '',
            inStock: prod.stock > 0,
            category: prod.category,
            addedAt: new Date().toISOString()
          };
          setWishlist(prev => [item, ...prev]);
          showToast('Item added to Wishlist');
        }
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const isWishlisted = (productId: string): boolean => {
    return wishlist.some(w => w.productId === productId);
  };

  const saveAddress = async (addressData: Omit<CustomerAddress, 'id' | 'createdAt' | 'customerId'> & { id?: string }): Promise<boolean> => {
    try {
      if (addressData.id) {
        // Update existing address
        const res = await fetch(`/api/customer/addresses/${addressData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addressData)
        });
        if (res.ok) {
          await loadCustomerData(currentCustomerId);
          showToast('Address updated successfully');
          return true;
        }
      } else {
        // Add new address
        const res = await fetch('/api/customer/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...addressData, customerId: currentCustomerId })
        });
        if (res.ok) {
          await loadCustomerData(currentCustomerId);
          showToast('New shipping address saved');
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteAddress = async (addressId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/customer/addresses/${addressId}?customerId=${currentCustomerId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSavedAddresses(prev => prev.filter(a => a.id !== addressId));
        showToast('Address deleted');
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const setDefaultAddress = async (addressId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true })
      });
      if (res.ok) {
        setSavedAddresses(prev => prev.map(a => ({
          ...a,
          isDefault: a.id === addressId
        })));
        showToast('Default delivery address updated');
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateCustomerProfile = async (updates: Partial<CustomerProfile>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/customer/profile/${currentCustomerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setCustomerProfile(data.profile);
          showToast('Profile settings saved successfully');
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const submitReturnRequest = async (data: Omit<CustomerReturnRequest, 'id' | 'requestNumber' | 'status' | 'createdAt' | 'updatedAt' | 'customerId' | 'customerPhone'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/customer/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          customerId: currentCustomerId,
          customerPhone: customerProfile?.phone || '+880 1712345678'
        })
      });
      if (res.ok) {
        const respData = await res.json();
        if (respData.returnRequest) {
          setReturnRequests(prev => [respData.returnRequest, ...prev]);
          showToast(`Return Request ${respData.returnRequest.requestNumber} submitted!`);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateCustomerStatus = async (id: string, status: 'ACTIVE' | 'BLOCKED', reason?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/customers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason, operator: currentRole })
      });
      if (res.ok) {
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, status } : c));
        showToast(`Customer status updated to ${status}`);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      // Fallback optimistic update
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      showToast(`Customer status updated to ${status}`);
      return true;
    }
  };

  const addAdminCustomer = async (customerData: { name: string; phone: string; email?: string; address?: string; district?: string; thana?: string }): Promise<Customer | null> => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.customer) {
          setCustomers(prev => [data.customer, ...prev]);
          showToast(`Customer ${data.customer.name} registered successfully`);
          return data.customer;
        }
      }
      return null;
    } catch (e) {
      console.error(e);
      const fallbackCustomer: Customer = {
        id: `cust-${Date.now().toString().slice(-4)}`,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || `${customerData.phone.replace(/\D/g, '')}@customer.kisholoy.com`,
        joinedDate: new Date().toISOString().slice(0, 10),
        totalOrders: 0,
        totalSpent: 0,
        defaultAddress: customerData.address ? `${customerData.address}, ${customerData.thana || ''}, ${customerData.district || 'Dhaka'}` : 'Dhaka, Bangladesh',
        status: 'ACTIVE'
      };
      setCustomers(prev => [fallbackCustomer, ...prev]);
      showToast(`Customer ${fallbackCustomer.name} registered successfully`);
      return fallbackCustomer;
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currentRole,
        setCurrentRole,
        isDarkMode,
        toggleDarkMode,
        theme,
        setTheme,
        products,
        setProducts,
        categories,
        setCategories,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        orders,
        refreshOrders,
        syncServerOrder,
        createOrder,
        updateOrderStatus,
        dispatchCourier,
        customers,
        updateCustomerStatus,
        addAdminCustomer,
        inventoryTransactions,
        adjustInventory,
        adjustStock: adjustInventory,
        batchRestock,
        expenses,
        addExpense,
        deleteExpense,
        settlements,
        addSettlement,
        updateSettlementStatus,
        automationJobs,
        retryAutomationJob,
        auditLogs,
        logAudit,
        addAuditLog,
        siteContent,
        updateSiteContent,
        publishSiteContent,
        contentRevisions,
        restoreContentRevision,
        warehouses,
        warehouseStocks,
        stockTransfers,
        routingRules,
        pickLists,
        dispatchManifests,
        saveWarehouse,
        toggleWarehouse,
        updateBinLocation,
        createStockTransfer,
        approveStockTransfer,
        dispatchStockTransfer,
        receiveStockTransfer,
        generatePickList,
        togglePickItem,
        generateDispatchManifest,
        handoverManifest,
        routeOrderSimulation,
        customCouriers,
        addCustomCourier,
        updateCustomCourier,
        deleteCustomCourier,
        toggleCustomCourier,
        isFulfillmentOptional,
        setIsFulfillmentOptional,
        currentCustomerId,
        setCurrentCustomerId,
        loginCustomer,
        logoutCustomer,
        customerProfile,
        savedAddresses,
        wishlist,
        returnRequests,
        customerLoyalty,
        toggleWishlist,
        isWishlisted,
        saveAddress,
        deleteAddress,
        setDefaultAddress,
        updateCustomerProfile,
        submitReturnRequest,
        customerNotifications,
        unreadNotificationsCount,
        markCustomerNotificationRead,
        markAllCustomerNotificationsRead,
        fetchCustomerNotifications,
        toastMessage,
        showToast
      }}
    >
      {children}
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3.5 rounded-lg shadow-xl border border-stone-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="h-2 w-2 rounded-full bg-teal-400"></div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
