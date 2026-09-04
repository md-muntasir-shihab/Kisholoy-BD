import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, ExternalLink, UserCheck, 
  BookOpen, ArrowUpRight, Layers, ShieldCheck,
  Lock, LogOut, KeyRound, Building2, ScanLine,
  ChevronDown, ShoppingCart, Package, Users, Cpu
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { ADMIN_SECTIONS_DATA, getSectionBadgeCount } from './adminModulesData';
import { AdminModulesGuideModal } from './AdminModulesGuideModal';
import { AccessDenied } from '../components/admin/AccessDenied';
import { IdentityAccessModal } from '../components/admin/IdentityAccessModal';
import { SupplierPortalModal } from '../components/admin/SupplierPortalModal';
import { AdminNotificationAlerts } from '../components/admin/AdminNotificationAlerts';
import { AdminUrgentAlertBanner } from '../components/admin/AdminUrgentAlertBanner';
import { ScannerModal } from '../components/scan/ScannerModal';
import { LanguageButton } from '../components/layout/LanguageButton';
import { StaffLoginGate } from '../components/auth/StaffLoginGate';
import { staffLogout } from '../lib/apiAuth';
import { ThemeButton } from '../components/layout/ThemeButton';

// Route Access Control Matrix
const ROUTE_PERMISSIONS: Record<string, { requiredPermission: string; allowedRoles: Role[] }> = {
  '/admin/orders': { requiredPermission: 'ORDER_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'FINANCE', 'SUPPORT'] },
  '/admin/fraud': { requiredPermission: 'ORDER_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'] },
  '/admin/fulfillment': { requiredPermission: 'ORDER_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'INVENTORY_MANAGER'] },
  '/admin/shipments': { requiredPermission: 'ORDER_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'] },
  '/admin/returns': { requiredPermission: 'ORDER_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'FINANCE', 'SUPPORT'] },
  '/admin/products': { requiredPermission: 'PRODUCT_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT'] },
  '/admin/categories': { requiredPermission: 'PRODUCT_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'] },
  '/admin/inventory': { requiredPermission: 'INVENTORY_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'] },
  '/admin/suppliers': { requiredPermission: 'SUPPLIER_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'FINANCE'] },
  '/admin/customers': { requiredPermission: 'CUSTOMER_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'SUPPORT'] },
  '/admin/promotions': { requiredPermission: 'CONTENT_MANAGE', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  '/admin/marketing': { requiredPermission: 'CONTENT_MANAGE', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  '/admin/payments': { requiredPermission: 'PAYMENT_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
  '/admin/refunds': { requiredPermission: 'REFUND_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
  '/admin/finance': { requiredPermission: 'EXPENSE_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
  '/admin/reports': { requiredPermission: 'REPORT_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ORDER_MANAGER'] },
  '/admin/analytics': { requiredPermission: 'REPORT_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  '/admin/content': { requiredPermission: 'CONTENT_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  '/admin/operations': { requiredPermission: 'SETTINGS_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  '/admin/settings': { requiredPermission: 'SETTINGS_VIEW', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  '/admin/users': { requiredPermission: 'USER_MANAGE', allowedRoles: ['SUPER_ADMIN'] },
  '/admin/audit': { requiredPermission: 'SECURITY_MANAGE', allowedRoles: ['SUPER_ADMIN'] },
  '/admin/backup': { requiredPermission: 'BACKUP_CREATE', allowedRoles: ['SUPER_ADMIN'] },
};

export function AdminLayout() {
  const { currentRole, setCurrentRole, orders, products, language, setLanguage, siteContent, showToast } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [guideInitialSection, setGuideInitialSection] = useState<string>('all');
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [supplierPortalOpen, setSupplierPortalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar accordion: expanded section ids (auto-open the active section).
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set(['sales-operations']));
  useEffect(() => {
    setExpandedSections((prev) => {
      const active = ADMIN_SECTIONS_DATA.find((s) => s.items.some((i) => i.path === location.pathname));
      if (!active || prev.has(active.id)) return prev;
      const next = new Set(prev);
      next.add(active.id);
      return next;
    });
  }, [location.pathname]);
  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    'sales-operations': ShoppingCart,
    'catalog-inventory': Package,
    'customer-management': Users,
    'system-administration': Cpu,
  };

  const pendingOrdersCount = orders.filter(o => o.orderStatus === 'PENDING').length;
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const highRiskCount = orders.filter(o => o.fraudRisk && (o.fraudRisk.riskScore >= 60 || o.fraudRisk.riskRating === 'HIGH' || o.fraudRisk.riskRating === 'SUSPICIOUS')).length;

  const counts = {
    pendingOrders: pendingOrdersCount,
    lowStock: lowStockCount,
    fraudAlerts: highRiskCount
  };

  const isBn = language === 'BN';

  const roles: Role[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'ORDER_MANAGER',
    'INVENTORY_MANAGER',
    'FINANCE',
    'SUPPORT',
    'SUPPLIER',
    'MERCHANT',
    'CUSTOMER'
  ];

  const handleOpenGuide = (sectionId: string = 'all') => {
    setGuideInitialSection(sectionId);
    setGuideModalOpen(true);
  };

  // Check route access permission
  const currentRouteRule = ROUTE_PERMISSIONS[location.pathname];
  const isAllowedOnCurrentRoute = !currentRouteRule || currentRouteRule.allowedRoles.includes(currentRole);

  // Check if role is allowed to view a specific item
  const isItemAllowed = (itemPath: string) => {
    const rule = ROUTE_PERMISSIONS[itemPath];
    if (!rule) return true;
    return rule.allowedRoles.includes(currentRole);
  };

  return (
    <StaffLoginGate>
    <div id="admin-root-layout" className="h-screen overflow-hidden flex flex-col bg-stone-100/90 dark:bg-slate-950 text-stone-900 dark:text-slate-100 font-sans selection:bg-teal-900 selection:text-white transition-colors duration-200">
      {/* Top Operational Header */}
      <header id="admin-top-header" className="sticky top-0 z-30 bg-white/95 text-stone-900 border-b border-stone-200/90 dark:bg-stone-950/95 dark:text-white dark:border-stone-800/80 h-16 flex items-center justify-between px-4 sm:px-6 shadow-xs backdrop-blur-md transition-colors">
        <div className="flex items-center gap-3">
          <button
            id="admin-sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-700 to-teal-950 flex items-center justify-center font-serif font-black text-white text-base shadow-xs border border-teal-600/40">
              K
            </div>
            <span className="font-serif font-black text-lg sm:text-xl tracking-tight text-stone-900 dark:text-white">
              {siteContent.brandName}
            </span>
            <span className="text-teal-800 dark:text-teal-300 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800/80 uppercase tracking-wider hidden sm:inline-block">
              {isBn ? 'অপারেশনস কন্ট্রোল' : 'OPS CENTER'}
            </span>
          </Link>
        </div>

        {/* Topbar Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Server-session sign-out (audit C7: real sessions now exist) */}
          <button
            id="admin-session-logout-btn"
            onClick={() => { void staffLogout(); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 dark:bg-stone-900 dark:hover:bg-rose-950/60 text-stone-600 hover:text-rose-700 dark:text-stone-300 dark:hover:text-rose-300 border border-stone-200 dark:border-stone-800 text-xs font-semibold transition-all"
            title="Sign out — terminates the server-side session / সাইন আউট"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          
          {/* Who Am I? Identity Inspector Trigger */}
          <button
            onClick={() => setInspectorOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-850 text-stone-800 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-800 text-xs font-semibold shadow-2xs transition-all"
            title="Inspect your operational access and role permissions"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="font-mono text-teal-800 dark:text-teal-300 font-bold">{currentRole}</span>
            <span className="hidden xl:inline text-stone-500 dark:text-stone-400 font-normal">| {isBn ? 'অ্যাক্সেস রুলস' : 'Permissions'}</span>
          </button>

          {/* Quick Role Persona Switcher */}
          <div className="hidden sm:flex items-center gap-2 bg-stone-100 dark:bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800">
            <UserCheck className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <select
              id="admin-role-selector"
              value={currentRole}
              onChange={(e) => {
                const newR = e.target.value as Role;
                setCurrentRole(newR);
                showToast(`Switched active role to ${newR}`);
              }}
              className="bg-transparent text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r} value={r} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white">
                  {r.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Notification Alert Center (Fraud Risks, Pending Settlements, RMA) */}
          <AdminNotificationAlerts />

          {/* Global Code Scanner (Order / Tracking / SKU) */}
          <button
            id="admin-open-scanner-btn"
            onClick={() => setScannerOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 text-xs font-semibold shadow-2xs hover:text-white transition-all"
            title={isBn ? 'অর্ডার/ট্র্যাকিং/SKU স্ক্যান করুন' : 'Scan an order, tracking ID or SKU'}
          >
            <ScanLine className="w-3.5 h-3.5 text-teal-400" />
            <span>{isBn ? 'স্ক্যান' : 'Scan'}</span>
          </button>

          {/* Work Guide Button */}
          <button
            id="admin-open-work-guide-btn"
            onClick={() => handleOpenGuide('all')}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-850 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 text-xs font-semibold shadow-2xs hover:text-stone-900 dark:hover:text-white transition-all"
            title={isBn ? 'সকল সেকশন ও কাজের বিবরণী দেখুন' : 'View all sections and work details'}
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{isBn ? 'কাজের গাইড' : 'Work Guide'}</span>
          </button>

          {/* Quick Language Toggle (icon-only) */}
          <LanguageButton />

          {/* Theme Mode Switcher (Light / Dark / System) */}
          <span id="admin-theme-toggle-btn">
            <ThemeButton />
          </span>

          {/* Live Storefront Link */}
          <Link
            id="admin-live-store-link"
            to="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-750 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>{isBn ? 'লাইভ ওয়েবসাইট' : 'Live Store'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Real-time Urgent Operational Marquee/Banner (High Fraud Risk / Pending Settlements) */}
      <AdminUrgentAlertBanner />

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Mobile / Tablet Backdrop Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-15 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          id="admin-sidebar"
          className={`fixed inset-y-0 left-0 z-20 w-72 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-300 border-r border-stone-200/90 dark:border-stone-800/80 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 pt-16 lg:pt-0 min-h-0 flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Identity & Scope Indicator */}
          <div className="p-3 bg-stone-50/80 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-850 flex items-center justify-between">
            <button
              onClick={() => setInspectorOpen(true)}
              className="flex items-center gap-2.5 text-left w-full p-2.5 rounded-2xl bg-white dark:bg-stone-900/90 hover:bg-stone-100 dark:hover:bg-stone-850 border border-stone-200 dark:border-stone-800/90 text-stone-800 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-all group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-800 to-teal-950 text-teal-100 flex items-center justify-center font-bold text-xs shadow-xs border border-teal-700/40">
                {currentRole.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-stone-900 dark:text-white block truncate">
                  {currentRole.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono block truncate">
arena/01a06c02-kisholoy-bd
                  {isBn ? 'আরবিএসি সক্রিয়' : 'RBAC Active'} • {isBn ? 'রুলস দেখুন' : 'Click to view rules'}

                  {isBn ? 'আরবিএসি সক্রিয়' : 'RBAC Active'} • {isBn ? 'রুলস দেখুন' : 'View rules'}
 main
                </span>
              </div>
              <KeyRound className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
            </button>
          </div>

          <nav id="admin-sidebar-nav" className="flex-1 min-h-0 overflow-y-auto p-3">
            {ADMIN_SECTIONS_DATA.map((section) => {
              // Filter section items based on current role permissions
              const allowedItems = section.items.filter(item => isItemAllowed(item.path));
              if (allowedItems.length === 0) return null;

              const isOpen = expandedSections.has(section.id);
              const SectionIcon = SECTION_ICONS[section.id] || Layers;

              return (
                <div key={section.id} id={`section-${section.id}`} className="mb-1.5">
                  {/* Group Header (accordion) */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-left ${
                      isOpen
                        ? 'bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-white'
                        : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-900 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 border ${
                      isOpen
                        ? 'bg-teal-50 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                        : 'bg-stone-100 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                    }`}>
                      <SectionIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold truncate leading-tight">{isBn ? section.titleBn : section.title}</div>
                      <div className="text-[10px] text-stone-400 truncate">
                        {allowedItems.length} {isBn ? 'মডিউল' : 'modules'}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Section Items */}
                  {isOpen && (
                    <div className="mt-1 space-y-0.5">
                      {allowedItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        const badge = getSectionBadgeCount(item.badgeKey, counts);

                        return (
                          <Link
                            key={item.path}
                            id={item.id}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`relative flex items-center justify-between pl-4 pr-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                              isActive
                                ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 font-semibold shadow-xs border border-teal-200/60 dark:border-teal-800/60'
                                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 hover:text-stone-900 dark:hover:text-stone-100'
                            }`}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-teal-600" />
                            )}
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-700 dark:text-teal-300' : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300'}`} />
                              <span className="truncate font-medium">{isBn ? item.labelBn : item.label}</span>
                            </div>

 arena/01a06c02-kisholoy-bd
                            <div className="flex items-center gap-1.5 shrink-0">
                              {badge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                                  {isBn ? badge.labelBn : badge.label}
                                </span>
                              )}
                            </div>

                            {badge && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${badge.color}`}>
                                {isBn ? badge.labelBn : badge.label}
                              </span>
                            )}
main
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-stone-700 dark:text-stone-300">{isBn ? 'আরবিএসি সক্রিয়' : 'RBAC Active'}</span>
            </div>
            <button
              onClick={() => setInspectorOpen(true)}
              className="text-[11px] text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 font-semibold underline underline-offset-2"
            >
              {isBn ? 'অ্যাক্সেস পরীক্ষা' : 'Inspect Access'}
            </button>
          </div>
        </aside>

        {/* Main Operational Workspace */}
        <main id="admin-main-viewport" className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Customer / Supplier Access Boundary Check */}
          {currentRole === 'CUSTOMER' ? (
            <AccessDenied
              requiredPermission="STAFF_INTERNAL_ACCESS"
              allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'INVENTORY_MANAGER', 'FINANCE', 'SUPPORT']}
              onOpenInspector={() => setInspectorOpen(true)}
            />
          ) : currentRole === 'SUPPLIER' ? (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 p-8 shadow-xs text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-stone-900">
                  {isBn ? 'সাপ্লায়ার আইসোলেটেড পোর্টাল' : 'Supplier Portal Scoped Access'}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {isBn
                    ? 'সাপ্লায়ার অ্যাকাউন্ট শুধুমাত্র তাদের নিজস্ব সরবরাহকৃত পণ্য, ক্রয়াদেশ ও পেমেন্ট হিস্ট্রি দেখতে পারে।'
                    : 'As an authorized supplier, your access is strictly isolated from internal customer data, sales revenue, and system settings.'}
                </p>
                <button
                  onClick={() => setSupplierPortalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-semibold shadow-xs"
                >
                  {isBn ? 'আইসোলেটেড পোর্টাল ওপেন করুন' : 'Open Supplier Isolated Portal'}
                </button>
              </div>
            </div>
          ) : !isAllowedOnCurrentRoute ? (
            <AccessDenied
              requiredPermission={currentRouteRule?.requiredPermission || 'RESTRICTED_ACCESS'}
              allowedRoles={currentRouteRule?.allowedRoles}
              onOpenInspector={() => setInspectorOpen(true)}
            />
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* Global Interactive Work Guide Modal */}
      <AdminModulesGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        initialSectionId={guideInitialSection}
      />

      {/* Identity & Access Inspector Modal ("Who Am I?") */}
      <IdentityAccessModal
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        onLogout={() => {
          showToast('Session terminated. Switched to Guest.');
          setCurrentRole('CUSTOMER');
          setInspectorOpen(false);
          navigate('/');
        }}
      />

      {/* Supplier Portal Preview Modal */}
      <SupplierPortalModal
        isOpen={supplierPortalOpen}
        onClose={() => setSupplierPortalOpen(false)}
        supplier={{
          id: 'sup-001',
          name: 'Silk Paradise Ltd.',
          code: 'SPL-DHK',
          contactPerson: 'Kamal Hossain',
          email: 'silkparadise@supplier.kisholoy.com',
          phone: '+880 1711-223344',
          address: 'Mirpur-10, Dhaka',
          district: 'Dhaka',
          division: 'Dhaka',
          status: 'ACTIVE',
          createdAt: '2025-01-10',
          updatedAt: '2026-03-01',
          totalPurchased: 450000,
          totalPaid: 380000,
          outstandingDue: 70000,
          paymentTermsDays: 15,
          suppliedProducts: [
            { productId: 'prod-001', productName: 'Handloom Jamdani Saree', sku: 'JAM-DHK-001', supplyPrice: 8500, leadTimeDays: 3, isPrimarySupplier: true },
            { productId: 'prod-002', productName: 'Pure Rajshahi Silk Dupatta', sku: 'SLK-RAJ-002', supplyPrice: 2200, leadTimeDays: 2, isPrimarySupplier: true }
          ],
          portalAccess: {
            enabled: true,
            email: 'silkparadise@supplier.kisholoy.com',
            role: 'SUPPLIER',
            lastLoginAt: '2026-03-02T10:15:00Z'
          }
        }}
      />

      {/* Global Code Scanner Modal (Barcode / QR / Manual) */}
      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />
    </div>
    </StaffLoginGate>
  );
}


