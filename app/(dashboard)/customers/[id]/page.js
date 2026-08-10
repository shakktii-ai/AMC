'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Wrench,
  FileText,
  AlertTriangle,
  CalendarCheck,
  Receipt,
  CreditCard,
  Award,
  FolderDown,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Lock,
  UserCheck,
  UserPlus,
  X,
  CheckCircle,
} from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lifts');

  // Create Login Modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalLoginEmail, setModalLoginEmail] = useState('');
  const [modalPassword, setModalPassword] = useState('Test@12345');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
        if (result.customer) {
          setModalLoginEmail(result.customer.email || '');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadCustomer();
  }, [id]);

  const handleCreateLoginAccount = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError('');

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_LOGIN',
          loginEmail: modalLoginEmail,
          password: modalPassword,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create customer login account');

      setShowLoginModal(false);
      await loadCustomer();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading customer portal records..." />;
  if (!data || !data.customer) return <div className="p-8 text-center text-slate-500">Customer record not found.</div>;

  const { customer, userAccount, lifts, amcs, services, complaints, invoices, payments, certificates, documents } = data;

  const tabs = [
    { id: 'lifts', label: `Lifts (${lifts?.length || 0})`, icon: Wrench },
    { id: 'amc', label: `AMC (${amcs?.length || 0})`, icon: FileText },
    { id: 'services', label: `Services (${services?.length || 0})`, icon: CalendarCheck },
    { id: 'complaints', label: `Complaints (${complaints?.length || 0})`, icon: AlertTriangle },
    { id: 'invoices', label: `Invoices (${invoices?.length || 0})`, icon: Receipt },
    { id: 'payments', label: `Payments (${payments?.length || 0})`, icon: CreditCard },
    { id: 'certificates', label: `Certificates (${certificates?.length || 0})`, icon: Award },
    { id: 'documents', label: `Documents (${documents?.length || 0})`, icon: FolderDown },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/customers" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
              <Badge variant={customer.status === 'ACTIVE' ? 'success' : 'danger'}>{customer.status}</Badge>
            </div>
            <p className="text-sm text-slate-500">{customer.companyName || 'Individual Customer'} • ID: {customer.customerId}</p>
          </div>
        </div>

        {!userAccount && (
          <button
            type="button"
            onClick={() => {
              setModalLoginEmail(customer.email || '');
              setModalPassword('Test@12345');
              setModalError('');
              setShowLoginModal(true);
            }}
            className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Login Account</span>
          </button>
        )}
      </div>

      {/* Customer Info Card & Login Account Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Contact Email</div>
              <div className="text-sm font-semibold text-slate-800">{customer.email}</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Phone Contact</div>
              <div className="text-sm font-semibold text-slate-800">{customer.phone}</div>
            </div>
          </div>
          <div className="sm:col-span-2 flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Location Address</div>
              <div className="text-sm text-slate-800">{customer.address}, {customer.city}, {customer.state} - {customer.pincode}</div>
            </div>
          </div>
        </div>

        {/* LOGIN ACCOUNT INFORMATION CARD */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 border-b pb-2">
              <Lock className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Login Account Info</h3>
            </div>

            {userAccount ? (
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Login Email: </span>
                  <span className="font-bold text-slate-900">{userAccount.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Role: </span>
                  <span className="font-bold text-sky-600">{userAccount.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Status: </span>
                  <span className="font-bold text-emerald-600">{userAccount.status}</span>
                </div>
                <div className="pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold inline-flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Portal Access Enabled</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-1">
                <p className="text-xs text-slate-500">No portal login account has been provisioned for this customer yet.</p>
                <button
                  type="button"
                  onClick={() => {
                    setModalLoginEmail(customer.email || '');
                    setModalPassword('Test@12345');
                    setModalError('');
                    setShowLoginModal(true);
                  }}
                  className="w-full py-2 bg-sky-50 text-sky-700 border border-sky-200 font-bold text-xs rounded-lg hover:bg-sky-100 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Provision Login Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive ? 'border-sky-600 text-sky-600 bg-sky-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {activeTab === 'lifts' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Registered Lifts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lifts.map((lift) => (
                <div key={lift._id} className="p-4 border rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-600">{lift.liftId}</span>
                    <Badge variant="info">{lift.status}</Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 mt-2">{lift.buildingName}</h4>
                  <p className="text-xs text-slate-500">Asset Code: {lift.assetCode} • Serial: {lift.serialNumber}</p>
                  <p className="text-xs text-slate-500 mt-1">{lift.capacityKg} kg ({lift.capacityPersons} P) • {lift.floors} Floors</p>
                  <div className="mt-3">
                    <Link href={`/lifts/${lift._id}`} className="text-xs font-bold text-sky-600 hover:underline">
                      View Lift Details →
                    </Link>
                  </div>
                </div>
              ))}
              {lifts.length === 0 && <p className="text-sm text-slate-500">No lifts registered.</p>}
            </div>
          </div>
        )}

        {activeTab === 'amc' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">AMC Contracts</h3>
            <div className="divide-y">
              {amcs.map((a) => (
                <div key={a._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{a.contractNumber}</div>
                    <div className="text-xs text-slate-500">{new Date(a.startDate).toLocaleDateString()} to {new Date(a.endDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={a.status === 'ACTIVE' ? 'success' : 'warning'}>{a.status}</Badge>
                    <div className="text-sm font-bold text-slate-900 mt-1">₹{a.totalAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
              {amcs.length === 0 && <p className="text-sm text-slate-500">No AMC contracts found.</p>}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Service Visit History</h3>
            <div className="divide-y text-sm">
              {services.map((s) => (
                <div key={s._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{s.serviceId} ({s.serviceSource})</div>
                    <div className="text-xs text-slate-500">{new Date(s.scheduledStartTime).toLocaleString()}</div>
                  </div>
                  <Badge variant={s.status === 'COMPLETED' ? 'success' : 'info'}>{s.status}</Badge>
                </div>
              ))}
              {services.length === 0 && <p className="text-sm text-slate-500">No services found.</p>}
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Breakdown Complaints</h3>
            <div className="divide-y text-sm">
              {complaints.map((c) => (
                <div key={c._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{c.complaintId} - {c.category}</div>
                    <div className="text-xs text-slate-500">{c.description}</div>
                  </div>
                  <Badge variant={c.priority === 'CRITICAL' ? 'danger' : 'warning'}>{c.status}</Badge>
                </div>
              ))}
              {complaints.length === 0 && <p className="text-sm text-slate-500">No complaints recorded.</p>}
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Invoices & Billing</h3>
            <div className="divide-y text-sm">
              {invoices.map((inv) => (
                <div key={inv._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                    <div className="text-xs text-slate-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={inv.status === 'PAID' ? 'success' : 'danger'}>{inv.status}</Badge>
                    <div className="text-sm font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <p className="text-sm text-slate-500">No invoices recorded.</p>}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Payment Transactions</h3>
            <div className="divide-y text-sm">
              {payments.map((p) => (
                <div key={p._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{p.paymentId} ({p.paymentMethod})</div>
                    <div className="text-xs text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right font-bold text-emerald-600">₹{p.amountPaid.toLocaleString('en-IN')}</div>
                </div>
              ))}
              {payments.length === 0 && <p className="text-sm text-slate-500">No payments recorded.</p>}
            </div>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Certificates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert._id} className="p-4 border rounded-xl">
                  <Badge variant="purple">{cert.certificateType}</Badge>
                  <h4 className="font-bold text-slate-900 mt-2">{cert.title}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-1">Token: {cert.verificationToken}</p>
                  <Link
                    href={`/certificate/verify/${cert.verificationToken}`}
                    target="_blank"
                    className="inline-block mt-3 text-xs font-bold text-sky-600 hover:underline"
                  >
                    Public Verification Page →
                  </Link>
                </div>
              ))}
              {certificates.length === 0 && <p className="text-sm text-slate-500">No certificates generated.</p>}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Document Records</h3>
            <div className="divide-y text-sm">
              {documents.map((doc) => (
                <div key={doc._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{doc.name}</div>
                    <div className="text-xs text-slate-500">{doc.category}</div>
                  </div>
                  <span className="text-xs font-bold text-sky-600 hover:underline">Download</span>
                </div>
              ))}
              {documents.length === 0 && <p className="text-sm text-slate-500">No documents attached.</p>}
            </div>
          </div>
        )}
      </div>

      {/* CREATE LOGIN ACCOUNT MODAL FOR EXISTING CUSTOMERS */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-slate-900">
                <Lock className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold">Provision Customer Login Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{modalError}</div>}

            <form onSubmit={handleCreateLoginAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Login Email *</label>
                <input
                  type="email"
                  required
                  value={modalLoginEmail}
                  onChange={(e) => setModalLoginEmail(e.target.value)}
                  className="w-full text-sm p-2.5 border rounded-lg"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  className="w-full text-sm p-2.5 border rounded-lg"
                  placeholder="Min 6 characters"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
                >
                  {modalSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
