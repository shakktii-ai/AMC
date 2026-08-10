'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Receipt, ArrowLeft, Printer, CreditCard } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoices/${id}`);
        const result = await res.json();
        if (result.success) setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadInvoice();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading tax invoice details..." />;
  if (!data || !data.invoice) return <div className="p-8 text-center text-slate-500">Invoice not found.</div>;

  const { invoice, payments } = data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/invoices" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">Invoice #{invoice.invoiceNumber}</h1>
              <Badge variant={invoice.computedStatus === 'PAID' ? 'success' : 'danger'}>{invoice.computedStatus}</Badge>
            </div>
            <p className="text-sm text-slate-500">Category: {invoice.type} • Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Tax Invoice</span>
        </button>
      </div>

      {/* Tax Invoice Document Box */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between border-b pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">TAX INVOICE</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">Invoice ID: {invoice.invoiceId}</p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-0.5">
            <div className="font-bold text-slate-800 text-sm">Lift Tech Maintenance Solutions</div>
            <div>GSTIN: 27AAAAA0000A1Z5</div>
            <div>Mumbai, Maharashtra</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-xs border-b pb-6">
          <div>
            <span className="font-bold text-slate-400 uppercase">Billed To Customer</span>
            <div className="font-bold text-slate-900 text-sm mt-1">{invoice.billingSnapshot?.customerName}</div>
            <div className="text-slate-600">{invoice.billingSnapshot?.customerCompany}</div>
            <div className="text-slate-500 mt-1">{invoice.billingSnapshot?.address}, {invoice.billingSnapshot?.city}, {invoice.billingSnapshot?.state}</div>
            <div className="font-mono text-slate-600 mt-0.5">GSTIN: {invoice.billingSnapshot?.gstin || 'N/A'}</div>
          </div>
          <div className="text-right space-y-1">
            <div><span className="font-bold text-slate-400 uppercase">Invoice Date:</span> <span className="font-bold text-slate-800">{new Date(invoice.createdAt).toLocaleDateString()}</span></div>
            <div><span className="font-bold text-slate-400 uppercase">Due Date:</span> <span className="font-bold text-slate-800">{new Date(invoice.dueDate).toLocaleDateString()}</span></div>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left text-xs text-slate-700 border-b pb-4">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
            <tr>
              <th className="p-3">Description</th>
              <th className="p-3 text-center">Qty</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="p-3 font-semibold text-slate-800">{item.description}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Totals */}
        <div className="flex justify-end pt-2">
          <div className="w-64 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-800">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {invoice.cgst > 0 && (
              <div className="flex justify-between">
                <span>CGST (9%):</span>
                <span>₹{invoice.cgst.toLocaleString('en-IN')}</span>
              </div>
            )}
            {invoice.sgst > 0 && (
              <div className="flex justify-between">
                <span>SGST (9%):</span>
                <span>₹{invoice.sgst.toLocaleString('en-IN')}</span>
              </div>
            )}
            {invoice.igst > 0 && (
              <div className="flex justify-between">
                <span>IGST (18%):</span>
                <span>₹{invoice.igst.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t">
              <span>Total Amount:</span>
              <span>₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-emerald-600">
              <span>Amount Paid:</span>
              <span>₹{(invoice.amountPaid || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-rose-600 pt-1 border-t">
              <span>Balance Due:</span>
              <span>₹{(invoice.balanceDue || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
