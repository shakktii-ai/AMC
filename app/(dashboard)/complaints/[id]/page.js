'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Clock, CheckCircle, User, Wrench, Shield } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComplaint() {
      try {
        setLoading(true);
        const res = await fetch(`/api/complaints/${id}`);
        const result = await res.json();
        if (result.success) setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadComplaint();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading complaint ticket details..." />;
  if (!data || !data.complaint) return <div className="p-8 text-center text-slate-500">Complaint record not found.</div>;

  const { complaint, serviceReport } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/complaints" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Complaint Ticket #{complaint.complaintId}</h1>
            <Badge variant={complaint.priority === 'CRITICAL' ? 'danger' : 'warning'}>{complaint.priority}</Badge>
          </div>
          <p className="text-sm text-slate-500">Category: {complaint.category} • Lift: {complaint.liftId?.buildingName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b pb-2">Ticket Summary</h3>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Customer Description</span>
            <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-lg mt-1">{complaint.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Current Lifecycle Status</span>
              <div className="font-bold text-slate-900 mt-1">{complaint.status}</div>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Assigned Technician</span>
              <div className="font-bold text-slate-900 mt-1">{complaint.assignedTechnician?.name || 'Unassigned'}</div>
            </div>
          </div>
        </div>

        {/* SLA Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 border-b pb-2">
            <Clock className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold">SLA Tracker</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase">SLA Target Time</span>
              <div className="font-bold text-slate-900">{complaint.slaTargetMinutes} minutes</div>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase">SLA Due Date</span>
              <div className="text-xs text-slate-700">{new Date(complaint.slaDueDate).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase">Dynamic Status</span>
              <div className="mt-1">
                <Badge variant={complaint.slaStatus === 'BREACHED' ? 'danger' : complaint.slaStatus === 'AT_RISK' ? 'warning' : 'success'}>
                  {complaint.slaStatus}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
