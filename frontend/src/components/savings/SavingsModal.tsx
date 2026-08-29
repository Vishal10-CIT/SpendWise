import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { savingsApi } from '../../services/api';
import { SavingsGoal } from '../../types';
import { useToast } from '../common/Toast';

interface SavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goalToEdit?: SavingsGoal | null;
}

export const SavingsModal: React.FC<SavingsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  goalToEdit,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('0');
  const [targetDate, setTargetDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setName(goalToEdit.name);
        setTargetAmount(goalToEdit.target_amount.toString());
        setCurrentAmount(goalToEdit.current_amount.toString());
        setTargetDate(goalToEdit.target_date || '');
        setDescription(goalToEdit.description || '');
      } else {
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        setTargetDate('');
        setDescription('');
      }
      setError('');
    }
  }, [isOpen, goalToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    const numCurrent = parseFloat(currentAmount) || 0;

    if (!name.trim()) {
      setError('Please provide a goal name.');
      return;
    }
    if (isNaN(numTarget) || numTarget <= 0) {
      setError('Please provide a valid target amount.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      if (goalToEdit) {
        await savingsApi.updateSavingsGoal(goalToEdit.id, {
          name: name.trim(),
          target_amount: numTarget,
          current_amount: numCurrent,
          target_date: targetDate || null,
          description: description.trim() || undefined,
        });
        showToast('Savings goal updated!', 'success');
      } else {
        await savingsApi.createSavingsGoal({
          name: name.trim(),
          target_amount: numTarget,
          current_amount: numCurrent,
          target_date: targetDate || null,
          description: description.trim() || undefined,
        });
        showToast('New savings goal created! 🎯', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save savings goal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goalToEdit ? 'Edit Savings Goal' : 'Create Savings Goal'}
      subtitle="Save up for a new laptop, semester trip, course, or emergency buffer"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Goal Name"
          placeholder="e.g. New Coding Laptop, Semester Trip, Emergency Fund"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Target Amount (₹)"
            type="number"
            step="0.01"
            min="1"
            placeholder="e.g. 25000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />

          <Input
            label="Already Saved (₹)"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 5000"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
          />
        </div>

        <Input
          label="Target Date (Optional)"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />

        <Input
          label="Notes / Motivation"
          placeholder="e.g. Need by end of 3rd semester for machine learning project"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {goalToEdit ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
