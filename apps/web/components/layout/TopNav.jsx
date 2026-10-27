'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Menu, Bell, Shield, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function TopNav({ setMobileOpen }) {
  const { activeTeam } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function checkNotifications() {
      try {
        const res = await api.get('/notifications?unreadOnly=true&limit=1');
        if (res && res.unreadCount !== undefined) {
          setUnreadCount(res.unreadCount);
        }
      } catch {
        // Silent catch for top nav
      }
    }
    checkNotifications();
    const timer = setInterval(checkNotifications, 45000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            {activeTeam?.name || 'WorkFlowX Workspace'}
          </span>
          {activeTeam?.role && (
            <Badge variant="primary" size="sm">
              <Shield className="w-3 h-3 mr-1 inline" />
              {activeTeam.role}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Risk System Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Risk Engine Active</span>
        </div>

        {/* Notifications Icon with Badge */}
        <Link
          href="/notifications"
          className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-indigo-600 rounded-full ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
