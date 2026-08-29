import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { SpendingPaceResponse } from '../../types';
import { Flame, Calendar, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SpendingPaceCardProps {
  pace: SpendingPaceResponse | null;
  isLoading?: boolean;
}

export const SpendingPaceCard: React.FC<SpendingPaceCardProps> = ({ pace, isLoading }) => {
  if (isLoading || !pace) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-slate-200 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-full"></div>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (pace.status === 'Healthy') {
      return (
        <Badge variant="emerald" size="sm">
          <CheckCircle2 className="w-3 h-3" /> Healthy Pace
        </Badge>
      );
    }
    if (pace.status === 'On Track') {
      return (
        <Badge variant="blue" size="sm">
          <CheckCircle2 className="w-3 h-3" /> On Track
        </Badge>
      );
    }
    return (
      <Badge variant="rose" size="sm">
        <AlertTriangle className="w-3 h-3" /> {pace.status_label}
      </Badge>
    );
  };

  return (
    <Card className="p-5 relative overflow-hidden bg-gradient-to-br from-white to-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Spending Pace & Burn Rate</h3>
            <p className="text-[11px] text-slate-500">Comparing budget consumption vs month elapsed</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Progress Bars Comparison */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-600">Flexible Budget Used</span>
            <span className="text-slate-900">{pace.budget_usage_percentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pace.budget_usage_percentage > pace.time_elapsed_percentage + 15
                  ? 'bg-rose-500'
                  : 'bg-brand-500'
              }`}
              style={{ width: `${Math.min(100, pace.budget_usage_percentage)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Month Elapsed ({pace.days_elapsed}/{pace.total_days_in_month} days)</span>
            </span>
            <span className="text-slate-900">{pace.time_elapsed_percentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-slate-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, pace.time_elapsed_percentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Explanation Text */}
      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
        {pace.explanation}
      </div>

      {/* Burn Rate & Projection Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-center">
        <div className="p-2 bg-white rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400">Daily Burn Rate</span>
          <p className="text-sm font-extrabold text-slate-800 mt-0.5">
            ₹{pace.spending_rate.toLocaleString('en-IN')}/day
          </p>
        </div>

        <div className="p-2 bg-white rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3 text-brand-500" /> Month-End Projected
          </span>
          <p className="text-sm font-extrabold text-brand-700 mt-0.5">
            ₹{pace.expected_month_end_spending.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </Card>
  );
};
