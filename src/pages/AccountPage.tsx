import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  User, Package, MapPin, Phone, Mail, Clock, ChevronRight, ExternalLink, 
  Heart, RotateCcw, Plus, Trash2, Edit3, Check, Star, 
  ShieldCheck, AlertCircle, ShoppingBag, ArrowRight, CheckCircle2,
  Calendar, Building, Home, HelpCircle, Truck,
  Bell, MessageCircle, Smartphone, CheckCheck, LogOut, Lock, Eye, EyeOff, Link2, Languages
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomerAddress, WishlistItem, CustomerReturnRequest } from '../types';

export function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'orders';

  const { 
    orders, 
    language, 
    setLanguage,
    currentCustomerId, 
    setCurrentCustomerId,
    loginCustomer,
    logoutCustomer,
    customerProfile, 
    savedAddresses, 
    wishlist, 
    returnRequests, 
    toggleWishlist, 
    saveAddress, 
    deleteAddress, 
    setDefaultAddress, 
    updateCustomerProfile, 
    submitReturnRequest,
    addToCart,
    showToast,
    products,
    customerNotifications,
    unreadNotificationsCount,
    markCustomerNotificationRead,
    markAllCustomerNotificationsRead
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses' | 'returns' | 'notifications' | 'profile'>(
    ['orders', 'wishlist', 'addresses', 'returns', 'notifications', 'profile'].includes(initialTab) ? initialTab : 'orders'
  );

  // Sync tab with URL search parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['orders', 'wishlist', 'addresses', 'returns', 'notifications', 'profile'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'orders' | 'wishlist' | 'addresses' | 'returns' | 'notifications' | 'profile') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Auth form states (when logged out)
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'link_order'>('login');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Register form fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regDistrict, setRegDistrict] = useState('Dhaka');

  // Link guest order fields
  const [linkOrderNumber, setLinkOrderNumber] = useState('');
  const [linkOrderPhone, setLinkOrderPhone] = useState('');

  // Password change in Profile Settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  // Address modal states
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home' as 'Home' | 'Office' | 'Other',
    labelBn: 'বাসা',
    recipientName: '',
    phone: '',
    altPhone: '',
    division: 'Dhaka',
    district: 'Dhaka',
    upazilaOrArea: '',
    addressLine: '',
    postalCode: '',
    isDefault: false
  });

  // Return request modal states
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnForm, setReturnForm] = useState({
    orderId: '',
    orderNumber: '',
    productId: '',
    productTitle: '',
    quantity: 1,
    reason: 'SIZE_FIT_ISSUE' as CustomerReturnRequest['reason'],
    reasonDetails: '',
    preferredResolution: 'EXCHANGE' as CustomerReturnRequest['preferredResolution']
  });

  // Profile edit states
  const [profileForm, setProfileForm] = useState({
    name: customerProfile?.name || '',
    email: customerProfile?.email || '',
    alternatePhone: customerProfile?.alternatePhone || '',
    dateOfBirth: customerProfile?.dateOfBirth || '',
    gender: (customerProfile?.gender || 'PREFER_NOT_TO_SAY') as any,
    newsletterSubscribed: customerProfile?.preferences?.newsletterSubscribed ?? true,
    smsOrderUpdates: customerProfile?.preferences?.smsOrderUpdates ?? true,
    whatsappOrderUpdates: customerProfile?.preferences?.whatsappOrderUpdates ?? true,
    emailOrderUpdates: customerProfile?.preferences?.emailOrderUpdates ?? true,
    promotionalOffers: customerProfile?.preferences?.promotionalOffers ?? true,
    preferredLanguage: customerProfile?.preferences?.preferredLanguage || 'BN'
  });

  useEffect(() => {
    if (customerProfile) {
      setProfileForm({
        name: customerProfile.name || '',
        email: customerProfile.email || '',
        alternatePhone: customerProfile.alternatePhone || '',
        dateOfBirth: customerProfile.dateOfBirth || '',
        gender: customerProfile.gender || 'PREFER_NOT_TO_SAY',
        newsletterSubscribed: customerProfile.preferences?.newsletterSubscribed ?? true,
        smsOrderUpdates: customerProfile.preferences?.smsOrderUpdates ?? true,
        whatsappOrderUpdates: customerProfile.preferences?.whatsappOrderUpdates ?? true,
        emailOrderUpdates: customerProfile.preferences?.emailOrderUpdates ?? true,
        promotionalOffers: customerProfile.preferences?.promotionalOffers ?? true,
        preferredLanguage: customerProfile.preferences?.preferredLanguage || 'BN'
      });
    }
  }, [customerProfile]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      showToast('Please enter your mobile number/email and password.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword })
      });
      const data = await res.json();
      if (data.success && data.customer) {
        if (data.token) localStorage.setItem('ksh_customer_token', data.token);
        loginCustomer(data.customer.id, data.customer);
        showToast(`Welcome back, ${data.customer.name}!`);
      } else {
        showToast(data.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      showToast(err.message || 'Login connection failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regPassword) {
      showToast('Name, phone number and password are required.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/customer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: regName, 
          email: regEmail, 
          phone: regPhone, 
          password: regPassword, 
          address: regAddress, 
          district: regDistrict 
        })
      });
      const data = await res.json();
      if (data.success && data.customer) {
        if (data.token) localStorage.setItem('ksh_customer_token', data.token);
        loginCustomer(data.customer.id, data.customer);
        showToast(`Account created! Welcome, ${data.customer.name}.`);
      } else {
        showToast(data.error || 'Registration failed.');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration connection failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Link Guest Order
  const handleLinkGuestOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkOrderNumber || !linkOrderPhone) {
      showToast('Please provide both Order Number and phone number.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/customer/auth/link-guest-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentCustomerId || 'cust-1',
          orderNumber: linkOrderNumber,
          phone: linkOrderPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Order successfully linked to your account!');
        setLinkOrderNumber('');
        setLinkOrderPhone('');
      } else {
        showToast(data.error || 'Could not find or verify this order.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to link order.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Please enter both current and new password.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.');
      return;
    }
    setPasswordChangeLoading(true);
    try {
      const res = await fetch('/api/customer/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentCustomerId,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(data.error || 'Password update failed.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update password.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  // Open address modal for create or edit
  const openAddressModal = (addr?: CustomerAddress) => {
    if (addr) {
      setEditingAddressId(addr.id);
      setAddressForm({
        label: addr.label,
        labelBn: addr.labelBn,
        recipientName: addr.recipientName,
        phone: addr.phone,
        altPhone: addr.altPhone || '',
        division: addr.division,
        district: addr.district,
        upazilaOrArea: addr.upazilaOrArea,
        addressLine: addr.addressLine,
        postalCode: addr.postalCode || '',
        isDefault: addr.isDefault
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        label: 'Home',
        labelBn: 'বাসা',
        recipientName: customerProfile?.name || '',
        phone: customerProfile?.phone || '',
        altPhone: '',
        division: 'Dhaka',
        district: 'Dhaka',
        upazilaOrArea: '',
        addressLine: '',
        postalCode: '',
        isDefault: savedAddresses.length === 0
      });
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.recipientName || !addressForm.phone || !addressForm.addressLine) {
      showToast('Please fill in recipient name, phone, and address line.');
      return;
    }
    await saveAddress({
      ...(editingAddressId ? { id: editingAddressId } : {}),
      ...addressForm,
      labelBn: addressForm.label === 'Home' ? 'বাসা' : addressForm.label === 'Office' ? 'অফিস' : 'অন্যান্য'
    });
    setIsAddressModalOpen(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCustomerProfile({
      name: profileForm.name,
      email: profileForm.email,
      alternatePhone: profileForm.alternatePhone,
      dateOfBirth: profileForm.dateOfBirth,
      gender: profileForm.gender,
      preferences: {
        newsletterSubscribed: profileForm.newsletterSubscribed,
        smsOrderUpdates: profileForm.smsOrderUpdates,
        whatsappOrderUpdates: profileForm.whatsappOrderUpdates,
        emailOrderUpdates: profileForm.emailOrderUpdates,
        promotionalOffers: profileForm.promotionalOffers,
        preferredLanguage: profileForm.preferredLanguage
      }
    });
  };

  // Open RMA modal for a specific order
  const openReturnModalForOrder = (order: any) => {
    const firstItem = order.items[0];
    setReturnForm({
      orderId: order.id,
      orderNumber: order.orderNumber,
      productId: firstItem?.productId || '',
      productTitle: firstItem?.title || 'Selected Item',
      quantity: 1,
      reason: 'SIZE_FIT_ISSUE',
      reasonDetails: '',
      preferredResolution: 'EXCHANGE'
    });
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnForm.reasonDetails.trim()) {
      showToast('Please explain the reason for your return or exchange.');
      return;
    }
    await submitReturnRequest(returnForm);
    setIsReturnModalOpen(false);
    handleTabChange('returns');
  };

  // -------------------------------------------------------------
  // VIEW: LOGGED OUT AUTHENTICATION PORTAL
  // -------------------------------------------------------------
  if (!currentCustomerId) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          
          {/* Top Banner */}
          <div className="p-6 sm:p-8 bg-stone-900 text-white text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center mx-auto shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold">
              {language === 'BN' ? 'কিশলয় গ্রাহক পোর্টাল' : 'KISHOLOY Customer Portal'}
            </h1>
            <p className="text-xs text-stone-300 max-w-md mx-auto">
              {language === 'BN' 
                ? 'আপনার অর্ডার ট্র্যাকিং, ডেলিভারি ঠিকানা এবং রিটার্ন অনুরোধ পরিচালনা করতে সাইন ইন করুন।'
                : 'Sign in to access your order tracking, delivery addresses, wishlist, and service requests.'}
            </p>

            {/* Quick Actions for Visitors */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/track-order"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors"
              >
                <Truck className="w-3.5 h-3.5 text-teal-400" />
                <span>{language === 'BN' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order'}</span>
              </Link>
              <button
                type="button"
                onClick={() => setLanguage(language === 'BN' ? 'EN' : 'BN')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors"
              >
                <Languages className="w-3.5 h-3.5 text-teal-400" />
                <span>{language === 'BN' ? 'Switch to English' : 'বাংলায় দেখুন'}</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex border-b border-stone-200 bg-stone-50/60 dark:bg-slate-800/40 text-xs font-semibold">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-3.5 text-center transition-colors border-b-2 ${
                authMode === 'login'
                  ? 'border-teal-900 text-teal-950 font-bold bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {language === 'BN' ? 'সাইন ইন / লগইন' : 'Sign In'}
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-3.5 text-center transition-colors border-b-2 ${
                authMode === 'register'
                  ? 'border-teal-900 text-teal-950 font-bold bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {language === 'BN' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Account'}
            </button>
            <button
              onClick={() => setAuthMode('link_order')}
              className={`flex-1 py-3.5 text-center transition-colors border-b-2 ${
                authMode === 'link_order'
                  ? 'border-teal-900 text-teal-950 font-bold bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {language === 'BN' ? 'গেস্ট অর্ডার লিঙ্ক করুন' : 'Link Guest Order'}
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6 text-xs">
            
            {/* SIGN IN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    {language === 'BN' ? 'মোবাইল নম্বর অথবা ইমেইল' : 'Mobile Number or Email'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="017XXXXXXXX or user@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    {language === 'BN' ? 'পাসওয়ার্ড' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Demo Logins Helper */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 text-[11px] text-stone-600">
                  <span className="font-bold text-stone-800 block">Instant 1-Click Demo Accounts:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        loginCustomer('cust-1');
                        showToast('Logged in as Tanzil Ahmed');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 dark:border-teal-500/30 text-teal-900 font-semibold hover:bg-teal-100 transition-colors"
                    >
                      Sign In as Tanzil Ahmed (cust-1)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        loginCustomer('cust-2');
                        showToast('Logged in as Nusrat Jahan');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-300 text-stone-800 font-semibold hover:bg-stone-200 transition-colors"
                    >
                      Sign In as Nusrat Jahan (cust-2)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-teal-900 hover:bg-teal-950 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>{authLoading ? 'Signing In...' : 'Sign In to Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Tanzil Ahmed"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="user@example.com (optional)"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Delivery Address & District</label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="House, Road, Area, Dhaka"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-teal-900 hover:bg-teal-950 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>{authLoading ? 'Creating Account...' : 'Complete Registration'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* LINK GUEST ORDER */}
            {authMode === 'link_order' && (
              <form onSubmit={handleLinkGuestOrderSubmit} className="space-y-4">
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 dark:border-teal-500/30 text-teal-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-teal-800" />
                    <span>Link a Previous Guest Order</span>
                  </div>
                  <p className="text-[11px] text-teal-800">
                    Did you place an order before creating your account? Enter your Order Number and verification phone number to attach it to your profile.
                  </p>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Order Number (e.g. KSH-2026-001 or ord-001)
                  </label>
                  <input
                    type="text"
                    required
                    value={linkOrderNumber}
                    onChange={(e) => setLinkOrderNumber(e.target.value)}
                    placeholder="KSH-2026-001"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-teal-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Order Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={linkOrderPhone}
                    onChange={(e) => setLinkOrderPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:border-teal-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-teal-900 hover:bg-teal-950 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>{authLoading ? 'Verifying & Linking...' : 'Link Order to Account'}</span>
                  <Link2 className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>

          <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 text-[11px] text-stone-500 flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-800" />
              <span>Secure 256-bit Encrypted Customer Session</span>
            </span>
            <Link to="/shop" className="text-teal-900 font-semibold hover:underline">
              Continue Shopping →
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATED CUSTOMER DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Top Banner: Persona Switcher & Logout */}
      <div className="mb-8 p-4 bg-stone-100/90 border border-stone-300/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-900 text-white shadow-xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-stone-900">
                {language === 'BN' ? 'গ্রাহক সেলফ-সার্ভিস পোর্টাল' : 'Customer Account & Self-Service Portal'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:border-emerald-500/40">
                {language === 'BN' ? 'সক্রিয় গ্রাহক' : 'Active Account'}
              </span>
            </div>
            <p className="text-xs text-stone-600">
              {language === 'BN' 
                ? 'আপনার অর্ডার ট্র্যাকিং, সংরক্ষিত ডেলিভারি ঠিকানা, উইশলিস্ট ও রিটার্ন অনুরোধ পরিচালনা করুন।'
                : 'Manage your order tracking, address book, curated wishlist, and return requests.'}
            </p>
          </div>
        </div>

        {/* Persona Switcher & Log Out Button */}
        <div className="flex items-center gap-2.5 text-xs w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-medium">Switch Customer:</span>
            <select
              value={currentCustomerId}
              onChange={(e) => {
                loginCustomer(e.target.value);
                showToast(`Switched customer to ${e.target.value === 'cust-1' ? 'Tanzil Ahmed' : 'Nusrat Jahan'}`);
              }}
              className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:border-teal-900 shadow-2xs"
            >
              <option value="cust-1">Tanzil Ahmed</option>
              <option value="cust-2">Nusrat Jahan</option>
            </select>
          </div>

          <button
            onClick={logoutCustomer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 dark:border-rose-500/30 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            title="Sign out of account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'BN' ? 'সাইন আউট' : 'Log Out'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar Profile Card */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            
            {/* Customer Avatar & Status */}
            <div className="flex items-center gap-3 pb-6 border-b border-stone-200">
              <div className="w-14 h-14 rounded-2xl bg-teal-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                {customerProfile?.name ? customerProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'KH'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-stone-900 truncate">
                  {customerProfile?.name || 'Customer Account'}
                </h2>
                <span className="text-xs text-stone-500 font-mono block truncate">
                  {customerProfile?.phone || '+880 17XXXXXXXX'}
                </span>
                <span className="text-[11px] text-stone-400 truncate block">
                  {customerProfile?.email || 'customer@kisholoy.com'}
                </span>
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-900 border border-teal-200 dark:border-teal-500/30">
                    <CheckCircle2 className="w-2.5 h-2.5 text-teal-700" />
                    <span>{language === 'BN' ? 'ভেরিফাইড অ্যাকাউন্ট' : 'Verified Member'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1.5">
              {/* 1. Track Order Direct Access */}
              <Link
                to="/track-order"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:bg-teal-50/70 hover:text-teal-950 dark:text-slate-300 dark:hover:bg-slate-800 transition-all group"
              >
                <span className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-teal-800 dark:text-teal-400" />
                  <span>{language === 'BN' ? 'অর্ডার ট্র্যাক' : 'Track Order'}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                onClick={() => handleTabChange('orders')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'orders'
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Package className="w-4 h-4" />
                  {language === 'BN' ? 'আমার অর্ডারসমূহ' : 'My Orders'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'orders' ? 'bg-teal-800 text-white' : 'bg-stone-200/70 text-stone-800'
                }`}>
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('wishlist')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'wishlist'
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4" />
                  {language === 'BN' ? 'ফেভারিট আইটেম' : 'Favorite Items'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'wishlist' ? 'bg-teal-800 text-white' : 'bg-rose-100 text-rose-800'
                }`}>
                  {wishlist.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('addresses')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'addresses'
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4" />
                  {language === 'BN' ? 'ডেলিভারি ঠিকানা' : 'Saved Addresses'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'addresses' ? 'bg-teal-800 text-white' : 'bg-stone-200/70 text-stone-800'
                }`}>
                  {savedAddresses.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('returns')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'returns'
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4" />
                  {language === 'BN' ? 'রিটার্ন ও এক্সচেঞ্জ (RMA)' : 'Returns & RMA'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'returns' ? 'bg-teal-800 text-white' : 'bg-stone-200/70 text-stone-800'
                }`}>
                  {returnRequests.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('notifications')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4" />
                  {language === 'BN' ? 'বিজ্ঞপ্তি ও আপডেট' : 'Notifications & Alerts'}
                </span>
                {unreadNotificationsCount > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-600 text-white animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                ) : (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'notifications' ? 'bg-teal-800 text-white' : 'bg-stone-200/70 text-stone-800'
                  }`}>
                    {customerNotifications.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('profile')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <User className="w-4 h-4" />
                  {language === 'BN' ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}
                </span>
              </button>
            </nav>

            {/* Language Settings inside User Account */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <Languages className="w-3.5 h-3.5 text-teal-800" />
                  <span>{language === 'BN' ? 'ল্যাঙ্গুয়েজ সেটিংস' : 'Language Settings'}</span>
                </div>
                <span className="text-[10px] font-bold text-teal-800">
                  {language === 'BN' ? 'বাংলা' : 'EN'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-200/60 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLanguage('BN')}
                  className={`py-1 rounded-md text-xs font-bold transition-all ${
                    language === 'BN'
                      ? 'bg-white text-teal-950 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('EN')}
                  className={`py-1 rounded-md text-xs font-bold transition-all ${
                    language === 'EN'
                      ? 'bg-white text-teal-950 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Logout Sidebar Action */}
            <div className="pt-2 border-t border-stone-200">
              <button
                onClick={logoutCustomer}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{language === 'BN' ? 'অ্যাকাউন্ট থেকে সাইন আউট' : 'Sign Out of Account'}</span>
              </button>
            </div>

            {/* Need Help Box */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-stone-800">
                <HelpCircle className="w-3.5 h-3.5 text-teal-800" />
                <span>{language === 'BN' ? 'কাস্টমার সাপোর্ট' : 'Direct Assistance'}</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                {language === 'BN' ? 'জরুরি প্রয়োজনে কল করুন বা হোয়াটসঅ্যাপে বার্তা দিন:' : 'Hotline open 9am-10pm daily:'}
              </p>
              <a href="tel:+8809612345678" className="font-bold text-teal-900 hover:underline block font-mono text-xs">
                +880 9612-345678
              </a>
            </div>

          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 min-w-0">
          
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">
                    {language === 'BN' ? 'অর্ডার হিস্টোরি ও ট্র্যাকিং' : 'Order History & Real-Time Tracking'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'BN' 
                      ? 'আপনার সকল অর্ডারের লাইভ কুরিয়ার স্ট্যাটাস, বিস্তারিত বিবরণ ও চালান দেখুন।' 
                      : 'Live dispatch progression, invoice downloads, and seamless reorders.'}
                  </p>
                </div>
                <Link
                  to="/track-order"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 dark:border-teal-500/30 transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{language === 'BN' ? 'কুরিয়ার ট্র্যাকার' : 'Live Courier Radar'}</span>
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">No Orders Placed Yet</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Explore our curated artisanal Jamdani, pure honey, pottery, and handcrafted lifestyle essentials.
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-900 dark:bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-950 dark:hover:bg-teal-500 transition-all shadow-xs"
                  >
                    <span>Start Shopping</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const totalQty = order.items.reduce((acc, it) => acc + it.quantity, 0);
                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-xs text-teal-950 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 dark:border-teal-500/30">
                              {order.orderNumber || order.id}
                            </span>
                            <span className="text-xs text-stone-500">
                              Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                              order.orderStatus === 'DELIVERED' 
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:border-emerald-500/40'
                                : order.orderStatus === 'SHIPPED'
                                ? 'bg-blue-50 text-blue-900 border-blue-300 dark:border-blue-500/40'
                                : order.orderStatus === 'PROCESSING' || order.orderStatus === 'CONFIRMED'
                                ? 'bg-teal-50 text-teal-900 border-teal-300 dark:border-teal-500/40'
                                : order.orderStatus === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-900 border-rose-300 dark:border-rose-500/40'
                                : 'bg-amber-50 text-amber-900 border-amber-300 dark:border-amber-500/40'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center font-mono font-bold text-stone-700 shrink-0">
                                  {item.quantity}x
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-stone-900 truncate">
                                    {language === 'BN' ? item.titleBn || item.title : item.title}
                                  </h4>
                                  <span className="text-[11px] text-stone-500 block">
                                    Unit Price: ৳{item.price.toLocaleString()} • SKU: {item.sku || 'KSH-GEN'}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-stone-900 shrink-0">
                                ৳{(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer & Actions */}
                        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="text-stone-600">
                            Total: <strong className="text-stone-900 font-mono font-bold text-sm">৳{order.total.toLocaleString()}</strong>
                            <span className="text-stone-400 ml-2">({totalQty} {totalQty === 1 ? 'item' : 'items'}, {order.paymentMethod})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openReturnModalForOrder(order)}
                              className="px-3 py-1.5 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg font-semibold transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{language === 'BN' ? 'রিটার্ন / এক্সচেঞ্জ' : 'Return Item'}</span>
                            </button>

                            <Link
                              to={`/track-order?orderId=${order.orderNumber || order.id}`}
                              className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-lg font-semibold transition-colors flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Track Courier</span>
                            </Link>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">
                    {language === 'BN' ? 'সংরক্ষিত পছন্দের তালিকা' : 'Saved Wishlist'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'BN' 
                      ? 'আপনার পছন্দের পণ্যসমূহ সংরক্ষণ করুন এবং যেকোনো সময় সহজে ব্যাগে যোগ করুন।' 
                      : 'Keep track of curated artisanal items and easily move them to your bag.'}
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-700">
                  {wishlist.length} Items Saved
                </span>
              </div>

              {wishlist.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-500">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">Your Wishlist is Empty</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Click the heart icon on any product in our collection to save it for later.
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-900 text-white rounded-xl text-xs font-semibold hover:bg-teal-950 transition-all"
                  >
                    <span>Browse Catalog</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlist.map((item) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="h-44 bg-stone-100 relative overflow-hidden">
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600'}
                              alt={item.productTitle}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              onClick={() => toggleWishlist(item.productId)}
                              className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 text-rose-600 hover:bg-white dark:hover:bg-slate-700 shadow-xs transition-colors"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                              {item.category}
                            </span>
                          </div>

                          <div className="p-4 space-y-1.5">
                            <h3 className="font-bold text-stone-900 text-xs line-clamp-2">
                              {language === 'BN' ? item.productTitleBn || item.productTitle : item.productTitle}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold font-mono text-teal-950">
                                ৳{item.price.toLocaleString()}
                              </span>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-xs text-stone-400 line-through font-mono">
                                  ৳{item.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <button
                            onClick={() => {
                              if (prod) {
                                addToCart(prod);
                                showToast(`${prod.title} added to bag!`);
                              }
                            }}
                            className="w-full py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">
                    {language === 'BN' ? 'সংরক্ষিত ডেলিভারি ঠিকানা' : 'Saved Delivery Addresses'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'BN' 
                      ? 'বাসা, অফিস বা উপহার পাঠানোর ঠিকানা সংরক্ষণ ও পরিচালনা করুন।'
                      : 'Manage multi-location shipping profiles for faster express checkout.'}
                  </p>
                </div>
                <button
                  onClick={() => openAddressModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-900 dark:bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-950 dark:hover:bg-teal-500 transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'BN' ? 'নতুন ঠিকানা' : 'Add New Address'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-2xl border p-5 space-y-3 relative transition-all ${
                      addr.isDefault ? 'border-teal-800 ring-1 ring-teal-800/20 shadow-xs' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-800 uppercase tracking-wider">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openAddressModal(addr)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Edit address"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteAddress(addr.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-stone-900">{addr.recipientName}</h4>
                      <p className="text-stone-600 font-mono">{addr.phone}</p>
                      <p className="text-stone-600 leading-relaxed pt-1">
                        {addr.addressLine}, {addr.upazilaOrArea}, {addr.district} - {addr.postalCode}
                      </p>
                    </div>

                    {!addr.isDefault && (
                      <div className="pt-2 border-t border-stone-100 flex justify-end">
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          className="text-xs text-teal-900 font-semibold hover:underline"
                        >
                          Set as Default Address
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RETURNS & RMA */}
          {activeTab === 'returns' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">
                    {language === 'BN' ? 'রিটার্ন ও এক্সচেঞ্জ রিকোয়েস্ট (RMA)' : 'Returns & Exchange Requests'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'BN' 
                      ? 'ডেলিভারিকৃত অর্ডারের সাইজ এক্সচেঞ্জ বা ক্ষতিগ্রস্ত পণ্যের রিফান্ড অনুরোধের অবস্থা।'
                      : 'Transparent tracking of your return, size exchange, or store credit requests.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (orders.length > 0) {
                      openReturnModalForOrder(orders[0]);
                    } else {
                      showToast('You do not have any orders eligible for return.');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'BN' ? 'নতুন রিকোয়েস্ট' : 'New Return Request'}</span>
                </button>
              </div>

              {returnRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">No Return Requests Found</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    If you ever face an issue with size, fit, or defective items, you can file a 7-day hassle-free return right here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {returnRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                        <div>
                          <span className="font-mono font-bold text-xs text-teal-950 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 dark:border-teal-500/30">
                            {req.requestNumber}
                          </span>
                          <span className="text-xs text-stone-500 ml-2">
                            Order: <strong>{req.orderNumber}</strong> • {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          req.status === 'APPROVED' 
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:border-emerald-500/40'
                            : req.status === 'RESOLVED'
                            ? 'bg-teal-50 text-teal-900 border-teal-300 dark:border-teal-500/40'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-900 border-rose-300 dark:border-rose-500/40'
                            : 'bg-amber-50 text-amber-900 border-amber-300 dark:border-amber-500/40'
                        }`}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-stone-400 block mb-0.5">Item & Quantity</span>
                          <p className="font-bold text-stone-900">{req.productTitle} (Qty: {req.quantity})</p>
                          <span className="text-stone-500 block mt-1">
                            Reason: <strong>{req.reason.replace(/_/g, ' ')}</strong>
                          </span>
                        </div>

                        <div>
                          <span className="text-stone-400 block mb-0.5">Preferred Resolution</span>
                          <p className="font-bold text-teal-900">{req.preferredResolution.replace(/_/g, ' ')}</p>
                          <p className="text-stone-500 mt-1 italic">"{req.reasonDetails}"</p>
                        </div>
                      </div>

                      {req.adminNotes && (
                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                          <span className="font-bold text-stone-700 block mb-0.5">KISHOLOY Operations Team Note:</span>
                          <p className="text-stone-600">{req.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS & ALERTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-teal-900" />
                      {language === 'BN' ? 'অর্ডার আপডেট ও বার্তা' : 'Order & Service Notifications'}
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {language === 'BN' 
                        ? 'আপনার অর্ডারের নিশ্চিতকরণ, কুরিয়ার ট্র্যাকিং ও ডেলিভারি স্ট্যাটাস সম্পর্কিত বার্তা।'
                        : 'Real-time dispatch confirmations, courier delivery tracking alerts, and returns updates.'}
                    </p>
                  </div>

                  {customerNotifications.length > 0 && (
                    <button
                      onClick={() => markAllCustomerNotificationsRead()}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-teal-800" />
                      {language === 'BN' ? 'সব পড়া হয়েছে চিহ্নিত করুন' : 'Mark All as Read'}
                    </button>
                  )}
                </div>

                {/* Direct WhatsApp Support Helper Banner */}
                <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-green-950">
                        {language === 'BN' ? 'হোয়াটসঅ্যাপ সরাসরি সাপোর্ট' : 'Direct WhatsApp Order Updates'}
                      </h4>
                      <p className="text-[11px] text-green-800">
                        {language === 'BN' 
                          ? 'অর্ডার ট্র্যাকিং ও দ্রুত সহযোগিতার জন্য আমাদের ভেরিফাইড হোয়াটসঅ্যাপ নম্বরে যোগাযোগ করুন।'
                          : 'Chat with our Kisholoy concierge directly for dispatch inquiries, changes, or instant photo proof.'}
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://wa.me/8801712345678?text=Hello%20Kisholoy%20Support,%20I%20need%20assistance%20with%20my%20order"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {language === 'BN' ? 'হোয়াটসঅ্যাপে চ্যাট করুন' : 'Chat on WhatsApp'}
                  </a>
                </div>

                {/* Notifications List */}
                <div className="mt-6 space-y-3">
                  {customerNotifications.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                      <Bell className="w-10 h-10 mx-auto stroke-1 text-stone-300 mb-2" />
                      <p className="text-sm font-medium">
                        {language === 'BN' ? 'এখনো কোনো নতুন বিজ্ঞপ্তি নেই।' : 'No notifications yet.'}
                      </p>
                    </div>
                  ) : (
                    customerNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-xl border transition-all ${
                          notif.isRead
                            ? 'bg-white border-stone-200/80 text-stone-700'
                            : 'bg-teal-50/40 border-teal-200 dark:border-teal-500/30 text-stone-900 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              notif.channel === 'WHATSAPP' ? 'bg-green-100 text-green-800' :
                              (notif.channel === 'SMS' ? 'bg-amber-100 text-amber-900' : 'bg-teal-100 text-teal-900')
                            }`}>
                              {notif.channel === 'WHATSAPP' ? (
                                <MessageCircle className="w-4 h-4" />
                              ) : notif.channel === 'SMS' ? (
                                <Smartphone className="w-4 h-4" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs">{notif.title}</h4>
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-mono bg-stone-100 text-stone-600">
                                  {notif.channel}
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-stone-400 block">
                                {new Date(notif.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {!notif.isRead && (
                            <button
                              onClick={() => markCustomerNotificationRead(notif.id)}
                              className="text-[11px] text-teal-900 font-semibold hover:underline shrink-0"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-8">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900">
                  {language === 'BN' ? 'ব্যক্তিগত তথ্য ও নিরাপত্তা সেটিংস' : 'Profile & Account Security'}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {language === 'BN' 
                    ? 'আপনার নাম, মোবাইল নম্বর, যোগাযোগ পছন্দ ও পাসওয়ার্ড পরিবর্তন করুন।'
                    : 'Manage your contact information, delivery notification preferences, and account credentials.'}
                </p>
              </div>

              {/* Personal Information Form */}
              <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-teal-900"
                    />
                  </div>

                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-teal-900"
                    />
                  </div>

                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Primary Mobile Phone</label>
                    <input
                      type="tel"
                      disabled
                      value={customerProfile?.phone || ''}
                      className="w-full p-2.5 bg-stone-100 border border-stone-300 rounded-xl text-stone-500 font-mono cursor-not-allowed"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Primary phone linked to authenticated account.</span>
                  </div>

                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Alternate Phone</label>
                    <input
                      type="tel"
                      value={profileForm.alternatePhone}
                      onChange={(e) => setProfileForm({ ...profileForm, alternatePhone: e.target.value })}
                      placeholder="+880 18XXXXXXXX"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-teal-900"
                    />
                  </div>

                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-teal-900"
                    />
                  </div>

                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Gender</label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value as any })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-teal-900"
                    >
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Communication Preferences */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <h3 className="font-bold text-sm text-stone-900">
                    {language === 'BN' ? 'যোগাযোগ ও মেসেজিং পছন্দসমূহ' : 'Communication & Dispatch Preferences'}
                  </h3>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileForm.smsOrderUpdates}
                        onChange={(e) => setProfileForm({ ...profileForm, smsOrderUpdates: e.target.checked })}
                        className="w-4 h-4 rounded text-teal-900 border-stone-300 focus:ring-teal-900"
                      />
                      <div>
                        <span className="text-xs font-bold text-stone-800 block">
                          {language === 'BN' ? 'এসএমএস অর্ডার নোটিফিকেশন' : 'SMS Order & Courier Alerts'}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          {language === 'BN' ? 'অর্ডার গ্রহণ, প্যাকেজিং ও কুরিয়ার ট্র্যাকিং নম্বর এসএমএসে গ্রহণ করুন' : 'Instant SMS when order is packed and assigned to Steadfast / Pathao courier'}
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileForm.whatsappOrderUpdates}
                        onChange={(e) => setProfileForm({ ...profileForm, whatsappOrderUpdates: e.target.checked })}
                        className="w-4 h-4 rounded text-teal-900 border-stone-300 focus:ring-teal-900"
                      />
                      <div>
                        <span className="text-xs font-bold text-stone-800 block">
                          {language === 'BN' ? 'হোয়াটসঅ্যাপ মেসেজ ও ফটো প্রুফ' : 'WhatsApp Delivery Confirmation'}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          {language === 'BN' ? 'প্যাকেজ ডিসপ্যাচ ও প্রাক-ডেলিভারি নোটিশ সরাসরি আপনার হোয়াটসঅ্যাপে' : 'Receive package dispatch notice directly on WhatsApp'}
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileForm.emailOrderUpdates}
                        onChange={(e) => setProfileForm({ ...profileForm, emailOrderUpdates: e.target.checked })}
                        className="w-4 h-4 rounded text-teal-900 border-stone-300 focus:ring-teal-900"
                      />
                      <div>
                        <span className="text-xs font-bold text-stone-800 block">
                          {language === 'BN' ? 'ইমেইল ইনভয়েস ও রসিদ' : 'Transactional Email & Invoices'}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          {language === 'BN' ? 'প্রতিটি অর্ডারের ভ্যাট ইনভয়েস ও রিটার্ন রিসিট ইমেইলে সংরক্ষিত থাকবে' : 'Detailed PDF VAT-compliant invoice and delivery confirmation sent to your inbox'}
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileForm.promotionalOffers}
                        onChange={(e) => setProfileForm({ ...profileForm, promotionalOffers: e.target.checked })}
                        className="w-4 h-4 rounded text-teal-900 border-stone-300 focus:ring-teal-900"
                      />
                      <div>
                        <span className="text-xs font-bold text-stone-800 block">
                          {language === 'BN' ? 'প্রমোশনাল ও বিশেষ অফার (BTRC সময়সূচি অনুযায়ী)' : 'Promotional & Seasonal Offers (BTRC Compliant)'}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          {language === 'BN' ? 'সকাল ৮টা থেকে রাত ১০টার মধ্যে এক্সক্লুসিভ ডিসকাউন্ট কুপন কোড পান' : 'Delivered only between 8:00 AM and 10:00 PM in accordance with BTRC regulations'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Language Preference Settings */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-teal-800" />
                    <h3 className="font-bold text-sm text-stone-900">
                      {language === 'BN' ? 'ল্যাঙ্গুয়েজ সেটিংস (Language Preferences)' : 'Language Preferences'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {language === 'BN' 
                      ? 'ওয়েবসাইট ব্যবহারের জন্য আপনার পছন্দের ভাষা নির্বাচন করুন।' 
                      : 'Choose your default language for browsing, orders, and receipts.'}
                  </p>
                  <div className="flex items-center gap-3 max-w-sm">
                    <button
                      type="button"
                      onClick={() => setLanguage('BN')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                        language === 'BN'
                          ? 'bg-teal-900 text-white border-teal-900 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      বাংলা (Bangla)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('EN')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                        language === 'EN'
                          ? 'bg-teal-900 text-white border-teal-900 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-teal-900 hover:bg-teal-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
                  >
                    Save Profile Settings
                  </button>
                </div>
              </form>

              {/* Password Change Section */}
              <div className="pt-6 border-t border-stone-200 space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-stone-600" />
                    <span>{language === 'BN' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Account Password'}</span>
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {language === 'BN' 
                      ? 'আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে নিয়মিত পাসওয়ার্ড পরিবর্তন করুন।' 
                      : 'Ensure your account security by updating your password regularly.'}
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md text-xs">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-900"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-900"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordChangeLoading}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    {passwordChangeLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-serif font-bold text-stone-900 mb-4">
              {editingAddressId ? 'Edit Shipping Address' : 'Add New Shipping Address'}
            </h3>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div className="flex gap-2">
                {(['Home', 'Office', 'Other'] as const).map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                    className={`flex-1 py-2 rounded-lg font-semibold border transition-all ${
                      addressForm.label === lbl
                        ? 'border-teal-900 bg-teal-900 text-white'
                        : 'border-stone-300 bg-stone-50 text-stone-700'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-stone-700 font-bold block mb-1">Recipient Name *</label>
                <input
                  type="text"
                  required
                  value={addressForm.recipientName}
                  onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                  placeholder="e.g. Tanzil Ahmed"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="+880 17XXXXXXXX"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    value={addressForm.altPhone}
                    onChange={(e) => setAddressForm({ ...addressForm, altPhone: e.target.value })}
                    placeholder="+880 18XXXXXXXX"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Division *</label>
                  <select
                    value={addressForm.division}
                    onChange={(e) => setAddressForm({ ...addressForm, division: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg"
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chattogram">Chattogram</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Barishal">Barishal</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                  </select>
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">District / City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    placeholder="e.g. Dhaka"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Thana / Upazila / Area *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.upazilaOrArea}
                    onChange={(e) => setAddressForm({ ...addressForm, upazilaOrArea: e.target.value })}
                    placeholder="e.g. Banani / Gulshan"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    placeholder="e.g. 1213"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-700 font-bold block mb-1">Detailed Street Address (Flat, House, Road) *</label>
                <textarea
                  rows={2}
                  required
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  placeholder="e.g. Flat 4B, House 18, Road 11, Block D"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-900 border-stone-300"
                />
                <span className="text-stone-700 font-semibold">Make this my default shipping address</span>
              </label>

              <div className="pt-4 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 text-stone-600 font-semibold hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-900 text-white font-semibold rounded-lg hover:bg-teal-950 shadow-xs"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN REQUEST (RMA) MODAL */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-serif font-bold text-stone-900 mb-1">
              Request Return or Exchange
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Order: <strong className="text-stone-800">{returnForm.orderNumber}</strong> • 7-Day Hassle-Free Policy
            </p>

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
              <div>
                <label className="text-stone-700 font-bold block mb-1">Item to Return / Exchange</label>
                <input
                  type="text"
                  disabled
                  value={returnForm.productTitle}
                  className="w-full p-2.5 bg-stone-100 border border-stone-300 rounded-lg text-stone-600 font-medium cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Reason for Return *</label>
                  <select
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value as any })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-medium"
                  >
                    <option value="SIZE_FIT_ISSUE">Size or Fit Issue</option>
                    <option value="DEFECTIVE_DAMAGED">Defective or Damaged</option>
                    <option value="WRONG_ITEM">Wrong Item Sent</option>
                    <option value="NOT_AS_DESCRIBED">Not as Described</option>
                    <option value="CHANGED_MIND">Changed Mind</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-700 font-bold block mb-1">Preferred Resolution *</label>
                  <select
                    value={returnForm.preferredResolution}
                    onChange={(e) => setReturnForm({ ...returnForm, preferredResolution: e.target.value as any })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-medium"
                  >
                    <option value="EXCHANGE">Size/Item Exchange</option>
                    <option value="STORE_CREDIT">Store Credit Points</option>
                    <option value="REFUND_ORIGINAL">Refund to Original Payment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-stone-700 font-bold block mb-1">Details & Feedback *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Please describe why you would like to return or exchange this item..."
                  value={returnForm.reasonDetails}
                  onChange={(e) => setReturnForm({ ...returnForm, reasonDetails: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
                <span className="font-bold text-stone-800 block">How it works:</span>
                <p>1. Our operations team reviews and approves your request within 24 hours.</p>
                <p>2. A courier pickup agent will collect the item from your doorstep in original tags/packaging.</p>
                <p>3. Replacement item dispatched or refund issued instantly upon pickup scan.</p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 text-stone-600 font-semibold hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-900 text-white font-semibold rounded-lg hover:bg-teal-950 shadow-xs"
                >
                  Submit RMA Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
