'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  Shield,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Users,
  Database,
  Lock,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              WorkFlow<span className="text-indigo-600">X</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Platform Features
            </a>
            <a href="#signature" className="hover:text-indigo-600 transition-colors">
              Risk & Dependency Engine
            </a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">
              Security & RBAC
            </a>
            <a href="#architecture" className="hover:text-indigo-600 transition-colors">
              Architecture
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Full-Stack Platform for Student & Engineering Teams</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Team task management powered by an intelligent{' '}
            <span className="text-indigo-600 underline decoration-indigo-200 decoration-wavy">
              Risk & Dependency Engine
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate project delays before they happen. WorkFlowX analyzes task prerequisites, cycle conflicts, and team workloads to transparently explain why tasks are blocked.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="shadow-md shadow-indigo-200">
                Launch Workspace Now
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Explore Demo Accounts
              </Button>
            </Link>
          </div>

          {/* Signature Feature Preview Card */}
          <div id="signature" className="mt-14 max-w-5xl mx-auto text-left">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Signature Feature: Rule-Based Task Risk Engine
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Deterministic graph traversal, circular loop detection, and multi-factor bottleneck scoring.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="danger" size="md">
                    High Risk Alert (Score: 85/100)
                  </Badge>
                  <Badge variant="warning" size="md">
                    BLOCKED
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Task Info */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Sample Blocked Task
                  </span>
                  <h4 className="text-sm font-bold text-slate-800">
                    Interactive Kanban Board & Dependency Graph UI
                  </h4>
                  <p className="text-xs text-slate-600">
                    Assigned to <span className="font-semibold text-slate-800">Elena Rostova</span>. Target deadline in 3 days.
                  </p>
                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 space-y-1">
                    <div>Estimated: <span className="font-semibold text-slate-700">20 hours</span></div>
                    <div>Prerequisites: <span className="font-semibold text-slate-700">2 tasks</span></div>
                  </div>
                </div>

                {/* Center: Explicit Evaluation Reasons */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Transparent Rule Evaluation
                  </span>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <span>
                        Prerequisite <strong className="text-slate-900">"Rule-Based Task Risk Engine"</strong> is incomplete and in progress.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span>
                        Critical path bottleneck: Delays will impact <strong className="text-slate-900">3 downstream deliverables</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                      <span>
                        Cycle prevention: System automatically prevents circular dependency loops (DFS validation).
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Right: Recommended Action */}
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                      Recommended Action
                    </span>
                    <p className="text-xs text-indigo-950 mt-2 font-medium leading-relaxed">
                      "Prioritize unblocking prerequisite task #104 immediately to mitigate cascading schedule overrun."
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-indigo-100 text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Deterministic formula — Zero fake AI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Real-World Engineering Teams
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Built from scratch with production standards: transactional PostgreSQL queries, role-based authorization, and real-time dependency calculation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Directed Dependency Engine
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect tasks with prerequisite-successor relationships. Detect circular dependencies before they are saved with graph cycle detection.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Multi-Factor Risk Scoring
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluate overdue deadlines, approaching cutoffs, assignee workload limits, and prerequisite completion using deterministic rules.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Server-Side RBAC & Session Auth
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                HttpOnly SameSite cookies, session rotation, and strict team authorization middleware. Never leak cross-team data by tampering with IDs.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Interactive Kanban Task Boards
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Organize deliverables across To Do, In Progress, Blocked, and Done with unblocking cascade triggers and deadline warnings.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Team Workload & Role Hierarchy
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Invite members with expiring cryptographic tokens. Balance assignments so individual developers are not overloaded with active tasks.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                PostgreSQL & Prisma Migrations
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Relational foreign key constraints, explicit composite indexes, and transactional rollbacks to preserve complete audit history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-2xl p-8 lg:p-12 shadow-xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
                <Lock className="w-3.5 h-3.5" />
                <span>Security First Architecture</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Zero Trust Authorization & Credential Isolation
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Built to resist real-world attack vectors: password hashes using bcrypt with 12 rounds, opaque session identifiers stored in database, CSRF & Origin checks, Helmet security headers, and Zod input validation on all routes.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800 text-xs">
              <div>
                <span className="text-indigo-400 font-bold block mb-1">Session Storage</span>
                <span className="text-slate-300">HttpOnly / SameSite Cookies</span>
              </div>
              <div>
                <span className="text-indigo-400 font-bold block mb-1">Hashing</span>
                <span className="text-slate-300">Bcrypt / Salted Hashes</span>
              </div>
              <div>
                <span className="text-indigo-400 font-bold block mb-1">Protection</span>
                <span className="text-slate-300">CSRF & Rate Limiting</span>
              </div>
              <div>
                <span className="text-indigo-400 font-bold block mb-1">RBAC Scope</span>
                <span className="text-slate-300">Strict Cross-Team Isolation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800">WorkFlowX Platform</span>
            <span>— Smart Team Task & Project Risk Architecture</span>
          </div>
          <div>
            Built with Next.js, Express, PostgreSQL, and Prisma.
          </div>
        </div>
      </footer>
    </div>
  );
}
