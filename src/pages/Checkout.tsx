import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, Banknote, ArrowLeft, CheckCircle, Smartphone, MapPin, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SslcommerzModal } from '../components/payment/SslcommerzModal';
import { BkashModal } from '../components/payment/BkashModal';

export function Checkout() {
  const { cart, cartSubtotal, siteContent, createOrder, clearCart, syncServerOrder, language, showToast, savedAddresses, customerProfile } = useApp();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(customerProfile ? customerProfile.name.split(' ')[0] : '');
  const [lastName, setLastName] = useState(customerProfile ? customerProfile.name.split(' ').slice(1).join(' ') : '');
  const [phone, setPhone] = useState(customerProfile ? customerProfile.phone : '');
  const [email, setEmail] = useState(customerProfile ? customerProfile.email : '');
  const [address, setAddress] = useState('');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [thana, setThana] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; description: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'SSLCOMMERZ' | 'BKASH'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Gateway modal states
  const [isSslModalOpen, setIsSslModalOpen] = useState(false);
  const [isBkashModalOpen, setIsBkashModalOpen] = useState(false);
  const [activeGatewayOrder, setActiveGatewayOrder] = useState<any>(null);

  // Fallback financial calculation
  const initialShipping = division === 'Dhaka' 
    ? (cartSubtotal >= siteContent.shippingFees.freeShippingThreshold ? 0 : siteContent.shippingFees.insideDhaka)
    : (cartSubtotal >= siteContent.shippingFees.freeShippingThreshold ? 0 : siteContent.shippingFees.outsideDhaka);

  const [shippingFee, setShippingFee] = useState<number>(initialShipping);
  const [discount, setDiscount] = useState<number>(0);

  // Sync shipping fee when division changes
  React.useEffect(() => {
    const fee = division === 'Dhaka'
      ? (cartSubtotal >= siteContent.shippingFees.freeShippingThreshold ? 0 : siteContent.shippingFees.insideDhaka)
      : (cartSubtotal >= siteContent.shippingFees.freeShippingThreshold ? 0 : siteContent.shippingFees.outsideDhaka);
    setShippingFee(fee);
  }, [division, cartSubtotal, siteContent.shippingFees]);

  const grandTotal = Math.max(0, cartSubtotal + shippingFee - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsRecalculating(true);
    setErrorMessage('');
    try {
      const valRes = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
          subtotal: cartSubtotal,
          shippingFee,
          customerPhone: phone.trim()
        })
      });
      const valData = await valRes.json();

      if (valData.success && valData.evaluation?.valid) {
        const evalRes = valData.evaluation;
        setAppliedCoupon({
          code: evalRes.code,
          discountAmount: evalRes.discountAmount,
          description: evalRes.description || 'Coupon Discount Applied'
        });
        setDiscount(evalRes.discountAmount);
        if (evalRes.adjustedShippingFee !== undefined) {
          setShippingFee(evalRes.adjustedShippingFee);
        }
        showToast(`Coupon "${evalRes.code}" applied! Saved ৳${evalRes.discountAmount.toLocaleString()}`);
      } else {
        setErrorMessage(valData.evaluation?.errorReason || valData.error || 'Invalid coupon code or conditions not met.');
      }
    } catch {
      // Local fallback calculation for coupon
      if (couponCode.toUpperCase() === 'KISHOLOY10') {
        const disc = Math.round(cartSubtotal * 0.1);
        setDiscount(disc);
        setAppliedCoupon({ code: 'KISHOLOY10', discountAmount: disc, description: '10% Heritage Discount' });
        showToast('Coupon "KISHOLOY10" applied successfully!');
      } else {
        setErrorMessage('Invalid coupon code.');
      }
    } finally {
      setIsRecalculating(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-serif font-black mb-3 text-stone-900 dark:text-slate-100">Your cart is empty</h2>
        <p className="text-xs text-stone-500 mb-6">Add authentic items to proceed with fast checkout.</p>
        <Link to="/shop" className="px-6 py-2.5 bg-teal-900 dark:bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-950 dark:hover:bg-teal-500 transition-colors shadow-xs">
          Browse Catalog &rarr;
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !phone.trim() || !address.trim() || !district.trim() || !thana.trim()) {
      setErrorMessage('Please fill in all mandatory shipping address fields.');
      return;
    }

    if (!phone.startsWith('01') && !phone.startsWith('+8801') && phone.length < 11) {
      setErrorMessage('Please enter a valid 11-digit Bangladeshi mobile number.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Try server-side authoritative order creation first
      const serverRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            phone: phone.trim(),
            email: email.trim() || undefined
          },
          shippingAddress: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            email: email.trim() || undefined,
            address: address.trim(),
            division,
            district: district.trim(),
            thana: thana.trim(),
            postalCode: postalCode.trim() || undefined,
            notes: notes.trim() || undefined
          },
          items: cart.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity
          })),
          paymentMethod,
          couponCode: appliedCoupon?.code,
          notes: notes.trim() || undefined
        })
      });

      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.success && serverData.order) {
          const sOrder = serverData.order;
          // Sync client context with server-created order
          syncServerOrder(sOrder);
          clearCart();

          // Check if online gateway flow required
          if (paymentMethod === 'SSLCOMMERZ') {
            setActiveGatewayOrder(sOrder);
            setIsSslModalOpen(true);
            return;
          } else if (paymentMethod === 'BKASH') {
            setActiveGatewayOrder(sOrder);
            setIsBkashModalOpen(true);
            return;
          }

          navigate(`/order-confirmation/${sOrder.id}`);
          return;
        }
      }

      // Fallback to client state manager if server is cold
      const orderItems = cart.map(item => ({
        productId: item.productId,
        title: item.title,
        titleBn: item.titleBn,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        sku: item.sku,
        variantName: item.variantName
      }));

      const newOrder = createOrder({
        customer: {
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined
        },
        shippingAddress: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim(),
          division,
          district: district.trim(),
          thana: thana.trim(),
          postalCode: postalCode.trim() || undefined,
          notes: notes.trim() || undefined
        },
        paymentMethod,
        items: orderItems,
        shippingFee,
        discount,
        notes: notes.trim() || undefined
      });

      if (paymentMethod === 'SSLCOMMERZ') {
        setActiveGatewayOrder(newOrder);
        setIsSslModalOpen(true);
        return;
      } else if (paymentMethod === 'BKASH') {
        setActiveGatewayOrder(newOrder);
        setIsBkashModalOpen(true);
        return;
      }

      navigate(`/order-confirmation/${newOrder.id}`);
    } catch {
      setErrorMessage('Failed to place order. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSslSuccess = async (valId: string, cardType: string) => {
    setIsSslModalOpen(false);
    if (!activeGatewayOrder) return;
    try {
      await fetch('/api/payments/sslcommerz/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          val_id: valId,
          tran_id: activeGatewayOrder.orderNumber,
          amount: activeGatewayOrder.total || grandTotal,
          card_type: cardType
        })
      });
      showToast('Payment verified successfully via SSLCOMMERZ!');
    } catch (e) {
      console.error(e);
    }
    navigate(`/order-confirmation/${activeGatewayOrder.id}`);
  };

  const handleBkashSuccess = async (trxId: string) => {
    setIsBkashModalOpen(false);
    if (!activeGatewayOrder) return;
    try {
      await fetch('/api/payments/bkash/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentID: `BK_${Date.now()}`,
          orderNumber: activeGatewayOrder.orderNumber,
          amount: activeGatewayOrder.total || grandTotal
        })
      });
      showToast('bKash Payment authorized and captured!');
    } catch (e) {
      console.error(e);
    }
    navigate(`/order-confirmation/${activeGatewayOrder.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-28 lg:pb-12">
      <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300 hover:text-teal-950 dark:hover:text-teal-200 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Shopping Cart</span>
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-widest mb-1">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit Encrypted Secure Checkout</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-stone-900 dark:text-slate-100 tracking-tight">
          {language === 'BN' ? 'অর্ডার চেকআউট ও পেমেন্ট' : 'Complete Your Order'}
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-300 text-xs sm:text-sm font-semibold rounded-2xl shadow-2xs">
          {errorMessage}
        </div>
      )}

      <form id="checkout-form" onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Checkout Steps Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Customer Contact */}
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-serif font-black text-stone-900 dark:text-slate-100 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-teal-900 text-white text-xs font-bold flex items-center justify-center font-sans">1</span>
              <span>Contact Information</span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 focus:bg-white font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">Last Name</label>
                <input
                  type="text"
                  placeholder="e.g. Uddin"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 focus:bg-white font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">Mobile Phone Number (For Courier SMS & Call) *</label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX or +8801XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 focus:bg-white font-mono font-bold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">Email Address (Optional for Invoice)</label>
                <input
                  type="email"
                  placeholder="rahim@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 focus:bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-serif font-black text-stone-900 dark:text-slate-100 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-teal-900 text-white text-xs font-bold flex items-center justify-center font-sans">2</span>
              <span>Delivery Address in Bangladesh</span>
            </h2>

            {/* Saved Addresses Quick Selector */}
            {savedAddresses && savedAddresses.length > 0 && (
              <div className="p-3.5 bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-stone-600 block uppercase tracking-wider">
                  {language === 'BN' ? 'সংরক্ষিত ঠিকানা থেকে বেছে নিন (Saved Addresses):' : 'Select from Saved Addresses:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setAddress(addr.addressLine);
                        setDivision(addr.division);
                        setDistrict(addr.district);
                        setThana(addr.upazilaOrArea);
                        if (addr.postalCode) setPostalCode(addr.postalCode);
                        if (addr.phone) setPhone(addr.phone);
                        if (addr.recipientName) {
                          const parts = addr.recipientName.split(' ');
                          setFirstName(parts[0] || '');
                          setLastName(parts.slice(1).join(' '));
                        }
                        showToast(`Filled address: ${addr.label} (${addr.recipientName})`);
                      }}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white dark:bg-slate-800 hover:border-teal-800 hover:bg-teal-50 text-stone-800 dark:text-slate-100 transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-teal-800" />
                      <span>{addr.label}:</span>
                      <span className="font-normal text-stone-600 truncate max-w-[160px]">{addr.addressLine}, {addr.district}</span>
                      {addr.isDefault && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-teal-100 text-teal-950 rounded-md font-bold">Default</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">House, Flat, Road, Area *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="House 12, Road 4, Sector 3, Uttara"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">Division *</label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 font-bold"
                >
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chittagong">Chittagong</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Khulna">Khulna</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Barisal">Barisal</option>
                  <option value="Rangpur">Rangpur</option>
                  <option value="Mymensingh">Mymensingh</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">District / City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka / Gazipur / Chittagong"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">Thana / Upazila *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gulshan, Mirpur, Panchlaish"
                  value={thana}
                  onChange={(e) => setThana(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">Postal Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1230"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 focus:bg-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">Order Notes (Optional instructions for courier)</label>
                <input
                  type="text"
                  placeholder="e.g. Please deliver after 4 PM"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900 focus:bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-3xl border border-stone-200/90 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-serif font-black text-stone-900 dark:text-slate-100 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-teal-900 text-white text-xs font-bold flex items-center justify-center font-sans">3</span>
              <span>Payment Method</span>
            </h2>

            <div className="space-y-3">
              <label
                onClick={() => setPaymentMethod('COD')}
                className={`flex items-start p-5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'COD' 
                    ? 'border-teal-900 dark:border-teal-500 bg-teal-50/50 dark:bg-teal-500/10 shadow-xs scale-101' 
                    : 'border-stone-200 hover:bg-stone-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 text-teal-900 focus:ring-teal-900 w-4 h-4"
                />
                <div className="ml-3.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-teal-800" />
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[10px] font-bold text-teal-950 bg-teal-100 dark:bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-500/30">
                      Most Popular
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Pay securely in cash when the courier delivery officer arrives at your doorstep.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod('SSLCOMMERZ')}
                className={`flex items-start p-5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'SSLCOMMERZ' 
                    ? 'border-teal-900 dark:border-teal-500 bg-teal-50/50 dark:bg-teal-500/10 shadow-xs scale-101' 
                    : 'border-stone-200 hover:bg-stone-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'SSLCOMMERZ'}
                  onChange={() => setPaymentMethod('SSLCOMMERZ')}
                  className="mt-1 text-teal-900 focus:ring-teal-900 w-4 h-4"
                />
                <div className="ml-3.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-teal-800" />
                      Online Payment (bKash / Nagad / Debit / Credit Cards)
                    </span>
                    <span className="text-[10px] font-bold text-stone-700 bg-stone-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">
                      Instant Gateway
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Secure 128-bit encrypted instant checkout via SSLCOMMERZ gateway.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/90 dark:border-slate-700 p-6 sm:p-7 space-y-6 shadow-sm sticky top-24">
            <h3 className="text-lg font-serif font-black text-stone-900 dark:text-slate-100">
              Review Your Order ({cart.length})
            </h3>

            <div className="divide-y divide-stone-100 dark:divide-slate-700 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center gap-3.5">
                  <img src={item.image} alt={item.title} className="w-14 h-14 rounded-2xl object-cover border border-stone-200 dark:border-slate-600 shrink-0 shadow-2xs" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-slate-100 truncate">{item.title}</h4>
                    <span className="text-[11px] text-stone-500 block mt-0.5 font-medium">Qty: {item.quantity} {item.variantName ? `• ${item.variantName}` : ''}</span>
                  </div>
                  <span className="text-xs font-black text-stone-900 dark:text-slate-100 font-mono">
                    ৳ {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">Have a Promo Coupon?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. KISHOLOY10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl uppercase tracking-wider font-bold focus:outline-none focus:ring-2 focus:ring-teal-900/30 focus:border-teal-900"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isRecalculating || !couponCode.trim()}
                  className="px-4 py-2.5 bg-stone-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs"
                >
                  {isRecalculating ? 'Verifying...' : 'Apply'}
                </button>
              </div>
              {appliedCoupon && (
                <span className="text-[11px] text-emerald-700 font-bold block mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {appliedCoupon.description} applied
                </span>
              )}
            </div>

            {/* Calculations */}
            <div className="pt-4 border-t border-stone-100 dark:border-slate-700 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-bold text-stone-900 font-mono">৳ {cartSubtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount</span>
                  <span className="font-mono">- ৳ {discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Shipping ({division === 'Dhaka' ? 'Inside Dhaka' : 'Nationwide'})</span>
                <span className="font-bold text-stone-900 font-mono">
                  {shippingFee === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `৳ ${shippingFee}`}
                </span>
              </div>
              <div className="pt-3 border-t border-stone-200 dark:border-slate-700 flex justify-between items-baseline">
                <span className="font-black text-stone-900 dark:text-slate-100 text-base font-serif">Total Due</span>
                <span className="font-black text-2xl text-stone-900 dark:text-slate-100 font-mono">৳ {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-5 bg-teal-900 dark:bg-teal-600 text-white font-bold rounded-2xl text-sm hover:bg-teal-950 dark:hover:bg-teal-500 active:scale-98 transition-all shadow-xs hover:shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 text-teal-300" />
              <span>{isSubmitting ? 'Processing Order...' : `Confirm Order (৳ ${grandTotal.toLocaleString()})`}</span>
            </button>

            <p className="text-[11px] text-stone-500 text-center leading-relaxed">
              By confirming, you agree to Kisholoy's <Link to="/pages/terms" className="underline hover:text-stone-900">Terms of Service</Link> and <Link to="/pages/returns" className="underline hover:text-stone-900">Return Policy</Link>.
            </p>
          </div>
        </div>
      </form>

      {/* SSLCOMMERZ Gateway Modal */}
      {isSslModalOpen && activeGatewayOrder && (
        <SslcommerzModal
          isOpen={isSslModalOpen}
          onClose={() => {
            setIsSslModalOpen(false);
            navigate(`/order-confirmation/${activeGatewayOrder.id}`);
          }}
          orderNumber={activeGatewayOrder.orderNumber}
          amount={activeGatewayOrder.total || grandTotal}
          customerName={activeGatewayOrder.customer.name}
          onSuccess={handleSslSuccess}
          onFailure={(reason) => {
            setIsSslModalOpen(false);
            showToast(`Gateway Error: ${reason}`, 'info');
            navigate(`/order-confirmation/${activeGatewayOrder.id}`);
          }}
        />
      )}

      {/* bKash Direct Checkout Modal */}
      {isBkashModalOpen && activeGatewayOrder && (
        <BkashModal
          isOpen={isBkashModalOpen}
          onClose={() => {
            setIsBkashModalOpen(false);
            navigate(`/order-confirmation/${activeGatewayOrder.id}`);
          }}
          orderNumber={activeGatewayOrder.orderNumber}
          amount={activeGatewayOrder.total || grandTotal}
          customerPhone={activeGatewayOrder.customer.phone}
          onSuccess={handleBkashSuccess}
          onFailure={(reason) => {
            setIsBkashModalOpen(false);
            showToast(`bKash Error: ${reason}`, 'info');
            navigate(`/order-confirmation/${activeGatewayOrder.id}`);
          }}
        />
      )}
      {/* Mobile sticky confirm bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-stone-200 dark:border-slate-700 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex flex-col min-w-0 shrink-0">
            <span className="text-[10px] text-stone-500 dark:text-slate-400">{language === 'BN' ? 'মোট প্রদেয়' : 'Total Due'}</span>
            <span className="text-lg font-black text-stone-900 dark:text-slate-100 font-mono">৳ {grandTotal.toLocaleString()}</span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 py-3 px-3 bg-teal-900 dark:bg-teal-600 hover:bg-teal-950 dark:hover:bg-teal-500 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4 text-teal-300" />
            <span className="truncate">{isSubmitting ? 'Processing...' : (language === 'BN' ? 'অর্ডার নিশ্চিত করুন' : 'Confirm Order')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
