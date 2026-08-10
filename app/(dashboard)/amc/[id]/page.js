'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle, RefreshCw, XCircle, CalendarCheck, Award } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function AmcDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAmc = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/amc/${id}`);
      const result = await res.json();
      if (result.success) setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAmc();
  }, [id]);

  const handleAction = async (action) => {
    try {
      const res = await fetch(`/api/amc/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) loadAmc();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading AMC contract details..." />;
  if (!data || !data.amc) return <div className="p-8 text-center text-slate-500">AMC contract not found.</div>;

  const { amc, services } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/amc" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">Contract #{amc.contractNumber}</h1>
              <Badge variant={amc.computedStatus === 'ACTIVE' ? 'success' : 'warning'}>{amc.computedStatus}</Badge>
            </div>
            <p className="text-sm text-slate-500">{amc.customerId?.name} ({amc.customerId?.companyName})</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {amc.status === 'DRAFT' && (
            <button
              onClick={() => handleAction('ACTIVATE')}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Activate Contract</span>
            </button>
          )}
          {(amc.computedStatus === 'ACTIVE' || amc.computedStatus === 'EXPIRING_SOON') && (
            <button
              onClick={() => handleAction('RENEW')}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Renew AMC Contract</span>
            </button>
          )}
          {amc.status !== 'CANCELLED' && (
            <button
              onClick={() => handleAction('CANCEL')}
              className="inline-flex items-center space-x-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm px-4 py-2.5 rounded-lg"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Contract</span>
            </button>
          )}
        </div>
      </div>

      {/* Contract Details Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Plan Type</span>
          <div className="font-bold text-slate-900 mt-1">{amc.planType}</div>
          <div className="text-xs text-slate-500 mt-0.5">{amc.ppmInterval} PPM</div>
        </div>
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Start & End Dates</span>
          <div className="font-semibold text-slate-900 mt-1">{new Date(amc.startDate).toLocaleDateString()}</div>
          <div className="text-xs text-slate-500">to {new Date(amc.endDate).toLocaleDateString()}</div>
        </div>
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Covered Lift Assets</span>
          <div className="font-bold text-sky-600 mt-1">{amc.liftIds?.length || 0} Lifts Covered</div>
        </div>
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Contract Financial Total</span>
          <div className="text-xl font-black text-slate-900 mt-1">₹{amc.totalAmount.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Generated PPM Visits */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b pb-3">
          <CalendarCheck className="w-5 h-5 text-sky-600" />
          <h3 className="text-base font-bold text-slate-900">Automated PPM Service Schedule ({services.length} Visits)</h3>
        </div>
        <div className="divide-y text-sm">
          {services.map((s) => (
            <div key={s._id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-mono font-bold text-slate-900">{s.serviceId}</div>
                <div className="text-xs text-slate-500">Scheduled: {new Date(s.scheduledStartTime).toLocaleString()}</div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-500">{s.technicianId?.name || 'Unassigned'}</span>
                <Badge variant={s.status === 'COMPLETED' ? 'success' : 'info'}>{s.status}</Badge>
              </div>
            </div>
          ))}
          {services.length === 0 && <p className="text-xs text-slate-500">No PPM visits scheduled.</p>}
        </div>
      </div>
    </div>
  );
}
