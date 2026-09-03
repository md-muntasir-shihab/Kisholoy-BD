import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, HeartHandshake, Phone, Mail, MapPin, Sparkles, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../brand/BrandLogo';

export function Footer() {
  const { siteContent, language } = useApp();

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800/80 mt-auto">
      {/* Brand Value Pillars */}
      <div className="border-b border-stone-800/60 bg-stone-900/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800/50">
              <div className="p-3 rounded-xl bg-teal-950 text-teal-400 border border-teal-800/40">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {language === 'BN' ? '১০০% খাঁটি ও ঐতিহ্যবাহী' : '100% Authentic Heritage'}
                </h4>
                <p className="text-xs text-stone-400">Directly sourced from artisans</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800/50">
              <div className="p-3 rounded-xl bg-teal-950 text-teal-400 border border-teal-800/40">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {language === 'BN' ? 'সারাদেশে হোম ডেলিভারি' : 'Nationwide Delivery'}
                </h4>
                <p className="text-xs text-stone-400">Steadfast & Pathao 24-72h</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800/50">
              <div className="p-3 rounded-xl bg-teal-950 text-teal-400 border border-teal-800/40">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {language === 'BN' ? 'সহজ ৭ দিনের রিটার্ন' : 'Easy 7-Day Returns'}
                </h4>
                <p className="text-xs text-stone-400">Hassle-free guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800/50">
              <div className="p-3 rounded-xl bg-teal-950 text-teal-400 border border-teal-800/40">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {language === 'BN' ? 'নিরাপদ লেনদেন' : 'Secure Transactions'}
                </h4>
                <p className="text-xs text-stone-400">COD & SSLCOMMERZ Verified</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-10">
          <div className="md:col-span-2 space-y-4">
            <BrandLogo variant="dark" size="lg" />
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              {language === 'BN' ? siteContent.taglineBn : siteContent.tagline}
            </p>
            <div className="space-y-2.5 text-xs text-stone-400 pt-2">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>{language === 'BN' ? siteContent.contact.addressBn : siteContent.contact.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <a href={`tel:${siteContent.contact.phone}`} className="hover:text-teal-300 transition-colors">{siteContent.contact.phone}</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <a href={`mailto:${siteContent.contact.email}`} className="hover:text-teal-300 transition-colors">{siteContent.contact.email}</a>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-white text-sm tracking-wide mb-4 uppercase text-[11px] text-teal-400">
              {language === 'BN' ? 'কেনাকাটা' : 'Shop'}
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400 font-medium">
              <li><Link to="/shop" className="hover:text-teal-300 transition-colors">All Collections</Link></li>
              <li><Link to="/category/traditional-clothing" className="hover:text-teal-300 transition-colors">Traditional Clothing</Link></li>
              <li><Link to="/category/handicrafts-decor" className="hover:text-teal-300 transition-colors">Handicrafts & Decor</Link></li>
              <li><Link to="/category/organic-pantry" className="hover:text-teal-300 transition-colors">Organic Pantry</Link></li>
              <li><Link to="/category/leather-goods" className="hover:text-teal-300 transition-colors">Leather Goods</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm tracking-wide mb-4 uppercase text-[11px] text-teal-400">
              {language === 'BN' ? 'গ্রাহক সেবা' : 'Customer Care'}
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400 font-medium">
              <li><Link to="/track-order" className="hover:text-teal-300 transition-colors">Track Order Status</Link></li>
              <li><Link to="/account" className="hover:text-teal-300 transition-colors">My Customer Account</Link></li>
              <li><Link to="/pages/shipping" className="hover:text-teal-300 transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/pages/returns" className="hover:text-teal-300 transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/pages/contact" className="hover:text-teal-300 transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm tracking-wide mb-4 uppercase text-[11px] text-teal-400">
              {language === 'BN' ? 'নীতিমালা ও তথ্য' : 'Legal & Platform'}
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400 font-medium">
              <li><Link to="/pages/about" className="hover:text-teal-300 transition-colors">About KISHOLOY</Link></li>
              <li><Link to="/pages/terms" className="hover:text-teal-300 transition-colors">Terms of Service</Link></li>
              <li><Link to="/pages/privacy" className="hover:text-teal-300 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/supplier/login" className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {language === 'BN' ? 'সাপ্লায়ার পোর্টাল' : 'Supplier Portal'}</Link></li>
              <li><Link to="/admin" className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Admin Control Center</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-stone-400">
          <p>
            &copy; {new Date().getFullYear()} {siteContent.brandName}. All rights reserved. Crafted with pride in Bangladesh.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-stone-400 font-medium">
            <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800">Cash on Delivery</span>
            <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800">bKash</span>
            <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800">Nagad</span>
            <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800">SSLCOMMERZ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
