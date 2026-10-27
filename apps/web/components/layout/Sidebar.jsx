'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Bell,
  Activity,
  Settings,
  LogOut,
  Layers,
  ChevronDown,
  Plus,
} from 'lucide-react';

export function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const pathname = usePathname();
  const { user, teams, activeTeam, selectActiveTeam, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Teams & Members', href: '/teams', icon: Users },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Activity History', href: '/activity', icon: Activity },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 tracking-tight">WorkFlow</span>
            <span className="text-base font-bold text-indigo-600">X</span>
            <span className="ml-1.5 text-[10px] uppercase font-semibold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">
              v1.0
            </span>
          </div>
        </div>

        {/* Team Selector */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
            Workspace Team
          </div>
          <div className="relative">
            <select
              value={activeTeam?.id || ''}
              onChange={(e) => {
                const team = teams.find((t) => t.id === e.target.value);
                if (team) selectActiveTeam(team);
              }}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
            >
              {teams.length === 0 ? (
                <option value="">No teams available</option>
              ) : (
                teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.role})
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Role in Team:</span>
            <span className="font-semibold text-indigo-600">
              {activeTeam?.role || 'MEMBER'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
