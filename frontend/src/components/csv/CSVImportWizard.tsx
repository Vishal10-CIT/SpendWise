import React, { useState, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { csvApi, categoriesApi } from '../../services/api';
import {
  Category,
  CSVPreviewResponse,
  ColumnMapping,
  CSVImportValidationReport,
  CSVImportResult,
} from '../../types';
import { useToast } from '../common/Toast';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface CSVImportWizardProps {
  onSuccess: () => void;
}

export const CSVImportWizard: React.FC<CSVImportWizardProps> = ({ onSuccess }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVPreviewResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState<number>(1);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<string>('UPI');
  const [defaultExpenseType] = useState<string>('Variable');

  // Column Mappings
  const [mapping, setMapping] = useState<ColumnMapping>({
    amount_column: '',
    date_column: '',
    description_column: '',
    category_column: '',
    payment_method_column: '',
  });

  const [validationReport, setValidationReport] = useState<CSVImportValidationReport | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    categoriesApi.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setDefaultCategoryId(cats[0].id);
    }).catch(console.error);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a valid .csv file format.');
      return;
    }

    setFile(selectedFile);
    setIsLoading(true);
    setError('');
    try {
      const previewData = await csvApi.uploadCSVPreview(selectedFile);
      setPreview(previewData);

      setMapping({
        amount_column: previewData.suggested_mapping.amount_column || previewData.headers[0] || '',
        date_column: previewData.suggested_mapping.date_column || previewData.headers[1] || '',
        description_column: previewData.suggested_mapping.description_column || '',
        category_column: previewData.suggested_mapping.category_column || '',
        payment_method_column: previewData.suggested_mapping.payment_method_column || '',
      });

      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to parse CSV file preview.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateMapping = async () => {
    if (!mapping.amount_column || !mapping.date_column) {
      setError('Amount and Date column mappings are strictly required.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const rawData = preview?.sample_rows.map((r) => r.data) || [];
      const report = await csvApi.validateMapping({
        mapping,
        default_category_id: defaultCategoryId,
        default_payment_method: defaultPaymentMethod,
        default_expense_type: defaultExpenseType,
        raw_data: rawData,
      });

      setValidationReport(report);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Validation failed. Please verify column selections.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;

    setIsLoading(true);
    setError('');
    try {
      const rawData = preview.sample_rows.map((r) => r.data);
      const res = await csvApi.confirmImport({
        mapping,
        default_category_id: defaultCategoryId,
        default_payment_method: defaultPaymentMethod,
        default_expense_type: defaultExpenseType,
        raw_data: rawData,
      });

      setImportResult(res);
      showToast(res.message, 'success');
      setStep(4);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Import failed while saving transactions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setPreview(null);
    setValidationReport(null);
    setImportResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Step Progress Indicators */}
      <div className="flex items-center justify-between max-w-xl mx-auto mb-8">
        {[
          { num: 1, label: 'Upload CSV' },
          { num: 2, label: 'Map Columns' },
          { num: 3, label: 'Validate' },
          { num: 4, label: 'Finished' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                step === s.num
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-700">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <Card className="p-8 sm:p-12 text-center max-w-2xl mx-auto border-dashed border-2 border-slate-300">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Upload Bank or UPI Statement CSV</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Import transactions from Google Pay, Paytm, PhonePe, or any bank CSV export. You'll preview and match the columns on the next step.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            isLoading={isLoading}
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
          >
            Select .CSV File
          </Button>

          {error && <p className="mt-4 text-xs text-rose-600 font-medium">{error}</p>}
        </Card>
      )}

      {/* STEP 2 */}
      {step === 2 && preview && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{file?.name}</h4>
                <p className="text-xs text-slate-500">{preview.total_rows} rows detected</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
            >
              Choose different file
            </button>
          </div>

          <Card className="p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Raw Statement Preview (First {preview.sample_rows.length} rows)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {preview.headers.map((h, i) => (
                      <th key={i} className="py-2.5 px-3 font-bold text-slate-700 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.sample_rows.map((row) => (
                    <tr key={row.row_index} className="hover:bg-slate-50">
                      {preview.headers.map((h, i) => (
                        <td key={i} className="py-2 px-3 text-slate-600 max-w-xs truncate">
                          {row.data[h] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h4 className="text-sm font-bold text-slate-900">Map Columns to SpendWise Fields</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Amount Column *"
                value={mapping.amount_column}
                onChange={(e) => setMapping({ ...mapping, amount_column: e.target.value })}
                required
              >
                <option value="">-- Select Column --</option>
                {preview.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>

              <Select
                label="Date Column *"
                value={mapping.date_column}
                onChange={(e) => setMapping({ ...mapping, date_column: e.target.value })}
                required
              >
                <option value="">-- Select Column --</option>
                {preview.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>

              <Select
                label="Description / Narration"
                value={mapping.description_column || ''}
                onChange={(e) => setMapping({ ...mapping, description_column: e.target.value || undefined })}
              >
                <option value="">-- Optional / None --</option>
                {preview.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>

              <Select
                label="Category Column"
                value={mapping.category_column || ''}
                onChange={(e) => setMapping({ ...mapping, category_column: e.target.value || undefined })}
              >
                <option value="">-- Auto Match / Use Default --</option>
                {preview.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>

              <Select
                label="Fallback Default Category"
                value={defaultCategoryId}
                onChange={(e) => setDefaultCategoryId(parseInt(e.target.value))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.group})
                  </option>
                ))}
              </Select>

              <Select
                label="Fallback Payment Method"
                value={defaultPaymentMethod}
                onChange={(e) => setDefaultPaymentMethod(e.target.value)}
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="NetBanking">NetBanking</option>
              </Select>
            </div>

            {error && <p className="mt-4 text-xs text-rose-600 font-medium">{error}</p>}

            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleValidateMapping}
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Validate Mappings
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && validationReport && (
        <Card className="p-6 max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Validation Passed</h3>
              <p className="text-xs text-slate-500">Ready to save parsed transactions</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Valid Rows</span>
              <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                {validationReport.valid_rows_count}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Invalid Rows</span>
              <p className="text-base font-extrabold text-rose-600 mt-0.5">
                {validationReport.invalid_rows_count}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Sum</span>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                ₹{validationReport.total_amount_sum.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {validationReport.errors.length > 0 && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Notice on skipped rows:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                {validationReport.errors.map((err, i) => (
                  <li key={i}>
                    Row #{err.row_index}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Adjust Mapping
            </Button>
            <Button
              variant="emerald"
              onClick={handleConfirmImport}
              isLoading={isLoading}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Save {validationReport.valid_rows_count} Expenses
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4 */}
      {step === 4 && importResult && (
        <Card className="p-8 sm:p-12 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Import Complete! 🎉</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
            {importResult.message}
          </p>

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleReset} leftIcon={<RotateCcw className="w-4 h-4" />}>
              Import Another CSV
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
