import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl font-black text-brand-600 mb-2">404</div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mb-6">
        The financial screen or report you're looking for doesn't exist or has moved.
      </p>
      <Link to="/">
        <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};
