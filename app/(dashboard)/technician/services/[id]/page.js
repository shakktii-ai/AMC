'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, CheckCircle, FileText } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function TechnicianJobExecutionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [checklist, setChecklist] = useState([
    { task: 'Inspect traction machine motor, gear housing oil levels, and mounting bolts', status: 'PASS', notes: '' },
    { task: 'Test brake shoe operation, air gap clearance, and emergency stop circuit', status: 'PASS', notes: '' },
    { task: 'Inspect car door operator belt, door lock switches, and optical safety curtain', status: 'PASS', notes: '' },
    { task: 'Clean shaft pit, check counterweight guide shoes, and oil buffers', status: 'PASS', notes: '' },
    { task: 'Inspect hoist ropes, governor cable, and safety gear trip mechanisms', status: 'PASS', notes: '' },
  ]);

  const [workPerformed, setWorkPerformed] = useState('Routine monthly inspection performed cleanly.');
  const [partsReplacedNotes, setPartsReplacedNotes] = useState('Cleaned optical sensor lens.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/services/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: id,
          checklist,
          workPerformed,
          partsReplacedNotes,
          customerConfirmation: true,
          signature: 'DIGITAL_SIGNATURE_CUSTOMER_ACCEPTED',
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to submit service report');

      router.push('/technician');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaskStatus = (idx) => {
    const updated = [...checklist];
    updated[idx].status = updated[idx].status === 'PASS' ? 'FAIL' : 'PASS';
    setChecklist(updated);
  };

  if (loading) return <LoadingSpinner message="Loading job execution form..." />;
  if (!data || !data.service) return <div className="p-8 text-center text-slate-500">Service record not found.</div>;

  const { service } = data;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/technician" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Job Execution Form #{service.serviceId}</h1>
          <p className="text-xs text-slate-500">{service.liftId?.buildingName} ({service.liftId?.assetCode})</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs">{error}</div>}

        {/* Safety Checklist */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-wider">Interactive Safety Checklist</h3>
          <div className="space-y-3">
            {checklist.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-800 leading-snug">{item.task}</span>
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(idx)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    item.status === 'PASS' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {item.status}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Work Performed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 uppercase tracking-wider">Service Execution Notes</h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Work Performed *</label>
            <textarea
              rows={3}
              required
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Spare Parts / Maintenance Notes</label>
            <input
              type="text"
              value={partsReplacedNotes}
              onChange={(e) => setPartsReplacedNotes(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-lg"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2"
        >
          <CheckCircle className="w-5 h-5" />
          <span>{submitting ? 'Submitting Report...' : 'Complete Job & Submit Service Report'}</span>
        </button>
      </form>
    </div>
  );
}
