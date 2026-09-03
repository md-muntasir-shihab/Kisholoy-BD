import React, { useState } from 'react';
import { Users, Search, Phone, MapPin, ShoppingBag, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function CustomersAdmin() {
  const { customers, orders } = useApp();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900">Customer Intelligence & CRM</h1>
        <p className="text-xs text-stone-500">Verified buyer profiles, lifetime order history, and delivery addresses.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-teal-800"
          />
        </div>
        <span className="text-xs font-bold text-stone-600">Total Buyers: {customers.length}</span>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/75 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Delivery Address</th>
                <th className="p-4">Total Orders</th>
                <th className="p-4">Lifetime Spend</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="p-4 font-bold text-stone-900">
                    {c.name}
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-stone-800 block">{c.phone}</span>
                    <span className="text-stone-400 text-[11px]">{c.email || 'No email'}</span>
                  </td>
                  <td className="p-4 text-stone-600 max-w-xs truncate">
                    {c.address ? `${c.address}, ${c.thana}, ${c.district}` : 'Dhaka, Bangladesh'}
                  </td>
                  <td className="p-4 font-mono font-bold text-stone-800">
                    {c.totalOrders} order(s)
                  </td>
                  <td className="p-4 font-mono font-bold text-teal-950">
                    ৳ {c.totalSpent.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
