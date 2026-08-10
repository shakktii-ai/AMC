'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Plus, Search, Truck, Eye } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import Modal from '@/components/ui/Modal.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [lifts, setLifts] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [newForm, setNewForm] = useState({
    liftId: '',
    category: 'LIFT_NOT_WORKING',
    priority: 'HIGH',
    description: 'Lift stopped operating between 2nd and 3rd floor. Door mechanism locked.',
  });

  const [dispatchTechId, setDispatchTechId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, lRes] = await Promise.all([fetch('/api/complaints'), fetch('/api/lifts')]);
      const cData = await cRes.json();
      const lData = await lRes.json();

      if (cData.success) setComplaints(cData.complaints);
      if (lData.success && lData.lifts.length > 0) {
        setLifts(lData.lifts);
        setNewForm((prev) => ({ ...prev, liftId: lData.lifts[0]._id }));
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

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });
      if (res.ok) {
        setIsNewOpen(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openDispatchModal = async (complaint) => {
    setSelectedComplaint(complaint);
    setTechnicians([]);
    setDispatchTechId('');
    setIsDispatchOpen(true);
    setDispatchLoading(true);

    try {
      const res = await fetch('/api/complaints/dispatch');
      const data = await res.json();
      if (data.success && data.technicians) {
        setTechnicians(data.technicians);
        if (data.technicians.length > 0) {
          setDispatchTechId(data.technicians[0].techId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDispatchLoading(false);
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchTechId) return;
    try {
      const res = await fetch('/api/complaints/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: selectedComplaint._id,
          technicianUserId: dispatchTechId,
        }),
      });
      if (res.ok) {
        setIsDispatchOpen(false);
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
          <h1 className="text-2xl font-bold text-slate-900">Breakdown Complaints & SLA</h1>
          <p className="text-sm text-slate-500 mt-0.5">Emergency response tickets, SLA breach calculation, and technician dispatch engine.</p>
        </div>
        <button
          onClick={() => setIsNewOpen(true)}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Breakdown Complaint</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching breakdown complaints..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Ticket #</th>
                <th className="p-4">Building / Lift</th>
                <th className="p-4">Category</th>
                <th className="p-4">Priority</th>
                <th className="p-4">SLA Target</th>
                <th className="p-4">SLA Status</th>
                <th className="p-4">Technician</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-rose-600">{c.complaintId}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{c.liftId?.buildingName}</div>
                    <div className="text-xs text-slate-400 font-mono">Code: {c.liftId?.assetCode}</div>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">{c.category}</td>
                  <td className="p-4">
                    <Badge variant={c.priority === 'CRITICAL' ? 'danger' : c.priority === 'HIGH' ? 'warning' : 'info'}>
                      {c.priority}
                    </Badge>
                  </td>
                  <td className="p-4 text-xs font-medium text-slate-600">{c.slaTargetMinutes} min</td>
                  <td className="p-4">
                    <Badge
                      variant={
                        c.slaStatus === 'BREACHED' ? 'danger' : c.slaStatus === 'AT_RISK' ? 'warning' : 'success'
                      }
                    >
                      {c.slaStatus}
                    </Badge>
                  </td>
                  <td className="p-4 text-xs font-semibold text-slate-800">{c.assignedTechnician?.name || 'Unassigned'}</td>
                  <td className="p-4 text-right space-x-2">
                    {!c.assignedTechnician && c.status !== 'RESOLVED' && (
                      <button
                        onClick={() => openDispatchModal(c)}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-200"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch</span>
                      </button>
                    )}
                    <Link
                      href={`/complaints/${c._id}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-sky-600 bg-sky-50 p-2 rounded-lg border border-sky-200"
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

      {/* Raise Complaint Modal */}
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Raise Emergency Breakdown Ticket">
        <form onSubmit={handleRaiseComplaint} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Lift Asset</label>
            <select
              value={newForm.liftId}
              onChange={(e) => setNewForm({ ...newForm, liftId: e.target.value })}
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={newForm.category}
                onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              >
                <option value="PASSENGER_TRAPPED">PASSENGER TRAPPED (SLA 60m)</option>
                <option value="LIFT_NOT_WORKING">LIFT NOT WORKING (SLA 120m)</option>
                <option value="DOOR_PROBLEM">DOOR PROBLEM (SLA 240m)</option>
                <option value="NOISE">NOISE / VIBRATION (SLA 480m)</option>
                <option value="POWER_FAILURE">POWER FAILURE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
              <select
                value={newForm.priority}
                onChange={(e) => setNewForm({ ...newForm, priority: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              >
                <option value="CRITICAL">CRITICAL (60 mins)</option>
                <option value="HIGH">HIGH (120 mins)</option>
                <option value="MEDIUM">MEDIUM (240 mins)</option>
                <option value="LOW">LOW (480 mins)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Detailed Breakdown Problem</label>
            <textarea
              required
              rows={3}
              value={newForm.description}
              onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
              className="w-full text-sm p-2.5 border rounded-lg"
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-rose-600 text-white font-bold rounded-lg text-sm hover:bg-rose-700">
            Submit Emergency Breakdown Ticket
          </button>
        </form>
      </Modal>

      {/* Technician Dispatch Modal */}
      <Modal isOpen={isDispatchOpen} onClose={() => setIsDispatchOpen(false)} title={`Technician Dispatch Engine - ${selectedComplaint?.complaintId}`}>
        {dispatchLoading ? (
          <LoadingSpinner message="Ranking and fetching active technicians..." />
        ) : (
          <form onSubmit={handleDispatch} className="space-y-4">
            <p className="text-xs text-slate-500">Ranked by zone match, availability status, and lowest active workload.</p>
            {technicians.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold">
                No active field technicians available in system. Please register a technician in User Directory.
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ranked Technicians</label>
                <select
                  value={dispatchTechId}
                  onChange={(e) => setDispatchTechId(e.target.value)}
                  className="w-full text-sm p-2.5 border rounded-lg"
                >
                  {technicians.map((t) => (
                    <option key={t.techId} value={t.techId}>
                      {t.name} ({t.zone}) - Active Jobs: {t.activeJobsCount} [{t.status}]
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={technicians.length === 0}
              className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm & Dispatch Technician
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
