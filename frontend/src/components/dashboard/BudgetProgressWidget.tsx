import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { CategoryBudgetProgress } from '../../types';
import { Link } from 'react-router-dom';
import { PieChart, ArrowRight } from 'lucide-react';

interface BudgetProgressWidgetProps {
  progressItems: CategoryBudgetProgress[];
  isLoading?: boolean;
}

export const BudgetProgressWidget: React.FC<BudgetProgressWidgetProps> = ({
  progressItems,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Exceeded') return <Badge variant="rose" size="sm">Exceeded</Badge>;
    if (status === 'Near Limit') return <Badge variant="rose" size="sm">Near Limit</Badge>;
    if (status === 'Approaching Limit') return <Badge variant="amber" size="sm">70%+ Used</Badge>;
    return <Badge variant="emerald" size="sm">Normal</Badge>;
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Category Budgets</h3>
            <p className="text-[11px] text-slate-500">Monthly limits & threshold warnings</p>
          </div>
        </div>
        <Link
          to="/budgets"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {progressItems.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-slate-500">No category budgets created for this month.</p>
          <Link
            to="/budgets"
            className="inline-block mt-2 text-xs font-semibold text-brand-600 hover:underline"
          >
            + Create your first budget limit
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {progressItems.slice(0, 5).map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.category_color }}
                  />
                  <span className="font-semibold text-slate-800">{item.category_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    ₹{item.spent_amount.toLocaleString('en-IN')} / ₹
                    {item.budgeted_amount.toLocaleString('en-IN')}
                  </span>
                  {getStatusBadge(item.status)}
                </div>
              </div>

              <ProgressBar percentage={item.percentage_used} height="sm" />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
