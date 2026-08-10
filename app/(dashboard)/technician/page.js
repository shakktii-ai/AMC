'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, AlertTriangle, CheckCircle2, Clock, MapPin, ArrowRight } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function TechnicianDashboardPage() {
  const [services, setServices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTechJobs() {
      try {
        setLoading(true);
        const [sRes, cRes] = await Promise.all([fetch('/api/services'), fetch('/api/complaints')]);
        const sData = await sRes.json();
        const cData = await cRes.json();

        if (sData.success) setServices(sData.services);
        if (cData.success) setComplaints(cData.complaints);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTechJobs();
  }, []);

  if (loading) return <LoadingSpinner message="Loading technician dispatch queue..." />;

  const pendingServices = services.filter((s) => s.status !== 'COMPLETED');
  const pendingComplaints = complaints.filter((c) => c.status !== 'RESOLVED');

  return (
    <div className="space-y-6">
      <div className="bg-sky-700 text-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold">Field Technician Portal</h1>
        <p className="text-xs text-sky-100 mt-1">Mobile-optimized execution interface for assigned PPM visits and breakdown dispatch jobs.</p>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
            <span className="text-[11px] uppercase font-bold text-sky-200">Pending PPM Jobs</span>
            <div className="text-2xl font-black">{pendingServices.length}</div>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
            <span className="text-[11px] uppercase font-bold text-sky-200">Emergency Breakdowns</span>
            <div className="text-2xl font-black text-rose-300">{pendingComplaints.length}</div>
          </div>
        </div>
      </div>

      {/* Emergency Complaints */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Emergency Breakdown Callouts ({pendingComplaints.length})</span>
          </h3>
          <Link href="/technician/complaints" className="text-xs font-semibold text-sky-600">
            View All
          </Link>
        </div>

        <div className="space-y-3">
          {pendingComplaints.map((c) => (
            <div key={c._id} className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-rose-600 text-xs">{c.complaintId}</span>
                <Badge variant={c.priority === 'CRITICAL' ? 'danger' : 'warning'}>{c.priority}</Badge>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{c.liftId?.buildingName}</h4>
              <p className="text-xs text-slate-500">{c.description}</p>
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <span className="text-slate-400 font-bold">SLA Status:</span>
                <Badge variant={c.slaStatus === 'BREACHED' ? 'danger' : 'success'}>{c.slaStatus}</Badge>
              </div>
            </div>
          ))}
          {pendingComplaints.length === 0 && <p className="text-xs text-slate-500 bg-white p-4 rounded-xl border text-center">No open emergency callouts.</p>}
        </div>
      </div>

      {/* Scheduled Services */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-sky-600" />
            <span>Assigned Maintenance Jobs ({pendingServices.length})</span>
          </h3>
          <Link href="/technician/services" className="text-xs font-semibold text-sky-600">
            View All
          </Link>
        </div>

        <div className="space-y-3">
          {pendingServices.map((s) => (
            <div key={s._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sky-600 text-xs">{s.serviceId}</span>
                <Badge variant={s.status === 'IN_PROGRESS' ? 'warning' : 'info'}>{s.status}</Badge>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{s.liftId?.buildingName}</h4>
                <p className="text-xs text-slate-500">Asset Code: {s.liftId?.assetCode} • Wing {s.liftId?.wing || 'A'}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-slate-500">{new Date(s.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <Link
                  href={`/technician/services/${s._id}`}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200"
                >
                  <span>Execute Service Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
          {pendingServices.length === 0 && <p className="text-xs text-slate-500 bg-white p-4 rounded-xl border text-center">No pending maintenance jobs.</p>}
        </div>
      </div>
    </div>
  );
}
