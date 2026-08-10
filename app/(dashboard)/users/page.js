'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Shield, CheckCircle, XCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import Modal from '@/components/ui/Modal.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Test@12345',
    role: 'TECHNICIAN',
  });

  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management (RBAC)</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage user accounts and roles across Super Admin, Admin, Manager, Technician, Accountant, and Customer.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add System User</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching user directory..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">System Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{u.name}</td>
                  <td className="p-4 text-slate-600">{u.email}</td>
                  <td className="p-4 text-xs font-mono text-slate-600">{u.phone}</td>
                  <td className="p-4">
                    <Badge variant={u.role === 'SUPER_ADMIN' ? 'purple' : u.role === 'ADMIN' ? 'info' : 'default'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>{u.status}</Badge>
                  </td>
                  <td className="p-4 text-right text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New System User">
        {error && <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs">{error}</div>}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-sm p-2.5 border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SERVICE_MANAGER">SERVICE_MANAGER</option>
                <option value="TECHNICIAN">TECHNICIAN</option>
                <option value="ACCOUNTANT">ACCOUNTANT</option>
                <option value="CUSTOMER">CUSTOMER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Password</label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg font-mono"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-sky-600 text-white font-bold rounded-lg text-sm hover:bg-sky-700">
            Create User Account
          </button>
        </form>
      </Modal>
    </div>
  );
}
