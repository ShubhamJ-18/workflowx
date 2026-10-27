'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Users,
  Plus,
  Shield,
  UserPlus,
  Trash2,
  CheckCircle2,
  Layers,
  Crown,
  Key,
} from 'lucide-react';
import { Card, Badge, Skeleton, Alert, EmptyState } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TeamModal } from '../../components/teams/TeamModal';
import { InviteModal } from '../../components/teams/InviteModal';

export default function TeamsPage() {
  const { user, activeTeam, selectActiveTeam, refreshUser } = useAuth();
  const [teamDetails, setTeamDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const fetchTeamDetails = useCallback(async () => {
    if (!activeTeam) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/teams/${activeTeam.id}`);
      setTeamDetails(res.data?.team || null);
    } catch (err) {
      setError(err.message || 'Failed to load team roster.');
    } finally {
      setLoading(false);
    }
  }, [activeTeam]);

  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  const handleRoleChange = async (targetUserId, newRole) => {
    setError(null);
    setSuccess(null);
    try {
      await api.put(`/teams/${activeTeam.id}/members/${targetUserId}`, { role: newRole });
      setSuccess('Member role updated.');
      await fetchTeamDetails();
    } catch (err) {
      setError(err.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (targetUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/teams/${activeTeam.id}/members/${targetUserId}`);
      setSuccess(`${memberName} removed from team.`);
      await fetchTeamDetails();
    } catch (err) {
      setError(err.message || 'Failed to remove member.');
    }
  };

  const isOwner = activeTeam?.role === 'OWNER';
  const isAdminOrOwner = activeTeam?.role === 'OWNER' || activeTeam?.role === 'ADMIN';

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Team Roster & Roles
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage member permissions, invite contributors, and configure role-based access for{' '}
              <span className="font-semibold text-slate-800">{activeTeam?.name}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => setTeamModalOpen(true)}
            >
              New Workspace Team
            </Button>

            {isAdminOrOwner && (
              <Button
                size="sm"
                icon={UserPlus}
                onClick={() => setInviteModalOpen(true)}
              >
                Invite Member
              </Button>
            )}
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Team Overview Card */}
        {loading ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {teamDetails?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {teamDetails?.description || 'Collaborative team workspace'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Members</span>
                <span className="font-bold text-slate-800 text-sm">
                  {teamDetails?.members?.length || 0}
                </span>
              </div>

              <div className="text-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Projects</span>
                <span className="font-bold text-slate-800 text-sm">
                  {teamDetails?.projects?.length || 0}
                </span>
              </div>

              <div className="text-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                <span className="block text-[10px] uppercase font-bold">Your Role</span>
                <span className="font-bold text-sm">
                  {activeTeam?.role || 'MEMBER'}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Members Roster Table */}
        <Card>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Active Team Members ({teamDetails?.members?.length || 0})
            </h3>
            <span className="text-xs text-slate-400">
              {isOwner ? 'You have OWNER privileges to manage roles' : 'Role permissions enforced by server'}
            </span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (!teamDetails?.members || teamDetails.members.length === 0) ? (
            <EmptyState
              icon={Users}
              title="No members"
              description="Invite team members to collaborate."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Joined Date</th>
                    {isAdminOrOwner && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamDetails.members.map((member) => {
                    const isSelf = member.userId === user?.id;
                    const isMemberOwner = member.role === 'OWNER';

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {member.user?.name ? member.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span>{member.user?.name}</span>
                              {isSelf && (
                                <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {member.user?.email}
                        </td>

                        <td className="py-3.5 px-4">
                          {isOwner && !isSelf ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                              className="text-xs py-1 px-2 border border-slate-300 rounded font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="MEMBER">MEMBER</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="OWNER">OWNER</option>
                            </select>
                          ) : (
                            <Badge
                              variant={
                                member.role === 'OWNER'
                                  ? 'purple'
                                  : member.role === 'ADMIN'
                                  ? 'primary'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {member.role === 'OWNER' && <Crown className="w-3 h-3 mr-1 inline" />}
                              {member.role}
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(member.joinedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {isAdminOrOwner && (
                          <td className="py-3.5 px-4 text-right">
                            {!isSelf && (!isMemberOwner || isOwner) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member.userId, member.user?.name)}
                                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                title="Remove from team"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Team Create Modal */}
      <TeamModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        onSaved={async (newTeam) => {
          await refreshUser();
          selectActiveTeam(newTeam);
        }}
      />

      {/* Invite Member Modal */}
      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        teamId={activeTeam?.id}
        onInvited={() => fetchTeamDetails()}
      />
    </AppShell>
  );
}
