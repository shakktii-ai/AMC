'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wrench, Plus, Search, Eye, QrCode } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function LiftsPage() {
  const [lifts, setLifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userRole, setUserRole] = useState('');

  const loadLifts = async () => {
    try {
      setLoading(true);
      const [liftsRes, meRes] = await Promise.all([
        fetch(`/api/lifts?search=${encodeURIComponent(search)}`),
        fetch('/api/auth/me'),
      ]);
      const data = await liftsRes.json();
      const meData = await meRes.json();

      if (meData.authenticated) setUserRole(meData.user.role);
      if (data.success) setLifts(data.lifts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLifts();
  }, [search]);

  const canRegisterLift = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lift Asset Register</h1>
          <p className="text-sm text-slate-500 mt-0.5">Asset register, technical specs, and QR code verification links.</p>
        </div>
        {canRegisterLift && (
          <Link
            href="/lifts/new"
            className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Lift</span>
          </Link>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Lift ID, Asset Code, Serial Number, or Building Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm border-none focus:outline-none text-slate-800"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Loading lift asset registry..." />
      ) : lifts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 space-y-3">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No Lifts Found</h3>
          <p className="text-xs max-w-sm mx-auto">
            {userRole === 'CUSTOMER'
              ? 'No registered lift assets found under your account. Please contact Lift Tech Admin for asset onboarding.'
              : 'No lift assets registered yet. Click "Register New Lift" to add an asset.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Lift ID / Code</th>
                <th className="p-4">Building Location</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Specs</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lifts.map((l) => (
                <tr key={l._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-mono font-bold text-sky-600">{l.liftId}</div>
                    <div className="text-xs text-slate-400 font-mono">Code: {l.assetCode}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{l.buildingName}</div>
                    <div className="text-xs text-slate-500">{l.wing ? `Wing ${l.wing}, ` : ''}{l.floor ? `Floor ${l.floor}` : ''}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-900">{l.customerId?.name || 'Assigned Customer'}</td>
                  <td className="p-4 text-xs text-slate-600">
                    <div>{l.capacityKg} kg / {l.capacityPersons} Persons</div>
                    <div className="text-slate-400">{l.driveType} • {l.floors} Stops</div>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={
                        l.status === 'ACTIVE' || l.status === 'UNDER_AMC'
                          ? 'success'
                          : l.status === 'BREAKDOWN'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {l.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      href={`/lift/verify/${l.verificationToken}`}
                      target="_blank"
                      className="inline-flex items-center space-x-1 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 p-2 rounded-lg border border-purple-200"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR</span>
                    </Link>
                    <Link
                      href={`/lifts/${l._id}`}
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
