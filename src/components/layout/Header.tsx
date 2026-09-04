import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, ShieldCheck, User, Compass, PhoneCall, Heart, LogIn, Sparkles, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerAuthModal } from '../auth/CustomerAuthModal';
import { BrandLogo } from '../brand/BrandLogo';

export function Header() {
  const { language, setLanguage, cartCount, siteContent, wishlist, currentCustomerId, isDarkMode, toggleDarkMode } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'guest' | 'link_order'>('login');
  const navigate = useNavigate();
  const location = useLocation();

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
    { name: language === 'BN' ? 'পোশাক ও শাড়ি' : 'Apparel & Sarees', path: '/category/traditional-clothing' },
    { name: language === 'BN' ? 'হস্তশিল্প ও সাজসজ্জা' : 'Handicrafts & Decor', path: '/category/handicrafts-decor' },
    { name: language === 'BN' ? 'খাঁটি খাদ্য' : 'Organic Pantry', path: '/category/organic-pantry' },
    { name: language === 'BN' ? 'অর্ডার ট্র্যাক' : 'Track Order', path: '/track-order' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/95 backdrop-blur-md transition-all shadow-xs">
      {/* Announcement Bar from CMS */}
      {siteContent.announcementBar.enabled && (
        <div className="bg-stone-950 text-stone-200 text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-3 border-b border-stone-800">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            {language === 'BN' 
              ? siteContent.announcementBar.textBn 
              : siteContent.announcementBar.text}
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
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Mobile menu toggle */}
          <div className="flex items-center lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-stone-700 hover:text-stone-900 p-2.5 rounded-xl hover:bg-stone-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Logo & Brand Identity */}
          <div className="flex items-center">
            <BrandLogo variant="light" size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  className={`text-sm font-semibold transition-all py-1.5 px-1 relative ${
                    isActive 
                      ? 'text-teal-950 font-bold' 
                      : 'text-stone-600 hover:text-teal-900'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-800 rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* Search Button & Overlay */}
            <div className="relative">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2.5 text-stone-600 hover:text-teal-900 hover:bg-stone-100 rounded-xl transition-colors"
                title="Search products"
              >
                <Search className="h-5 w-5" />
              </button>

              {isSearchOpen && (
                <div className="absolute right-0 top-14 w-72 sm:w-88 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === 'BN' ? 'জামদানি, খাঁটি মধু, নকশিকাঁথা খুঁজুন...' : 'Search Jamdani, Honey, Tea, Pottery...'}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-800/30 focus:border-teal-800"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-teal-900 text-white rounded-xl text-xs font-semibold hover:bg-teal-950 shadow-xs"
                    >
                      {language === 'BN' ? 'খুঁজুন' : 'Search'}
                    </button>
                  </form>
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center gap-1.5 text-[11px] text-stone-400">
                    <span className="font-semibold">{language === 'BN' ? 'জনপ্রিয়:' : 'Popular:'}</span>
                    <button type="button" onClick={() => { setSearchQuery('Jamdani'); navigate('/shop?q=Jamdani'); setIsSearchOpen(false); }} className="hover:text-teal-900 underline">Jamdani</button>
                    <span>•</span>
                    <button type="button" onClick={() => { setSearchQuery('Honey'); navigate('/shop?q=Honey'); setIsSearchOpen(false); }} className="hover:text-teal-900 underline">Honey</button>
                    <span>•</span>
                    <button type="button" onClick={() => { setSearchQuery('Nakshi'); navigate('/shop?q=Nakshi'); setIsSearchOpen(false); }} className="hover:text-teal-900 underline">Nakshi</button>
                  </div>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <button 
              onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-800 transition-colors shadow-2xs"
              title="Toggle Language"
            >
              <Compass className="w-3.5 h-3.5 text-teal-800" />
              <span>{language === 'EN' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Day / Dark Mode Switcher */}
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 transition-colors shadow-2xs"
              title={isDarkMode ? 'Light / Day Mode' : 'Dark Mode'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{language === 'BN' ? 'দিন' : 'Day'}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">{language === 'BN' ? 'রাত' : 'Dark'}</span>
                </>
              )}
            </button>

            {/* Wishlist Link & Badge */}
            <Link
              to="/account?tab=wishlist"
              className="relative p-2.5 text-stone-600 hover:text-rose-600 hover:bg-stone-100 rounded-xl transition-colors hidden sm:inline-flex"
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
                  if (currentCustomerId) {
                    navigate('/account');
                  } else {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  currentCustomerId 
                    ? 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100' 
                    : 'border-teal-900/20 bg-teal-50 text-teal-950 hover:bg-teal-100/70'
                }`}
              >
                {currentCustomerId ? (
                  <>
                    <User className="h-3.5 w-3.5 text-teal-800" />
                    <span>{language === 'BN' ? 'অ্যাকাউন্ট' : 'Account'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-3.5 w-3.5 text-teal-800" />
                    <span>{language === 'BN' ? 'লগইন' : 'Sign In'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Cart Icon & Badge */}
            <Link 
              to="/cart" 
              className="relative p-2.5 text-stone-700 hover:text-teal-900 hover:bg-stone-100 rounded-xl transition-colors"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold shadow-xs transition-colors"
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
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg w-full"
            >
              <div className="flex items-center gap-2">
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-600" />}
                <span>{isDarkMode ? (language === 'BN' ? 'ডে মোড চালু করুন' : 'Switch to Day Light Mode') : (language === 'BN' ? 'ডার্ক মোড চালু করুন' : 'Switch to Dark Mode')}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-white text-stone-700 font-mono">{isDarkMode ? 'DARK' : 'LIGHT'}</span>
            </button>
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
