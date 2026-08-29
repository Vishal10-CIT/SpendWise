import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Badge } from '../common/Badge';
import { decisionApi, categoriesApi } from '../../services/api';
import { Category, AffordabilityResponse } from '../../types';
import { Compass, ShieldCheck, AlertTriangle, AlertOctagon, Sparkles } from 'lucide-react';

interface AffordabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AffordabilityModal: React.FC<AffordabilityModalProps> = ({ isOpen, onClose }) => {
  const [purchaseName, setPurchaseName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AffordabilityResponse | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      categoriesApi.getCategories().then(setCategories).catch(console.error);
      setResult(null);
      setPurchaseName('');
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!purchaseName.trim()) {
      setError('Please enter a purchase name.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await decisionApi.checkAffordability({
        purchase_name: purchaseName.trim(),
        amount: numAmount,
        category_id: categoryId ? parseInt(categoryId) : undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to evaluate affordability.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Affordable') return <ShieldCheck className="w-8 h-8 text-emerald-600" />;
    if (status === 'Caution') return <AlertTriangle className="w-8 h-8 text-amber-600" />;
    return <AlertOctagon className="w-8 h-8 text-rose-600" />;
  };

  const getStatusBg = (status: string) => {
    if (status === 'Affordable') return 'bg-emerald-50 border-emerald-200';
    if (status === 'Caution') return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Can I Afford This?"
      subtitle="Deterministic decision-support evaluated against your live budget & savings target"
      maxWidth="lg"
    >
      <form onSubmit={handleEvaluate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="What do you want to buy?"
            placeholder="e.g. Headphones, Shoes, Concert"
            value={purchaseName}
            onChange={(e) => setPurchaseName(e.target.value)}
            required
          />

          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            min="1"
            placeholder="e.g. 2000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <Select
          label="Category (Optional)"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">-- General Expense --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.group})
            </option>
          ))}
        </Select>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Compass className="w-4 h-4" />}
          >
            Check Affordability
          </Button>
        </div>
      </form>

      {/* Decision Results Display */}
      {result && (
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Outcome Hero Banner */}
          <div className={`p-4 rounded-2xl border flex items-center gap-4 ${getStatusBg(result.status)}`}>
            <div className="p-2.5 rounded-xl bg-white shadow-xs">
              {getStatusIcon(result.status)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900">{result.status_badge}</h4>
                <Badge
                  variant={
                    result.status === 'Affordable' ? 'emerald' : result.status === 'Caution' ? 'amber' : 'rose'
                  }
                  size="sm"
                >
                  ₹{result.purchase_amount.toLocaleString('en-IN')}
                </Badge>
              </div>
              <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
                {result.explanation}
              </p>
            </div>
          </div>

          {/* Impact Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Flex</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                ₹{result.current_flexible_spending.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Flex After</span>
              <p
                className={`text-sm font-bold mt-0.5 ${
                  result.flexible_spending_after_purchase < 0 ? 'text-rose-600' : 'text-slate-800'
                }`}
              >
                ₹{result.flexible_spending_after_purchase.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Safe Weekly</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                ₹{result.safe_weekly_after_purchase.toLocaleString('en-IN')}/wk
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Safe Daily</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                ₹{result.safe_daily_after_purchase.toLocaleString('en-IN')}/day
              </p>
            </div>
          </div>

          {/* Recommendation Note */}
          <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-100 text-xs text-brand-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Student Recommendation: </span>
              {result.recommendation}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
