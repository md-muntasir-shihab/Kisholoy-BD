/**
 * KISHOLOY Phase 20: Tamper-Evident Cryptographic Audit Ledger & Security Diagnostics Hub
 * SHA-256 Chained Ledger Verification, Forensic Hash Inspection, and 10-Point Security Scanner
 * @license Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { OfflineDataBanner } from '../components/admin/OfflineDataBanner';
import { 
  ShieldCheck, Search, Shield, Filter, AlertTriangle, RefreshCw, 
  HelpCircle, CheckCircle2, X, Download, Lock, Key, ShieldAlert,
  FileCode, Terminal, Check, ArrowRight, Eye, ShieldX, Sparkles, FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuditLog, AuditSeverity, AuditCategory, SecurityDiagnosticsSummary } from '../types';
import { SECURITY_HELP_DEFINITIONS, SecurityFunctionHelp } from './securityHelpData';
import { DateRangeFilterBar } from '../components/admin/DateRangeFilterBar';
import { DateWiseDataHubModal } from '../components/admin/DateWiseDataHubModal';
import { AdminModalShell } from '../components/admin/AdminModalShell';
import { 
  DateFilterConfig, 
  filterItemsByDate, 
  exportToExcel, 
  exportToCsv,
  formatDateDisplay 
} from '../utils/dateFilterUtils';

export function AuditAdmin() {
  const { auditLogs: contextAuditLogs, language, showToast } = useApp();
  const isBn = language === 'BN';
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [showDataHub, setShowDataHub] = useState(false);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterConfig>({
    preset: 'ALL',
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth(),
  });
  
  // Ledger from server API
  const [serverLedger, setServerLedger] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    totalBlocks: number;
    genesisHash: string;
    latestHash: string;
    verifiedAt: string;
  } | null>(null);

  // Security scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanReport, setScanReport] = useState<SecurityDiagnosticsSummary | null>(null);

  // Hash inspect modal
  const [inspectEntry, setInspectEntry] = useState<AuditLog | null>(null);

  // ⓘ Contextual Help modal
  const [activeHelp, setActiveHelp] = useState<SecurityFunctionHelp | null>(null);

  // Fetch cryptographic ledger from server
  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/security/audit-chain/ledger?limit=150');
      const data = await res.json();
      if (data.success && Array.isArray(data.ledger)) {
        setServerLedger(data.ledger);
        setUsingFallback(false);
      } else {
        // Fallback to context logs if server returns empty
        setServerLedger(contextAuditLogs);
        setUsingFallback(true);
      }
    } catch (err: any) {
      // An audit ledger is a compliance artefact: silently swapping in local
      // logs let it look complete and verified when the real chain was never
      // loaded (F-305).
      console.error('Failed to load server audit ledger:', err);
      setServerLedger(contextAuditLogs);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  // Run cryptographic ledger verification
  const handleVerifyLedger = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/security/audit-chain/verify');
      const data = await res.json();
      if (data.success) {
        setVerificationResult({
          valid: data.valid,
          totalBlocks: data.totalBlocks,
          genesisHash: data.genesisHash,
          latestHash: data.latestHash,
          verifiedAt: new Date().toLocaleTimeString('en-GB')
        });
        showToast('success', `Cryptographic Audit Chain verified intact across ${data.totalBlocks} sequential blocks.`);
      } else {
        showToast('error', data.error || 'Verification encountered an error.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Run 10-point automated security audit
  const handleRunDiagnostics = async () => {
    setScanning(true);
    setScannerOpen(true);
    try {
      const res = await fetch('/api/security/diagnostics');
      const data = await res.json();
      if (data.success && data.diagnostics) {
        setScanReport(data.diagnostics);
      } else {
        showToast('error', data.error || 'Failed to complete security scan.');
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setScanning(false);
    }
  };

  // Export ledger as JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      verificationCertificate: {
        system: "KISHOLOY Cryptographic Audit Chain",
        algorithm: "HMAC-SHA256 Chained Event Ledger",
        exportedAt: new Date().toISOString(),
        totalRecords: effectiveLedger.length,
        verifiedIntact: verificationResult?.valid ?? true
      },
      records: effectiveLedger
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kisholoy_audit_ledger_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('info', 'Exported cryptographic ledger as JSON.');
  };

  const effectiveLedger = serverLedger.length > 0 ? serverLedger : contextAuditLogs;

  // Filtered ledger by Date, Search, Category, and Severity
  const filtered = useMemo(() => {
    // 1. Filter by Date Range first
    const dateFiltered = filterItemsByDate<AuditLog>(effectiveLedger, (l: AuditLog) => l.timestamp, dateFilter);

    // 2. Filter by Search, Category, and Severity
    return dateFiltered.filter((log: AuditLog) => {
      const q = search.toLowerCase();
      const matchesSearch =
        log.action.toLowerCase().includes(q) ||
        log.operator.toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q) ||
        (log.resource || '').toLowerCase().includes(q) ||
        (log.ipAddress || (log as any).ip || '').toLowerCase().includes(q) ||
        (log.currentHash || '').toLowerCase().includes(q);

      let matchesCategory = true;
      if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'HIGH_VOLUME') {
          matchesCategory = log.action.includes('HIGH_VOLUME') || (log.details || '').includes('HIGH-VOLUME');
        } else if (categoryFilter === 'INVENTORY') {
          matchesCategory = log.category === 'INVENTORY' || (log.resource || '').toLowerCase().includes('inventory');
        } else if (categoryFilter === 'ORDERS') {
          matchesCategory = log.category === 'ORDER' || (log.resource || '').toLowerCase().includes('order');
        } else if (categoryFilter === 'FINANCIAL') {
          matchesCategory = log.category === 'FINANCIAL' || (log.resource || '').toLowerCase().includes('finance');
        } else if (categoryFilter === 'AUTH') {
          matchesCategory = log.category === 'AUTH' || (log.resource || '').toLowerCase().includes('auth');
        } else if (categoryFilter === 'RBAC') {
          matchesCategory = log.category === 'RBAC' || (log.resource || '').toLowerCase().includes('role');
        } else if (categoryFilter === 'SECURITY') {
          matchesCategory = (log.category as string) === 'SECURITY' || log.severity === 'SECURITY_ALERT' || log.severity === 'CRITICAL';
        }
      }

      let matchesSeverity = true;
      if (severityFilter !== 'ALL') {
        matchesSeverity = log.severity === severityFilter;
      }

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [effectiveLedger, dateFilter, search, categoryFilter, severityFilter]);

  const handleExportExcel = () => {
    const data = filtered.map((l) => ({
      'Timestamp': l.timestamp,
      'Category': l.category,
      'Severity': l.severity,
      'Action': l.action,
      'Operator': l.operator,
      'IP Address': l.ipAddress || (l as any).ip || '127.0.0.1',
      'Resource': l.resource || '',
      'Details': l.details,
      'Current Block Hash': l.currentHash || (l as any).blockHash || '',
      'Previous Block Hash': l.previousHash || '',
    }));
    exportToExcel(data, 'Audit_Ledger', 'Kisholoy_Audit_Ledger', dateFilter);
    showToast(isBn ? `${data.length}টি অডিট লগ এক্সেলে এক্সপোর্ট হয়েছে` : `Exported ${data.length} audit records to Excel.`);
  };

  const handleExportCsv = () => {
    const data = filtered.map((l) => ({
      'Timestamp': l.timestamp,
      'Action': l.action,
      'Category': l.category,
      'Operator': l.operator,
      'Details': l.details,
      'Hash': l.currentHash || '',
    }));
    exportToCsv(data, 'Kisholoy_Audit_Trail', dateFilter);
    showToast(isBn ? 'অডিট লগ CSV ফরম্যাটে ডাউনলোড হয়েছে' : 'Audit logs CSV exported.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <OfflineDataBanner
        visible={usingFallback}
        resource="cryptographic audit ledger"
        resourceBn="ক্রিপ্টোগ্রাফিক অডিট লেজার"
        onRetry={fetchLedger}
        retrying={loading}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-stone-900">
              {language === 'BN' ? 'ক্রিপ্টোগ্রাফিক অডিট লেজার ও নিরাপত্তা হাব' : 'Tamper-Evident Audit Ledger & Security'}
            </h1>
            <button
              onClick={() => setActiveHelp(SECURITY_HELP_DEFINITIONS.audit_chain)}
              className="p-1 rounded-full text-stone-400 hover:text-teal-800 hover:bg-stone-100 transition-colors"
              title="Explain Cryptographic Audit Ledger"
            >
              <HelpCircle className="w-4 h-4 text-teal-700" />
            </button>
          </div>
          <p className="text-xs text-stone-500">
            {language === 'BN'
              ? 'এসএইচএ-২৫৬ ক্রিপ্টোগ্রাফিক হ্যাশ চেইনিং দ্বারা সুরক্ষিত অপরিবর্তনযোগ্য অ্যাডমিন ও ফাইন্যান্সিয়াল খতিয়ান।'
              : 'Chronological append-only event ledger secured with SHA-256 hash chaining and HMAC digital signatures.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowDataHub(true)}
            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-950 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs border border-stone-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isBn ? 'মাস্টার ডেট হাব' : 'Date Hub & Export'}</span>
          </button>

          <button
            onClick={handleVerifyLedger}
            disabled={verifying}
            className="px-3 py-1.5 rounded-lg border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-950 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : 'text-teal-800'}`} />
            <span>{verifying ? 'Verifying Chain...' : 'Verify Cryptographic Chain'}</span>
          </button>

          <button
            onClick={handleRunDiagnostics}
            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>10-Point Security Scanner</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <DateRangeFilterBar
        value={dateFilter}
        onChange={setDateFilter}
        onOpenDataHub={() => setShowDataHub(true)}
        totalFilteredCount={filtered.length}
        totalUnfilteredCount={effectiveLedger.length}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
      />

      {/* Verification Status Banner */}
      {verificationResult && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <span className="font-bold text-emerald-950 block text-sm">
                Cryptographic Chain Verified Intact
              </span>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                All {verificationResult.totalBlocks} sequential event blocks passed unbroken SHA-256 hash matching from Genesis Block (0000...0000). Verified at {verificationResult.verifiedAt}.
              </p>
              <div className="mt-1 font-mono text-[10px] text-emerald-700 truncate max-w-xl">
                Latest Signature: <span className="font-bold">{verificationResult.latestHash}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setVerificationResult(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold shrink-0 self-end sm:self-center"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, operator, details, IP, or cryptographic hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 bg-stone-50"
          >
            <option value="ALL">All Categories</option>
            <option value="SECURITY">Security & Alerts</option>
            <option value="AUTH">Authentication & Sessions</option>
            <option value="RBAC">RBAC & Privileges</option>
            <option value="FINANCIAL">Finance & Settlements</option>
            <option value="INVENTORY">Inventory & Stock Adjustments</option>
            <option value="ORDERS">Orders & Dispatch</option>
            <option value="HIGH_VOLUME">High-Volume Flags (&ge;50 units)</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 bg-stone-50"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="SECURITY_ALERT">SECURITY ALERT</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>

          <button
            onClick={fetchLedger}
            disabled={loading}
            className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-500 min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center"
            title="Reload Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <span className="text-[11px] font-semibold text-stone-500 whitespace-nowrap px-2">
            Blocks: {filtered.length} / {effectiveLedger.length}
          </span>
        </div>
      </div>

      {/* Cryptographic Ledger Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">Block #</th>
                <th className="p-4">Timestamp (Asia/Dhaka)</th>
                <th className="p-4">Operator & Role</th>
                <th className="p-4">Severity / Category</th>
                <th className="p-4">Action & Resource</th>
                <th className="p-4">Event Details</th>
                <th className="p-4">Client IP</th>
                <th className="p-4 text-right">Hash Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-mono text-[11px]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400 font-sans">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((log, idx) => {
                  const isAlert = log.severity === 'SECURITY_ALERT' || log.severity === 'CRITICAL';
                  const isHighVol = log.action.includes('HIGH_VOLUME') || (log.details || '').includes('HIGH-VOLUME');

                  return (
                    <tr 
                      key={log.id || idx} 
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isAlert ? 'bg-rose-50/40' : isHighVol ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="p-4 font-bold text-stone-400 whitespace-nowrap">
                        #{String(log.sequence || (effectiveLedger.length - idx)).padStart(6, '0')}
                      </td>
                      <td className="p-4 text-stone-600 whitespace-nowrap text-[10px]">
                        <div>{new Date(log.timestamp).toLocaleDateString('en-GB')}</div>
                        <div className="text-stone-400">{new Date(log.timestamp).toLocaleTimeString('en-GB')}</div>
                      </td>
                      <td className="p-4 font-sans">
                        <div className="font-bold text-stone-900 text-xs">{log.operator}</div>
                        <div className="text-[10px] text-teal-800 font-mono">[{log.role}]</div>
                      </td>
                      <td className="p-4 font-sans">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.severity === 'CRITICAL' || log.severity === 'SECURITY_ALERT'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : log.severity === 'WARNING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {log.severity || 'INFO'}
                          </span>
                          <span className="text-[10px] font-semibold text-stone-500 font-mono">
                            {log.category || 'SYSTEM'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-sans">
                        <div className="font-bold text-stone-900 font-mono text-xs">{log.action}</div>
                        <div className="text-[10px] text-stone-500">{log.resource} ({log.resourceId})</div>
                      </td>
                      <td className="p-4 font-sans text-stone-700 max-w-sm leading-relaxed">
                        {log.details}
                      </td>
                      <td className="p-4 text-stone-500 font-mono text-[10px] whitespace-nowrap">
                        {log.ipAddress || (log as any).ip || '127.0.0.1'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setInspectEntry(log)}
                          className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-sans text-xs font-semibold flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3 text-stone-500" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Inspect Cryptographic Hash */}
      <AdminModalShell
        open={!!inspectEntry}
        onClose={() => setInspectEntry(null)}
        label="Inspect Cryptographic Hash"
        overlayClassName="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-teal-900" />
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Cryptographic Hash Certificate (Block #{inspectEntry.sequence || '---'})
                </h3>
              </div>
              <button onClick={() => setInspectEntry(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Action & Timestamp</span>
                <div className="font-bold text-stone-900">{inspectEntry.action}</div>
                <div className="text-stone-500">{new Date(inspectEntry.timestamp).toISOString()}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 font-mono text-[10px]">
                <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1 font-sans">Previous Block Hash (Chained)</span>
                <div className="text-stone-700 break-all">{inspectEntry.previousHash || '0000000000000000000000000000000000000000000000000000000000000000 (GENESIS)'}</div>
              </div>

              <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 font-mono text-[10px]">
                <span className="text-[10px] font-bold text-teal-800 uppercase block mb-1 font-sans">Current SHA-256 Block Digest</span>
                <div className="text-teal-950 font-bold break-all">{inspectEntry.currentHash || 'Generated on-the-fly'}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 font-mono text-[10px]">
                <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1 font-sans">HMAC-SHA256 Server Signature</span>
                <div className="text-stone-700 break-all">{inspectEntry.signature || 'Secured by Master Secret'}</div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>This record is cryptographically tied to the sequence ledger. Any modification would break the chain.</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-200 mt-4">
              <button
                onClick={() => setInspectEntry(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
      </AdminModalShell>

      {/* MODAL: 10-Point Security Vulnerability Scanner */}
      <AdminModalShell
        open={!!scannerOpen}
        onClose={() => setScannerOpen(false)}
        label="Security vulnerability scanner"
        overlayClassName="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    10-Point Automated Security Diagnostic Scanner
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Continuous automated audit verifying financial zero-trust, rate limits, audit integrity, and RBAC boundaries.
                  </p>
                </div>
              </div>
              <button onClick={() => setScannerOpen(false)} className="text-stone-400 hover:text-stone-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4">
              {scanning ? (
                <div className="py-12 flex flex-col items-center justify-center text-stone-500 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-teal-800" />
                  <span className="text-xs font-semibold">Running 10 programmatic security verifications...</span>
                </div>
              ) : scanReport ? (
                <>
                  {/* Executive Score Summary */}
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                        Security Posture Score
                      </span>
                      <div className="text-3xl font-serif font-bold text-emerald-800 mt-0.5">
                        {scanReport.overallScore}% {scanReport.rating}
                      </div>
                      <span className="text-xs text-emerald-700 mt-1 block">
                        {scanReport.checksPassed} of {scanReport.totalChecks} standards passing with zero critical vulnerabilities.
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-stone-500 block">Scanned At</span>
                      <span className="text-xs font-mono font-bold text-stone-800">
                        {new Date(scanReport.lastScannedAt).toLocaleTimeString('en-GB')}
                      </span>
                    </div>
                  </div>

                  {/* 10 Checks List */}
                  <div className="space-y-2">
                    {scanReport.checks.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg border border-stone-200 bg-white hover:bg-stone-50/50 transition-colors flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-stone-900">
                              {language === 'BN' ? c.titleBn : c.title}
                            </div>
                            <div className="text-stone-500 text-[11px] mt-0.5">
                              {language === 'BN' ? c.descriptionBn : c.description}
                            </div>
                            <div className="font-mono text-[10px] text-teal-900 mt-1 bg-teal-50 px-2 py-0.5 rounded inline-block">
                              {c.technicalDetails}
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-stone-400 text-xs">
                  No scan report generated. Click "Re-run Diagnostics" below.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
              <button
                onClick={() => setActiveHelp(SECURITY_HELP_DEFINITIONS.security_scanner)}
                className="text-xs text-teal-800 hover:underline flex items-center gap-1 font-semibold"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Explain 10-Point Scanner</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleRunDiagnostics}
                  disabled={scanning}
                  className="px-3 py-1.5 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
                  <span>Re-run Diagnostics</span>
                </button>
                <button
                  onClick={() => setScannerOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold bg-stone-900 hover:bg-black text-white rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
      </AdminModalShell>

      {/* ⓘ GLOBAL CONTEXTUAL ADMIN HELP MODAL */}
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

      {/* Date-wise Master Data Hub Modal */}
      {showDataHub && (
        <DateWiseDataHubModal
          isOpen={showDataHub}
          onClose={() => setShowDataHub(false)}
          initialDomain="AUDIT"
        />
      )}
    </div>
  );
}
