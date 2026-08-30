import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { recurringApi } from '../../services/api';
import { Category, RecurringExpense, RecurringFrequency } from '../../types';
import { useToast } from '../common/Toast';
import { Bell } from 'lucide-react';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemToEdit?: RecurringExpense | null;
  categories: Category[];
}

const REMINDER_OPTIONS = [
  { value: 7, label: '7 days before' },
  { value: 3, label: '3 days before' },
  { value: 1, label: '1 day before' },
  { value: 0, label: 'On due date' },
];

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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reminderDays, setReminderDays] = useState<number[]>([7, 3, 1, 0]);
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
        setStartDate(itemToEdit.start_date || '');
        setEndDate(itemToEdit.end_date || '');
        setReminderDays(
          itemToEdit.reminder_days && itemToEdit.reminder_days.length > 0
            ? itemToEdit.reminder_days
            : [7, 3, 1, 0]
        );
        setIsActive(itemToEdit.is_active);
        setNotes(itemToEdit.notes || '');
      } else {
        setName('');
        setCategoryId(categories[0]?.id || 1);
        setAmount('');
        setFrequency('Monthly');
        setNextPaymentDate(new Date().toISOString().split('T')[0]);
        setStartDate('');
        setEndDate('');
        setReminderDays([7, 3, 1, 0]);
        setIsActive(true);
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, itemToEdit, categories]);

  const toggleReminderOption = (dayVal: number) => {
    if (reminderDays.includes(dayVal)) {
      setReminderDays(reminderDays.filter((d) => d !== dayVal));
    } else {
      setReminderDays([...reminderDays, dayVal]);
    }
  };

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
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          reminder_days: reminderDays,
          is_active: isActive,
          notes: notes.trim() || undefined,
        });
        showToast('Recurring commitment and reminder schedule updated!', 'success');
      } else {
        await recurringApi.createRecurringExpense({
          name: name.trim(),
          category_id: categoryId,
          amount: numAmount,
          frequency,
          next_payment_date: nextPaymentDate,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          reminder_days: reminderDays,
          is_active: isActive,
          notes: notes.trim() || undefined,
        });
        showToast('Recurring bill added with smart reminders enabled!', 'success');
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
      title={itemToEdit ? 'Edit Recurring Bill & Reminders' : 'Add Recurring Commitment'}
      subtitle="Track gym memberships, mobile recharges, hostel rent, Wi-Fi, and streaming subscriptions"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Commitment Name"
          placeholder="e.g. Gym Membership, Mobile Recharge, Hostel Rent, Spotify"
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
            placeholder="e.g. 299 or 3000"
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
            <option value="Every 6 months">Every 6 months (Semi-Annually)</option>
            <option value="Yearly">Yearly (Once a year)</option>
          </Select>

          <Input
            label="Next Payment / Renewal Date"
            type="date"
            value={nextPaymentDate}
            onChange={(e) => setNextPaymentDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date (Optional)"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            label="End Date (Optional)"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Custom Reminder Preferences */}
        <div className="p-3.5 bg-brand-50/60 border border-brand-100 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold text-slate-800">
              Renewal Reminder Preferences
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Choose when you want to receive proactive renewal alerts for this payment:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {REMINDER_OPTIONS.map((opt) => {
              const isChecked = reminderDays.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-white border-brand-400 text-brand-700 shadow-xs'
                      : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleReminderOption(opt.value)}
                    className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <Input
          label="Notes (Optional)"
          placeholder="e.g. Wi-Fi customer ID: 883921, Auto-renewed via UPI"
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
