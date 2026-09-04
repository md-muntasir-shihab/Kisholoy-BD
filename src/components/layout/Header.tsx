import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  ShieldCheck,
  User,
  Heart,
  LogIn,
  Sparkles,
  PhoneCall,
  ChevronRight,
  ChevronDown,
  Package,
  Layers,
  Sparkle,
  Truck,
  ArrowRight,
  Languages,
  LogOut,
  Settings,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerAuthModal } from '../auth/CustomerAuthModal';
import { BrandLogo } from '../brand/BrandLogo';
import { ThemeButton } from './ThemeButton';

export function Header() {
  const { 
    language, 
    setLanguage, 
    cartCount, 
    siteContent, 
    wishlist, 
    currentCustomerId, 
    customerProfile, 
    logoutCustomer,
    theme,
    setTheme
  } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesAccordionOpen, setIsCategoriesAccordionOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'guest' | 'link_order'>('login');
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isBn = language === 'BN';

  // Close menus on route change
  useEffect(() => {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Click outside to close account menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    if (isAccountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountMenuOpen]);

  // Keyboard shortcut (⌘K / Ctrl+K) to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false);
        setIsAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleQuickSearch = (term: string) => {
    navigate(`/shop?q=${encodeURIComponent(term)}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const navLinks = [
    { name: isBn ? 'হোম' : 'Home', path: '/' },
    { name: isBn ? 'সকল পণ্য' : 'Shop All', path: '/shop' },
    { name: isBn ? 'পোশাক ও শাড়ি' : 'Apparel & Sarees', path: '/category/traditional-clothing' },
    { name: isBn ? 'হস্তশিল্প ও সাজসজ্জা' : 'Handicrafts & Decor', path: '/category/handicrafts-decor' },
    { name: isBn ? 'খাঁটি খাদ্য' : 'Organic Pantry', path: '/category/organic-pantry' }
  ];

  const popularSearches = isBn
    ? ['জামদানি শাড়ি', 'সুন্দরবনের মধু', 'নকশিকাঁথা', 'রাজশাহী সিল্ক', 'পিতলের সামগ্রী']
    : ['Jamdani Saree', 'Sundarban Honey', 'Nakshi Kantha', 'Rajshahi Silk', 'Brass Decor'];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-all duration-300 shadow-2xs">
        {/* Announcement Bar */}
        {siteContent.announcementBar.enabled && !announcementDismissed && (
          <div className="bg-stone-950/90 dark:bg-slate-900/90 text-stone-200 text-xs py-2 px-4 border-b border-stone-800/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center justify-center gap-2 text-center text-[11px] sm:text-xs font-medium tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
                <span>{isBn ? siteContent.announcementBar.textBn : siteContent.announcementBar.text}</span>
              </div>

              <div className="hidden md:flex items-center gap-3 text-[11px]">
                {siteContent.contact?.phone && (
                  <a
                    href={`tel:${siteContent.contact.phone}`}
                    className="inline-flex items-center gap-1.5 text-teal-300 hover:text-teal-200 transition-colors font-mono"
                  >
                    <PhoneCall className="w-3 h-3 text-teal-400" />
                    <span>{siteContent.contact.phone}</span>
                  </a>
                )}
                <button
                  onClick={() => setAnnouncementDismissed(true)}
                  aria-label="Dismiss banner"
                  className="text-stone-400 hover:text-stone-200 p-0.5 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Header Grid Container */}
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20 gap-2 sm:gap-4 lg:gap-6 w-full">
            
            {/* Left Column (Logo & Mobile Menu) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`xl:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md active:scale-95 transition-all shadow-2xs shrink-0 ${
                  isMobileMenuOpen
                    ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 ring-2 ring-teal-700/20'
                    : 'border-stone-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 text-stone-700 dark:text-slate-200 hover:text-teal-900 dark:hover:text-teal-300'
                }`}
                aria-label={isMobileMenuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              <div className="flex items-center shrink-0 min-w-0">
                <BrandLogo
                  variant="light"
                  size="md"
                  showTagline={false}
                />
              </div>
            </div>

            {/* Center Column (Navigation Menu) */}
            <div className="hidden xl:flex items-center justify-center min-w-0 flex-1 px-1 sm:px-2 lg:px-4">
              <nav className="flex items-center gap-1 min-w-0">
                <div className="flex items-center gap-0.5 2xl:gap-1 p-1 rounded-full bg-stone-100/70 dark:bg-slate-900/70 border border-stone-200/70 dark:border-slate-800/70 backdrop-blur-md shadow-2xs">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`whitespace-nowrap px-3 2xl:px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-normal transition-all duration-200 ${
                          isActive
                            ? 'bg-white dark:bg-slate-800 text-teal-950 dark:text-teal-300 font-bold shadow-xs border border-stone-200/80 dark:border-slate-700/80'
                            : 'text-stone-600 dark:text-slate-300 hover:text-teal-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>

            {/* Right Column (Actions, Utilities: Search, Theme, Account, Cart) */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 shrink-0">
              {/* Search Trigger Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md text-stone-700 dark:text-slate-200 hover:text-teal-900 dark:hover:text-teal-300 hover:border-teal-700/60 active:scale-95 transition-all shadow-2xs"
                aria-label="Search"
                title={isBn ? 'পণ্য অনুসন্ধান (⌘K)' : 'Search products (⌘K)'}
              >
                <Search className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              </button>

              {/* Display Mode Switcher (Desktop/Tablet) */}
              <div className="hidden sm:inline-flex">
                <ThemeButton />
              </div>

              {/* User Account with Interactive Dropdown (Desktop/Tablet) */}
              <div className="hidden sm:inline-flex relative" ref={accountMenuRef}>
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className={`inline-flex h-9 px-2 sm:px-3 items-center justify-center gap-1.5 rounded-full border backdrop-blur-md text-xs font-semibold shadow-2xs active:scale-95 transition-all ${
                    isAccountMenuOpen
                      ? 'border-teal-700 bg-teal-50/80 dark:bg-teal-950/50 text-teal-900 dark:text-teal-300'
                      : 'border-stone-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 text-stone-800 dark:text-slate-200 hover:border-teal-700/60 hover:text-teal-900 dark:hover:text-teal-300'
                  }`}
                  aria-expanded={isAccountMenuOpen}
                  title={isBn ? 'ইউজার অ্যাকাউন্ট ও সেবা' : 'User Account & Services'}
                >
                  <User className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                  <span className="hidden sm:inline">
                    {currentCustomerId
                      ? (customerProfile?.name ? customerProfile.name.split(' ')[0] : (isBn ? 'প্রোফাইল' : 'Profile'))
                      : (isBn ? 'অ্যাকাউন্ট' : 'Account')}
                  </span>
                  {wishlist.length > 0 && (
                    <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180 text-teal-700 dark:text-teal-400' : ''}`} />
                </button>

                {/* User Account Dropdown Menu */}
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                    {/* Header: Customer Info or Guest Welcome */}
                    {currentCustomerId ? (
                      <div className="p-3 bg-stone-50/80 dark:bg-slate-800/80 rounded-xl border border-stone-200/60 dark:border-slate-700/60 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-900 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                            {customerProfile?.name ? customerProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'KH'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-stone-900 dark:text-white truncate block">
                                {customerProfile?.name || 'Customer Account'}
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-500 dark:text-slate-400 truncate block">
                              {customerProfile?.phone || customerProfile?.email || 'Active Member'}
                            </span>
                          </div>
                          <Link
                            to="/account?tab=profile"
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            title={isBn ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}
                          >
                            <Settings className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-stone-50/80 dark:bg-slate-800/80 rounded-xl border border-stone-200/60 dark:border-slate-700/60 mb-2">
                        <div className="text-xs font-bold text-stone-900 dark:text-white mb-1">
                          {isBn ? 'স্বাগতম কিশলয়ে!' : 'Welcome to KISHOLOY!'}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 mb-2.5 leading-snug">
                          {isBn ? 'অর্ডার ট্র্যাকিং ও ফেভারিট আইটেম সেভ করতে সাইন ইন করুন।' : 'Sign in to track orders and access your favorite items.'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setIsAccountMenuOpen(false);
                              setAuthModalMode('login');
                              setAuthModalOpen(true);
                            }}
                            className="flex-1 py-1.5 px-3 bg-teal-900 hover:bg-teal-950 text-white rounded-lg text-xs font-semibold text-center transition-colors shadow-2xs"
                          >
                            {isBn ? 'লগইন' : 'Sign In'}
                          </button>
                          <button
                            onClick={() => {
                              setIsAccountMenuOpen(false);
                              setAuthModalMode('register');
                              setAuthModalOpen(true);
                            }}
                            className="flex-1 py-1.5 px-3 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 rounded-lg text-xs font-semibold text-center transition-colors"
                          >
                            {isBn ? 'রেজিস্টার' : 'Register'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Features Moved Inside User Account */}
                    <div className="space-y-1">
                      {/* 1. Track Order (অর্ডার ট্র্যাক) */}
                      <Link
                        to="/track-order"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-slate-200 hover:bg-teal-50/80 dark:hover:bg-teal-950/40 hover:text-teal-950 dark:hover:text-teal-300 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/60 transition-colors">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold block text-stone-900 dark:text-slate-100">
                              {isBn ? 'অর্ডার ট্র্যাক' : 'Track Order'}
                            </span>
                            <span className="text-[10px] text-stone-400 dark:text-slate-500">
                              {isBn ? 'পার্সেল ও কুরিয়ার লাইভ স্ট্যাটাস' : 'Live parcel & courier status'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      {/* 2. Favorite Items / Wishlist (ফেভারিট আইটেম) */}
                      <Link
                        to="/account?tab=wishlist"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-slate-200 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 hover:text-rose-900 dark:hover:text-rose-300 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60 transition-colors">
                            <Heart className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold block text-stone-900 dark:text-slate-100">
                              {isBn ? 'ফেভারিট আইটেম' : 'Favorite Items'}
                            </span>
                            <span className="text-[10px] text-stone-400 dark:text-slate-500">
                              {isBn ? 'সংরক্ষিত পছন্দের তালিকা' : 'Saved wishlist items'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {wishlist.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-2xs">
                              {wishlist.length}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>

                      {/* 3. Language Settings (ল্যাঙ্গুয়েজ সেটিংস) */}
                      <div className="px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-50/80 dark:hover:bg-slate-800/60 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                              <Languages className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                            </div>
                            <div>
                              <span className="font-semibold block text-stone-900 dark:text-slate-100">
                                {isBn ? 'ল্যাঙ্গুয়েজ সেটিংস' : 'Language Settings'}
                              </span>
                              <span className="text-[10px] text-stone-400 dark:text-slate-500">
                                {isBn ? 'ভাষা পরিবর্তন করুন' : 'Change interface language'}
                              </span>
                            </div>
                          </div>

                          {/* Language Switcher Buttons */}
                          <div className="inline-flex p-0.5 rounded-lg bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLanguage('BN');
                              }}
                              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                                language === 'BN'
                                  ? 'bg-teal-900 text-white shadow-2xs'
                                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                              }`}
                            >
                              বাংলা
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLanguage('EN');
                              }}
                              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                                language === 'EN'
                                  ? 'bg-teal-900 text-white shadow-2xs'
                                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                              }`}
                            >
                              EN
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Account Options */}
                    <div className="my-1.5 border-t border-stone-100 dark:border-slate-800 pt-1 space-y-0.5">
                      <Link
                        to="/account?tab=orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Package className="w-3.5 h-3.5 text-stone-500" />
                          <span>{isBn ? 'আমার অর্ডারসমূহ' : 'My Orders'}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </Link>

                      <Link
                        to="/account?tab=profile"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <User className="w-3.5 h-3.5 text-stone-500" />
                          <span>{isBn ? 'অ্যাকাউন্ট ড্যাশবোর্ড' : 'Account Dashboard'}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </Link>
                    </div>

                    {/* Sign Out (for logged-in customers) */}
                    {currentCustomerId && (
                      <div className="pt-1 border-t border-stone-100 dark:border-slate-800 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            logoutCustomer();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{isBn ? 'সাইন আউট করুন' : 'Sign Out'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Conversion Button (Highlighted Luxury Pill) */}
              <Link
                to="/cart"
                className="inline-flex h-9 px-3 sm:px-3.5 items-center justify-center gap-2 rounded-full bg-teal-900 hover:bg-teal-950 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex-shrink-0"
                title={isBn ? 'শপিং ব্যাগ' : 'Shopping Cart'}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isBn ? 'কার্ট' : 'Cart'}</span>
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-stone-950 text-[10px] font-extrabold flex items-center justify-center shadow-2xs">
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Global Interactive Search Modal / Command Palette */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm"
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input Bar */}
              <form onSubmit={handleSearch} className="relative flex items-center border-b border-stone-200 dark:border-slate-800 p-4 sm:p-5">
                <Search className="w-5 h-5 text-teal-700 dark:text-teal-400 mr-3 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isBn
                      ? 'জামদানি, নকশিকাঁথা, সুন্দরবনের মধু, তসর সিল্ক খুঁজুন...'
                      : 'Search Jamdani sarees, Nakshi Kantha, Honey, Silk, Pottery...'
                  }
                  className="w-full text-sm sm:text-base bg-transparent border-0 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 mr-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-900 hover:bg-teal-950 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-xs flex-shrink-0"
                >
                  {isBn ? 'খুঁজুন' : 'Search'}
                </button>
              </form>

              {/* Suggestions & Quick Links */}
              <div className="p-4 sm:p-6 space-y-4 bg-stone-50/50 dark:bg-slate-900/50">
                <div>
                  <span className="text-[11px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider block mb-2.5">
                    {isBn ? 'জনপ্রিয় অনুসন্ধান' : 'Popular Searches'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleQuickSearch(term)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:border-teal-700 dark:hover:border-teal-500 hover:text-teal-900 dark:hover:text-teal-300 transition-colors shadow-2xs"
                      >
                        <Sparkle className="w-3 h-3 text-amber-500" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Categories */}
                <div className="pt-3 border-t border-stone-200/70 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider block mb-2.5">
                    {isBn ? 'প্রধান ক্যাটাগরি' : 'Top Categories'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Link
                      to="/category/traditional-clothing"
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 hover:border-teal-700 text-xs text-stone-800 dark:text-slate-200 font-medium transition-all group"
                    >
                      <span>{isBn ? 'পোশাক ও শাড়ি' : 'Traditional Clothing'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-teal-700 transition-colors" />
                    </Link>
                    <Link
                      to="/category/handicrafts-decor"
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 hover:border-teal-700 text-xs text-stone-800 dark:text-slate-200 font-medium transition-all group"
                    >
                      <span>{isBn ? 'হস্তশিল্প ও সাজসজ্জা' : 'Handicrafts & Decor'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-teal-700 transition-colors" />
                    </Link>
                    <Link
                      to="/category/organic-pantry"
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 hover:border-teal-700 text-xs text-stone-800 dark:text-slate-200 font-medium transition-all group"
                    >
                      <span>{isBn ? 'খাঁটি অর্গানিক খাদ্য' : 'Organic Pantry'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-teal-700 transition-colors" />
                    </Link>
                  </div>
                </div>

                {/* Close helper hint */}
                <div className="flex items-center justify-between pt-2 text-[11px] text-stone-400 dark:text-slate-500">
                  <span>{isBn ? 'অনুসন্ধান করতে এন্টার চাপুন' : 'Press Enter to search'}</span>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="hover:text-stone-700 dark:hover:text-stone-300 underline"
                  >
                    {isBn ? 'বন্ধ করুন (ESC)' : 'Close (ESC)'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Top-Down Dropdown Menu (মোবাইলের ড্রপ ডাউন মেনু) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-x-0 top-16 sm:top-18 lg:top-20 bottom-0 z-40 xl:hidden flex flex-col">
            {/* Backdrop overlay */}
            <motion.div
              key="mobile-dropdown-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown Card unfolding downwards from the header */}
            <motion.div
              key="mobile-dropdown-panel"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-h-[calc(100vh-4.5rem)] overflow-y-auto bg-white/98 dark:bg-slate-950/98 backdrop-blur-2xl border-b border-stone-200 dark:border-slate-800 shadow-2xl flex flex-col divide-y divide-stone-100 dark:divide-slate-800"
            >
              {/* 1. Mobile Quick Search */}
              <div className="p-3.5 sm:p-4 bg-stone-50/70 dark:bg-slate-900/60">
                <form
                  onSubmit={(e) => {
                    handleSearch(e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isBn ? 'পণ্য, ক্যাটাগরি বা উপকরণ খুঁজুন...' : 'Search products, categories...'}
                      className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-teal-900 dark:bg-teal-600 hover:bg-teal-950 dark:hover:bg-teal-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-xs shrink-0"
                  >
                    {isBn ? 'খুঁজুন' : 'Search'}
                  </button>
                </form>

                {/* Popular Searches */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider mr-1">
                    {isBn ? 'জনপ্রিয়:' : 'Popular:'}
                  </span>
                  {popularSearches.slice(0, 4).map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        handleQuickSearch(term);
                        setIsMobileMenuOpen(false);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:text-teal-900 hover:border-teal-700 transition-colors shadow-2xs"
                    >
                      <Sparkle className="w-2.5 h-2.5 text-amber-500" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Main Navigation & Categories Accordion Dropdown */}
              <div className="p-3.5 sm:p-4 space-y-1">
                <div className="text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider px-3 block mb-1">
                  {isBn ? 'নেভিগেশন ও ক্যাটাগরি' : 'Navigation & Categories'}
                </div>

                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    location.pathname === '/'
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-300'
                      : 'text-stone-800 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span>{isBn ? 'হোম' : 'Home'}</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </Link>

                <Link
                  to="/shop"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    location.pathname === '/shop'
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-300'
                      : 'text-stone-800 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span>{isBn ? 'সকল পণ্য' : 'All Products'}</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </Link>

                {/* Categories Dropdown Accordion */}
                <div className="rounded-xl border border-stone-200/70 dark:border-slate-800 overflow-hidden bg-stone-50/50 dark:bg-slate-900/40">
                  <button
                    type="button"
                    onClick={() => setIsCategoriesAccordionOpen(!isCategoriesAccordionOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-stone-800 dark:text-slate-200 hover:bg-stone-100/70 dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      <span>{isBn ? 'ক্যাটাগরি সমূহ (ড্রপ ডাউন)' : 'Product Categories (Dropdown)'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isCategoriesAccordionOpen ? 'rotate-180 text-teal-700 dark:text-teal-400' : ''}`} />
                  </button>

                  {isCategoriesAccordionOpen && (
                    <div className="p-2 pt-0 space-y-1 border-t border-stone-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950">
                      <Link
                        to="/category/traditional-clothing"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-950 dark:hover:text-teal-300 transition-colors"
                      >
                        <span>{isBn ? 'ঐতিহ্যবাহী পোশাক ও শাড়ি' : 'Traditional Clothing & Sarees'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </Link>
                      <Link
                        to="/category/handicrafts-decor"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-950 dark:hover:text-teal-300 transition-colors"
                      >
                        <span>{isBn ? 'হস্তশিল্প ও গৃহসজ্জা' : 'Handicrafts & Home Decor'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </Link>
                      <Link
                        to="/category/organic-pantry"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-950 dark:hover:text-teal-300 transition-colors"
                      >
                        <span>{isBn ? 'খাঁটি অর্গানিক খাদ্য' : 'Pure Organic Pantry'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Account & Orders Section */}
              <div className="p-3.5 sm:p-4 space-y-2.5 bg-stone-50/40 dark:bg-slate-900/30">
                <div className="text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider px-3 block mb-1">
                  {isBn ? 'ইউজার অ্যাকাউন্ট ও সেবা' : 'Account & Services'}
                </div>

                {currentCustomerId ? (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-900 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        {customerProfile?.name ? customerProfile.name.slice(0, 2).toUpperCase() : 'KH'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                          {customerProfile?.name || 'Customer Account'}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                          {customerProfile?.phone || customerProfile?.email || 'Active Member'}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 dark:border-slate-800">
                      <Link
                        to="/account?tab=orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200 text-xs font-semibold hover:bg-teal-50 hover:text-teal-900 transition-colors"
                      >
                        <Package className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                        <span>{isBn ? 'অর্ডারসমূহ' : 'My Orders'}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logoutCustomer();
                        }}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{isBn ? 'সাইন আউট' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setAuthModalMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-900 hover:bg-teal-950 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isBn ? 'কাস্টমার লগইন / সাইন আপ' : 'Sign In / Register'}</span>
                  </button>
                )}

                {/* Track Order & Wishlist Quick Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/track-order"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-700/80 text-xs font-semibold text-stone-700 dark:text-slate-200 hover:border-teal-700 transition-colors"
                  >
                    <Truck className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span>{isBn ? 'অর্ডার ট্র্যাক' : 'Track Order'}</span>
                  </Link>
                  <Link
                    to="/account?tab=wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-700/80 text-xs font-semibold text-stone-700 dark:text-slate-200 hover:border-rose-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>{isBn ? 'উইশলিস্ট' : 'Wishlist'}</span>
                    </div>
                    {wishlist.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* 4. Language & Display Theme Selector */}
              <div className="p-3.5 sm:p-4 space-y-3 bg-white dark:bg-slate-950">
                <div className="grid grid-cols-2 gap-3">
                  {/* Language Selector */}
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                      {isBn ? 'ভাষা (Language)' : 'Language'}
                    </span>
                    <div className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-slate-900 rounded-xl border border-stone-200/70 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setLanguage('BN')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all ${
                          language === 'BN'
                            ? 'bg-teal-900 text-white shadow-2xs'
                            : 'text-stone-600 dark:text-slate-400'
                        }`}
                      >
                        বাংলা
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('EN')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all ${
                          language === 'EN'
                            ? 'bg-teal-900 text-white shadow-2xs'
                            : 'text-stone-600 dark:text-slate-400'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  {/* Theme Mode Selector */}
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                      {isBn ? 'ডিসপ্লে থিম' : 'Display Mode'}
                    </span>
                    <div className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-slate-900 rounded-xl border border-stone-200/70 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                          theme === 'light'
                            ? 'bg-white text-stone-900 shadow-2xs'
                            : 'text-stone-600 dark:text-slate-400'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isBn ? 'লাইট' : 'Light'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                          theme === 'dark'
                            ? 'bg-slate-800 text-white shadow-2xs'
                            : 'text-stone-600 dark:text-slate-400'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5 text-teal-400" />
                        <span>{isBn ? 'ডার্ক' : 'Dark'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Links: Admin / Portal & Hotline */}
                <div className="pt-2 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center gap-1.5 text-teal-800 dark:text-teal-400 font-semibold hover:underline"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isBn ? 'অ্যাডমিন ও পোর্টাল' : 'Admin & Portal'}</span>
                  </Link>

                  {siteContent.contact?.phone && (
                    <a
                      href={`tel:${siteContent.contact.phone}`}
                      className="inline-flex items-center gap-1 text-stone-600 dark:text-slate-300 font-medium hover:text-teal-700"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                      <span>{siteContent.contact.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Identity, Registration, & Guest Order Linking Modal */}
      <CustomerAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
}
