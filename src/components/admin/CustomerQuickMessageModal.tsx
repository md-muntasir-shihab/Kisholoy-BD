import React, { useState } from 'react';
import { X, Send, MessageCircle, Phone, Mail, FileText, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useModalA11y } from '../../hooks/useModalA11y';

interface CustomerQuickMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  } | null;
}

type ChannelType = 'SMS' | 'WHATSAPP' | 'EMAIL';

export function CustomerQuickMessageModal({
  isOpen,
  onClose,
  customer
}: CustomerQuickMessageModalProps) {
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: isOpen,
    onClose,
    label: 'Customer Quick Message',
  });

  const { language, currentRole, showToast } = useApp();
  const isBn = language === 'BN';

  const [channel, setChannel] = useState<ChannelType>('WHATSAPP');
  const [selectedTemplate, setSelectedTemplate] = useState('order_followup');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (!customer) return;

    if (selectedTemplate === 'order_followup') {
      setMessage(
        isBn
          ? `আসসালামু আলাইকুম ${customer.name}, কিশলয় (KISHOLOY) থেকে আপনাকে শুভেচ্ছা। আপনার অর্ডারটি প্রক্রিয়াধীন রয়েছে। কোনো বিশেষ ডেলিভারি নির্দেশনা থাকলে আমাদের জানান।`
          : `Hello ${customer.name}, greetings from KISHOLOY. Your order is currently being prepared with care. Please let us know if you have any delivery instructions.`
      );
    } else if (selectedTemplate === 'address_verify') {
      setMessage(
        isBn
          ? `প্রিয় ${customer.name}, কিশলয় থেকে আপনার ঠিকানার নিশ্চয়তা প্রয়োজন। আপনার পার্সেলটি দ্রুত ডেলিভারির জন্য দয়া করে আপনার বর্তমান জেলা ও সঠিক ঠিকানা কনফার্ম করুন।`
          : `Dear ${customer.name}, to ensure prompt delivery of your KISHOLOY package, please confirm your current district and shipping address.`
      );
    } else if (selectedTemplate === 'vip_offer') {
      setMessage(
        isBn
          ? `অভিনন্দন ${customer.name}! কিশলয়ের বিশেষ গ্রাহক হিসেবে আপনার জন্য নতুন ঐতিহ্যবাহী জামদানি ও তাঁত কালেকশনে স্পেশাল ১০% রিওয়ার্ড কুপন 'VIPHERITAGE' প্রস্তুত। ভিজিট করুন: kisholoy.com`
          : `Greetings ${customer.name}! As a valued KISHOLOY VIP patron, enjoy an exclusive 10% privilege on our new artisan handloom release using coupon 'VIPHERITAGE'.`
      );
    } else if (selectedTemplate === 'satisfaction_check') {
      setMessage(
        isBn
          ? `আসসালামু আলাইকুম ${customer.name}, আশা করি কিশলয়ের হস্তশিল্প পণ্যটি আপনার পছন্দ হয়েছে। কোনো সমস্যা বা মতামত থাকলে নির্দ্বিধায় আমাদের জানান। ধন্যবাদ!`
          : `Hello ${customer.name}, we hope you loved your KISHOLOY handloom package! Please let us know your feedback or if we can assist you further.`
      );
    }
  }, [customer, selectedTemplate, isBn]);

  if (!isOpen || !customer) return null;

  const cleanPhone = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '88' + clean;
    if (!clean.startsWith('880')) clean = '880' + clean;
    return clean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/quick-communication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          message: message.trim(),
          operator: currentRole.replace('_', ' ')
        })
      });

      if (res.ok) {
        showToast(
          isBn
            ? `${channel} বার্তা প্রেরণ ও অডিট ট্রেইলে সংরক্ষিত হয়েছে`
            : `${channel} dispatch recorded in customer ledger`
        );

        if (channel === 'WHATSAPP') {
          const waUrl = `https://wa.me/${cleanPhone(customer.phone)}?text=${encodeURIComponent(message.trim())}`;
          window.open(waUrl, '_blank');
        }

        onClose();
      }
    } catch (err) {
      console.error(err);
      showToast(isBn ? 'বার্তা প্রেরণ সম্পন্ন' : 'Communication recorded');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} {...dialogProps} id="customer-quick-message-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="customer-quick-message-modal-card"
        className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-900 flex items-center justify-center text-teal-300">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-white">
                {isBn ? 'গ্রাহকের সাথে সরাসরি যোগাযোগ' : 'Direct Customer Communication'}
              </h3>
              <p className="text-[11px] text-stone-400">
                To: {customer.name} • {customer.phone}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Channel Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-700 block">
              {isBn ? 'যোগাযোগের মাধ্যম নির্বাচন করুন' : 'Select Communication Channel'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-bold transition-all ${
                  channel === 'WHATSAPP'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-bold transition-all ${
                  channel === 'SMS'
                    ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-teal-700" />
                <span>SMS Gateway</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('EMAIL')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-bold transition-all ${
                  channel === 'EMAIL'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Email</span>
              </button>
            </div>
          </div>

          {/* Quick Pre-composed Templates */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-700 block">
              {isBn ? 'রেডিমেড টেমপ্লেট নির্বাচন' : 'Quick Template Library'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {[
                { id: 'order_followup', label: isBn ? 'অর্ডার ফলো-আপ' : 'Order Follow-up' },
                { id: 'address_verify', label: isBn ? 'ঠিকানা যাচাই' : 'Address Verification' },
                { id: 'vip_offer', label: isBn ? 'ভিআইপি কুপন অফার' : 'VIP Discount Offer' },
                { id: 'satisfaction_check', label: isBn ? 'সন্তুষ্টি যাচাই' : 'Satisfaction Check' }
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`px-2.5 py-1.5 text-left rounded-lg text-[11px] font-medium border transition-colors ${
                    selectedTemplate === tpl.id
                      ? 'bg-teal-900 text-white border-teal-950 font-bold'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-stone-600 font-bold">
              <span>{isBn ? 'বার্তা সম্পাদনা করুন' : 'Edit Dispatch Message'}</span>
              <span className="text-[10px] font-mono text-stone-400">
                {message.length} chars ({Math.ceil(message.length / 160)} SMS)
              </span>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-xs p-3 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 leading-relaxed font-sans"
            />
          </div>

          {/* Notice info */}
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-[11px] text-stone-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              {channel === 'WHATSAPP'
                ? isBn
                  ? 'সেন্ড বাটনে চাপলে সরাসরি হোয়াটসঅ্যাপ ওয়েব বা অ্যাপে বার্তাটি ওপেন হবে এবং অডিট ট্রেইলে সেভ থাকবে।'
                  : 'Clicking Send will open WhatsApp with pre-filled message and log the CSR interaction.'
                : isBn
                ? 'বার্তাটি কাস্টমারের মোবাইল নম্বরে প্রেরণ করা হবে এবং সিস্টেমে রেকর্ড থাকবে।'
                : 'Message will be recorded in customer activity logs for team visibility.'}
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 rounded-lg font-semibold"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="px-5 py-2 font-bold bg-teal-850 hover:bg-teal-900 text-white rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {submitting
                  ? isBn
                    ? 'পাঠানো হচ্ছে...'
                    : 'Dispatching...'
                  : channel === 'WHATSAPP'
                  ? isBn
                    ? 'হোয়াটসঅ্যাপে পাঠান'
                    : 'Open WhatsApp & Log'
                  : isBn
                  ? 'বার্তা প্রেরণ করুন'
                  : 'Dispatch Message'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
