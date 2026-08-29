import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { recurringApi } from '../../services/api';
import { Category, RecurringExpense, RecurringFrequency } from '../../types';
import { useToast } from '../common/Toast';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemToEdit?: RecurringExpense | null;
  categories: Category[];
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  itemToEdit,
  categories,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [amount, setAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('Monthly');
  const [nextPaymentDate, setNextPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isActive, setIsActive] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setName(itemToEdit.name);
        setCategoryId(itemToEdit.category_id);
        setAmount(itemToEdit.amount.toString());
        setFrequency(itemToEdit.frequency);
        setNextPaymentDate(itemToEdit.next_payment_date);
        setIsActive(itemToEdit.is_active);
        setNotes(itemToEdit.notes || '');
      } else {
        setName('');
        setCategoryId(categories[0]?.id || 1);
        setAmount('');
        setFrequency('Monthly');
        setNextPaymentDate(new Date().toISOString().split('T')[0]);
        setIsActive(true);
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, itemToEdit, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!name.trim()) {
      setError('Please provide a name for this recurring commitment.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      if (itemToEdit) {
        await recurringApi.updateRecurringExpense(itemToEdit.id, {
          name: name.trim(),
          category_id: categoryId,
          amount: numAmount,
          frequency,
          next_payment_date: nextPaymentDate,
          is_active: isActive,
          notes: notes.trim() || undefined,
        });
        showToast('Recurring expense updated!', 'success');
      } else {
        await recurringApi.createRecurringExpense({
          name: name.trim(),
          category_id: categoryId,
          amount: numAmount,
          frequency,
          next_payment_date: nextPaymentDate,
          is_active: isActive,
          notes: notes.trim() || undefined,
        });
        showToast('Recurring expense added!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save recurring expense.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemToEdit ? 'Edit Recurring Bill' : 'Add Recurring Commitment'}
      subtitle="Track gym memberships, hostel fees, mess bills, and streaming subscriptions"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Commitment Name"
          placeholder="e.g. Hostel Rent, Gym Fee, Spotify, Mess Bill"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

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
            placeholder="e.g. 199 or 3000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
          >
            <option value="Weekly">Weekly (Every 7 days)</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly (Every 3 months)</option>
            <option value="Semi-Annually">Semi-Annually (Every 6 months)</option>
            <option value="Annually">Annually (Once a year)</option>
          </Select>

          <Input
            label="Next Payment Due Date"
            type="date"
            value={nextPaymentDate}
            onChange={(e) => setNextPaymentDate(e.target.value)}
            required
          />
        </div>

        <Input
          label="Notes (Optional)"
          placeholder="e.g. Auto-debit on 5th of every month"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
          />
          <span>Active recurring commitment</span>
        </label>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {itemToEdit ? 'Save Changes' : 'Add Recurring Bill'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
