'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function PublicCertificateVerifyPage() {
  const { token } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verifyCert() {
      try {
        setLoading(true);
        const res = await fetch(`/api/certificates/verify/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Certificate verification failed');
        setCert(data.certificate);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) verifyCert();
  }, [token]);

  if (loading) return <LoadingSpinner message="Verifying certificate token..." />;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-purple-600 p-6 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
            <Award className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold">Certificate Public Verification</h2>
          <p className="text-xs text-purple-100 mt-0.5">Authentic Lift Systems Compliance Certificate</p>
        </div>

        <div className="p-6 space-y-4">
          {error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-center text-sm font-semibold">
              {error}
            </div>
          ) : (
            cert && (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-xs font-bold text-slate-400 uppercase">Verification Status</span>
                  <Badge variant="purple">AUTHENTIC CERTIFICATE</Badge>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Certificate Title</span>
                  <h3 className="font-bold text-slate-900 text-base">{cert.title}</h3>
                  <p className="text-xs text-purple-600 font-semibold mt-0.5">Type: {cert.certificateType}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase">Issued To</span>
                    <div className="font-bold text-slate-900 text-sm">{cert.issuedTo}</div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase">Issue Date</span>
                    <div className="font-semibold text-slate-800">{new Date(cert.issueDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase">Details</span>
                    <div className="text-slate-700 mt-0.5">{cert.details}</div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 text-center pt-2">
                  Verified by Lift AMC & Maintenance Management Platform.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
