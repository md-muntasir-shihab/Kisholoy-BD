/**
 * Phase 12: Fraud Detection, Risk Engine & Anti-Abuse Dashboard
 * Kisholoy Artisanal Commerce Security Layer
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Ban, PhoneCall, CheckCircle, 
  XCircle, Filter, Search, Plus, Trash2, ToggleLeft, ToggleRight,
  Sliders, Activity, RefreshCw, Eye, ExternalLink, Zap, Lock, DollarSign,
  ArrowRight, Sparkles, AlertOctagon, UserX, Info
} from 'lucide-react';
import { 
  Order, FraudRiskAssessment, BlacklistEntry, FraudRiskSettings, 
  FraudRuleConfig, FraudStats 
} from '../types';

interface FraudDashboardProps {
  orders?: Order[];
  onOrderUpdated?: () => void;
}

export const FraudRiskDashboard: React.FC<FraudDashboardProps> = ({ 
  orders: propOrders,
  onOrderUpdated 
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'blacklists' | 'rules' | 'sandbox'>('queue');
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [blacklists, setBlacklists] = useState<BlacklistEntry[]>([]);
  const [settings, setSettings] = useState<FraudRiskSettings | null>(null);
  const [orders, setOrders] = useState<Order[]>(propOrders || []);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Queue Filters
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [verifyFilter, setVerifyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Blacklist Form Modal State
  const [showAddBlacklistModal, setShowAddBlacklistModal] = useState(false);
  const [newBlType, setNewBlType] = useState<'PHONE' | 'IP' | 'EMAIL' | 'ADDRESS'>('PHONE');
  const [newBlValue, setNewBlValue] = useState('');
  const [newBlReason, setNewBlReason] = useState('');
  const [newBlSeverity, setNewBlSeverity] = useState<'STRICT_BLOCK' | 'FLAG_FOR_REVIEW'>('STRICT_BLOCK');

  // Verification Action Modal State
  const [actionModalOrder, setActionModalOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<'PHONE_VERIFIED' | 'ADVANCE_FEE_PAID' | 'MANUALLY_OVERRIDDEN' | 'REJECTED'>('PHONE_VERIFIED');
  const [actionNotes, setActionNotes] = useState('');
  const [advanceTrxId, setAdvanceTrxId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('150');
  const [addToBlCheck, setAddToBlCheck] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Sandbox State
  const [sandboxPhone, setSandboxPhone] = useState('01712345678');
  const [sandboxEmail, setSandboxEmail] = useState('');
  const [sandboxAddress, setSandboxAddress] = useState('House 12, Road 4, Sector 7, Uttara');
  const [sandboxDistrict, setSandboxDistrict] = useState('Dhaka');
  const [sandboxTotal, setSandboxTotal] = useState('4800');
  const [sandboxPayment, setSandboxPayment] = useState<'COD' | 'SSLCOMMERZ' | 'BKASH'>('COD');
  const [sandboxResult, setSandboxResult] = useState<FraudRiskAssessment | null>(null);
  const [sandboxEvaluating, setSandboxEvaluating] = useState(false);

  // Fetch Stats, Blacklists & Settings
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, blRes, setRes, ordRes] = await Promise.all([
        fetch('/api/fraud/stats').then(r => r.json()),
        fetch('/api/fraud/blacklists').then(r => r.json()),
        fetch('/api/fraud/settings').then(r => r.json()),
        fetch('/api/orders').then(r => r.json())
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (blRes.success) setBlacklists(blRes.blacklists);
      if (setRes.success) setSettings(setRes.settings);
      if (ordRes.success) setOrders(ordRes.orders);
    } catch (err) {
      console.error('Failed to load fraud engine data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Add Blacklist Entry
  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlValue.trim() || !newBlReason.trim()) {
      showNotification('error', 'Value and reason are required');
      return;
    }

    try {
      const res = await fetch('/api/fraud/blacklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newBlType,
          value: newBlValue.trim(),
          reason: newBlReason.trim(),
          severity: newBlSeverity,
          addedBy: 'FRAUD_OPS_ADMIN'
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Added ${newBlType} (${newBlValue}) to blacklist`);
        setShowAddBlacklistModal(false);
        setNewBlValue('');
        setNewBlReason('');
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to add blacklist entry');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Toggle Blacklist Active Status
  const handleToggleBlacklist = async (id: string) => {
    try {
      const res = await fetch(`/api/fraud/blacklists/${id}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Blacklist status updated');
        fetchData();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Delete Blacklist Entry
  const handleDeleteBlacklist = async (id: string) => {
    if (!confirm('Are you sure you want to remove this entry from the blacklist?')) return;
    try {
      const res = await fetch(`/api/fraud/blacklists/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Blacklist entry removed');
        fetchData();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      const res = await fetch('/api/fraud/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          operator: 'SUPER_ADMIN'
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Fraud thresholds and rule configurations saved successfully');
        setSettings(data.settings);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Execute Order Verification Action
  const handleExecuteAction = async () => {
    if (!actionModalOrder) return;
    setActionSubmitting(true);
    try {
      const res = await fetch('/api/fraud/verify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: actionModalOrder.id,
          action: actionType,
          notes: actionNotes || `Action ${actionType} verified by admin`,
          operator: 'ORDER_SECURITY_OFFICER',
          advanceTrxId: actionType === 'ADVANCE_FEE_PAID' ? advanceTrxId : undefined,
          advanceAmount: actionType === 'ADVANCE_FEE_PAID' ? Number(advanceAmount) : undefined,
          addToBlacklist: addToBlCheck,
          blacklistReason: `Fraud rejection for order ${actionModalOrder.orderNumber}: ${actionNotes}`
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Order ${actionModalOrder.orderNumber} successfully updated.`);
        setActionModalOrder(null);
        setActionNotes('');
        setAdvanceTrxId('');
        setAddToBlCheck(false);
        fetchData();
        if (onOrderUpdated) onOrderUpdated();
      } else {
        showNotification('error', data.error || 'Action failed');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Run Sandbox Evaluation
  const handleRunSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setSandboxEvaluating(true);
    try {
      const res = await fetch('/api/fraud/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: sandboxPhone,
          email: sandboxEmail,
          address: sandboxAddress,
          district: sandboxDistrict,
          paymentMethod: sandboxPayment,
          total: Number(sandboxTotal) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setSandboxResult(data.assessment);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSandboxEvaluating(false);
    }
  };

  // Filtered Orders Queue
  const filteredOrders = orders.filter(o => {
    const risk = o.fraudRisk;
    if (riskFilter !== 'ALL' && risk?.riskRating !== riskFilter) return false;
    if (verifyFilter !== 'ALL' && (o.verificationStatus || 'UNVERIFIED') !== verifyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchName = o.customer.name.toLowerCase().includes(q);
      const matchPhone = o.customer.phone.toLowerCase().includes(q);
      const matchAddr = o.shippingAddress.address.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone && !matchAddr) return false;
    }
    return true;
  });

  const getRiskBadge = (rating?: string, score?: number) => {
    switch (rating) {
      case 'SUSPICIOUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
            SUSPICIOUS ({score || 0})
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            HIGH RISK ({score || 0})
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
            MEDIUM RISK ({score || 0})
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            LOW RISK ({score || 0})
          </span>
        );
    }
  };

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'PHONE_VERIFIED':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Phone Confirmed</span>;
      case 'ADVANCE_PAID':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Advance Paid</span>;
      case 'MANUALLY_OVERRIDDEN':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Manager Override</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Rejected (Fraud)</span>;
      case 'UNVERIFIED':
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">Unverified</span>;
    }
  };

  return (
    <div id="fraud-risk-engine-container" className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Fraud Detection, Risk Engine & Anti-Abuse</h1>
              <p className="text-sm text-gray-500">
                Authoritative multi-factor scoring, fake order blocker, COD loss prevention & Blacklist registry
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="refresh-fraud-data-btn"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            id="open-add-blacklist-modal-btn"
            onClick={() => setShowAddBlacklistModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Blacklist Phone / IP
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-lg border text-sm flex items-center gap-2 transition-all ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Real-Time Metrics & Security Posture */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Evaluated</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEvaluated}</div>
            <div className="text-xs text-gray-400 mt-0.5">Live orders processed</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Low Risk (Clean)</div>
            <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.lowRiskCount}</div>
            <div className="text-xs text-emerald-600 mt-0.5">Auto-approved</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-yellow-200 bg-yellow-50/20 shadow-sm">
            <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wider">Medium Risk</div>
            <div className="text-2xl font-bold text-yellow-800 mt-1">{stats.mediumRiskCount}</div>
            <div className="text-xs text-yellow-600 mt-0.5">Phone confirmation</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">High Risk / COD</div>
            <div className="text-2xl font-bold text-amber-800 mt-1">{stats.highRiskCount}</div>
            <div className="text-xs text-amber-600 mt-0.5">৳{stats.flaggedCodExposureBdt.toLocaleString()} COD at risk</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm">
            <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Blocked / Fraud</div>
            <div className="text-2xl font-bold text-rose-800 mt-1">{stats.criticalSuspiciousCount}</div>
            <div className="text-xs text-rose-600 mt-0.5">৳{stats.preventedLossBdt.toLocaleString()} loss prevented</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Blacklist</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.activeBlacklistCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">Phones, IPs, emails</div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-xl">
        <button
          id="tab-fraud-queue"
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 py-4 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'queue'
              ? 'border-rose-700 text-rose-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Risk Review Queue ({orders.filter(o => o.fraudRisk && o.fraudRisk.riskScore >= 30).length})
        </button>

        <button
          id="tab-fraud-blacklists"
          onClick={() => setActiveTab('blacklists')}
          className={`flex items-center gap-2 py-4 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'blacklists'
              ? 'border-rose-700 text-rose-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Ban className="w-4 h-4" />
          Blacklist & Watchlist ({blacklists.length})
        </button>

        <button
          id="tab-fraud-rules"
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 py-4 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'rules'
              ? 'border-rose-700 text-rose-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Rule Weights & Thresholds
        </button>

        <button
          id="tab-fraud-sandbox"
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-2 py-4 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'sandbox'
              ? 'border-rose-700 text-rose-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Zap className="w-4 h-4" />
          Live Risk Simulator & Sandbox
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: RISK REVIEW QUEUE */}
      {/* ============================================================= */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-6">
          {/* Queue Filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search order #, customer, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Risk:</span>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="text-xs py-2 px-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                >
                  <option value="ALL">All Ratings</option>
                  <option value="SUSPICIOUS">Suspicious / Blocked (85+)</option>
                  <option value="HIGH">High Risk (60-84)</option>
                  <option value="MEDIUM">Medium Risk (30-59)</option>
                  <option value="LOW">Low Risk (&lt;30)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Verification:</span>
                <select
                  value={verifyFilter}
                  onChange={(e) => setVerifyFilter(e.target.value)}
                  className="text-xs py-2 px-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="UNVERIFIED">Unverified (Pending Review)</option>
                  <option value="PHONE_VERIFIED">Phone Verified</option>
                  <option value="ADVANCE_PAID">Advance Paid</option>
                  <option value="MANUALLY_OVERRIDDEN">Manager Override</option>
                  <option value="REJECTED">Rejected (Fraud)</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Order & Time</th>
                  <th className="py-3.5 px-4">Customer & Location</th>
                  <th className="py-3.5 px-4">Payment / Value</th>
                  <th className="py-3.5 px-4">Risk Rating</th>
                  <th className="py-3.5 px-4">Primary Flags</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      No orders matched the current risk filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const risk = ord.fraudRisk;
                    const isHighRisk = risk && risk.riskScore >= 60;
                    return (
                      <tr 
                        key={ord.id} 
                        className={`hover:bg-gray-50/80 transition-colors ${
                          isHighRisk ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{ord.orderNumber}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(ord.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {new Date(ord.createdAt).toLocaleDateString('en-GB')}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-gray-900">{ord.customer.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{ord.customer.phone}</div>
                          <div className="text-xs text-gray-400 truncate max-w-xs">{ord.shippingAddress.district}, {ord.shippingAddress.address}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">৳{ord.total.toLocaleString()}</div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            ord.paymentMethod === 'COD' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {ord.paymentMethod}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {getRiskBadge(risk?.riskRating, risk?.riskScore)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {risk?.flags && risk.flags.length > 0 ? (
                              risk.flags.slice(0, 2).map((flag) => (
                                <span key={flag} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 border border-gray-200">
                                  {flag.replace(/_/g, ' ')}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">Clean</span>
                            )}
                            {risk?.flags && risk.flags.length > 2 && (
                              <span className="text-[10px] text-gray-500 font-medium">+{risk.flags.length - 2} more</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {getVerificationBadge(ord.verificationStatus)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              title="Inspect Full Risk Breakdown"
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setActionModalOrder(ord);
                                setActionType(risk?.recommendation === 'REQUIRE_ADVANCE_SHIPPING_FEE' ? 'ADVANCE_FEE_PAID' : 'PHONE_VERIFIED');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors"
                            >
                              Review & Action
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: BLACKLIST & WATCHLIST REGISTRY */}
      {/* ============================================================= */}
      {activeTab === 'blacklists' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900">Blacklisted Entities & Active Fraud Signatures</h2>
              <p className="text-xs text-gray-500">
                Any orders matching active entries will trigger an immediate high risk score or automatic cancellation.
              </p>
            </div>
            <button
              onClick={() => setShowAddBlacklistModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Blacklist Entry
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Value / Target</th>
                  <th className="py-3 px-4">Reason / Threat Profile</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Hit Count</th>
                  <th className="py-3 px-4">Added By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {blacklists.map((bl) => (
                  <tr key={bl.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        bl.type === 'PHONE' ? 'bg-indigo-100 text-indigo-800' :
                        bl.type === 'IP' ? 'bg-purple-100 text-purple-800' :
                        bl.type === 'EMAIL' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {bl.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-gray-900">
                      {bl.value}
                    </td>

                    <td className="py-3.5 px-4 text-gray-700 text-xs">
                      {bl.reason}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        bl.severity === 'STRICT_BLOCK' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bl.severity.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-900">{bl.hitCount}</span>
                      {bl.lastHitAt && (
                        <div className="text-[10px] text-gray-400">
                          Last: {new Date(bl.lastHitAt).toLocaleDateString('en-GB')}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {bl.addedBy}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleBlacklist(bl.id)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                          bl.isActive 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {bl.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteBlacklist(bl.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                        title="Delete from blacklist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: RULE WEIGHTS & THRESHOLDS */}
      {/* ============================================================= */}
      {activeTab === 'rules' && settings && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900">Fraud Engine Sensitivity & Heuristics Tuning</h2>
              <p className="text-xs text-gray-500">
                Configure authoritative action thresholds and individual scoring weights for Bangladesh commerce conditions.
              </p>
            </div>

            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors"
            >
              Save Configuration
            </button>
          </div>

          {/* Action Thresholds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Phone Verification Threshold (Score)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.phoneVerificationThreshold}
                  onChange={(e) => setSettings({ ...settings, phoneVerificationThreshold: Number(e.target.value) })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 text-sm focus:ring-2 focus:ring-rose-600"
                />
                <span className="text-xs text-gray-500">Trigger mandatory call before dispatch (Default: 30)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Advance Shipping Fee Threshold (Score)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.advancePaymentThreshold}
                  onChange={(e) => setSettings({ ...settings, advancePaymentThreshold: Number(e.target.value) })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 text-sm focus:ring-2 focus:ring-rose-600"
                />
                <span className="text-xs text-gray-500">Require ৳150 advance bKash/Nagad fee (Default: 60)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Strict Auto-Block Threshold (Score)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.autoBlockThreshold}
                  onChange={(e) => setSettings({ ...settings, autoBlockThreshold: Number(e.target.value) })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 text-sm focus:ring-2 focus:ring-rose-600"
                />
                <span className="text-xs text-gray-500">Auto-cancel order & rollback stock (Default: 85)</span>
              </div>
            </div>
          </div>

          {/* Velocity Window Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Velocity Detection Window (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.velocityWindowMinutes}
                onChange={(e) => setSettings({ ...settings, velocityWindowMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Max Allowed Orders per Velocity Window
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxOrdersPerVelocityWindow}
                onChange={(e) => setSettings({ ...settings, maxOrdersPerVelocityWindow: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              />
            </div>
          </div>

          {/* Heuristic Rules Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Individual Risk Rules & Scoring Weights</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Rule Name & Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Weight (+Risk Points)</th>
                    <th className="py-3 px-4">Threshold / Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {settings.rules.map((rule, idx) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            const newRules = [...settings.rules];
                            newRules[idx].enabled = !newRules[idx].enabled;
                            setSettings({ ...settings, rules: newRules });
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                            rule.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {rule.enabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{rule.name}</div>
                        <div className="text-xs text-gray-500">{rule.description}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                          {rule.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={rule.weight}
                          onChange={(e) => {
                            const newRules = [...settings.rules];
                            newRules[idx].weight = Number(e.target.value);
                            setSettings({ ...settings, rules: newRules });
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded font-semibold text-gray-900 text-xs"
                        />
                      </td>

                      <td className="py-3 px-4 text-xs font-mono text-gray-600">
                        {rule.thresholdValue !== undefined ? `Limit: ${rule.thresholdValue}` : 'Standard Heuristic'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: LIVE RISK SIMULATOR & SANDBOX */}
      {/* ============================================================= */}
      {activeTab === 'sandbox' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Live Risk Scoring Simulator & Rule Validator</h2>
            <p className="text-xs text-gray-500">
              Test customer order payloads in real-time to inspect exact risk breakdown, triggered flags, and automated system decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <form onSubmit={handleRunSandbox} className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Test Order Payload</h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Customer Phone Number</label>
                <input
                  type="text"
                  value={sandboxPhone}
                  onChange={(e) => setSandboxPhone(e.target.value)}
                  placeholder="e.g. +8801712345678"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Customer Email (Optional)</label>
                <input
                  type="text"
                  value={sandboxEmail}
                  onChange={(e) => setSandboxEmail(e.target.value)}
                  placeholder="e.g. buyer@example.com"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Delivery Address</label>
                <input
                  type="text"
                  value={sandboxAddress}
                  onChange={(e) => setSandboxAddress(e.target.value)}
                  placeholder="e.g. Flat 3A, House 22, Road 14"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">District / City</label>
                  <select
                    value={sandboxDistrict}
                    onChange={(e) => setSandboxDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barisal">Barisal</option>
                    <option value="Bhola">Bhola (Remote)</option>
                    <option value="Bandarban">Bandarban (Remote)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Payment Method</label>
                  <select
                    value={sandboxPayment}
                    onChange={(e: any) => setSandboxPayment(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="SSLCOMMERZ">SSLCOMMERZ Prepaid</option>
                    <option value="BKASH">bKash Direct</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Order Grand Total (BDT)</label>
                <input
                  type="number"
                  value={sandboxTotal}
                  onChange={(e) => setSandboxTotal(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-bold text-gray-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sandboxEvaluating}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors"
              >
                <Zap className="w-4 h-4" />
                {sandboxEvaluating ? 'Evaluating Multi-Factor Risk...' : 'Run Authoritative Evaluation'}
              </button>
            </form>

            {/* Assessment Visualizer */}
            <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Evaluation Result & Decision</h3>

              {sandboxResult ? (
                <div className="space-y-6">
                  {/* Score & Verdict Card */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase">Calculated Risk Score</div>
                      <div className="text-4xl font-extrabold text-gray-900 mt-1">
                        {sandboxResult.riskScore} <span className="text-sm font-normal text-gray-400">/ 100</span>
                      </div>
                      <div className="mt-2">{getRiskBadge(sandboxResult.riskRating, sandboxResult.riskScore)}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-gray-500 uppercase">Recommendation</div>
                      <div className="text-sm font-bold text-rose-700 mt-1">
                        {sandboxResult.recommendation.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Factor Breakdown */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-700 uppercase">Factor Score Breakdown</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Phone</div>
                        <div className="text-base font-bold text-gray-900">+{sandboxResult.breakdown.phoneScore}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Address</div>
                        <div className="text-base font-bold text-gray-900">+{sandboxResult.breakdown.addressScore}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">COD Value</div>
                        <div className="text-base font-bold text-gray-900">+{sandboxResult.breakdown.valueScore}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Velocity</div>
                        <div className="text-base font-bold text-gray-900">+{sandboxResult.breakdown.velocityScore}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">History</div>
                        <div className="text-base font-bold text-gray-900">{sandboxResult.breakdown.historyScore}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-center">
                        <div className="text-[10px] text-gray-500 uppercase">Email</div>
                        <div className="text-base font-bold text-gray-900">+{sandboxResult.breakdown.emailScore}</div>
                      </div>
                    </div>
                  </div>

                  {/* Triggered Reasons */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-700 uppercase">Triggered Heuristics & Signals</div>
                    <ul className="space-y-1.5 text-xs text-gray-700 bg-white p-4 rounded-xl border border-gray-200">
                      {sandboxResult.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-600 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                  <ShieldAlert className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  Fill in test order fields and click "Run Authoritative Evaluation".
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD BLACKLIST ENTRY */}
      {/* ============================================================= */}
      {showAddBlacklistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-rose-700">
                <Ban className="w-5 h-5" />
                <h3 className="font-bold text-lg text-gray-900">Add to Blacklist / Watchlist</h3>
              </div>
              <button
                onClick={() => setShowAddBlacklistModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBlacklist} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Blacklist Type</label>
                <select
                  value={newBlType}
                  onChange={(e: any) => setNewBlType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="PHONE">Phone Number (+8801...)</option>
                  <option value="IP">IP Address</option>
                  <option value="EMAIL">Email Address / Domain</option>
                  <option value="ADDRESS">Address Keyword / Placeholder</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Target Value</label>
                <input
                  type="text"
                  value={newBlValue}
                  onChange={(e) => setNewBlValue(e.target.value)}
                  placeholder={newBlType === 'PHONE' ? '+8801999999999' : 'Value to block'}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Reason / Incident Description</label>
                <textarea
                  value={newBlReason}
                  onChange={(e) => setNewBlReason(e.target.value)}
                  placeholder="e.g. Refused parcel multiple times, fake COD spam bot..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Enforcement Action</label>
                <select
                  value={newBlSeverity}
                  onChange={(e: any) => setNewBlSeverity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="STRICT_BLOCK">STRICT BLOCK (Auto-Cancel Order Immediately)</option>
                  <option value="FLAG_FOR_REVIEW">FLAG FOR REVIEW (+50 High Risk Points)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBlacklistModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm"
                >
                  Confirm Blacklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: VERIFICATION & ACTION MODAL */}
      {/* ============================================================= */}
      {actionModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Review & Resolve Risk</h3>
                <p className="text-xs text-gray-500">Order: {actionModalOrder.orderNumber} (৳{actionModalOrder.total})</p>
              </div>
              <button
                onClick={() => setActionModalOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details Summary */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-900">{actionModalOrder.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone:</span>
                <span className="font-mono font-semibold text-gray-900">{actionModalOrder.customer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Address:</span>
                <span className="text-gray-800 truncate max-w-xs">{actionModalOrder.shippingAddress.address}, {actionModalOrder.shippingAddress.district}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className="text-gray-500">Risk Score:</span>
                <span className="font-bold text-rose-700">{actionModalOrder.fraudRisk?.riskScore} ({actionModalOrder.fraudRisk?.riskRating})</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Verification Action</label>
                <select
                  value={actionType}
                  onChange={(e: any) => setActionType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-medium"
                >
                  <option value="PHONE_VERIFIED">📞 Confirm via Phone Call (Customer Verified)</option>
                  <option value="ADVANCE_FEE_PAID">৳ Record Advance Shipping Fee Paid (bKash/Nagad)</option>
                  <option value="MANUALLY_OVERRIDDEN">🛡️ Manager Override (Approve Without Fee)</option>
                  <option value="REJECTED">🚫 Reject as Fraud / Cancel Order</option>
                </select>
              </div>

              {actionType === 'ADVANCE_FEE_PAID' && (
                <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Advance Amount (৳)</label>
                    <input
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">bKash/Nagad TrxID</label>
                    <input
                      type="text"
                      value={advanceTrxId}
                      onChange={(e) => setAdvanceTrxId(e.target.value)}
                      placeholder="e.g. BK982310"
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md font-mono"
                      required
                    />
                  </div>
                </div>
              )}

              {actionType === 'REJECTED' && (
                <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="add-bl-check"
                      checked={addToBlCheck}
                      onChange={(e) => setAddToBlCheck(e.target.checked)}
                      className="rounded text-rose-700 focus:ring-rose-600"
                    />
                    <label htmlFor="add-bl-check" className="text-xs font-semibold text-rose-900 cursor-pointer">
                      Also add customer phone ({actionModalOrder.customer.phone}) to blacklist
                    </label>
                  </div>
                  <p className="text-[11px] text-rose-600">
                    Order items will be automatically restored to warehouse inventory ledger.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Operator Review Notes</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Record customer response, call notes, or rejection reasoning..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModalOrder(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={actionSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm"
                >
                  {actionSubmitting ? 'Saving...' : 'Apply Verification Action'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* DRAWER: DETAILED RISK INSPECTION */}
      {/* ============================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Risk Assessment Audit</h3>
                <p className="text-xs text-gray-500">Order: {selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {selectedOrder.fraudRisk ? (
              <div className="space-y-6">
                {/* Score Summary */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Composite Score</div>
                    <div className="text-3xl font-extrabold text-gray-900 mt-0.5">
                      {selectedOrder.fraudRisk.riskScore} <span className="text-xs font-normal text-gray-400">/ 100</span>
                    </div>
                  </div>
                  <div>
                    {getRiskBadge(selectedOrder.fraudRisk.riskRating, selectedOrder.fraudRisk.riskScore)}
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase">Heuristic Points Breakdown</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex justify-between">
                      <span className="text-gray-600">Phone Heuristics:</span>
                      <span className="font-bold text-gray-900">+{selectedOrder.fraudRisk.breakdown.phoneScore}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex justify-between">
                      <span className="text-gray-600">Address Clarity:</span>
                      <span className="font-bold text-gray-900">+{selectedOrder.fraudRisk.breakdown.addressScore}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex justify-between">
                      <span className="text-gray-600">COD Value Risk:</span>
                      <span className="font-bold text-gray-900">+{selectedOrder.fraudRisk.breakdown.valueScore}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex justify-between">
                      <span className="text-gray-600">Order Velocity:</span>
                      <span className="font-bold text-gray-900">+{selectedOrder.fraudRisk.breakdown.velocityScore}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex justify-between">
                      <span className="text-gray-600">Customer History:</span>
                      <span className="font-bold text-gray-900">{selectedOrder.fraudRisk.breakdown.historyScore}</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex justify-between">
                      <span className="text-gray-600">Email Analysis:</span>
                      <span className="font-bold text-gray-900">+{selectedOrder.fraudRisk.breakdown.emailScore}</span>
                    </div>
                  </div>
                </div>

                {/* Reasons List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase">Triggered Explanations</h4>
                  <ul className="space-y-2 text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {selectedOrder.fraudRisk.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendation */}
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
                  <div className="text-xs font-bold text-rose-800 uppercase">Engine Recommendation</div>
                  <div className="text-sm font-semibold text-rose-900">
                    {selectedOrder.fraudRisk.recommendation.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      const ord = selectedOrder;
                      setSelectedOrder(null);
                      setActionModalOrder(ord);
                      setActionType(ord.fraudRisk?.recommendation === 'REQUIRE_ADVANCE_SHIPPING_FEE' ? 'ADVANCE_FEE_PAID' : 'PHONE_VERIFIED');
                    }}
                    className="w-full py-2.5 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm"
                  >
                    Take Operational Action
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                No detailed fraud risk record available for this order.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
