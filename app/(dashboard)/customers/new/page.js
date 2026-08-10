'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Lock, UserCheck } from 'lucide-react';

export default function NewCustomerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerId: `CUST-${Date.now().toString().slice(-6)}`,
    name: '',
    companyName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: 'Mumbai',
    state: 'MAHARASHTRA',
    pincode: '400001',
    gstin: '',
    status: 'ACTIVE',
    createLogin: true,
    loginEmail: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const targetLoginEmail = (formData.loginEmail || formData.email).trim();

    if (formData.createLogin) {
      if (!targetLoginEmail) {
        setError('Login email address is required for user account creation.');
        setLoading(false);
        return;
      }
      const pwd = formData.password || 'Test@12345';
      const confirmPwd = formData.confirmPassword || 'Test@12345';

      if (pwd.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
      if (pwd !== confirmPwd) {
        setError('Confirm Password does not match Password.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        loginEmail: targetLoginEmail,
        password: formData.password || 'Test@12345',
      };

      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create customer');

      router.push(`/customers/${data.customer._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/customers" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Customer Account</h1>
          <p className="text-sm text-slate-500">Add a new customer profile and automatically provision portal access.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {error && <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer ID</label>
              <input
                type="text"
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg font-mono bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
                placeholder="Rajesh Kumar"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company / Building Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
                placeholder="Royal Heights CHS"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Contact Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value, loginEmail: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
                placeholder="customer@test.local"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary Phone *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alternate Phone</label>
              <input
                type="text"
                value={formData.alternatePhone}
                onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
          </div>

          {/* CUSTOMER PORTAL LOGIN PROVISIONING SECTION */}
          <div className="border-t pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900">
                <Lock className="w-4 h-4 text-sky-600" />
                <h4 className="text-sm font-bold">Customer Portal Login Account</h4>
              </div>
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.createLogin}
                  onChange={(e) => setFormData({ ...formData, createLogin: e.target.checked })}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span>Provision Customer User Account</span>
              </label>
            </div>

            {formData.createLogin && (
              <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Login Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.loginEmail || formData.email}
                      onChange={(e) => setFormData({ ...formData, loginEmail: e.target.value })}
                      className="w-full text-sm p-2.5 border rounded-lg bg-white"
                      placeholder="customer@test.local"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Login Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full text-sm p-2.5 border rounded-lg bg-white"
                      placeholder="Min 6 characters (e.g. Test@12345)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full text-sm p-2.5 border rounded-lg bg-white"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>
                <p className="text-xs text-sky-700 flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600 inline shrink-0" />
                  <span>A CUSTOMER role user account will be created and linked automatically to this Customer record upon submission.</span>
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Address & Tax Information</h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Building Address *</label>
              <textarea
                required
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
                placeholder="Plot 45, Sector 18, MIDC Industrial Zone"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GSTIN Number</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg font-mono uppercase"
                placeholder="27ABCDE1234F1Z5"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Creating Customer & Login...' : 'Save Customer Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
