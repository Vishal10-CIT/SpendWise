import React, { useState, useEffect } from 'react';
import { BudgetGrid } from '../components/budgets/BudgetGrid';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { Badge } from '../components/common/Badge';
import { budgetsApi, categoriesApi } from '../services/api';
import { Category, MonthlyBudgetOverview, CategoryBudgetProgress } from '../types';
import { useToast } from '../components/common/Toast';
import { Plus } from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const { showToast } = useToast();
  const today = new Date();
  const [currentMonth] = useState<number>(today.getMonth() + 1);
  const [currentYear] = useState<number>(today.getFullYear());
  const [overview, setOverview] = useState<MonthlyBudgetOverview | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [budgetToEdit, setBudgetToEdit] = useState<any | null>(null);
  const [budgetToDeleteId, setBudgetToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const data = await budgetsApi.getBudgetProgress(currentMonth, currentYear);
      setOverview(data);
    } catch (err) {
      console.error('Failed to load budget progress:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    categoriesApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [currentMonth, currentYear]);

  const handleEdit = (item: CategoryBudgetProgress) => {
    setBudgetToEdit({
      category_id: item.category_id,
      amount: item.budgeted_amount,
    });
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!budgetToDeleteId) return;
    setIsDeleting(true);
    try {
      await budgetsApi.deleteBudget(budgetToDeleteId);
      showToast('Budget limit removed.', 'info');
      setBudgetToDeleteId(null);
      fetchBudgets();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete budget.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Budgets</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set spending targets per category and monitor threshold warnings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => {
              setBudgetToEdit(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Set Budget Limit
          </Button>
        </div>
      </div>

      {/* Overview Banner Card */}
      {overview && (
        <Card className="p-6 bg-gradient-to-br from-white to-slate-50 border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-slate-400">
                  Total Planned Budget
                </span>
                <Badge
                  variant={
                    overview.status === 'Exceeded'
                      ? 'rose'
                      : overview.status === 'Approaching Limit'
                      ? 'amber'
                      : 'emerald'
                  }
                  size="sm"
                >
                  {overview.status}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  ₹{overview.total_spent.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  / ₹{overview.total_budgeted.toLocaleString('en-IN')}
                </span>
              </div>

              <ProgressBar percentage={overview.percentage_used} height="md" showLabel />
            </div>

            <div className="flex md:flex-col justify-between items-start md:items-end gap-2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Remaining Buffer</span>
                <p
                  className={`text-lg font-black ${
                    overview.remaining_budget < 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  ₹{overview.remaining_budget.toLocaleString('en-IN')}
                </p>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                {overview.category_progress.length} active category budgets
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Category Budgets Grid */}
      <BudgetGrid
        items={overview?.category_progress || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={(id) => setBudgetToDeleteId(id)}
        onAddNew={() => {
          setBudgetToEdit(null);
          setIsModalOpen(true);
        }}
      />

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBudgets}
        budgetToEdit={budgetToEdit}
        categories={categories}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!budgetToDeleteId}
        onClose={() => setBudgetToDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Budget Cap"
        message="Are you sure you want to remove this category budget limit?"
        isLoading={isDeleting}
      />
    </div>
  );
};
