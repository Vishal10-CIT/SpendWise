import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { SavingsGoal } from '../../types';
import { Target, Calendar, Plus, Edit2, Trash2, CheckCircle2, TrendingUp } from 'lucide-react';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onDeposit: (goal: SavingsGoal) => void;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (goal: SavingsGoal) => void;
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({
  goal,
  onDeposit,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="p-5 flex flex-col justify-between relative overflow-hidden">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{goal.name}</h4>
              {goal.target_date ? (
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Target: {goal.target_date}</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Open-ended horizon</span>
              )}
            </div>
          </div>

          <Badge variant={goal.is_completed ? 'emerald' : 'purple'} size="sm">
            {goal.is_completed ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Reached
              </span>
            ) : (
              `${goal.progress_percentage.toFixed(0)}%`
            )}
          </Badge>
        </div>

        {/* Amounts */}
        <div className="my-3 flex justify-between items-baseline">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Saved</span>
            <p className="text-lg font-black text-purple-700">
              ₹{goal.current_amount.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Target</span>
            <p className="text-base font-bold text-slate-600">
              ₹{goal.target_amount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          percentage={goal.progress_percentage}
          color="indigo"
          height="sm"
        />

        {/* Monthly Recommended Saving */}
        {!goal.is_completed && goal.remaining_amount > 0 && (
          <div className="mt-3 p-2 bg-purple-50/50 rounded-xl border border-purple-100/70 flex items-center justify-between text-[11px]">
            <span className="text-purple-900 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-purple-600" />
              <span>Recommended Pace:</span>
            </span>
            <span className="font-bold text-purple-900">
              ₹{goal.recommended_monthly_saving.toLocaleString('en-IN')}/mo
            </span>
          </div>
        )}

        {goal.description && (
          <p className="text-xs text-slate-500 mt-2.5 italic truncate">{goal.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => onDeposit(goal)}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Savings</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(goal)}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="Edit Goal"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(goal)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Goal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
};
