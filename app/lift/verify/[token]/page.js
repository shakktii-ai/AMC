'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, CheckCircle2, AlertTriangle, Building2, Wrench, FileText } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function PublicLiftVerifyPage() {
  const { token } = useParams();
  const [lift, setLift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        setLoading(true);
        const res = await fetch(`/api/lifts/verify/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');
        setLift(data.lift);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) verify();
  }, [token]);

  if (loading) return <LoadingSpinner message="Verifying lift QR token authenticity..." />;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-sky-600 p-6 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold">Lift Asset QR Verification</h2>
          <p className="text-xs text-sky-100 mt-0.5">Authentic Lift AMC Maintenance System Record</p>
        </div>

        <div className="p-6 space-y-4">
          {error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-center text-sm font-semibold">
              {error}
            </div>
          ) : (
            lift && (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-xs font-bold text-slate-400 uppercase">Verification Status</span>
                  <Badge variant="success">VERIFIED AUTHENTIC</Badge>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Building Asset Location</span>
                  <h3 className="font-bold text-slate-900 text-base">{lift.buildingName}</h3>
                  <p className="text-xs text-slate-500">{lift.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase">Asset Code</span>
                    <div className="font-mono font-bold text-slate-900">{lift.assetCode}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase">Serial Number</span>
                    <div className="font-mono font-bold text-slate-900">{lift.serialNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase">Capacity</span>
                    <div className="font-semibold text-slate-800">{lift.capacityKg} kg ({lift.capacityPersons} P)</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase">Drive Type</span>
                    <div className="font-semibold text-slate-800">{lift.driveType}</div>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Warranty Coverage:</span>
                    <Badge variant={lift.warrantyStatus === 'ACTIVE' ? 'success' : 'default'}>{lift.warrantyStatus}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Annual Maintenance Contract (AMC):</span>
                    <Badge variant={lift.amcStatus === 'ACTIVE' ? 'success' : 'warning'}>{lift.amcStatus}</Badge>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 text-center pt-2">
                  Privacy Protected: Customer contact numbers, billing amounts, and personal details are strictly omitted for security.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
