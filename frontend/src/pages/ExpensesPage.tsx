import React, { useState, useEffect } from 'react';
import { ExpenseTable } from '../components/expenses/ExpenseTable';
import { ExpenseFilters } from '../components/expenses/ExpenseFilters';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Button } from '../components/common/Button';
import { expensesApi, categoriesApi } from '../services/api';
import { Expense, Category, ExpenseFilterParams, PaginatedExpenses } from '../types';
import { useToast } from '../components/common/Toast';
import { Plus } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { showToast } = useToast();
  const [expensesData, setExpensesData] = useState<PaginatedExpenses>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
    total_amount: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<ExpenseFilterParams>({
    page: 1,
    limit: 20,
    sort_by: 'date',
    sort_desc: true,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await expensesApi.getExpenses(filters);
      setExpensesData(data);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    categoriesApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const handleEdit = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await expensesApi.deleteExpense(expenseToDelete.id);
      showToast('Expense record deleted.', 'info');
      setExpenseToDelete(null);
      fetchExpenses();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete expense.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Expense Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track, filter, and inspect your day-to-day student expenses
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setExpenseToEdit(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Expense
        </Button>
      </div>

      {/* Filter Bar */}
      <ExpenseFilters
        filters={filters}
        onFilterChange={setFilters}
        categories={categories}
      />

      {/* Expenses Table */}
      <ExpenseTable
        expenses={expensesData.items}
        isLoading={isLoading}
        total={expensesData.total}
        page={expensesData.page}
        limit={expensesData.limit}
        totalPages={expensesData.total_pages}
        totalAmount={expensesData.total_amount}
        onPageChange={(p) => setFilters({ ...filters, page: p })}
        onEdit={handleEdit}
        onDelete={(exp) => setExpenseToDelete(exp)}
        onAddNew={() => {
          setExpenseToEdit(null);
          setIsModalOpen(true);
        }}
      />

      {/* Add / Edit Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
        expenseToEdit={expenseToEdit}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense Record"
        message={`Are you sure you want to delete this ₹${expenseToDelete?.amount} expense for '${expenseToDelete?.description || 'Expense'}'? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};
