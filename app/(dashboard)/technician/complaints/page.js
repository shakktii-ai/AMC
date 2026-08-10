'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, MapPin, Eye } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function TechnicianComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComplaints() {
      try {
        setLoading(true);
        const res = await fetch('/api/complaints');
        const data = await res.json();
        if (data.success) setComplaints(data.complaints);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadComplaints();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assigned Breakdown Complaints</h1>
        <p className="text-sm text-slate-500 mt-0.5">Emergency breakdown jobs assigned strictly to you.</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching breakdown jobs..." />
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div key={c._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-rose-600">{c.complaintId}</span>
                  <Badge variant={c.priority === 'CRITICAL' ? 'danger' : 'warning'}>{c.priority}</Badge>
                </div>
                <Badge variant={c.slaStatus === 'BREACHED' ? 'danger' : 'success'}>{c.slaStatus}</Badge>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{c.liftId?.buildingName}</h3>
                <p className="text-xs text-slate-500">{c.liftId?.buildingAddress}</p>
                <p className="text-xs font-medium text-slate-800 mt-1 bg-slate-50 p-2 rounded">{c.description}</p>
              </div>

              <div className="flex items-center justify-between text-xs border-t pt-3">
                <div className="flex items-center space-x-1 text-slate-500">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>SLA Due: {new Date(c.slaDueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <Link
                  href={`/complaints/${c._id}`}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-sky-600 hover:underline"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details & SLA</span>
                </Link>
              </div>
            </div>
          ))}
          {complaints.length === 0 && <p className="text-sm text-slate-500">No active breakdown jobs assigned.</p>}
        </div>
      )}
    </div>
  );
}
