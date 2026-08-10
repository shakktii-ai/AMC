'use client';

import React, { useEffect, useState } from 'react';
import { History, Shield, Filter } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const res = await fetch('/api/audit-logs');
        const data = await res.json();
        if (data.success) setLogs(data.logs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Append-only audit trail recording user logins, financial transactions, and operational updates.</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching append-only audit trail..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">User</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4">
                    <Badge variant="purple">{log.action}</Badge>
                  </td>
                  <td className="p-4 font-semibold text-slate-900">{log.userId?.name || 'System / Guest'}</td>
                  <td className="p-4 text-xs font-bold text-slate-700">{log.entity}</td>
                  <td className="p-4 font-mono text-xs text-slate-500 truncate max-w-xs">{log.entityId || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
