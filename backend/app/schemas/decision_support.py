from pydantic import BaseModel, Field
from typing import Optional, List


# ---------------------------------------------------------
# 1. "Can I Afford This?" Decision Tool Schemas
# ---------------------------------------------------------
class AffordabilityCheckRequest(BaseModel):
    purchase_name: str = Field(..., min_length=1, max_length=120)
    amount: float = Field(..., gt=0.0, description="Purchase amount to evaluate")
    category_id: Optional[int] = None


class AffordabilityCheckResponse(BaseModel):
    status: str  # "Affordable", "Caution", "Not Recommended"
    status_badge: str  # "🟢 Affordable", "🟡 Caution", "🔴 Not Recommended"
    purchase_name: str
    purchase_amount: float
    current_flexible_spending: float
    flexible_spending_after_purchase: float
    savings_impact: float
    current_safe_weekly: float
    safe_weekly_after_purchase: float
    current_safe_daily: float
    safe_daily_after_purchase: float
    category_budget_impact: Optional[str] = None
    explanation: str
    recommendation: str


# ---------------------------------------------------------
# 2. Spending Pace / Burn Rate Schemas
# ---------------------------------------------------------
class SpendingPaceResponse(BaseModel):
    days_elapsed: int
    days_remaining: int
    total_days_in_month: int
    total_flexible_budget: float
    spent_flexible_amount: float
    budget_usage_percentage: float
    time_elapsed_percentage: float
    spending_rate: float  # average spend per elapsed day
    expected_month_end_spending: float
    status: str  # "Healthy", "On Track", "Fast", "Critical"
    status_label: str  # e.g. "⚠️ Spending faster than planned"
    status_color: str  # "emerald", "amber", "rose"
    explanation: str


# ---------------------------------------------------------
# 3. What-If Budget Simulator Schemas
# ---------------------------------------------------------
class BudgetSimulatorRequest(BaseModel):
    scenario_name: str = Field(..., min_length=1, max_length=120)
    amount: float = Field(..., gt=0.0)
    category_id: Optional[int] = None
    is_recurring: bool = False
    recurring_frequency: Optional[str] = "Monthly"  # Weekly, Monthly, Quarterly, Semi-Annually, Annually


class SimulatorState(BaseModel):
    monthly_income: float
    total_spent: float
    planned_recurring: float
    savings_allocation: float
    flexible_spending: float
    safe_weekly_spending: float
    safe_daily_spending: float
    remaining_balance: float


class SimulatorDelta(BaseModel):
    flexible_spending_change: float
    safe_weekly_change: float
    safe_daily_change: float
    savings_impact: float


class BudgetSimulatorResponse(BaseModel):
    scenario_name: str
    amount: float
    is_recurring: bool
    recurring_frequency: Optional[str] = None
    current_state: SimulatorState
    simulated_state: SimulatorState
    deltas: SimulatorDelta
    explanation: str
    recommendations: List[str]
    goal_impacts: List[str]


# ---------------------------------------------------------
# 4. SpendWise Budget Health Score Schemas
# ---------------------------------------------------------
class FactorScoreItem(BaseModel):
    factor_name: str
    weight_percentage: int
    raw_score: float  # 0 to 100
    weighted_score: float  # raw_score * weight
    status: str
    description: str


class BudgetHealthScoreResponse(BaseModel):
    score: int  # 0 to 100
    status: str  # "Excellent", "Good", "Fair", "Needs Attention", "At Risk"
    color: str  # emerald, blue, amber, orange, rose
    factor_breakdown: List[FactorScoreItem]
    positive_factors: List[str]
    negative_factors: List[str]
    summary_explanation: str
    month: int
    year: int
