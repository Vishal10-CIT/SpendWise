import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart';
import { MonthlyTrendChart } from '../components/dashboard/MonthlyTrendChart';
import { FixedVsVariableChart } from '../components/dashboard/FixedVsVariableChart';
import { BudgetProgressWidget } from '../components/dashboard/BudgetProgressWidget';
import { UpcomingBillsWidget } from '../components/dashboard/UpcomingBillsWidget';
import { AlertsBanner } from '../components/dashboard/AlertsBanner';
import { SpendingPaceCard } from '../components/decision/SpendingPaceCard';
import { BudgetHealthCard } from '../components/decision/BudgetHealthCard';
import { AffordabilityModal } from '../components/decision/AffordabilityModal';
import { BudgetSimulatorModal } from '../components/decision/BudgetSimulatorModal';
import { QuickExpenseModal } from '../components/dashboard/QuickExpenseModal';
import { WatchlistWidget } from '../components/dashboard/WatchlistWidget';
import { Button } from '../components/common/Button';
import { analyticsApi, budgetsApi, recurringApi, watchlistApi } from '../services/api';
import {
  DashboardSummary,
  SpendingPaceResponse,
  BudgetHealthResponse,
  CategorySpendBreakdown,
  MonthlyTrendItem,
  FixedVsVariableBreakdown,
  CategoryBudgetProgress,
  UpcomingPayment,
  WatchlistItem,
  AlertItem,
} from '../types';
import { Plus, Compass, Sliders, RefreshCw } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const context = useOutletContext<{ onRefresh?: () => void }>();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pace, setPace] = useState<SpendingPaceResponse | null>(null);
  const [health, setHealth] = useState<BudgetHealthResponse | null>(null);
  const [categories, setCategories] = useState<CategorySpendBreakdown[]>([]);
  const [trends, setTrends] = useState<MonthlyTrendItem[]>([]);
  const [fixedVar, setFixedVar] = useState<FixedVsVariableBreakdown | null>(null);
  const [budgetProgress, setBudgetProgress] = useState<CategoryBudgetProgress[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingPayment[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [isAffordabilityOpen, setIsAffordabilityOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [
        sumData,
        paceData,
        healthData,
        catData,
        trendData,
        fvData,
        bProgData,
        upData,
        wlData,
        alData,
      ] = await Promise.all([
        analyticsApi.getDashboardSummary(),
        analyticsApi.getSpendingPace(),
        analyticsApi.getBudgetHealth(),
        analyticsApi.getCategorySpending(),
        analyticsApi.getMonthlyTrends(6),
        analyticsApi.getFixedVsVariable(),
        budgetsApi.getBudgetProgress(),
        recurringApi.getUpcomingPayments(30),
        watchlistApi.getWatchlist(),
        analyticsApi.getAlerts(),
      ]);

      setSummary(sumData);
      setPace(paceData);
      setHealth(healthData);
      setCategories(catData);
      setTrends(trendData);
      setFixedVar(fvData);
      setBudgetProgress(bProgData.category_progress);
      setUpcoming(upData);
      setWatchlistItems(wlData);
      setAlerts(alData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
    if (context?.onRefresh) context.onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Rule-Based Spending Alerts Banner */}
      <AlertsBanner alerts={alerts} isLoading={isLoading} />

      {/* Quick Actions Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Student Financial Overview</h2>
          <p className="text-xs text-slate-500">Live calculations updated automatically</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsQuickAddOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            + Add Expense
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAffordabilityOpen(true)}
            leftIcon={<Compass className="w-4 h-4 text-brand-600" />}
            className="border-brand-200 text-brand-700 bg-brand-50/50 hover:bg-brand-50"
          >
            Can I Afford This?
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSimulatorOpen(true)}
            leftIcon={<Sliders className="w-4 h-4 text-purple-600" />}
            className="border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-50"
          >
            Budget Simulator
          </Button>

          <button
            onClick={handleRefresh}
            title="Refresh metrics"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Financial KPIs & Safe Limits Bar */}
      <SummaryCards summary={summary} isLoading={isLoading} />

      {/* Advanced Decision-Support Intelligence Row: Budget Health + Spending Pace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetHealthCard health={health} isLoading={isLoading} />
        <SpendingPaceCard pace={pace} isLoading={isLoading} />
      </div>

      {/* Visual Analytics Charts Row: Category Donut + Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CategoryDonutChart data={categories} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2">
          <MonthlyTrendChart data={trends} isLoading={isLoading} />
        </div>
      </div>

      {/* Operational Widgets Row: Category Budgets + Upcoming Reminders + Price Watch + Fixed vs Variable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BudgetProgressWidget progressItems={budgetProgress} isLoading={isLoading} />
        <UpcomingBillsWidget payments={upcoming} isLoading={isLoading} />
        <WatchlistWidget items={watchlistItems} isLoading={isLoading} />
        <FixedVsVariableChart data={fixedVar} isLoading={isLoading} />
      </div>

      {/* Interactive Feature Modals */}
      <QuickExpenseModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={handleRefresh}
      />

      <AffordabilityModal
        isOpen={isAffordabilityOpen}
        onClose={() => setIsAffordabilityOpen(false)}
      />

      <BudgetSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
};
