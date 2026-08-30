// ---------------------------------------------------------
// User & Auth Types
// ---------------------------------------------------------
export type LivingSituation = 'Home' | 'Hostel' | 'PG';

export interface User {
  id: number;
  name: string;
  email: string;
  college_name?: string | null;
  living_situation: LivingSituation;
  monthly_allowance: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  college_name?: string;
  living_situation: LivingSituation;
  monthly_allowance: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserUpdatePayload {
  name?: string;
  college_name?: string;
  living_situation?: LivingSituation;
  monthly_allowance?: number;
  password?: string;
}

// ---------------------------------------------------------
// Category Types
// ---------------------------------------------------------
export interface Category {
  id: number;
  user_id?: number | null;
  name: string;
  group: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface CategoryGrouped {
  group: string;
  categories: Category[];
}

export interface CategoryPayload {
  name: string;
  group?: string;
  icon?: string;
  color?: string;
}

// ---------------------------------------------------------
// Expense Types
// ---------------------------------------------------------
export type PaymentMethod = 'UPI' | 'Cash' | 'Card' | 'NetBanking' | 'Other';
export type ExpenseType = 'Fixed' | 'Variable';

export interface Expense {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  description: string;
  date: string;
  payment_method: PaymentMethod;
  expense_type: ExpenseType;
  created_at: string;
  category?: Category;
}

export interface ExpensePayload {
  category_id: number;
  amount: number;
  description?: string;
  date: string;
  payment_method?: PaymentMethod;
  expense_type?: ExpenseType;
}

export interface QuickExpensePayload {
  category_id: number;
  amount: number;
  description?: string;
  payment_method?: PaymentMethod;
  expense_type?: ExpenseType;
}

export interface PaginatedExpenses {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  total_amount: number;
}

export interface ExpenseFilterParams {
  search?: string;
  category_id?: number;
  start_date?: string;
  end_date?: string;
  expense_type?: string;
  payment_method?: string;
  sort_by?: string;
  sort_desc?: boolean;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------
// Income Types
// ---------------------------------------------------------
export interface Income {
  id: number;
  user_id: number;
  source: string;
  amount: number;
  date: string;
  recurring: boolean;
  description?: string;
  created_at: string;
}

export interface IncomePayload {
  source: string;
  amount: number;
  date: string;
  recurring?: boolean;
  description?: string;
}

export interface MonthlyIncomeSummary {
  month: number;
  year: number;
  total_income: number;
  allowance: number;
  other_sources: number;
  items: Income[];
}

// ---------------------------------------------------------
// ---------------------------------------------------------
// Recurring Expense & Reminder Types
// ---------------------------------------------------------
export type RecurringFrequency =
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'Semi-Annually'
  | 'Every 6 months'
  | 'Annually'
  | 'Yearly';

export interface RecurringExpense {
  id: number;
  user_id: number;
  category_id: number;
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  next_payment_date: string;
  start_date?: string | null;
  end_date?: string | null;
  reminder_days: number[];
  last_paid_date?: string | null;
  is_active: boolean;
  notes?: string;
  created_at: string;
  monthly_allocation: number;
  category?: Category;
}

export interface RecurringExpensePayload {
  category_id: number;
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  next_payment_date: string;
  start_date?: string | null;
  end_date?: string | null;
  reminder_days?: number[];
  is_active?: boolean;
  notes?: string;
}

export interface UpcomingPayment {
  id: number;
  name: string;
  amount: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  frequency: string;
  next_payment_date: string;
  days_until_due: number;
  status: 'Due Soon' | 'Upcoming' | 'Overdue' | string;
  reminder_days?: number[];
}

export interface ReminderItem {
  id: number;
  recurring_expense_id: number;
  name: string;
  amount: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  frequency: string;
  next_payment_date: string;
  start_date?: string | null;
  end_date?: string | null;
  last_paid_date?: string | null;
  days_until_due: number;
  status: 'Due Today' | 'Due Soon' | 'Upcoming' | 'Overdue' | 'Renewed' | string;
  reminder_days: number[];
  scheduled_reminders: string[];
  active_reminder_label?: string | null;
  is_active: boolean;
  notes?: string | null;
}

export interface MarkRenewedResponse {
  message: string;
  previous_payment_date: string;
  next_payment_date: string;
  recurring_expense: RecurringExpense;
  reminder: ReminderItem;
}

// ---------------------------------------------------------
// Purchase Watchlist & Price Tracking Types
// ---------------------------------------------------------
export type WatchlistTrackingStatus =
  | 'Watching'
  | 'Target Reached'
  | 'Price Dropped'
  | 'Deadline Approaching'
  | 'Tracking Unavailable'
  | 'Purchased'
  | 'Stopped';

export interface PriceHistoryItem {
  id: number;
  watchlist_id: number;
  price: number;
  checked_at: string;
}

export interface WatchlistAffordability {
  status: 'Affordable' | 'Caution' | 'Not Recommended' | string;
  status_badge: string;
  current_flexible_spending: number;
  target_price: number;
  flexible_after_purchase: number;
  explanation: string;
}

export interface WatchlistItem {
  id: number;
  user_id: number;
  product_name: string;
  product_url: string;
  store_source: string;
  target_price: number;
  current_price?: number | null;
  lowest_price?: number | null;
  highest_price?: number | null;
  price_difference?: number | null;
  price_change_recent?: number | null;
  purchase_deadline?: string | null;
  days_until_deadline?: number | null;
  tracking_status: WatchlistTrackingStatus;
  is_tracking_active: boolean;
  last_checked_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  affordability?: WatchlistAffordability | null;
  price_history?: PriceHistoryItem[];
}

export interface WatchlistCreatePayload {
  product_name: string;
  product_url: string;
  target_price: number;
  store_source?: string;
  purchase_deadline?: string | null;
  notes?: string;
}

export interface WatchlistUpdatePayload {
  product_name?: string;
  product_url?: string;
  target_price?: number;
  store_source?: string;
  purchase_deadline?: string | null;
  is_tracking_active?: boolean;
  notes?: string;
}

export interface PriceCheckResult {
  watchlist_id: number;
  product_name: string;
  previous_price?: number | null;
  current_price?: number | null;
  target_price: number;
  tracking_status: string;
  message: string;
  alert_triggered?: string | null;
}

// ---------------------------------------------------------
// Budget Types
// ---------------------------------------------------------
export interface Budget {
  id: number;
  user_id: number;
  category_id?: number | null;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  category?: Category;
}

export interface BudgetPayload {
  category_id?: number | null;
  amount: number;
  month: number;
  year: number;
}

export interface CategoryBudgetProgress {
  id?: number;
  category_id?: number;
  category_name: string;
  category_group: string;
  category_icon: string;
  category_color: string;
  budgeted_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  status: 'Normal' | 'Approaching Limit' | 'Near Limit' | 'Exceeded';
  is_overall: boolean;
}

export interface MonthlyBudgetOverview {
  month: number;
  year: number;
  total_budgeted: number;
  total_spent: number;
  remaining_budget: number;
  percentage_used: number;
  status: string;
  category_progress: CategoryBudgetProgress[];
}

// ---------------------------------------------------------
// Savings Goal Types
// ---------------------------------------------------------
export interface SavingsGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string | null;
  description?: string | null;
  created_at: string;
  progress_percentage: number;
  remaining_amount: number;
  recommended_monthly_saving: number;
  days_remaining?: number | null;
  is_completed: boolean;
}

export interface SavingsGoalPayload {
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string | null;
  description?: string | null;
}

export interface SavingsGoalDepositPayload {
  amount: number;
}

// ---------------------------------------------------------
// Analytics & Dashboard Types
// ---------------------------------------------------------
export interface SafeSpendingLimits {
  safe_weekly_spending: number;
  safe_daily_spending: number;
  remaining_days_in_month: number;
  note: string;
}

export interface DashboardSummary {
  user_name: string;
  college_name?: string | null;
  living_situation: LivingSituation;
  month: number;
  year: number;
  monthly_income: number;
  total_spent: number;
  remaining_balance: number;
  total_savings: number;
  planned_recurring_allocation: number;
  flexible_spending: number;
  safe_limits: SafeSpendingLimits;
  fixed_expenses_total: number;
  variable_expenses_total: number;
  budget_health_score?: number | null;
  budget_health_status?: string | null;
}

export interface CategorySpendBreakdown {
  category_id: number;
  category_name: string;
  category_group: string;
  color: string;
  icon: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

export interface MonthlyTrendItem {
  label: string;
  month: number;
  year: number;
  income: number;
  expenses: number;
  net_savings: number;
}

export interface FixedVsVariableBreakdown {
  fixed_amount: number;
  variable_amount: number;
  fixed_percentage: number;
  variable_percentage: number;
}

export interface DailySpendItem {
  date: string;
  day_label: string;
  amount: number;
  transaction_count: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface AlertItem {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  title: string;
  message: string;
  category?: string;
  action_url?: string;
  created_at: string;
}

// ---------------------------------------------------------
// Decision Support Tool Types
// ---------------------------------------------------------

// 1. "Can I Afford This?"
export interface AffordabilityRequest {
  purchase_name: string;
  amount: number;
  category_id?: number;
}

export interface AffordabilityResponse {
  status: 'Affordable' | 'Caution' | 'Not Recommended';
  status_badge: string;
  purchase_name: string;
  purchase_amount: number;
  current_flexible_spending: number;
  flexible_spending_after_purchase: number;
  savings_impact: number;
  current_safe_weekly: number;
  safe_weekly_after_purchase: number;
  current_safe_daily: number;
  safe_daily_after_purchase: number;
  category_budget_impact?: string | null;
  explanation: string;
  recommendation: string;
}

// 2. Spending Pace / Burn Rate
export interface SpendingPaceResponse {
  days_elapsed: number;
  days_remaining: number;
  total_days_in_month: number;
  total_flexible_budget: number;
  spent_flexible_amount: number;
  budget_usage_percentage: number;
  time_elapsed_percentage: number;
  spending_rate: number;
  expected_month_end_spending: number;
  status: 'Healthy' | 'On Track' | 'Fast' | 'Critical';
  status_label: string;
  status_color: 'emerald' | 'blue' | 'amber' | 'rose';
  explanation: string;
}

// 3. What-If Budget Simulator
export interface BudgetSimulatorRequest {
  scenario_name: string;
  amount: number;
  category_id?: number;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency;
}

export interface SimulatorState {
  monthly_income: number;
  total_spent: number;
  planned_recurring: number;
  savings_allocation: number;
  flexible_spending: number;
  safe_weekly_spending: number;
  safe_daily_spending: number;
  remaining_balance: number;
}

export interface SimulatorDelta {
  flexible_spending_change: number;
  safe_weekly_change: number;
  safe_daily_change: number;
  savings_impact: number;
}

export interface BudgetSimulatorResponse {
  scenario_name: string;
  amount: number;
  is_recurring: boolean;
  recurring_frequency?: string | null;
  current_state: SimulatorState;
  simulated_state: SimulatorState;
  deltas: SimulatorDelta;
  explanation: string;
  recommendations: string[];
  goal_impacts: string[];
}

// 4. SpendWise Budget Health Score
export interface FactorScoreItem {
  factor_name: string;
  weight_percentage: number;
  raw_score: number;
  weighted_score: number;
  status: string;
  description: string;
}

export interface BudgetHealthResponse {
  score: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' | 'At Risk';
  color: 'emerald' | 'blue' | 'amber' | 'orange' | 'rose';
  factor_breakdown: FactorScoreItem[];
  positive_factors: string[];
  negative_factors: string[];
  summary_explanation: string;
  month: number;
  year: number;
}

// ---------------------------------------------------------
// CSV Import Types
// ---------------------------------------------------------
export interface CSVPreviewRow {
  row_index: number;
  data: Record<string, any>;
}

export interface CSVPreviewResponse {
  headers: string[];
  sample_rows: CSVPreviewRow[];
  total_rows: number;
  suggested_mapping: {
    amount_column?: string | null;
    date_column?: string | null;
    description_column?: string | null;
    category_column?: string | null;
    payment_method_column?: string | null;
  };
}

export interface ColumnMapping {
  amount_column: string;
  date_column: string;
  description_column?: string;
  category_column?: string;
  payment_method_column?: string;
}

export interface CSVImportRowError {
  row_index: number;
  field: string;
  message: string;
  raw_value?: string;
}

export interface CSVImportValidationReport {
  valid_rows_count: number;
  invalid_rows_count: number;
  total_amount_sum: number;
  errors: CSVImportRowError[];
  is_valid_to_import: boolean;
}

export interface CSVImportRequest {
  mapping: ColumnMapping;
  default_category_id: number;
  default_payment_method: string;
  default_expense_type: string;
  raw_data: Record<string, any>[];
}

export interface CSVImportResult {
  imported_count: number;
  skipped_count: number;
  total_amount: number;
  message: string;
}
