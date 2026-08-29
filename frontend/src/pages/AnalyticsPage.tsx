import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart';
import { MonthlyTrendChart } from '../components/dashboard/MonthlyTrendChart';
import { FixedVsVariableChart } from '../components/dashboard/FixedVsVariableChart';
import { SpendingPaceCard } from '../components/decision/SpendingPaceCard';
import { BudgetHealthCard } from '../components/decision/BudgetHealthCard';
import { analyticsApi } from '../services/api';
import {
  CategorySpendBreakdown,
  MonthlyTrendItem,
  FixedVsVariableBreakdown,
  DailySpendItem,
  PaymentMethodBreakdown,
  SpendingPaceResponse,
  BudgetHealthResponse,
} from '../types';
import { Calendar, CreditCard } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [categories, setCategories] = useState<CategorySpendBreakdown[]>([]);
  const [trends, setTrends] = useState<MonthlyTrendItem[]>([]);
  const [fixedVar, setFixedVar] = useState<FixedVsVariableBreakdown | null>(null);
  const [daily, setDaily] = useState<DailySpendItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodBreakdown[]>([]);
  const [pace, setPace] = useState<SpendingPaceResponse | null>(null);
  const [health, setHealth] = useState<BudgetHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [
        catData,
        trendData,
        fvData,
        dailyData,
        pmData,
        paceData,
        healthData,
      ] = await Promise.all([
        analyticsApi.getCategorySpending(),
        analyticsApi.getMonthlyTrends(6),
        analyticsApi.getFixedVsVariable(),
        analyticsApi.getDailySpending(),
        analyticsApi.getPaymentMethods(),
        analyticsApi.getSpendingPace(),
        analyticsApi.getBudgetHealth(),
      ]);

      setCategories(catData);
      setTrends(trendData);
      setFixedVar(fvData);
      setDaily(dailyData);
      setPaymentMethods(pmData);
      setPace(paceData);
      setHealth(healthData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const highestCategory = categories[0];
  const totalDailyTransactions = daily.reduce((sum, d) => sum + d.transaction_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Spending Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deep-dive insights, payment method breakdowns, burn rates, and historical spending patterns
        </p>
      </div>

      {/* Top Insights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-brand-50 to-white border-brand-200/80">
          <span className="text-[10px] uppercase font-bold text-brand-700">
            Top Spending Category
          </span>
          <div className="mt-1 text-lg font-black text-slate-900 truncate">
            {highestCategory ? highestCategory.category_name : 'N/A'}
          </div>
          <p className="text-xs text-brand-700/80 mt-0.5">
            {highestCategory
              ? `₹${highestCategory.total_amount.toLocaleString('en-IN')} (${highestCategory.percentage}% of spending)`
              : 'No expenses yet'}
          </p>
        </Card>

        <Card className="p-5">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Average Daily Burn
          </span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            ₹{pace ? pace.spending_rate.toLocaleString('en-IN') : '0'}/day
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Average spent per elapsed day</p>
        </Card>

        <Card className="p-5">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Monthly Transactions
          </span>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {totalDailyTransactions}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Logged this month</p>
        </Card>
      </div>

      {/* Health Score & Spending Pace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetHealthCard health={health} isLoading={isLoading} />
        <SpendingPaceCard pace={pace} isLoading={isLoading} />
      </div>

      {/* Daily Spending Timeline Bar Chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Spending Timeline</h3>
              <p className="text-[11px] text-slate-500">Day-by-day expenditure this month</p>
            </div>
          </div>
        </div>

        {daily.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No daily expense points recorded this month
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day_label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="amount" name="Spent" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Category Donut + Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CategoryDonutChart data={categories} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2">
          <MonthlyTrendChart data={trends} isLoading={isLoading} />
        </div>
      </div>

      {/* Payment Channels Breakdown + Fixed vs Variable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Channels */}
        <Card className="p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payment Channels</h3>
              <p className="text-[11px] text-slate-500">UPI vs Cash vs Cards</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {paymentMethods.map((pm) => (
              <div
                key={pm.method}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{pm.method}</span>
                  <span className="text-[11px] text-slate-500 ml-2">({pm.count} txns)</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900">
                    ₹{pm.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-500 ml-2 font-medium">
                    {pm.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Fixed vs Variable */}
        <FixedVsVariableChart data={fixedVar} isLoading={isLoading} />
      </div>
    </div>
  );
};
