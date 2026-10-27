'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 mb-6">
        <Layers className="w-7 h-7" />
      </div>

      <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">
        404 Error
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
        Page Not Found
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The requested resource, task, or project does not exist or has been relocated.
      </p>

      <div className="mt-6 flex gap-3">
        <Link href="/dashboard">
          <Button icon={Home}>Return to Dashboard</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Landing Page</Button>
        </Link>
      </div>
    </div>
  );
}
