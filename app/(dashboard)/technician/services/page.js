'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Eye } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function TechnicianServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.success) setServices(data.services);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Assigned Service Visits</h1>
        <p className="text-sm text-slate-500 mt-0.5">Assigned maintenance jobs strictly scoped to your field schedule.</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching assigned service jobs..." />
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sky-600 text-xs">{s.serviceId}</span>
                  <Badge variant={s.status === 'COMPLETED' ? 'success' : 'info'}>{s.status}</Badge>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{s.liftId?.buildingName}</h4>
                <p className="text-xs text-slate-500">{new Date(s.scheduledStartTime).toLocaleString()}</p>
              </div>
              <Link
                href={`/technician/services/${s._id}`}
                className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200"
              >
                Execute Report
              </Link>
            </div>
          ))}
          {services.length === 0 && <p className="text-sm text-slate-500">No services assigned.</p>}
        </div>
      )}
    </div>
  );
}
