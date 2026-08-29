import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { savingsApi } from '../../services/api';
import { SavingsGoal } from '../../types';
import { useToast } from '../common/Toast';
import { PiggyBank, Plus } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: SavingsGoal | null;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  goal,
}) => {
  const { showToast } = useToast();
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  if (!goal) return null;

  const quickDeposits = [500, 1000, 2000, 5000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid deposit amount.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await savingsApi.depositSavingsGoal(goal.id, { amount: numAmount });
      showToast(`Added ₹${numAmount} to '${goal.name}'! 🎉`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to deposit savings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Savings to '${goal.name}'`}
      subtitle={`Current: ₹${goal.current_amount.toLocaleString('en-IN')} / ₹${goal.target_amount.toLocaleString('en-IN')}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Deposit Amount (₹)"
          type="number"
          step="0.01"
          min="1"
          placeholder="e.g. 1000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
          leftIcon={<PiggyBank className="w-4 h-4 text-purple-600" />}
        />

        <div className="flex flex-wrap gap-2">
          {quickDeposits.map((q) => (
            <button
              type="button"
              key={q}
              onClick={() => setAmount(q.toString())}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition-colors"
            >
              +₹{q}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Plus className="w-4 h-4" />}>
            Deposit
          </Button>
        </div>
      </form>
    </Modal>
  );
};
