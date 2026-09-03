import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, DollarSign, Truck, Percent } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function SettingsAdmin() {
  const { siteContent, updateSiteContent, showToast } = useApp();
  const [fees, setFees] = useState(siteContent.shippingFees);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteContent({
      ...siteContent,
      shippingFees: fees
    });
    showToast('Store logistics and pricing configurations saved!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">Store Settings & Logistic Rates</h1>
          <p className="text-xs text-stone-500">Configure shipping zones, free delivery thresholds, VAT percentage, and currency formatting.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-6 text-xs">
        <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
          <Truck className="w-4 h-4 text-teal-900" />
          Domestic Bangladesh Shipping Rates
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Inside Dhaka City Delivery Charge (৳)</label>
            <input
              type="number"
              required
              value={fees.insideDhaka}
              onChange={(e) => setFees({ ...fees, insideDhaka: Number(e.target.value) })}
              className="w-full p-2.5 border border-stone-300 rounded-lg"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Dhaka Suburbs (Gazipur, Savar, Narayanganj) (৳)</label>
            <input
              type="number"
              required
              value={fees.subDhaka}
              onChange={(e) => setFees({ ...fees, subDhaka: Number(e.target.value) })}
              className="w-full p-2.5 border border-stone-300 rounded-lg"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Outside Dhaka / Nationwide Courier (৳)</label>
            <input
              type="number"
              required
              value={fees.outsideDhaka}
              onChange={(e) => setFees({ ...fees, outsideDhaka: Number(e.target.value) })}
              className="w-full p-2.5 border border-stone-300 rounded-lg"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Free Shipping Qualification Threshold (৳)</label>
            <input
              type="number"
              required
              value={fees.freeShippingThreshold}
              onChange={(e) => setFees({ ...fees, freeShippingThreshold: Number(e.target.value) })}
              className="w-full p-2.5 border border-stone-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-stone-200">
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-900 text-white rounded-lg font-bold hover:bg-teal-950 flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" /> Save Logistics Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
