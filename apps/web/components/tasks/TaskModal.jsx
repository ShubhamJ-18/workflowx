'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Badge';
import { api } from '../../lib/api';

export function TaskModal({
  isOpen,
  onClose,
  task = null,
  projectId = null,
  teamMembers = [],
  projects = [],
  defaultStatus = 'TODO',
  onSaved,
}) {
  const isEditing = Boolean(task);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId || '',
    status: defaultStatus,
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
    estimatedHours: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        projectId: task.projectId || projectId || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        assigneeId: task.assigneeId || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedHours: task.estimatedHours || 0,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        projectId: projectId || (projects[0]?.id || ''),
        status: defaultStatus,
        priority: 'MEDIUM',
        assigneeId: '',
        dueDate: '',
        estimatedHours: 0,
      });
    }
    setError(null);
  }, [task, projectId, projects, defaultStatus, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        projectId: formData.projectId,
        status: formData.status,
        priority: formData.priority,
        assigneeId: formData.assigneeId || null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        estimatedHours: parseFloat(formData.estimatedHours) || 0,
      };

      let result;
      if (isEditing) {
        result = await api.put(`/tasks/${task.id}`, payload);
      } else {
        result = await api.post('/tasks', payload);
      }

      if (onSaved) onSaved(result.data?.task);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      description={
        isEditing
          ? 'Update task specifications, priority, or schedule.'
          : 'Define a new actionable deliverable for the team.'
      }
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        <Input
          label="Task Title"
          required
          placeholder="e.g., Implement Argon2 password hashing"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <Textarea
          label="Description & Acceptance Criteria"
          placeholder="Detail the technical requirements and definition of done..."
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!projectId && (
            <Select
              label="Project"
              required
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}

          <Select
            label="Priority Level"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent (Immediate attention)</option>
          </Select>

          <Select
            label="Initial Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
          </Select>

          <Select
            label="Assignee"
            value={formData.assigneeId}
            onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {teamMembers.map((m) => (
              <option key={m.userId || m.id} value={m.userId || m.user?.id}>
                {m.user?.name || m.name} ({m.role || 'Member'})
              </option>
            ))}
          </Select>

          <Input
            label="Target Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />

          <Input
            label="Estimated Effort (Hours)"
            type="number"
            min="0"
            step="0.5"
            value={formData.estimatedHours}
            onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
