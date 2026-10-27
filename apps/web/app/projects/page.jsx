'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card, Badge, Skeleton, EmptyState, Alert } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ProjectModal } from '../../components/projects/ProjectModal';

export default function ProjectsPage() {
  const { activeTeam } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!activeTeam) return;
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      query.append('teamId', activeTeam.id);
      if (statusFilter) query.append('status', statusFilter);
      if (search) query.append('search', search);

      const res = await api.get(`/projects?${query.toString()}`);
      setProjects(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [activeTeam, statusFilter, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const canCreate = activeTeam?.role === 'OWNER' || activeTeam?.role === 'ADMIN' || activeTeam?.role === 'MEMBER';

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Projects & Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage deliverables, track milestone completion, and open Kanban boards for{' '}
              <span className="font-semibold text-slate-800">{activeTeam?.name}</span>.
            </p>
          </div>

          {canCreate && (
            <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>
              New Project
            </Button>
          )}
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2"
            >
              <option value="">All Statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects found"
            description="Create your first project to start organizing tasks, managing dependencies, and calculating risk."
            action={
              canCreate ? (
                <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>
                  Create First Project
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => {
              const statusBadges = {
                PLANNING: { variant: 'neutral', label: 'Planning' },
                ACTIVE: { variant: 'primary', label: 'Active' },
                ON_HOLD: { variant: 'warning', label: 'On Hold' },
                COMPLETED: { variant: 'success', label: 'Completed' },
                ARCHIVED: { variant: 'neutral', label: 'Archived' },
              };
              const statusBadge = statusBadges[project.status] || statusBadges.ACTIVE;

              return (
                <Card
                  key={project.id}
                  className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge variant={statusBadge.variant} size="sm">
                        {statusBadge.label}
                      </Badge>
                      {project.dueDate && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(project.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/projects/${project.id}`}
                      className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 block mb-1.5"
                    >
                      {project.name}
                    </Link>

                    {project.description ? (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                        {project.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mb-4">
                        No description provided.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {/* Completion Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-bold text-slate-800">
                          {project.completionPercentage}% ({project.completedTaskCount}/{project.taskCount})
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${project.completionPercentage}%` }}
                          className="h-full bg-indigo-600 rounded-full transition-all"
                        />
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={`/projects/${project.id}/board`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                      >
                        <span>Kanban Board</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        href={`/projects/${project.id}`}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        teamId={activeTeam?.id}
        onSaved={() => fetchProjects()}
      />
    </AppShell>
  );
}
