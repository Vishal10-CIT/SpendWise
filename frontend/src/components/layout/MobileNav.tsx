import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  Compass,
} from 'lucide-react';
import { clsx } from 'clsx';

export const MobileNav: React.FC = () => {
  const items = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Decision', href: '/decision-tools', icon: Compass },
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'Savings', href: '/savings', icon: Target },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
      {items.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-medium transition-colors',
              isActive
                ? 'text-brand-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            )
          }
        >
          <item.icon className="w-5 h-5 mb-0.5" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};
