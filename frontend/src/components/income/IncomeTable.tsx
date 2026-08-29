import React from 'react';
import { Income } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Edit2, Trash2, Calendar, Wallet, Repeat } from 'lucide-react';

interface IncomeTableProps {
  incomes: Income[];
  isLoading: boolean;
  onEdit: (income: Income) => void;
  onDelete: (income: Income) => void;
  onAddNew: () => void;
}

export const IncomeTable: React.FC<IncomeTableProps> = ({
  incomes,
  isLoading,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (incomes.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Income Records</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
          Record your monthly allowance, scholarship, or freelance projects to track incoming cash flow.
        </p>
        <Button variant="emerald" size="sm" onClick={onAddNew}>
          + Add Income
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Notes</th>
              <th className="py-3 px-4">Recurring</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {incomes.map((income) => (
              <tr key={income.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{income.date}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                  {income.source}
                </td>

                <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                  {income.description || <span className="text-slate-400 italic">No notes</span>}
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap">
                  {income.recurring ? (
                    <Badge variant="emerald" size="sm">
                      <Repeat className="w-3 h-3" /> Monthly
                    </Badge>
                  ) : (
                    <Badge variant="slate" size="sm">One-off</Badge>
                  )}
                </td>

                <td className="py-3.5 px-4 text-right whitespace-nowrap font-extrabold text-sm text-emerald-600">
                  +₹{income.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>

                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onEdit(income)}
                      title="Edit Income"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(income)}
                      title="Delete Income"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
