'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, Save, ListChecks } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: 'Lift Tech AMC Solutions',
    legalName: 'Lift Tech Maintenance Pvt Ltd',
    logo: '',
    address: '123 Elevator Tech Park, MIDC Industrial Area',
    phone: '+91 98765 43210',
    email: 'support@lifttech.local',
    website: 'https://lifttech.local',
    gstin: '27AAAAA0000A1Z5',
    currency: 'INR',
    invoicePrefix: 'INV-2026-',
    invoiceDueDays: 30,
    invoiceTerms: 'Payment due within 30 days of invoice date.',
    invoiceFooter: 'Thank you for choosing Lift Tech Maintenance.',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) setMessage('Settings updated successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading company settings..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure organization profiles, tax GSTIN, and default invoice terms.</p>
        </div>
        <Link
          href="/settings/checklists"
          className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm"
        >
          <ListChecks className="w-4 h-4" />
          <span>Checklist Templates</span>
        </Link>
      </div>

      {message && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg text-sm">{message}</div>}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Display Name</label>
              <input
                type="text"
                required
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Legal Registered Name</label>
              <input
                type="text"
                required
                value={settings.legalName}
                onChange={(e) => setSettings({ ...settings, legalName: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GSTIN Registration</label>
              <input
                type="text"
                required
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Head Office Address</label>
            <textarea
              rows={2}
              required
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full text-sm p-2.5 border rounded-lg"
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
