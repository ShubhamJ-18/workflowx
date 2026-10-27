'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
        const userTeams = res.data.user.memberships?.map((m) => ({
          ...m.team,
          role: m.role,
        })) || [];
        setTeams(userTeams);

        // Keep saved active team if still valid, or fallback to first
        const savedTeamId = typeof window !== 'undefined' ? localStorage.getItem('workflowx_active_team') : null;
        const matchingTeam = userTeams.find((t) => t.id === savedTeamId);
        const selected = matchingTeam || userTeams[0] || null;
        setActiveTeam(selected);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const selectActiveTeam = (team) => {
    setActiveTeam(team);
    if (typeof window !== 'undefined' && team?.id) {
      localStorage.setItem('workflowx_active_team', team.id);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    await fetchCurrentUser();
    router.push('/dashboard');
    return res;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    await fetchCurrentUser();
    router.push('/dashboard');
    return res;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout network errors
    } finally {
      setUser(null);
      setTeams([]);
      setActiveTeam(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('workflowx_active_team');
      }
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        teams,
        activeTeam,
        selectActiveTeam,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
