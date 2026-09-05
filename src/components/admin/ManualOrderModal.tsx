import React, { useState, useMemo } from 'react';
import { 
  X, ShoppingBag, Plus, Trash2, Phone, MessageSquare, 
  Send, CheckCircle2, AlertTriangle, ShieldCheck, Truck, 
  DollarSign, Sparkles, User, MapPin, Copy, ExternalLink,
  MessageCircle, Building2, HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderSourceChannel, Product, Customer } from '../../types';
import { useModalA11y } from '../../hooks/useModalA11y';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (order: Order) => void;
  initialChannel?: OrderSourceChannel;
  defaultChannel?: OrderSourceChannel;
  initialCustomerPhone?: string;
}

const BANGLADESH_DISTRICTS = [
  { name: 'Dhaka', division: 'Dhaka', defaultFee: 70 },
  { name: 'Gazipur', division: 'Dhaka', defaultFee: 130 },
  { name: 'Narayanganj', division: 'Dhaka', defaultFee: 130 },
  { name: 'Chittagong', division: 'Chittagong', defaultFee: 130 },
  { name: 'Cox\'s Bazar', division: 'Chittagong', defaultFee: 150 },
  { name: 'Sylhet', division: 'Sylhet', defaultFee: 130 },
  { name: 'Rajshahi', division: 'Rajshahi', defaultFee: 130 },
  { name: 'Khulna', division: 'Khulna', defaultFee: 130 },
  { name: 'Barisal', division: 'Barisal', defaultFee: 130 },
  { name: 'Rangpur', division: 'Rangpur', defaultFee: 130 },
  { name: 'Mymensingh', division: 'Mymensingh', defaultFee: 130 },
  { name: 'Comilla', division: 'Chittagong', defaultFee: 130 },
  { name: 'Bogra', division: 'Rajshahi', defaultFee: 130 },
  { name: 'Jessore', division: 'Khulna', defaultFee: 130 },
  { name: 'Tangail', division: 'Dhaka', defaultFee: 130 },
  { name: 'Faridpur', division: 'Dhaka', defaultFee: 130 },
  { name: 'Pabna', division: 'Rajshahi', defaultFee: 130 },
  { name: 'Dinajpur', division: 'Rangpur', defaultFee: 130 },
  { name: 'Kushtia', division: 'Khulna', defaultFee: 130 },
  { name: 'Feni', division: 'Chittagong', defaultFee: 130 },
  { name: 'Noakhali', division: 'Chittagong', defaultFee: 130 },
  { name: 'Brahmanbaria', division: 'Chittagong', defaultFee: 130 },
  { name: 'Moulvibazar', division: 'Sylhet', defaultFee: 130 },
  { name: 'Habiganj', division: 'Sylhet', defaultFee: 130 },
  { name: 'Sunamganj', division: 'Sylhet', defaultFee: 150 },
  { name: 'Bandarban', division: 'Chittagong', defaultFee: 150 },
  { name: 'Rangamati', division: 'Chittagong', defaultFee: 150 },
  { name: 'Khagrachhari', division: 'Chittagong', defaultFee: 150 },
  { name: 'Bhola', division: 'Barisal', defaultFee: 150 }
];

export function ManualOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
  initialChannel,
  defaultChannel,
  initialCustomerPhone = ''
}: ManualOrderModalProps) {
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: isOpen,
    onClose,
    label: 'Manual Order',
  });

  const { products, customers, createOrder, currentRole, language, showToast, customCouriers } = useApp();
  const isBn = language === 'BN';

  // 1. Channel Info
  const [channel, setChannel] = useState<OrderSourceChannel>(defaultChannel || initialChannel || 'WHATSAPP');
  const [socialHandle, setSocialHandle] = useState('');
  const [operatorName, setOperatorName] = useState('Sales Desk Agent');
  const [chatNotes, setChatNotes] = useState('');

  // 2. Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [customerEmail, setCustomerEmail] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);

  // 3. Shipping Info
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [division, setDivision] = useState('Dhaka');
  const [thana, setThana] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('Steadfast');

  // 4. Order Items
  interface SelectedItem {
    productId: string;
    productTitle: string;
    productTitleBn?: string;
    sku: string;
    image: string;
    unitPrice: number;
    originalPrice: number;
    quantity: number;
    stock: number;
    variantName?: string;
  }
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [addQuantity, setAddQuantity] = useState<number>(1);

  // 5. Financials & Advance
  const [shippingFee, setShippingFee] = useState<number>(70);
  const [discount, setDiscount] = useState<number>(0);
  const [hasAdvancePayment, setHasAdvancePayment] = useState<boolean>(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(200);
  const [advanceMethod, setAdvanceMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CASH'>('BKASH');
  const [advanceTrxId, setAdvanceTrxId] = useState<string>('');
  const [advanceNotes, setAdvanceNotes] = useState<string>('');

  // 6. UI & Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderSummary, setCreatedOrderSummary] = useState<Order | null>(null);
  const [copiedWhatsAppMsg, setCopiedWhatsAppMsg] = useState(false);

  // Auto-fill customer if phone matches
  const handlePhoneChange = (phoneVal: string) => {
    setCustomerPhone(phoneVal);
    const cleanPhone = phoneVal.replace(/[^0-9+]/g, '');
    if (cleanPhone.length >= 10) {
      const match = customers.find(c => c.phone.includes(cleanPhone) || cleanPhone.includes(c.phone));
      if (match) {
        setMatchedCustomer(match);
        if (!customerName) setCustomerName(match.name);
        if (!customerEmail && match.email) setCustomerEmail(match.email);
        if (match.defaultAddress && !address) {
          setAddress(match.defaultAddress);
        }
      } else {
        setMatchedCustomer(null);
      }
    } else {
      setMatchedCustomer(null);
    }
  };

  // Auto set delivery charge when district changes
  const handleDistrictChange = (distName: string) => {
    setDistrict(distName);
    const found = BANGLADESH_DISTRICTS.find(d => d.name.toLowerCase() === distName.toLowerCase());
    if (found) {
      setDivision(found.division);
      setShippingFee(found.defaultFee);
    } else {
      setShippingFee(distName.toLowerCase() === 'dhaka' ? 70 : 130);
    }
  };

  // Add Item
  const handleAddItem = () => {
    if (!selectedProductToAdd) return;

    let title = selectedProductToAdd.title;
    let price = selectedProductToAdd.price;
    let sku = selectedProductToAdd.sku;
    let variantName = undefined;
    let availableStock = selectedProductToAdd.stock;

    if (selectedVariantId && selectedProductToAdd.variants) {
      const v = selectedProductToAdd.variants.find(item => item.id === selectedVariantId);
      if (v) {
        variantName = v.name;
        price = v.price;
        sku = v.sku;
        availableStock = v.stock;
      }
    }

    const existingIndex = items.findIndex(it => it.productId === selectedProductToAdd.id && it.variantName === variantName);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += addQuantity;
      setItems(updated);
    } else {
      setItems(prev => [
        ...prev,
        {
          productId: selectedProductToAdd.id,
          productTitle: title,
          productTitleBn: selectedProductToAdd.titleBn,
          sku,
          image: selectedProductToAdd.images?.[0] || 'https://images.unsplash.com/photo-1594631252845-29fc4cc8c0a1?auto=format&fit=crop&q=80&w=200',
          unitPrice: price,
          originalPrice: price,
          quantity: addQuantity,
          stock: availableStock,
          variantName
        }
      ]);
    }

    setSelectedProductToAdd(null);
    setSelectedVariantId('');
    setProductSearch('');
    setAddQuantity(1);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update Item Quantity
  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: newQty } : item));
  };

  // Update Item Custom Negotiated Price
  const handleUpdateCustomPrice = (index: number, newPrice: number) => {
    if (newPrice < 0) return;
    setItems(prev => prev.map((item, i) => i === index ? { ...item, unitPrice: newPrice } : item));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + Number(shippingFee) - Number(discount));
  }, [subtotal, shippingFee, discount]);

  const actualAdvance = hasAdvancePayment ? Math.min(grandTotal, Number(advanceAmount)) : 0;
  const balanceDueCod = Math.max(0, grandTotal - actualAdvance);

  // Formatted WhatsApp Receipt Text Generator
  const generateWhatsAppMessage = (orderNum: string) => {
    const itemsListText = items.map((it, idx) => 
      `${idx + 1}. *${it.productTitle}* ${it.variantName ? `(${it.variantName})` : ''} - ${it.quantity}x @ ৳${it.unitPrice.toLocaleString()} = ৳${(it.unitPrice * it.quantity).toLocaleString()}`
    ).join('\n');

    return `🌸 *কিশলয় (KISHOLOY) অর্ডার কনফার্মেশন* 🌸
প্রিয় ${customerName || 'গ্রাহক'},
আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে! 🌿

📋 *অর্ডার নম্বর:* ${orderNum}
📅 *তারিখ:* ${new Date().toLocaleDateString('bn-BD')}
🛍️ *অর্ডারের আইটেম:*
${itemsListText}

💰 *পণ্যের মোট মূল্য:* ৳${subtotal.toLocaleString()}
🚚 *ডেলিভারি চার্জ:* ৳${Number(shippingFee).toLocaleString()}
${discount > 0 ? `🏷️ *বিশেষ ডিসকাউন্ট:* -৳${Number(discount).toLocaleString()}\n` : ''}━━━━━━━━━━━━━━━━━━
💵 *সর্বমোট টাকা:* ৳${grandTotal.toLocaleString()}
${hasAdvancePayment ? `✅ *অগ্রিম পরিশোধ (${advanceMethod}):* ৳${actualAdvance.toLocaleString()} ${advanceTrxId ? `(TrxID: ${advanceTrxId})` : ''}\n🔴 *ক্যাশ অন ডেলিভারি (বকেয়া):* ৳${balanceDueCod.toLocaleString()}` : `🔴 *ক্যাশ অন ডেলিভারি (বকেয়া):* ৳${grandTotal.toLocaleString()}`}

📍 *ডেলিভারি ঠিকানা:*
${address}, ${thana ? `${thana}, ` : ''}${district}
📞 *ফোন নম্বর:* ${customerPhone}

🚚 *কুরিয়ার পার্টনার:* ${selectedCourier}
🔎 *লাইভ অর্ডার ট্র্যাকিং:* https://kisholoy.com/track/${orderNum}

যেকোনো সহায়তায় আমাদের সরাসরি মেসেজ দিতে পারেন। কিশলয় বেছে নেওয়ার জন্য আন্তরিক ধন্যবাদ! 🍃`;
  };

  // Submit Handler
  const handleCreateOrder = async (openWhatsAppDirectly = false) => {
    if (!customerName.trim()) {
      showToast(isBn ? 'গ্রাহকের নাম আবশ্যক' : 'Customer name is required', 'error');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      showToast(isBn ? 'সঠিক ফোন নম্বর প্রদান করুন' : 'Valid phone number is required', 'error');
      return;
    }
    if (items.length === 0) {
      showToast(isBn ? 'অন্তত একটি পণ্য যোগ করুন' : 'Please add at least one product', 'error');
      return;
    }
    if (!address.trim()) {
      showToast(isBn ? 'ডেলিভারি ঠিকানা আবশ্যক' : 'Delivery address is required', 'error');
      return;
    }

    setIsSubmitting(true);
    const orderNumber = `KSH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const orderPayload: Partial<Order> = {
        orderNumber,
        createdAt: new Date().toISOString(),
        orderSource: channel,
        channelDetails: {
          channel,
          channelName: channel === 'WHATSAPP' ? 'WhatsApp Business Chat' :
                       channel === 'MESSENGER' ? 'Facebook Messenger' :
                       channel === 'PHONE' ? 'Direct Phone Call' :
                       channel === 'INSTAGRAM' ? 'Instagram Direct Message' :
                       channel === 'FACEBOOK' ? 'Facebook Page Post/Live' : 'Direct Walk-in',
          socialHandleOrChatId: socialHandle || customerPhone,
          whatsappNumber: channel === 'WHATSAPP' ? customerPhone : undefined,
          operatorName: operatorName.trim() || currentRole,
          operatorRole: currentRole,
          chatNotes: chatNotes.trim(),
          confirmedViaChat: true
        },
        customer: {
          id: matchedCustomer?.id || `cust-${Date.now()}`,
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim() || undefined,
          whatsappNumber: channel === 'WHATSAPP' ? customerPhone.trim() : undefined,
          socialProfile: socialHandle || undefined
        },
        shippingAddress: {
          firstName: customerName.trim(),
          lastName: '',
          phone: customerPhone.trim(),
          email: customerEmail.trim() || undefined,
          address: address.trim(),
          division: division || 'Dhaka',
          district: district || 'Dhaka',
          thana: thana.trim() || 'Central',
          postalCode: postalCode.trim() || undefined,
          notes: deliveryNotes.trim() || undefined
        },
        items: items.map(it => ({
          productId: it.productId,
          title: it.productTitle,
          titleBn: it.productTitleBn || it.productTitle,
          price: it.unitPrice,
          quantity: it.quantity,
          image: it.image,
          sku: it.sku,
          variantName: it.variantName
        })),
        subtotal,
        shippingFee: Number(shippingFee),
        discount: Number(discount),
        total: grandTotal,
        balanceDueCod,
        paymentMethod: hasAdvancePayment && balanceDueCod === 0 ? 'MANUAL' : 'COD',
        paymentStatus: balanceDueCod === 0 ? 'PAID' : (hasAdvancePayment ? 'PARTIALLY_PAID' as any : 'UNPAID'),
        settlementStatus: 'PENDING',
        orderStatus: 'CONFIRMED',
        verificationStatus: hasAdvancePayment ? 'ADVANCE_PAID' : 'PHONE_VERIFIED',
        verificationNotes: `${channel} Assisted Order by ${operatorName}.${hasAdvancePayment ? ` Advance ৳${actualAdvance} received via ${advanceMethod} (TrxID: ${advanceTrxId || 'N/A'}). Balance COD: ৳${balanceDueCod}.` : ' Phone verification completed during chat.'}`,
        advancePayment: hasAdvancePayment ? {
          isPaid: true,
          amount: actualAdvance,
          method: advanceMethod,
          trxId: advanceTrxId.trim() || undefined,
          receivedAt: new Date().toISOString(),
          receivedBy: operatorName.trim(),
          verified: true,
          notes: advanceNotes.trim() || undefined
        } : undefined,
        courier: {
          provider: selectedCourier || 'Steadfast',
          status: 'CREATED'
        },
        notes: chatNotes.trim() ? `[${channel} Notes]: ${chatNotes.trim()}` : undefined,
        whatsappConfirmationSent: openWhatsAppDirectly || channel === 'WHATSAPP',
        timeline: [
          {
            status: 'PENDING',
            timestamp: new Date().toISOString(),
            note: `Manual Assisted Order booked via ${channel} by ${operatorName}. Total: ৳${grandTotal}.`,
            updatedBy: operatorName
          },
          {
            status: 'CONFIRMED',
            timestamp: new Date().toISOString(),
            note: hasAdvancePayment 
              ? `Advance ৳${actualAdvance} verified via ${advanceMethod}. Balance COD: ৳${balanceDueCod}.`
              : `Order details confirmed directly with customer via ${channel}.`,
            updatedBy: operatorName
          }
        ]
      };

      // 1. Create order in AppContext (deducts stock, registers audit log, creates customer if new)
      const created = createOrder(orderPayload as any);
      
      // 2. Also sync to backend API
      try {
        await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...orderPayload,
            isManualAssistedOrder: true
          })
        });
      } catch (err) {
        console.warn('Backend sync failed, state preserved locally:', err);
      }

      setCreatedOrderSummary(created || (orderPayload as Order));
      if (onOrderCreated) onOrderCreated(created || (orderPayload as Order));

      showToast(isBn ? `অর্ডার #${orderNumber} সফলভাবে তৈরি হয়েছে!` : `Assisted Order #${orderNumber} created successfully!`);

      // 3. Open WhatsApp Web / App if requested
      if (openWhatsAppDirectly) {
        const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
        const internationalPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
        const msgText = generateWhatsAppMessage(orderNumber);
        const encoded = encodeURIComponent(msgText);
        window.open(`https://wa.me/${internationalPhone}?text=${encoded}`, '_blank');
      }

    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to create order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWhatsAppMsg(true);
    setTimeout(() => setCopiedWhatsAppMsg(false), 2500);
    showToast(isBn ? 'হোয়াটসঅ্যাপ মেসেজ কপি হয়েছে!' : 'WhatsApp invoice message copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div ref={containerRef} {...dialogProps} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800/80 border border-teal-600 flex items-center justify-center text-teal-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                  {isBn ? 'হোয়াটসঅ্যাপ ও সোশ্যাল অর্ডার এন্ট্রি হাব' : 'Manual & Social Order Entry Desk'}
                </h3>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-400 text-stone-950 px-2 py-0.5 rounded">
                  Assisted Sales
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {isBn ? 'ইনভেন্টরি লক, কারিগর রেভিনিউ সিন্ক, কুরিয়ার বুকিং ও ১-ক্লিক হোয়াটসঅ্যাপ ইনভয়েস' : 'Instant Stock Lock • Supplier Sync • Courier Routing • 1-Click WhatsApp Invoice'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Post-Order Creation Success Screen */}
          {createdOrderSummary ? (
            <div className="space-y-6 py-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-emerald-950">
                  {isBn ? 'অর্ডার সফলভাবে সিস্টেমভুক্ত হয়েছে!' : 'Order Placed & Synced Across All Systems!'}
                </h4>
                <p className="text-xs text-emerald-800 font-mono font-bold">
                  Order Number: {createdOrderSummary.orderNumber} • Source: {createdOrderSummary.orderSource}
                </p>
                <div className="text-xs text-stone-600 max-w-md mx-auto">
                  {isBn 
                    ? 'স্টক লক সম্পন্ন হয়েছে, কারিগরের সেটেলমেন্ট হিসাব আপডেট হয়েছে এবং কুরিয়ারে বুকিং প্রস্তুত।'
                    : 'Inventory stock has been deducted, supplier settlement share credited, and courier consignment initialized.'}
                </div>
              </div>

              {/* WhatsApp Message Preview */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>{isBn ? 'হোয়াটসঅ্যাপ মেসেজ ড্রাফট (গ্রাহককে পাঠাতে)' : 'Formatted WhatsApp Message (Ready to Send)'}</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(generateWhatsAppMessage(createdOrderSummary.orderNumber))}
                    className="px-3 py-1 bg-white hover:bg-stone-100 text-stone-800 rounded-lg text-xs font-semibold border border-stone-200 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedWhatsAppMsg ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : (isBn ? 'মেসেজ কপি করুন' : 'Copy Message')}</span>
                  </button>
                </div>

                <pre className="text-[11px] font-mono bg-white p-4 rounded-lg border border-stone-200 whitespace-pre-wrap text-stone-800 leading-relaxed max-h-60 overflow-y-auto">
                  {generateWhatsAppMessage(createdOrderSummary.orderNumber)}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    const cleanPhone = createdOrderSummary.customer.phone.replace(/[^0-9]/g, '');
                    const internationalPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
                    const msgText = generateWhatsAppMessage(createdOrderSummary.orderNumber);
                    window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(msgText)}`, '_blank');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isBn ? 'সরাসরি WhatsApp খুলুন' : 'Open WhatsApp Web & Send'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setCreatedOrderSummary(null);
                    setItems([]);
                    setCustomerPhone('');
                    setCustomerName('');
                    setAddress('');
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {isBn ? 'সম্পন্ন (ডেস্ক বন্ধ করুন)' : 'Done (Close Desk)'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Channel & Attribution */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                  <span>1. {isBn ? 'অর্ডার গ্রহণের মাধ্যম (Channel / Source)' : 'Order Source & Channel'}</span>
                  <span className="text-[11px] text-teal-700 font-semibold lowercase">Attributed to analytics & CRM</span>
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'WHATSAPP', label: 'WhatsApp', color: 'text-emerald-700 bg-emerald-50 border-emerald-300', icon: MessageCircle },
                    { id: 'MESSENGER', label: 'Messenger', color: 'text-blue-700 bg-blue-50 border-blue-300', icon: MessageSquare },
                    { id: 'PHONE', label: 'Phone Call', color: 'text-amber-700 bg-amber-50 border-amber-300', icon: Phone },
                    { id: 'FACEBOOK', label: 'FB Page/Live', color: 'text-indigo-700 bg-indigo-50 border-indigo-300', icon: Send },
                    { id: 'INSTAGRAM', label: 'Instagram DM', color: 'text-pink-700 bg-pink-50 border-pink-300', icon: Sparkles },
                    { id: 'DIRECT', label: 'Walk-in/Direct', color: 'text-teal-700 bg-teal-50 border-teal-300', icon: Building2 },
                    { id: 'MANUAL_ADMIN', label: 'Admin Custom', color: 'text-stone-700 bg-stone-100 border-stone-300', icon: User }
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const isSelected = channel === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setChannel(ch.id as OrderSourceChannel)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                          isSelected 
                            ? `${ch.color} ring-2 ring-stone-900 shadow-xs` 
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{ch.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <label className="text-stone-600 font-semibold mb-1 block">
                      {channel === 'WHATSAPP' ? 'WhatsApp Number / Chat ID' : 'Social Handle / Conversation Link'}
                    </label>
                    <input
                      type="text"
                      placeholder={channel === 'WHATSAPP' ? '+88017XXXXXXXX' : 'e.g. fb.me/profile or @handle'}
                      value={socialHandle}
                      onChange={(e) => setSocialHandle(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
                    />
                  </div>
                  <div>
                    <label className="text-stone-600 font-semibold mb-1 block">
                      {isBn ? 'অর্ডার গ্রহণকারী কর্মী (Operator / Agent)' : 'Agent / Operator Name'}
                    </label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Customer CRM & Auto-Fill */}
              <div className="space-y-3 bg-stone-50/75 p-4 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-700" />
                    <span>2. {isBn ? 'গ্রাহকের তথ্য ও ইতিহাস (Customer CRM)' : 'Customer Profile & CRM'}</span>
                  </label>
                  {matchedCustomer && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isBn ? `পূর্ববর্তী গ্রাহক (${matchedCustomer.totalOrders}টি অর্ডার)` : `Existing Customer (${matchedCustomer.totalOrders} orders, ৳${matchedCustomer.totalSpent.toLocaleString()} spent)`}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-stone-600 font-semibold mb-1 block">
                      {isBn ? 'ফোন নম্বর *' : 'Phone Number *'}
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="017XXXXXXXX"
                        value={customerPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-stone-600 font-semibold mb-1 block">
                      {isBn ? 'গ্রাহকের পূর্ণ নাম *' : 'Customer Name *'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tanzil Ahmed"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
                    />
                  </div>
                  <div>
                    <label className="text-stone-600 font-semibold mb-1 block">
                      {isBn ? 'ইমেইল (ঐচ্ছিক)' : 'Email (Optional)'}
                    </label>
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Product Selection & Live Inventory */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                  <span>3. {isBn ? 'অর্ডারের পণ্যসমূহ (Products & Live Stock)' : 'Order Items & Live Inventory Lock'}</span>
                  <span className="text-[11px] text-teal-700 font-semibold">Stock auto-deducts on order creation</span>
                </label>

                {/* Product Search & Add Selector */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {/* Search & Select Product */}
                    <div className="sm:col-span-6">
                      <label className="text-stone-600 font-semibold mb-1 block">Select Product</label>
                      <select
                        value={selectedProductToAdd?.id || ''}
                        onChange={(e) => {
                          const p = products.find(prod => prod.id === e.target.value);
                          setSelectedProductToAdd(p || null);
                          setSelectedVariantId('');
                        }}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 bg-white"
                      >
                        <option value="">-- Choose from Catalog --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                            {p.title} - ৳{p.price} ({p.stock > 0 ? `Stock: ${p.stock}` : 'OUT OF STOCK'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variant Select if any */}
                    <div className="sm:col-span-3">
                      <label className="text-stone-600 font-semibold mb-1 block">Variant / Size / Color</label>
                      <select
                        value={selectedVariantId}
                        onChange={(e) => setSelectedVariantId(e.target.value)}
                        disabled={!selectedProductToAdd?.variants || selectedProductToAdd.variants.length === 0}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 bg-white disabled:bg-stone-100 text-stone-700"
                      >
                        <option value="">{selectedProductToAdd?.variants?.length ? '-- Select Variant --' : 'Standard'}</option>
                        {selectedProductToAdd?.variants?.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} (৳{v.price}) - Stock: {v.stock}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-1">
                      <label className="text-stone-600 font-semibold mb-1 block">Qty</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={addQuantity}
                        onChange={(e) => setAddQuantity(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full px-2 py-2 border border-stone-300 rounded-lg text-center font-bold"
                      />
                    </div>

                    {/* Add Button */}
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!selectedProductToAdd}
                        className="w-full py-2 bg-teal-900 hover:bg-teal-950 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Item</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                {items.length > 0 ? (
                  <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-200 text-xs">
                    <div className="bg-stone-100/75 p-3 grid grid-cols-12 font-bold text-stone-600 uppercase tracking-wider">
                      <div className="col-span-5">Product</div>
                      <div className="col-span-2 text-center">Unit Price (BDT)</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Subtotal</div>
                      <div className="col-span-1 text-right">Action</div>
                    </div>

                    {items.map((item, idx) => (
                      <div key={idx} className="p-3 grid grid-cols-12 items-center gap-2 hover:bg-stone-50">
                        <div className="col-span-5 flex items-center gap-2.5">
                          <img src={item.image} alt={item.productTitle} className="w-10 h-10 rounded object-cover border border-stone-200 flex-shrink-0" />
                          <div>
                            <div className="font-bold text-stone-900 line-clamp-1">{item.productTitle}</div>
                            <div className="text-[10px] text-stone-500 font-mono">
                              SKU: {item.sku} {item.variantName ? `• Variant: ${item.variantName}` : ''}
                            </div>
                            {item.stock < item.quantity && (
                              <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> Low Stock ({item.stock} left)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Custom Negotiated Unit Price */}
                        <div className="col-span-2 flex items-center justify-center">
                          <div className="relative w-24">
                            <span className="absolute left-2 top-1.5 text-stone-400 font-mono">৳</span>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateCustomPrice(idx, Number(e.target.value) || 0)}
                              className="w-full pl-6 pr-2 py-1 text-center border border-stone-300 rounded font-bold text-stone-900"
                              title="Custom chat discount price override"
                            />
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 font-bold text-stone-700"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-stone-900">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 font-bold text-stone-700"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="col-span-2 text-right font-bold text-stone-900 font-mono">
                          ৳ {(item.unitPrice * item.quantity).toLocaleString()}
                        </div>

                        {/* Delete */}
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center text-xs text-stone-400">
                    No products added to this order yet. Choose a product above.
                  </div>
                )}
              </div>

              {/* Step 4: Shipping Address & Courier */}
              <div className="space-y-3 bg-stone-50/75 p-4 rounded-xl border border-stone-200">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  <span>4. {isBn ? 'ডেলিভারি ঠিকানা ও কুরিয়ার নির্বাচন' : 'Shipping Destination & Courier'}</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-stone-600 font-semibold mb-1 block">District / জেলা *</label>
                    <select
                      value={district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 bg-white font-semibold"
                    >
                      {BANGLADESH_DISTRICTS.map(d => (
                        <option key={d.name} value={d.name}>
                          {d.name} (৳{d.defaultFee} delivery)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-600 font-semibold mb-1 block">Thana / থানা</label>
                    <input
                      type="text"
                      placeholder="e.g. Dhanmondi, Uttara, Kotwali"
                      value={thana}
                      onChange={(e) => setThana(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
                    />
                  </div>

                  <div>
                    <label className="text-stone-600 font-semibold mb-1 block">Courier Partner</label>
                    <select
                      value={selectedCourier}
                      onChange={(e) => setSelectedCourier(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 bg-white"
                    >
                      <option value="Steadfast">Steadfast Courier (API Integrated)</option>
                      <option value="Pathao">Pathao Logistics (API Integrated)</option>
                      <option value="RedX">RedX Delivery</option>
                      <option value="Paperfly">Paperfly Nationwide</option>
                      {customCouriers.filter(c => c.isActive).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="text-stone-600 font-semibold mb-1 block">Full Detailed Address / বিস্তারিত ঠিকানা *</label>
                  <textarea
                    rows={2}
                    placeholder="House number, Flat/Floor, Road name/number, Area landmark..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 text-xs"
                  />
                </div>
              </div>

              {/* Step 5: Advance Payment, Discounts & Financials */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  5. {isBn ? 'অগ্রিম পেমেন্ট ও সর্বমোট হিসাব (Financial Breakdown)' : 'Advance Payment & Financial Breakdown'}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Advance Payment Collector */}
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-amber-950 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasAdvancePayment}
                          onChange={(e) => setHasAdvancePayment(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                        />
                        <span>{isBn ? 'অগ্রিম পেমেন্ট নেওয়া হয়েছে? (Advance Paid)' : 'Advance Payment Collected in Chat?'}</span>
                      </label>
                      {hasAdvancePayment && (
                        <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                          Advance Verified
                        </span>
                      )}
                    </div>

                    {hasAdvancePayment && (
                      <div className="space-y-2.5 pt-2 border-t border-amber-200/60">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-amber-900 font-semibold block mb-1">Advance Amount (BDT)</label>
                            <input
                              type="number"
                              value={advanceAmount}
                              onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 border border-amber-300 rounded-lg font-bold text-stone-900 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-amber-900 font-semibold block mb-1">Method</label>
                            <select
                              value={advanceMethod}
                              onChange={(e) => setAdvanceMethod(e.target.value as any)}
                              className="w-full px-3 py-1.5 border border-amber-300 rounded-lg bg-white font-semibold"
                            >
                              <option value="BKASH">bKash Personal/Merchant</option>
                              <option value="NAGAD">Nagad Personal</option>
                              <option value="ROCKET">Rocket</option>
                              <option value="BANK">Bank Transfer</option>
                              <option value="CASH">Cash in Hand</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-amber-900 font-semibold block mb-1">bKash/Nagad Transaction ID (TrxID)</label>
                          <input
                            type="text"
                            placeholder="e.g. BKP98271034 or 9J87..."
                            value={advanceTrxId}
                            onChange={(e) => setAdvanceTrxId(e.target.value)}
                            className="w-full px-3 py-1.5 border border-amber-300 rounded-lg font-mono uppercase bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Real-time Calculation Summary */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items):</span>
                      <span className="font-mono font-bold text-stone-900">৳ {subtotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-stone-600">
                      <span>Delivery Charge:</span>
                      <div className="flex items-center gap-1 w-24">
                        <span className="font-mono">৳</span>
                        <input
                          type="number"
                          value={shippingFee}
                          onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                          className="w-full px-2 py-0.5 border border-stone-300 rounded text-right font-bold text-stone-900"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-stone-600">
                      <span>Chat Special Discount:</span>
                      <div className="flex items-center gap-1 w-24">
                        <span className="font-mono">-৳</span>
                        <input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                          className="w-full px-2 py-0.5 border border-stone-300 rounded text-right font-bold text-emerald-700"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 flex justify-between items-center font-bold text-stone-900 text-sm">
                      <span>Grand Total:</span>
                      <span className="font-mono text-base text-teal-950">৳ {grandTotal.toLocaleString()}</span>
                    </div>

                    {hasAdvancePayment && (
                      <>
                        <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                          <span>Advance Paid ({advanceMethod}):</span>
                          <span className="font-mono">-৳ {actualAdvance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-rose-800 font-extrabold text-sm pt-1 border-t border-stone-200">
                          <span>Balance COD to Collect:</span>
                          <span className="font-mono">৳ {balanceDueCod.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Additional Chat Notes */}
                <div className="text-xs">
                  <label className="text-stone-600 font-semibold mb-1 block">
                    {isBn ? 'অভ্যন্তরীণ কথোপকথন নোট (Internal Order / Chat Notes)' : 'Internal Chat Notes (Visible only to team)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Customer requested urgent delivery before Friday. Preferred gift wrapping."
                    value={chatNotes}
                    onChange={(e) => setChatNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCreateOrder(false)}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing...' : (isBn ? 'অর্ডার তৈরি করুন' : 'Create Order Only')}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCreateOrder(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{isSubmitting ? 'Processing...' : (isBn ? 'অর্ডার তৈরি ও WhatsApp খুলুন' : 'Create Order & Open WhatsApp')}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
