import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, ShieldCheck, User, Compass, PhoneCall, Heart, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerAuthModal } from '../auth/CustomerAuthModal';

export function Header() {
  const { language, setLanguage, cartCount, siteContent, wishlist, currentCustomerId } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'guest' | 'link_order'>('login');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const navLinks = [
    { name: language === 'BN' ? 'হোম' : 'Home', path: '/' },
    { name: language === 'BN' ? 'সকল পণ্য' : 'Shop All', path: '/shop' },
    { name: language === 'BN' ? 'পোশাক' : 'Apparel', path: '/category/traditional-clothing' },
    { name: language === 'BN' ? 'হস্তশিল্প' : 'Handicrafts', path: '/category/handicrafts-decor' },
    { name: language === 'BN' ? 'অর্গানিক ফুড' : 'Organic Food', path: '/category/organic-pantry' },
    { name: language === 'BN' ? 'অর্ডার ট্র্যাক' : 'Track Order', path: '/track-order' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur-md">
      {/* Announcement Bar from CMS */}
      {siteContent.announcementBar.enabled && (
        <div className="bg-stone-900 text-stone-100 text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
          <span>
            {language === 'BN' 
              ? siteContent.announcementBar.textBn 
              : siteContent.announcementBar.text}
          </span>
          <span className="hidden md:inline-block text-stone-500">|</span>
          <span className="hidden md:inline-flex items-center gap-1 text-teal-300">
            <PhoneCall className="w-3 h-3" /> {siteContent.contact.phone}
          </span>
        </div>
      )}

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-4">
          
          {/* Mobile menu toggle */}
          <div className="flex items-center lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-stone-700 hover:text-stone-900 p-2 rounded-lg hover:bg-stone-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Logo & Brand Identity */}
          <div className="flex items-center">
            <Link to="/" className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-serif font-black text-teal-950 tracking-tight">
                {language === 'BN' ? siteContent.brandNameBn : siteContent.brandName}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-widest text-stone-500 hidden sm:block">
                {language === 'BN' ? siteContent.mottoBn : siteContent.motto}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className="text-sm font-medium text-stone-700 hover:text-teal-900 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Button & Overlay */}
            <div className="relative">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-stone-600 hover:text-teal-900 hover:bg-stone-100 rounded-lg transition-colors"
                title="Search products"
              >
                <Search className="h-5 w-5" />
              </button>

              {isSearchOpen && (
                <div className="absolute right-0 top-12 w-72 sm:w-80 bg-white p-3 rounded-xl border border-stone-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === 'BN' ? 'পণ্য খুঁজুন...' : 'Search Jamdani, Honey, Tea...'}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-teal-900 text-white rounded-lg text-xs font-semibold hover:bg-teal-950"
                    >
                      {language === 'BN' ? 'খুঁজুন' : 'Search'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <button 
              onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-800 transition-colors"
              title="Toggle Language"
            >
              <Compass className="w-3.5 h-3.5 text-stone-600" />
              <span>{language === 'EN' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Wishlist Link & Badge */}
            <Link
              to="/account?tab=wishlist"
              className="relative p-2 text-stone-600 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors hidden sm:inline-flex"
              title={language === 'BN' ? 'উইশলিস্ট' : 'Wishlist'}
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs border-2 border-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Customer Account & Sign In */}
            <div className="hidden sm:flex items-center">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                className="p-2 text-stone-600 hover:text-teal-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Customer Sign In & Profile"
              >
                <User className="h-5 w-5" />
                <span className="hidden xl:inline">
                  {currentCustomerId ? (language === 'BN' ? 'আমার একাউন্ট' : 'Account') : (language === 'BN' ? 'সাইন ইন' : 'Sign In')}
                </span>
              </button>
            </div>

            {/* Cart Icon & Badge */}
            <Link 
              to="/cart" 
              className="relative p-2 text-stone-700 hover:text-teal-900 hover:bg-stone-100 rounded-lg transition-colors"
              title="View Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-teal-900 text-[10px] font-bold text-white shadow-xs border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin Control Center Shortcut */}
            <Link 
              to="/admin" 
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold shadow-xs transition-colors"
              title="Enter Admin Operations"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden md:inline">Admin UI</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 shadow-xl px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'BN' ? 'পণ্য খুঁজুন...' : 'Search products...'}
              className="w-full text-sm px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-teal-900 text-white rounded-lg text-sm font-semibold"
            >
              {language === 'BN' ? 'খুঁজুন' : 'Search'}
            </button>
          </form>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-stone-800 hover:bg-stone-100 hover:text-teal-900"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setAuthModalMode('login');
                setAuthModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 rounded-lg text-left"
            >
              <LogIn className="h-4 w-4 text-stone-500" />
              {language === 'BN' ? 'লগইন / রেজিস্ট্রেশন / গেস্ট অর্ডার লিংক' : 'Sign In / Register / Link Guest Order'}
            </button>
            <Link
              to="/account"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User className="h-4 w-4 text-stone-500" />
              {language === 'BN' ? 'আমার অ্যাকাউন্ট' : 'My Account'}
            </Link>
            <Link
              to="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-teal-900 bg-teal-50 border border-teal-200 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              {language === 'BN' ? 'অ্যাডমিন কন্ট্রোল সেন্টার' : 'Admin Control Center'}
            </Link>
          </div>
        </div>
      )}

      {/* Customer Identity, Registration, & Guest Order Linking Modal */}
      <CustomerAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </header>
  );
}
