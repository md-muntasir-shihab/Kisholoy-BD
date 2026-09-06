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
  Moon,
  Store,
  Leaf,
  Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerAuthModal } from '../auth/CustomerAuthModal';
import { BrandLogo } from '../brand/BrandLogo';
import { ThemeButton } from './ThemeButton';

export function Header() {
  const { 
    language, 
    setLanguage, 
    cart,
    cartCount, 
    siteContent, 
    wishlist, 
    currentCustomerId, 
    customerProfile, 
    logoutCustomer,
    theme,
    setTheme,
    categories,
    products
  } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'guest' | 'link_order'>('login');
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isBn = language === 'BN';
  const cartTotal = (cart || []).reduce((sum, item) => sum + (item.product?.price || 0) * (item.quantity || 1), 0);

  // Essential navigation items matching desktop & mobile strictly
  const navMenuItems = [
    {
      id: 'shop',
      name: isBn ? 'শপ' : 'Shop',
      path: '/shop',
      icon: Store,
      badge: isBn ? 'স্টোর' : 'Store',
      description: isBn ? 'অনলাইন শপ ও পণ্য সংগ্রহ' : 'Online store & collections',
      subItems: [
        { name: isBn ? 'সকল প্রস্তুত স্টক' : 'All Ready Stock', path: '/shop' },
        { name: isBn ? 'নতুন আগমন' : 'New Arrivals', path: '/shop?filter=new' },
        { name: isBn ? 'জনপ্রিয় ও নির্বাচিত পণ্য' : 'Featured Masterpieces', path: '/shop?filter=featured' }
      ]
    },
    {
      id: 'shop-all',
      name: isBn ? 'শপ অল' : 'Shop All',
      path: '/shop',
      icon: ShoppingBag,
      badge: `${products.length} ${isBn ? 'পণ্য' : 'Items'}`,
      description: isBn ? 'সম্পূর্ণ পণ্য ক্যাটালগ' : 'Complete catalog collection',
      subItems: [
        { name: isBn ? 'সকল ক্যাটাগরি ব্রাউজ করুন' : 'Browse All Categories', path: '/shop' },
        { name: isBn ? 'বিশেষ ছাড় ও অফার' : 'Discounts & Offers', path: '/shop?filter=sale' }
      ]
    },
    {
      id: 'apparel',
      name: isBn ? 'অ্যাপারেল অ্যান্ড শাড়ি' : 'Apparel & Sarees',
      path: '/category/traditional-clothing',
      icon: Sparkles,
      badge: `${products.filter(p => p.categorySlug === 'traditional-clothing').length} ${isBn ? 'টি' : 'Items'}`,
      description: isBn ? 'ঐতিহ্যবাহী জামদানি, সিল্ক ও তাঁতের পোশাক' : 'Authentic Jamdani, Silk & Handloom',
      subItems: [
        { name: isBn ? 'ঢাকাই জামদানি শাড়ি' : 'Dhakai Jamdani Sarees', path: '/category/traditional-clothing' },
        { name: isBn ? 'রাজশাহী খাঁটি সিল্ক ও তসর' : 'Rajshahi Pure Silk & Tussar', path: '/category/traditional-clothing' },
        { name: isBn ? 'খাদি ও তাঁতের পাঞ্জাবি' : 'Handloom & Khadi Panjabi', path: '/category/traditional-clothing' }
      ]
    },
    {
      id: 'handicrafts',
      name: isBn ? 'হ্যান্ডিক্রাফট অ্যান্ড ডেকোর' : 'Handicrafts & Decor',
      path: '/category/handicrafts-decor',
      icon: Layers,
      badge: `${products.filter(p => p.categorySlug === 'handicrafts-decor').length} ${isBn ? 'টি' : 'Items'}`,
      description: isBn ? 'মৃৎশিল্প, নকশিকাঁথা, পিতল ও কাঠের শিল্প' : 'Terracotta, Nakshi Kantha & Brass Art',
      subItems: [
        { name: isBn ? 'পোড়ামাটির টেরাকোটা ও মৃৎশিল্প' : 'Terracotta & Clay Pottery', path: '/category/handicrafts-decor' },
        { name: isBn ? 'হাতে সেলাই নকশিকাঁথা' : 'Handcrafted Nakshi Kantha', path: '/category/handicrafts-decor' },
        { name: isBn ? 'পিতল ও ধাতব নান্দনিক ডেকোর' : 'Traditional Brass & Metal Decor', path: '/category/handicrafts-decor' }
      ]
    },
    {
      id: 'organic',
      name: isBn ? 'অর্গানিক প্যান্ট্রি' : 'Organic Pantry',
      path: '/category/organic-pantry',
      icon: Leaf,
      badge: `${products.filter(p => p.categorySlug === 'organic-pantry').length} ${isBn ? 'টি' : 'Items'}`,
      description: isBn ? 'সুন্দরবনের খাঁটি মধু, গাওয়া ঘি ও প্রাকৃতিক খাদ্য' : 'Sundarban Raw Honey, Ghee & Essentials',
      subItems: [
        { name: isBn ? 'সুন্দরবনের প্রাকৃতিক কাঁচা মধু' : 'Sundarban Raw Wild Honey', path: '/category/organic-pantry' },
        { name: isBn ? 'খাঁটি গাওয়া ঘি ও সরিষার তেল' : 'Artisanal Pure Ghee & Mustard Oil', path: '/category/organic-pantry' },
        { name: isBn ? 'প্রাকৃতিক পাহাড়ি চা ও মসলা' : 'Organic Hill Tea & Spices', path: '/category/organic-pantry' }
      ]
    }
  ];

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
                  {navMenuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`whitespace-nowrap px-3 2xl:px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-normal transition-all duration-200 ${
                          isActive
                            ? 'bg-white dark:bg-slate-800 text-teal-950 dark:text-teal-300 font-bold shadow-xs border border-stone-200/80 dark:border-slate-700/80'
                            : 'text-stone-600 dark:text-slate-300 hover:text-teal-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>

            {/* Right Column (Actions, Utilities: Search, Theme, Account, Cart) */}
            <div className="flex items-center justify-end gap-2 sm:gap-2.5 md:gap-3 shrink-0 py-0.5">
              {/* Search Trigger Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex h-9 w-9 sm:h-9.5 sm:w-9.5 items-center justify-center rounded-full border border-stone-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md text-stone-700 dark:text-slate-200 hover:text-teal-900 dark:hover:text-teal-300 hover:border-teal-700/60 active:scale-95 transition-all shadow-2xs shrink-0"
                aria-label="Search"
                title={isBn ? 'পণ্য অনুসন্ধান (⌘K)' : 'Search products (⌘K)'}
              >
                <Search className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              </button>

              {/* Display Mode Switcher (Desktop/Tablet) */}
              <div className="hidden sm:inline-flex items-center justify-center">
                <ThemeButton />
              </div>

              {/* User Profile & Account (Unified utility on Mobile & Desktop) */}
              <div className="inline-flex items-center justify-center relative" ref={accountMenuRef}>
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className={`inline-flex h-9 sm:h-9.5 px-2.5 sm:px-3.5 items-center justify-center gap-1.5 sm:gap-2 rounded-full border backdrop-blur-md text-xs font-semibold shadow-2xs active:scale-95 transition-all ${
                    isAccountMenuOpen
                      ? 'border-teal-700 bg-teal-50/90 dark:bg-teal-950/80 text-teal-900 dark:text-teal-200'
                      : 'border-stone-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 text-stone-800 dark:text-slate-200 hover:border-teal-700/60 hover:text-teal-900 dark:hover:text-teal-300'
                  }`}
                  aria-expanded={isAccountMenuOpen}
                  title={isBn ? 'প্রোফাইল, কার্ট ও সেবা' : 'Profile, Cart & Services'}
                >
                  <div className="w-5 h-5 rounded-full bg-teal-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                    {currentCustomerId && customerProfile?.name
                      ? customerProfile.name.slice(0, 1).toUpperCase()
                      : <User className="w-3 h-3 text-white" />}
                  </div>
                  <span className="hidden sm:inline font-semibold">
                    {currentCustomerId
                      ? (customerProfile?.name ? customerProfile.name.split(' ')[0] : (isBn ? 'প্রোফাইল' : 'Profile'))
                      : (isBn ? 'প্রোফাইল' : 'Profile')}
                  </span>
                  
                  {/* Cart items badge or Wishlist dot indicator directly on Profile button */}
                  {cartCount > 0 ? (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-stone-950 text-[10px] font-extrabold flex items-center justify-center leading-none shadow-2xs shrink-0">
                      {cartCount}
                    </span>
                  ) : wishlist.length > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 shrink-0" />
                  ) : null}

                  <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180 text-teal-700 dark:text-teal-400' : ''}`} />
                </button>

                {/* User Profile & Account Dropdown Menu */}
                {isAccountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-84 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl max-h-[85vh] overflow-y-auto">
                    {/* Header: Customer Info or Guest Welcome */}
                    {currentCustomerId ? (
                      <div className="p-3 bg-stone-50/90 dark:bg-slate-800/80 rounded-xl border border-stone-200/60 dark:border-slate-700/60 mb-2.5">
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
                      <div className="p-3 bg-stone-50/90 dark:bg-slate-800/80 rounded-xl border border-stone-200/60 dark:border-slate-700/60 mb-2.5">
                        <div className="text-xs font-bold text-stone-900 dark:text-white mb-1">
                          {isBn ? 'স্বাগতম কিশলয়ে!' : 'Welcome to KISHOLOY!'}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 mb-2.5 leading-snug">
                          {isBn ? 'কার্ট, উইশলিস্ট ও অর্ডার ট্র্যাকিং ব্রাউজ করুন।' : 'Access your cart, wishlist, and track orders.'}
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

                    {/* Integrated Cart Module inside Profile Menu */}
                    <div className="p-3 bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-xl shadow-xs mb-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white/10 text-teal-300">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs block text-white">
                              {isBn ? 'শপিং ব্যাগ / কার্ট' : 'Shopping Bag / Cart'}
                            </span>
                            <span className="text-[10px] text-teal-200">
                              {cartCount} {isBn ? 'টি আইটেম নির্বাচিত' : 'items added'}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                          ৳ {cartTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-1 border-t border-white/10">
                        <Link
                          to="/cart"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex-1 py-1.5 px-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
                        >
                          <span>{isBn ? 'কার্ট দেখুন' : 'View Cart'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        {cartCount > 0 ? (
                          <Link
                            to="/checkout"
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="flex-1 py-1.5 px-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-bold text-center transition-colors shadow-2xs flex items-center justify-center gap-1"
                          >
                            <span>{isBn ? 'চেকআউট' : 'Checkout'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    {/* Features & Options under User Profile */}
                    <div className="space-y-1">
                      {/* 1. Saved Wishlist / Favorites */}
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
                              {isBn ? 'উইশলিস্ট ও ফেভারিট' : 'Wishlist & Favorites'}
                            </span>
                            <span className="text-[10px] text-stone-400 dark:text-slate-500">
                              {isBn ? 'সংরক্ষিত পছন্দের পণ্যসমূহ' : 'Saved favorite items'}
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

                      {/* 2. Track Order */}
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

                      {/* 3. My Orders */}
                      <Link
                        to="/account?tab=orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Package className="w-4 h-4 text-stone-500" />
                          <span className="font-semibold">{isBn ? 'আমার অর্ডারসমূহ' : 'My Orders'}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </Link>

                      {/* 4. Account Dashboard / Profile */}
                      <Link
                        to="/account?tab=profile"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <User className="w-4 h-4 text-stone-500" />
                          <span className="font-semibold">{isBn ? 'প্রোফাইল ও ঠিকানা' : 'Profile & Addresses'}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </Link>

                      {/* 5. Language Settings */}
                      <div className="px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-50/80 dark:hover:bg-slate-800/60 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                              <Languages className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                            </div>
                            <div>
                              <span className="font-semibold block text-stone-900 dark:text-slate-100">
                                {isBn ? 'ভাষা নির্বাচন' : 'Language'}
                              </span>
                            </div>
                          </div>

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

                    {/* Sign Out (for logged-in customers) */}
                    {currentCustomerId && (
                      <div className="pt-2 border-t border-stone-100 dark:border-slate-800 mt-1">
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

      {/* Mobile Category & Navigation Drawer (মোবাইল সাইড প্যানেল ও ক্যাটাগরি মেনু) */}
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

            {/* Slide Down Dedicated Category Drawer */}
            <motion.div
              key="mobile-dropdown-panel"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-h-[calc(100vh-4rem)] overflow-y-auto bg-white/98 dark:bg-slate-950/98 backdrop-blur-2xl border-b border-stone-200 dark:border-slate-800 shadow-2xl flex flex-col"
            >
              {/* 1. Category Drawer Header & Fast Search */}
              <div className="p-3.5 sm:p-4 bg-stone-50/90 dark:bg-slate-900/80 border-b border-stone-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-900 text-amber-300">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 block">
                        {isBn ? 'মেনু ও ক্যাটাগরি সমূহ' : 'Menu & Categories'}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-slate-400 block">
                        {isBn ? 'প্রধান ৫টি ক্যাটাগরি ও কালেকশন' : 'Essential 5 categories & collections'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Search */}
                <form
                  onSubmit={(e) => {
                    handleSearch(e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isBn ? 'ক্যাটাগরি বা পণ্য খুঁজুন...' : 'Search categories or products...'}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-teal-900 dark:bg-teal-600 hover:bg-teal-950 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-2xs shrink-0"
                  >
                    {isBn ? 'খুঁজুন' : 'Find'}
                  </button>
                </form>
              </div>

              {/* 2. Essential 5 Category Items with Smooth Accordion Expansion */}
              <div className="p-3 sm:p-4 space-y-2.5">
                {navMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isExpanded = expandedCategory === item.id;
                  const isActive = location.pathname === item.path;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isActive
                          ? 'bg-teal-50/90 dark:bg-teal-950/50 border-teal-700/80 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-stone-200/80 dark:border-slate-800/80 hover:border-teal-700/50'
                      }`}
                    >
                      {/* Main Category Header Row */}
                      <div className="flex items-center justify-between p-2.5 sm:p-3 gap-2">
                        <Link
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 min-w-0 flex-1 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-teal-900 dark:bg-teal-950 text-amber-300 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white truncate block">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500 dark:text-slate-400 truncate block">
                              {item.description}
                            </span>
                          </div>
                        </Link>

                        {/* Right: Badge & Sub-Menu Toggle Button */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-[10px] font-bold">
                            {item.badge}
                          </span>

                          {item.subItems && item.subItems.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setExpandedCategory(prev => prev === item.id ? null : item.id);
                              }}
                              aria-label={`Toggle ${item.name} sub-menu`}
                              aria-expanded={isExpanded}
                              className={`p-1.5 rounded-lg border border-stone-200/80 dark:border-slate-700 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-slate-800 transition-all duration-200 ${
                                isExpanded ? 'rotate-180 bg-teal-50 dark:bg-teal-950/80 border-teal-700 text-teal-800 dark:text-teal-300' : ''
                              }`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Sub-Menu Accordion */}
                      <AnimatePresence initial={false}>
                        {isExpanded && item.subItems && item.subItems.length > 0 && (
                          <motion.div
                            key={`sub-${item.id}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden border-t border-stone-100 dark:border-slate-800/90 bg-stone-50/80 dark:bg-slate-900/60"
                          >
                            <div className="py-2 px-3 space-y-1">
                              {item.subItems.map((sub, idx) => (
                                <Link
                                  key={idx}
                                  to={sub.path}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="flex items-center justify-between py-2 px-3 rounded-lg text-xs font-medium text-stone-700 dark:text-slate-300 hover:text-teal-950 dark:hover:text-teal-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0" />
                                    <span className="truncate">{sub.name}</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* 3. Bottom Footer Note & Close Action */}
              <div className="p-3 bg-stone-50 dark:bg-slate-900/60 border-t border-stone-150 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">
                  {isBn ? 'কিশলয় • খাঁটি দেশীয় পণ্য' : 'Kisholoy • Authentic Crafts'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-xs font-semibold hover:bg-stone-300 transition-colors"
                >
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </button>
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
