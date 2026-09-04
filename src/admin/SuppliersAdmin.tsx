/**
 * KISHOLOY Phase 05: Supplier Management & Procurement Control Center
 * Server-authoritative financial balance, purchase orders, payment disbursements,
 * isolated portal access feature-flagging, and 11-point contextual help.
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, RefreshCw, HelpCircle, CheckCircle2, AlertTriangle, 
  Search, Filter, DollarSign, Calendar, Truck, ArrowUpRight, ArrowDownRight, 
  ShieldCheck, Lock, Eye, FileText, Check, X, ShieldAlert, Key, ExternalLink,
  Smartphone, Warehouse, UploadCloud
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  Supplier, 
  SupplierPurchaseOrder, 
  SupplierPayment, 
  SupplierOverviewMetrics, 
  SupplierStatus,
  SupplierDetailResponse
} from '../types';
import { SUPPLIER_HELP_DEFINITIONS, SupplierFunctionHelp } from './supplierHelpData';
import { BulkSupplierImportModal } from './BulkSupplierImportModal';
import { SupplierPortalModal } from '../components/admin/SupplierPortalModal';
import { AdvancedSupplierLedgerModal } from '../components/admin/AdvancedSupplierLedgerModal';
import { SupplierAgreementsView } from '../components/admin/SupplierAgreementsView';
import { SupplyBatchesView } from '../components/admin/SupplyBatchesView';
import { SupplierSettlementsView } from '../components/admin/SupplierSettlementsView';
import { supplierSchema, purchaseOrderSchema, formatZodError } from '../lib/validations';
import { SupplierStatementModal } from '../components/admin/SupplierStatementModal';

export function SuppliersAdmin() {
  const { currentRole, language, showToast, products } = useApp();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'agreements' | 'batches' | 'pos' | 'payments' | 'settlements' | 'portal'>('suppliers');
  const [previewPortalSupplier, setPreviewPortalSupplier] = useState<Supplier | null>(null);
  const [statementSupplierId, setStatementSupplierId] = useState<string | null>(null);

  // Safe currency formatter and toast notifier
  const formatPrice = (amount?: number | null) => {
    const val = Number(amount) || 0;
    return `৳ ${val.toLocaleString('en-US')}`;
  };

  const notify = (msg: string) => {
    if (typeof showToast === 'function') {
      showToast(msg);
    }
  };

  // State from server
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [metrics, setMetrics] = useState<SupplierOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal / Drawer state
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierDetail, setSupplierDetail] = useState<SupplierDetailResponse | null>(null);

  // New Supplier Form
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newTaxId, setNewTaxId] = useState('');
  const [newTradeLicense, setNewTradeLicense] = useState('');
  const [newPaymentTerms, setNewPaymentTerms] = useState<Supplier['paymentTerms']>('NET_30');

  // New Purchase Order Form
  const [createPoOpen, setCreatePoOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poWarehouse, setPoWarehouse] = useState('hub-central-tejg');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; productName: string; quantity: number; unitCost: number }[]>([
    { 
      productId: products[0]?.id || 'prod-1', 
      productName: products[0]?.title || 'Jamdani Saree', 
      quantity: 50, 
      unitCost: products[0]?.costPrice || 1800 
    }
  ]);

  // Payment Disbursement Form
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentSupplierId, setPaymentSupplierId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'BKASH_MERCHANT' | 'CASH' | 'CHEQUE'>('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Step-Up MFA State for High-Value Payouts
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [pendingPaymentPayload, setPendingPaymentPayload] = useState<any>(null);

  // ⓘ Contextual Help Modal State
  const [activeHelp, setActiveHelp] = useState<SupplierFunctionHelp | null>(null);

  // Load suppliers and summary from API
  const loadSupplierData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.suppliers);
        setMetrics(data.metrics);
      }
    } catch (err: any) {
      console.error('Failed to load suppliers:', err);
      notify('Failed to load supplier directory from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, []);

  // Fetch supplier detailed ledger
  const openSupplierDetail = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`);
      const data = await res.json();
      if (data.success) {
        setSupplierDetail(data);
        if (data.supplier) {
          setSelectedSupplier(data.supplier);
        }
      }
    } catch (err) {
      console.error('Failed to fetch supplier detail:', err);
    }
  };

  // Create Supplier Handler
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawSupplier = {
      companyName: newCompanyName.trim(),
      contactPerson: newContactPerson.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim() || 'Central Dhaka',
      tradeLicenseNumber: newTradeLicense.trim() || undefined,
      tinNumber: newTaxId.trim() || undefined,
      paymentTerms: newPaymentTerms,
    };

    const valResult = supplierSchema.safeParse(rawSupplier);
    if (!valResult.success) {
      notify(formatZodError(valResult.error));
      return;
    }

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...valResult.data,
          operator: currentRole
        })
      });
      const data = await res.json();
      if (data.success) {
        notify(`Supplier ${newCompanyName} registered successfully.`);
        setCreateSupplierOpen(false);
        // Reset form
        setNewCompanyName('');
        setNewContactPerson('');
        setNewEmail('');
        setNewPhone('');
        setNewAddress('');
        setNewTaxId('');
        setNewTradeLicense('');
        loadSupplierData();
      } else {
        notify(data.error || 'Failed to create supplier.');
      }
    } catch (err: any) {
      notify(err.message);
    }
  };

  // Issue Purchase Order Handler
  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawPo = {
      supplierId: poSupplierId,
      warehouseId: poWarehouse,
      expectedDeliveryDate: poExpectedDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes: poNotes.trim() || undefined,
      items: poItems.map(item => ({
        productId: item.productId,
        productTitle: item.productName || 'Product Item',
        sku: 'SKU-GEN',
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost)
      })),
      operatorName: `${currentRole} Operator`
    };

    const valResult = purchaseOrderSchema.safeParse(rawPo);
    if (!valResult.success) {
      notify(formatZodError(valResult.error));
      return;
    }

    try {
      const res = await fetch(`/api/suppliers/${poSupplierId}/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valResult.data)
      });
      const data = await res.json();
      if (data.success) {
        notify(`Purchase order ${data.po.poNumber} issued successfully.`);
        setCreatePoOpen(false);
        loadSupplierData();
        if (selectedSupplier && selectedSupplier.id === poSupplierId) {
          openSupplierDetail(selectedSupplier);
        }
      } else {
        notify(data.error || 'Failed to issue purchase order.');
      }
    } catch (err: any) {
      notify(err.message);
    }
  };

  // Mark PO Received (Triggers automated stock increment)
  const handleMarkPoReceived = async (supplierId: string, poId: string) => {
    if (!confirm('Marking this PO as RECEIVED will automatically increment product inventory in the active catalog. Confirm receipt?')) {
      return;
    }

    try {
      const res = await fetch(`/api/suppliers/${supplierId}/pos/${poId}/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RECEIVED', operator: currentRole })
      });
      const data = await res.json();
      if (data.success) {
        notify('Purchase order received! Live stock levels incremented automatically.');
        loadSupplierData();
        if (selectedSupplier) openSupplierDetail(selectedSupplier);
      } else {
        notify(data.error || 'Failed to update delivery status.');
      }
    } catch (err: any) {
      notify(err.message);
    }
  };

  // Submit Payment Disbursement
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSupplierId || paymentAmount <= 0) {
      notify('Please select supplier and specify a positive amount.');
      return;
    }

    const payload = {
      supplierId: paymentSupplierId,
      amount: Number(paymentAmount),
      paymentMethod,
      referenceNumber: paymentRef || `VOUCHER-${Date.now().toString().slice(-6)}`,
      notes: paymentNotes,
      operator: `${currentRole} Officer`
    };

    // Sensitive Action Check: If amount >= 50,000 BDT, require Step-Up MFA confirmation
    if (payload.amount >= 50000) {
      setPendingPaymentPayload(payload);
      setMfaModalOpen(true);
      return;
    }

    executePaymentDisbursement(payload);
  };

  const executePaymentDisbursement = async (payload: any, code?: string) => {
    try {
      const res = await fetch(`/api/suppliers/${payload.supplierId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          mfaCode: code
        })
      });
      const data = await res.json();
      if (data.success) {
        notify(`Payment voucher for ${formatPrice(payload.amount)} recorded.`);
        setRecordPaymentOpen(false);
        setMfaModalOpen(false);
        setPendingPaymentPayload(null);
        setMfaCode('');
        loadSupplierData();
        if (selectedSupplier && selectedSupplier.id === payload.supplierId) {
          openSupplierDetail(selectedSupplier);
        }
      } else {
        notify(data.error || 'Failed to disburse payment.');
      }
    } catch (err: any) {
      notify(err.message);
    }
  };

  // Confirm MFA for High-Value Payout
  const handleConfirmMfaPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length < 6) {
      notify('Please enter a 6-digit MFA verification code.');
      return;
    }
    executePaymentDisbursement(pendingPaymentPayload, mfaCode);
  };

  // Toggle Supplier Portal Access (Feature flag)
  const handleTogglePortal = async (supplierId: string, currentEnabled: boolean) => {
    const action = currentEnabled ? 'disable' : 'enable';
    if (!confirm(`Are you sure you want to ${action} isolated self-service portal access for this vendor?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/suppliers/${supplierId}/toggle-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled, operator: currentRole })
      });
      const data = await res.json();
      if (data.success) {
        notify(`Supplier portal access ${!currentEnabled ? 'ENABLED' : 'DISABLED'}.`);
        loadSupplierData();
        if (selectedSupplier && selectedSupplier.id === supplierId) {
          openSupplierDetail(data.supplier);
        }
      } else {
        notify(data.error || 'Failed to update portal access.');
      }
    } catch (err: any) {
      notify(err.message);
    }
  };

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.phone.includes(searchQuery) ||
                          s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="suppliers-admin-container" className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-teal-50 text-teal-900 border border-teal-200">
              {language === 'BN' ? 'ক্যাটালগ ও ইনভেন্টরি' : 'CATALOG & INVENTORY'}
            </span>
            <span className="text-xs text-stone-400 font-mono">/</span>
            <span className="text-xs font-semibold text-stone-600 font-mono">SUPPLIERS & PROCUREMENT</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-900 text-white rounded-xl shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif font-bold text-stone-900">
                  {language === 'BN' ? 'সরবরাহকারী ও সংগ্রহ ব্যবস্থাপনা' : 'Suppliers & Procurement Ledger'}
                </h1>
                <button
                  onClick={() => setActiveHelp(SUPPLIER_HELP_DEFINITIONS.supplier_ledger)}
                  className="text-stone-400 hover:text-teal-700 p-1 rounded-full hover:bg-stone-100 transition-colors"
                  title="Explain Supplier Ledger"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-0.5 max-w-2xl">
                {language === 'BN' 
                  ? 'নিরাপদ ক্রয়াদেশ (পিও), গুদাম ইনভেন্টরি অটোমেশন, অর্থ পরিশোধ ভাউচার এবং ফিচার-ফ্ল্যাগযুক্ত সেলফ-সার্ভিস পোর্টাল নিয়ন্ত্রণ কেন্দ্র।'
                  : 'Server-authoritative procurement ledger, purchase order stock inflow, payment disbursements, and isolated vendor self-service.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadSupplierData}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'BN' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setCreatePoOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'নতুন ক্রয়াদেশ' : 'Issue PO'}</span>
          </button>

          <button
            onClick={() => setRecordPaymentOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'পেমেন্ট প্রদান' : 'Pay Supplier'}</span>
          </button>

          <button
            onClick={() => setBulkImportOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
            title={language === 'BN' ? 'CSV বা JSON থেকে বাল্ক সরবরাহকারী আমদানি করুন' : 'Bulk import suppliers via CSV or JSON'}
          >
            <UploadCloud className="w-3.5 h-3.5 text-teal-800" />
            <span>{language === 'BN' ? 'বাল্ক ইম্পোর্ট' : 'Bulk Import'}</span>
          </button>

          <button
            onClick={() => setCreateSupplierOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-teal-900 hover:bg-teal-950 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'সরবরাহকারী যোগ' : 'Add Supplier'}</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{language === 'BN' ? 'মোট সরবরাহকারী' : 'Active Suppliers'}</span>
              <Building2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-stone-900 mt-2 font-mono">
              {metrics.activeSuppliers}
              <span className="text-xs font-sans text-stone-400 font-normal ml-2">/ {metrics.totalSuppliers} total</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>100% verified vendors</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{language === 'BN' ? 'মোট ক্রয় পরিমাণ' : 'Total Purchased'}</span>
              <ArrowUpRight className="w-4 h-4 text-stone-600" />
            </div>
            <div className="text-2xl font-bold text-stone-900 mt-2 font-mono">
              {formatPrice(metrics.totalSourcedBdt ?? (metrics as any).totalPurchased ?? 0)}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              Across issued procurement orders
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{language === 'BN' ? 'মোট পরিশোধিত অর্থ' : 'Total Paid to Date'}</span>
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
              {formatPrice(metrics.totalPaidBdt ?? (metrics as any).totalPaid ?? 0)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium">
              Reconciled bank & bKash payouts
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{language === 'BN' ? 'মোট বকেয়া ব্যালেন্স' : 'Total Outstanding Due'}</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-2 font-mono">
              {formatPrice(metrics.totalOutstandingDueBdt ?? (metrics as any).totalDue ?? 0)}
            </div>
            <div className="text-[11px] text-amber-600 mt-1 font-medium">
              Accounts payable obligation
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'suppliers'
              ? 'border-teal-900 text-teal-950 font-bold bg-stone-50/50'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Building2 className="w-4 h-4 text-teal-700" />
          <span>{language === 'BN' ? 'সরবরাহকারী তালিকা' : 'Suppliers Directory'}</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-600 font-mono">
            {suppliers.length}
          </span>
        </button>

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('agreements')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'agreements'
                ? 'border-teal-900 text-teal-950 font-bold bg-stone-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <FileText className="w-4 h-4 text-teal-700" />
            <span>{language === 'BN' ? 'বাণিজ্যিক চুক্তি' : 'Agreements'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveHelp(SUPPLIER_HELP_DEFINITIONS.supplier_agreements)}
            className="text-stone-400 hover:text-teal-700 p-1 rounded hover:bg-stone-100"
            title="Explain Agreements"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('batches')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'batches'
                ? 'border-teal-900 text-teal-950 font-bold bg-stone-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Warehouse className="w-4 h-4 text-teal-700" />
            <span>{language === 'BN' ? 'সাপ্লাই ব্যাচ ও ইনভেন্টরি' : 'Supply Batches'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveHelp(SUPPLIER_HELP_DEFINITIONS.supply_batches)}
            className="text-stone-400 hover:text-teal-700 p-1 rounded hover:bg-stone-100"
            title="Explain Supply Batches"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('settlements')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'settlements'
                ? 'border-teal-900 text-teal-950 font-bold bg-stone-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <span>{language === 'BN' ? 'সেটেলমেন্ট ও প্রদেয়' : 'Settlements & Payables'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveHelp(SUPPLIER_HELP_DEFINITIONS.settlement_calculation)}
            className="text-stone-400 hover:text-teal-700 p-1 rounded hover:bg-stone-100"
            title="Explain Settlements"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'pos'
                ? 'border-teal-900 text-teal-950 font-bold bg-stone-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Truck className="w-4 h-4 text-teal-700" />
            <span>{language === 'BN' ? 'ক্রয়াদেশ ও স্টক গ্রহণ' : 'Purchase Orders'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveHelp(SUPPLIER_HELP_DEFINITIONS.purchase_orders)}
            className="text-stone-400 hover:text-teal-700 p-1 rounded hover:bg-stone-100"
            title="Explain Purchase Orders"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-teal-900 text-teal-950 font-bold bg-stone-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <span>{language === 'BN' ? 'পেমেন্ট ও ভাউচার' : 'Payment Vouchers'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveHelp(SUPPLIER_HELP_DEFINITIONS.payment_vouchers)}
            className="text-stone-400 hover:text-teal-700 p-1 rounded hover:bg-stone-100"
            title="Explain Payment Vouchers"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('portal')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'portal'
                ? 'border-teal-900 text-teal-950 font-bold bg-stone-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-700" />
            <span>{language === 'BN' ? 'আইসোলেটেড ভেন্ডর পোর্টাল' : 'Isolated Portal Access'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveHelp(SUPPLIER_HELP_DEFINITIONS.isolated_portal)}
            className="text-stone-400 hover:text-teal-700 p-1 rounded hover:bg-stone-100"
            title="Explain Isolated Portal"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab: Commercial Agreements */}
      {activeTab === 'agreements' && (
        <SupplierAgreementsView
          suppliers={suppliers}
          onOpenHelp={setActiveHelp}
        />
      )}

      {/* Tab: Supply Batches */}
      {activeTab === 'batches' && (
        <SupplyBatchesView
          suppliers={suppliers}
          onOpenHelp={setActiveHelp}
        />
      )}

      {/* Tab: Settlements & Payables */}
      {activeTab === 'settlements' && (
        <SupplierSettlementsView
          suppliers={suppliers}
          onOpenHelp={setActiveHelp}
          onOpenStatement={(suppId) => setStatementSupplierId(suppId)}
        />
      )}

      {/* Tab 1: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-stone-200 p-6 shadow-xs space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'BN' ? 'কোম্পানি বা ব্যক্তির নাম দিয়ে খুঁজুন...' : 'Search supplier or contact...'}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Terms / Tax ID</th>
                  <th className="py-3 px-4">Total Purchased</th>
                  <th className="py-3 px-4">Total Paid</th>
                  <th className="py-3 px-4">Current Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400">
                      No suppliers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{supplier.companyName}</div>
                        <div className="text-[11px] text-stone-400 font-mono">{supplier.code} • {supplier.contactPerson}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">
                        <div>{supplier.phone}</div>
                        <div className="text-[11px] text-stone-400">{supplier.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-700">{supplier.paymentTerms}</div>
                        <div className="text-[10px] text-stone-400 font-mono">BIN: {supplier.taxIdentificationNumber || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-stone-900">
                        {formatPrice(supplier.totalPurchased)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                        {formatPrice(supplier.totalPaid)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={supplier.totalDue > 0 ? 'text-amber-700' : 'text-stone-400'}>
                          {formatPrice(supplier.totalDue)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          supplier.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : supplier.status === 'UNDER_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}>
                          {supplier.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => openSupplierDetail(supplier)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                        >
                          View Ledger
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Purchase Orders */}
      {activeTab === 'pos' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Active Purchase Orders</h3>
              <p className="text-xs text-stone-500">Track vendor shipments, receiving checkpoints, and inventory inflow.</p>
            </div>
            <button
              onClick={() => setCreatePoOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue New PO</span>
            </button>
          </div>

          <div className="border border-stone-200 rounded-lg divide-y divide-stone-100">
            {suppliers.flatMap(s => (s as any).purchaseOrders || []).length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                Select a supplier above to inspect their purchase orders or click "Issue New PO".
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Tab 3: Payments & Disbursements */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Payment Vouchers & Settlement</h3>
              <p className="text-xs text-stone-500">Authorized vendor disbursements. Payments ≥ 50,000 BDT require Step-Up MFA authorization.</p>
            </div>
            <button
              onClick={() => setRecordPaymentOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg flex items-center gap-1"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Disburse Payment</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Isolated Vendor Portal */}
      {activeTab === 'portal' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-stone-200 p-6 shadow-xs space-y-6">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <Lock className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-stone-900">Dedicated Isolated Supplier & Artisan Portal</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  To guarantee zero-trust security and absolute customer data isolation, suppliers authenticate via their own isolated vendor portal at <code className="bg-stone-200 px-1 py-0.5 rounded font-mono text-stone-900">/supplier/login</code>. 
                  They can view real-time delivered sales revenue, supply batch stocks, PO invoices, settlement cycles, and verified payout vouchers.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Architecture Guarantee:</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> No Internal Admin Access
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> No Customer PII Exposure
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    <CheckCircle2 className="w-3 h-3" /> Real-time Revenue Formulas
                  </span>
                </div>
              </div>
            </div>

            <a
              href="/supplier/login"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch Live Supplier Portal</span>
            </a>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Feature-Flag Status & Vendor Access per Supplier</h4>
            <div className="border border-stone-200 rounded-lg divide-y divide-stone-100">
              {suppliers.map(s => (
                <div key={s.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-stone-50 transition-colors">
                  <div>
                    <div className="font-bold text-stone-900 text-xs flex items-center gap-2">
                      <span>{s.companyName}</span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-mono">
                        {s.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                      Login Email: <strong className="text-stone-800">{s.portalAccess?.loginEmail || s.email}</strong> • Default Password: <code className="text-stone-600 font-mono">kisholoy2026</code>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      s.portalAccess?.enabled 
                        ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      {s.portalAccess?.enabled ? 'PORTAL ACTIVE' : 'PORTAL LOCKED'}
                    </span>
                    
                    <button
                      onClick={() => {
                        // Store session and open live portal directly
                        localStorage.setItem('ksh_supplier_token', `ksh-sup-token-${s.id}-${Date.now()}`);
                        localStorage.setItem('ksh_supplier_user', JSON.stringify(s));
                        window.open('/supplier', '_blank');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-1 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Open Live Vendor Hub</span>
                    </button>

                    <button
                      onClick={() => setPreviewPortalSupplier(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 flex items-center gap-1 border border-stone-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Admin Preview</span>
                    </button>

                    <button
                      onClick={() => handleTogglePortal(s.id, Boolean(s.portalAccess?.enabled))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        s.portalAccess?.enabled
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {s.portalAccess?.enabled ? 'Disable Access' : 'Enable Access'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Supplier Ledger & Procurement Control Center */}
      {selectedSupplier && supplierDetail && (
        <AdvancedSupplierLedgerModal
          supplier={selectedSupplier}
          detail={supplierDetail}
          onClose={() => { setSelectedSupplier(null); setSupplierDetail(null); }}
          onMarkPoReceived={handleMarkPoReceived}
          onDisbursePayment={(supp, suggestedAmount) => {
            setPaymentSupplierId(supp.id);
            setPaymentAmount(suggestedAmount !== undefined ? suggestedAmount : supp.totalDue);
            setRecordPaymentOpen(true);
          }}
          onIssuePo={(supp) => {
            setPoSupplierId(supp.id);
            setCreatePoOpen(true);
          }}
          onRefresh={() => openSupplierDetail(selectedSupplier)}
        />
      )}

      {/* Modal: Create Supplier */}
      {createSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">Register New Supplier</h3>
              <button onClick={() => setCreateSupplierOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Jamdani Craft Weavers"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={newContactPerson}
                    onChange={(e) => setNewContactPerson(e.target.value)}
                    placeholder="e.g. Kazi Nazmul"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+880 1711-000000"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="vendor@domain.com"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Payment Terms</label>
                  <select
                    value={newPaymentTerms}
                    onChange={(e) => setNewPaymentTerms(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="ADVANCE">Full Advance</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="NET_15">Net 15 Days</option>
                    <option value="NET_30">Net 30 Days</option>
                    <option value="NET_60">Net 60 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">BIN / Tax ID (Optional)</label>
                  <input
                    type="text"
                    value={newTaxId}
                    onChange={(e) => setNewTaxId(e.target.value)}
                    placeholder="e.g. 002345678-0101"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Demra, Narayanganj"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setCreateSupplierOpen(false)}
                  className="px-3 py-2 font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Purchase Order */}
      {createPoOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">Issue Purchase Order</h3>
              <button onClick={() => setCreatePoOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePo} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Target Supplier *</label>
                <select
                  required
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none bg-white font-medium"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Receiving Warehouse Hub</label>
                  <select
                    value={poWarehouse}
                    onChange={(e) => setPoWarehouse(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="hub-central-tejg">Central Hub - Tejgaon</option>
                    <option value="hub-dhk-north-utt">Dhaka North Hub - Uttara</option>
                    <option value="hub-ctg-agr">Chattogram Hub - Agrabad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poExpectedDate}
                    onChange={(e) => setPoExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Order Items</label>
                {poItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center bg-stone-50 p-2 rounded-lg">
                    <div className="col-span-5">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const prod = products.find(p => p.id === e.target.value);
                          const updated = [...poItems];
                          updated[idx].productId = e.target.value;
                          updated[idx].productName = prod?.title || prod?.titleBn || 'Product';
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1.5 border border-stone-200 rounded text-xs bg-white"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.title} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].quantity = Number(e.target.value);
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1.5 border border-stone-200 rounded text-xs"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        min="0"
                        placeholder="Cost BDT"
                        value={item.unitCost}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].unitCost = Number(e.target.value);
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1.5 border border-stone-200 rounded text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setCreatePoOpen(false)}
                  className="px-3 py-2 font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg"
                >
                  Confirm & Issue PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment Disbursement */}
      {recordPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900">Record Vendor Disbursement</h3>
              <button onClick={() => setRecordPaymentOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Target Supplier *</label>
                <select
                  required
                  value={paymentSupplierId}
                  onChange={(e) => setPaymentSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none bg-white font-medium"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.companyName} (Due: {formatPrice(s.totalDue)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Disbursement Amount (BDT) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none font-mono font-bold"
                />
                {paymentAmount >= 50000 && (
                  <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> High-value payout requires Step-Up MFA validation.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Disbursement Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (EFT/NPSB)</option>
                    <option value="BKASH_MERCHANT">bKash Merchant Payout</option>
                    <option value="CHEQUE">Corporate Cheque</option>
                    <option value="CASH">Cash Voucher</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Txn / Voucher Ref</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Bank Txn / Ref #"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Audit Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional rationale"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setRecordPaymentOpen(false)}
                  className="px-3 py-2 font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg"
                >
                  Authorize Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step-Up MFA Confirmation Modal */}
      {mfaModalOpen && pendingPaymentPayload && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 border-2 border-amber-300">
            <div className="flex items-center gap-2 text-amber-700">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-sm font-bold">Step-Up MFA Authorization Required</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Disbursing <strong>{formatPrice(pendingPaymentPayload.amount)}</strong> exceeds the high-value security threshold. Enter your 6-digit staff authenticator code (or test code 123456) to cryptographically authorize this release.
            </p>
            <form onSubmit={handleConfirmMfaPayment} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                autoFocus
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code (e.g. 123456)"
                className="w-full px-4 py-2.5 border-2 border-stone-300 rounded-lg text-center font-mono text-lg tracking-widest font-bold focus:outline-none focus:border-stone-900"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setMfaModalOpen(false); setPendingPaymentPayload(null); }}
                  className="w-1/2 py-2 text-xs font-semibold text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11-Point Contextual Help Modal */}
      {activeHelp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 border border-stone-200">
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {language === 'BN' ? 'প্রশাসনিক ব্যাখ্যা ও কার্যকারিতা' : 'Admin Function Explanation'}
                </span>
                <h3 className="text-base font-bold font-serif text-stone-900 mt-1">
                  {language === 'BN' ? activeHelp.titleBn : activeHelp.titleEn}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {language === 'BN' ? activeHelp.shortDescBn : activeHelp.shortDescEn}
                </p>
              </div>
              <button
                onClick={() => setActiveHelp(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 11 Points Rendered in Order */}
            <div className="space-y-3.5 text-xs">
              {(() => {
                const p = language === 'BN' ? activeHelp.pointsBn : activeHelp.pointsEn;
                return (
                  <>
                    <div className="p-3 bg-stone-50 rounded-lg">
                      <span className="font-bold text-stone-900 block mb-0.5">1. What is this? / এটি কী?</span>
                      <p className="text-stone-600">{p.whatIsThis}</p>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg">
                      <span className="font-bold text-stone-900 block mb-0.5">2. Why is it used? / কেন ব্যবহৃত হয়?</span>
                      <p className="text-stone-600">{p.whyUsed}</p>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg">
                      <span className="font-bold text-stone-900 block mb-0.5">3. How does it work? / কীভাবে কাজ করে?</span>
                      <p className="text-stone-600">{p.howWorks}</p>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg">
                      <span className="font-bold text-stone-900 block mb-0.5">4. Connected to / কিসের সাথে যুক্ত?</span>
                      <p className="text-stone-600 font-mono text-[11px]">{p.connectedTo}</p>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg">
                      <span className="font-bold text-stone-900 block mb-0.5">5. What happens if changed? / পরিবর্তন করলে কী ঘটবে?</span>
                      <p className="text-stone-600">{p.whatIfChanged}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                        <span className="font-bold text-emerald-900 block mb-1">6. Affects / যা প্রভাবিত হয়:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                          {p.affects.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>

                      <div className="p-3 bg-stone-100 border border-stone-200 rounded-lg">
                        <span className="font-bold text-stone-700 block mb-1">7. Does NOT affect / যা প্রভাবিত হয় না:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                          {p.doesNotAffect.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg">
                      <span className="font-bold text-stone-900 block mb-1">8. Required Prerequisites / আবশ্যক শর্ত:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                        {p.required.map((req, i) => <li key={i}>{req}</li>)}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-stone-50 rounded-lg">
                        <span className="font-bold text-stone-900 block mb-0.5">9. Current Status / বর্তমান অবস্থা:</span>
                        <span className="font-semibold text-teal-700">{p.currentStatus}</span>
                      </div>

                      <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                        <span className="font-bold text-amber-900 block mb-0.5">10. Warning / ঝুঁকি:</span>
                        <span className="font-semibold text-amber-800">{p.warningRisk}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-900 text-stone-200 rounded-lg flex items-center justify-between">
                      <span className="font-bold">11. Who can change this? / কে পরিবর্তন করতে পারেন?</span>
                      <span className="font-mono text-teal-400 font-bold">{p.whoCanChange}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-200">
              <button
                onClick={() => setActiveHelp(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800"
              >
                {language === 'BN' ? 'বুঝেছি / বন্ধ করুন' : 'Got it / Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Supplier Import Modal (CSV & JSON) */}
      <BulkSupplierImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onSuccess={() => {
          loadSupplierData();
        }}
        language={language}
        notify={notify}
      />

      {/* Isolated Supplier Portal Preview Modal */}
      {previewPortalSupplier && (
        <SupplierPortalModal
          isOpen={Boolean(previewPortalSupplier)}
          onClose={() => setPreviewPortalSupplier(null)}
          supplier={{
            id: previewPortalSupplier.id,
            companyName: previewPortalSupplier.companyName,
            contactPerson: previewPortalSupplier.contactPerson,
            email: previewPortalSupplier.email,
            phone: previewPortalSupplier.phone,
            status: previewPortalSupplier.status,
            totalPurchased: previewPortalSupplier.totalPurchased,
            totalPaid: previewPortalSupplier.totalPaid,
            totalDue: previewPortalSupplier.totalDue
          }}
        />
      )}

      {/* Official Supplier Statement Modal */}
      <SupplierStatementModal
        isOpen={Boolean(statementSupplierId)}
        onClose={() => setStatementSupplierId(null)}
        supplierId={statementSupplierId}
      />
    </div>
  );
}
