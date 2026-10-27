'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function RiskBadge({ risk, onClick, interactive = true }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!risk) return null;

  const level = risk.riskLevel || 'LOW';

  const styles = {
    LOW: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      icon: ShieldCheck,
      label: 'Low Risk',
    },
    MEDIUM: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      icon: AlertTriangle,
      label: 'Medium Risk',
    },
    HIGH: {
      bg: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      icon: AlertCircle,
      label: 'High Risk',
    },
  };

  const current = styles[level] || styles.LOW;
  const Icon = current.icon;

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (interactive) {
      setShowDetails(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="View Risk Analysis Report"
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold border rounded-full transition-colors cursor-pointer ${current.bg}`}
      >
        <Icon className="w-3 h-3" />
        <span>{current.label}</span>
      </button>

      {/* Modal explaining the transparent rule-based risk factors */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Task Risk Analysis Report"
        description="Transparent rule-based evaluation of schedule, dependencies, and bottlenecks."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Assessed Risk Level</p>
                <p className="text-sm font-bold text-slate-800">{current.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Risk Score</p>
              <p className="text-sm font-bold text-indigo-600">{risk.riskScore || 0} / 100</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Evaluation Factors & Explanations
            </h4>
            <ul className="space-y-2">
              {risk.reasons && risk.reasons.length > 0 ? (
                risk.reasons.map((reason, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-500 italic">No adverse risk conditions detected.</li>
              )}
            </ul>
          </div>

          {risk.affectedDownstreamCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <span className="font-semibold">Downstream Impact: </span>
              {risk.affectedDownstreamCount} subsequent task(s) directly or transitively wait on this task.
            </div>
          )}

          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-lg">
            <h4 className="text-xs font-semibold text-indigo-900 mb-1">
              Recommended Next Action
            </h4>
            <p className="text-xs text-indigo-800 leading-relaxed">
              {risk.recommendedAction || 'Continue routine task monitoring.'}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowDetails(false)}>
              Close Report
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
