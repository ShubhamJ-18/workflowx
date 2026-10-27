'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Layers, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, Alert } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export default function AcceptInvitationPage() {
  const params = useParams();
  const token = params?.token;
  const router = useRouter();
  const { user, refreshUser, selectActiveTeam } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/teams/invitations/accept', { token });
      setAccepted(true);
      await refreshUser();
      if (res.data?.team) {
        selectActiveTeam(res.data.team);
      }
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to accept invitation. Link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
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
          Team Invitation
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          You have been invited to join a collaborative engineering workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-2xl sm:px-10 text-center space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}

          {accepted ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Welcome to the Team!
              </h3>
              <p className="text-xs text-slate-500">
                Invitation accepted. Redirecting you to your team workspace...
              </p>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  Signed in as <strong className="text-slate-800">{user.email}</strong>
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  Click below to confirm membership and join the workspace.
                </p>
              </div>

              <Button
                size="md"
                className="w-full"
                loading={loading}
                onClick={handleAccept}
              >
                Accept Invitation & Join Team
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                You must sign in or register an account with the invited email address to join this team.
              </p>
              <div className="flex gap-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
