import React from 'react';
import { AlertItem } from '../../types';
import { Link } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ArrowRight } from 'lucide-react';

interface AlertsBannerProps {
  alerts: AlertItem[];
  isLoading?: boolean;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({ alerts, isLoading }) => {
  if (isLoading || alerts.length === 0) {
    return null;
  }

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          icon: <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />,
        };
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900',
          icon: <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />,
        };
    }
  };

  return (
    <div className="space-y-2 mb-6">
      {alerts.slice(0, 3).map((alert) => {
        const style = getAlertStyles(alert.type);
        return (
          <div
            key={alert.id}
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-xs transition-all ${style.bg}`}
          >
            <div className="flex items-center gap-2.5">
              {style.icon}
              <div>
                <span className="font-bold">{alert.title}: </span>
                <span className="font-medium opacity-90">{alert.message}</span>
              </div>
            </div>

            {alert.action_url && (
              <Link
                to={alert.action_url}
                className="font-bold underline underline-offset-2 flex items-center gap-1 hover:opacity-80 flex-shrink-0 ml-2"
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
};
