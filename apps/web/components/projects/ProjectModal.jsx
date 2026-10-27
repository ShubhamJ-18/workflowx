'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Badge';
import { api } from '../../lib/api';

export function ProjectModal({
  isOpen,
  onClose,
  project = null,
  teamId,
  onSaved,
}) {
  const isEditing = Boolean(project);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    startDate: '',
    dueDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'ACTIVE',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        dueDate: project.dueDate ? project.dueDate.split('T')[0] : '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'ACTIVE',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
      });
    }
    setError(null);
  }, [project, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      };

      let res;
      if (isEditing) {
        res = await api.put(`/projects/${project.id}`, payload);
      } else {
        res = await api.post('/projects', {
          ...payload,
          teamId,
        });
      }

      if (onSaved) onSaved(res.data?.project);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Project' : 'Create New Project'}
      description={
        isEditing
          ? 'Update project details, status, or milestones.'
          : 'Define a new project workspace for your team deliverables.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <Input
          label="Project Name"
          required
          placeholder="e.g., WorkFlowX SaaS MVP v1.0"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <Textarea
          label="Description"
          placeholder="Summary of project goals and objectives..."
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </Select>

          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />

          <Input
            label="Target Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
