import React, { useState, useEffect } from 'react';
import { watchlistApi } from '../services/api';
import { WatchlistItem } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { AddWatchlistModal } from '../components/watchlist/AddWatchlistModal';
import { WatchlistDetailModal } from '../components/watchlist/WatchlistDetailModal';
import { useToast } from '../components/common/Toast';
import {
  Tag,
  Plus,
  RefreshCw,
  ExternalLink,
  Calendar,
  Sparkles,
  TrendingDown,
  Eye,
} from 'lucide-react';

export const PurchaseWatchlistPage: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');
  const [checkingId, setCheckingId] = useState<number | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const fetchWatchlist = async () => {
    setIsLoading(true);
    try {
      const data = await watchlistApi.getWatchlist();
      setItems(data);
      if (selectedItem) {
        const updated = data.find((i) => i.id === selectedItem.id);
        if (updated) setSelectedItem(updated);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleCheckPrice = async (e: React.MouseEvent, item: WatchlistItem) => {
    e.stopPropagation();
    setCheckingId(item.id);
    try {
      const res = await watchlistApi.checkPrice(item.id);
      showToast(res.message, res.tracking_status === 'Target Reached' ? 'success' : 'info');
      fetchWatchlist();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to check price.', 'error');
    } finally {
      setCheckingId(null);
    }
  };

  const handleOpenDetail = (item: WatchlistItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (filter === 'target-reached') return item.tracking_status === 'Target Reached';
    if (filter === 'price-dropped') return item.tracking_status === 'Price Dropped';
    if (filter === 'deadline') return item.tracking_status === 'Deadline Approaching';
    if (filter === 'purchased') return item.tracking_status === 'Purchased';
    return item.tracking_status !== 'Purchased'; // Default 'all' shows active items
  });

  const targetReachedCount = items.filter((i) => i.tracking_status === 'Target Reached').length;
  const priceDroppedCount = items.filter((i) => i.tracking_status === 'Price Dropped').length;
  const activeCount = items.filter((i) => i.is_tracking_active && i.tracking_status !== 'Purchased').length;

  const getStatusBadge = (item: WatchlistItem) => {
    switch (item.tracking_status) {
      case 'Target Reached':
        return <Badge variant="emerald" size="sm">🎯 Target Reached</Badge>;
      case 'Price Dropped':
        return <Badge variant="blue" size="sm">📉 Price Dropped</Badge>;
      case 'Deadline Approaching':
        return <Badge variant="amber" size="sm">⚠️ Deadline Approaching</Badge>;
      case 'Tracking Unavailable':
        return <Badge variant="slate" size="sm">Tracking Unavailable</Badge>;
      case 'Purchased':
        return <Badge variant="emerald" size="sm">Purchased</Badge>;
      case 'Stopped':
        return <Badge variant="slate" size="sm">Stopped</Badge>;
      default:
        return <Badge variant="indigo" size="sm">🟡 Watching</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Product Purchase Watchlist & Price Alerts
              </h1>
              <p className="text-xs text-slate-500">
                Track headphones, laptops, smartphones, and sneakers until they reach your target price
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWatchlist}
            title="Refresh Watchlist"
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button
            variant="primary"
            onClick={() => setIsAddOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Track New Product
          </Button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Actively Tracked
            </span>
            <p className="text-lg font-black text-slate-900 leading-tight mt-0.5">
              {activeCount} Product{activeCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Target Price Reached
            </span>
            <p className="text-lg font-black text-emerald-600 leading-tight mt-0.5">
              {targetReachedCount} Product{targetReachedCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Recent Price Drops
            </span>
            <p className="text-lg font-black text-blue-600 leading-tight mt-0.5">
              {priceDroppedCount} Product{priceDroppedCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        {[
          { id: 'all', label: `Active Watchlist (${items.filter((i) => i.tracking_status !== 'Purchased').length})` },
          { id: 'target-reached', label: `🎯 Target Reached (${targetReachedCount})` },
          { id: 'price-dropped', label: `📉 Price Drops (${priceDroppedCount})` },
          { id: 'deadline', label: '⚠️ Approaching Deadline' },
          { id: 'purchased', label: `Purchased Archive (${items.filter((i) => i.tracking_status === 'Purchased').length})` },
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

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Products Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Add a product URL from Amazon, Flipkart, or your favorite store to start receiving target price alerts.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            + Track New Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const hasPrice = item.current_price !== null && item.current_price !== undefined;
            const diff = item.price_difference;
            const isBelow = diff !== null && diff !== undefined && diff <= 0;

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className={`bg-white rounded-3xl border p-5 shadow-xs transition-all hover:shadow-md cursor-pointer flex flex-col justify-between ${
                  item.tracking_status === 'Target Reached'
                    ? 'border-emerald-300 bg-emerald-50/15'
                    : item.tracking_status === 'Price Dropped'
                    ? 'border-blue-300 bg-blue-50/15'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Bar: Store source & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {item.store_source || 'Online Store'}
                    </span>
                    {getStatusBadge(item)}
                  </div>

                  {/* Product Title */}
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mt-3 leading-snug">
                    {item.product_name}
                  </h3>

                  {/* Pricing Comparison Box */}
                  <div className="my-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Current Price
                      </span>
                      <p className="text-base font-black text-slate-900">
                        {hasPrice ? `₹${item.current_price?.toLocaleString('en-IN')}` : 'Checking...'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Target Price
                      </span>
                      <p className="text-sm font-extrabold text-brand-600">
                        ₹{item.target_price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Difference & Affordability row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {diff !== null && diff !== undefined && (
                      <span
                        className={`font-semibold inline-flex items-center gap-1 ${
                          isBelow ? 'text-emerald-700' : 'text-slate-600'
                        }`}
                      >
                        {isBelow ? (
                          <>
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                            <span>₹{Math.abs(diff).toLocaleString('en-IN')} below target</span>
                          </>
                        ) : (
                          <span>₹{diff.toLocaleString('en-IN')} above target</span>
                        )}
                      </span>
                    )}

                    {item.affordability && (
                      <Badge
                        variant={
                          item.affordability.status === 'Affordable'
                            ? 'emerald'
                            : item.affordability.status === 'Caution'
                            ? 'amber'
                            : 'rose'
                        }
                        size="sm"
                      >
                        {item.affordability.status}
                      </Badge>
                    )}
                  </div>

                  {/* Deadline info if present */}
                  {item.purchase_deadline && (
                    <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        Target Date: {item.purchase_deadline}
                        {item.days_until_deadline !== null && item.days_until_deadline !== undefined && (
                          <strong className="text-slate-700 ml-1">
                            ({item.days_until_deadline >= 0 ? `${item.days_until_deadline}d left` : 'Passed'})
                          </strong>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Quick Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> View History
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleCheckPrice(e, item)}
                      disabled={checkingId === item.id}
                      title="Check price now"
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${checkingId === item.id ? 'animate-spin' : ''}`} />
                    </button>

                    <a
                      href={item.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Open store URL"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
      <AddWatchlistModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchWatchlist}
      />

      {/* Product Detail Modal */}
      <WatchlistDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onSuccess={fetchWatchlist}
      />
    </div>
  );
};
