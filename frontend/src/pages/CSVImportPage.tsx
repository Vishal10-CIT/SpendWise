import React from 'react';
import { CSVImportWizard } from '../components/csv/CSVImportWizard';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet } from 'lucide-react';

export const CSVImportPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Bank / UPI CSV Statement Import
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Upload any standard bank or UPI CSV statement (Google Pay, Paytm, PhonePe, HDFC, SBI, ICICI) to batch import your expenses without manual data entry.
        </p>
      </div>

      {/* CSV Wizard */}
      <CSVImportWizard onSuccess={() => navigate('/expenses')} />
    </div>
  );
};
