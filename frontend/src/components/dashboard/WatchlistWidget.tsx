import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { WatchlistItem } from '../../types';
import { Link } from 'react-router-dom';
import { Tag, ArrowRight } from 'lucide-react';

interface WatchlistWidgetProps {
  items: WatchlistItem[];
  isLoading?: boolean;
}

export const WatchlistWidget: React.FC<WatchlistWidgetProps> = ({
  items,
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

  const activeItems = items.filter((i) => i.tracking_status !== 'Purchased');

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Purchase Watchlist</h3>
            <p className="text-[11px] text-slate-500">Tracked products waiting for price drops</p>
          </div>
        </div>
        <Link
          to="/watchlist"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {activeItems.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-slate-500">No products currently in your purchase watchlist.</p>
          <Link
            to="/watchlist"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-block mt-2"
          >
            + Track a product
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeItems.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              to="/watchlist"
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-100/70 block"
            >
              <div className="truncate pr-2">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {item.product_name}
                </h4>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <span>Target: ₹{item.target_price.toLocaleString('en-IN')}</span>
                  <span>•</span>
                  <span className="text-slate-600 font-semibold">{item.store_source}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-black text-slate-900">
                  {item.current_price !== null && item.current_price !== undefined
                    ? `₹${item.current_price.toLocaleString('en-IN')}`
                    : 'Checking...'}
                </span>
                {item.tracking_status === 'Target Reached' ? (
                  <Badge variant="emerald" size="sm">🎯 Target</Badge>
                ) : item.tracking_status === 'Price Dropped' ? (
                  <Badge variant="blue" size="sm">📉 Drop</Badge>
                ) : (
                  <Badge variant="slate" size="sm">Watching</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
};
