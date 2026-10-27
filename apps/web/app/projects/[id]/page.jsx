'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import {
  FolderKanban,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  LayoutGrid,
  Trash2,
  Edit2,
  User,
  Layers,
} from 'lucide-react';
import { Card, Badge, Skeleton, Alert, EmptyState } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { RiskBadge } from '../../../components/tasks/RiskBadge';
import { TaskModal } from '../../../components/tasks/TaskModal';
import { ProjectModal } from '../../../components/projects/ProjectModal';

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const { activeTeam } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks?projectId=${projectId}&limit=50`),
      ]);

      setProject(projRes.data?.project || null);
      setTasks(tasksRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}" and all its tasks? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      router.push('/projects');
    } catch (err) {
      setError(err.message || 'Failed to delete project.');
    }
  };

  const isManager = activeTeam?.role === 'OWNER' || activeTeam?.role === 'ADMIN';

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/projects" className="hover:text-indigo-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Projects</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{project?.name || 'Overview'}</span>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Project Header Card */}
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {project?.name}
                  </h1>
                  <Badge variant="primary" size="sm">
                    {project?.status}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl">
                  {project?.description || 'No project description provided.'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/projects/${projectId}/board`}>
                  <Button icon={LayoutGrid} size="sm">
                    Open Kanban Board
                  </Button>
                </Link>

                {isManager && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit2}
                      onClick={() => setProjectModalOpen(true)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:border-red-200"
                      icon={Trash2}
                      onClick={handleDeleteProject}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Overall Progress</span>
                <span className="text-base font-bold text-slate-800">
                  {project?.stats?.completionPercentage || 0}% Completed
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Tasks In Progress</span>
                <span className="text-base font-bold text-indigo-600">
                  {project?.stats?.inProgress || 0} tasks
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Blocked Tasks</span>
                <span className="text-base font-bold text-amber-600">
                  {project?.stats?.blocked || 0} tasks
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Target Due Date</span>
                <span className="text-base font-bold text-slate-800">
                  {project?.dueDate
                    ? new Date(project.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Unscheduled'}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Tasks Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Project Deliverables & Tasks
            </h2>
            <p className="text-xs text-slate-500">
              Complete task breakdown with dependency and risk evaluations.
            </p>
          </div>

          <Button
            size="sm"
            icon={Plus}
            onClick={() => setTaskModalOpen(true)}
          >
            Add Task
          </Button>
        </div>

        {/* Task List Table */}
        <Card>
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No tasks in this project"
              description="Get started by adding tasks and establishing dependency sequences."
              action={
                <Button size="sm" icon={Plus} onClick={() => setTaskModalOpen(true)}>
                  Add First Task
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Deliverable Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Target Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="hover:text-indigo-600 transition-colors block"
                        >
                          {task.title}
                        </Link>
                        {task.predecessors?.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            Waits on {task.predecessors.length} prerequisite(s)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            task.status === 'DONE'
                              ? 'success'
                              : task.status === 'BLOCKED'
                              ? 'warning'
                              : 'primary'
                          }
                          size="sm"
                        >
                          {task.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <RiskBadge risk={task.risk} />
                      </td>

                      <td className="py-3.5 px-4">
                        {task.assignee ? (
                          <span className="font-medium text-slate-800">
                            {task.assignee.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        projectId={projectId}
        teamMembers={project?.team?.members || []}
        onSaved={() => fetchProjectDetails()}
      />

      {/* Project Edit Modal */}
      {project && (
        <ProjectModal
          isOpen={projectModalOpen}
          onClose={() => setProjectModalOpen(false)}
          project={project}
          teamId={project.teamId}
          onSaved={() => fetchProjectDetails()}
        />
      )}
    </AppShell>
  );
}
