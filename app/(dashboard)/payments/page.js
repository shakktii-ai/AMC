'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import Modal from '@/components/ui/Modal.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    invoiceId: '',
    amountPaid: 25000,
    paymentMethod: 'UPI',
    transactionReference: 'TXN-987654321',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, iRes] = await Promise.all([fetch('/api/payments'), fetch('/api/invoices?status=ISSUED')]);
      const pData = await pRes.json();
      const iData = await iRes.json();

      if (pData.success) setPayments(pData.payments);
      if (iData.success && iData.invoices.length > 0) {
        setInvoices(iData.invoices);
        setFormData((prev) => ({ ...prev, invoiceId: iData.invoices[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amountPaid: Number(formData.amountPaid),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Collection</h1>
          <p className="text-sm text-slate-500 mt-0.5">Record payments, allocate partial payments, and issue receipts with overpayment protection.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching payment records..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Payment ID</th>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Method</th>
                <th className="p-4">Payment Date</th>
                <th className="p-4">Amount Paid</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sky-600">{p.paymentId}</td>
                  <td className="p-4 font-mono text-xs font-bold text-slate-800">{p.invoiceId?.invoiceNumber || 'Invoice'}</td>
                  <td className="p-4 font-bold text-slate-900">{p.customerId?.name}</td>
                  <td className="p-4">
                    <Badge variant="purple">{p.paymentMethod}</Badge>
                  </td>
                  <td className="p-4 text-xs text-slate-600">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-emerald-600">₹{p.amountPaid.toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <Badge variant="success">{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Customer Payment">
        {error && <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs">{error}</div>}

        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Outstanding Invoice</label>
            <select
              value={formData.invoiceId}
              onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
              className="w-full text-sm p-2.5 border rounded-lg"
            >
              {invoices.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber} - Balance Due: ₹{(inv.balanceDue || 0).toLocaleString('en-IN')} ({inv.customerId?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount Paid (₹)</label>
              <input
                type="number"
                required
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              >
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">BANK TRANSFER / NEFT</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="CASH">CASH</option>
                <option value="CARD">CREDIT/DEBIT CARD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transaction Ref / Cheque No.</label>
            <input
              type="text"
              value={formData.transactionReference}
              onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
              className="w-full text-sm p-2.5 border rounded-lg font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-lg text-sm hover:bg-emerald-700 transition-colors"
          >
            {submitting ? 'Recording...' : 'Record Payment & Issue Receipt'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
