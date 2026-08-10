'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Search, Eye } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) setCustomers(data.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Directory of clients, building accounts, and contract details.</p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by customer ID, name, company, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm border-none focus:outline-none text-slate-800"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching customer records..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Customer ID</th>
                <th className="p-4">Name / Company</th>
                <th className="p-4">Contact</th>
                <th className="p-4">City / State</th>
                <th className="p-4">GSTIN</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sky-600">{c.customerId}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.companyName || 'Individual'}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-900">{c.email}</div>
                    <div className="text-xs text-slate-400">{c.phone}</div>
                  </td>
                  <td className="p-4">
                    {c.city}, {c.state}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-600">{c.gstin || 'N/A'}</td>
                  <td className="p-4">
                    <Badge variant={c.status === 'ACTIVE' ? 'success' : 'danger'}>{c.status}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/customers/${c._id}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 p-2 rounded-lg border border-sky-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
