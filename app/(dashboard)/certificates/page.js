'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, QrCode, Eye } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCerts() {
      try {
        setLoading(true);
        const res = await fetch('/api/certificates');
        const data = await res.json();
        if (data.success) setCertificates(data.certificates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCerts();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Certificate Register</h1>
        <p className="text-sm text-slate-500 mt-0.5">Installation, handover, warranty, AMC, and service completion certificates with public verification tokens.</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching certificates..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Certificate ID</th>
                <th className="p-4">Type</th>
                <th className="p-4">Title</th>
                <th className="p-4">Issued To</th>
                <th className="p-4">Issue Date</th>
                <th className="p-4 text-right">Public Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certificates.map((cert) => (
                <tr key={cert._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sky-600">{cert.certificateId}</td>
                  <td className="p-4">
                    <Badge variant="purple">{cert.certificateType}</Badge>
                  </td>
                  <td className="p-4 font-bold text-slate-900">{cert.title}</td>
                  <td className="p-4 text-slate-800">{cert.customerId?.name || 'Customer'}</td>
                  <td className="p-4 text-xs text-slate-600">{new Date(cert.issueDate).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/certificate/verify/${cert.verificationToken}`}
                      target="_blank"
                      className="inline-flex items-center space-x-1 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Verify Public</span>
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
