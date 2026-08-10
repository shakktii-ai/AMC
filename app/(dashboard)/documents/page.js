'use client';

import React, { useEffect, useState } from 'react';
import { FolderDown, Plus, Download } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocs() {
      try {
        setLoading(true);
        const res = await fetch('/api/documents');
        const data = await res.json();
        if (data.success) setDocuments(data.documents);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Document Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Centralized contract files, service reports, invoices, and technical manuals.</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching document repository..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Document ID</th>
                <th className="p-4">File Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Uploaded For</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sky-600">{doc.documentId}</td>
                  <td className="p-4 font-bold text-slate-900">{doc.name}</td>
                  <td className="p-4">
                    <Badge variant="info">{doc.category}</Badge>
                  </td>
                  <td className="p-4 text-xs text-slate-800">{doc.customerId?.name || 'General'}</td>
                  <td className="p-4 text-xs text-slate-600">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button className="inline-flex items-center space-x-1 text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
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
