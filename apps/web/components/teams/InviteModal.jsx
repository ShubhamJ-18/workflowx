'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Badge';
import { api } from '../../lib/api';
import { Mail, Copy, Check } from 'lucide-react';

export function InviteModal({ isOpen, onClose, teamId, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invitedData, setInvitedData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInvitedData(null);

    try {
      const res = await api.post(`/teams/${teamId}/members`, {
        email: email.trim().toLowerCase(),
        role,
      });

      setInvitedData(res.data);
      setEmail('');
      if (onInvited) onInvited();
    } catch (err) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  };

  const inviteUrl =
    typeof window !== 'undefined' && invitedData?.token
      ? `${window.location.origin}/invitations/${invitedData.token}`
      : null;

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleClose = () => {
    setInvitedData(null);
    setError(null);
    setEmail('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Team Member"
      description="Send a single-use cryptographically secure invitation to join this workspace."
    >
      {invitedData ? (
        <div className="space-y-4">
          <Alert variant="success" title="Invitation Created!">
            An invitation for <span className="font-semibold">{invitedData.invitation.invitedEmail}</span> with role <span className="font-semibold">{invitedData.invitation.role}</span> has been generated.
          </Alert>

          {inviteUrl && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Direct Invitation Link (Development Mode):
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-600 select-all"
                />
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="colleague@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Select
            label="Team Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="MEMBER">Member (Create and manage tasks)</option>
            <option value="ADMIN">Admin (Manage projects and invite members)</option>
          </Select>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} icon={Mail}>
              Send Invitation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
