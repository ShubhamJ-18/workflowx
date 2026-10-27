'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Badge';
import { api } from '../../lib/api';

export function TeamModal({
  isOpen,
  onClose,
  team = null,
  onSaved,
}) {
  const isEditing = Boolean(team);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setDescription(team.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setError(null);
  }, [team, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
      };

      let res;
      if (isEditing) {
        res = await api.put(`/teams/${team.id}`, payload);
      } else {
        res = await api.post('/teams', payload);
      }

      if (onSaved) onSaved(res.data?.team);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save team.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Team Details' : 'Create New Team'}
      description="Teams represent isolated collaborative workspaces with dedicated members and projects."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <Input
          label="Team Name"
          required
          placeholder="e.g., Core Engineering & Platform"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Textarea
          label="Team Purpose & Description"
          placeholder="Brief description of the team's mission..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
