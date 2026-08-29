import React, { useState, useEffect } from 'react';
import { SavingsGoalCard } from '../components/savings/SavingsGoalCard';
import { SavingsModal } from '../components/savings/SavingsModal';
import { DepositModal } from '../components/savings/DepositModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { savingsApi } from '../services/api';
import { SavingsGoal } from '../types';
import { useToast } from '../components/common/Toast';
import { Plus, Target } from 'lucide-react';

export const SavingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null);
  const [goalToDeposit, setGoalToDeposit] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const data = await savingsApi.getSavingsGoals();
      setGoals(data);
    } catch (err) {
      console.error('Failed to load savings goals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleEdit = (goal: SavingsGoal) => {
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  const handleDeposit = (goal: SavingsGoal) => {
    setGoalToDeposit(goal);
  };

  const handleDeleteConfirm = async () => {
    if (!goalToDelete) return;
    setIsDeleting(true);
    try {
      await savingsApi.deleteSavingsGoal(goalToDelete.id);
      showToast('Savings goal removed.', 'info');
      setGoalToDelete(null);
      fetchGoals();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete goal.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Savings Goals & Targets</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set student milestone targets for laptops, courses, semester trips, and emergency buffers
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setGoalToEdit(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Savings Goal
        </Button>
      </div>

      {/* Progress Summary Hero */}
      {goals.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-purple-50/70 to-white border-purple-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-purple-700">
                Total Savings Accumulated
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-purple-950">
                  ₹{totalSaved.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-semibold text-purple-700">
                  / ₹{totalTarget.toLocaleString('en-IN')} Target ({overallPct.toFixed(0)}%)
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-purple-800">
              <span className="font-bold">{goals.length} Active Goals</span>
              <p className="text-purple-600/80 mt-0.5">
                {goals.filter((g) => g.is_completed).length} goals fully achieved 🎉
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Savings Goals Created</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Start saving for gadgets, travel, exam fees, or emergency money. We'll automatically calculate your monthly pace.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setGoalToEdit(null);
              setIsModalOpen(true);
            }}
          >
            + Set Your First Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onDeposit={handleDeposit}
              onEdit={handleEdit}
              onDelete={(g) => setGoalToDelete(g)}
            />
          ))}
        </div>
      )}

      {/* Goal Modal */}
      <SavingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchGoals}
        goalToEdit={goalToEdit}
      />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={!!goalToDeposit}
        onClose={() => setGoalToDeposit(null)}
        onSuccess={fetchGoals}
        goal={goalToDeposit}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Savings Goal"
        message={`Are you sure you want to delete '${goalToDelete?.name}'?`}
        isLoading={isDeleting}
      />
    </div>
  );
};
