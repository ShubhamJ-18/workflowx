'use client';

import React, { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  User,
  Lock,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card, Alert } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await api.put('/auth/profile', { name: name.trim() });
      await refreshUser();
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }

    setPasswordLoading(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password changed successfully.');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Account & Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your personal profile and configure account security credentials.
          </p>
        </div>

        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Profile Information
            </h2>
          </div>

          {profileError && <Alert variant="danger" className="mb-4">{profileError}</Alert>}
          {profileSuccess && <Alert variant="success" className="mb-4">{profileSuccess}</Alert>}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Email Address"
              disabled
              value={user?.email || ''}
              helperText="Email addresses are permanently tied to your account identity."
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" loading={profileLoading} icon={Save}>
                Save Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* Security / Password Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Change Password & Session Revocation
            </h2>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Changing your password rotates your session and automatically revokes all other active sessions across devices.
          </p>

          {passwordError && <Alert variant="danger" className="mb-4">{passwordError}</Alert>}
          {passwordSuccess && <Alert variant="success" className="mb-4">{passwordSuccess}</Alert>}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <Input
              label="New Password"
              type="password"
              required
              helperText="Min 8 characters, 1 uppercase, 1 lowercase, 1 number."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              label="Confirm New Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" loading={passwordLoading}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
