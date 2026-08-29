import React from 'react';
import { Card } from '../common/Card';
import { CategorySpendBreakdown } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

interface CategoryDonutChartProps {
  data: CategorySpendBreakdown[];
  isLoading?: boolean;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="p-5 h-80 flex items-center justify-center animate-pulse">
        <div className="w-36 h-36 rounded-full border-4 border-slate-200" />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-5 h-80 flex flex-col items-center justify-center text-center">
        <div className="p-3 bg-slate-100 rounded-2xl text-slate-400 mb-2">
          <PieIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">No Expenses Recorded</p>
        <p className="text-xs text-slate-400 mt-1">Log expenses to visualize category spending</p>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category_name,
    value: item.total_amount,
    color: item.color,
    percentage: item.percentage,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

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
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Category Spending</h3>
            <p className="text-[11px] text-slate-500">Total: ₹{total.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="h-48 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
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

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 mt-2 max-h-24 overflow-y-auto pt-2 border-t border-slate-100 text-xs">
        {chartData.slice(0, 6).map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate text-slate-600 font-medium">{item.name}</span>
            <span className="ml-auto font-bold text-slate-800">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
