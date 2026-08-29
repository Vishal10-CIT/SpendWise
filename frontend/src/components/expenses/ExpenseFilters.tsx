import React from 'react';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Category, ExpenseFilterParams } from '../../types';
import { Search, Filter, RotateCcw } from 'lucide-react';

interface ExpenseFiltersProps {
  filters: ExpenseFilterParams;
  onFilterChange: (newFilters: ExpenseFilterParams) => void;
  categories: Category[];
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  filters,
  onFilterChange,
  categories,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value, page: 1 });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value) : undefined;
    onFilterChange({ ...filters, category_id: val, page: 1 });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, expense_type: e.target.value || undefined, page: 1 });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, payment_method: e.target.value || undefined, page: 1 });
  };

  const handleReset = () => {
    onFilterChange({
      search: '',
      category_id: undefined,
      expense_type: undefined,
      payment_method: undefined,
      start_date: undefined,
      end_date: undefined,
      sort_by: 'date',
      sort_desc: true,
      page: 1,
      limit: 20,
    });
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <Input
          placeholder="Search by description..."
          value={filters.search || ''}
          onChange={handleSearchChange}
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        />

        {/* Category Filter */}
        <Select
          value={filters.category_id || ''}
          onChange={handleCategoryChange}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.group})
            </option>
          ))}
        </Select>

        {/* Expense Type Filter (Fixed vs Variable) */}
        <Select
          value={filters.expense_type || ''}
          onChange={handleTypeChange}
        >
          <option value="">All Spending Types</option>
          <option value="Variable">Variable (Day-to-day)</option>
          <option value="Fixed">Fixed (Commitments)</option>
        </Select>

        {/* Payment Method Filter */}
        <Select
          value={filters.payment_method || ''}
          onChange={handlePaymentChange}
        >
          <option value="">All Payment Modes</option>
          <option value="UPI">UPI / GPay / PhonePe</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="NetBanking">Net Banking</option>
          <option value="Other">Other</option>
        </Select>
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
        <span className="flex items-center gap-1 font-medium">
          <Filter className="w-3.5 h-3.5" /> Filter and Sort Expenses
        </span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-slate-500 hover:text-brand-600 font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
};
