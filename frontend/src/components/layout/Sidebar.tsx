import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Repeat,
  Target,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Compass,
  Bell,
  Tag,
} from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const mainNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Income & Allowance', href: '/income', icon: Wallet },
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'Recurring & Bills', href: '/recurring', icon: Repeat },
    { name: 'Reminders', href: '/reminders', icon: Bell },
    { name: 'Savings Goals', href: '/savings', icon: Target },
  ];

  const toolsNavItems = [
    { name: 'Purchase Watchlist', href: '/watchlist', icon: Tag, badge: 'New' },
    { name: 'Decision Tools', href: '/decision-tools', icon: Compass },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'CSV Import', href: '/csv-import', icon: FileSpreadsheet },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 z-40 hidden lg:flex select-none">
      {/* Brand Logo & Tagline */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-black text-lg text-slate-900 tracking-tight leading-none">
            Spend<span className="text-brand-600">Wise</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Student Finance App</p>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Main Management
          </p>
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Intelligence & Tools
          </p>
          <nav className="space-y-1">
            {toolsNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-slate-400" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-black bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer Student Badge */}
      <div className="p-4 border-t border-slate-100">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-[11px] font-medium text-slate-600">
            SpendWise Engine <span className="text-slate-400">v2.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
