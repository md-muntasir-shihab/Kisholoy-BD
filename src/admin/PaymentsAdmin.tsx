import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, Clock, AlertCircle, ArrowUpRight, DollarSign, 
  ShieldAlert, ShieldCheck, RefreshCw, Send, Eye, FileText, ChevronRight,
  TrendingDown, Percent, Wallet, Ban, RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentTransaction, FraudRiskAssessment } from '../types';
import { AdminModalShell } from '../components/admin/AdminModalShell';

export function PaymentsAdmin() {
  const { orders, showToast, language } = useApp();
  const isBn = language === 'BN';
  const [activeTab, setActiveTab] = useState<'ledger' | 'settlement' | 'fraud' | 'ipn_tester' | 'refunds'>('ledger');
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [selectedTxPayload, setSelectedTxPayload] = useState<PaymentTransaction | null>(null);

  // IPN Simulator State
  const [ipnOrderNum, setIpnOrderNum] = useState('');
  const [ipnStatus, setIpnStatus] = useState<'VALID' | 'FAILED'>('VALID');
  const [ipnCardType, setIpnCardType] = useState('VISA-CITY-BANK');
  const [isSendingIpn, setIsSendingIpn] = useState(false);
  const [ipnResult, setIpnResult] = useState<any>(null);

  // Refund State
  const [refundOrderId, setRefundOrderId] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Customer requested cancellation & return');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Fraud Assessment State
  const [fraudAssessments, setFraudAssessments] = useState<Record<string, FraudRiskAssessment>>({});

  const fetchTransactions = async () => {
    setIsLoadingTx(true);
    try {
      const res = await fetch('/api/payments/transactions');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.transactions) {
          setTransactions(data.transactions);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Could not load payment transactions from the server.', 'info');
    } finally {
      setIsLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Compute assessments for orders on load
  useEffect(() => {
    const assessOrders = async () => {
      const map: Record<string, FraudRiskAssessment> = {};
      for (const ord of orders.slice(0, 10)) {
        try {
          const res = await fetch('/api/orders/fraud-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerPhone: ord.customer.phone,
              total: ord.total,
              paymentMethod: ord.paymentMethod,
              district: ord.shippingAddress.district
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              map[ord.id] = data.assessment;
            }
          }
        } catch {
          // Do NOT invent a score here. A locally-guessed rating ignores the
          // blacklist, velocity and history signals the engine applies, and
          // showing it as if it came from the engine is worse than showing
          // nothing. Leave the order unassessed and let the UI say so (F-303).
        }
      }
      setFraudAssessments(map);
    };

    assessOrders();
  }, [orders]);

  // Aggregate metrics
  const totalSettled = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingCod = orders
    .filter((o) => o.paymentStatus === 'UNPAID' && o.paymentMethod === 'COD')
    .reduce((sum, o) => sum + o.total, 0);

  const totalGatewayFees = transactions.reduce((sum, t) => sum + (t.feeDeducted || 0), 0);
  const totalNetDisbursed = transactions.reduce((sum, t) => sum + (t.netDisbursed || t.amount), 0);

  const handleTriggerIpn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipnOrderNum) return;
    setIsSendingIpn(true);
    setIpnResult(null);

    try {
      const res = await fetch('/api/payments/test-ipn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: ipnOrderNum.trim(),
          status: ipnStatus,
          cardType: ipnCardType
        })
      });
      const data = await res.json();
      setIpnResult(data);
      if (data.success) {
        showToast(`IPN simulated for ${ipnOrderNum}! Status verified.`);
        fetchTransactions();
      } else {
        showToast(`IPN Error: ${data.error}`, 'info');
      }
    } catch {
      showToast('Failed to trigger IPN test', 'info');
    } finally {
      setIsSendingIpn(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrderId || refundAmount <= 0) return;
    setIsProcessingRefund(true);

    try {
      const res = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: refundOrderId,
          amount: refundAmount,
          reason: refundReason
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Refund of ৳${refundAmount} processed (Ref: ${data.refundId})`);
        fetchTransactions();
        setRefundOrderId('');
        setRefundAmount(0);
      } else {
        showToast(`Refund error: ${data.error || 'Failed'}`, 'info');
      }
    } catch {
      showToast('Network error processing refund', 'info');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">{isBn ? 'পেমেন্ট ও গেটওয়ে সেটেলমেন্ট' : 'Payments & Gateway Settlements'}</h1>
          <p className="text-xs text-stone-500">
            Authoritative financial ledger, SSLCOMMERZ & bKash integrations, IPN verification webhooks, and fraud risk sentinel.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={isLoadingTx}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTx ? 'animate-spin' : ''}`} />
          <span>{isBn ? 'লেনদেন সিঙ্ক করুন' : 'Sync Transactions'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{isBn ? 'মোট নিষ্পত্তি' : 'Gross Settled'}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-800 block mt-2">৳ {totalSettled.toLocaleString()}</span>
          <span className="text-[11px] text-stone-500 block mt-1">{isBn ? 'ব্যাংক/গেটওয়ে ট্রান্সফারে যাচাইকৃত' : 'Verified via bank/gateway transfer'}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{isBn ? 'বকেয়া ক্যাশ অন ডেলিভারি' : 'Pending COD'}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-amber-800 block mt-2">৳ {pendingCod.toLocaleString()}</span>
          <span className="text-[11px] text-stone-500 block mt-1">{isBn ? 'স্টেডফাস্ট / পাঠাও এজেন্টের কাছে জমা' : 'Held by Steadfast / Pathao agents'}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{isBn ? 'গেটওয়ে ফি' : 'Gateway Fees'}</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-rose-800 block mt-2">৳ {totalGatewayFees.toLocaleString()}</span>
          <span className="text-[11px] text-stone-500 block mt-1">SSL (2.5%) & bKash (1.5%)</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{isBn ? 'নিট প্রদান' : 'Net Disbursed'}</span>
            <Wallet className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-teal-900 block mt-2">৳ {totalNetDisbursed.toLocaleString()}</span>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-1">✓ Credited to Merchant Account</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-2 sm:gap-4 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'ledger', label: 'Transactions Ledger', count: transactions.length },
          { id: 'settlement', label: 'Reconciliation & Payouts' },
          { id: 'fraud', label: 'Fraud Risk Sentinel' },
          { id: 'ipn_tester', label: 'IPN Webhook Simulator' },
          { id: 'refunds', label: 'Process Refund' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-2 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-teal-800 text-teal-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="bg-stone-100 text-stone-700 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: TRANSACTIONS LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center text-xs font-bold text-stone-700">
            <span>{isBn ? 'পেমেন্ট গেটওয়ে লেজার' : 'Authoritative Payment Gateways Ledger'}</span>
            <span className="text-stone-500 font-normal">Showing {transactions.length} recorded events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="p-3.5">{isBn ? 'অর্ডার / লেনদেন আইডি' : 'Order / Trx ID'}</th>
                  <th className="p-3.5">Gateway</th>
                  <th className="p-3.5">{isBn ? 'কার্ড / চ্যানেল' : 'Card / Channel'}</th>
                  <th className="p-3.5">{isBn ? 'মোট পরিমাণ' : 'Gross Amount'}</th>
                  <th className="p-3.5">{isBn ? 'কর্তিত ফি' : 'Fee Deducted'}</th>
                  <th className="p-3.5">{isBn ? 'নিট পরিশোধ' : 'Net Payout'}</th>
                  <th className="p-3.5">{isBn ? 'ঝুঁকির মাত্রা' : 'Risk Rating'}</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-sans">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-stone-900">{tx.orderNumber}</div>
                      <div className="font-mono text-[10px] text-stone-400">{tx.transactionId}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.gateway === 'SSLCOMMERZ' ? 'bg-teal-100 text-teal-900' :
                        tx.gateway === 'BKASH_TOKENIZED' ? 'bg-pink-100 text-pink-900' :
                        'bg-amber-100 text-amber-900'
                      }`}>
                        {tx.gateway}
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-700 font-medium">
                      {tx.cardType || 'N/A'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-stone-900">
                      ৳ {tx.amount.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-rose-700">
                      {tx.feeDeducted ? `-৳ ${tx.feeDeducted.toLocaleString()}` : '৳ 0'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-800">
                      ৳ {(tx.netDisbursed || tx.amount).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                        tx.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {tx.riskLevel || 'LOW'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.status === 'VALID' ? 'bg-emerald-100 text-emerald-900' :
                        tx.status === 'REFUNDED' ? 'bg-purple-100 text-purple-900' :
                        'bg-red-100 text-red-900'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {tx.rawIpnPayload && (
                        <button
                          onClick={() => setSelectedTxPayload(tx)}
                          className="p-1.5 text-stone-500 hover:text-teal-900 hover:bg-stone-100 rounded"
                          title="View Raw IPN Payload"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECONCILIATION & SETTLEMENT */}
      {activeTab === 'settlement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">{isBn ? 'গেটওয়ে ফি কাঠামো ও কমিশন হার' : 'Gateway Fee Structure & Commission Rates'}</h3>
              <p className="text-xs text-stone-500 mt-1">Authoritative transaction fee splits applied to bank settlements.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-teal-950">SSLCOMMERZ Visa / MasterCard / Nexus</h4>
                  <span className="text-teal-800 text-[11px]">Merchant Category Code (MCC): 5691 (Apparel & Fabric)</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-teal-900">2.50%</span>
                  <span className="block text-[10px] text-teal-700">+ ৳0 fixed per trx</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/50 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-pink-950">bKash Direct Merchant Tokenized</h4>
                  <span className="text-pink-800 text-[11px]">{isBn ? 'অ্যাগ্রিগেটর সরাসরি নিষ্পত্তি' : 'Aggregator Direct Settlement'}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-pink-900">1.50%</span>
                  <span className="block text-[10px] text-pink-700">Daily auto-sweep</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-amber-950">Cash On Delivery (Steadfast / Pathao COD Handling)</h4>
                  <span className="text-amber-800 text-[11px]">{isBn ? 'মাঠপর্যায়ে নগদ সংগ্রহের ঝুঁকি চার্জ' : 'Field cash collection risk charge'}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-amber-900">1.00%</span>
                  <span className="block text-[10px] text-amber-700">{isBn ? 'রেমিট্যান্সের সময় কর্তন' : 'Deducted at remittance'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-xs">
              <span className="text-stone-500">Next Scheduled Merchant Payout Cycle:</span>
              <span className="font-bold font-mono text-stone-800">Every Tuesday & Thursday (EFTN)</span>
            </div>
          </div>

          {/* Quick Bank Summary */}
          <div className="bg-stone-900 text-white rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-stone-100">{isBn ? 'মার্চেন্ট ব্যাংক প্রোফাইল' : 'Merchant Bank Profile'}</h3>
            <div className="space-y-3 text-xs text-stone-300">
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">{isBn ? 'সুবিধাভোগীর নাম' : 'Beneficiary Name'}</span>
                <span className="font-semibold text-white">KISHOLOY HERITAGE APPAREL LTD.</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">{isBn ? 'ব্যাংক ও শাখা' : 'Bank & Branch'}</span>
                <span className="font-semibold text-white">City Bank Ltd. (Gulshan Branch)</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">{isBn ? 'রাউটিং নম্বর' : 'Routing Number'}</span>
                <span className="font-mono text-white">225261789</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">{isBn ? 'নিষ্পত্তির মুদ্রা' : 'Settlement Currency'}</span>
                <span className="font-mono text-emerald-400 font-bold">BDT (৳)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>KYC Level 2 Verified by Bangladesh Bank</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FRAUD RISK SENTINEL */}
      {activeTab === 'fraud' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-amber-900">{isBn ? 'জালিয়াতি ও রিটার্ন পর্যবেক্ষণ' : 'Fraud & Remote Return Sentinel'}</h4>
              <p className="text-amber-800 mt-0.5">
                Evaluates high-value COD orders, historical return velocities, and remote transit routes to prevent costly courier return charges.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 bg-stone-50 font-bold text-xs text-stone-700">
              Order Risk Evaluation Matrix
            </div>

            <div className="divide-y divide-stone-200 text-xs">
              {orders.slice(0, 8).map((ord) => {
                // No fabricated default: an order the engine has not scored is
                // reported as unavailable rather than silently shown as LOW.
                const assessment = fraudAssessments[ord.id];
                const unassessed = !assessment;

                return (
                  <div key={ord.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">{ord.orderNumber}</span>
                        <span className="font-semibold text-stone-700">({ord.customer.name} - {ord.customer.phone})</span>
                        <span className="text-stone-400">•</span>
                        <span className="font-bold text-teal-950 font-mono">৳ {ord.total.toLocaleString()}</span>
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[10px] font-semibold">{ord.paymentMethod}</span>
                      </div>
                      <div className="text-stone-500 text-[11px]">
                        Destination: {ord.shippingAddress.thana}, {ord.shippingAddress.district}
                      </div>
                      {unassessed && (
                        <div className="mt-1 text-[10px] text-stone-500 bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 inline-block">
                          Risk score unavailable — engine unreachable
                        </div>
                      )}
                      {assessment && assessment.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assessment.flags.map((flag, idx) => (
                            <span key={idx} className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[10px]">
                              ⚠ {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-stone-500 block uppercase">{isBn ? 'ঝুঁকি স্কোর' : 'Risk Score'}</span>
                        <span className={`font-mono font-bold text-base ${
                          unassessed ? 'text-stone-400' :
                          assessment.riskRating === 'HIGH' ? 'text-red-700' :
                          assessment.riskRating === 'MEDIUM' ? 'text-amber-700' :
                          'text-emerald-700'
                        }`}>
                          {unassessed ? '— / 100' : `${assessment.riskScore} / 100`}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold block ${
                          unassessed ? 'bg-stone-100 text-stone-500 border border-stone-300' :
                          assessment.recommendation === 'REQUIRE_ADVANCE_SHIPPING_FEE' ? 'bg-red-100 text-red-900 border border-red-300' :
                          assessment.recommendation === 'REQUIRE_PHONE_VERIFICATION' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {unassessed ? 'NOT ASSESSED' : assessment.recommendation.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: IPN WEBHOOK SIMULATOR */}
      {activeTab === 'ipn_tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">{isBn ? 'SSLCOMMERZ IPN ওয়েবহুক ডিসপ্যাচার' : 'SSLCOMMERZ IPN Webhook Dispatcher'}</h3>
              <p className="text-xs text-stone-500 mt-1">
                Simulates real-world server-to-server Instant Payment Notification (IPN) from SSLCOMMERZ gateway.
              </p>
            </div>

            <form onSubmit={handleTriggerIpn} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">{isBn ? 'লক্ষ্য অর্ডার নম্বর' : 'Target Order Number'}</label>
                <select
                  required
                  value={ipnOrderNum}
                  onChange={(e) => setIpnOrderNum(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-mono text-xs focus:bg-white"
                >
                  <option value="">Select an order to simulate IPN...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.orderNumber}>
                      {o.orderNumber} ({o.customer.name} - ৳{o.total} - {o.paymentStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">{isBn ? 'ওয়েবহুক স্ট্যাটাস' : 'Webhook Status'}</label>
                  <select
                    value={ipnStatus}
                    onChange={(e) => setIpnStatus(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs focus:bg-white"
                  >
                    <option value="VALID">VALID (Success 200)</option>
                    <option value="FAILED">FAILED (Bank Declined)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Card / Channel</label>
                  <select
                    value={ipnCardType}
                    onChange={(e) => setIpnCardType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs focus:bg-white"
                  >
                    <option value="VISA-CITY-BANK">Visa (City Bank Gateway)</option>
                    <option value="MASTER-EBL-SKY">MasterCard (EBL Sky)</option>
                    <option value="BKASH-MSISDN">bKash Mobile Wallet</option>
                    <option value="NAGAD-PORTAL">Nagad Postal Cash</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingIpn || !ipnOrderNum}
                className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingIpn ? 'Dispatching Webhook...' : 'Fire Mock IPN Event'}</span>
              </button>
            </form>
          </div>

          <div className="bg-stone-900 text-stone-200 rounded-xl p-6 shadow-xs font-mono text-xs space-y-3">
            <div className="flex justify-between items-center text-stone-400 border-b border-stone-800 pb-2">
              <span className="font-bold text-[11px] uppercase">{isBn ? 'IPN সার্ভার লগ / রেসপন্স' : 'IPN Server Logs / Response'}</span>
              <span className="text-[10px]">Endpoint: /api/payments/test-ipn</span>
            </div>

            {ipnResult ? (
              <pre className="text-emerald-400 whitespace-pre-wrap overflow-x-auto text-[11px] max-h-80 leading-relaxed">
                {JSON.stringify(ipnResult, null, 2)}
              </pre>
            ) : (
              <div className="py-16 text-center text-stone-600 text-xs">
                Select an order and click "Fire Mock IPN Event" to view real-time server webhook payload and audit execution.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: REFUNDS */}
      {activeTab === 'refunds' && (
        <div className="max-w-xl mx-auto bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900">{isBn ? 'গেটওয়ে সরাসরি রিফান্ড শুরু করুন' : 'Initiate Gateway Direct Refund'}</h3>
            <p className="text-xs text-stone-500 mt-1">
              Refunds the customer directly to their original payment source (SSLCOMMERZ / bKash).
            </p>
          </div>

          <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">{isBn ? 'পরিশোধিত অর্ডার নির্বাচন' : 'Target Paid Order'}</label>
              <select
                required
                value={refundOrderId}
                onChange={(e) => {
                  setRefundOrderId(e.target.value);
                  const sel = orders.find(o => o.id === e.target.value);
                  if (sel) setRefundAmount(sel.total);
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs font-mono"
              >
                <option value="">Select paid order to refund...</option>
                {orders.filter(o => o.paymentStatus === 'PAID').map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} ({o.customer.name} - ৳{o.total})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Refund Amount (BDT ৳)</label>
              <input
                type="number"
                required
                min={1}
                value={refundAmount || ''}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-mono text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">{isBn ? 'রিফান্ডের কারণ' : 'Reason for Refund'}</label>
              <textarea
                required
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessingRefund || !refundOrderId || refundAmount <= 0}
              className="w-full py-3 bg-purple-800 hover:bg-purple-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isProcessingRefund ? 'Authorizing Refund with Gateway...' : `Disburse Refund of ৳${refundAmount.toLocaleString()}`}</span>
            </button>
          </form>
        </div>
      )}

      {/* Raw Payload Modal */}
      <AdminModalShell
        open={!!selectedTxPayload}
        onClose={() => setSelectedTxPayload(null)}
        label="Raw Payload Modal"
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
      >
          <div className="bg-stone-900 text-white rounded-xl shadow-2xl border border-stone-800 w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="p-4 bg-stone-800 flex justify-between items-center text-xs font-bold">
              <span>Raw IPN Gateway Data ({selectedTxPayload.orderNumber})</span>
              <button onClick={() => setSelectedTxPayload(null)} className="text-stone-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto font-mono text-[11px] text-emerald-400">
              <pre>{JSON.stringify(selectedTxPayload.rawIpnPayload, null, 2)}</pre>
            </div>
          </div>
      </AdminModalShell>
    </div>
  );
}
