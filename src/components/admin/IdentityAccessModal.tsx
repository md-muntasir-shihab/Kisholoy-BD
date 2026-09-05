import React, { useState } from 'react';
import { 
  X, ShieldCheck, UserCheck, Key, Lock, HelpCircle, LogOut, CheckCircle2, 
  AlertTriangle, ShieldAlert, Sparkles, RefreshCw, Eye, EyeOff, Building2,
  ChevronRight, Smartphone, Laptop, Clock, Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { useModalA11y } from '../../hooks/useModalA11y';

interface IdentityAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export const IdentityAccessModal: React.FC<IdentityAccessModalProps> = ({
  isOpen,
  onClose,
  onLogout
}) => {
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: isOpen,
    onClose,
    label: 'Identity Access',
  });

  const { currentRole, setCurrentRole, language, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'boundaries' | 'security' | 'switcher'>('overview');
  const [activeHelpPopup, setActiveHelpPopup] = useState<string | null>(null);

  if (!isOpen) return null;

  // Role metadata mapping
  const roleProfiles: Record<Role, {
    title: string;
    titleBn: string;
    description: string;
    canAccess: string[];
    canChange: string[];
    cannotChange: string[];
    whoManages: string;
    badgeColor: string;
  }> = {
    SUPER_ADMIN: {
      title: 'Super Administrator',
      titleBn: 'মাস্টার সুপার অ্যাডমিনিস্ট্রেটর',
      description: 'Master platform authority with unrestricted access to all operations, security configurations, root credentials, and database backups.',
      canAccess: [
        'Full System Dashboard & Analytics',
        'Staff Directory, Roles & RBAC Matrix',
        'Audit Ledger & Cryptographic Verification',
        'Database Backup, Export & Restoration',
        'Payment Gateway & Security Credentials',
        'Financial Settlements & Refund Approvals',
        'All Orders, Products, Inventory & Customers'
      ],
      canChange: [
        'Assign and change staff roles and permissions',
        'Modify payment gateway and courier API credentials',
        'Quarantine or unban suspicious IP addresses',
        'Restore database from point-in-time snapshots',
        'Create, update, or suspend any administrative account'
      ],
      cannotChange: [
        'Historical cryptographic audit log entries (tamper-evident SHA-256 chain)',
        'Customer raw payment card numbers (tokenized by gateway)'
      ],
      whoManages: 'Self-governed root account. Role alterations require root master authentication.',
      badgeColor: 'bg-red-100 text-red-900 border-red-200'
    },
    ADMIN: {
      title: 'System Administrator',
      titleBn: 'সিস্টেম অ্যাডমিনিস্ট্রেটর',
      description: 'Business administration authority overseeing daily operations, catalog, sales, inventory, and merchant management.',
      canAccess: [
        'Dashboard & Sales Analytics',
        'Product Catalog & Inventory Hubs',
        'Customer Directory & Orders Processing',
        'Suppliers Directory & Purchase Orders',
        'Website CMS, Banners & Legal Policies',
        'Operational Settings & Courier Allocations'
      ],
      canChange: [
        'Product descriptions, prices, categories, and stock',
        'Order status, shipping assignments, and address corrections',
        'Supplier records and purchasing invoices',
        'Promotional discount codes and marketing banners'
      ],
      cannotChange: [
        'Cannot alter Super Admin or Staff user roles and permissions',
        'Cannot modify root payment gateway API secrets',
        'Cannot initiate database snapshot restoration',
        'Cannot view tamper-evident security keys'
      ],
      whoManages: 'Super Administrator can manage and audit this account.',
      badgeColor: 'bg-teal-100 text-teal-950 border-teal-200'
    },
    ORDER_MANAGER: {
      title: 'Order & Dispatch Manager',
      titleBn: 'অর্ডার ও ডেলিভারি ম্যানেজার',
      description: 'Focused fulfillment authority managing customer orders, packing slips, courier dispatch, and delivery tracking.',
      canAccess: [
        'Orders Management & Filtering',
        'Shipments, Packing Slips & Waybills',
        'Fulfillment Hub Allocation',
        'Customer Delivery Details',
        'RMA Returns Intake & Exchange'
      ],
      canChange: [
        'Order statuses (Pending -> Confirmed -> Ready to Ship -> Shipped)',
        'Assign courier tracking numbers (Steadfast, Pathao, RedX)',
        'Update customer shipping addresses and phone numbers upon verification',
        'Record delivery notes and customer cancellation requests'
      ],
      cannotChange: [
        'Cannot adjust catalog prices or discount rates',
        'Cannot approve cash refunds or finance settlements',
        'Cannot modify staff permissions or security policies',
        'Cannot alter warehouse base stock quantities without inventory approval'
      ],
      whoManages: 'Admin or Super Administrator.',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-200'
    },
    INVENTORY_MANAGER: {
      title: 'Inventory & Hub Controller',
      titleBn: 'ইনভেন্টরি ও হাব কন্ট্রোলার',
      description: 'Warehouse logistics authority responsible for stock-in, hub transfers, threshold alerts, and supplier receiving.',
      canAccess: [
        'Inventory Management & Low-Stock Alerts',
        'Warehouse Movement & Stock Ledger',
        'Supplier Receiving & Procurement Records',
        'Product Catalog & SKU Barcodes'
      ],
      canChange: [
        'Receive and count new product stock from suppliers',
        'Record damaged, expired, or returned stock adjustments',
        'Transfer inventory between fulfillment centers and outlet stores',
        'Update SKU low-stock alert thresholds'
      ],
      cannotChange: [
        'Cannot view customer private billing information',
        'Cannot process financial payouts or gateway refunds',
        'Cannot alter website content, marketing, or banners',
        'Cannot modify user access permissions'
      ],
      whoManages: 'Admin or Super Administrator.',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200'
    },
    FINANCE: {
      title: 'Finance & Accounts Officer',
      titleBn: 'ফাইন্যান্স ও অ্যাকাউন্টস অফিসার',
      description: 'Financial auditor overseeing online payments, COD courier remittances, expense journals, and authorized customer refunds.',
      canAccess: [
        'Payment Transactions & Gateway Logs',
        'Courier COD Settlement & Discrepancies',
        'Customer Refund Approvals & Disbursement',
        'Supplier Payables & Expense Ledger',
        'Financial Profit & Loss (P&L) Reports'
      ],
      canChange: [
        'Verify and settle bKash, Nagad, and SSLCommerz gateway transactions',
        'Approve and disburse customer return refunds via original payment method',
        'Record operational supplier payments and business expenses',
        'Reconcile courier COD remittance cash'
      ],
      cannotChange: [
        'Cannot modify product stock levels or product listings',
        'Cannot dispatch or cancel shipments directly',
        'Cannot change user credentials or security firewalls',
        'Cannot modify completed audit ledger events'
      ],
      whoManages: 'Super Administrator.',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200'
    },
    SUPPORT: {
      title: 'Customer Support Representative',
      titleBn: 'কাস্টমার সাপোর্ট রিপ্রেজেন্টেটিভ',
      description: 'Customer service agent assisting shoppers with order tracking, product inquiries, address updates, and return requests.',
      canAccess: [
        'Customer Directory & Contact Information',
        'Order History & Live Courier Tracking',
        'Product Catalog & Sizing Guides',
        'Customer Support Notes & Return Requests'
      ],
      canChange: [
        'Add internal communication notes to customer profiles',
        'Submit return / RMA exchange requests on behalf of customers',
        'Update delivery contact instructions for courier delivery agents'
      ],
      cannotChange: [
        'Cannot issue financial refunds or modify invoice amounts',
        'Cannot change product prices, discounts, or stock',
        'Cannot modify system configurations or user accounts'
      ],
      whoManages: 'Admin or Super Administrator.',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-200'
    },
    SUPPLIER: {
      title: 'Product Supplier (Isolated Portal)',
      titleBn: 'পণ্য সরবরাহকারী (আইসোলেটেড পোর্টাল)',
      description: 'External vendor record with optional portal login. Strictly isolated: only views own supplied products, purchase orders, and payable balances.',
      canAccess: [
        'My Supplied Products (SKUs, Supply Cost, Active Status)',
        'My Purchase Orders & Invoices',
        'My Payments Received & Outstanding Payables',
        'Company Banking & MFS Disbursement Details'
      ],
      canChange: [
        'Acknowledge purchase order fulfillment readiness',
        'Update supplier banking / bKash merchant payout number'
      ],
      cannotChange: [
        'STRICTLY FORBIDDEN: Cannot view retail sales revenue or margins',
        'STRICTLY FORBIDDEN: Cannot view any customer personal details',
        'STRICTLY FORBIDDEN: Cannot view other competing suppliers',
        'STRICTLY FORBIDDEN: Cannot access administrative tools or settings'
      ],
      whoManages: 'Admin and Super Administrator manage supplier accounts.',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200'
    },
    MERCHANT: {
      title: 'Consignment Merchant Partner',
      titleBn: 'মার্চেন্ট পার্টনার',
      description: 'Consignment seller with scoped view of their assigned product line and associated customer sales volume.',
      canAccess: [
        'My Consigned Products & Inventory Counts',
        'Sales Volume for Assigned Products',
        'Monthly Merchant Commission Settlement'
      ],
      canChange: [
        'Propose new product listings for admin review',
        'View settlement invoice receipts'
      ],
      cannotChange: [
        'Cannot access general store customers or unassigned products',
        'Cannot change store-wide shipping fees or promotional banners'
      ],
      whoManages: 'Admin or Super Administrator.',
      badgeColor: 'bg-stone-100 text-stone-900 border-stone-200'
    },
    CUSTOMER: {
      title: 'Shopper / Customer Account',
      titleBn: 'গ্রাহক অ্যাকাউন্ট',
      description: 'Regular consumer shopper account for browsing, cart checkout, order tracking, multi-address storage, and returns.',
      canAccess: [
        'Storefront Catalog & Search',
        'My Cart, Wishlist & Saved Items',
        'My Past Orders & Delivery Tracking',
        'My Saved Shipping Addresses',
        'My Loyalty Points & Return Requests'
      ],
      canChange: [
        'Update personal name, phone, email, and password',
        'Add, edit, or delete shipping addresses',
        'Place orders with Cash on Delivery or Mobile Banking',
        'Initiate product return requests within policy window'
      ],
      cannotChange: [
        'STRICTLY BLOCKED: Cannot access any administrative dashboard',
        'Cannot view other customers’ orders or data',
        'Cannot modify product pricing, delivery fees, or inventory'
      ],
      whoManages: 'Self-managed profile. Customer Support can assist upon verification.',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200'
    }
  };

  const currentInfo = roleProfiles[currentRole] || roleProfiles.ADMIN;

  const helpDefinitions: Record<string, { title: string; desc: string }> = {
    role: {
      title: 'Role (ভূমিকা)',
      desc: 'A role is a predefined job title (e.g. Order Manager, Finance, Super Admin). It determines which screens you can see and which operations you can perform. It enforces the principle of least privilege.'
    },
    mfa: {
      title: 'MFA (Multi-Factor Authentication)',
      desc: 'MFA adds a second verification step (such as an authenticator app code or SMS OTP) on top of your password. Even if someone discovers your password, they cannot log in without the second factor. Sensitive accounts require MFA.'
    },
    session: {
      title: 'Session (সেশন)',
      desc: 'A session is an authorized connection created when you log in on a specific phone or computer. When you log out or if an admin revokes your session, that connection is immediately destroyed to protect your account.'
    },
    permission: {
      title: 'Permission (অনুমতি)',
      desc: 'A permission is a fine-grained rule allowing a specific action (e.g. ORDER_VIEW, REFUND_PROCESS, INVENTORY_ADJUST). Roles are made up of groups of permissions.'
    },
    supplier_login: {
      title: 'Supplier Login (সাপ্লায়ার লগইন)',
      desc: 'Suppliers are business entities in Kisholoy. By default, they do not have a login account. When portal access is enabled, a supplier can log in to an isolated view showing ONLY their own products, purchases, and payments.'
    }
  };

  return (
    <div ref={containerRef} {...dialogProps} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-900 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                <span>{language === 'BN' ? 'পরিচয় ও অ্যাক্সেস ইন্সপেক্টর' : 'Who Am I? Identity & Access Inspector'}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${currentInfo.badgeColor}`}>
                  {currentRole}
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                {language === 'BN' 
                  ? 'আপনার অ্যাকাউন্টের ভূমিকা, অনুমতি, কাজের পরিধি এবং সুরক্ষা তথ্য।' 
                  : 'Clear transparency on your operational permissions, security status, and system boundaries.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 px-6 bg-white gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-teal-900 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {language === 'BN' ? 'পরিচয় ও ভূমিকা' : 'Who Am I?'}
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'border-teal-900 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {language === 'BN' ? 'আমি কী পরিবর্তন করতে পারি?' : 'What Can I Access & Change?'}
          </button>
          <button
            onClick={() => setActiveTab('boundaries')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'boundaries'
                ? 'border-teal-900 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {language === 'BN' ? 'কী পরিবর্তন করা যাবে না' : 'What Can I NOT Change?'}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-teal-900 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {language === 'BN' ? 'সুরক্ষা ও সেশন' : 'Security & Sessions'}
          </button>
          <button
            onClick={() => setActiveTab('switcher')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap text-teal-900 ${
              activeTab === 'switcher'
                ? 'border-teal-900 text-teal-950 font-bold'
                : 'border-transparent text-teal-800 hover:text-teal-950'
            }`}
          >
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'BN' ? 'ভূমিকা পরিবর্তন ডেমো' : 'Switch Persona'}</span>
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-stone-700">
          
          {/* TAB 1: OVERVIEW ("WHO AM I?") */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              
              {/* Identity Card */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                      {language === 'BN' ? 'বর্তমান অ্যাকাউন্টের বিবরণ' : 'Authenticated Identity'}
                    </span>
                    <h3 className="text-lg font-bold text-stone-900">
                      {currentRole === 'CUSTOMER' ? 'Tanzil Ahmed (Registered Customer)' : 
                       currentRole === 'SUPPLIER' ? 'Silk Paradise Ltd. (Authorized Supplier)' : 
                       'Arifur Rahman (Internal Staff User)'}
                    </h3>
                    <p className="text-xs text-stone-500 font-mono">
                      {currentRole === 'CUSTOMER' ? 'tanzil@customer.kisholoy.com' : 
                       currentRole === 'SUPPLIER' ? 'silkparadise@supplier.kisholoy.com' : 
                       'arifur.rahman@staff.kisholoy.com'}
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${currentInfo.badgeColor}`}>
                    {currentInfo.title}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed bg-white p-3 rounded-xl border border-stone-200/80">
                  {currentInfo.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                    <span className="text-[10px] text-stone-400 block font-medium">Account Status</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      ACTIVE
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                    <span className="text-[10px] text-stone-400 block font-medium">MFA Protection</span>
                    <span className="font-bold text-teal-800 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {currentRole === 'SUPER_ADMIN' ? 'ENFORCED (TOTP)' : 'AVAILABLE'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-stone-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-stone-400 block font-medium">Who Manages Account</span>
                    <span className="font-semibold text-stone-700 block truncate mt-0.5">
                      {currentRole === 'SUPER_ADMIN' ? 'Root Governance' : 'Super Admin'}
                    </span>
                  </div>
                </div>
              </div>

              {/* What business information belongs to me? */}
              <div className="border border-stone-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-800" />
                  <span>{language === 'BN' ? 'আমার আওতাধীন ব্যবসায়িক তথ্য' : 'What Business Information Belongs to Me?'}</span>
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {currentRole === 'CUSTOMER'
                    ? 'Your personal profile, saved delivery addresses, past order history, wishlists, and loyalty point transactions.'
                    : currentRole === 'SUPPLIER'
                    ? 'Only records of products supplied by your business, purchase orders dispatched to you, and payment settlements received.'
                    : 'Authorized operational company records related to your department. All actions performed are cryptographically audited in the system ledger.'}
                </p>
              </div>

              {/* Contextual Glossary Buttons */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-stone-500 block uppercase tracking-wider">
                  {language === 'BN' ? 'সহায়ক পরিভাষা ও ব্যাখ্যা (ক্লিক করুন)' : 'Contextual Help Definitions (Click to learn):'}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveHelpPopup(activeHelpPopup === 'role' ? null : 'role')}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Role ⓘ</span>
                  </button>
                  <button
                    onClick={() => setActiveHelpPopup(activeHelpPopup === 'mfa' ? null : 'mfa')}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>MFA ⓘ</span>
                  </button>
                  <button
                    onClick={() => setActiveHelpPopup(activeHelpPopup === 'session' ? null : 'session')}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Session ⓘ</span>
                  </button>
                  <button
                    onClick={() => setActiveHelpPopup(activeHelpPopup === 'permission' ? null : 'permission')}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Permission ⓘ</span>
                  </button>
                  <button
                    onClick={() => setActiveHelpPopup(activeHelpPopup === 'supplier_login' ? null : 'supplier_login')}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Supplier Login ⓘ</span>
                  </button>
                </div>

                {activeHelpPopup && helpDefinitions[activeHelpPopup] && (
                  <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 text-teal-950 text-xs space-y-1 animate-in fade-in duration-150">
                    <div className="font-bold flex items-center gap-1.5 text-teal-900">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{helpDefinitions[activeHelpPopup].title}</span>
                    </div>
                    <p className="leading-relaxed text-teal-800">
                      {helpDefinitions[activeHelpPopup].desc}
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: WHAT CAN I ACCESS & CHANGE? */}
          {activeTab === 'permissions' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                  {language === 'BN' ? 'আমি কোন কোন এলাকা দেখতে পারি?' : 'What Can I Access?'}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {currentInfo.canAccess.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                      <span className="font-medium text-stone-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                  {language === 'BN' ? 'আমি কোন কোন তথ্য পরিবর্তন করতে পারি?' : 'What Can I Change?'}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {currentInfo.canChange.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                      <span className="font-medium text-emerald-950">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WHAT CAN I NOT CHANGE? */}
          {activeTab === 'boundaries' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Principle of Minimum Access Necessary</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  To protect customer privacy and business integrity, each account has strict boundaries. The following actions are restricted from your current role:
                </p>
              </div>

              <div className="space-y-2">
                {currentInfo.cannotChange.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50/50 border border-red-200/70 text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium text-red-950">{item}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200 pt-4 space-y-2">
                <h4 className="text-xs font-bold text-stone-900">
                  {language === 'BN' ? 'আমার ভূমিকা পরিবর্তন হলে কী ঘটবে?' : 'What Happens When My Role Changes?'}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Role adjustments take effect immediately. Any active session permissions are updated on next request. Elevated privileges (e.g. promoting to Admin or Super Admin) require explicit Super Admin authorization and log an indelible cryptographic audit event.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & SESSIONS */}
          {activeTab === 'security' && (
            <div className="space-y-5 text-xs">
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
                <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-teal-800" />
                  <span>{language === 'BN' ? 'অ্যাকাউন্ট সুরক্ষিত করার উপায়' : 'How Do I Secure My Account?'}</span>
                </h4>
                <ul className="space-y-2 text-stone-600">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-800 mt-1.5"></span>
                    <span>Use a unique password with at least 8 characters including numbers and symbols.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-800 mt-1.5"></span>
                    <span>Enable Multi-Factor Authentication (MFA) via Google Authenticator or SMS OTP.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-800 mt-1.5"></span>
                    <span>Always log out when finished, especially on shared or public computers.</span>
                  </li>
                </ul>
              </div>

              <div className="border border-stone-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-stone-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-teal-800" />
                    <span>Current Active Session</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Online Now
                  </span>
                </h4>

                <div className="space-y-1.5 text-stone-500 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Browser / Platform:</span>
                    <span className="text-stone-800">Chrome / Linux Sandbox Container</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IP Address:</span>
                    <span className="text-stone-800">127.0.0.1 (Local Verified Proxy)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Authentication Method:</span>
                    <span className="text-stone-800">PBKDF2-SHA512 Session Token</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-stone-500 text-[11px]">
                  Want to end this session?
                </span>
                <button
                  onClick={() => {
                    if (onLogout) {
                      onLogout();
                    } else {
                      showToast('Logged out successfully.');
                      onClose();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out Current Session</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: DEMO SWITCHER */}
          {activeTab === 'switcher' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-1">
                <span className="font-bold text-teal-950 block">Instant Identity Persona Switcher</span>
                <p className="text-teal-800 leading-relaxed">
                  Switch roles instantly to inspect how the navigation menu, permissions, and security boundaries respond to each distinct user type:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(roleProfiles) as Role[]).map((r) => {
                  const info = roleProfiles[r];
                  const isSelected = currentRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        setCurrentRole(r);
                        showToast(`Switched active persona to: ${info.title}`);
                      }}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'border-teal-900 bg-teal-900/5 shadow-xs ring-1 ring-teal-900'
                          : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900">{info.title}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${info.badgeColor}`}>
                          {r}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-2 leading-tight">
                        {info.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50/70 flex items-center justify-between text-xs text-stone-500">
          <span>Kisholoy RBAC Security Engine v2.4</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold transition-colors"
          >
            {language === 'BN' ? 'বন্ধ করুন' : 'Done & Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
