import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Plus, Compass, LogOut, GraduationCap } from 'lucide-react';

interface NavbarProps {
  onOpenQuickAdd: () => void;
  onOpenAffordability: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenQuickAdd,
  onOpenAffordability,
}) => {
  const { user, logout } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Student Greeting & Context */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name.split(' ')[0] || 'Student'} 👋
          </h2>
        </div>
        {user?.college_name ? (
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <GraduationCap className="w-3.5 h-3.5 text-brand-500" />
            <span>{user.college_name}</span>
          </p>
        ) : (
          <p className="text-xs text-slate-500 mt-0.5">Smart Student Finance</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* "Can I Afford This?" Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAffordability}
          leftIcon={<Compass className="w-4 h-4 text-brand-600" />}
          className="hidden sm:inline-flex border-brand-200 text-brand-700 bg-brand-50/50 hover:bg-brand-50 hover:border-brand-300"
        >
          Can I Afford This?
        </Button>

        {/* Quick Add Expense */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenQuickAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          <span className="hidden xs:inline">+</span> Add Expense
        </Button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
