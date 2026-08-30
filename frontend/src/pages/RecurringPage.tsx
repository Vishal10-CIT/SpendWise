import React, { useState, useEffect } from 'react';
import { RecurringList } from '../components/recurring/RecurringList';
import { RecurringModal } from '../components/recurring/RecurringModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Button } from '../components/common/Button';
import { recurringApi, categoriesApi } from '../services/api';
import { RecurringExpense, Category } from '../types';
import { useToast } from '../components/common/Toast';
import { Plus } from 'lucide-react';

export const RecurringPage: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<RecurringExpense | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RecurringExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchRecurringData = async () => {
    setIsLoading(true);
    try {
      const data = await recurringApi.getRecurringExpenses();
      setItems(data);
    } catch (err) {
      console.error('Failed to load recurring expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    categoriesApi.getCategories().then(setCategories).catch(console.error);
    fetchRecurringData();
  }, []);

  const handleEdit = (item: RecurringExpense) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await recurringApi.deleteRecurringExpense(itemToDelete.id);
      showToast('Recurring commitment removed.', 'info');
      setItemToDelete(null);
      fetchRecurringData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete recurring expense.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Recurring Commitments & Subscriptions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fixed monthly obligations, subscriptions, and periodic fees with amortized budget planning
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setItemToEdit(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Recurring Bill
        </Button>
      </div>

      {/* List */}
      <RecurringList
        items={items}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={(item) => setItemToDelete(item)}
        onAddNew={() => {
          setItemToEdit(null);
          setIsModalOpen(true);
        }}
        onRefresh={fetchRecurringData}
      />

      {/* Add / Edit Modal */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRecurringData}
        itemToEdit={itemToEdit}
        categories={categories}
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Recurring Bill"
        message={`Are you sure you want to remove '${itemToDelete?.name}' from your recurring commitments?`}
        isLoading={isDeleting}
      />
    </div>
  );
};
