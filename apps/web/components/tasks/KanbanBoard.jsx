'use client';

import React from 'react';
import { TaskCard } from './TaskCard';
import { Plus, CheckCircle, Clock, AlertTriangle, ListTodo } from 'lucide-react';
import { Button } from '../ui/Button';

export function KanbanBoard({
  tasks = [],
  onTaskClick,
  onAddTask,
  onStatusChange,
}) {
  const columns = [
    {
      id: 'TODO',
      title: 'To Do',
      icon: ListTodo,
      color: 'border-t-slate-400',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'IN_PROGRESS',
      title: 'In Progress',
      icon: Clock,
      color: 'border-t-indigo-500',
      badgeColor: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'BLOCKED',
      title: 'Blocked',
      icon: AlertTriangle,
      color: 'border-t-amber-500',
      badgeColor: 'bg-amber-50 text-amber-800',
    },
    {
      id: 'DONE',
      title: 'Done',
      icon: CheckCircle,
      color: 'border-t-emerald-500',
      badgeColor: 'bg-emerald-50 text-emerald-700',
    },
  ];

  const tasksByStatus = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    BLOCKED: tasks.filter((t) => t.status === 'BLOCKED'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
      {columns.map((col) => {
        const columnTasks = tasksByStatus[col.id] || [];
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            className={`flex flex-col bg-slate-100/70 border border-slate-200/80 rounded-xl p-3.5 border-t-4 ${col.color}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-800">{col.title}</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${col.badgeColor}`}
                >
                  {columnTasks.length}
                </span>
              </div>
              {onAddTask && (
                <button
                  type="button"
                  onClick={() => onAddTask(col.id)}
                  title={`Add task to ${col.title}`}
                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/70 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Task Cards Column */}
            <div className="space-y-3 min-h-[160px]">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                  <span>No tasks</span>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
