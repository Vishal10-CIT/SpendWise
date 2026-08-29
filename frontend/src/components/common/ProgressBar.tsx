import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  percentage: number;
  className?: string;
  showLabel?: boolean;
  color?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'auto';
  height?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  className,
  showLabel = false,
  color = 'auto',
  height = 'md',
}) => {
  const clamped = Math.max(0, Math.min(100, percentage));

  const getColorClass = () => {
    if (color !== 'auto') {
      const map = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        indigo: 'bg-indigo-600',
      };
      return map[color];
    }

    if (percentage > 100) return 'bg-rose-600';
    if (percentage >= 90) return 'bg-rose-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={className}>
      <div className={clsx('w-full bg-slate-100 rounded-full overflow-hidden', heights[height])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500 ease-out', getColorClass())}
          style={{ width: `${Math.min(100, clamped)}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
          <span>Usage</span>
          <span className="font-semibold text-slate-700">{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};
