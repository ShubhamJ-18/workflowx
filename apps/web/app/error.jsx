'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error('WorkFlowX App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-6">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <span className="text-sm font-bold text-red-600 uppercase tracking-widest">
        Application Error
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        An unexpected error occurred while rendering this interface. Details have been logged for debugging.
      </p>

      {error?.message && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-mono text-red-700 max-w-lg overflow-x-auto text-left">
          {error.message}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button onClick={() => reset()} icon={RotateCcw}>
          Try Again
        </Button>
        <Link href="/dashboard">
          <Button variant="outline" icon={Home}>
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
