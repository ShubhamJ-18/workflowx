'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Badge';
import { GitCommit, Trash2, ArrowRight, ShieldAlert, Plus } from 'lucide-react';
import { api } from '../../lib/api';

export function DependencyModal({
  isOpen,
  onClose,
  task,
  availableTasks = [],
  onDependencyChanged,
}) {
  const [selectedPredecessorId, setSelectedPredecessorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!task) return null;

  // Filter tasks that can be chosen as predecessor (cannot be self, cannot already be predecessor)
  const existingPredecessorIds = new Set(
    task.predecessors?.map((p) => p.predecessorId || p.predecessor?.id) || []
  );

  const eligiblePredecessors = availableTasks.filter(
    (t) => t.id !== task.id && !existingPredecessorIds.has(t.id)
  );

  const handleAddDependency = async (e) => {
    e.preventDefault();
    if (!selectedPredecessorId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post(`/tasks/${task.id}/dependencies`, {
        predecessorTaskId: selectedPredecessorId,
      });

      setSelectedPredecessorId('');
      setSuccess('Dependency added successfully.');
      if (onDependencyChanged) onDependencyChanged();
    } catch (err) {
      setError(err.message || 'Failed to add dependency.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDependency = async (predecessorId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/tasks/${task.id}/dependencies/${predecessorId}`);
      setSuccess('Dependency removed.');
      if (onDependencyChanged) onDependencyChanged();
    } catch (err) {
      setError(err.message || 'Failed to remove dependency.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Dependency Graph & Workflow"
      description={`Manage predecessor prerequisites and downstream successors for "${task.title}".`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {error && (
          <Alert variant="danger">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          </Alert>
        )}

        {success && <Alert variant="success">{success}</Alert>}

        {/* Add Predecessor Form */}
        <form onSubmit={handleAddDependency} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Add Prerequisite Dependency
          </h4>
          <p className="text-xs text-slate-500">
            Select a task that must be marked DONE before this task can safely start.
          </p>

          <div className="flex gap-2">
            <Select
              value={selectedPredecessorId}
              onChange={(e) => setSelectedPredecessorId(e.target.value)}
              className="flex-1 text-xs"
            >
              <option value="">Select prerequisite task...</option>
              {eligiblePredecessors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status})
                </option>
              ))}
            </Select>
            <Button
              type="submit"
              size="sm"
              loading={loading}
              disabled={!selectedPredecessorId}
              icon={Plus}
            >
              Add
            </Button>
          </div>
        </form>

        {/* Existing Predecessors */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Prerequisite Tasks ({task.predecessors?.length || 0})
          </h4>
          <p className="text-xs text-slate-500 mb-2">
            This task waits on these deliverables:
          </p>

          {(!task.predecessors || task.predecessors.length === 0) ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
              No prerequisites configured. Task is unblocked by dependencies.
            </p>
          ) : (
            <div className="space-y-2">
              {task.predecessors.map((p) => {
                const pred = p.predecessor || p;
                const isDone = pred.status === 'DONE';

                return (
                  <div
                    key={p.id || pred.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isDone ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-medium text-slate-800 truncate">
                        {pred.title}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {pred.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDependency(pred.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                      title="Remove Dependency"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Downstream Successors */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Downstream Successors ({task.successors?.length || 0})
          </h4>
          <p className="text-xs text-slate-500 mb-2">
            These tasks wait for this deliverable to finish:
          </p>

          {(!task.successors || task.successors.length === 0) ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
              No downstream dependencies.
            </p>
          ) : (
            <div className="space-y-2">
              {task.successors.map((s) => {
                const succ = s.successor || s;
                return (
                  <div
                    key={s.id || succ.id}
                    className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-medium truncate">{succ.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-600 ml-auto">
                      {succ.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
