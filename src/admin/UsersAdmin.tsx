/**
 * KISHOLOY Phase 20: Security, Staff Users & RBAC Control Center
 * Full administrative staff management, role permissions matrix, active sessions, and rate limiting shield
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, UserCheck, Key, Lock, CheckCircle2, UserPlus, 
  AlertTriangle, ShieldAlert, Activity, RefreshCw, X, HelpCircle, 
  Trash2, Globe, Clock, Smartphone, Laptop, LogOut, Ban, Eye,
  Sliders, UserX, Check, Shield
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  Role, 
  AdminUser, 
  AdminSession, 
  RolePermissionsConfig, 
  RateLimitStatus, 
  BannedIpRecord,
  AdminAccountStatus
} from '../types';
import { SECURITY_HELP_DEFINITIONS, SecurityFunctionHelp } from './securityHelpData';
import { RoleChangeSafetyModal } from '../components/admin/RoleChangeSafetyModal';
import { PermissionChangeSafetyModal } from '../components/admin/PermissionChangeSafetyModal';
import { AdminModalShell } from '../components/admin/AdminModalShell';
import { usePendingAction } from '../hooks/usePendingAction';

export function UsersAdmin() {
  const { currentRole, setCurrentRole, language, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'users' | 'rbac' | 'sessions' | 'ratelimit'>('users');
  // F-306: blocks duplicate submits while a mutation is in flight.
  const { run, isPending, isBusy } = usePendingAction();

  // Server state
  const [staffUsers, setStaffUsers] = useState<AdminUser[]>([]);
  const [activeSessions, setActiveSessions] = useState<AdminSession[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsConfig[]>([]);
  const [rateLimitStatuses, setRateLimitStatuses] = useState<RateLimitStatus[]>([]);
  const [bannedIps, setBannedIps] = useState<BannedIpRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<Role>('ORDER_MANAGER');

  const [editRoleUser, setEditRoleUser] = useState<AdminUser | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<Role>('ORDER_MANAGER');
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);

  // Permission editor state
  const [editingRoleConfig, setEditingRoleConfig] = useState<RolePermissionsConfig | null>(null);
  const [pendingPermissions, setPendingPermissions] = useState<string[]>([]);
  const [permSafetyModalOpen, setPermSafetyModalOpen] = useState(false);

  const [manualBanOpen, setManualBanOpen] = useState(false);
  const [banIpAddress, setBanIpAddress] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState(60); // minutes

  // ⓘ Contextual Help Modal State
  const [activeHelp, setActiveHelp] = useState<SecurityFunctionHelp | null>(null);

  // Load data from Phase 20 endpoints
  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [usersRes, sessionsRes, rolesRes, rateRes, bannedRes] = await Promise.all([
        fetch('/api/security/users').then(r => r.json()),
        fetch('/api/security/sessions').then(r => r.json()),
        fetch('/api/security/rbac/roles').then(r => r.json()),
        fetch('/api/security/rate-limit/status').then(r => r.json()),
        fetch('/api/security/rate-limit/banned-ips').then(r => r.json())
      ]);

      if (usersRes.success) setStaffUsers(usersRes.users);
      if (sessionsRes.success) setActiveSessions(sessionsRes.sessions);
      if (rolesRes.success) setRolePermissions(rolesRes.roles);
      if (rateRes.success) setRateLimitStatuses(rateRes.status);
      if (bannedRes.success) setBannedIps(bannedRes.bannedIps);
    } catch (err: any) {
      console.error('Failed to load security state:', err);
      showToast('error', 'Failed to synchronize security telemetry with server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  // Staff creation handler
    const handleCreateStaff = async (e: React.FormEvent) => {
    // Must fire synchronously. Inside run() it would land in a microtask and
    // the browser would submit the form and reload the page first.
    e.preventDefault();
    return run('handleCreateStaff', async () => {
    if (!newStaffName || !newStaffEmail || !newStaffPhone) {
      showToast('error', 'Please fill in all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/security/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          phone: newStaffPhone,
          role: newStaffRole,
          operator: `Super Admin (${currentRole})`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Staff member ${newStaffName} created successfully with role ${newStaffRole}.`);
        setAddStaffOpen(false);
        setNewStaffName('');
        setNewStaffEmail('');
        setNewStaffPhone('');
        loadSecurityData();
      } else {
        showToast('error', data.error || 'Failed to create staff user.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
    });
  };

  // Update staff role handler
  const handleUpdateRole = async () =>  run('handleUpdateRole', async () => {
    if (!editRoleUser) return;
    try {
      const res = await fetch('/api/security/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editRoleUser.id,
          role: selectedNewRole,
          operator: `Super Admin (${currentRole})`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Role for ${editRoleUser.name} updated to ${selectedNewRole}.`);
        setEditRoleUser(null);
        loadSecurityData();
      } else {
        showToast('error', data.error || 'Failed to update role.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
    });

  // Toggle staff account status
  const handleToggleStatus = async (user: AdminUser) =>  run('handleToggleStatus', async () => {
    const nextStatus: AdminAccountStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch('/api/security/users/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          status: nextStatus,
          operator: `Super Admin (${currentRole})`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('info', `Account status for ${user.name} changed to ${nextStatus}.`);
        loadSecurityData();
      } else {
        showToast('error', data.error || 'Failed to update account status.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
    });

  // Revoke session handler
  const handleRevokeSession = async (sessionId: string, userName: string) =>  run('handleRevokeSession', async () => {
    try {
      const res = await fetch('/api/security/sessions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          operator: `Super Admin (${currentRole})`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('info', `Session for ${userName} terminated immediately.`);
        loadSecurityData();
      } else {
        showToast('error', data.error || 'Failed to revoke session.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
    });

  // Unban IP handler
  const handleUnbanIp = async (ip: string) =>  run('handleUnbanIp', async () => {
    try {
      const res = await fetch('/api/security/rate-limit/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip,
          operator: `Super Admin (${currentRole})`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `IP address ${ip} removed from quarantine.`);
        loadSecurityData();
      } else {
        showToast('error', data.error || 'Failed to unban IP.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
    });

  // Manual Ban IP handler
    const handleManualBan = async (e: React.FormEvent) => {
    // Must fire synchronously. Inside run() it would land in a microtask and
    // the browser would submit the form and reload the page first.
    e.preventDefault();
    return run('handleManualBan', async () => {
    if (!banIpAddress || !banReason) {
      showToast('error', 'IP Address and reason are required.');
      return;
    }
    try {
      const res = await fetch('/api/security/rate-limit/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: banIpAddress,
          reason: banReason,
          durationMinutes: banDuration,
          operator: `Super Admin (${currentRole})`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('warning', `IP ${banIpAddress} placed in quarantine for ${banDuration} minutes.`);
        setManualBanOpen(false);
        setBanIpAddress('');
        setBanReason('');
        loadSecurityData();
      } else {
        showToast('error', data.error || 'Failed to ban IP.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
    });
  };

  const domainList = [
    { domain: 'Orders', label: 'Order Processing & Dispatch', desc: 'View, accept, allocate inventory, book couriers' },
    { domain: 'Catalog', label: 'Products & Collections', desc: 'SKU creation, pricing, photography, categories' },
    { domain: 'Inventory', label: 'Warehouse Hubs & Stock Movement', desc: 'Stock in/out, transfer orders, threshold alerts' },
    { domain: 'Suppliers', label: 'Suppliers & Procurement Ledger', desc: 'Vendor records, purchase orders, payment disbursements' },
    { domain: 'Finance', label: 'Gateway Settlement & P&L', desc: 'Reconciliation, refunds approval, financial journal' },
    { domain: 'Customers', label: 'Customer Directory & CRM', desc: 'Profiles, order history, communication notes' },
    { domain: 'Marketing', label: 'Campaigns & Referral Engine', desc: 'SMS broadcast, recovery coupons, rewards disburse' },
    { domain: 'CMS', label: 'Website Content & Policies', desc: 'Banners, taglines, legal policies, notices' },
    { domain: 'Security', label: 'RBAC, Audit Ledger & Firewalls', desc: 'User privileges, tamper-proof logs, rate limits' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              {language === 'BN' ? 'নিরাপত্তা, ইউজার ও আরব্যাক কন্ট্রোল সেন্টার' : 'Security, Staff Users & RBAC Control'}
            </h1>
            <button
              onClick={() => setActiveHelp(SECURITY_HELP_DEFINITIONS.rbac_matrix)}
              className="p-1 rounded-full text-stone-400 hover:text-teal-800 hover:bg-stone-100 transition-colors"
              title="Explain RBAC Matrix"
            >
              <HelpCircle className="w-4 h-4 text-teal-700" />
            </button>
          </div>
          <p className="text-xs text-stone-500">
            {language === 'BN'
              ? 'স্টাফ একাউন্ট, সূক্ষ্ম অনুমতি ম্যাট্রিক্স, সক্রিয় সেশন পরিচালনা ও রেট লিমিট সুরক্ষা কবচ।'
              : 'Multi-role staff directory, fine-grained access control, active session governance, and rate limit defense.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSecurityData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-800' : 'text-stone-500'}`} />
            <span>{language === 'BN' ? 'রিফ্রেশ' : 'Sync Telemetry'}</span>
          </button>
          <button
            onClick={() => setAddStaffOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-teal-900 hover:bg-teal-950 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'নতুন স্টাফ যোগ' : 'Add Staff Member'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-teal-900 text-teal-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Staff Accounts ({staffUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'rbac'
              ? 'border-teal-900 text-teal-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>RBAC Permissions Matrix ({rolePermissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'border-teal-900 text-teal-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Active Sessions ({activeSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ratelimit')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ratelimit'
              ? 'border-teal-900 text-teal-950'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Rate Limiting & IP Jail ({bannedIps.length} Banned)</span>
        </button>
      </div>

      {/* TAB 1: Staff Directory & Accounts */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Total Staff Members</span>
              <span className="text-2xl font-serif font-bold text-stone-900">{staffUsers.length}</span>
              <span className="text-xs text-stone-500 block mt-1">Across 5 administrative tiers</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Active Staff Status</span>
              <span className="text-2xl font-serif font-bold text-emerald-700">
                {staffUsers.filter(u => u.status === 'ACTIVE').length} Active
              </span>
              <span className="text-xs text-stone-500 block mt-1">
                {staffUsers.filter(u => u.status !== 'ACTIVE').length} Suspended / Locked
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">2FA Enforced Accounts</span>
              <span className="text-2xl font-serif font-bold text-teal-800">
                {staffUsers.filter(u => u.twoFactorEnabled).length} / {staffUsers.length}
              </span>
              <span className="text-xs text-stone-500 block mt-1">Super Admin & Finance required</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Role & Privileges</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">2FA Security</th>
                    <th className="p-4">Last Login</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {staffUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-stone-900 text-sm">{u.name}</div>
                        <div className="text-stone-500 text-[11px] font-mono">{u.email}</div>
                        <div className="text-stone-400 text-[11px]">{u.phone}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                          u.role === 'SUPER_ADMIN' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : u.role === 'FINANCE' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : u.role === 'ORDER_MANAGER' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : 'bg-stone-100 text-stone-800 border border-stone-200'
                        }`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : u.status === 'LOCKED'
                            ? 'bg-rose-100 text-rose-800 font-mono'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{u.twoFactorMethod === 'APP_TOTP' ? 'Authenticator App' : 'SMS OTP'}</span>
                          </span>
                        ) : (
                          <span className="text-stone-400">Optional</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-stone-500">
                        {u.lastLoginAt ? (
                          <>
                            <div>{new Date(u.lastLoginAt).toLocaleDateString('en-GB')} {new Date(u.lastLoginAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-[10px] text-stone-400">IP: {u.lastLoginIp || 'Unknown'}</div>
                          </>
                        ) : (
                          <span className="text-stone-400">Never logged in</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditRoleUser(u);
                            setSelectedNewRole(u.role);
                          }}
                          className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
                        >
                          Edit Role
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold ${
                            u.status === 'ACTIVE'
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC Matrix & Role Simulation */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="bg-teal-50/60 border border-teal-200 p-4 rounded-xl flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-900 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-stone-900">Fine-Grained Role Permissions Matrix</h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Server-side security rejects any unauthorized mutations. You can test and simulate operational views directly using the role simulator.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveHelp(SECURITY_HELP_DEFINITIONS.rbac_matrix)}
              className="px-3 py-1 bg-white border border-teal-300 text-teal-900 rounded-lg text-xs font-bold hover:bg-teal-50 flex items-center gap-1 shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>ⓘ Explain RBAC</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rolePermissions.map((rp) => (
              <div
                key={rp.role}
                className={`p-5 rounded-xl border transition-all ${
                  currentRole === rp.role
                    ? 'bg-teal-50/70 border-teal-900 shadow-xs ring-1 ring-teal-900'
                    : 'bg-white border-stone-200 shadow-xs'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-teal-800" />
                      {rp.roleName}
                    </h3>
                    <span className="text-[11px] font-mono text-stone-500">{rp.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rp.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => {
                          setEditingRoleConfig(rp);
                          setPendingPermissions([...rp.permissions]);
                        }}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200"
                        title="Customize granted permissions for this role template"
                      >
                        Edit Matrix
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setCurrentRole(rp.role);
                        showToast('info', `Simulating workspace role: ${rp.roleName}`);
                      }}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        currentRole === rp.role
                          ? 'bg-teal-900 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {currentRole === rp.role ? 'Active In Session' : 'Simulate Role'}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-stone-600 mb-3">{rp.roleDescription}</p>

                <div className="pt-3 border-t border-stone-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                    Granted Capability Keys ({rp.permissions.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {rp.permissions.map((p, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-mono">
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Operational Domain Summary */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-3">Operational Domains & Access Governance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {domainList.map((d, i) => (
                <div key={i} className="p-3 rounded-lg border border-stone-200 bg-stone-50/50">
                  <span className="text-xs font-bold text-stone-900 block">{d.label}</span>
                  <span className="text-[11px] text-stone-500 mt-1 block leading-relaxed">{d.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Active Sessions & Token Governance */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">Active Staff Sessions & Token Governance</h3>
                <button
                  onClick={() => setActiveHelp(SECURITY_HELP_DEFINITIONS.session_revocation)}
                  className="p-1 rounded text-stone-400 hover:text-teal-800 hover:bg-stone-100"
                  title="Explain Session Revocation"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-teal-700" />
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                All staff logins carry signed session tokens with maximum 4-hour rolling expiry and immediate remote revocation.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              {activeSessions.length} Connected Sessions
            </span>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4">Session ID & Operator</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Client IP Address</th>
                    <th className="p-4">Device & Browser</th>
                    <th className="p-4">Established & Expiry</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-mono text-[11px]">
                  {activeSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400 font-sans">
                        No active staff sessions found.
                      </td>
                    </tr>
                  ) : (
                    activeSessions.map((s) => (
                      <tr key={s.sessionId} className="hover:bg-stone-50/60">
                        <td className="p-4">
                          <div className="font-bold text-stone-900 font-sans">{s.userName}</div>
                          <div className="text-stone-400 text-[10px]">{s.sessionId}</div>
                          <div className="text-stone-500 text-[10px] truncate max-w-xs">{s.userEmail}</div>
                        </td>
                        <td className="p-4 font-sans">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-stone-100 text-stone-800">
                            {s.role}
                          </span>
                        </td>
                        <td className="p-4 text-stone-700">
                          {s.ipAddress}
                        </td>
                        <td className="p-4 text-stone-500 max-w-xs truncate font-sans text-[11px]">
                          {s.userAgent}
                        </td>
                        <td className="p-4 text-stone-500 font-sans text-[11px]">
                          <div>Issued: {new Date(s.createdAt).toLocaleTimeString('en-GB')}</div>
                          <div className="text-stone-400 text-[10px]">Expires: {new Date(s.expiresAt).toLocaleTimeString('en-GB')}</div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleRevokeSession(s.sessionId, s.userName)}
                            className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-sans text-xs font-semibold flex items-center gap-1 ml-auto"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Revoke</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Rate Limiting & Network Shield */}
      {activeTab === 'ratelimit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">Sliding-Window Rate Limiter & IP Jail</h3>
                <button
                  onClick={() => setActiveHelp(SECURITY_HELP_DEFINITIONS.rate_limiter)}
                  className="p-1 rounded text-stone-400 hover:text-teal-800 hover:bg-stone-100"
                  title="Explain Rate Limiter"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-teal-700" />
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Defends checkout APIs, OTP dispatches, and login endpoints against brute force and automated DDoS scraping.
              </p>
            </div>
            <button
              onClick={() => setManualBanOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-900 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Manually Quarantine IP</span>
            </button>
          </div>

          {/* 5-Tier Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {rateLimitStatuses.map((st) => (
              <div key={st.tier} className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{st.tier}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="text-xl font-serif font-bold text-stone-900">{st.totalRequestsToday} reqs</div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 pt-2 border-t border-stone-100">
                  <span>Allowed: {st.allowedRequests}</span>
                  <span className={st.throttledRequests > 0 ? 'text-amber-600 font-bold' : 'text-stone-400'}>
                    Throttled: {st.throttledRequests}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Banned IPs Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Currently Quarantined / Banned IP Addresses</h4>
                <p className="text-[11px] text-stone-500">IPs exceeding auto-ban thresholds or manually flagged by security operators.</p>
              </div>
              <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                {bannedIps.length} Active Jailed IPs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Violation Tier</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Banned At</th>
                    <th className="p-4">Expires At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-mono text-[11px]">
                  {bannedIps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400 font-sans">
                        No IP addresses are currently quarantined. All rate limits operating within safe bounds.
                      </td>
                    </tr>
                  ) : (
                    bannedIps.map((b) => (
                      <tr key={b.ip} className="hover:bg-stone-50/60">
                        <td className="p-4 font-bold text-rose-900">{b.ip}</td>
                        <td className="p-4 font-sans text-stone-700">{b.tier}</td>
                        <td className="p-4 font-sans text-stone-600 max-w-sm">{b.reason}</td>
                        <td className="p-4 text-stone-500">{new Date(b.bannedAt).toLocaleTimeString('en-GB')}</td>
                        <td className="p-4 text-stone-500">{new Date(b.expiresAt).toLocaleTimeString('en-GB')}</td>
                        <td className="p-4 text-right font-sans">
                          <button
                            onClick={() => handleUnbanIp(b.ip)}
                            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs"
                          >
                            Unban IP
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff Member */}
      <AdminModalShell
        open={!!addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        label="Add Staff Member"
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-900" />
                <h3 className="font-serif font-bold text-stone-900 text-lg">Provision New Staff Account</h3>
              </div>
              <button onClick={() => setAddStaffOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sajjad Hossain"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Staff Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sajjad@kisholoy.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Mobile Phone (Bangladesh E.164)</label>
                <input
                  type="text"
                  required
                  placeholder="+88017XXXXXXXX"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Assigned Operational Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as Role)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-900 bg-white"
                >
                  <option value="ORDER_MANAGER">Fulfillment & Order Manager</option>
                  <option value="INVENTORY_MANAGER">Inventory Controller</option>
                  <option value="FINANCE">Finance & Accounts</option>
                  <option value="SUPPORT">Customer Support Lead</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  A default secure initial password (<code className="bg-stone-100 px-1 py-0.5 rounded">KisholoyStaff@2026</code>) will be provisioned.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setAddStaffOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-900 hover:bg-teal-950 rounded-lg"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
      </AdminModalShell>

      {/* MODAL: Edit Staff Role */}
      <AdminModalShell
        open={!!editRoleUser}
        onClose={() => setEditRoleUser(null)}
        label="Edit Staff Role"
        overlayClassName="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-serif font-bold text-stone-900 text-lg">Modify Staff Role</h3>
              <button onClick={() => setEditRoleUser(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                <div className="font-bold text-stone-900">{editRoleUser.name}</div>
                <div className="text-stone-500 font-mono">{editRoleUser.email}</div>
                <div className="text-stone-400 mt-1">Current Role: <span className="font-bold text-stone-700">{editRoleUser.role}</span></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Select New Operational Role</label>
                <select
                  value={selectedNewRole}
                  onChange={(e) => setSelectedNewRole(e.target.value as Role)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-900 bg-white"
                >
                  <option value="SUPER_ADMIN">Super Administrator (Unrestricted)</option>
                  <option value="ADMIN">System Administrator</option>
                  <option value="ORDER_MANAGER">Fulfillment & Order Manager</option>
                  <option value="INVENTORY_MANAGER">Inventory Controller</option>
                  <option value="FINANCE">Finance & Accounts</option>
                  <option value="SUPPORT">Customer Support Lead</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Impact Warning:</strong> Changing this user's role will update their session permissions immediately on the server and record a high-severity audit log.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditRoleUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setSafetyModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-900 hover:bg-teal-950 rounded-lg"
                >
                  Review & Confirm Role Change
                </button>
              </div>
            </div>
          </div>
      </AdminModalShell>

      {/* Role Change Safety Confirmation Modal (Section 25) */}
      {editRoleUser && (
        <RoleChangeSafetyModal
          isOpen={safetyModalOpen}
          onClose={() => setSafetyModalOpen(false)}
          onConfirm={async () => {
            setSafetyModalOpen(false);
            await handleUpdateRole();
          }}
          targetUserName={editRoleUser.name}
          currentRole={editRoleUser.role}
          newRole={selectedNewRole}
        />
      )}

      {/* RBAC Permission Adjustment Safety Modal (Section 26) */}
      <AdminModalShell
        open={!!(editingRoleConfig && !permSafetyModalOpen)}
        onClose={() => setEditingRoleConfig(null)}
        label="RBAC Permission Adjustment Safety Modal"
        overlayClassName="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-stone-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg">
                  Customize Permissions: {editingRoleConfig.roleName}
                </h3>
                <span className="text-xs text-stone-500 font-mono">{editingRoleConfig.role}</span>
              </div>
              <button onClick={() => setEditingRoleConfig(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-4 flex-1 text-xs">
              <p className="text-stone-600">
                Toggle capabilities granted to this operational role template. When you click review, high-impact safety verification will inspect added/removed scopes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'ORDER_VIEW', label: 'View Orders & Tracking' },
                  { key: 'ORDER_UPDATE', label: 'Update Orders & Status' },
                  { key: 'ORDER_DISPATCH', label: 'Dispatch to Couriers' },
                  { key: 'ORDER_CANCEL', label: 'Cancel Customer Orders' },
                  { key: 'PRODUCT_VIEW', label: 'View Product Catalog' },
                  { key: 'PRODUCT_CREATE', label: 'Create New Products' },
                  { key: 'PRODUCT_UPDATE', label: 'Update Products' },
                  { key: 'PRODUCT_PRICING', label: 'Modify Catalog Pricing' },
                  { key: 'INVENTORY_VIEW', label: 'View Warehouse Stock' },
                  { key: 'INVENTORY_ADJUST', label: 'Adjust Warehouse Stock' },
                  { key: 'INVENTORY_TRANSFER', label: 'Transfer Stock Hubs' },
                  { key: 'SUPPLIER_VIEW', label: 'View Supplier Directory' },
                  { key: 'SUPPLIER_MANAGE', label: 'Manage Suppliers & Contracts' },
                  { key: 'CUSTOMER_VIEW', label: 'View Customer Data' },
                  { key: 'CUSTOMER_MANAGE', label: 'Manage Customer Profiles' },
                  { key: 'PAYMENT_VIEW', label: 'View Transaction Ledger' },
                  { key: 'REFUND_VIEW', label: 'View Refund Requests' },
                  { key: 'REFUND_APPROVE', label: 'Approve & Execute Refunds' },
                  { key: 'EXPENSE_VIEW', label: 'View Financial P&L' },
                  { key: 'REPORT_VIEW', label: 'Generate Analytical Reports' },
                  { key: 'CONTENT_VIEW', label: 'View CMS Content' },
                  { key: 'CONTENT_MANAGE', label: 'Manage CMS & Banners' },
                  { key: 'SETTINGS_VIEW', label: 'View Store Settings' },
                  { key: 'SETTINGS_MANAGE', label: 'Modify System Settings' },
                ].map(perm => {
                  const isChecked = pendingPermissions.includes(perm.key);
                  return (
                    <label
                      key={perm.key}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        isChecked ? 'bg-teal-50/70 border-teal-300 text-teal-950 font-semibold' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPendingPermissions([...pendingPermissions, perm.key]);
                          } else {
                            setPendingPermissions(pendingPermissions.filter(k => k !== perm.key));
                          }
                        }}
                        className="rounded border-stone-300 text-teal-900 focus:ring-teal-900"
                      />
                      <span className="font-mono text-[11px]">{perm.key}</span>
                      <span className="text-[10px] text-stone-400 block ml-auto font-sans">{perm.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-between items-center text-xs">
              <span className="text-stone-500 font-semibold">
                {pendingPermissions.length} capabilities selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRoleConfig(null)}
                  className="px-4 py-2 font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setPermSafetyModalOpen(true)}
                  className="px-4 py-2 font-bold text-white bg-teal-900 hover:bg-teal-950 rounded-lg"
                >
                  Review Changes (Section 26)
                </button>
              </div>
            </div>
          </div>
      </AdminModalShell>

      {/* RBAC Permission Adjustment Safety Modal (Section 26) */}
      {editingRoleConfig && (
        <PermissionChangeSafetyModal
          isOpen={permSafetyModalOpen}
          onClose={() => setPermSafetyModalOpen(false)}
          onConfirm={async () => {
            try {
              const res = await fetch('/api/security/rbac/update-permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  role: editingRoleConfig.role,
                  permissions: pendingPermissions,
                  operator: `Super Admin (${currentRole})`
                })
              });
              const data = await res.json();
              if (data.success) {
                showToast('success', `Permissions updated for ${editingRoleConfig.roleName}.`);
                setPermSafetyModalOpen(false);
                setEditingRoleConfig(null);
                loadSecurityData();
              } else {
                showToast('error', data.error || 'Failed to update permissions.');
              }
            } catch (err: any) {
              showToast('error', err.message);
            }
          }}
          role={editingRoleConfig.role}
          roleName={editingRoleConfig.roleName}
          originalPermissions={editingRoleConfig.permissions}
          newPermissions={pendingPermissions}
        />
      )}

      {/* MODAL: Manual Quarantine IP */}
      <AdminModalShell
        open={!!manualBanOpen}
        onClose={() => setManualBanOpen(false)}
        label="Manual Quarantine IP"
        closeOnEscape={false}
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-800" />
                <h3 className="font-serif font-bold text-stone-900 text-lg">Quarantine IP Address</h3>
              </div>
              <button onClick={() => setManualBanOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualBan} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Target IPv4 / IPv6 Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 103.205.71.19"
                  value={banIpAddress}
                  onChange={(e) => setBanIpAddress(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Mandatory Security Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Excessive automated scraping on checkout API"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Quarantine Duration</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:border-rose-800 bg-white"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={360}>6 Hours</option>
                  <option value={1440}>24 Hours</option>
                  <option value={10080}>7 Days</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setManualBanOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-800 hover:bg-rose-900 rounded-lg"
                >
                  Execute IP Quarantine
                </button>
              </div>
            </form>
          </div>
      </AdminModalShell>

      {/* ⓘ GLOBAL CONTEXTUAL ADMIN HELP MODAL (11-POINT COMPREHENSIVE EXPLANATION) */}
      <AdminModalShell
        open={!!activeHelp}
        onClose={() => setActiveHelp(null)}
        label="GLOBAL CONTEXTUAL ADMIN HELP MODAL"
        overlayClassName="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-900 flex items-center justify-center font-bold">
                  ⓘ
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    {language === 'BN' ? activeHelp.titleBn : activeHelp.titleEn}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {language === 'BN' ? activeHelp.shortDescBn : activeHelp.shortDescEn}
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveHelp(null)} className="text-stone-400 hover:text-stone-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 text-xs">
              {(() => {
                const p = language === 'BN' ? activeHelp.pointsBn : activeHelp.pointsEn;
                return (
                  <>
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <span className="font-bold text-stone-900 block mb-1">
                        1. {language === 'BN' ? 'এটি কি?' : 'What is this?'}
                      </span>
                      <p className="text-stone-600 leading-relaxed">{p.whatIsThis}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <span className="font-bold text-stone-900 block mb-1">
                        2. {language === 'BN' ? 'কেন ব্যবহার করা হয়?' : 'Why is it used?'}
                      </span>
                      <p className="text-stone-600 leading-relaxed">{p.whyUsed}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <span className="font-bold text-stone-900 block mb-1">
                        3. {language === 'BN' ? 'এটি কীভাবে কাজ করে?' : 'How does it work?'}
                      </span>
                      <p className="text-stone-600 leading-relaxed">{p.howWorks}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <span className="font-bold text-stone-900 block mb-1">
                        4. {language === 'BN' ? 'এটি কিসের সাথে যুক্ত?' : 'What is it connected to?'}
                      </span>
                      <p className="text-stone-600 leading-relaxed">{p.connectedTo}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <span className="font-bold text-stone-900 block mb-1">
                        5. {language === 'BN' ? 'এটি পরিবর্তন করলে কি ঘটে?' : 'What happens if I change it?'}
                      </span>
                      <p className="text-stone-600 leading-relaxed">{p.whatIfChanged}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                        <span className="font-bold text-emerald-950 block mb-1">
                          6. {language === 'BN' ? 'যা প্রভাবিত হয়:' : 'What it affects:'}
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-emerald-900">
                          {p.affects.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                        <span className="font-bold text-stone-900 block mb-1">
                          7. {language === 'BN' ? 'যা প্রভাবিত হয় না:' : 'What it does NOT affect:'}
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-stone-600">
                          {p.doesNotAffect.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <span className="font-bold text-stone-900 block mb-1">
                        8. {language === 'BN' ? 'কী কী প্রয়োজন?' : 'What is required?'}
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-stone-600">
                        {p.required.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200">
                        <span className="text-[10px] font-bold text-teal-800 uppercase block">
                          9. {language === 'BN' ? 'বর্তমান স্ট্যাটাস' : 'Current Status'}
                        </span>
                        <span className="font-semibold text-teal-950 text-xs mt-0.5 block">{p.currentStatus}</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                        <span className="text-[10px] font-bold text-rose-800 uppercase block">
                          10. {language === 'BN' ? 'ঝুঁকি / সতর্কতা' : 'Warning / Risk'}
                        </span>
                        <span className="font-semibold text-rose-950 text-xs mt-0.5 block">{p.warningRisk}</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-stone-100 border border-stone-300">
                        <span className="text-[10px] font-bold text-stone-700 uppercase block">
                          11. {language === 'BN' ? 'কে পরিবর্তন করতে পারে' : 'Who Can Change'}
                        </span>
                        <span className="font-semibold text-stone-900 text-xs mt-0.5 block">{p.whoCanChange}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setActiveHelp(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800"
              >
                {language === 'BN' ? 'বুঝেছি (বন্ধ করুন)' : 'Understood (Close)'}
              </button>
            </div>
          </div>
      </AdminModalShell>
    </div>
  );
}
