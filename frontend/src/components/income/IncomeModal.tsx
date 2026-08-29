import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { incomeApi } from '../../services/api';
import { Income } from '../../types';
import { useToast } from '../common/Toast';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  incomeToEdit?: Income | null;
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  incomeToEdit,
}) => {
  const { showToast } = useToast();
  const [source, setSource] = useState<string>('Allowance');
  const [amount, setAmount] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState<boolean>(true);
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const commonSources = [
    'Allowance',
    'Part-time Job',
    'Scholarship',
    'Freelance Project',
    'Family Support',
    'Cashback / Reward',
    'Other',
  ];

  useEffect(() => {
    if (isOpen) {
      if (incomeToEdit) {
        setSource(incomeToEdit.source);
        setAmount(incomeToEdit.amount.toString());
        setDateStr(incomeToEdit.date);
        setRecurring(incomeToEdit.recurring);
        setDescription(incomeToEdit.description || '');
      } else {
        setSource('Allowance');
        setAmount('');
        setDateStr(new Date().toISOString().split('T')[0]);
        setRecurring(true);
        setDescription('');
      }
      setError('');
    }
  }, [isOpen, incomeToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!source.trim()) {
      setError('Please provide an income source.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      if (incomeToEdit) {
        await incomeApi.updateIncome(incomeToEdit.id, {
          source: source.trim(),
          amount: numAmount,
          date: dateStr,
          recurring,
          description: description.trim() || undefined,
        });
        showToast('Income entry updated!', 'success');
      } else {
        await incomeApi.createIncome({
          source: source.trim(),
          amount: numAmount,
          date: dateStr,
          recurring,
          description: description.trim() || undefined,
        });
        showToast('Income recorded successfully!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save income.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={incomeToEdit ? 'Edit Income Entry' : 'Record Student Income'}
      subtitle="Track monthly allowance, freelance work, or scholarship"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Income Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            {commonSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            min="1"
            placeholder="e.g. 10000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>

        <Input
          label="Date Received"
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          required
        />

        <Input
          label="Notes / Description (Optional)"
          placeholder="e.g. Monthly allowance from parents, Tutoring stipend"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
          />
          <span>Recurring Monthly Income (e.g. regular allowance)</span>
        </label>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="emerald" isLoading={isLoading}>
            {incomeToEdit ? 'Save Changes' : 'Record Income'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
