'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '../../../../components/layout/AppShell';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../lib/api';
import { KanbanBoard } from '../../../../components/tasks/KanbanBoard';
import { TaskModal } from '../../../../components/tasks/TaskModal';
import { DependencyModal } from '../../../../components/tasks/DependencyModal';
import {
  ArrowLeft,
  Plus,
  Filter,
  Search,
  Share2,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge, Alert, Skeleton } from '../../../../components/ui/Badge';

export default function ProjectBoardPage() {
  const params = useParams();
  const projectId = params?.id;
  const { activeTeam } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [defaultColumnStatus, setDefaultColumnStatus] = useState('TODO');
  const [dependencyModalOpen, setDependencyModalOpen] = useState(false);
  const [dependencyTask, setDependencyTask] = useState(null);

  const fetchProjectAndTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks?projectId=${projectId}&limit=100`),
      ]);

      setProject(projRes.data?.project || null);
      setTasks(tasksRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load project board.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectAndTasks();
  }, [fetchProjectAndTasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      await fetchProjectAndTasks();
    } catch (err) {
      setError(err.message || 'Failed to update task status.');
    }
  };

  const handleOpenAddTask = (columnStatus = 'TODO') => {
    setSelectedTask(null);
    setDefaultColumnStatus(columnStatus);
    setTaskModalOpen(true);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  // Filter tasks locally by search, assignee, and priority
  const filteredTasks = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (assigneeFilter && t.assigneeId !== assigneeFilter) {
      return false;
    }
    if (priorityFilter && t.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  const teamMembers = project?.team?.members || [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <Link href="/projects" className="hover:text-indigo-600 inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                <span>Projects</span>
              </Link>
              <span>/</span>
              <span className="font-medium text-slate-700">{project?.name || 'Project'}</span>
              <span>/</span>
              <span className="font-semibold text-indigo-600">Kanban Board</span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {project ? project.name : 'Loading Board...'}
              </h1>
              {project && (
                <Badge variant="primary" size="sm">
                  {project.status}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/projects/${projectId}`}>
              <Button variant="outline" size="sm">
                Project Overview
              </Button>
            </Link>
            <Button
              size="sm"
              icon={Plus}
              onClick={() => handleOpenAddTask('TODO')}
            >
              Add Task
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Board Search and Filter Strip */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter tasks by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Assignees</option>
              {teamMembers.map((m) => (
                <option key={m.userId || m.id} value={m.userId || m.user?.id}>
                  {m.user?.name || m.name}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="text-slate-500 font-medium self-end md:self-center">
            Showing <strong className="text-slate-800">{filteredTasks.length}</strong> of{' '}
            <strong className="text-slate-800">{tasks.length}</strong> total tasks
          </div>
        </div>

        {/* Kanban Board Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onAddTask={handleOpenAddTask}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {/* Task Edit / Create Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTask}
        projectId={projectId}
        teamMembers={teamMembers}
        defaultStatus={defaultColumnStatus}
        onSaved={() => fetchProjectAndTasks()}
      />

      {/* Dependency Modal */}
      {dependencyTask && (
        <DependencyModal
          isOpen={dependencyModalOpen}
          onClose={() => {
            setDependencyModalOpen(false);
            setDependencyTask(null);
          }}
          task={dependencyTask}
          availableTasks={tasks}
          onDependencyChanged={() => fetchProjectAndTasks()}
        />
      )}
    </AppShell>
  );
}
