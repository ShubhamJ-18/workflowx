'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { api } from '../../lib/api';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, Badge, Skeleton, EmptyState, Alert } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export function getNotificationIcon(type) {
  switch (type) {
    case 'TASK_ASSIGNED':
      return <UserCheck className="w-4 h-4 text-indigo-600" />;
    case 'TASK_BLOCKED':
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    case 'TASK_UNBLOCKED':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'DEADLINE_APPROACHING':
      return <Clock className="w-4 h-4 text-red-600" />;
    case 'COMMENT_ADDED':
      return <MessageSquare className="w-4 h-4 text-blue-600" />;
    default:
      return <Bell className="w-4 h-4 text-slate-500" />;
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/notifications?unreadOnly=${unreadOnly}&limit=50`);
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // Ignore single read error
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err.message || 'Failed to mark all as read.');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Notification Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Updates on task assignments, blocked prerequisites, and impending deadlines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={CheckCheck}
                onClick={handleMarkAllRead}
              >
                Mark All as Read
              </Button>
            )}
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
          <button
            onClick={() => setUnreadOnly(false)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              !unreadOnly
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setUnreadOnly(true)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              unreadOnly
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Unread Only</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        <Card>
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
              description="You'll be alerted when tasks are assigned to you or dependencies are updated."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => {
                const isUnread = !n.readAt;

                return (
                  <div
                    key={n.id}
                    className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                      isUnread ? 'bg-indigo-50/20' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-100 flex-shrink-0 mt-0.5">
                        {getNotificationIcon(n.type)}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {n.title}
                          </h4>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {n.message}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                          <span>
                            {new Date(n.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {n.entityType === 'TASK' && n.entityId && (
                            <Link
                              href={`/tasks/${n.entityId}`}
                              className="font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                            >
                              <span>View Task</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-xs text-slate-400 hover:text-slate-700 flex-shrink-0 p-1"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
