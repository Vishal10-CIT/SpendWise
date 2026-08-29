import React from 'react';
import { Card } from '../common/Card';
import { FixedVsVariableBreakdown } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layers } from 'lucide-react';

interface FixedVsVariableChartProps {
  data: FixedVsVariableBreakdown | null;
  isLoading?: boolean;
}

export const FixedVsVariableChart: React.FC<FixedVsVariableChartProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <Card className="p-5 h-72 flex items-center justify-center animate-pulse">
        <div className="w-32 h-32 rounded-full border-4 border-slate-200" />
      </Card>
    );
  }

  const chartData = [
    { name: 'Fixed (Bills & Commitments)', value: data.fixed_amount, percentage: data.fixed_percentage, color: '#6366F1' },
    { name: 'Variable (Discretionary & Day-to-Day)', value: data.variable_amount, percentage: data.variable_percentage, color: '#F59E0B' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="bg-slate-900 text-white text-xs rounded-xl p-2.5 shadow-xl border border-slate-800">
          <p className="font-bold">{p.name}</p>
          <p className="text-brand-300 mt-0.5">
            ₹{p.value.toLocaleString('en-IN')} ({p.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Fixed vs Variable</h3>
            <p className="text-[11px] text-slate-500">Spending predictability</p>
          </div>
        </div>
      </div>

      <div className="h-44 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={45}
              outerRadius={68}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 mt-1 text-xs">
        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
            <span className="text-slate-700 font-medium">Fixed</span>
          </div>
          <span className="font-bold text-slate-900">
            ₹{data.fixed_amount.toLocaleString('en-IN')} ({data.fixed_percentage}%)
          </span>
        </div>

        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-slate-700 font-medium">Variable</span>
          </div>
          <span className="font-bold text-slate-900">
            ₹{data.variable_amount.toLocaleString('en-IN')} ({data.variable_percentage}%)
          </span>
        </div>
      </div>
    </Card>
  );
};
