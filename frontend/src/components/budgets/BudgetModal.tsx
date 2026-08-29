import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { budgetsApi } from '../../services/api';
import { Category, Budget } from '../../types';
import { useToast } from '../common/Toast';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetToEdit?: Budget | null;
  categories: Category[];
  currentMonth: number;
  currentYear: number;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  budgetToEdit,
  categories,
  currentMonth,
  currentYear,
}) => {
  const { showToast } = useToast();
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (budgetToEdit) {
        setCategoryId(budgetToEdit.category_id ? budgetToEdit.category_id.toString() : '');
        setAmount(budgetToEdit.amount.toString());
      } else {
        setCategoryId(categories[0]?.id?.toString() || '');
        setAmount('');
      }
      setError('');
    }
  }, [isOpen, budgetToEdit, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive budget amount.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await budgetsApi.setBudget({
        category_id: categoryId ? parseInt(categoryId) : null,
        amount: numAmount,
        month: currentMonth,
        year: currentYear,
      });

      showToast('Budget saved successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save budget.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Edit Budget Limit' : 'Set Category Budget'}
      subtitle={`Configure spending target for ${new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Budget Scope"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">-- Overall Monthly Budget --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.group})
            </option>
          ))}
        </Select>

        <Input
          label="Budget Cap (₹)"
          type="number"
          step="0.01"
          min="1"
          placeholder="e.g. 3000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
        />

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Set Budget
          </Button>
        </div>
      </form>
    </Modal>
  );
};
