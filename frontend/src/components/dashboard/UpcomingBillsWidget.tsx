import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { UpcomingPayment } from '../../types';
import { Link } from 'react-router-dom';
import { Repeat, ArrowRight, CalendarClock } from 'lucide-react';

interface UpcomingBillsWidgetProps {
  payments: UpcomingPayment[];
  isLoading?: boolean;
}

export const UpcomingBillsWidget: React.FC<UpcomingBillsWidgetProps> = ({
  payments,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  const getStatusBadge = (status: string, days: number) => {
    if (status === 'Overdue') return <Badge variant="rose" size="sm">Overdue</Badge>;
    if (status === 'Due Soon') {
      return (
        <Badge variant="amber" size="sm">
          {days === 0 ? 'Due Today' : `Due in ${days}d`}
        </Badge>
      );
    }
    return <Badge variant="slate" size="sm">In {days} days</Badge>;
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Upcoming Payments</h3>
            <p className="text-[11px] text-slate-500">Recurring bills due in next 30 days</p>
          </div>
        </div>
        <Link
          to="/recurring"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-slate-500">No upcoming recurring bills in the next 30 days.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {payments.slice(0, 4).map((pay) => (
            <div
              key={pay.id}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-100/70"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: pay.category_color }}
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{pay.name}</h4>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <CalendarClock className="w-3 h-3 text-slate-400" />
                    <span>{pay.next_payment_date} ({pay.frequency})</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900">
                  ₹{pay.amount.toLocaleString('en-IN')}
                </span>
                {getStatusBadge(pay.status, pay.days_until_due)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
