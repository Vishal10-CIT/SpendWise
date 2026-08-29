import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { CategoryBudgetProgress } from '../../types';
import { Edit2, Trash2, PieChart } from 'lucide-react';

interface BudgetGridProps {
  items: CategoryBudgetProgress[];
  isLoading: boolean;
  onEdit: (item: CategoryBudgetProgress) => void;
  onDelete: (id: number) => void;
  onAddNew: () => void;
}

export const BudgetGrid: React.FC<BudgetGridProps> = ({
  items,
  isLoading,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <PieChart className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Category Budgets Configured</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
          Set monthly spending limits for Food, Books, Canteen, or Outings to receive automatic threshold alerts.
        </p>
        <button
          onClick={onAddNew}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          + Set Category Budget
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Exceeded') return <Badge variant="rose" size="sm">Exceeded</Badge>;
    if (status === 'Near Limit') return <Badge variant="rose" size="sm">90%+ Limit</Badge>;
    if (status === 'Approaching Limit') return <Badge variant="amber" size="sm">Approaching</Badge>;
    return <Badge variant="emerald" size="sm">Healthy</Badge>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.id || item.category_id} className="p-5 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.category_color }}
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.category_name}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">{item.category_group}</span>
                </div>
              </div>
              {getStatusBadge(item.status)}
            </div>

            {/* Numbers */}
            <div className="my-3 flex justify-between items-baseline">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Spent</span>
                <p className="text-base font-extrabold text-slate-900">
                  ₹{item.spent_amount.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Budget Limit</span>
                <p className="text-base font-bold text-slate-600">
                  ₹{item.budgeted_amount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <ProgressBar percentage={item.percentage_used} height="sm" />
          </div>

          {/* Footer Card Info */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span
              className={`font-semibold ${
                item.remaining_amount < 0 ? 'text-rose-600' : 'text-slate-500'
              }`}
            >
              {item.remaining_amount >= 0 ? (
                `₹${item.remaining_amount.toLocaleString('en-IN')} remaining`
              ) : (
                `Exceeded by ₹${Math.abs(item.remaining_amount).toLocaleString('en-IN')}`
              )}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(item)}
                className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                title="Edit Budget"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              {item.id && (
                <button
                  onClick={() => onDelete(item.id!)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Remove Budget"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
