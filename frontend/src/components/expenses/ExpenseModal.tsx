import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { expensesApi } from '../../services/api';
import { Expense, Category, PaymentMethod, ExpenseType } from '../../types';
import { useToast } from '../common/Toast';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: Expense | null;
  categories: Category[];
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
  categories,
}) => {
  const { showToast } = useToast();
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [expenseType, setExpenseType] = useState<ExpenseType>('Variable');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setCategoryId(expenseToEdit.category_id);
        setAmount(expenseToEdit.amount.toString());
        setDescription(expenseToEdit.description || '');
        setDateStr(expenseToEdit.date);
        setPaymentMethod(expenseToEdit.payment_method);
        setExpenseType(expenseToEdit.expense_type);
      } else {
        setCategoryId(categories[0]?.id || 1);
        setAmount('');
        setDescription('');
        setDateStr(new Date().toISOString().split('T')[0]);
        setPaymentMethod('UPI');
        setExpenseType('Variable');
      }
      setError('');
    }
  }, [isOpen, expenseToEdit, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      if (expenseToEdit) {
        await expensesApi.updateExpense(expenseToEdit.id, {
          category_id: categoryId,
          amount: numAmount,
          description: description.trim() || undefined,
          date: dateStr,
          payment_method: paymentMethod,
          expense_type: expenseType,
        });
        showToast('Expense updated successfully!', 'success');
      } else {
        await expensesApi.createExpense({
          category_id: categoryId,
          amount: numAmount,
          description: description.trim() || undefined,
          date: dateStr,
          payment_method: paymentMethod,
          expense_type: expenseType,
        });
        showToast('Expense recorded successfully!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save expense.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
      subtitle="Record student spending"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(parseInt(e.target.value))}
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.group})
              </option>
            ))}
          </Select>

          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            min="1"
            placeholder="e.g. 250"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>

        <Input
          label="Description / Purpose"
          placeholder="e.g. Dinner with hostel friends, Stationery kit"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Date"
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            required
          />

          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            <option value="UPI">UPI / GPay / PhonePe</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="NetBanking">Net Banking</option>
            <option value="Other">Other</option>
          </Select>

          <Select
            label="Spending Type"
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
          >
            <option value="Variable">Variable (Discretionary)</option>
            <option value="Fixed">Fixed (Commitment)</option>
          </Select>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {expenseToEdit ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
