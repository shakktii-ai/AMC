'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Wrench, ShieldAlert } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function NewLiftPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [checkingRole, setCheckingRole] = useState(true);

  const [formData, setFormData] = useState({
    liftId: `LFT-${Date.now().toString().slice(-6)}`,
    assetCode: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
    serialNumber: `SN-${Math.floor(100000 + Math.random() * 900000)}`,
    customerId: '',
    buildingName: '',
    buildingAddress: '',
    wing: 'A',
    floor: 'G',
    locationNotes: 'Main Elevator Shaft',
    capacityKg: 408,
    capacityPersons: 6,
    speedMs: 1.0,
    floors: 5,
    stops: 5,
    driveType: 'GEARED',
    controllerType: 'MICROPROCESSOR',
    doorType: 'AUTOMATIC',
    status: 'REGISTERED',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setCheckingRole(true);
        const [meRes, custRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/customers'),
        ]);

        const meData = await meRes.json();
        const custData = await custRes.json();

        if (meData.authenticated) {
          setUserRole(meData.user.role);
        }

        if (custData.success && custData.customers.length > 0) {
          setCustomers(custData.customers);
          setFormData((prev) => ({ ...prev, customerId: custData.customers[0]._id }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingRole(false);
      }
    }
    loadData();
  }, []);

  if (checkingRole) return <LoadingSpinner message="Checking operational permissions..." />;

  if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-md text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Admin Authorization Required</h2>
        <p className="text-xs text-slate-500">
          Official Lift Asset creation is restricted to System Admins. Customers can view assigned lifts or log breakdown requests.
        </p>
        <Link href="/lifts" className="inline-block px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-lg">
          Back to Lift Register
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/lifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacityKg: Number(formData.capacityKg),
          capacityPersons: Number(formData.capacityPersons),
          speedMs: Number(formData.speedMs),
          floors: Number(formData.floors),
          stops: Number(formData.stops),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create lift asset');

      router.push(`/lifts/${data.lift._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/lifts" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Register New Lift Asset</h1>
          <p className="text-sm text-slate-500">Configure technical specifications, location, and customer assignment.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {error && <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lift ID *</label>
              <input
                type="text"
                required
                value={formData.liftId}
                onChange={(e) => setFormData({ ...formData, liftId: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg font-mono bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Asset Code *</label>
              <input
                type="text"
                required
                value={formData.assetCode}
                onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Serial Number *</label>
              <input
                type="text"
                required
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Customer Account *</label>
            <select
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full text-sm p-2.5 border rounded-lg"
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.companyName || 'Individual'}) - ID: {c.customerId}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Building Name *</label>
              <input
                type="text"
                required
                value={formData.buildingName}
                onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
                placeholder="Skyline Tower A"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Building Address *</label>
              <input
                type="text"
                required
                value={formData.buildingAddress}
                onChange={(e) => setFormData({ ...formData, buildingAddress: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
                placeholder="45 Park Avenue, MIDC"
              />
            </div>
          </div>

          <div className="border-t pt-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Technical Specifications</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Capacity (KG)</label>
                <input
                  type="number"
                  required
                  value={formData.capacityKg}
                  onChange={(e) => setFormData({ ...formData, capacityKg: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Persons</label>
                <input
                  type="number"
                  required
                  value={formData.capacityPersons}
                  onChange={(e) => setFormData({ ...formData, capacityPersons: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Speed (M/S)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.speedMs}
                  onChange={(e) => setFormData({ ...formData, speedMs: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stops / Floors</label>
                <input
                  type="number"
                  required
                  value={formData.floors}
                  onChange={(e) => setFormData({ ...formData, floors: e.target.value, stops: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Drive Type</label>
                <select
                  value={formData.driveType}
                  onChange={(e) => setFormData({ ...formData, driveType: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-lg"
                >
                  <option value="GEARED">GEARED</option>
                  <option value="GEARLESS">GEARLESS</option>
                  <option value="HYDRAULIC">HYDRAULIC</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Controller Type</label>
                <select
                  value={formData.controllerType}
                  onChange={(e) => setFormData({ ...formData, controllerType: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-lg"
                >
                  <option value="MICROPROCESSOR">MICROPROCESSOR</option>
                  <option value="PLC">PLC</option>
                  <option value="VVVF">VVVF INVERTER</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Door Type</label>
                <select
                  value={formData.doorType}
                  onChange={(e) => setFormData({ ...formData, doorType: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-lg"
                >
                  <option value="AUTOMATIC">AUTOMATIC</option>
                  <option value="MANUAL">MANUAL</option>
                  <option value="TELESCOPIC">TELESCOPIC</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Registering...' : 'Register Lift Asset'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
