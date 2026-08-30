import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { watchlistApi } from '../../services/api';
import { WatchlistItem } from '../../types';
import { useToast } from '../common/Toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Trash2,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface WatchlistDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WatchlistItem | null;
  onSuccess: () => void;
}

export const WatchlistDetailModal: React.FC<WatchlistDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  if (!item) return null;

  const handleCheckPrice = async () => {
    setIsChecking(true);
    try {
      const res = await watchlistApi.checkPrice(item.id);
      showToast(res.message, res.tracking_status === 'Target Reached' ? 'success' : 'info');
      onSuccess();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to check product price.', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggleTracking = async () => {
    setIsActionLoading(true);
    try {
      if (item.is_tracking_active) {
        await watchlistApi.stopTracking(item.id);
        showToast('Tracking paused for this product.', 'info');
      } else {
        await watchlistApi.updateWatchlistItem(item.id, { is_tracking_active: true });
        showToast('Tracking resumed for this product.', 'success');
      }
      onSuccess();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update tracking state.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMarkPurchased = async () => {
    setIsActionLoading(true);
    try {
      await watchlistApi.markPurchased(item.id);
      showToast(`Marked '${item.product_name}' as purchased! 🎉`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to mark purchased.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove '${item.product_name}' from Purchase Watchlist?`)) return;
    setIsActionLoading(true);
    try {
      await watchlistApi.deleteWatchlistItem(item.id);
      showToast('Product removed from watchlist.', 'info');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete product.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Format price history for Recharts
  const chartData = (item.price_history || [])
    .slice()
    .reverse()
    .map((h) => ({
      date: new Date(h.checked_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      }),
      price: h.price,
      target: item.target_price,
    }));

  const getStatusBadge = () => {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.product_name}
      subtitle={`Source: ${item.store_source || 'Online Store'}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Status and External Link Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {item.is_tracking_active ? (
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Tracking
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-semibold">Tracking Paused</span>
            )}
          </div>

          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <span>Open Store URL</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Pricing Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Current Price
            </span>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">
              {item.current_price !== null && item.current_price !== undefined
                ? `₹${item.current_price.toLocaleString('en-IN')}`
                : 'Unavailable'}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Target Price
            </span>
            <p className="text-base font-extrabold text-brand-600 mt-0.5">
              ₹{item.target_price.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Price Difference
            </span>
            <p
              className={`text-base font-extrabold mt-0.5 ${
                item.price_difference !== null && item.price_difference !== undefined && item.price_difference <= 0
                  ? 'text-emerald-600'
                  : 'text-slate-700'
              }`}
            >
              {item.price_difference !== null && item.price_difference !== undefined
                ? item.price_difference <= 0
                  ? `₹${Math.abs(item.price_difference).toLocaleString('en-IN')} below`
                  : `+₹${item.price_difference.toLocaleString('en-IN')}`
                : '—'}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Lowest Tracked
            </span>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">
              {item.lowest_price !== null && item.lowest_price !== undefined
                ? `₹${item.lowest_price.toLocaleString('en-IN')}`
                : '—'}
            </p>
          </div>
        </div>

        {/* 30-Day Historical Price Chart */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Price Observation History
              </h4>
              <p className="text-[11px] text-slate-400">
                Tracking historical observations recorded by SpendWise
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckPrice}
              isLoading={isChecking}
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-brand-600" />}
              className="text-xs"
            >
              Check Price Now
            </Button>
          </div>

          {chartData.length > 0 ? (
            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Price']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '11px',
                    }}
                  />
                  <ReferenceLine
                    y={item.target_price}
                    stroke="#10B981"
                    strokeDasharray="4 4"
                    label={{
                      value: `Target: ₹${item.target_price}`,
                      position: 'top',
                      fill: '#10B981',
                      fontSize: 10,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#6366F1' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-center bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium">
                No historical observations recorded yet.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click "Check Price Now" to record the first price observation.
              </p>
            </div>
          )}
        </div>

        {/* Financial Decision Support: "Can I Afford This?" Integration */}
        {item.affordability && (
          <div
            className={`p-4 rounded-2xl border ${
              item.affordability.status === 'Affordable'
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                : item.affordability.status === 'Caution'
                ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                : 'bg-rose-50/50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold uppercase tracking-wider">
                SpendWise Affordability Evaluation
              </span>
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
            </div>
            <p className="text-xs leading-relaxed font-medium">
              {item.affordability.explanation}
            </p>
          </div>
        )}

        {/* Deadline and Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {item.purchase_deadline && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Purchase Deadline</span>
                <span className="font-semibold text-slate-800">
                  {item.purchase_deadline} ({item.days_until_deadline} days remaining)
                </span>
              </div>
            </div>
          )}
          {item.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold">Notes</span>
              <p className="font-medium text-slate-700 truncate">{item.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={isActionLoading}
              title="Remove product"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleTracking}
              disabled={isActionLoading}
              leftIcon={
                item.is_tracking_active ? (
                  <PauseCircle className="w-4 h-4 text-slate-500" />
                ) : (
                  <PlayCircle className="w-4 h-4 text-emerald-600" />
                )
              }
            >
              {item.is_tracking_active ? 'Pause Tracking' : 'Resume Tracking'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            {item.tracking_status !== 'Purchased' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleMarkPurchased}
                disabled={isActionLoading}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Mark as Purchased
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
