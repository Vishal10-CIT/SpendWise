import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { expensesApi, categoriesApi } from '../../services/api';
import { Category, PaymentMethod } from '../../types';
import { useToast } from '../common/Toast';
import { Zap } from 'lucide-react';

interface QuickExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      categoriesApi.getCategories().then((cats) => {
        setCategories(cats);
        if (cats.length > 0) {
          const foodCat = cats.find((c) => c.group === 'Food') || cats[0];
          setSelectedCategoryId(foodCat.id);
        }
      }).catch(console.error);

      setAmount('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  const quickAmounts = [50, 100, 150, 200, 350, 500];

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!selectedCategoryId) {
      setError('Please select an expense category.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await expensesApi.quickCreateExpense({
        category_id: selectedCategoryId,
        amount: numAmount,
        description: description.trim() || undefined,
        payment_method: paymentMethod,
      });

      showToast(`Expense of ₹${numAmount} logged successfully!`, 'success');
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
      title="Quick Expense Entry"
      subtitle="Log student daily expenses in 2 clicks"
      maxWidth="md"
    >
      <form onSubmit={handleQuickSubmit} className="space-y-4">
        {/* Quick Category Chips */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Select Category
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
            {categories.slice(0, 12).map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  selectedCategoryId === cat.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate w-full">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input & Quick Chips */}
        <div>
          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            min="1"
            placeholder="e.g. 150"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />

          <div className="flex flex-wrap gap-2 mt-2">
            {quickAmounts.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => setAmount(q.toString())}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                +₹{q}
              </button>
            ))}
          </div>
        </div>

        {/* Description & Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Note (Optional)"
            placeholder="e.g. Chai, Samosa, Auto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Zap className="w-4 h-4" />}
          >
            Save Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
};
