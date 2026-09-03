import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const BD_DISTRICTS = [
  'Dhaka',
  'Chittagong',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Rangpur',
  'Mymensingh',
  'Comilla',
  'Gazipur',
  'Narayanganj',
  'Tangail',
  'Bogra',
  'Jessore',
  'Cox\'s Bazar'
];

export function CreateCustomerModal({ isOpen, onClose, onCreated }: CreateCustomerModalProps) {
  const { language, addAdminCustomer, showToast } = useApp();
  const isBn = language === 'BN';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+880 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [thana, setThana] = useState('');
  const [initialNote, setInitialNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || phone.trim() === '+880') {
      showToast(isBn ? 'নাম এবং মোবাইল নম্বর দেওয়া আবশ্যক' : 'Customer name and phone are required');
      return;
    }

    setSubmitting(true);
    try {
      const created = await addAdminCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        district,
        thana: thana.trim()
      });

      if (created) {
        // If there was an initial note, add it
        if (initialNote.trim()) {
          try {
            await fetch(`/api/customers/${created.id}/notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: initialNote.trim(),
                author: 'Registration Desk'
              })
            });
          } catch (err) {
            // Ignore note failure
          }
        }
        onCreated?.();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="create-customer-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="create-customer-modal-card"
        className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-900 flex items-center justify-center text-teal-300">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-white">
                {isBn ? 'নতুন কাস্টমার নিবন্ধন' : 'Register New Customer'}
              </h3>
              <p className="text-[11px] text-stone-400">
                {isBn
                  ? 'শোরুম বা টেলিফোন অর্ডারের জন্য গ্রাহক প্রোফাইল তৈরি করুন।'
                  : 'Add customer profile for assisted phone or showroom orders.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-bold text-stone-700 block">
              {isBn ? 'গ্রাহকের পুরো নাম *' : 'Customer Full Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tanzil Ahmed / তানজিল আহমেদ"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-stone-700 block">
                {isBn ? 'মোবাইল নম্বর *' : 'Mobile Phone *'}
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 17XXXXXXXX"
                  className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:border-teal-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700 block">
                {isBn ? 'ইমেইল (ঐচ্ছিক)' : 'Email Address (Optional)'}
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
                />
              </div>
            </div>
          </div>

          {/* District & Thana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-stone-700 block">
                {isBn ? 'জেলা (District)' : 'District'}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800 bg-white"
              >
                {BD_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700 block">
                {isBn ? 'থানা / এরিয়া' : 'Thana / Area'}
              </label>
              <input
                type="text"
                value={thana}
                onChange={(e) => setThana(e.target.value)}
                placeholder="e.g. Banani / Gulshan / Dhanmondi"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
              />
            </div>
          </div>

          {/* Address Line */}
          <div className="space-y-1">
            <label className="font-bold text-stone-700 block">
              {isBn ? 'পূর্ণ ডেলিভারি ঠিকানা' : 'Street Address / Delivery Notes'}
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. House 14, Road 7, Block C"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
            />
          </div>

          {/* Initial CRM Note */}
          <div className="space-y-1">
            <label className="font-bold text-stone-700 block">
              {isBn ? 'প্রাথমিক সিআরএম নোট (অভ্যন্তরীণ)' : 'Initial CRM Note (Internal)'}
            </label>
            <input
              type="text"
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              placeholder="e.g. Showroom walk-in customer interested in Jamdani Saree"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 rounded-lg font-semibold"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 font-bold bg-teal-850 hover:bg-teal-900 text-white rounded-lg shadow-xs disabled:opacity-50 transition-colors"
            >
              {submitting ? (isBn ? 'নিবন্ধন হচ্ছে...' : 'Registering...') : isBn ? 'কাস্টমার সংরক্ষণ করুন' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
