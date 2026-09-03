import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();
  const { siteContent, language, showToast } = useApp();

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Your message has been received! Our support team will call you back.');
  };

  const getPageDetails = () => {
    switch (slug) {
      case 'terms':
        return {
          title: language === 'BN' ? 'ব্যবহারের শর্তাবলী' : 'Terms & Conditions',
          content: siteContent.policies.terms,
          subtitle: 'Operational policies and contractual agreements for buying from Kisholoy.'
        };
      case 'privacy':
        return {
          title: language === 'BN' ? 'গোপনীয়তা নীতি' : 'Privacy Policy',
          content: siteContent.policies.privacy,
          subtitle: 'How customer telephone numbers, billing addresses, and order histories are safely safeguarded.'
        };
      case 'returns':
        return {
          title: language === 'BN' ? 'রিটার্ন ও রিফান্ড নীতি' : 'Returns & Refunds Policy',
          content: siteContent.policies.returns,
          subtitle: 'Easy 7-day return procedures, defective item replacements, and refund channels.'
        };
      case 'shipping':
        return {
          title: language === 'BN' ? 'ডেলিভারি তথ্য ও চার্জ' : 'Shipping & Delivery Information',
          content: siteContent.policies.shipping,
          subtitle: `Inside Dhaka: ৳${siteContent.shippingFees.insideDhaka} (24-48h) | Outside Dhaka: ৳${siteContent.shippingFees.outsideDhaka} (2-4 days). Free on orders over ৳${siteContent.shippingFees.freeShippingThreshold.toLocaleString()}.`
        };
      case 'about':
        return {
          title: language === 'BN' ? 'আমাদের সম্পর্কে' : 'About KISHOLOY (কিশলয়)',
          content: siteContent.policies.about,
          subtitle: `${siteContent.tagline} — ${siteContent.motto}`
        };
      case 'faq':
        return {
          title: language === 'BN' ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions (FAQ)',
          content: siteContent.policies.faq || 'Frequently asked questions will be published here soon.',
          subtitle: 'Answers to standard questions regarding ordering, cash on delivery, and artisan sourcing.'
        };
      case 'contact':
        return {
          title: language === 'BN' ? 'যোগাযোগ করুন' : 'Contact Support & Corporate Inquiries',
          content: 'Reach out to our customer care center directly via phone, WhatsApp, or the inquiry form below.',
          subtitle: `Hotline: ${siteContent.contact.phone} | Email: ${siteContent.contact.email}`
        };
      default:
        return {
          title: 'Information',
          content: 'Details will be updated shortly.',
          subtitle: ''
        };
    }
  };

  const { title, content, subtitle } = getPageDetails();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header Banner */}
      <div className="border-b border-stone-200 pb-8 mb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mb-3">{title}</h1>
        {subtitle && <p className="text-stone-600 text-sm leading-relaxed">{subtitle}</p>}
      </div>

      {/* Main Content Body */}
      <div className="prose prose-stone max-w-none text-sm sm:text-base leading-relaxed text-stone-700 space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs">
          <p className="whitespace-pre-line leading-relaxed">{content}</p>
        </div>

        {/* Contact Us Interactive Form */}
        {slug === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <h3 className="text-base font-serif font-bold text-stone-900">Head Office</h3>
              <div className="space-y-3 text-xs sm:text-sm text-stone-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-teal-900 mt-1 flex-shrink-0" />
                  <span>{language === 'BN' ? siteContent.contact.addressBn : siteContent.contact.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-teal-900 flex-shrink-0" />
                  <span>{siteContent.contact.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-teal-900 flex-shrink-0" />
                  <span>{siteContent.contact.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">Send a Message</h3>
              {submitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Thank you! We will get in touch shortly.
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-stone-300 rounded-lg"
                      placeholder="e.g. Shakil Ahmed"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-stone-300 rounded-lg"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">Message</label>
                    <textarea
                      rows={3}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-stone-300 rounded-lg"
                      placeholder="How can we help?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-teal-900 text-white rounded-lg text-xs font-bold hover:bg-teal-950 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
