import axios, { AxiosError } from 'axios';
import {
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  User,
  UserUpdatePayload,
  Category,
  CategoryGrouped,
  CategoryPayload,
  Expense,
  ExpensePayload,
  QuickExpensePayload,
  PaginatedExpenses,
  ExpenseFilterParams,
  Income,
  IncomePayload,
  MonthlyIncomeSummary,
  RecurringExpense,
  RecurringExpensePayload,
  UpcomingPayment,
  Budget,
  BudgetPayload,
  MonthlyBudgetOverview,
  SavingsGoal,
  SavingsGoalPayload,
  SavingsGoalDepositPayload,
  DashboardSummary,
  CategorySpendBreakdown,
  MonthlyTrendItem,
  FixedVsVariableBreakdown,
  DailySpendItem,
  PaymentMethodBreakdown,
  AlertItem,
  AffordabilityRequest,
  AffordabilityResponse,
  SpendingPaceResponse,
  BudgetSimulatorRequest,
  BudgetSimulatorResponse,
  BudgetHealthResponse,
  CSVPreviewResponse,
  CSVImportValidationReport,
  CSVImportRequest,
  CSVImportResult,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spendwise_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not on login/register, clear token
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('spendwise_token');
        localStorage.removeItem('spendwise_user');
      }
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------
// Auth API
// ---------------------------------------------------------
export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', payload);
    return res.data;
  },
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', payload);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
  updateProfile: async (payload: UserUpdatePayload): Promise<User> => {
    const res = await api.put<User>('/auth/profile', payload);
    return res.data;
  },
};

// ---------------------------------------------------------
// Expenses API
// ---------------------------------------------------------
export const expensesApi = {
  getExpenses: async (params?: ExpenseFilterParams): Promise<PaginatedExpenses> => {
    const res = await api.get<PaginatedExpenses>('/expenses', { params });
    return res.data;
  },
  createExpense: async (payload: ExpensePayload): Promise<Expense> => {
    const res = await api.post<Expense>('/expenses', payload);
    return res.data;
  },
  quickCreateExpense: async (payload: QuickExpensePayload): Promise<Expense> => {
    const res = await api.post<Expense>('/expenses/quick', payload);
    return res.data;
  },
  getExpense: async (id: number): Promise<Expense> => {
    const res = await api.get<Expense>(`/expenses/${id}`);
    return res.data;
  },
  updateExpense: async (id: number, payload: Partial<ExpensePayload>): Promise<Expense> => {
    const res = await api.put<Expense>(`/expenses/${id}`, payload);
    return res.data;
  },
  deleteExpense: async (id: number): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};

// ---------------------------------------------------------
// Income API
// ---------------------------------------------------------
export const incomeApi = {
  getIncome: async (month?: number, year?: number): Promise<Income[]> => {
    const res = await api.get<Income[]>('/income', { params: { month, year } });
    return res.data;
  },
  getMonthlySummary: async (month?: number, year?: number): Promise<MonthlyIncomeSummary> => {
    const res = await api.get<MonthlyIncomeSummary>('/income/monthly-summary', { params: { month, year } });
    return res.data;
  },
  createIncome: async (payload: IncomePayload): Promise<Income> => {
    const res = await api.post<Income>('/income', payload);
    return res.data;
  },
  updateIncome: async (id: number, payload: Partial<IncomePayload>): Promise<Income> => {
    const res = await api.put<Income>(`/income/${id}`, payload);
    return res.data;
  },
  deleteIncome: async (id: number): Promise<void> => {
    await api.delete(`/income/${id}`);
  },
};

// ---------------------------------------------------------
// Categories API
// ---------------------------------------------------------
export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await api.get<Category[]>('/categories');
    return res.data;
  },
  getGroupedCategories: async (): Promise<CategoryGrouped[]> => {
    const res = await api.get<CategoryGrouped[]>('/categories/grouped');
    return res.data;
  },
  createCategory: async (payload: CategoryPayload): Promise<Category> => {
    const res = await api.post<Category>('/categories', payload);
    return res.data;
  },
  updateCategory: async (id: number, payload: Partial<CategoryPayload>): Promise<Category> => {
    const res = await api.put<Category>(`/categories/${id}`, payload);
    return res.data;
  },
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

// ---------------------------------------------------------
// Recurring Expenses API
// ---------------------------------------------------------
export const recurringApi = {
  getRecurringExpenses: async (): Promise<RecurringExpense[]> => {
    const res = await api.get<RecurringExpense[]>('/recurring-expenses');
    return res.data;
  },
  getUpcomingPayments: async (daysAhead: number = 30): Promise<UpcomingPayment[]> => {
    const res = await api.get<UpcomingPayment[]>('/recurring-expenses/upcoming', { params: { days_ahead: daysAhead } });
    return res.data;
  },
  createRecurringExpense: async (payload: RecurringExpensePayload): Promise<RecurringExpense> => {
    const res = await api.post<RecurringExpense>('/recurring-expenses', payload);
    return res.data;
  },
  updateRecurringExpense: async (id: number, payload: Partial<RecurringExpensePayload>): Promise<RecurringExpense> => {
    const res = await api.put<RecurringExpense>(`/recurring-expenses/${id}`, payload);
    return res.data;
  },
  deleteRecurringExpense: async (id: number): Promise<void> => {
    await api.delete(`/recurring-expenses/${id}`);
  },
};

// ---------------------------------------------------------
// Budgets API
// ---------------------------------------------------------
export const budgetsApi = {
  getBudgets: async (month?: number, year?: number): Promise<Budget[]> => {
    const res = await api.get<Budget[]>('/budgets', { params: { month, year } });
    return res.data;
  },
  getBudgetProgress: async (month?: number, year?: number): Promise<MonthlyBudgetOverview> => {
    const res = await api.get<MonthlyBudgetOverview>('/budgets/progress', { params: { month, year } });
    return res.data;
  },
  setBudget: async (payload: BudgetPayload): Promise<Budget> => {
    const res = await api.post<Budget>('/budgets', payload);
    return res.data;
  },
  updateBudget: async (id: number, amount: number): Promise<Budget> => {
    const res = await api.put<Budget>(`/budgets/${id}`, { amount });
    return res.data;
  },
  deleteBudget: async (id: number): Promise<void> => {
    await api.delete(`/budgets/${id}`);
  },
};

// ---------------------------------------------------------
// Savings Goals API
// ---------------------------------------------------------
export const savingsApi = {
  getSavingsGoals: async (): Promise<SavingsGoal[]> => {
    const res = await api.get<SavingsGoal[]>('/savings-goals');
    return res.data;
  },
  createSavingsGoal: async (payload: SavingsGoalPayload): Promise<SavingsGoal> => {
    const res = await api.post<SavingsGoal>('/savings-goals', payload);
    return res.data;
  },
  depositSavingsGoal: async (id: number, payload: SavingsGoalDepositPayload): Promise<SavingsGoal> => {
    const res = await api.post<SavingsGoal>(`/savings-goals/${id}/deposit`, payload);
    return res.data;
  },
  updateSavingsGoal: async (id: number, payload: Partial<SavingsGoalPayload>): Promise<SavingsGoal> => {
    const res = await api.put<SavingsGoal>(`/savings-goals/${id}`, payload);
    return res.data;
  },
  deleteSavingsGoal: async (id: number): Promise<void> => {
    await api.delete(`/savings-goals/${id}`);
  },
};

// ---------------------------------------------------------
// Decision Support API
// ---------------------------------------------------------
export const decisionApi = {
  checkAffordability: async (payload: AffordabilityRequest): Promise<AffordabilityResponse> => {
    const res = await api.post<AffordabilityResponse>('/finance/affordability-check', payload);
    return res.data;
  },
  runBudgetSimulator: async (payload: BudgetSimulatorRequest): Promise<BudgetSimulatorResponse> => {
    const res = await api.post<BudgetSimulatorResponse>('/finance/budget-simulator', payload);
    return res.data;
  },
};

// ---------------------------------------------------------
// Analytics API
// ---------------------------------------------------------
export const analyticsApi = {
  getDashboardSummary: async (month?: number, year?: number): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummary>('/analytics/dashboard', { params: { month, year } });
    return res.data;
  },
  getSpendingPace: async (month?: number, year?: number): Promise<SpendingPaceResponse> => {
    const res = await api.get<SpendingPaceResponse>('/analytics/spending-pace', { params: { month, year } });
    return res.data;
  },
  getBudgetHealth: async (month?: number, year?: number): Promise<BudgetHealthResponse> => {
    const res = await api.get<BudgetHealthResponse>('/analytics/budget-health', { params: { month, year } });
    return res.data;
  },
  getCategorySpending: async (month?: number, year?: number): Promise<CategorySpendBreakdown[]> => {
    const res = await api.get<CategorySpendBreakdown[]>('/analytics/categories', { params: { month, year } });
    return res.data;
  },
  getMonthlyTrends: async (monthsCount: number = 6): Promise<MonthlyTrendItem[]> => {
    const res = await api.get<MonthlyTrendItem[]>('/analytics/monthly-trends', { params: { months_count: monthsCount } });
    return res.data;
  },
  getFixedVsVariable: async (month?: number, year?: number): Promise<FixedVsVariableBreakdown> => {
    const res = await api.get<FixedVsVariableBreakdown>('/analytics/fixed-vs-variable', { params: { month, year } });
    return res.data;
  },
  getDailySpending: async (month?: number, year?: number): Promise<DailySpendItem[]> => {
    const res = await api.get<DailySpendItem[]>('/analytics/daily', { params: { month, year } });
    return res.data;
  },
  getPaymentMethods: async (month?: number, year?: number): Promise<PaymentMethodBreakdown[]> => {
    const res = await api.get<PaymentMethodBreakdown[]>('/analytics/payment-methods', { params: { month, year } });
    return res.data;
  },
  getAlerts: async (month?: number, year?: number): Promise<AlertItem[]> => {
    const res = await api.get<AlertItem[]>('/analytics/alerts', { params: { month, year } });
    return res.data;
  },
};

// ---------------------------------------------------------
// CSV Import API
// ---------------------------------------------------------
export const csvApi = {
  uploadCSVPreview: async (file: File): Promise<CSVPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<CSVPreviewResponse>('/csv/upload-preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  validateMapping: async (payload: CSVImportRequest): Promise<CSVImportValidationReport> => {
    const res = await api.post<CSVImportValidationReport>('/csv/validate-mapping', payload);
    return res.data;
  },
  confirmImport: async (payload: CSVImportRequest): Promise<CSVImportResult> => {
    const res = await api.post<CSVImportResult>('/csv/confirm-import', payload);
    return res.data;
  },
};

export default api;
