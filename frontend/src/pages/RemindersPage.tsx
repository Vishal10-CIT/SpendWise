import React, { useState, useEffect } from 'react';
import { remindersApi, recurringApi, categoriesApi } from '../services/api';
import { ReminderItem, Category, RecurringExpense } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { RecurringModal } from '../components/recurring/RecurringModal';
import { useToast } from '../components/common/Toast';
import {
  Bell,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';

export const RemindersPage: React.FC = () => {
  const { showToast } = useToast();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');
  const [renewingId, setRenewingId] = useState<number | null>(null);

  // Modal for adding/editing
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<RecurringExpense | null>(null);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const data = await remindersApi.getReminders();
      setReminders(data);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    categoriesApi.getCategories().then(setCategories).catch(console.error);
    fetchReminders();
  }, []);

  const handleMarkRenewed = async (item: ReminderItem) => {
    setRenewingId(item.recurring_expense_id);
    try {
      const res = await recurringApi.markRenewed(item.recurring_expense_id);
      showToast(res.message, 'success');
      fetchReminders();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to mark payment renewed.', 'error');
    } finally {
      setRenewingId(null);
    }
  };

  const handleEditClick = (reminder: ReminderItem) => {
    const mockRec: RecurringExpense = {
      id: reminder.recurring_expense_id,
      user_id: 0,
      category_id: 1,
      name: reminder.name,
      amount: reminder.amount,
      frequency: reminder.frequency as any,
      next_payment_date: reminder.next_payment_date,
      start_date: reminder.start_date,
      end_date: reminder.end_date,
      reminder_days: reminder.reminder_days,
      last_paid_date: reminder.last_paid_date,
      is_active: reminder.is_active,
      notes: reminder.notes || undefined,
      created_at: new Date().toISOString(),
      monthly_allocation: reminder.amount,
    };
    setItemToEdit(mockRec);
    setIsModalOpen(true);
  };

  // Filtered items
  const filteredReminders = reminders.filter((item) => {
    if (filter === 'due-soon') {
      return item.days_until_due >= 0 && item.days_until_due <= 7;
    }
    if (filter === 'today') {
      return item.days_until_due === 0;
    }
    if (filter === 'overdue') {
      return item.days_until_due < 0;
    }
    if (filter === 'upcoming') {
      return item.days_until_due > 7;
    }
    return true;
  });

  const overdueCount = reminders.filter((r) => r.days_until_due < 0).length;
  const dueSoonCount = reminders.filter((r) => r.days_until_due >= 0 && r.days_until_due <= 7).length;
  const totalUpcomingAmount = reminders
    .filter((r) => r.days_until_due >= 0 && r.days_until_due <= 30)
    .reduce((sum, r) => sum + r.amount, 0);

  const getStatusBadge = (item: ReminderItem) => {
    if (item.days_until_due < 0) {
      return (
        <Badge variant="rose" size="sm">
          Overdue by {absDays(item.days_until_due)}d
        </Badge>
      );
    }
    if (item.days_until_due === 0) {
      return (
        <Badge variant="amber" size="sm">
          Due Today
        </Badge>
      );
    }
    if (item.days_until_due === 1) {
      return (
        <Badge variant="indigo" size="sm">
          Due Tomorrow
        </Badge>
      );
    }
    if (item.days_until_due <= 7) {
      return (
        <Badge variant="indigo" size="sm">
          In {item.days_until_due} days
        </Badge>
      );
    }
    return (
      <Badge variant="slate" size="sm">
        In {item.days_until_due} days
      </Badge>
    );
  };

  const absDays = (days: number) => Math.abs(days);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Smart Reminder Center
              </h1>
              <p className="text-xs text-slate-500">
                Proactive renewal countdowns, reminder schedules, and automated cycle renewal
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReminders}
            title="Refresh Reminders"
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button
            variant="primary"
            onClick={() => {
              setItemToEdit(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Recurring Payment
          </Button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Due Next 7 Days
            </span>
            <p className="text-lg font-black text-slate-900 leading-tight mt-0.5">
              {dueSoonCount} Payment{dueSoonCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Next 30 Days Due Total
            </span>
            <p className="text-lg font-black text-slate-900 leading-tight mt-0.5">
              ₹{totalUpcomingAmount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            overdueCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Overdue Payments
            </span>
            <p className={`text-lg font-black leading-tight mt-0.5 ${
              overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {overdueCount} Payment{overdueCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {[
          { id: 'all', label: `All Reminders (${reminders.length})` },
          { id: 'due-soon', label: `Due Soon (7 Days) (${dueSoonCount})` },
          { id: 'today', label: 'Due Today' },
          { id: 'upcoming', label: 'Upcoming (> 7 Days)' },
          { id: 'overdue', label: `Overdue (${overdueCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reminders List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Reminders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {filter === 'all'
              ? 'Add your subscriptions, rent, gym membership, or recharge bills to start receiving reminders.'
              : 'No reminder items match your selected filter.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setItemToEdit(null);
              setIsModalOpen(true);
            }}
          >
            + Add Recurring Payment
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReminders.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-3xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                item.days_until_due < 0
                  ? 'border-rose-200 hover:border-rose-300 bg-rose-50/20'
                  : item.days_until_due === 0
                  ? 'border-amber-200 hover:border-amber-300 bg-amber-50/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-xs"
                      style={{ backgroundColor: item.category_color || '#6366F1' }}
                    >
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.category_name} • {item.frequency}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(item)}
                </div>

                {/* Amount & Due Date Info */}
                <div className="my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Amount Due
                    </span>
                    <p className="text-base font-extrabold text-slate-900">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3" /> Due Date
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {item.next_payment_date}
                    </p>
                  </div>
                </div>

                {/* Scheduled Reminders Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Scheduled Reminders
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.scheduled_reminders && item.scheduled_reminders.length > 0 ? (
                      item.scheduled_reminders.map((lbl, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs"
                        >
                          🔔 {lbl}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Default reminders enabled
                      </span>
                    )}
                  </div>
                </div>

                {item.last_paid_date && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-3 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Last marked paid on: {item.last_paid_date}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(item)}
                  className="text-xs text-slate-600 hover:text-slate-900"
                >
                  Configure
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleMarkRenewed(item)}
                  isLoading={renewingId === item.recurring_expense_id}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                >
                  Mark Paid / Renewed
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Recurring & Reminders Modal */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchReminders}
        itemToEdit={itemToEdit}
        categories={categories}
      />
    </div>
  );
};
