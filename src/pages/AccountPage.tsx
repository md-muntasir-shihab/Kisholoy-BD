import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  User, Package, MapPin, Phone, Mail, Clock, ChevronRight, ExternalLink, 
  Heart, Gift, RotateCcw, Plus, Trash2, Edit3, Check, Star, 
  ShieldCheck, AlertCircle, ShoppingBag, Copy, ArrowRight, CheckCircle2,
  Calendar, Award, Sparkles, Building, Home, HelpCircle, Truck,
  Bell, MessageCircle, Smartphone, CheckCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomerAddress, WishlistItem, CustomerReturnRequest, LoyaltyTier } from '../types';

export function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'orders';

  const { 
    orders, 
    language, 
    currentCustomerId, 
    setCurrentCustomerId,
    customerProfile, 
    savedAddresses, 
    wishlist, 
    returnRequests, 
    customerLoyalty,
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

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses' | 'loyalty' | 'returns' | 'notifications' | 'profile'>(
    ['orders', 'wishlist', 'addresses', 'loyalty', 'returns', 'notifications', 'profile'].includes(initialTab) ? initialTab : 'orders'
  );

  // Sync tab with URL search parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['orders', 'wishlist', 'addresses', 'loyalty', 'returns', 'notifications', 'profile'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'orders' | 'wishlist' | 'addresses' | 'loyalty' | 'returns' | 'notifications' | 'profile') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

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

  const copyReferralCode = () => {
    if (customerLoyalty?.referralCode) {
      navigator.clipboard?.writeText(customerLoyalty.referralCode);
      showToast(`Referral code "${customerLoyalty.referralCode}" copied to clipboard!`);
    }
  };

  const tierBadgeColor = (tier?: LoyaltyTier) => {
    switch (tier) {
      case 'PLATINUM': return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'GOLD': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'SILVER': return 'bg-slate-100 text-slate-800 border-slate-300';
      default: return 'bg-orange-100 text-orange-900 border-orange-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Top Banner: Persona Switcher for verification */}
      <div className="mb-8 p-4 bg-stone-100/90 border border-stone-300/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-900 text-white shadow-xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-900">
              {language === 'BN' ? 'গ্রাহক অ্যাকাউন্ট ও সেলফ-সার্ভিস পোর্টাল' : 'Customer Account & Self-Service Portal'}
            </h1>
            <p className="text-xs text-stone-600">
              {language === 'BN' 
                ? 'আপনার অর্ডার ট্র্যাকিং, সংরক্ষিত ডেলিভারি ঠিকানা, উইশলিস্ট ও লয়্যালটি রিওয়ার্ডস পরিচালনা করুন।'
                : 'Manage order tracking, multi-address book, curated wishlist, and loyalty club cash points.'}
            </p>
          </div>
        </div>

        {/* Demo persona toggle */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 font-medium">Demo Customer:</span>
          <select
            value={currentCustomerId}
            onChange={(e) => {
              setCurrentCustomerId(e.target.value);
              showToast(`Switched customer to ${e.target.value === 'cust-1' ? 'Tanzil Ahmed' : 'Nusrat Jahan'}`);
            }}
            className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:border-teal-900 shadow-2xs"
          >
            <option value="cust-1">Tanzil Ahmed (Gold VIP Tier)</option>
            <option value="cust-2">Nusrat Jahan (Silver VIP Tier)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar Profile Card */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            
            {/* Customer Avatar & Tier */}
            <div className="flex items-center gap-3 pb-6 border-b border-stone-200">
              <div className="w-14 h-14 rounded-2xl bg-teal-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                {customerProfile?.name ? customerProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'KH'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-stone-900 truncate">
                    {customerProfile?.name || 'Customer Account'}
                  </h2>
                </div>
                <span className="text-xs text-stone-500 font-mono block truncate">
                  {customerProfile?.phone || '+880 17XXXXXXXX'}
                </span>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierBadgeColor(customerLoyalty?.tier || customerProfile?.tier)}`}>
                    <Sparkles className="w-2.5 h-2.5" />
                    {customerLoyalty?.tier || customerProfile?.tier || 'BRONZE'} VIP
                  </span>
                  <span className="text-[11px] font-bold text-teal-900">
                    ৳{customerLoyalty?.pointsBalance || 0} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1.5">
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
                  {language === 'BN' ? 'সংরক্ষিত উইশলিস্ট' : 'My Wishlist'}
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
                onClick={() => handleTabChange('loyalty')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'loyalty'
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Gift className="w-4 h-4" />
                  {language === 'BN' ? 'লয়্যালটি ও পুরস্কার' : 'Loyalty & Rewards'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'loyalty' ? 'bg-teal-800 text-white' : 'bg-amber-100 text-amber-900'
                }`}>
                  {customerLoyalty?.pointsBalance || 0} pts
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

        {/* Right Main Content */}
        <main className="flex-1 min-w-0">
          
          {/* TAB 1: ORDERS DESK */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">
                    {language === 'BN' ? 'অর্ডার হিস্ট্রি ও ডেলিভারি স্ট্যাটাস' : 'Order History & Delivery Status'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'BN' 
                      ? 'আপনার সমস্ত বর্তমান ও অতীতের অর্ডারসমূহ এবং লাইভ ট্র্যাকিং তথ্য।'
                      : 'Real-time order statuses, courier tracking links, and easy return requests.'}
                  </p>
                </div>
                <Link
                  to="/shop"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{language === 'BN' ? 'কেনাকাটা করুন' : 'Continue Shopping'}</span>
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">
                    {language === 'BN' ? 'কোনো অর্ডার পাওয়া যায়নি' : 'No Orders Found'}
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    {language === 'BN' ? 'আপনি এখনো কোনো অর্ডার করেননি।' : 'You have not placed any orders yet. Explore our handcrafted collections today.'}
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-900 text-white rounded-xl text-xs font-semibold hover:bg-teal-950"
                  >
                    <span>Browse Collection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-teal-950 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs text-stone-400 font-medium">
                              {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500">
                            Payment: <span className="font-semibold text-stone-800">{order.paymentMethod}</span> ({order.paymentStatus}) • {order.items.length} item(s)
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            order.orderStatus === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : order.orderStatus === 'SHIPPED'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : order.orderStatus === 'PROCESSING'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}>
                            {order.orderStatus}
                          </span>
                          <span className="text-base font-bold text-stone-900 font-mono">
                            ৳ {order.total.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="space-y-2.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-stone-50 transition-colors">
                            <img 
                              src={item.image} 
                              alt={item.title} 
                              className="w-12 h-12 rounded-lg object-cover border border-stone-200/80 bg-stone-100 flex-shrink-0" 
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-stone-900 text-xs sm:text-sm block truncate">
                                {item.title}
                              </span>
                              <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                                <span>Qty: <strong className="text-stone-800">{item.quantity}</strong></span>
                                <span>•</span>
                                <span>৳ {item.price.toLocaleString()} each</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-stone-900 font-mono">
                              ৳ {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery address & Courier Info */}
                      <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-stone-600">
                          <Truck className="w-4 h-4 text-teal-800 flex-shrink-0" />
                          <span>
                            Courier: <strong>{order.courier.provider}</strong>
                            {order.courier.trackingId ? (
                              <span className="font-mono ml-1 text-teal-900 font-bold">({order.courier.trackingId})</span>
                            ) : (
                              <span className="text-stone-400 ml-1">(Preparing dispatch)</span>
                            )}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* RMA Trigger */}
                          <button
                            onClick={() => openReturnModalForOrder(order)}
                            className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-medium flex items-center gap-1.5 transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                            <span>Return / Exchange</span>
                          </button>

                          {/* Tracking Link */}
                          <Link
                            to={`/track-order?order=${order.orderNumber}`}
                            className="px-3.5 py-1.5 rounded-lg bg-teal-900 text-white hover:bg-teal-950 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
                          >
                            <span>Live Track</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>

                    </div>
                  ))}
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
                    {language === 'BN' ? 'আমার পছন্দের তালিকা (Wishlist)' : 'My Curated Wishlist'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'BN'
                      ? 'আপনার ভবিষ্যতের ক্রয়ের জন্য সংরক্ষিত প্রিয় পণ্যসমূহ।'
                      : 'Saved items to buy later. Move directly to your cart at any time.'}
                  </p>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {wishlist.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-500">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">
                    {language === 'BN' ? 'আপনার উইশলিস্ট খালি' : 'Your Wishlist is Empty'}
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    {language === 'BN' 
                      ? 'পণ্য ব্রাউজ করার সময় হার্ট আইকনে ক্লিক করে পছন্দের তালিকায় সংরক্ষণ করুন।'
                      : 'Save your favorite heritage sarees, organic pantry items, and artisanal handicrafts to buy whenever ready.'}
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-900 text-white rounded-xl text-xs font-semibold hover:bg-teal-950"
                  >
                    <span>Explore Products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {wishlist.map((item) => {
                    const fullProd = products.find(p => p.id === item.productId);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-square bg-stone-100 overflow-hidden">
                            <img 
                              src={item.image} 
                              alt={item.productTitle} 
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform" 
                            />
                            <button
                              onClick={() => toggleWishlist(item.productId)}
                              className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-rose-50 text-rose-600 rounded-full shadow-xs transition-colors"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-3 left-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 text-stone-800 border border-stone-200">
                                {item.category}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 space-y-2">
                            <Link to={`/product/${fullProd?.slug || item.productId}`} className="hover:text-teal-900">
                              <h3 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                                {language === 'BN' && item.productTitleBn ? item.productTitleBn : item.productTitle}
                              </h3>
                            </Link>

                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-bold text-stone-900 font-mono">
                                ৳ {item.price.toLocaleString()}
                              </span>
                              {item.originalPrice && (
                                <span className="text-xs text-stone-400 line-through font-mono">
                                  ৳ {item.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <button
                            onClick={() => {
                              if (fullProd) {
                                addToCart(fullProd, 1);
                                showToast(`Added "${item.productTitle}" to cart!`);
                              }
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs active:scale-98 transition-all"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{language === 'BN' ? 'কার্টে যোগ করুন' : 'Move to Cart'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">
                    {language === 'BN' ? 'সংরক্ষিত ডেলিভারি ঠিকানা' : 'Saved Delivery Addresses'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {language === 'BN' 
                      ? 'চেকআউটের সময় ১-ক্লিকে ব্যবহারের জন্য আপনার ঠিকানা সংরক্ষণ করুন।'
                      : 'Store multiple home, office, and regional addresses for fast 1-click checkout.'}
                  </p>
                </div>
                <button
                  onClick={() => openAddressModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-900 text-white rounded-xl text-xs font-semibold hover:bg-teal-950 shadow-2xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'BN' ? 'নতুন ঠিকানা যোগ করুন' : 'Add New Address'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                      addr.isDefault ? 'border-teal-800 ring-1 ring-teal-800' : 'border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg ${
                            addr.label === 'Home' ? 'bg-teal-50 text-teal-900' : addr.label === 'Office' ? 'bg-blue-50 text-blue-900' : 'bg-stone-100 text-stone-800'
                          }`}>
                            {addr.label === 'Home' ? <Home className="w-3.5 h-3.5" /> : addr.label === 'Office' ? <Building className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                          </span>
                          <span className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                            {addr.label}
                          </span>
                        </div>

                        {addr.isDefault ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900">
                            <Check className="w-3 h-3" />
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => setDefaultAddress(addr.id)}
                            className="text-[11px] font-semibold text-stone-500 hover:text-teal-900"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-stone-900">{addr.recipientName}</h3>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">{addr.addressLine}</p>
                      <p className="text-xs text-stone-600">
                        {addr.upazilaOrArea ? `${addr.upazilaOrArea}, ` : ''}{addr.district} - {addr.postalCode || '1200'}, {addr.division}
                      </p>
                      <p className="text-xs text-stone-700 font-mono mt-2 font-medium">
                        Phone: {addr.phone}
                        {addr.altPhone && <span className="text-stone-400"> • Alt: {addr.altPhone}</span>}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openAddressModal(addr)}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this address?')) {
                            deleteAddress(addr.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LOYALTY CLUB & CASH POINTS */}
          {activeTab === 'loyalty' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900">
                  {language === 'BN' ? 'কিশলয় লয়্যালটি ক্লাব ও রিওয়ার্ডস' : 'KISHOLOY VIP Loyalty Club'}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {language === 'BN' 
                    ? 'প্রতিটি কেনাকাটায় পয়েন্ট অর্জন করুন এবং পরবর্তী অর্ডারে সরাসরি টাকা হিসেবে ব্যবহার করুন (১ পয়েন্ট = ১ টাকা)।'
                    : 'Earn authoritative reward points on every order. 1 Point = ৳ 1 BDT cash credit at checkout.'}
                </p>
              </div>

              {/* VIP Membership Card */}
              <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-stone-900 via-teal-950 to-stone-900 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-teal-600/10 blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-teal-300 font-bold block mb-1">
                      KISHOLOY PRIVILEGE CLUB
                    </span>
                    <h3 className="text-2xl font-serif font-bold">{customerProfile?.name}</h3>
                    <span className="text-xs text-stone-400 font-mono">Member ID: {customerProfile?.id}</span>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-xs text-stone-400 block mb-1">Current VIP Status</span>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-stone-950 shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      {customerLoyalty?.tier || 'GOLD'} TIER
                    </span>
                    <span className="text-[11px] text-teal-300 block mt-1 font-mono">
                      {customerLoyalty?.tier === 'PLATINUM' ? '2.0x' : customerLoyalty?.tier === 'GOLD' ? '1.5x' : customerLoyalty?.tier === 'SILVER' ? '1.2x' : '1.0x'} Points Multiplier
                    </span>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                  <div>
                    <span className="text-xs text-stone-400 block">Available Points</span>
                    <span className="text-2xl font-bold font-mono text-amber-300">
                      {customerLoyalty?.pointsBalance || 0}
                    </span>
                    <span className="text-[10px] text-stone-400 block">Worth ৳{customerLoyalty?.pointsBalance || 0} BDT</span>
                  </div>

                  <div>
                    <span className="text-xs text-stone-400 block">Lifetime Earned</span>
                    <span className="text-2xl font-bold font-mono text-white">
                      {customerLoyalty?.lifetimePointsEarned || 0}
                    </span>
                    <span className="text-[10px] text-stone-400 block">Total rewards</span>
                  </div>

                  <div>
                    <span className="text-xs text-stone-400 block">Points Redeemed</span>
                    <span className="text-2xl font-bold font-mono text-white">
                      {customerLoyalty?.lifetimePointsRedeemed || 0}
                    </span>
                    <span className="text-[10px] text-stone-400 block">Savings realized</span>
                  </div>

                  <div>
                    <span className="text-xs text-stone-400 block">Next Tier Progress</span>
                    <div className="w-full bg-stone-800 rounded-full h-2 mt-2">
                      <div className="bg-amber-400 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-[10px] text-teal-300 block mt-1">75% to Platinum VIP</span>
                  </div>
                </div>
              </div>

              {/* Referral Code Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-teal-900" />
                    <h3 className="font-bold text-sm text-stone-900">Invite Friends & Family</h3>
                  </div>
                  <p className="text-xs text-stone-500">
                    Share your unique referral code. When a friend places their first order, both of you receive <strong>৳ 100 bonus points</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-200">
                  <span className="px-3 py-1 font-mono font-bold text-xs text-teal-950">
                    {customerLoyalty?.referralCode || 'TANZIL-KISHOLOY'}
                  </span>
                  <button
                    onClick={copyReferralCode}
                    className="p-2 rounded-lg bg-teal-900 hover:bg-teal-950 text-white shadow-2xs transition-colors"
                    title="Copy referral code"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Points History Ledger */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <span>Points Transaction History</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500">
                        <th className="py-2.5 font-semibold">Date</th>
                        <th className="py-2.5 font-semibold">Activity</th>
                        <th className="py-2.5 font-semibold">Reference</th>
                        <th className="py-2.5 font-semibold text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono">
                      {customerLoyalty?.transactions && customerLoyalty.transactions.length > 0 ? (
                        customerLoyalty.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-stone-50">
                            <td className="py-3 text-stone-500">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 font-sans font-medium text-stone-800">
                              {tx.description}
                            </td>
                            <td className="py-3 text-stone-500">
                              {tx.orderNumber || '-'}
                            </td>
                            <td className={`py-3 text-right font-bold ${
                              tx.points > 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {tx.points > 0 ? `+${tx.points}` : tx.points}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-stone-400 font-sans">
                            No loyalty point transactions yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RETURNS & RMA */}
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
                          <span className="font-mono font-bold text-xs text-teal-950 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                            {req.requestNumber}
                          </span>
                          <span className="text-xs text-stone-500 ml-2">
                            Order: <strong>{req.orderNumber}</strong> • {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          req.status === 'APPROVED' 
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : req.status === 'RESOLVED'
                            ? 'bg-teal-50 text-teal-900 border-teal-300'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-900 border-rose-300'
                            : 'bg-amber-50 text-amber-900 border-amber-300'
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

          {/* TAB 6: NOTIFICATIONS & ALERTS */}
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
                            : 'bg-teal-50/40 border-teal-200 text-stone-900 shadow-2xs'
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
                                <Bell className="w-4 h-4" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-stone-900">
                                  {language === 'BN' ? notif.titleBn : notif.title}
                                </h4>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                                )}
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-stone-100 text-stone-600">
                                  {notif.channel}
                                </span>
                              </div>

                              <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
                                {language === 'BN' ? notif.messageBn : notif.message}
                              </p>

                              <div className="flex items-center gap-4 pt-1 text-[11px] text-stone-400">
                                <span className="flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3" />
                                  {new Date(notif.createdAt).toLocaleString(language === 'BN' ? 'bn-BD' : 'en-US', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })}
                                </span>
                                {notif.orderNumber && (
                                  <span className="font-mono text-stone-600">
                                    Order: {notif.orderNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {notif.actionUrl && (
                              <Link
                                to={notif.actionUrl}
                                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-[11px] font-semibold transition-colors"
                              >
                                {language === 'BN' ? 'বিস্তারিত' : 'View'}
                              </Link>
                            )}
                            {!notif.isRead && (
                              <button
                                onClick={() => markCustomerNotificationRead(notif.id)}
                                className="p-1.5 text-stone-400 hover:text-teal-900 rounded"
                                title="Mark as read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900">
                  {language === 'BN' ? 'ব্যক্তিগত তথ্য ও প্রোফাইল সেটিংস' : 'Personal Information & Preferences'}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {language === 'BN' ? 'আপনার নাম, যোগাযোগ তথ্য এবং বিজ্ঞপ্তি সেটিংস হালনাগাদ করুন।' : 'Update your personal details and delivery notification preferences.'}
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-teal-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1.5">Primary Mobile Number</label>
                    <input
                      type="text"
                      disabled
                      value={customerProfile?.phone || '+880 1712345678'}
                      className="w-full p-2.5 bg-stone-100 border border-stone-300 rounded-xl text-stone-500 font-mono cursor-not-allowed"
                    />
                    <span className="text-[10px] text-stone-400 mt-1 block">Registered identifier (locked for security)</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-teal-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1.5">Alternative Mobile (Optional)</label>
                    <input
                      type="tel"
                      placeholder="+880 18XXXXXXXX"
                      value={profileForm.alternatePhone}
                      onChange={(e) => setProfileForm({ ...profileForm, alternatePhone: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-teal-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-teal-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1.5">Gender</label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value as any })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-teal-800"
                    >
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Notifications & Language preferences */}
                <div className="pt-6 border-t border-stone-200 space-y-4">
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Notification & Language Preferences
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
                          {language === 'BN' ? 'এসএমএস কুরিয়ার ট্র্যাকিং আপডেট' : 'SMS Courier Tracking Updates'}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          {language === 'BN' ? 'পার্সেল বুকিং, ট্র্যাকিং নম্বর এবং পিকআপের তাৎক্ষণিক এসএমএস পান' : 'Instant SMS when order is booked with Steadfast/Pathao with live tracking code'}
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
                          {language === 'BN' ? 'হোয়াটসঅ্যাপ ইন্টারেক্টিভ নোটিফিকেশন' : 'WhatsApp Interactive Notifications'}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          {language === 'BN' ? 'হোয়াটসঅ্যাপে অর্ডারের ছবি, কুরিয়ার লিংক এবং সরাসরি বাটন আপডেট পান' : 'Rich updates with order invoice PDF, dispatch photos, and quick tracking buttons'}
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
                          {language === 'BN' ? 'ভিআইপি ও প্রমোশনাল অফার (BTRC সময়সূচি অনুযায়ী)' : 'VIP Promotions & Vouchers (BTRC Compliant)'}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          {language === 'BN' ? 'সকাল ৮টা থেকে রাত ১০টার মধ্যে এক্সক্লুসিভ ডিসকাউন্ট কুপন কোড পান' : 'Delivered only between 8:00 AM and 10:00 PM in accordance with BTRC regulations'}
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileForm.newsletterSubscribed}
                        onChange={(e) => setProfileForm({ ...profileForm, newsletterSubscribed: e.target.checked })}
                        className="w-4 h-4 rounded text-teal-900 border-stone-300 focus:ring-teal-900"
                      />
                      <div>
                        <span className="text-xs font-bold text-stone-800 block">
                          {language === 'BN' ? 'কিশলয় হেরিটেজ ডাইজেস্ট' : 'Kisholoy Artisanal Heritage Digest'}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          {language === 'BN' ? 'ঐতিহ্যবাহী তাঁত ও কারুশিল্পের গল্প এবং নতুন কালেকশনের সাপ্তাহিক সংকলন' : 'Weekly curation of artisanal stories, craft history, and seasonal collection previews'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-teal-900 hover:bg-teal-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
                  >
                    Save Profile Settings
                  </button>
                </div>
              </form>
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
