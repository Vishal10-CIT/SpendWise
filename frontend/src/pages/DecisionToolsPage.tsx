import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { AffordabilityModal } from '../components/decision/AffordabilityModal';
import { BudgetSimulatorModal } from '../components/decision/BudgetSimulatorModal';
import { Compass, Sliders, ShieldCheck, HeartPulse, Sparkles, ArrowRight } from 'lucide-react';

export const DecisionToolsPage: React.FC = () => {
  const [isAffordabilityOpen, setIsAffordabilityOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
            <Compass className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Financial Decision-Support Hub
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          SpendWise is more than an expense tracker — use these interactive tools to test purchase affordability and simulate hypothetical scenarios before spending.
        </p>
      </div>

      {/* 2 Primary Decision Tools Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool 1: Can I Afford This? */}
        <Card className="p-6 flex flex-col justify-between border-brand-200/80 bg-gradient-to-br from-white to-brand-50/30 shadow-xs">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mb-4 shadow-md shadow-brand-500/20">
              <Compass className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">"Can I Afford This?" Tool</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Wondering if you can buy headphones, festival tickets, or new clothes? Enter the amount to evaluate against your remaining flexible spending, planned recurring bills, and savings targets.
            </p>

            <div className="mt-4 p-3 bg-white rounded-xl border border-brand-100 text-[11px] text-slate-600 space-y-1.5 font-medium">
              <div className="flex items-center gap-2 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>🟢 <b>Affordable:</b> Safe to buy without slowing savings</span>
              </div>
              <div className="flex items-center gap-2 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>🟡 <b>Caution:</b> Leaves a slim buffer, strict pacing needed</span>
              </div>
              <div className="flex items-center gap-2 text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>🔴 <b>Not Recommended:</b> Causes deficit or eats into goals</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setIsAffordabilityOpen(true)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Test Purchase Affordability
            </Button>
          </div>
        </Card>

        {/* Tool 2: What-If Budget Simulator */}
        <Card className="p-6 flex flex-col justify-between border-purple-200/80 bg-gradient-to-br from-white to-purple-50/30 shadow-xs">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-4 shadow-md shadow-purple-500/20">
              <Sliders className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">What-If Budget Simulator</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Test hypothetical spending changes or new subscriptions without modifying your actual expenses. Compare Current Plan vs Simulated Plan side-by-side.
            </p>

            <div className="mt-4 p-3 bg-white rounded-xl border border-purple-100 text-[11px] text-slate-600 space-y-1.5 font-medium">
              <div className="flex items-center gap-2 text-purple-900">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Side-by-side metric comparison</span>
              </div>
              <div className="flex items-center gap-2 text-purple-900">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Zero database mutations (100% sandbox)</span>
              </div>
              <div className="flex items-center gap-2 text-purple-900">
                <HeartPulse className="w-3.5 h-3.5 text-purple-600" />
                <span>Evaluates safe weekly limit & goal delay impact</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Button
              variant="primary"
              className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
              onClick={() => setIsSimulatorOpen(true)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Launch What-If Sandbox
            </Button>
          </div>
        </Card>
      </div>

      {/* Decision Tool Modals */}
      <AffordabilityModal
        isOpen={isAffordabilityOpen}
        onClose={() => setIsAffordabilityOpen(false)}
      />

      <BudgetSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
};
