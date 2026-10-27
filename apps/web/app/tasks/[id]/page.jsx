'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  GitCommit,
  GitBranch,
  MessageSquare,
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Edit3,
  Send,
} from 'lucide-react';
import { Card, Badge, Skeleton, Alert } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Textarea } from '../../../components/ui/Input';
import { RiskBadge } from '../../../components/tasks/RiskBadge';
import { TaskModal } from '../../../components/tasks/TaskModal';
import { DependencyModal } from '../../../components/tasks/DependencyModal';

export default function TaskDetailsPage() {
  const params = useParams();
  const taskId = params?.id;
  const router = useRouter();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [commentContent, setCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [dependencyModalOpen, setDependencyModalOpen] = useState(false);

  const fetchTaskDetails = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/tasks/${taskId}`);
      const taskData = res.data?.task;
      setTask(taskData);

      // Fetch all tasks in project to populate eligible prerequisites in DependencyModal
      if (taskData?.projectId) {
        const pTasksRes = await api.get(`/tasks?projectId=${taskData.projectId}&limit=100`);
        setProjectTasks(pTasksRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      await fetchTaskDetails();
    } catch (err) {
      setError(err.message || 'Failed to update task status.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setCommentLoading(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, {
        content: commentContent.trim(),
      });
      setCommentContent('');
      await fetchTaskDetails();
    } catch (err) {
      setError(err.message || 'Failed to post comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      router.push(`/projects/${task.projectId}/board`);
    } catch (err) {
      setError(err.message || 'Failed to delete task.');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href={task ? `/projects/${task.projectId}/board` : '/projects'}
            className="hover:text-indigo-600 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Board</span>
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700 truncate">{task?.project?.name}</span>
          <span>/</span>
          <span className="font-semibold text-slate-800 truncate">{task?.title}</span>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Task Overview Card */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary" size="sm">
                      {task.priority} Priority
                    </Badge>
                    <Badge
                      variant={
                        task.status === 'DONE'
                          ? 'success'
                          : task.status === 'BLOCKED'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {task.status}
                    </Badge>
                    {task.risk && <RiskBadge risk={task.risk} />}
                  </div>

                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {task.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit3}
                    onClick={() => setTaskModalOpen(true)}
                  >
                    Edit Task
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Trash2}
                    className="text-red-600 hover:bg-red-50 hover:border-red-200"
                    onClick={handleDeleteTask}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="py-4 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Description & Specifications
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {task.description || 'No detailed specifications provided.'}
                </p>
              </div>

              {/* Task Meta Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Assignee</span>
                  {task.assignee ? (
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">
                        {task.assignee.name.charAt(0)}
                      </div>
                      <span>{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Target Deadline</span>
                  <span className="font-semibold text-slate-800">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Unscheduled'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Estimated Hours</span>
                  <span className="font-semibold text-slate-800">
                    {task.estimatedHours > 0 ? `${task.estimatedHours} hours` : 'Not specified'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Created By</span>
                  <span className="font-semibold text-slate-800">
                    {task.creator?.name || 'Team Member'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Signature Feature: Risk Engine Analysis Box */}
            <Card className="p-6 border-indigo-200 bg-gradient-to-br from-white to-slate-50">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Task Risk & Dependency Analysis Engine
                  </h3>
                </div>
                {task.risk && <RiskBadge risk={task.risk} />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Explicit Factor Breakdown
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {task.risk?.reasons && task.risk.reasons.length > 0 ? (
                      task.risk.reasons.map((r, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-400 italic">
                        All schedule parameters are healthy.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                      Recommended Next Action
                    </span>
                    <p className="text-indigo-900 font-medium leading-relaxed">
                      {task.risk?.recommendedAction || 'On track. Proceed with scheduled execution.'}
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Calculated Score:</span>
                      <strong className="text-indigo-600 font-bold">{task.risk?.riskScore || 0}/100</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Affected Downstream:</span>
                      <strong className="text-slate-800">{task.downstreamTaskIds?.length || 0} tasks</strong>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Task Dependencies Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Prerequisites & Downstream Impact
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon={GitCommit}
                  onClick={() => setDependencyModalOpen(true)}
                >
                  Manage Dependencies
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Predecessors */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">
                    Prerequisite Tasks ({task.predecessors?.length || 0})
                  </h4>
                  {(!task.predecessors || task.predecessors.length === 0) ? (
                    <p className="text-slate-400 italic p-3 bg-slate-50 rounded-lg">
                      No prerequisites. Task is immediately ready to execute.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {task.predecessors.map((p) => {
                        const pred = p.predecessor;
                        const isDone = pred.status === 'DONE';
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <Link
                              href={`/tasks/${pred.id}`}
                              className="font-medium text-slate-800 hover:text-indigo-600 truncate mr-2"
                            >
                              {pred.title}
                            </Link>
                            <Badge
                              variant={isDone ? 'success' : 'warning'}
                              size="sm"
                            >
                              {pred.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Successors */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">
                    Successor Tasks ({task.successors?.length || 0})
                  </h4>
                  {(!task.successors || task.successors.length === 0) ? (
                    <p className="text-slate-400 italic p-3 bg-slate-50 rounded-lg">
                      No subsequent tasks wait on this deliverable.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {task.successors.map((s) => {
                        const succ = s.successor;
                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <Link
                              href={`/tasks/${succ.id}`}
                              className="font-medium text-slate-800 hover:text-indigo-600 truncate mr-2"
                            >
                              {succ.title}
                            </Link>
                            <Badge variant="neutral" size="sm">
                              {succ.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Comments & Discussion */}
            <Card className="p-6">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Discussion & Team Notes ({task.comments?.length || 0})
                </h3>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6 space-y-3">
                <Textarea
                  placeholder="Share status updates, technical hurdles, or unblocking notes..."
                  rows={2}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    loading={commentLoading}
                    disabled={!commentContent.trim()}
                    icon={Send}
                  >
                    Post Comment
                  </Button>
                </div>
              </form>

              {/* Comment Thread */}
              {(!task.comments || task.comments.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No comments yet. Start the conversation with your team.
                </p>
              ) : (
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 text-xs">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                        {comment.author?.name ? comment.author.name.charAt(0) : 'U'}
                      </div>
                      <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-800">
                            {comment.author?.name || 'User'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      {/* Task Edit Modal */}
      {task && (
        <TaskModal
          isOpen={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          task={task}
          projectId={task.projectId}
          teamMembers={task.project?.team?.members || []}
          onSaved={() => fetchTaskDetails()}
        />
      )}

      {/* Dependency Modal */}
      {task && (
        <DependencyModal
          isOpen={dependencyModalOpen}
          onClose={() => setDependencyModalOpen(false)}
          task={task}
          availableTasks={projectTasks}
          onDependencyChanged={() => fetchTaskDetails()}
        />
      )}
    </AppShell>
  );
}
