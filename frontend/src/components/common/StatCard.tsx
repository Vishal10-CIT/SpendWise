import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  badgeText?: string;
  badgeVariant?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'slate' | 'indigo';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-brand-50 text-brand-600',
  badgeText,
  badgeVariant = 'emerald',
  onClick,
}) => {
  return (
    <Card
      hover={!!onClick}
      className={`p-5 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
          <div className="mt-1.5 text-2xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        </div>
        <div className={`p-3 rounded-2xl ${iconBg} flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {subtitle && <span className="text-xs text-slate-500 truncate max-w-[220px]">{subtitle}</span>}
        {badgeText && (
          <Badge variant={badgeVariant} size="sm">
            {badgeText}
          </Badge>
        )}
      </div>
    </Card>
  );
};
