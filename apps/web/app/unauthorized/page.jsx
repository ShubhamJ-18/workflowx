'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-md mb-6">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
        403 Forbidden
      </span>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
        Access Denied
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        You do not have the required role or team authorization to perform this operation or view this resource.
      </p>

      <div className="mt-6 flex gap-3">
        <Link href="/dashboard">
          <Button icon={Home}>Return to Dashboard</Button>
        </Link>
        <Link href="/teams">
          <Button variant="outline">Switch Team Workspace</Button>
        </Link>
      </div>
    </div>
  );
}
