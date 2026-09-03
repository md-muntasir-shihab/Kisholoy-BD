import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, HeartHandshake, Phone, Mail, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Footer() {
  const { siteContent, language } = useApp();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 mt-auto">
      {/* Brand Value Pillars */}
      <div className="border-b border-stone-800 bg-stone-950/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-stone-800 text-teal-400">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {language === 'BN' ? '১০০% খাঁটি ও ঐতিহ্যবাহী' : '100% Authentic Heritage'}
                </h4>
                <p className="text-xs text-stone-400">Directly sourced from artisans</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-stone-800 text-teal-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {language === 'BN' ? 'সারাদেশে হোম ডেলিভারি' : 'Nationwide Delivery'}
                </h4>
                <p className="text-xs text-stone-400">Steadfast & Pathao 24-72h</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-stone-800 text-teal-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {language === 'BN' ? 'সহজ ৭ দিনের রিটার্ন' : 'Easy 7-Day Returns'}
                </h4>
                <p className="text-xs text-stone-400">Hassle-free guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-stone-800 text-teal-400">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link to="/" className="text-2xl font-serif font-bold text-white tracking-tight mb-2 inline-block">
              {language === 'BN' ? siteContent.brandNameBn : siteContent.brandName}
            </Link>
            <p className="text-stone-400 text-xs sm:text-sm mb-4 leading-relaxed max-w-sm">
              {language === 'BN' ? siteContent.taglineBn : siteContent.tagline}
            </p>
            <div className="space-y-2 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                <span>{language === 'BN' ? siteContent.contact.addressBn : siteContent.contact.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                <span>{siteContent.contact.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                <span>{siteContent.contact.email}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">
              {language === 'BN' ? 'কেনাকাটা' : 'Shop'}
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400 font-medium">
              <li><Link to="/shop" className="hover:text-teal-400 transition-colors">All Products</Link></li>
              <li><Link to="/category/traditional-clothing" className="hover:text-teal-400 transition-colors">Traditional Clothing</Link></li>
              <li><Link to="/category/handicrafts-decor" className="hover:text-teal-400 transition-colors">Handicrafts & Decor</Link></li>
              <li><Link to="/category/organic-pantry" className="hover:text-teal-400 transition-colors">Organic Pantry</Link></li>
              <li><Link to="/category/leather-goods" className="hover:text-teal-400 transition-colors">Leather Goods</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4">
              {language === 'BN' ? 'গ্রাহক সেবা' : 'Customer Care'}
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400 font-medium">
              <li><Link to="/track-order" className="hover:text-teal-400 transition-colors">Track Order</Link></li>
              <li><Link to="/account" className="hover:text-teal-400 transition-colors">My Account</Link></li>
              <li><Link to="/pages/shipping" className="hover:text-teal-400 transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/pages/returns" className="hover:text-teal-400 transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/pages/contact" className="hover:text-teal-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-4">
              {language === 'BN' ? 'নীতিমালা ও তথ্য' : 'Legal & Policy'}
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400 font-medium">
              <li><Link to="/pages/about" className="hover:text-teal-400 transition-colors">About KISHOLOY</Link></li>
              <li><Link to="/pages/terms" className="hover:text-teal-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/pages/privacy" className="hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/admin" className="text-teal-400 hover:underline">Admin Control Center</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-stone-500">
          <p>
            &copy; {new Date().getFullYear()} {siteContent.brandName}. All rights reserved. Made in Bangladesh.
          </p>
          <div className="flex items-center gap-3 text-stone-400">
            <span>Cash on Delivery</span>
            <span>•</span>
            <span>bKash</span>
            <span>•</span>
            <span>Nagad</span>
            <span>•</span>
            <span>SSLCOMMERZ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
