import React from 'react';
import { RecurringExpense } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Edit2, Trash2, Calendar, Repeat } from 'lucide-react';

interface RecurringListProps {
  items: RecurringExpense[];
  isLoading: boolean;
  onEdit: (item: RecurringExpense) => void;
  onDelete: (item: RecurringExpense) => void;
  onAddNew: () => void;
}

export const RecurringList: React.FC<RecurringListProps> = ({
  items,
  isLoading,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Repeat className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Recurring Commitments</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
          Add subscriptions like Netflix, Spotify, or fixed student obligations like gym fees and hostel rent.
        </p>
        <Button variant="primary" size="sm" onClick={onAddNew}>
          + Add Recurring Bill
        </Button>
      </div>
    );
  }

  const totalMonthlyAllocation = items
    .filter((i) => i.is_active)
    .reduce((sum, i) => sum + i.monthly_allocation, 0);

  return (
    <div className="space-y-4">
      {/* Monthly Amortization Summary Card */}
      <div className="p-4 bg-brand-50/60 border border-brand-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-brand-900">
        <div>
          <span className="font-extrabold uppercase tracking-wider text-[10px] text-brand-600">
            Monthly Budget Amortization
          </span>
          <p className="text-sm font-black text-brand-950 mt-0.5">
            ₹{totalMonthlyAllocation.toLocaleString('en-IN')}/month
          </p>
          <p className="text-[11px] text-brand-700 mt-0.5">
            Planned monthly deduction across all active recurring frequencies
          </p>
        </div>
        <Badge variant="indigo" size="sm">
          {items.filter((i) => i.is_active).length} Active Commitments
        </Badge>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 mt-1 sm:mt-0"
                style={{ backgroundColor: item.category?.color || '#6366F1' }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                  <Badge variant={item.is_active ? 'emerald' : 'slate'} size="sm">
                    {item.is_active ? item.frequency : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700">
                    Category: {item.category?.name || 'General'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Due: {item.next_payment_date}
                  </span>
                  {item.notes && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-xs">{item.notes}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
              <div className="text-left sm:text-right">
                <div className="text-sm font-extrabold text-slate-900">
                  ₹{item.amount.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  (₹{item.monthly_allocation.toLocaleString('en-IN')}/mo planned)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onEdit(item)}
                  title="Edit"
                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(item)}
                  title="Delete"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
