'use client';

import React, { useEffect, useState } from 'react';
import { Tool, CheckSquare, Plus, Check } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import Modal from '@/components/ui/Modal.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function InstallationsPage() {
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInst, setSelectedInst] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadInstallations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/installations');
      const data = await res.json();
      if (data.success) setInstallations(data.installations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstallations();
  }, []);

  const updateStatus = async (instId, newStatus) => {
    try {
      await fetch(`/api/installations/${instId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadInstallations();
      if (selectedInst && selectedInst._id === instId) {
        setSelectedInst((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Installation Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track project milestones, safety checklists, commissioning, and handover.</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading installation projects..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Installation ID</th>
                <th className="p-4">Lift Asset</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Scheduled Date</th>
                <th className="p-4">Assigned Tech</th>
                <th className="p-4">Stage Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {installations.map((inst) => (
                <tr key={inst._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sky-600">{inst.installationId}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{inst.liftId?.buildingName || 'Lift Asset'}</div>
                    <div className="text-xs text-slate-400 font-mono">Code: {inst.liftId?.assetCode}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-900">{inst.customerId?.name}</td>
                  <td className="p-4 text-xs text-slate-600">{new Date(inst.scheduledDate).toLocaleDateString()}</td>
                  <td className="p-4 text-xs text-slate-800">{inst.assignedTechnicianId?.name || 'Unassigned'}</td>
                  <td className="p-4">
                    <Badge variant={inst.status === 'HANDED_OVER' ? 'success' : inst.status === 'IN_PROGRESS' ? 'warning' : 'info'}>
                      {inst.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedInst(inst);
                        setIsDetailOpen(true);
                      }}
                      className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200"
                    >
                      Checklist & Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Safety Checklist Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Installation Checklist - ${selectedInst?.installationId}`}>
        {selectedInst && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">Current Stage:</span>
                <span className="ml-2 font-bold text-slate-900">{selectedInst.status}</span>
              </div>
              <div className="space-x-2">
                {selectedInst.status !== 'COMMISSIONED' && selectedInst.status !== 'HANDED_OVER' && (
                  <button
                    onClick={() => updateStatus(selectedInst._id, 'COMMISSIONED')}
                    className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg"
                  >
                    Mark Commissioned
                  </button>
                )}
                {selectedInst.status === 'COMMISSIONED' && (
                  <button
                    onClick={() => updateStatus(selectedInst._id, 'HANDED_OVER')}
                    className="text-xs bg-purple-600 text-white font-bold px-3 py-1.5 rounded-lg"
                  >
                    Customer Handover & Certificate
                  </button>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Safety Verification Checklist</h4>
              <div className="space-y-2 border rounded-xl p-3 max-h-60 overflow-y-auto">
                {selectedInst.safetyChecklist?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded">
                    <span className="font-semibold text-slate-800">{item.item}</span>
                    <span className="text-emerald-600 font-bold flex items-center space-x-1">
                      <Check className="w-4 h-4" />
                      <span>Verified</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
