import React, { useState } from 'react';
import { Smartphone, Lock, ShieldCheck, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface BkashModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  amount: number;
  customerPhone: string;
  onSuccess: (trxId: string) => void;
  onFailure: (reason: string) => void;
}

export function BkashModal({
  isOpen,
  onClose,
  orderNumber,
  amount,
  customerPhone,
  onSuccess,
  onFailure
}: BkashModalProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'pin'>('phone');
  const [phone, setPhone] = useState(customerPhone || '01712345678');
  const [otp, setOtp] = useState('123456');
  const [pin, setPin] = useState('12345');
  const [agreed, setAgreed] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 11) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('otp');
    }, 600);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('pin');
    }, 600);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const mockTrxId = `BKTRX-${Date.now().toString(36).toUpperCase()}`;
      onSuccess(mockTrxId);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
      <div className="bg-[#E2136E] text-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#C20E5C] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-white text-[#E2136E] font-black text-sm px-2 py-0.5 rounded font-mono">bKash</span>
            <span className="text-xs font-semibold">Direct Merchant Checkout</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-pink-200 hover:text-white rounded hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount bar */}
        <div className="bg-white text-stone-900 px-4 py-3 flex justify-between items-center text-xs">
          <div>
            <span className="text-stone-500 block text-[11px]">Merchant: KISHOLOY</span>
            <span className="font-mono text-stone-700">Invoice: {orderNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-stone-500 block">Amount</span>
            <span className="font-bold font-mono text-base text-[#E2136E]">৳ {amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Your bKash Account Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full px-3 py-2.5 rounded-lg bg-white text-stone-900 text-sm font-mono tracking-wider focus:outline-none border-2 border-pink-300"
                />
              </div>

              <div className="flex items-start gap-2 text-[11px] text-pink-100">
                <input
                  type="checkbox"
                  id="bkash-terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded text-[#E2136E] focus:ring-0"
                />
                <label htmlFor="bkash-terms" className="cursor-pointer">
                  I agree to the <span className="underline font-semibold">bKash merchant terms and conditions</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!agreed || isProcessing}
                  className="flex-1 py-2.5 bg-stone-900 text-white hover:bg-black rounded-lg text-xs font-bold tracking-wider uppercase transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4 text-center">
              <p className="text-xs text-pink-100">
                Enter the 6-digit verification code sent to <strong className="text-white font-mono">{phone}</strong>
              </p>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white text-stone-900 text-center text-xl font-mono font-bold tracking-widest focus:outline-none border-2 border-pink-300"
                />
                <span className="text-[10px] text-pink-200 block mt-1">Default Sandbox OTP: 123456</span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-stone-900 text-white hover:bg-black rounded-lg text-xs font-bold tracking-wider uppercase"
                >
                  {isProcessing ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="px-3 py-2.5 bg-white/20 text-white rounded-lg text-xs"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          {step === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4 text-center">
              <p className="text-xs text-pink-100">
                Enter your bKash PIN to authorize payment of <strong className="text-white font-mono">৳ {amount}</strong>
              </p>

              <div>
                <input
                  type="password"
                  maxLength={5}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white text-stone-900 text-center text-xl font-mono font-bold tracking-widest focus:outline-none border-2 border-pink-300"
                />
                <span className="text-[10px] text-pink-200 block mt-1">Sandbox PIN: 12345</span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-stone-900 text-white hover:bg-black rounded-lg text-xs font-bold tracking-wider uppercase"
                >
                  {isProcessing ? 'Authorizing...' : 'Confirm PIN & Pay'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  className="px-3 py-2.5 bg-white/20 text-white rounded-lg text-xs"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security badge */}
        <div className="bg-[#C20E5C] py-2 px-4 text-center text-[10px] text-pink-100 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Secured by bKash Authorized Payment Gateway
        </div>
      </div>
    </div>
  );
}
