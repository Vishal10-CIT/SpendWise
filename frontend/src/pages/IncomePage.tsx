import React, { useState, useEffect } from 'react';
import { IncomeTable } from '../components/income/IncomeTable';
import { IncomeModal } from '../components/income/IncomeModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { incomeApi } from '../services/api';
import { Income, MonthlyIncomeSummary } from '../types';
import { useToast } from '../components/common/Toast';
import { Plus } from 'lucide-react';

export const IncomePage: React.FC = () => {
  const { showToast } = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [summary, setSummary] = useState<MonthlyIncomeSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [incomeToEdit, setIncomeToEdit] = useState<Income | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchIncomeData = async () => {
    setIsLoading(true);
    try {
      const [incomeList, sumData] = await Promise.all([
        incomeApi.getIncome(),
        incomeApi.getMonthlySummary(),
      ]);
      setIncomes(incomeList);
      setSummary(sumData);
    } catch (err) {
      console.error('Failed to load income data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeData();
  }, []);

  const handleEdit = (inc: Income) => {
    setIncomeToEdit(inc);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!incomeToDelete) return;
    setIsDeleting(true);
    try {
      await incomeApi.deleteIncome(incomeToDelete.id);
      showToast('Income entry deleted.', 'info');
      setIncomeToDelete(null);
      fetchIncomeData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete income.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Income & Allowance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your monthly allowances, part-time jobs, freelance earnings, and scholarships
          </p>
        </div>

        <Button
          variant="emerald"
          onClick={() => {
            setIncomeToEdit(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Income
        </Button>
      </div>

      {/* Monthly Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-200/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Total Monthly Income
            </span>
            <div className="mt-1 text-2xl font-black text-emerald-950">
              ₹{summary.total_income.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-700/80 mt-1">Available for this month</p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Primary Allowance
            </span>
            <div className="mt-1 text-2xl font-bold text-slate-800">
              ₹{summary.allowance.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-400 mt-1">From family or fixed support</p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Other Earnings & Freelance
            </span>
            <div className="mt-1 text-2xl font-bold text-slate-800">
              ₹{summary.other_sources.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-400 mt-1">Scholarships, tutoring, projects</p>
          </Card>
        </div>
      )}

      {/* Income Table */}
      <IncomeTable
        incomes={incomes}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={(inc) => setIncomeToDelete(inc)}
        onAddNew={() => {
          setIncomeToEdit(null);
          setIsModalOpen(true);
        }}
      />

      {/* Add / Edit Modal */}
      <IncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchIncomeData}
        incomeToEdit={incomeToEdit}
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!incomeToDelete}
        onClose={() => setIncomeToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Income Record"
        message={`Are you sure you want to delete this ₹${incomeToDelete?.amount} income entry from '${incomeToDelete?.source}'?`}
        isLoading={isDeleting}
      />
    </div>
  );
};
