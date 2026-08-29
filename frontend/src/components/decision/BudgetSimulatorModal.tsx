import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Badge } from '../common/Badge';
import { decisionApi } from '../../services/api';
import { BudgetSimulatorResponse, RecurringFrequency } from '../../types';
import { Sliders, Sparkles, Info } from 'lucide-react';

interface BudgetSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetSimulatorModal: React.FC<BudgetSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [scenarioName, setScenarioName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('Monthly');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [simulation, setSimulation] = useState<BudgetSimulatorResponse | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSimulation(null);
      setScenarioName('');
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!scenarioName.trim()) {
      setError('Please enter a scenario description.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive scenario amount.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await decisionApi.runBudgetSimulator({
        scenario_name: scenarioName.trim(),
        amount: numAmount,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? recurringFrequency : undefined,
      });
      setSimulation(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to calculate scenario simulation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="What-If Budget Simulator"
      subtitle="Simulate hypothetical purchases without saving any real financial records"
      maxWidth="xl"
    >
      <form onSubmit={handleSimulate} className="space-y-4">
        {/* Notice Banner */}
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2.5 text-xs text-blue-800">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>This is an experimental sandbox. No transactions will be added to your account.</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Scenario Name"
            placeholder="e.g. Buying New Shoes, Gym Subscription"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            required
          />

          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            min="1"
            placeholder="e.g. 2500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <span>Recurring Commitment (e.g. subscription / rent)</span>
          </label>

          {isRecurring && (
            <div className="flex-1">
              <Select
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value as RecurringFrequency)}
              >
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly (Every 3 months)</option>
                <option value="Semi-Annually">Semi-Annually (Every 6 months)</option>
                <option value="Annually">Annually (Every year)</option>
              </Select>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Sliders className="w-4 h-4" />}
          >
            Run Simulation
          </Button>
        </div>
      </form>

      {/* Side-by-Side Simulation Comparison */}
      {simulation && (
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Simulation Result: {simulation.scenario_name}</span>
            </h4>
            <Badge variant="indigo" size="sm">
              ₹{simulation.amount.toLocaleString('en-IN')}
              {simulation.is_recurring ? ` / ${simulation.recurring_frequency}` : ' one-off'}
            </Badge>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {simulation.explanation}
          </p>

          {/* Comparison Matrix Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Plan */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Current Plan</span>
                <Badge variant="slate" size="sm">Live</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Monthly Income:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{simulation.current_state.monthly_income.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Current Spent:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{simulation.current_state.total_spent.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Planned Recurring:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{simulation.current_state.planned_recurring.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Flexible Spending:</span>
                  <span className="font-bold text-emerald-700">
                    ₹{simulation.current_state.flexible_spending.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Safe Weekly Limit:</span>
                  <span className="font-bold text-slate-800">
                    ₹{simulation.current_state.safe_weekly_spending.toLocaleString('en-IN')}/wk
                  </span>
                </div>
              </div>
            </div>

            {/* After Simulation */}
            <div className="p-4 rounded-2xl border border-brand-200 bg-brand-50/40 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">After Purchase</span>
                <Badge variant="indigo" size="sm">Simulated</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-brand-100/60">
                  <span className="text-slate-500">Monthly Income:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{simulation.simulated_state.monthly_income.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-100/60">
                  <span className="text-slate-500">Projected Spent:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{simulation.simulated_state.total_spent.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-100/60">
                  <span className="text-slate-500">Planned Recurring:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{simulation.simulated_state.planned_recurring.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-100/60">
                  <span className="text-slate-500">Flexible Spending:</span>
                  <span
                    className={`font-bold ${
                      simulation.simulated_state.flexible_spending < 0
                        ? 'text-rose-600'
                        : 'text-brand-700'
                    }`}
                  >
                    ₹{simulation.simulated_state.flexible_spending.toLocaleString('en-IN')}
                    <span className="text-[10px] ml-1 text-slate-500">
                      ({simulation.deltas.flexible_spending_change < 0 ? '-' : '+'}₹
                      {Math.abs(simulation.deltas.flexible_spending_change).toLocaleString('en-IN')})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Safe Weekly Limit:</span>
                  <span className="font-bold text-slate-800">
                    ₹{simulation.simulated_state.safe_weekly_spending.toLocaleString('en-IN')}/wk
                    <span className="text-[10px] ml-1 text-slate-500">
                      ({simulation.deltas.safe_weekly_change < 0 ? '-' : '+'}₹
                      {Math.abs(simulation.deltas.safe_weekly_change).toLocaleString('en-IN')})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations & Goal Impacts */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Scenario Analysis</h5>
            {simulation.recommendations.map((rec, i) => (
              <p key={i} className="text-xs text-slate-700 font-medium">
                {rec}
              </p>
            ))}
            {simulation.goal_impacts.map((impact, i) => (
              <p key={i} className="text-xs text-indigo-700 font-semibold">
                🎯 {impact}
              </p>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
