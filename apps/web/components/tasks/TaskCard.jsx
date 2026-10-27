'use client';

import React from 'react';
import { Calendar, GitCommit, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { RiskBadge } from './RiskBadge';

export function TaskCard({ task, onClick, onStatusChange }) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'DONE';

  const priorityStyles = {
    LOW: { variant: 'neutral', label: 'Low' },
    MEDIUM: { variant: 'primary', label: 'Medium' },
    HIGH: { variant: 'warning', label: 'High' },
    URGENT: { variant: 'danger', label: 'Urgent' },
  };

  const priorityInfo = priorityStyles[task.priority] || priorityStyles.MEDIUM;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer relative"
    >
      {/* Top Header: Priority & Risk Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge variant={priorityInfo.variant} size="sm">
          {priorityInfo.label}
        </Badge>
        {task.risk && <RiskBadge risk={task.risk} />}
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2">
        {task.title}
      </h4>

      {/* Description Snippet if present */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Blocking indicator alert if task has incomplete prerequisites */}
      {task.risk?.isBlocked && task.status !== 'DONE' && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] mb-3">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
          <span className="truncate">Blocked by prerequisite task(s)</span>
        </div>
      )}

      {/* Bottom Metadata: Due Date, Dependencies, Assignee */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 font-medium ${
                isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'
              }`}
              title={isOverdue ? 'Task is Overdue!' : 'Due Date'}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          {task.estimatedHours > 0 && (
            <div className="hidden sm:flex items-center gap-1" title="Estimated Hours">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}

          {task.predecessors?.length > 0 && (
            <div
              className="flex items-center gap-0.5 text-slate-600"
              title={`${task.predecessors.length} prerequisite task(s)`}
            >
              <GitCommit className="w-3.5 h-3.5 text-indigo-500" />
              <span>{task.predecessors.length}</span>
            </div>
          )}

          {task.commentCount > 0 && (
            <div className="flex items-center gap-0.5 text-slate-400">
              <MessageSquare className="w-3 h-3" />
              <span>{task.commentCount}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee ? (
          <div
            className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-[11px] flex items-center justify-center flex-shrink-0"
            title={`Assigned to ${task.assignee.name}`}
          >
            {task.assignee.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
        )}
      </div>
    </div>
  );
}
