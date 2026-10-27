'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  ArrowRight,
  Calendar,
  Users,
  Activity,
  Plus,
} from 'lucide-react';
import { Card, Badge, Skeleton, Alert } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { RiskBadge } from '../../components/tasks/RiskBadge';
import { TaskModal } from '../../components/tasks/TaskModal';

export default function DashboardPage() {
  const { activeTeam } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    if (!activeTeam) return;
    setLoading(true);
    setError(null);

    try {
      const [metricsRes, projectsRes, teamRes] = await Promise.all([
        api.get(`/dashboard/metrics?teamId=${activeTeam.id}`),
        api.get(`/projects?teamId=${activeTeam.id}&limit=50`),
        api.get(`/teams/${activeTeam.id}`),
      ]);

      setMetrics(metricsRes.data?.metrics || null);
      setProjects(projectsRes.data || []);
      setTeamMembers(teamRes.data?.team?.members || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [activeTeam]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    {
      label: 'Active Projects',
      value: metrics?.activeProjectsCount ?? 0,
      icon: FolderKanban,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Total Tasks',
      value: metrics?.totalTasksCount ?? 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Completed Tasks',
      value: metrics?.completedTasksCount ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Overdue Tasks',
      value: metrics?.overdueTasksCount ?? 0,
      icon: Clock,
      color: metrics?.overdueTasksCount > 0 ? 'text-red-600' : 'text-slate-600',
      bg: metrics?.overdueTasksCount > 0 ? 'bg-red-50' : 'bg-slate-50',
    },
    {
      label: 'Blocked Tasks',
      value: metrics?.blockedTasksCount ?? 0,
      icon: AlertTriangle,
      color: metrics?.blockedTasksCount > 0 ? 'text-amber-600' : 'text-slate-600',
      bg: metrics?.blockedTasksCount > 0 ? 'bg-amber-50' : 'bg-slate-50',
    },
    {
      label: 'High-Risk Tasks',
      value: metrics?.highRiskTasksCount ?? 0,
      icon: AlertOctagon,
      color: metrics?.highRiskTasksCount > 0 ? 'text-red-600 font-bold' : 'text-slate-600',
      bg: metrics?.highRiskTasksCount > 0 ? 'bg-red-50' : 'bg-slate-50',
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Executive Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Real-time delivery health, dependency bottlenecks, and risk metrics for{' '}
              <span className="font-semibold text-slate-800">
                {activeTeam?.name || 'Workspace'}
              </span>
              .
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              icon={Plus}
              onClick={() => setTaskModalOpen(true)}
              disabled={projects.length === 0}
            >
              New Task
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* 6 Stat Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 truncate">
                    {stat.label}
                  </span>
                  <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  {loading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    <span className={`text-2xl font-extrabold ${stat.color}`}>
                      {stat.value}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Status Distribution Progress Bar */}
        {metrics && metrics.totalTasksCount > 0 && (
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Task Status Breakdown
              </h3>
              <span className="text-xs text-slate-500">
                {metrics.completedTasksCount} of {metrics.totalTasksCount} Completed (
                {Math.round((metrics.completedTasksCount / metrics.totalTasksCount) * 100)}%)
              </span>
            </div>

            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${(metrics.statusBreakdown.DONE / metrics.totalTasksCount) * 100}%`,
                }}
                className="bg-emerald-500 transition-all"
                title={`Done: ${metrics.statusBreakdown.DONE}`}
              />
              <div
                style={{
                  width: `${(metrics.statusBreakdown.IN_PROGRESS / metrics.totalTasksCount) * 100}%`,
                }}
                className="bg-indigo-500 transition-all"
                title={`In Progress: ${metrics.statusBreakdown.IN_PROGRESS}`}
              />
              <div
                style={{
                  width: `${(metrics.statusBreakdown.BLOCKED / metrics.totalTasksCount) * 100}%`,
                }}
                className="bg-amber-500 transition-all"
                title={`Blocked: ${metrics.statusBreakdown.BLOCKED}`}
              />
              <div
                style={{
                  width: `${(metrics.statusBreakdown.TODO / metrics.totalTasksCount) * 100}%`,
                }}
                className="bg-slate-300 transition-all"
                title={`To Do: ${metrics.statusBreakdown.TODO}`}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Done ({metrics.statusBreakdown.DONE})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-600">In Progress ({metrics.statusBreakdown.IN_PROGRESS})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600">Blocked ({metrics.statusBreakdown.BLOCKED})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-slate-600">To Do ({metrics.statusBreakdown.TODO})</span>
              </div>
            </div>
          </Card>
        )}

        {/* 2-Column Section: High-Risk Alerts & Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* High-Risk Tasks Table */}
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    High-Risk & Bottleneck Deliverables
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Rule-Evaluated</span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : (!metrics?.highRiskTasks || metrics.highRiskTasks.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <span>No high-risk task bottlenecks currently identified.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.highRiskTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-red-50/40 border border-red-100 rounded-lg text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                        >
                          {task.title}
                        </Link>
                        <RiskBadge risk={task.risk} />
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-1">
                        <span className="font-medium text-slate-700">Action: </span>
                        {task.risk?.recommendedAction}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Project: {task.project?.name}</span>
                        <span>Assignee: {task.assignee?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 mt-4 text-right">
              <Link
                href="/projects"
                className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <span>View all tasks in Kanban board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Upcoming Deadlines (Next 7 Days)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Target Milestones</span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (!metrics?.upcomingDeadlines || metrics.upcomingDeadlines.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Calendar className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <span>No deadlines approaching in the next 7 days.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {metrics.upcomingDeadlines.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors truncate block"
                        >
                          {task.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 truncate">
                          {task.project?.name} • {task.assignee?.name || 'Unassigned'}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="font-semibold text-slate-700 block">
                          {new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <Badge
                          variant={task.status === 'BLOCKED' ? 'warning' : 'primary'}
                          size="sm"
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 mt-4 text-right">
              <Link
                href="/projects"
                className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <span>View project schedules</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* 2-Column Section: Project Progress Summaries & Team Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects Progress */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Project Completion Progress
                </h3>
              </div>
              <Link href="/projects" className="text-xs font-semibold text-indigo-600 hover:underline">
                All Projects
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-28 w-full" />
            ) : (!metrics?.projectSummaries || metrics.projectSummaries.length === 0) ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active projects found in this workspace.
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.projectSummaries.map((p) => (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                      >
                        {p.name}
                      </Link>
                      <span className="font-bold text-slate-700">
                        {p.completionPercentage}% ({p.completedTasks}/{p.totalTasks})
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${p.completionPercentage}%` }}
                        className="h-full bg-indigo-600 rounded-full transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Team Workload Distribution */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Team Workload Distribution
                </h3>
              </div>
              <Link href="/teams" className="text-xs font-semibold text-indigo-600 hover:underline">
                Manage Team
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-28 w-full" />
            ) : (!metrics?.workloadSummaries || metrics.workloadSummaries.length === 0) ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active task assignments found.
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.workloadSummaries.slice(0, 5).map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                        {member.user?.name ? member.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 truncate block">
                          {member.user?.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">
                        <strong className="text-slate-900 font-bold">{member.activeTasks}</strong> active
                      </span>
                      {member.overdueTasks > 0 && (
                        <Badge variant="danger" size="sm">
                          {member.overdueTasks} overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity Log snippet */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Recent Workspace Activity
              </h3>
            </div>
            <Link href="/activity" className="text-xs font-semibold text-indigo-600 hover:underline">
              Full Audit History
            </Link>
          </div>

          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : (!metrics?.recentActivity || metrics.recentActivity.length === 0) ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">
              No recent activity recorded.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {metrics.recentActivity.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-slate-800">
                      {log.actor?.name || 'User'}
                    </span>
                    <span className="text-slate-500">
                      performed <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">{log.action}</span> on {log.entityType.toLowerCase()}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 flex-shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Task Creation Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        projects={projects}
        teamMembers={teamMembers}
        onSaved={() => fetchDashboardData()}
      />
    </AppShell>
  );
}
