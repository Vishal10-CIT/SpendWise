import React from 'react';
import { StatCard } from '../common/StatCard';
import { Card } from '../common/Card';
import { DashboardSummary } from '../../types';
import { Wallet, CreditCard, PiggyBank, Sparkles, Shield, Compass, Calendar } from 'lucide-react';

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  isLoading?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const formatCurr = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-4">
      {/* 5 Main Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Monthly Income"
          value={formatCurr(summary.monthly_income)}
          subtitle="Allowance + Part-time"
          icon={<Wallet className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          badgeText="Active"
          badgeVariant="emerald"
        />

        <StatCard
          title="Total Spent"
          value={formatCurr(summary.total_spent)}
          subtitle={`Fixed: ${formatCurr(summary.fixed_expenses_total)} | Var: ${formatCurr(summary.variable_expenses_total)}`}
          icon={<CreditCard className="w-5 h-5 text-rose-600" />}
          iconBg="bg-rose-50"
          badgeText="This Month"
          badgeVariant="rose"
        />

        <StatCard
          title="Remaining Balance"
          value={formatCurr(summary.remaining_balance)}
          subtitle="Liquid Cash in Bank/Wallet"
          icon={<Shield className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
          badgeText={summary.remaining_balance >= 0 ? 'Surplus' : 'Deficit'}
          badgeVariant={summary.remaining_balance >= 0 ? 'blue' : 'rose'}
        />

        <StatCard
          title="Total Savings"
          value={formatCurr(summary.total_savings)}
          subtitle="Accumulated in Goals"
          icon={<PiggyBank className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50"
          badgeText="Milestones"
          badgeVariant="purple"
        />

        <StatCard
          title="Flexible Spending"
          value={formatCurr(summary.flexible_spending)}
          subtitle="After bills & savings target"
          icon={<Sparkles className="w-5 h-5 text-brand-600" />}
          iconBg="bg-brand-50"
          badgeText={summary.flexible_spending >= 0 ? 'Available' : 'Exceeded'}
          badgeVariant={summary.flexible_spending >= 0 ? 'indigo' : 'rose'}
        />
      </div>

      {/* Dynamic Safe Spending Limits Bar */}
      <Card className="p-4 bg-gradient-to-r from-brand-900 to-indigo-950 text-white rounded-2xl border-none shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-brand-300">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-brand-200">
                  Dynamic Safe Spending Limits
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/30 text-brand-200 font-semibold">
                  Live Guidance
                </span>
              </div>
              <p className="text-xs text-brand-200/80 mt-0.5">
                Calculated dynamically from remaining flexible spending buffer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-300">Safe Weekly Limit</span>
              <div className="text-lg font-black text-white">
                {formatCurr(summary.safe_limits.safe_weekly_spending)}
                <span className="text-xs font-normal text-brand-300">/week</span>
              </div>
            </div>

            <div className="h-8 w-px bg-white/15" />

            <div>
              <span className="text-[10px] uppercase font-bold text-brand-300">Safe Daily Limit</span>
              <div className="text-lg font-black text-emerald-400">
                {formatCurr(summary.safe_limits.safe_daily_spending)}
                <span className="text-xs font-normal text-brand-300">/day</span>
              </div>
            </div>

            <div className="hidden sm:block text-right text-[11px] text-brand-200/70 border-l border-white/15 pl-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{summary.safe_limits.remaining_days_in_month} days left</span>
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
