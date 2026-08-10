'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'AMC',
    customerId: '',
    discount: 0,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    issueNow: true,
  });

  const [items, setItems] = useState([
    { description: 'Annual Maintenance Contract - Comprehensive Package', quantity: 1, unitPrice: 50000 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (data.success && data.customers.length > 0) {
          setCustomers(data.customers);
          setFormData((prev) => ({ ...prev, customerId: data.customers[0]._id }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCustomers();
  }, []);

  const addItem = () => {
    setItems([...items, { description: 'Maintenance Spare Parts / Service Charge', quantity: 1, unitPrice: 2500 }]);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, val) => {
    const newItems = [...items];
    newItems[idx][field] = val;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: items.map((i) => ({
            ...i,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
          discount: Number(formData.discount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');

      router.push(`/invoices/${data.invoice._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/invoices" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Tax Invoice</h1>
          <p className="text-sm text-slate-500">Generate GST invoice with state-aware CGST/SGST or IGST logic.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {error && <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Invoice Number *</label>
              <input
                type="text"
                required
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Invoice Category</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              >
                <option value="AMC">AMC CONTRACT</option>
                <option value="SERVICE">SERVICE VISIT</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Account *</label>
            <select
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full text-sm p-2.5 border rounded-lg"
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.companyName || 'Individual'}) - State: {c.state}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div className="space-y-3 border-t pt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Line Items</h4>
              <button type="button" onClick={addItem} className="text-xs font-bold text-sky-600 hover:underline flex items-center space-x-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg text-xs">
                  <div className="col-span-6">
                    <input
                      type="text"
                      required
                      placeholder="Item Description"
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      required
                      placeholder="Unit Price (₹)"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Amount (₹)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Generating...' : 'Issue Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
