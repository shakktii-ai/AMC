'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

export default function NewAmcPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [lifts, setLifts] = useState([]);
  const [filteredLifts, setFilteredLifts] = useState([]);
  const [selectedLiftIds, setSelectedLiftIds] = useState([]);

  const [formData, setFormData] = useState({
    amcId: `AMC-${Date.now().toString().slice(-6)}`,
    contractNumber: `AMC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: '',
    planType: 'COMPREHENSIVE',
    ppmInterval: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    baseAmount: 50000,
    discount: 0,
    coverage: 'Complete preventive maintenance, breakdown repairs, and parts replacement.',
    terms: 'PPM visits every month. Emergency breakdown response within SLA limits.',
    activateNow: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInitial() {
      try {
        const [cRes, lRes] = await Promise.all([fetch('/api/customers'), fetch('/api/lifts')]);
        const cData = await cRes.json();
        const lData = await lRes.json();

        if (cData.success && cData.customers.length > 0) {
          setCustomers(cData.customers);
          setFormData((prev) => ({ ...prev, customerId: cData.customers[0]._id }));
        }

        if (lData.success) {
          setLifts(lData.lifts);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (formData.customerId) {
      const match = lifts.filter((l) => String(l.customerId?._id || l.customerId) === String(formData.customerId));
      setFilteredLifts(match);
      if (match.length > 0) {
        setSelectedLiftIds([match[0]._id]);
      } else {
        setSelectedLiftIds([]);
      }
    }
  }, [formData.customerId, lifts]);

  const toggleLift = (liftId) => {
    if (selectedLiftIds.includes(liftId)) {
      setSelectedLiftIds(selectedLiftIds.filter((id) => id !== liftId));
    } else {
      setSelectedLiftIds([...selectedLiftIds, liftId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (selectedLiftIds.length === 0) {
      setError('Please select at least one lift to cover in this AMC contract.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/amc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          liftIds: selectedLiftIds,
          baseAmount: Number(formData.baseAmount),
          discount: Number(formData.discount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create AMC contract');

      router.push(`/amc/${data.amc._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/amc" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Annual Maintenance Contract</h1>
          <p className="text-sm text-slate-500">Configure contract coverage, lifts, pricing, and PPM schedule.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-sm flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contract Number *</label>
              <input
                type="text"
                required
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Account *</label>
              <select
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.companyName || 'Individual'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Select Lifts Included in AMC *</label>
            <div className="space-y-2 border rounded-xl p-3 max-h-48 overflow-y-auto">
              {filteredLifts.map((l) => (
                <label key={l._id} className="flex items-center space-x-3 p-2 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLiftIds.includes(l._id)}
                    onChange={() => toggleLift(l._id)}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    {l.buildingName} ({l.assetCode}) - {l.capacityKg} kg / {l.floors} Floors
                  </span>
                </label>
              ))}
              {filteredLifts.length === 0 && <p className="text-xs text-slate-400 p-2">No lifts found for selected customer.</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plan Type</label>
              <select
                value={formData.planType}
                onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              >
                <option value="COMPREHENSIVE">COMPREHENSIVE</option>
                <option value="NON_COMPREHENSIVE">NON_COMPREHENSIVE</option>
                <option value="PREVENTIVE_MAINTENANCE">PREVENTIVE_MAINTENANCE</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PPM Interval</label>
              <select
                value={formData.ppmInterval}
                onChange={(e) => setFormData({ ...formData, ppmInterval: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              >
                <option value="MONTHLY">MONTHLY (12 visits/yr)</option>
                <option value="QUARTERLY">QUARTERLY (4 visits/yr)</option>
                <option value="BI_MONTHLY">BI_MONTHLY (6 visits/yr)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Base Amount (₹)</label>
              <input
                type="number"
                required
                value={formData.baseAmount}
                onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount (₹)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-sky-50 p-4 rounded-xl">
            <input
              type="checkbox"
              id="activateNow"
              checked={formData.activateNow}
              onChange={(e) => setFormData({ ...formData, activateNow: e.target.checked })}
              className="w-5 h-5 text-sky-600 rounded"
            />
            <label htmlFor="activateNow" className="text-sm font-bold text-slate-800 cursor-pointer">
              Activate AMC contract immediately & generate PPM schedules automatically
            </label>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Create & Save AMC'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
