from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime, timezone


class SafeSpendingLimits(BaseModel):
    safe_weekly_spending: float
    safe_daily_spending: float
    remaining_days_in_month: int
    note: str = "Estimates based on remaining flexible spending."


class DashboardSummary(BaseModel):
    user_name: str
    college_name: Optional[str] = None
    living_situation: str
    month: int
    year: int
    monthly_income: float
    total_spent: float
    remaining_balance: float
    total_savings: float
    planned_recurring_allocation: float
    flexible_spending: float
    safe_limits: SafeSpendingLimits
    fixed_expenses_total: float
    variable_expenses_total: float
    budget_health_score: Optional[int] = None
    budget_health_status: Optional[str] = None


class CategorySpendBreakdown(BaseModel):
    category_id: int
    category_name: str
    category_group: str
    color: str
    icon: str
    total_amount: float
    percentage: float
    transaction_count: int


class MonthlyTrendItem(BaseModel):
    label: str
    month: int
    year: int
    income: float
    expenses: float
    net_savings: float


class FixedVsVariableBreakdown(BaseModel):
    fixed_amount: float
    variable_amount: float
    fixed_percentage: float
    variable_percentage: float


class DailySpendItem(BaseModel):
    date: date
    day_label: str
    amount: float
    transaction_count: int


class PaymentMethodBreakdown(BaseModel):
    method: str
    amount: float
    percentage: float
    count: int


class AlertItem(BaseModel):
    id: str
    type: str
    title: str
    message: str
    category: Optional[str] = None
    action_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
