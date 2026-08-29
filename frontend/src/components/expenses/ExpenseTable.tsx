import React from 'react';
import { Expense } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Edit2, Trash2, Calendar, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';

interface ExpenseTableProps {
  expenses: Expense[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalAmount: number;
  onPageChange: (page: number) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onAddNew: () => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  isLoading,
  total,
  page,
  totalPages,
  totalAmount,
  onPageChange,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Expenses Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
          You haven't logged any matching expenses yet. Start tracking your student spending now.
        </p>
        <Button variant="primary" size="sm" onClick={onAddNew}>
          + Log New Expense
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header Summary */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <span className="text-xs font-semibold text-slate-600">
          Showing {expenses.length} of {total} transactions
        </span>
        <span className="text-xs font-bold text-slate-900">
          Filtered Total: ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Date */}
                <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{expense.date}</span>
                  </div>
                </td>

                {/* Category */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: expense.category?.color || '#6366F1' }}
                    />
                    <span className="font-semibold text-slate-800">
                      {expense.category?.name || 'General'}
                    </span>
                  </div>
                </td>

                {/* Description */}
                <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                  {expense.description || <span className="text-slate-400 italic">No notes</span>}
                </td>

                {/* Payment Method */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <Badge variant="slate" size="sm">
                    {expense.payment_method}
                  </Badge>
                </td>

                {/* Expense Type */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <Badge
                    variant={expense.expense_type === 'Fixed' ? 'indigo' : 'amber'}
                    size="sm"
                  >
                    {expense.expense_type}
                  </Badge>
                </td>

                {/* Amount */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <span className="font-extrabold text-sm text-slate-900">
                    ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onEdit(expense)}
                      title="Edit Expense"
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(expense)}
                      title="Delete Expense"
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
