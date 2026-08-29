import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { QuickExpenseModal } from '../dashboard/QuickExpenseModal';
import { AffordabilityModal } from '../decision/AffordabilityModal';

export const AppLayout: React.FC = () => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [isAffordabilityOpen, setIsAffordabilityOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleExpenseAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-8">
        <Navbar
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onOpenAffordability={() => setIsAffordabilityOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet key={refreshKey} context={{ onRefresh: handleExpenseAdded }} />
        </main>

        <MobileNav />
      </div>

      {/* Global Quick Add Expense Modal */}
      <QuickExpenseModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={handleExpenseAdded}
      />

      {/* Global "Can I Afford This?" Modal */}
      <AffordabilityModal
        isOpen={isAffordabilityOpen}
        onClose={() => setIsAffordabilityOpen(false)}
      />
    </div>
  );
};
