'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListChecks, Plus, ArrowLeft } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import Modal from '@/components/ui/Modal.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Standard Monthly PPM Checklist',
    category: 'PPM',
    items: [
      { task: 'Inspect traction machine motor, gearbox oil level & mounting bolts' },
      { task: 'Check electromagnetic brake shoe clearance, spring tension & coil' },
      { task: 'Inspect car door operator, door lock contacts & safety edge sensor' },
      { task: 'Test emergency alarm bell, battery backup & intercom system' },
    ],
  });

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/checklists');
      const data = await res.json();
      if (data.success) setChecklists(data.checklists);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecklists();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        loadChecklists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/settings" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Maintenance Checklist Templates</h1>
            <p className="text-sm text-slate-500 mt-0.5">Template checklists used by technicians during field service execution.</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Checklist Template</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching checklist templates..." />
      ) : (
        <div className="space-y-4">
          {checklists.map((chk) => (
            <div key={chk._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-base">{chk.name}</h3>
                  <Badge variant="info">{chk.category}</Badge>
                </div>
                <Badge variant={chk.status === 'ACTIVE' ? 'success' : 'default'}>{chk.status}</Badge>
              </div>

              <div className="space-y-1.5 pt-2 border-t text-xs text-slate-700">
                {chk.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="w-4 text-slate-400 font-mono font-bold">{idx + 1}.</span>
                    <span>{item.task}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Maintenance Checklist Template">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Template Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-sm p-2.5 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full text-sm p-2.5 border rounded-lg"
            >
              <option value="PPM">PREVENTIVE MAINTENANCE (PPM)</option>
              <option value="SAFETY">SAFETY INSPECTION</option>
              <option value="BREAKDOWN">BREAKDOWN REPAIR</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-sky-600 text-white font-bold rounded-lg text-sm hover:bg-sky-700">
            Create Template
          </button>
        </form>
      </Modal>
    </div>
  );
}
