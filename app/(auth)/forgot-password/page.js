'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl sm:rounded-2xl border border-slate-100 sm:px-10">
          <Link href="/login" className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>

          <h3 className="text-xl font-bold text-slate-900">Forgot Password</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">Enter your account email to receive a password reset instructions.</p>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center space-y-3">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-emerald-800">Reset instructions sent!</p>
              <p className="text-xs text-emerald-600">If an account exists for {email}, you will receive an email shortly.</p>
              <Link href="/reset-password" className="inline-block text-xs font-bold text-sky-600 hover:underline">
                Proceed to Reset Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="user@test.local"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-sm transition-colors shadow"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
