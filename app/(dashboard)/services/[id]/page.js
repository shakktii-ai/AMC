'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarCheck,
  ArrowLeft,
  CheckCircle,
  FileText,
  User,
  Wrench,
  UserPlus,
  X,
  Play,
  Clock,
  Building2,
  Check,
} from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Technician Assignment Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccessMsg, setAssignSuccessMsg] = useState('');

  const loadService = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/services/${id}`);
      const result = await res.json();
      if (result.success) setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadService();
  }, [id]);

  const handleOpenAssignModal = async () => {
    setAssignError('');
    setShowAssignModal(true);
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
      setAssignError('Failed to load active technicians list.');
    } finally {
      setLoadingTechs(false);
    }
  };

  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!selectedTechId) {
      setAssignError('Please select a technician to assign.');
      return;
    }

    setAssigning(true);
    setAssignError('');
    setAssignSuccessMsg('');

    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: selectedTechId,
          status: 'ASSIGNED',
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to assign technician');

      setShowAssignModal(false);
      setAssignSuccessMsg('Technician assigned successfully!');
      await loadService();
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading service details..." />;
  if (!data || !data.service) return <div className="p-8 text-center text-slate-500">Service record not found.</div>;

  const { service, serviceReport } = data;
  const isAssigned = !!service.technicianId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/services" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">Service #{service.serviceId}</h1>
              <Badge variant={service.status === 'COMPLETED' ? 'success' : service.status === 'ASSIGNED' ? 'info' : 'warning'}>
                {service.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">Source: {service.serviceSource} • Lift Asset: {service.liftId?.buildingName || service.liftId?.assetCode || 'Elevator'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* ASSIGN / REASSIGN TECHNICIAN BUTTON */}
          {service.status !== 'COMPLETED' && (
            <button
              type="button"
              onClick={handleOpenAssignModal}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isAssigned ? 'Reassign Technician' : 'Assign Technician'}</span>
            </button>
          )}

          {/* WORK ON SERVICE / JOB EXECUTION FORM BUTTON */}
          {isAssigned && service.status !== 'COMPLETED' && (
            <Link
              href={`/technician/services/${service._id}`}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Work On Service (Job Form)</span>
            </Link>
          )}
        </div>
      </div>

      {assignSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{assignSuccessMsg}</span>
        </div>
      )}

      {/* Service Meta Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Customer</span>
          <div className="font-bold text-slate-900 mt-1">{service.customerId?.name || 'N/A'}</div>
          <div className="text-xs text-slate-500">{service.customerId?.companyName}</div>
        </div>
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Scheduled Time</span>
          <div className="font-semibold text-slate-800 mt-1">{new Date(service.scheduledStartTime).toLocaleString()}</div>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Assigned Technician</span>
            <div className="font-bold text-slate-900 mt-1">
              {service.technicianId?.name ? (
                <span className="text-sky-700">{service.technicianId.name}</span>
              ) : (
                <span className="text-amber-600">Unassigned</span>
              )}
            </div>
            {service.technicianId?.email && <div className="text-xs text-slate-500">{service.technicianId.email}</div>}
            {service.technicianId?.phone && <div className="text-xs text-slate-500">{service.technicianId.phone}</div>}
          </div>

          {service.status !== 'COMPLETED' && (
            <button
              type="button"
              onClick={handleOpenAssignModal}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 underline"
            >
              {isAssigned ? 'Change' : 'Assign'}
            </button>
          )}
        </div>
      </div>

      {serviceReport && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b pb-3 text-slate-900">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold">Service Execution Report</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Work Performed Notes</span>
              <div className="font-medium text-slate-800 bg-slate-50 p-3 rounded-lg mt-1">{serviceReport.workPerformed}</div>
            </div>
            {serviceReport.partsReplacedNotes && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Parts Replaced Notes</span>
                <div className="text-slate-800 bg-slate-50 p-3 rounded-lg mt-1">{serviceReport.partsReplacedNotes}</div>
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Checklist Results</span>
              <div className="mt-2 space-y-1">
                {serviceReport.checklist?.map((chk, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded">
                    <span>{chk.task}</span>
                    <Badge variant={chk.status === 'PASS' ? 'success' : 'danger'}>{chk.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TECHNICIAN SELECTION MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl border">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-slate-900">
                <UserPlus className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold">Assign Technician to Service</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
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
                No active field technicians available in system.
              </div>
            ) : (
              <form onSubmit={handleAssignTechnician} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Select Active Technician *</label>
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
                    onClick={() => setShowAssignModal(false)}
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
