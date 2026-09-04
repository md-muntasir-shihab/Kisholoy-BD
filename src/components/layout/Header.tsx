import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, ShieldCheck, User, Heart, LogIn, Sparkles, PhoneCall } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerAuthModal } from '../auth/CustomerAuthModal';
import { BrandLogo } from '../brand/BrandLogo';
import { LanguageButton } from './LanguageButton';
import { ThemeButton } from './ThemeButton';

export function Header() {
  const { language, cartCount, siteContent, wishlist, currentCustomerId } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'guest' | 'link_order'>('login');
  const navigate = useNavigate();
  const location = useLocation();
  const isBn = language === 'BN';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const navLinks = [
    { name: isBn ? 'হোম' : 'Home', path: '/' },
    { name: isBn ? 'সকল পণ্য' : 'Shop All', path: '/shop' },
    { name: isBn ? 'পোশাক ও শাড়ি' : 'Apparel & Sarees', path: '/category/traditional-clothing' },
    { name: isBn ? 'হস্তশিল্প ও সাজসজ্জা' : 'Handicrafts & Decor', path: '/category/handicrafts-decor' },
    { name: isBn ? 'খাঁটি খাদ্য' : 'Organic Pantry', path: '/category/organic-pantry' },
    { name: isBn ? 'অর্ডার ট্র্যাক' : 'Track Order', path: '/track-order' }
  ];

  const iconBtn =
    'relative inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-600 dark:text-slate-300 hover:text-teal-900 dark:hover:text-teal-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-all shadow-xs">
      {/* Announcement Bar from CMS */}
      {siteContent.announcementBar.enabled && (
        <div className="bg-stone-950 text-stone-200 text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-3 border-b border-stone-800">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            {isBn ? siteContent.announcementBar.textBn : siteContent.announcementBar.text}
          </span>
          {siteContent.contact?.phone && (
            <>
              <span className="hidden md:inline-block text-stone-600">|</span>
              <a
                href={`tel:${siteContent.contact.phone}`}
                className="hidden md:inline-flex items-center gap-1 text-teal-300 hover:text-teal-200 transition-colors"
              >
                <PhoneCall className="w-3 h-3" /> {siteContent.contact.phone}
              </a>
            </>
          )}
        </div>
      )}

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:gap-4">
          {/* Mobile menu toggle */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={iconBtn}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Logo & Brand Identity */}
          <div className="flex items-center flex-1 lg:flex-none">
            <BrandLogo variant="light" size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 mx-4">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative text-sm font-semibold transition-all py-1.5 px-1 ${
                    isActive
                      ? 'text-teal-900 dark:text-teal-300 font-bold'
                      : 'text-stone-600 dark:text-slate-300 hover:text-teal-900 dark:hover:text-teal-300'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-700 dark:bg-teal-400 rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Search Button & Overlay */}
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={iconBtn}
                title={isBn ? 'পণ্য খুঁজুন' : 'Search products'}
              >
                <Search className="h-5 w-5" />
              </button>

              {isSearchOpen && (
                <div className="absolute right-0 top-12 w-72 sm:w-88 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-stone-200 dark:border-slate-700 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isBn ? 'জামদানি, খাঁটি মধু, নকশিকাঁথা খুঁজুন...' : 'Search Jamdani, Honey, Tea, Pottery...'}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 dark:border-slate-600 bg-stone-50 dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-800/30 focus:border-teal-800"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-teal-900 dark:bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-950 dark:hover:bg-teal-500 shadow-xs"
                    >
                      {isBn ? 'খুঁজুন' : 'Search'}
                    </button>
                  </form>
                  <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-slate-500">
                    <span className="font-semibold">{isBn ? 'জনপ্রিয়:' : 'Popular:'}</span>
                    <button type="button" onClick={() => { setSearchQuery('Jamdani'); navigate('/shop?q=Jamdani'); setIsSearchOpen(false); }} className="hover:text-teal-900 dark:hover:text-teal-300 underline">Jamdani</button>
                    <span>•</span>
                    <button type="button" onClick={() => { setSearchQuery('Honey'); navigate('/shop?q=Honey'); setIsSearchOpen(false); }} className="hover:text-teal-900 dark:hover:text-teal-300 underline">Honey</button>
                    <span>•</span>
                    <button type="button" onClick={() => { setSearchQuery('Nakshi'); navigate('/shop?q=Nakshi'); setIsSearchOpen(false); }} className="hover:text-teal-900 dark:hover:text-teal-300 underline">Nakshi</button>
                  </div>
                </div>
              )}
            </div>

            {/* Language toggle (separate button) */}
            <LanguageButton />

            {/* Display mode toggle (separate button) */}
            <ThemeButton />

            {/* Wishlist */}
            <Link
              to="/account?tab=wishlist"
              className={`${iconBtn} hidden sm:inline-flex`}
              title={isBn ? 'উইশলিস্ট' : 'Wishlist'}
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs border-2 border-white dark:border-slate-950">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Account / Sign In */}
            <button
              onClick={() => {
                if (currentCustomerId) {
                  navigate('/account');
                } else {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }
              }}
              className={iconBtn}
              title={currentCustomerId ? (isBn ? 'আমার অ্যাকাউন্ট' : 'My Account') : (isBn ? 'সাইন ইন' : 'Sign In')}
            >
              {currentCustomerId ? <User className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
            </button>

            {/* Cart */}
            <Link to="/cart" className={iconBtn} title={isBn ? 'কার্ট' : 'Cart'}>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-teal-900 dark:bg-teal-600 text-[9px] font-bold text-white shadow-xs border-2 border-white dark:border-slate-950">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin (subtle icon) */}
            <Link
              to="/admin"
              className={`${iconBtn} hidden sm:inline-flex`}
              title="Admin Operations"
            >
              <ShieldCheck className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-950 border-b border-stone-200 dark:border-slate-800 shadow-xl px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'পণ্য খুঁজুন...' : 'Search products...'}
              className="w-full text-sm px-3 py-2 border border-stone-300 dark:border-slate-600 bg-stone-50 dark:bg-slate-800 rounded-lg focus:outline-none focus:border-teal-800"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-teal-900 dark:bg-teal-600 text-white rounded-lg text-sm font-semibold"
            >
              {isBn ? 'খুঁজুন' : 'Search'}
            </button>
          </form>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-stone-800 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 hover:text-teal-900 dark:hover:text-teal-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setAuthModalMode('login');
                setAuthModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-800 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg text-left"
            >
              <LogIn className="h-4 w-4 text-stone-500 dark:text-slate-400" />
              {isBn ? 'লগইন / রেজিস্ট্রেশন / গেস্ট অর্ডার লিংক' : 'Sign In / Register / Link Guest Order'}
            </button>
            <Link
              to="/account"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-800 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User className="h-4 w-4 text-stone-500 dark:text-slate-400" />
              {isBn ? 'আমার অ্যাকাউন্ট' : 'My Account'}
            </Link>
            <Link
              to="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-teal-900 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              {isBn ? 'অ্যাডমিন কন্ট্রোল সেন্টার' : 'Admin Control Center'}
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
