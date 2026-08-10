'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CalendarCheck, ArrowLeft, CheckCircle, FileText, User, Wrench } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadService() {
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
    }
    if (id) loadService();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading service details..." />;
  if (!data || !data.service) return <div className="p-8 text-center text-slate-500">Service record not found.</div>;

  const { service, serviceReport } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/services" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Service #{service.serviceId}</h1>
            <Badge variant={service.status === 'COMPLETED' ? 'success' : 'info'}>{service.status}</Badge>
          </div>
          <p className="text-sm text-slate-500">Source: {service.serviceSource} • Lift Asset: {service.liftId?.buildingName}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Customer</span>
          <div className="font-bold text-slate-900 mt-1">{service.customerId?.name}</div>
          <div className="text-xs text-slate-500">{service.customerId?.companyName}</div>
        </div>
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Scheduled Time</span>
          <div className="font-semibold text-slate-800 mt-1">{new Date(service.scheduledStartTime).toLocaleString()}</div>
        </div>
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Assigned Technician</span>
          <div className="font-semibold text-slate-800 mt-1">{service.technicianId?.name || 'Unassigned'}</div>
          <div className="text-xs text-slate-500">{service.technicianId?.phone}</div>
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
    </div>
  );
}
