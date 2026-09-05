/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { CategoryPage } from './pages/CategoryPage';
import { ProductDetail } from './pages/ProductDetail';
import { CartPage } from './pages/CartPage';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { TrackOrder } from './pages/TrackOrder';
import { AccountPage } from './pages/AccountPage';
import { PolicyPage } from './pages/PolicyPage';

// Admin Views
import { AdminLayout } from './admin/AdminLayout';
import { Dashboard } from './admin/Dashboard';
import { OrdersAdmin } from './admin/OrdersAdmin';
import { ProductsAdmin } from './admin/ProductsAdmin';
import { CategoriesAdmin } from './admin/CategoriesAdmin';
import { InventoryAdmin } from './admin/InventoryAdmin';
import { CustomersAdmin } from './admin/CustomersAdmin';
import { PaymentsAdmin } from './admin/PaymentsAdmin';
import { ShipmentsAdmin } from './admin/ShipmentsAdmin';
import { ReturnsRefundsAdmin } from './admin/ReturnsRefundsAdmin';
import { FinanceAdmin } from './admin/FinanceAdmin';
import { ReportsAdmin } from './admin/ReportsAdmin';
import { AnalyticsAdmin } from './admin/AnalyticsAdmin';
import { OperationsAdmin } from './admin/OperationsAdmin';
import { ContentAdmin } from './admin/ContentAdmin';
import { SettingsAdmin } from './admin/SettingsAdmin';
import { UsersAdmin } from './admin/UsersAdmin';
import { SuppliersAdmin } from './admin/SuppliersAdmin';
import { AuditAdmin } from './admin/AuditAdmin';
import { BackupAdmin } from './admin/BackupAdmin';
import { FraudRiskDashboard } from './admin/FraudRiskDashboard';
import { FulfillmentAdmin } from './admin/FulfillmentAdmin';
import { MarketingAdmin } from './admin/MarketingAdmin';
import { PromotionsAdmin } from './admin/PromotionsAdmin';
import { SupplierLoginPage } from './pages/supplier/SupplierLoginPage';
import { SupplierPortalPage } from './pages/supplier/SupplierPortalPage';
import { Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Layout wrapper for customer-facing storefront
function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-stone-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Keyboard skip navigation */}
      <a
        href="#storefront-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-teal-700 focus:text-white focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>
      <Header />
      <main id="storefront-main" className="flex-grow flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Global Toast Banner
function GlobalToast() {
  const { toastMessage } = useApp();
  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-stone-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <span className="w-2 h-2 rounded-full bg-teal-400"></span>
      <span>{toastMessage}</span>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <GlobalToast />
        <Routes>
          {/* Customer Storefront Routes */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/pages/:slug" element={<PolicyPage />} />
          </Route>

          {/* Phase 05: Admin Control Center Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<OrdersAdmin />} />
            <Route path="products" element={<ProductsAdmin />} />
            <Route path="categories" element={<CategoriesAdmin />} />
            <Route path="inventory" element={<InventoryAdmin />} />
            <Route path="suppliers" element={<SuppliersAdmin />} />
            <Route path="customers" element={<CustomersAdmin />} />
            <Route path="payments" element={<PaymentsAdmin />} />
            <Route path="shipments" element={<ShipmentsAdmin />} />
            <Route path="returns" element={<ReturnsRefundsAdmin />} />
            <Route path="refunds" element={<ReturnsRefundsAdmin />} />
            <Route path="finance" element={<FinanceAdmin />} />
            <Route path="reports" element={<ReportsAdmin />} />
            <Route path="analytics" element={<AnalyticsAdmin />} />
            <Route path="operations" element={<OperationsAdmin />} />
            <Route path="content" element={<ContentAdmin />} />
            <Route path="settings" element={<SettingsAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            {/* S2-2: this was redirected to the dashboard, stranding 1,323
                lines of coupon / flash-deal / loyalty UI whose API endpoints
                all exist and are unreachable any other way. */}
            <Route path="promotions" element={<PromotionsAdmin />} />
            <Route path="marketing" element={<MarketingAdmin />} />
            <Route path="marketing/command" element={<Navigate to="/admin/marketing?tab=command" replace />} />
            <Route path="fraud" element={<FraudRiskDashboard />} />
            <Route path="fulfillment" element={<FulfillmentAdmin />} />
            <Route path="audit" element={<AuditAdmin />} />
            <Route path="backup" element={<BackupAdmin />} />
          </Route>

          {/* Dedicated Isolated Supplier & Artisan Portal Routes */}
          <Route path="/supplier/login" element={<SupplierLoginPage />} />
          <Route path="/supplier" element={<SupplierPortalPage />} />
          <Route path="/supplier-portal" element={<Navigate to="/supplier" replace />} />
          <Route path="/supplier/*" element={<SupplierPortalPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
