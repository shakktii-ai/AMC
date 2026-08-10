'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Plus, Search, QrCode } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import Modal from '@/components/ui/Modal.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function WarrantyPage() {
  const [warranties, setWarranties] = useState([]);
  const [lifts, setLifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    liftId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    coverage: 'Comprehensive manufacturer warranty covering traction motor, brakes, and control panel.',
    exclusions: 'Water seepage, customer tampering, and lightning damage.',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [wRes, lRes] = await Promise.all([fetch('/api/warranty'), fetch('/api/lifts')]);
      const wData = await wRes.json();
      const lData = await lRes.json();

      if (wData.success) setWarranties(wData.warranties);
      if (lData.success && lData.lifts.length > 0) {
        setLifts(lData.lifts);
        setFormData((prev) => ({ ...prev, liftId: lData.lifts[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterWarranty = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/warranty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Warranty Registry</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track OEM manufacturer coverage, digital warranty certificates, and expiry dates.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Warranty</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading warranty records..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Warranty ID</th>
                <th className="p-4">Lift Building Location</th>
                <th className="p-4">Coverage Period</th>
                <th className="p-4">Dynamic Status</th>
                <th className="p-4 text-right">Verification Token</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {warranties.map((w) => (
                <tr key={w._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sky-600">{w.warrantyId}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{w.liftId?.buildingName || 'Lift Asset'}</div>
                    <div className="text-xs text-slate-400 font-mono">Code: {w.liftId?.assetCode}</div>
                  </td>
                  <td className="p-4 text-xs text-slate-600">
                    {new Date(w.startDate).toLocaleDateString()} to {new Date(w.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <Badge variant={w.computedStatus === 'ACTIVE' ? 'success' : 'danger'}>{w.computedStatus}</Badge>
                  </td>
                  <td className="p-4 text-right font-mono text-xs text-purple-700">{w.certificateToken}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Warranty Coverage">
        <form onSubmit={handleRegisterWarranty} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Lift Asset</label>
            <select
              value={formData.liftId}
              onChange={(e) => setFormData({ ...formData, liftId: e.target.value })}
              className="w-full text-sm p-2.5 border rounded-lg"
            >
              {lifts.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.buildingName} ({l.assetCode})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Coverage Scope</label>
            <textarea
              rows={2}
              value={formData.coverage}
              onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
              className="w-full text-sm p-2.5 border rounded-lg"
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-sky-600 text-white font-bold rounded-lg text-sm hover:bg-sky-700">
            Register Warranty Record
          </button>
        </form>
      </Modal>
    </div>
  );
}
