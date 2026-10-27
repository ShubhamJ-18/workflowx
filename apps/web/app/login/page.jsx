'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Badge';
import { Layers, ArrowRight, UserCheck, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <Layers className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            WorkFlow<span className="text-indigo-600">X</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Or{' '}
          <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
            create a new team workspace
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              placeholder="you@team.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" size="md" className="w-full mt-2" loading={loading}>
              Sign In
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Demo Quick-Fill Accounts */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>One-Click Demo Accounts</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Click any role to load seeded credentials for demonstration:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('alex.lead@workflowx.dev')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
              >
                <span className="font-semibold block text-slate-800">Alex Chen</span>
                <span className="text-[10px] text-indigo-600 font-medium">Team Lead (OWNER)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sarah.eng@workflowx.dev')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
              >
                <span className="font-semibold block text-slate-800">Sarah Connor</span>
                <span className="text-[10px] text-indigo-600 font-medium">Senior Eng (ADMIN)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('marcus.dev@workflowx.dev')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
              >
                <span className="font-semibold block text-slate-800">Marcus Brody</span>
                <span className="text-[10px] text-indigo-600 font-medium">Developer (MEMBER)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('elena.design@workflowx.dev')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
              >
                <span className="font-semibold block text-slate-800">Elena Rostova</span>
                <span className="text-[10px] text-indigo-600 font-medium">UI/UX (MEMBER)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleQuickLogin('watson.research@workflowx.dev')}
              className="mt-2 w-full p-2 text-left rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors text-xs flex items-center justify-between"
            >
              <div>
                <span className="font-semibold block text-slate-800">Dr. Watson (Isolated Team)</span>
                <span className="text-[10px] text-slate-500">Test Cross-Team RBAC Boundary</span>
              </div>
              <Shield className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
