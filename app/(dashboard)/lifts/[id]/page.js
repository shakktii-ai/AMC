'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Wrench, ArrowLeft, QrCode, ShieldCheck, FileText, CalendarCheck, AlertTriangle, Building2 } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function LiftDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLift() {
      try {
        setLoading(true);
        const res = await fetch(`/api/lifts/${id}`);
        const result = await res.json();
        if (result.success) setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadLift();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading lift asset profile..." />;
  if (!data || !data.lift) return <div className="p-8 text-center text-slate-500">Lift record not found.</div>;

  const { lift, warranties, amcs, services, complaints } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/lifts" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">{lift.buildingName}</h1>
              <Badge variant={lift.status === 'ACTIVE' || lift.status === 'UNDER_AMC' ? 'success' : 'warning'}>{lift.status}</Badge>
            </div>
            <p className="text-sm text-slate-500">Lift ID: {lift.liftId} • Asset Code: {lift.assetCode} • Serial: {lift.serialNumber}</p>
          </div>
        </div>

        <Link
          href={`/lift/verify/${lift.verificationToken}`}
          target="_blank"
          className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <QrCode className="w-4 h-4" />
          <span>Public QR Verification</span>
        </Link>
      </div>

      {/* Technical Specifications Grid */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b">Technical Specifications</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Customer Owner</span>
            <div className="font-semibold text-slate-800 mt-1">{lift.customerId?.name} ({lift.customerId?.companyName})</div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Location Details</span>
            <div className="font-semibold text-slate-800 mt-1">Wing {lift.wing || 'Main'} • Floor {lift.floor || 'G'}</div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Capacity</span>
            <div className="font-semibold text-slate-800 mt-1">{lift.capacityKg} kg / {lift.capacityPersons} Persons</div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Speed & Stops</span>
            <div className="font-semibold text-slate-800 mt-1">{lift.speedMs} M/S • {lift.floors} Stops</div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Drive System</span>
            <div className="font-semibold text-slate-800 mt-1">{lift.driveType}</div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Controller</span>
            <div className="font-semibold text-slate-800 mt-1">{lift.controllerType}</div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Door Operator</span>
            <div className="font-semibold text-slate-800 mt-1">{lift.doorType}</div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Verification Token</span>
            <div className="font-mono text-xs text-purple-700 bg-purple-50 p-1 rounded mt-1 truncate">{lift.verificationToken}</div>
          </div>
        </div>
      </div>

      {/* History Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AMC History */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 border-b pb-3">
            <FileText className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold">AMC Contract History</h3>
          </div>
          <div className="divide-y text-sm">
            {amcs.map((a) => (
              <div key={a._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-slate-800">{a.contractNumber}</div>
                  <div className="text-xs text-slate-500">{new Date(a.startDate).toLocaleDateString()} to {new Date(a.endDate).toLocaleDateString()}</div>
                </div>
                <Badge variant={a.status === 'ACTIVE' ? 'success' : 'default'}>{a.status}</Badge>
              </div>
            ))}
            {amcs.length === 0 && <p className="text-xs text-slate-500 py-2">No AMC contracts linked.</p>}
          </div>
        </div>

        {/* Complaint History */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 border-b pb-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold">Breakdown Complaints</h3>
          </div>
          <div className="divide-y text-sm">
            {complaints.map((c) => (
              <div key={c._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{c.complaintId} - {c.category}</div>
                  <div className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
                <Badge variant={c.priority === 'CRITICAL' ? 'danger' : 'warning'}>{c.status}</Badge>
              </div>
            ))}
            {complaints.length === 0 && <p className="text-xs text-slate-500 py-2">No breakdown complaints recorded.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
