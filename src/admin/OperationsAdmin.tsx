import React, { useEffect, useState } from 'react';
import { 
  Cpu, CheckCircle2, Play, AlertCircle, RefreshCw, 
  Send, Webhook, MessageSquare, Mail, ShieldAlert, 
  Radio, Zap, Layers, Plus, Trash2, ArrowUpRight, 
  ExternalLink, Eye, Check, Power, AlertTriangle, 
  Clock, Hash, FileCode, Edit2, Key, Database, ChevronRight,
  Smartphone, MessageCircle, Info, Shield, ArrowRight, RotateCcw,
  Sliders, Bell, DollarSign, Activity, CheckSquare, Sparkles, PhoneCall
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  AutomationJob, WebhookEndpoint, WebhookDeliveryLog, 
  NotificationTemplate, NotificationLog, GatewayConfig, QueueStats,
  NotificationChannel, WhatsAppButtonConfig
} from '../types';
import { AdminHelpButton } from '../components/admin/AdminHelpModal';
import { NOTIFICATION_HELP_DATA } from '../data/notificationHelpData';

export function OperationsAdmin() {
  const { showToast, logAudit } = useApp();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'NOTIFICATIONS_HUB' | 'TEMPLATES' | 'GATEWAYS_CONFIG' | 'DELIVERY_LOGS' | 'QUEUE' | 'DLQ' | 'WEBHOOKS'
  >('NOTIFICATIONS_HUB');
  
  const [loading, setLoading] = useState(true);

  // Queue state
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [jobFilter, setJobFilter] = useState<string>('ALL');
  const [retryingJob, setRetryingJob] = useState<string | null>(null);
  const [tickingWorker, setTickingWorker] = useState(false);
  const [selectedJobPayload, setSelectedJobPayload] = useState<AutomationJob | null>(null);

  // Webhooks state
  const [webhookEndpoints, setWebhookEndpoints] = useState<WebhookEndpoint[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookDeliveryLog[]>([]);
  const [showAddWebhookModal, setShowAddWebhookModal] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [selectedWebhookLog, setSelectedWebhookLog] = useState<WebhookDeliveryLog | null>(null);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    secret: '',
    events: ['order.created', 'order.paid']
  });

  // Gateway & Notifications state
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [selectedNotificationLog, setSelectedNotificationLog] = useState<NotificationLog | null>(null);
  const [logChannelFilter, setLogChannelFilter] = useState<string>('ALL');

  // SMS Live Calculator & Dispatcher state
  const [smsTestInput, setSmsTestInput] = useState('কিশলয়: আপনার অর্ডার KSH-2026-0891 নিশ্চিত করা হয়েছে। মোট ৳৪৯৩০।');
  const [smsTestTelemetry, setSmsTestTelemetry] = useState<{ isUnicode: boolean; charCount: number; parts: number; costBdt: number }>({
    isUnicode: true,
    charCount: 65,
    parts: 1,
    costBdt: 0.35
  });
  const [directDispatchChannel, setDirectDispatchChannel] = useState<NotificationChannel>('SMS');
  const [directRecipient, setDirectRecipient] = useState('+8801712345678');
  const [directSubject, setDirectSubject] = useState('Order Update from Kisholoy');
  const [directMessage, setDirectMessage] = useState('কিশলয়: আপনার ঐতিহ্যবাহী জামদানি শাড়িটি প্যাকেজিং সম্পন্ন হয়ে ডেলিভারির জন্য প্রস্তুত হয়েছে।');
  const [dispatching, setDispatching] = useState(false);
  const [lastDispatchedResult, setLastDispatchedResult] = useState<any | null>(null);

  // Gateway Testing state
  const [testingGateway, setTestingGateway] = useState<string | null>(null);
  const [gatewayTestResult, setGatewayTestResult] = useState<any | null>(null);
  const [topupLoading, setTopupLoading] = useState(false);
  const [editingGatewayConfig, setEditingGatewayConfig] = useState<GatewayConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // WhatsApp Preview tab state
  const [templatePreviewLang, setTemplatePreviewLang] = useState<'BN' | 'EN'>('BN');
  const [templatePreviewChannel, setTemplatePreviewChannel] = useState<'WHATSAPP' | 'SMS' | 'EMAIL'>('WHATSAPP');

  // Fetch all operations telemetry
  const fetchOperationsData = async () => {
    try {
      setLoading(true);
      const [jobsRes, statsRes, webhooksRes, logsRes, templatesRes, nlogsRes, configRes] = await Promise.all([
        fetch('/api/operations/jobs'),
        fetch('/api/operations/stats'),
        fetch('/api/webhooks/endpoints'),
        fetch('/api/webhooks/logs'),
        fetch('/api/notifications/templates'),
        fetch('/api/notifications/logs'),
        fetch('/api/notifications/config')
      ]);

      const [jobsData, statsData, webhooksData, logsData, templatesData, nlogsData, configData] = await Promise.all([
        jobsRes.json(), statsRes.json(), webhooksRes.json(), logsRes.json(),
        templatesRes.json(), nlogsRes.json(), configRes.json()
      ]);

      if (jobsData.success) setJobs(jobsData.jobs);
      if (statsData.success) setQueueStats(statsData.stats);
      if (webhooksData.success) setWebhookEndpoints(webhooksData.endpoints);
      if (logsData.success) setWebhookLogs(logsData.logs);
      if (templatesData.success) {
        setTemplates(templatesData.templates);
        if (templatesData.templates.length > 0 && !selectedTemplate) {
          setSelectedTemplate(templatesData.templates[0]);
          setEditingTemplate(JSON.parse(JSON.stringify(templatesData.templates[0])));
        }
      }
      if (nlogsData.success) setNotificationLogs(nlogsData.logs);
      if (configData.success) {
        setGatewayConfig(configData.config);
        setEditingGatewayConfig(JSON.parse(JSON.stringify(configData.config)));
      }
    } catch (e) {
      console.error('Failed to load operations data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();
  }, []);

  // Recalculate SMS character segmentation live
  const handleSmsInputChange = async (text: string) => {
    setSmsTestInput(text);
    try {
      const res = await fetch('/api/notifications/calculate-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) setSmsTestTelemetry(data.telemetry);
      }
    } catch (e) {
      // Deliberately silent: this fires on every keystroke of the SMS preview
      // box and only refreshes a character/segment counter. A toast per
      // keystroke would be worse than a stale counter. Reviewed for F-305.
      console.error(e);
    }
  };

  // Direct dispatch test
  const handleDirectDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDispatching(true);
      setLastDispatchedResult(null);
      const res = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: directDispatchChannel,
          recipient: directRecipient,
          eventKey: 'DIRECT_TEST_DISPATCH',
          language: 'BN',
          customContent: directMessage,
          customSubject: directSubject
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastDispatchedResult(data.log);
        showToast(`Dispatched ${directDispatchChannel} successfully! Telemetry logged.`);
        logAudit('DIRECT_NOTIFICATION_DISPATCH', 'Operations', directRecipient, `Channel: ${directDispatchChannel}`);
        // Refresh logs and config balance
        fetch('/api/notifications/logs')
          .then(r => r.json())
          .then(d => d.success && setNotificationLogs(d.logs));
        if (data.balance !== undefined && gatewayConfig) {
          setGatewayConfig(prev => prev ? { ...prev, smsBalanceBdt: data.balance } : null);
        }
      } else {
        showToast(data.error || 'Failed to dispatch notification');
      }
    } catch (e: any) {
      showToast(e.message || 'Error executing dispatch');
    } finally {
      setDispatching(false);
    }
  };

  // Test Gateway Connection
  const handleTestConnection = async (channel: NotificationChannel, provider: string) => {
    try {
      setTestingGateway(channel);
      setGatewayTestResult(null);
      const res = await fetch('/api/notifications/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, provider })
      });
      const data = await res.json();
      if (data.success) {
        setGatewayTestResult(data);
        showToast(`${channel} Gateway Ping Succeeded (${data.latencyMs}ms)`);
      } else {
        showToast(`Gateway Ping Failed: ${data.message}`);
      }
    } catch (e: any) {
      showToast('Ping error: ' + e.message);
    } finally {
      setTestingGateway(null);
    }
  };

  // Topup SMS credit balance
  const handleTopupBalance = async (amount: number) => {
    try {
      setTopupLoading(true);
      const res = await fetch('/api/notifications/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountBdt: amount })
      });
      const data = await res.json();
      if (data.success) {
        if (gatewayConfig) {
          setGatewayConfig({ ...gatewayConfig, smsBalanceBdt: data.balance });
        }
        if (editingGatewayConfig) {
          setEditingGatewayConfig({ ...editingGatewayConfig, smsBalanceBdt: data.balance });
        }
        showToast(`Recharged ৳${amount}. New SMS balance: ৳${data.balance.toFixed(2)}`);
      }
    } catch (e: any) {
      showToast('Topup error: ' + e.message);
    } finally {
      setTopupLoading(false);
    }
  };

  // Retry notification log
  const handleRetryNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/logs/${id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.log) {
        setNotificationLogs(prev => prev.map(l => l.id === id ? data.log : l));
        showToast('Notification re-sent successfully!');
      } else {
        showToast('Failed to retry notification');
      }
    } catch (e) {
      showToast('Error retrying notification');
    }
  };

  // Save Gateway Config
  const handleSaveGatewayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGatewayConfig) return;
    try {
      setSavingConfig(true);
      const res = await fetch('/api/notifications/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGatewayConfig)
      });
      const data = await res.json();
      if (data.success) {
        setGatewayConfig(data.config);
        showToast('Gateway configuration saved securely');
      }
    } catch (e: any) {
      showToast('Error saving gateway config');
    } finally {
      setSavingConfig(false);
    }
  };

  // Save Notification Template
  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      const res = await fetch(`/api/notifications/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate)
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? data.template : t));
        setSelectedTemplate(data.template);
        showToast(`Template "${editingTemplate.title}" saved`);
        logAudit('UPDATE_TEMPLATE', 'Operations', editingTemplate.id, `Updated template ${editingTemplate.title}`);
      }
    } catch (e) {
      showToast('Failed to save template');
    }
  };

  // Manual tick of automation worker
  const handleTickWorker = async () => {
    try {
      setTickingWorker(true);
      const res = await fetch('/api/operations/tick', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchOperationsData();
      }
    } catch (e) {
      showToast('Worker execution failed');
    } finally {
      setTickingWorker(false);
    }
  };

  // Retry job
  const handleRetryJob = async (jobId: string) => {
    try {
      setRetryingJob(jobId);
      const res = await fetch(`/api/operations/jobs/${jobId}/retry`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Job ${jobId} moved back to pending queue`);
        fetchOperationsData();
      }
    } catch (e) {
      showToast('Failed to retry job');
    } finally {
      setRetryingJob(null);
    }
  };

  // Send webhook test ping
  const handleSendTestPing = async (endpointId: string) => {
    try {
      setTestingWebhookId(endpointId);
      const res = await fetch(`/api/webhooks/endpoints/${endpointId}/ping`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Ping delivered! Status: ${data.log.httpStatus} (${data.log.durationMs}ms)`);
        fetchOperationsData();
      } else {
        showToast(`Ping failed: ${data.error || 'Server error'}`);
      }
    } catch (e) {
      showToast('Failed to execute ping');
    } finally {
      setTestingWebhookId(null);
    }
  };

  // Create Webhook
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/webhooks/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Registered webhook "${newWebhook.name}"`);
        setShowAddWebhookModal(false);
        setNewWebhook({ name: '', url: '', secret: '', events: ['order.created', 'order.paid'] });
        fetchOperationsData();
      }
    } catch (e) {
      showToast('Error registering webhook');
    }
  };

  // Delete Webhook
  const handleDeleteWebhook = async (id: string, name: string) => {
    if (!window.confirm(`Delete webhook endpoint "${name}"?`)) return;
    try {
      const res = await fetch(`/api/webhooks/endpoints/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Webhook endpoint deleted');
        fetchOperationsData();
      }
    } catch (e) {
      showToast('Failed to delete endpoint');
    }
  };

  const filteredLogs = notificationLogs.filter(log => {
    if (logChannelFilter === 'ALL') return true;
    return log.channel === logChannelFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-teal-800 text-teal-200 text-[10px] font-mono font-bold tracking-wider uppercase">
                Phase 16 Engine
              </span>
              <h1 className="text-xl font-bold tracking-tight">
                Notifications & Communication Hub (SMS, WhatsApp, Email, In-App)
              </h1>
            </div>
            <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
              Bilingual customer communication engine with BTRC masked SMS, Meta WhatsApp Business Cloud API, transactional email deliverability, and real-time carrier telemetry.
            </p>
          </div>

          {/* Quick Balance & Telemetry Badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-2 bg-stone-800/90 rounded-xl border border-stone-700/80 text-right">
              <div className="flex items-center justify-end gap-1 text-[10px] text-stone-400 font-bold uppercase">
                <span>SMS Gateway Balance</span>
                <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.SMS_BALANCE_TOPUP} />
              </div>
              <span className="text-base font-bold font-mono text-emerald-400">
                ৳{gatewayConfig?.smsBalanceBdt.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="px-3 py-2 bg-stone-800/90 rounded-xl border border-stone-700/80 text-right">
              <div className="flex items-center justify-end gap-1 text-[10px] text-stone-400 font-bold uppercase">
                <span>WhatsApp Cloud API</span>
                <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.WHATSAPP_CLOUD_API} />
              </div>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${gatewayConfig?.whatsappEnabled ? 'bg-emerald-900/60 text-emerald-300' : 'bg-stone-700 text-stone-400'}`}>
                {gatewayConfig?.whatsappEnabled ? 'ACTIVE (Tier 1)' : 'DISABLED'}
              </span>
            </div>

            <button
              onClick={fetchOperationsData}
              disabled={loading}
              className="p-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('NOTIFICATIONS_HUB')}
          className={`px-3.5 py-2 rounded-t-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'NOTIFICATIONS_HUB'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          Overview & Live Dispatcher
        </button>

        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`px-3.5 py-2 rounded-t-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'TEMPLATES'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
          Bilingual Templates ({templates.length})
        </button>

        <button
          onClick={() => setActiveTab('DELIVERY_LOGS')}
          className={`px-3.5 py-2 rounded-t-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'DELIVERY_LOGS'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          Delivery Logs ({notificationLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('GATEWAYS_CONFIG')}
          className={`px-3.5 py-2 rounded-t-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'GATEWAYS_CONFIG'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          Gateways & Testing
        </button>

        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`px-3.5 py-2 rounded-t-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'QUEUE'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          Queue & DLQ ({queueStats?.pendingJobs || 0})
        </button>

        <button
          onClick={() => setActiveTab('WEBHOOKS')}
          className={`px-3.5 py-2 rounded-t-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'WEBHOOKS'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Webhook className="w-3.5 h-3.5 text-purple-400" />
          Outbound Webhooks ({webhookEndpoints.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NOTIFICATIONS OVERVIEW & LIVE DISPATCHER                           */}
      {/* ========================================================================= */}
      {activeTab === 'NOTIFICATIONS_HUB' && (
        <div className="space-y-6">
          {/* Quick Metrics Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-700" /> SMS Dispatcher
                </span>
                <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.SMS_GATEWAY_CONFIG} />
              </div>
              <div className="text-xl font-bold font-mono text-stone-900">
                {notificationLogs.filter(l => l.channel === 'SMS').length} Sent
              </div>
              <div className="text-[11px] text-emerald-800 flex justify-between">
                <span>Masking: <strong>{gatewayConfig?.smsMaskingName || 'KISHOLOY'}</strong></span>
                <span>৳0.35/part</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-green-700" /> WhatsApp Cloud
                </span>
                <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.WHATSAPP_CLOUD_API} />
              </div>
              <div className="text-xl font-bold font-mono text-stone-900">
                {notificationLogs.filter(l => l.channel === 'WHATSAPP').length} Sent
              </div>
              <div className="text-[11px] text-stone-600 flex justify-between">
                <span>Failover to SMS:</span>
                <strong className={gatewayConfig?.whatsappFallbackToSms ? 'text-emerald-700' : 'text-stone-400'}>
                  {gatewayConfig?.whatsappFallbackToSms ? 'ENABLED' : 'OFF'}
                </strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-700" /> Transactional Email
                </span>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                  DKIM / SPF
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-stone-900">
                {notificationLogs.filter(l => l.channel === 'EMAIL').length} Sent
              </div>
              <div className="text-[11px] text-stone-500 truncate">
                {gatewayConfig?.emailSenderAddress || 'orders@kisholoy.com.bd'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-teal-700" /> Regulatory & DND
                </span>
                <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.BTRC_DND_QUIET_HOURS} />
              </div>
              <div className="text-xl font-bold font-mono text-teal-900">
                10PM - 8AM
              </div>
              <div className="text-[11px] text-stone-500 flex justify-between">
                <span>BTRC Policy:</span>
                <strong className="text-emerald-800">ENFORCED</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Bangla SMS Telemetry & Part Calculator */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-800" />
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    Bangla Unicode SMS Part Calculator
                  </h3>
                  <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.BANGLA_UNICODE_SEGMENTATION} />
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  smsTestTelemetry.isUnicode ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                }`}>
                  {smsTestTelemetry.isUnicode ? 'Unicode (বাংলা / UCS-2)' : 'Standard GSM 7-bit'}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Interactive Message Text</label>
                <textarea
                  rows={4}
                  value={smsTestInput}
                  onChange={(e) => handleSmsInputChange(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-xs font-sans focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  placeholder="Type English or Bengali text to calculate parts and cost..."
                />
              </div>

              {/* Telemetry Chips */}
              <div className="grid grid-cols-4 gap-2 bg-stone-50 p-3 rounded-lg border border-stone-200 text-center">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">Characters</span>
                  <span className="text-base font-mono font-bold text-stone-900">{smsTestTelemetry.charCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">SMS Segments</span>
                  <span className="text-base font-mono font-bold text-indigo-900">{smsTestTelemetry.parts} Part(s)</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">Encoding</span>
                  <span className="text-xs font-mono font-bold text-stone-800 block mt-1">
                    {smsTestTelemetry.isUnicode ? 'UCS-2' : 'GSM-7'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">Est. Cost</span>
                  <span className="text-base font-mono font-bold text-teal-900">৳{smsTestTelemetry.costBdt.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[11px] text-stone-500 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 leading-relaxed flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Cost Math:</strong> GSM-7 allows 160 characters (153 chars/part). Bengali Unicode permits 70 characters (Part 1) and 67 chars/part for multi-part messages. Rates: ৳0.30/GSM part vs ৳0.35/Unicode part.
                </span>
              </div>
            </div>

            {/* Live Notification Dispatcher (Test Harness) */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-teal-800" />
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    Live Notification Dispatcher (Test Harness)
                  </h3>
                  <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.IDEMPOTENCY_PROTECTION} />
                </div>
                <span className="text-[11px] font-mono text-stone-400">Idempotency Guard: 60s</span>
              </div>

              <form onSubmit={handleDirectDispatch} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Target Channel</label>
                    <select
                      value={directDispatchChannel}
                      onChange={(e) => setDirectDispatchChannel(e.target.value as any)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold"
                    >
                      <option value="SMS">SMS Gateway (Greenweb Masked)</option>
                      <option value="WHATSAPP">WhatsApp Cloud API (Meta)</option>
                      <option value="EMAIL">Transactional Email (Resend)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      {directDispatchChannel === 'EMAIL' ? 'Recipient Email' : 'Recipient Mobile (+880...)'}
                    </label>
                    <input
                      type="text"
                      value={directRecipient}
                      onChange={(e) => setDirectRecipient(e.target.value)}
                      placeholder={directDispatchChannel === 'EMAIL' ? 'customer@kisholoy.com' : '+8801712345678'}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                {directDispatchChannel === 'EMAIL' && (
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Subject Line</label>
                    <input
                      type="text"
                      value={directSubject}
                      onChange={(e) => setDirectSubject(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Message Body</label>
                  <textarea
                    rows={3}
                    value={directMessage}
                    onChange={(e) => setDirectMessage(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  {directDispatchChannel === 'WHATSAPP' && (
                    <a
                      href={`https://wa.me/${directRecipient.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(directMessage)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-green-50 text-green-800 border border-green-200 rounded-lg text-xs font-bold hover:bg-green-100 flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-green-700" /> Click-to-Chat Deep Link
                    </a>
                  )}

                  <button
                    type="submit"
                    disabled={dispatching}
                    className="flex-1 py-2.5 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-teal-400" />
                    {dispatching ? 'Dispatching Message...' : `Dispatch ${directDispatchChannel} Message`}
                  </button>
                </div>
              </form>

              {lastDispatchedResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between items-center text-emerald-900 font-bold">
                    <span>✓ Delivered via {lastDispatchedResult.channel}</span>
                    <span className="font-mono text-[10px]">ID: {lastDispatchedResult.messageId}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-mono truncate">{lastDispatchedResult.content}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BILINGUAL NOTIFICATION TEMPLATES                                    */}
      {/* ========================================================================= */}
      {activeTab === 'TEMPLATES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selector List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Event Templates ({templates.length})
              </span>
              <span className="text-[10px] text-stone-400 font-mono">Multi-Channel</span>
            </div>

            <div className="space-y-1.5 max-h-[680px] overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplate(tpl);
                    setEditingTemplate(JSON.parse(JSON.stringify(tpl)));
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    selectedTemplate?.id === tpl.id
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs truncate max-w-[170px]">{tpl.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      selectedTemplate?.id === tpl.id ? 'bg-stone-800 text-teal-400' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {tpl.eventKey}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={selectedTemplate?.id === tpl.id ? 'text-stone-300' : 'text-stone-500'}>
                      {tpl.titleBn}
                    </span>
                    <div className="flex items-center gap-1">
                      {tpl.channels.map(ch => (
                        <span key={ch} className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                          selectedTemplate?.id === tpl.id ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-500'
                        }`}>
                          {ch.substring(0, 2)}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Template Editor Form */}
          {editingTemplate && (
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      {editingTemplate.title} ({editingTemplate.eventKey})
                    </h3>
                    <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.WHATSAPP_FALLBACK_TO_SMS} />
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Configure bilingual SMS, WhatsApp rich messages, buttons, and responsive HTML email.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveTemplate}
                    className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-teal-400" /> Save Template
                  </button>
                </div>
              </div>

              {/* Channels Enabled & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div>
                  <span className="text-xs font-bold text-stone-700 block mb-1.5">Dispatch Channels</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP'] as NotificationChannel[]).map(ch => (
                      <label key={ch} className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingTemplate.channels.includes(ch)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingTemplate({ ...editingTemplate, channels: [...editingTemplate.channels, ch] });
                            } else {
                              setEditingTemplate({ ...editingTemplate, channels: editingTemplate.channels.filter(c => c !== ch) });
                            }
                          }}
                          className="rounded border-stone-300 text-stone-900 focus:ring-0"
                        />
                        <span>{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTemplate.isActive}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, isActive: e.target.checked })}
                      className="rounded border-stone-300 text-stone-900 focus:ring-0"
                    />
                    <span>Automated Trigger Active</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Variables Chips */}
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="text-[11px] font-bold text-stone-600 mr-2">Available Variables:</span>
                <div className="inline-flex gap-1.5 flex-wrap mt-1">
                  {editingTemplate.variables.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`{${v}}`);
                        showToast(`Copied {${v}} to clipboard`);
                      }}
                      className="px-1.5 py-0.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded font-mono text-[10px] transition-colors"
                      title="Click to copy variable"
                    >
                      {`{${v}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Tabs: SMS / WhatsApp / Email */}
              <div className="space-y-4">
                {/* 1. SMS Templates */}
                <div className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-800" /> SMS Configuration (বাংলা ও ইংরেজি)
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">BTRC Sender: KISHOLOY</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                        <span>SMS Text (বাংলা - Bengali)</span>
                        <span className="text-[11px] font-mono text-amber-800">
                          {editingTemplate.smsBodyBn.length} chars (UCS-2)
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={editingTemplate.smsBodyBn}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, smsBodyBn: e.target.value })}
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-sans"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                        <span>SMS Text (English GSM-7)</span>
                        <span className="text-[11px] font-mono text-indigo-800">
                          {editingTemplate.smsBodyEn.length} chars (GSM-7)
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={editingTemplate.smsBodyEn}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, smsBodyEn: e.target.value })}
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. WhatsApp Rich Templates */}
                <div className="p-3.5 bg-green-50/40 border border-green-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-green-900 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-green-700" /> WhatsApp Cloud Message & Interactive Buttons
                    </span>
                    <span className="text-[10px] text-green-800 font-mono">Meta Graph API v18.0</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        WhatsApp Body (বাংলা - Bengali)
                      </label>
                      <textarea
                        rows={4}
                        value={editingTemplate.whatsappBodyBn || editingTemplate.smsBodyBn}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, whatsappBodyBn: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-xs font-sans"
                        placeholder="Support markdown bolding: *অর্ডার নম্বর: {orderNumber}*"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        WhatsApp Body (English)
                      </label>
                      <textarea
                        rows={4}
                        value={editingTemplate.whatsappBodyEn || editingTemplate.smsBodyEn}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, whatsappBodyEn: e.target.value })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                        placeholder="Support markdown bolding: *Order Number: {orderNumber}*"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Interactive Buttons Config */}
                  {editingTemplate.whatsappButtons && editingTemplate.whatsappButtons.length > 0 && (
                    <div className="pt-2 border-t border-green-200/60">
                      <span className="text-xs font-bold text-stone-700 block mb-1.5">
                        Interactive Action Buttons (Quick Links / Call-to-Action)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {editingTemplate.whatsappButtons.map((btn, idx) => (
                          <div key={idx} className="p-2 bg-white rounded-lg border border-stone-200 flex items-center justify-between text-xs">
                            <div>
                              <strong className="block text-stone-900">{btn.text} ({btn.textBn})</strong>
                              <span className="text-[10px] font-mono text-stone-500 truncate block max-w-xs">{btn.url || btn.payload}</span>
                            </div>
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-900 font-mono text-[10px] rounded font-bold">
                              {btn.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Transactional Email Subject & HTML */}
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-700" /> Transactional Email (Bilingual)
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">Responsive HTML Header & Footer</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Email Subject (বাংলা)</label>
                      <input
                        type="text"
                        value={editingTemplate.emailSubjectBn}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, emailSubjectBn: e.target.value })}
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Email Subject (English)</label>
                      <input
                        type="text"
                        value={editingTemplate.emailSubjectEn}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, emailSubjectEn: e.target.value })}
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Email HTML Body (English)</label>
                    <textarea
                      rows={3}
                      value={editingTemplate.emailHtmlEn}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, emailHtmlEn: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GATEWAYS & LIVE TESTING                                             */}
      {/* ========================================================================= */}
      {activeTab === 'GATEWAYS_CONFIG' && editingGatewayConfig && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveGatewayConfig} className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-6">
              <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    Carrier Gateway Credentials & Routing Policies
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Configure Greenweb SMS, Meta WhatsApp Cloud API, and Email delivery credentials.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  {savingConfig ? 'Saving...' : 'Save All Settings'}
                </button>
              </div>

              {/* SMS Gateway Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-800" />
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      1. SMS Aggregator Gateway (Bangladesh)
                    </h4>
                    <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.SMS_GATEWAY_CONFIG} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('SMS', editingGatewayConfig.smsProvider)}
                    disabled={testingGateway === 'SMS'}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Activity className="w-3 h-3 text-emerald-700" />
                    {testingGateway === 'SMS' ? 'Testing...' : 'Test SMS Gateway Ping'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Provider Aggregator</label>
                    <select
                      value={editingGatewayConfig.smsProvider}
                      onChange={(e) => setEditingGatewayConfig({ ...editingGatewayConfig, smsProvider: e.target.value as any })}
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="GREENWEB">Greenweb BD (Masked)</option>
                      <option value="BULKSMS_BD">BulkSMS BD</option>
                      <option value="SSL_WIRELESS">SSL Wireless</option>
                      <option value="ONNOROKOM">Onnorokom SMS</option>
                      <option value="MOCK">Mock Simulator (Sandbox)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Masking Sender ID (BTRC)</label>
                    <input
                      type="text"
                      value={editingGatewayConfig.smsSenderId}
                      onChange={(e) => setEditingGatewayConfig({ ...editingGatewayConfig, smsSenderId: e.target.value })}
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Gateway API Key / Token</label>
                    <input
                      type="password"
                      value={editingGatewayConfig.smsApiKey}
                      onChange={(e) => setEditingGatewayConfig({ ...editingGatewayConfig, smsApiKey: e.target.value })}
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp Cloud API Section */}
              <div className="space-y-4 pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-700" />
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      2. Meta WhatsApp Business Cloud API
                    </h4>
                    <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.WHATSAPP_CLOUD_API} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('WHATSAPP', editingGatewayConfig.whatsappProvider)}
                    disabled={testingGateway === 'WHATSAPP'}
                    className="px-2.5 py-1 bg-green-50 text-green-900 hover:bg-green-100 border border-green-200 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Activity className="w-3 h-3 text-green-700" />
                    {testingGateway === 'WHATSAPP' ? 'Testing...' : 'Test WhatsApp Ping'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                    <input
                      type="checkbox"
                      id="wa-enabled"
                      checked={editingGatewayConfig.whatsappEnabled}
                      onChange={(e) => setEditingGatewayConfig({ ...editingGatewayConfig, whatsappEnabled: e.target.checked })}
                      className="rounded border-stone-300 text-stone-900 focus:ring-0"
                    />
                    <label htmlFor="wa-enabled" className="text-xs font-bold text-stone-800 cursor-pointer">
                      Enable Meta WhatsApp Cloud API
                    </label>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                    <input
                      type="checkbox"
                      id="wa-fallback"
                      checked={editingGatewayConfig.whatsappFallbackToSms}
                      onChange={(e) => setEditingGatewayConfig({ ...editingGatewayConfig, whatsappFallbackToSms: e.target.checked })}
                      className="rounded border-stone-300 text-stone-900 focus:ring-0"
                    />
                    <label htmlFor="wa-fallback" className="text-xs font-bold text-stone-800 cursor-pointer flex items-center gap-1">
                      <span>Automated Fallback to SMS on Failure</span>
                      <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.WHATSAPP_FALLBACK_TO_SMS} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Phone Number ID (Meta)</label>
                    <input
                      type="text"
                      value={editingGatewayConfig.whatsappPhoneNumberId}
                      onChange={(e) => setEditingGatewayConfig({ ...editingGatewayConfig, whatsappPhoneNumberId: e.target.value })}
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">WABA Account ID</label>
                    <input
                      type="text"
                      value={editingGatewayConfig.whatsappBusinessAccountId}
                      onChange={(e) => setEditingGatewayConfig({ ...editingGatewayConfig, whatsappBusinessAccountId: e.target.value })}
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Transactional Email Section */}
              <div className="space-y-4 pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-700" />
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      3. Transactional Email Provider (SPF & DKIM)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('EMAIL', editingGatewayConfig.emailProvider)}
                    disabled={testingGateway === 'EMAIL'}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Activity className="w-3 h-3 text-indigo-700" />
                    {testingGateway === 'EMAIL' ? 'Testing...' : 'Test Email Ping'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Email Provider</label>
                    <select
                      value={editingGatewayConfig.emailProvider}
                      onChange={(e) => setEditingGatewayConfig({ ...editingGatewayConfig, emailProvider: e.target.value as any })}
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="RESEND">Resend.com (Recommended)</option>
                      <option value="SENDGRID">SendGrid Transactional</option>
                      <option value="AMAZON_SES">Amazon SES (Frankfurt / Mumbai)</option>
                      <option value="SMTP">Custom Enterprise SMTP</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Sender Email Address</label>
                    <input
                      type="email"
                      value={editingGatewayConfig.emailSenderAddress}
                      onChange={(e) => setEditingGatewayConfig({ ...editingGatewayConfig, emailSenderAddress: e.target.value })}
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Prepaid Recharge & Telemetry */}
          <div className="space-y-6">
            {/* Balance Recharge Card */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-800" />
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    SMS Credit Balance
                  </h3>
                  <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.SMS_BALANCE_TOPUP} />
                </div>
                <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>

              <div className="text-center py-2 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-xs text-stone-500 font-bold block uppercase">Current Available Credits</span>
                <span className="text-3xl font-bold font-mono text-emerald-900 block mt-0.5">
                  ৳{gatewayConfig?.smsBalanceBdt.toFixed(2) || '0.00'}
                </span>
                <span className="text-[11px] text-stone-400">
                  Approx. {Math.floor((gatewayConfig?.smsBalanceBdt || 0) / 0.35)} Bangla SMS remaining
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-700 block mb-2">Simulate Instant Top-up</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTopupBalance(500)}
                    disabled={topupLoading}
                    className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-lg text-xs font-bold border border-stone-200 transition-colors"
                  >
                    + ৳500 (bKash)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTopupBalance(1000)}
                    disabled={topupLoading}
                    className="py-2 px-3 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    + ৳1,000 (Corporate)
                  </button>
                </div>
              </div>
            </div>

            {/* Test Ping Result Card */}
            {gatewayTestResult && (
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-800" /> Gateway Ping Telemetry
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-mono font-bold text-[10px]">
                    {gatewayTestResult.latencyMs}ms
                  </span>
                </div>
                <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  {gatewayTestResult.message}
                </p>
                <pre className="p-2.5 bg-stone-900 text-stone-200 font-mono text-[10px] rounded-lg overflow-x-auto max-h-40">
                  {JSON.stringify(gatewayTestResult.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DELIVERY LOGS & AUDIT TRAIL                                        */}
      {/* ========================================================================= */}
      {activeTab === 'DELIVERY_LOGS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Multi-Channel Dispatch History ({filteredLogs.length})
              </h3>
              <AdminHelpButton helpData={NOTIFICATION_HELP_DATA.IDEMPOTENCY_PROTECTION} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-semibold">Filter Channel:</span>
              <select
                value={logChannelFilter}
                onChange={(e) => setLogChannelFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-stone-800"
              >
                <option value="ALL">All Channels</option>
                <option value="SMS">SMS Gateway</option>
                <option value="WHATSAPP">WhatsApp Cloud</option>
                <option value="EMAIL">Email</option>
                <option value="IN_APP">In-App</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="divide-y divide-stone-100 text-xs">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-stone-500">No notification logs match the selected filter.</div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-stone-50/70 transition-colors">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          log.channel === 'WHATSAPP' ? 'bg-green-100 text-green-900' :
                          (log.channel === 'SMS' ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-900')
                        }`}>
                          {log.channel}
                        </span>

                        <span className="font-bold text-stone-900 font-mono">{log.eventKey}</span>
                        <span className="text-stone-500 font-mono text-[11px]">→ {log.recipient}</span>

                        {log.fallbackTriggered && (
                          <span className="px-1.5 py-0.2 bg-red-100 text-red-900 rounded font-bold text-[9px]">
                            SMS Failover
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">
                          {log.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-600 line-clamp-1">{log.content}</p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right text-[11px] text-stone-400 font-mono">
                        <div>৳{log.costBdt.toFixed(2)} ({log.parts} part)</div>
                        <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </div>

                      <button
                        onClick={() => setSelectedNotificationLog(log)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold text-[11px]"
                      >
                        Inspect
                      </button>

                      <button
                        onClick={() => handleRetryNotification(log.id)}
                        className="p-1.5 text-stone-400 hover:text-stone-900 rounded transition-colors"
                        title="Retry sending"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5 & 6: QUEUE & DLQ ENGINE                                             */}
      {/* ========================================================================= */}
      {(activeTab === 'QUEUE' || activeTab === 'DLQ') && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-stone-500 font-bold uppercase">Pending Jobs</span>
              <div className="text-2xl font-bold font-mono text-amber-700">{queueStats?.pendingJobs || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-stone-500 font-bold uppercase">Processing Workers</span>
              <div className="text-2xl font-bold font-mono text-cyan-700">{queueStats?.processingJobs || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-stone-500 font-bold uppercase">Completed Tasks</span>
              <div className="text-2xl font-bold font-mono text-emerald-700">{queueStats?.completedJobs || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-stone-500 font-bold uppercase">Dead Letter Queue (DLQ)</span>
              <div className="text-2xl font-bold font-mono text-red-700">{queueStats?.dlqJobs || 0}</div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700">Filter Status:</span>
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="p-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold"
              >
                <option value="ALL">All Jobs</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Dead Letter Queue (Failed)</option>
              </select>
            </div>

            <button
              onClick={handleTickWorker}
              disabled={tickingWorker}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-teal-400" />
              {tickingWorker ? 'Worker Processing...' : 'Trigger Background Worker Tick'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="divide-y divide-stone-100 text-xs">
              {jobs
                .filter(j => jobFilter === 'ALL' || (jobFilter === 'FAILED' ? j.status === 'FAILED' : j.status === jobFilter))
                .map((job) => (
                  <div key={job.id} className="p-3.5 flex justify-between items-center gap-2 hover:bg-stone-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900' :
                          (job.status === 'FAILED' ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900')
                        }`}>
                          {job.status}
                        </span>
                        <span className="font-bold text-stone-900 font-mono">{job.type}</span>
                        <span className="text-stone-500 text-[11px] font-mono">Retries: {job.attempts}/{job.maxAttempts}</span>
                      </div>
                      <p className="text-[11px] text-stone-600">{job.payloadSummary}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedJobPayload(job)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold text-[11px]"
                      >
                        Inspect
                      </button>
                      {job.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetryJob(job.id)}
                          disabled={retryingJob === job.id}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: OUTBOUND WEBHOOKS ENGINE                                           */}
      {/* ========================================================================= */}
      {activeTab === 'WEBHOOKS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Webhook className="w-4 h-4 text-purple-700" />
                Registered Webhook Endpoints (HMAC SHA-256)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Dispatches signed webhooks for third-party ERPs and courier tracking</p>
            </div>

            <button
              onClick={() => setShowAddWebhookModal(true)}
              className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" /> Register Outbound Endpoint
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {webhookEndpoints.map((ep) => (
              <div key={ep.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-stone-900">{ep.name}</h4>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-900 rounded font-mono text-[10px] font-bold">
                    HMAC Verified
                  </span>
                </div>
                <p className="text-xs font-mono text-stone-500 truncate">{ep.url}</p>
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <button
                    onClick={() => handleSendTestPing(ep.id)}
                    disabled={testingWebhookId === ep.id}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold flex items-center gap-1"
                  >
                    <Send className="w-3 h-3 text-teal-800" />
                    {testingWebhookId === ep.id ? 'Pinging...' : 'Send Test Ping'}
                  </button>
                  <button
                    onClick={() => handleDeleteWebhook(ep.id, ep.name)}
                    className="p-1 text-stone-400 hover:text-red-700"
                    title="Delete webhook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & PAYLOAD INSPECTORS                                               */}
      {/* ========================================================================= */}
      {/* Inspect Notification Log Modal */}
      {selectedNotificationLog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-mono">
                  {selectedNotificationLog.channel} Message Telemetry
                </h3>
                <span className="text-xs text-stone-500 font-mono">ID: {selectedNotificationLog.messageId}</span>
              </div>
              <button onClick={() => setSelectedNotificationLog(null)} className="text-stone-400 hover:text-stone-700">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-lg font-mono">
                <div>
                  <span className="text-[10px] text-stone-400 block">Event</span>
                  <span className="font-bold text-stone-900">{selectedNotificationLog.eventKey}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block">Cost</span>
                  <span className="font-bold text-emerald-800">৳{selectedNotificationLog.costBdt.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block">Timestamp</span>
                  <span className="font-bold text-stone-900">{new Date(selectedNotificationLog.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Delivered Content</label>
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-stone-800 whitespace-pre-wrap">
                  {selectedNotificationLog.content}
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Carrier Gateway Response</label>
                <pre className="p-3 bg-stone-900 text-teal-400 font-mono text-[10px] rounded-lg overflow-x-auto">
                  {selectedNotificationLog.gatewayResponse}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Webhook Modal */}
      {showAddWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="text-base font-serif font-bold text-stone-900">Register Outbound Webhook</h3>
              <button onClick={() => setShowAddWebhookModal(false)} className="text-stone-400 hover:text-stone-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Endpoint Name / Partner</label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="e.g., Enterprise ERP Server"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Target HTTPS URL</label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://api.partner.com/webhooks"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">HMAC Secret Signing Key (Optional)</label>
                <input
                  type="text"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                  placeholder="whsec_custom_secret_key..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">Leave empty to auto-generate secure secret</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddWebhookModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black"
                >
                  Register Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Task Payload Modal */}
      {selectedJobPayload && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-mono">
                  Task Payload: {selectedJobPayload.id}
                </h3>
                <span className="text-xs text-stone-500">{selectedJobPayload.type}</span>
              </div>
              <button onClick={() => setSelectedJobPayload(null)} className="text-stone-400 hover:text-stone-700">
                ✕
              </button>
            </div>

            <div>
              <pre className="p-3 bg-stone-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto max-h-64">
                {JSON.stringify(selectedJobPayload.payload || { summary: selectedJobPayload.payloadSummary }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
