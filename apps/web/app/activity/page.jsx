'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Activity,
  Filter,
  CheckCircle2,
  FolderKanban,
  GitBranch,
  Users,
  Layers,
  Clock,
} from 'lucide-react';
import { Card, Badge, Skeleton, EmptyState, Alert } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';

export default function ActivityPage() {
  const { activeTeam } = useAuth();
  const [activities, setActivities] = useState([]);
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivity = useCallback(async () => {
    if (!activeTeam) return;
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      query.append('teamId', activeTeam.id);
      if (entityFilter) query.append('entityType', entityFilter);
      query.append('limit', '50');

      const res = await api.get(`/activity?${query.toString()}`);
      setActivities(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load activity history.');
    } finally {
      setLoading(false);
    }
  }, [activeTeam, entityFilter]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const getEntityIcon = (type) => {
    switch (type) {
      case 'TASK':
        return <CheckCircle2 className="w-4 h-4 text-indigo-600" />;
      case 'PROJECT':
        return <FolderKanban className="w-4 h-4 text-blue-600" />;
      case 'DEPENDENCY':
        return <GitBranch className="w-4 h-4 text-purple-600" />;
      case 'MEMBER':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'TEAM':
        return <Layers className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Activity History & Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Complete, immutable operational log of events for{' '}
              <span className="font-semibold text-slate-800">{activeTeam?.name}</span>.
            </p>
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="py-1.5 text-xs"
            >
              <option value="">All Entity Types</option>
              <option value="TASK">Tasks</option>
              <option value="PROJECT">Projects</option>
              <option value="DEPENDENCY">Dependencies</option>
              <option value="MEMBER">Team Members</option>
              <option value="TEAM">Workspace</option>
            </Select>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Audit Timeline */}
        <Card>
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : activities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity recorded"
              description="Actions performed by team members will be logged here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {activities.map((act) => (
                <div key={act.id} className="p-4 flex items-start gap-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="p-2 rounded-xl bg-slate-100 flex-shrink-0 mt-0.5">
                    {getEntityIcon(act.entityType)}
                  </div>

                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">
                          {act.actor?.name || 'User'}
                        </span>
                        <span className="text-slate-500">
                          {act.action.toLowerCase().replace('_', ' ')}
                        </span>
                        <Badge variant="neutral" size="sm">
                          {act.entityType}
                        </Badge>
                      </div>

                      <span className="text-[11px] text-slate-400 flex-shrink-0">
                        {new Date(act.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {act.metadata && Object.keys(act.metadata).length > 0 && (
                      <div className="p-2 bg-slate-50 rounded border border-slate-100 text-[11px] text-slate-600 font-mono mt-1">
                        {JSON.stringify(act.metadata)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
