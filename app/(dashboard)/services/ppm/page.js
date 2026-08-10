'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Eye } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function PpmPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPpm() {
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
    }
    loadPpm();
  }, []);

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
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sky-600 whitespace-nowrap" title={s.serviceId}>{s.serviceId}</td>
                  <td className="p-4 font-bold text-slate-900">{s.customerId?.name}</td>
                  <td className="p-4 text-xs font-semibold text-slate-800">{s.liftId?.buildingName} ({s.liftId?.assetCode})</td>
                  <td className="p-4 text-xs text-slate-600">{new Date(s.scheduledStartTime).toLocaleString()}</td>
                  <td className="p-4 text-xs font-medium text-slate-800">{s.technicianId?.name || 'Unassigned'}</td>
                  <td className="p-4">
                    <Badge variant={s.status === 'COMPLETED' ? 'success' : s.status === 'IN_PROGRESS' ? 'warning' : 'info'}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/services/${s._id}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 p-2 rounded-lg border border-sky-200"
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
    </div>
  );
}
