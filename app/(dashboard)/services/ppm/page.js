'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Eye, UserPlus, X, CheckCircle, User, Check } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function PpmPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign Modal state
  const [activeService, setActiveService] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const loadPpm = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services?source=PPM');
      const data = await res.json();
      if (data.success) setServices(data.services);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPpm();
  }, []);

  const handleOpenAssignModal = async (service) => {
    setActiveService(service);
    setAssignError('');
    setLoadingTechs(true);
    try {
      const res = await fetch('/api/users?role=TECHNICIAN&status=ACTIVE');
      const result = await res.json();
      if (result.success) {
        setTechnicians(result.users || []);
        if (result.users && result.users.length > 0) {
          setSelectedTechId(result.users[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
      setAssignError('Failed to load active field technicians.');
    } finally {
      setLoadingTechs(false);
    }
  };

  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!activeService || !selectedTechId) return;

    setAssigning(true);
    setAssignError('');

    try {
      const res = await fetch(`/api/services/${activeService._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: selectedTechId,
          status: 'ASSIGNED',
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to assign technician');

      setActiveService(null);
      await loadPpm();
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">PPM Schedules</h1>
        <p className="text-sm text-slate-500 mt-0.5">Automated Preventive Maintenance schedules generated from active AMC contracts.</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading PPM schedules..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Service ID</th>
                <th className="p-4">Customer & Building</th>
                <th className="p-4">Lift Asset</th>
                <th className="p-4">Scheduled Start</th>
                <th className="p-4">Technician</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sky-600 whitespace-nowrap" title={s.serviceId}>{s.serviceId}</td>
                  <td className="p-4 font-bold text-slate-900">{s.customerId?.name}</td>
                  <td className="p-4 text-xs font-semibold text-slate-800">{s.liftId?.buildingName} ({s.liftId?.assetCode})</td>
                  <td className="p-4 text-xs text-slate-600">{new Date(s.scheduledStartTime).toLocaleString()}</td>
                  <td className="p-4 text-xs">
                    {s.technicianId?.name ? (
                      <span className="font-bold text-sky-700">{s.technicianId.name}</span>
                    ) : (
                      <span className="text-amber-600 font-semibold">— Unassigned</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant={s.status === 'COMPLETED' ? 'success' : s.status === 'ASSIGNED' ? 'info' : 'warning'}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {s.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(s)}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg border border-sky-200 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{s.technicianId ? 'Reassign' : 'Assign'}</span>
                      </button>
                    )}
                    <Link
                      href={`/services/${s._id}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 p-2 rounded-lg border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ASSIGN TECHNICIAN MODAL */}
      {activeService && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl border">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-slate-900">
                <UserPlus className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold">Assign Technician #{activeService.serviceId}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveService(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{assignError}</div>}

            {loadingTechs ? (
              <LoadingSpinner message="Fetching active field technicians..." />
            ) : technicians.length === 0 ? (
              <div className="p-4 text-center text-xs text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                No active field technicians found.
              </div>
            ) : (
              <form onSubmit={handleAssignTechnician} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Select Technician *</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                    {technicians.map((tech) => {
                      const isSelected = selectedTechId === tech._id;
                      return (
                        <div
                          key={tech._id}
                          onClick={() => setSelectedTechId(tech._id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-sky-600 bg-sky-50/80 ring-1 ring-sky-600'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{tech.name}</div>
                              <div className="text-[11px] text-slate-500">{tech.email} • {tech.phone || 'No phone'}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-sky-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveService(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning}
                    className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-md transition-colors flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{assigning ? 'Confirming...' : 'Confirm & Assign Technician'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
