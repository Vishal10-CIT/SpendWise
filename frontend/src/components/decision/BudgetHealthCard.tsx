import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { BudgetHealthResponse } from '../../types';
import { HeartPulse, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface BudgetHealthCardProps {
  health: BudgetHealthResponse | null;
  isLoading?: boolean;
}

export const BudgetHealthCard: React.FC<BudgetHealthCardProps> = ({ health, isLoading }) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  if (isLoading || !health) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-slate-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-full"></div>
      </Card>
    );
  }

  const getScoreColor = () => {
    if (health.score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (health.score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (health.score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (health.score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getBadgeVariant = () => {
    if (health.score >= 90) return 'emerald';
    if (health.score >= 75) return 'blue';
    if (health.score >= 60) return 'amber';
    if (health.score >= 40) return 'amber';
    return 'rose';
  };

  return (
    <Card className="p-5 relative overflow-hidden bg-gradient-to-br from-white to-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">SpendWise Budget Health</h3>
            <p className="text-[11px] text-slate-500">Internal financial discipline rating</p>
          </div>
        </div>
        <Badge variant={getBadgeVariant()} size="sm">
          {health.status}
        </Badge>
      </div>

      {/* Main Score Hero */}
      <div className="my-4 flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-black shadow-xs flex-shrink-0 ${getScoreColor()}`}
        >
          <span className="text-2xl leading-none">{health.score}</span>
          <span className="text-[9px] uppercase tracking-wider opacity-75 font-semibold">/100</span>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900 leading-snug">
            {health.status} Financial Control
          </h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
            {health.summary_explanation}
          </p>
        </div>
      </div>

      {/* Positive & Negative Factors Pills */}
      <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 text-xs">
        {health.positive_factors.map((pos, idx) => (
          <div key={`pos-${idx}`} className="flex items-start gap-2 text-emerald-800 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{pos}</span>
          </div>
        ))}

        {health.negative_factors.map((neg, idx) => (
          <div key={`neg-${idx}`} className="flex items-start gap-2 text-rose-800 bg-rose-50/60 p-2 rounded-xl border border-rose-100/60">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{neg}</span>
          </div>
        ))}
      </div>

      {/* Toggle Factor Breakdown */}
      <div className="mt-3 pt-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 py-1 transition-colors"
        >
          <span>{showDetails ? 'Hide Score Breakdown' : 'View Scoring Breakdown (5 Factors)'}</span>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDetails && (
          <div className="mt-3 space-y-2.5 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
            {health.factor_breakdown.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">{item.factor_name} ({item.weight_percentage}%)</span>
                  <span className="font-extrabold text-slate-900">{item.raw_score.toFixed(0)} / 100</span>
                </div>
                <p className="text-[11px] text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
