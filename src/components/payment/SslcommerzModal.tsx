import React, { useState } from 'react';
import { ShieldCheck, CreditCard, Smartphone, Building, CheckCircle2, AlertTriangle, X, Lock } from 'lucide-react';

interface SslcommerzModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  amount: number;
  customerName: string;
  onSuccess: (valId: string, cardType: string) => void;
  onFailure: (reason: string) => void;
}

export function SslcommerzModal({
  isOpen,
  onClose,
  orderNumber,
  amount,
  customerName,
  onSuccess,
  onFailure
}: SslcommerzModalProps) {
  const [activeTab, setActiveTab] = useState<'cards' | 'mobile' | 'netbank'>('mobile');
  const [selectedChannel, setSelectedChannel] = useState<string>('bKash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');

  if (!isOpen) return null;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setOtpStep(true);
      setIsProcessing(false);
    }, 800);
  };

  const handleConfirmOtp = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const mockValId = `VAL_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      onSuccess(mockValId, selectedChannel);
    }, 1000);
  };

  const handleSimulateFail = () => {
    onFailure('Transaction declined by customer bank (Insufficient balance / Card Limit)');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with SSLCOMMERZ Branding */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-4 sm:p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              SSL
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm tracking-wide">SSLCOMMERZ Gateway</h3>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-mono">SANDBOX</span>
              </div>
              <p className="text-[11px] text-stone-300 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> 256-bit Encrypted Bangladesh Payment Terminal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Info Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-5 py-3 flex justify-between items-center text-xs">
          <div>
            <span className="text-stone-500 block">Merchant: <strong className="text-stone-800">কিশলয় (KISHOLOY)</strong></span>
            <span className="text-stone-500 font-mono">Order: {orderNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-stone-500 text-[11px] block">Payable Amount</span>
            <span className="text-lg font-bold font-mono text-teal-900">৳ {amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {!otpStep ? (
            <>
              {/* Payment Category Tabs */}
              <div className="flex border-b border-stone-200 mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setActiveTab('mobile'); setSelectedChannel('bKash'); }}
                  className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors ${
                    activeTab === 'mobile'
                      ? 'border-teal-800 text-teal-900 font-bold'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> Mobile Banking
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('cards'); setSelectedChannel('Visa'); }}
                  className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors ${
                    activeTab === 'cards'
                      ? 'border-teal-800 text-teal-900 font-bold'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Cards (Visa/Master)
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('netbank'); setSelectedChannel('City Touch'); }}
                  className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors ${
                    activeTab === 'netbank'
                      ? 'border-teal-800 text-teal-900 font-bold'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Building className="w-4 h-4" /> Internet Banking
                </button>
              </div>

              {/* Mobile Banking Options */}
              {activeTab === 'mobile' && (
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  {[
                    { name: 'bKash', color: 'border-pink-500 bg-pink-50/50 text-pink-700', sub: 'Instant Wallet' },
                    { name: 'Nagad', color: 'border-orange-500 bg-orange-50/50 text-orange-700', sub: 'Postal Cash' },
                    { name: 'Rocket', color: 'border-purple-500 bg-purple-50/50 text-purple-700', sub: 'DBBL Rocket' },
                    { name: 'Upay', color: 'border-blue-500 bg-blue-50/50 text-blue-700', sub: 'UCB Upay' },
                    { name: 'TAP', color: 'border-teal-500 bg-teal-50/50 text-teal-700', sub: 'Trust Axiata' },
                    { name: 'Cellfin', color: 'border-emerald-500 bg-emerald-50/50 text-emerald-700', sub: 'IBBL Cellfin' }
                  ].map((ch) => (
                    <button
                      key={ch.name}
                      type="button"
                      onClick={() => setSelectedChannel(ch.name)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedChannel === ch.name
                          ? `${ch.color} ring-2 ring-teal-800 font-bold shadow-xs`
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <span className="font-bold text-xs block text-stone-900">{ch.name}</span>
                      <span className="text-[10px] text-stone-500">{ch.sub}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Cards Options */}
              {activeTab === 'cards' && (
                <div className="space-y-3 mb-5">
                  <div className="grid grid-cols-3 gap-2.5">
                    {['Visa', 'MasterCard', 'Amex / Nexus'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedChannel(c)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedChannel === c
                            ? 'border-teal-800 bg-teal-50/40 text-teal-900 ring-2 ring-teal-800 font-bold'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <span className="text-xs font-bold">{c}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Card Number</label>
                      <input
                        type="text"
                        disabled
                        value="4111 •••• •••• 4242"
                        className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 font-mono text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Expiry</label>
                        <input
                          type="text"
                          disabled
                          value="12 / 28"
                          className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase">CVV</label>
                        <input
                          type="password"
                          disabled
                          value="888"
                          className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Banking */}
              {activeTab === 'netbank' && (
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {['City Touch', 'BRAC Bank', 'Islami Bank Direct', 'EBL SKYBANKING', 'Standard Chartered', 'Mutual Trust Bank'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedChannel(b)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedChannel === b
                          ? 'border-teal-800 bg-teal-50/40 text-teal-900 ring-2 ring-teal-800 font-bold'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <span className="text-xs font-bold text-stone-800 block">{b}</span>
                      <span className="text-[10px] text-stone-500">Direct Portal</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  {isProcessing ? 'Connecting to Gateway...' : `Proceed to Pay ৳ ${amount.toLocaleString()}`}
                </button>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSimulateFail}
                    className="flex-1 py-2 border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-100 rounded-lg text-xs font-semibold"
                  >
                    Simulate Gateway Fail
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 border border-stone-300 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-semibold"
                  >
                    Cancel Payment
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* OTP Step */
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">2-Factor Authentication</h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Enter the 6-digit verification code sent to customer phone by {selectedChannel}.
                </p>
              </div>

              <div className="max-w-xs mx-auto">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center tracking-widest font-mono text-xl font-bold py-2 bg-stone-50 border-2 border-teal-800 rounded-xl focus:outline-none"
                />
                <span className="text-[11px] text-stone-400 block mt-1.5">Sandbox Default OTP: 123456</span>
              </div>

              <button
                type="button"
                onClick={handleConfirmOtp}
                disabled={isProcessing}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                {isProcessing ? 'Verifying with Bank...' : 'Authorize & Complete Payment'}
              </button>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="bg-stone-100 p-3 border-t border-stone-200 text-center text-[10px] text-stone-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-800" />
          PCI-DSS Level 1 Certified • Licensed by Bangladesh Bank (PSO)
        </div>
      </div>
    </div>
  );
}
