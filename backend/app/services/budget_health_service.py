from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.budget import Budget
from app.models.category import Category
from app.schemas.decision_support import (
    BudgetHealthScoreResponse,
    FactorScoreItem
)
from app.services.finance_service import calculate_user_financial_profile
from app.services.spending_pace_service import calculate_spending_pace


def calculate_budget_health_score(
    db: Session,
    user_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None
) -> BudgetHealthScoreResponse:
    """
    Calculate deterministic SpendWise Budget Health Score (0-100) with explainable factors.
    """
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    profile = calculate_user_financial_profile(db, user_id, target_month, target_year)
    pace = calculate_spending_pace(db, user_id, target_month, target_year)

    positive_factors: List[str] = []
    negative_factors: List[str] = []
    factor_items: List[FactorScoreItem] = []

    # 1. Factor 1: Budget Adherence (30% weight)
    # Check overall monthly budget or flexible budget compliance
    flex_budget = profile["total_flexible_budget"]
    spent = profile["total_spent"]
    income = profile["total_income"]

    if flex_budget > 0:
        if spent <= flex_budget:
            score_adherence = 100.0
            positive_factors.append("Total spending is currently within your planned monthly budget.")
        else:
            overage_ratio = (spent - flex_budget) / flex_budget
            score_adherence = max(10.0, 100.0 - (overage_ratio * 100.0))
            negative_factors.append(f"Total spending has exceeded planned budget by ₹{(spent - flex_budget):,.2f}.")
    else:
        score_adherence = 85.0 if spent <= income else 40.0

    factor_items.append(FactorScoreItem(
        factor_name="Budget Adherence",
        weight_percentage=30,
        raw_score=round(score_adherence, 1),
        weighted_score=round(score_adherence * 0.30, 1),
        status="Optimal" if score_adherence >= 80 else ("Moderate" if score_adherence >= 60 else "Poor"),
        description="Measures how well total expenditure aligns with planned limits."
    ))

    # 2. Factor 2: Savings Consistency (25% weight)
    savings_goals = profile["savings_goals"]
    monthly_savings_target = profile["total_monthly_savings_target"]
    remaining_flex = profile["remaining_flexible_spending"]

    if len(savings_goals) == 0:
        score_savings = 80.0
        positive_factors.append("No active savings deficit.")
    elif remaining_flex >= 0:
        score_savings = 100.0
        positive_factors.append("On track to meet active savings goal targets this month.")
    else:
        deficit_ratio = abs(remaining_flex) / max(100.0, monthly_savings_target)
        score_savings = max(15.0, 100.0 - (deficit_ratio * 60.0))
        negative_factors.append("Flexible deficit may delay your monthly savings targets.")

    factor_items.append(FactorScoreItem(
        factor_name="Savings Consistency",
        weight_percentage=25,
        raw_score=round(score_savings, 1),
        weighted_score=round(score_savings * 0.25, 1),
        status="Optimal" if score_savings >= 80 else ("Moderate" if score_savings >= 60 else "Poor"),
        description="Tracks progress towards student savings milestones."
    ))

    # 3. Factor 3: Spending Pace (20% weight)
    time_pct = pace.time_elapsed_percentage
    usage_pct = pace.budget_usage_percentage

    if usage_pct <= time_pct:
        score_pace = 100.0
        positive_factors.append("Spending burn rate is healthy and below elapsed calendar time.")
    elif usage_pct <= time_pct + 10:
        score_pace = 85.0
        positive_factors.append("Spending pace is roughly on track with the month.")
    elif usage_pct <= time_pct + 25:
        score_pace = 60.0
        negative_factors.append(f"Spending pace ({usage_pct:.0f}%) is moderately faster than month progress ({time_pct:.0f}%).")
    else:
        score_pace = 30.0
        negative_factors.append(f"High burn rate: {usage_pct:.0f}% of budget consumed at {time_pct:.0f}% of the month.")

    factor_items.append(FactorScoreItem(
        factor_name="Spending Pace",
        weight_percentage=20,
        raw_score=round(score_pace, 1),
        weighted_score=round(score_pace * 0.20, 1),
        status="Optimal" if score_pace >= 80 else ("Moderate" if score_pace >= 60 else "Poor"),
        description="Compares budget consumption rate against month progression."
    ))

    # 4. Factor 4: Overspending Penalties (15% weight)
    category_budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == target_month,
        Budget.year == target_year,
        Budget.category_id != None
    ).all()

    exceeded_count = 0
    for b in category_budgets:
        cat_spent = sum(
            e.amount for e in profile["expense_records"] if e.category_id == b.category_id
        )
        if cat_spent > b.amount:
            exceeded_count += 1
            cat = db.query(Category).filter(Category.id == b.category_id).first()
            cat_name = cat.name if cat else "Category"
            negative_factors.append(f"Exceeded {cat_name} budget (₹{cat_spent:.0f} / ₹{b.amount:.0f}).")

    if exceeded_count == 0:
        score_overspending = 100.0
        if len(category_budgets) > 0:
            positive_factors.append("All individual category budgets are under their limits.")
    else:
        score_overspending = max(20.0, 100.0 - (exceeded_count * 30.0))

    factor_items.append(FactorScoreItem(
        factor_name="Category Budget Control",
        weight_percentage=15,
        raw_score=round(score_overspending, 1),
        weighted_score=round(score_overspending * 0.15, 1),
        status="Optimal" if score_overspending >= 80 else ("Moderate" if score_overspending >= 60 else "Poor"),
        description="Checks for breaches in category-specific spending caps."
    ))

    # 5. Factor 5: Recurring Expense Load (10% weight)
    recurring_load = profile["planned_recurring_monthly"]
    if income > 0:
        recurring_ratio = recurring_load / income
        if recurring_ratio <= 0.30:
            score_recurring = 100.0
            positive_factors.append(f"Low fixed recurring commitments ({recurring_ratio * 100:.0f}% of income).")
        elif recurring_ratio <= 0.50:
            score_recurring = 80.0
        elif recurring_ratio <= 0.70:
            score_recurring = 55.0
            negative_factors.append("Fixed recurring commitments consume over half your monthly income.")
        else:
            score_recurring = 30.0
            negative_factors.append(f"High fixed recurring load ({recurring_ratio * 100:.0f}% of income).")
    else:
        score_recurring = 80.0

    factor_items.append(FactorScoreItem(
        factor_name="Recurring Expense Load",
        weight_percentage=10,
        raw_score=round(score_recurring, 1),
        weighted_score=round(score_recurring * 0.10, 1),
        status="Optimal" if score_recurring >= 80 else ("Moderate" if score_recurring >= 60 else "Poor"),
        description="Evaluates fixed recurring obligations relative to total income."
    ))

    # Calculate Total Score
    total_score = int(round(sum(item.weighted_score for item in factor_items)))
    total_score = max(0, min(100, total_score))

    # Determine Rating Label and Color
    if total_score >= 90:
        status_label = "Excellent"
        color = "emerald"
        summary_explanation = "Outstanding financial control! You're managing allowances, savings, and expenses exceptionally well."
    elif total_score >= 75:
        status_label = "Good"
        color = "blue"
        summary_explanation = "Solid financial health. You are staying within reasonable boundaries with good budget discipline."
    elif total_score >= 60:
        status_label = "Fair"
        color = "amber"
        summary_explanation = "Moderate financial balance. Keep an eye on fast spending categories to avoid a month-end crunch."
    elif total_score >= 40:
        status_label = "Needs Attention"
        color = "orange"
        summary_explanation = "Your spending pace or budget overruns require adjustments to safeguard your savings targets."
    else:
        status_label = "At Risk"
        color = "rose"
        summary_explanation = "Critical budget pressure detected. Immediate reduction of variable expenses recommended."

    return BudgetHealthScoreResponse(
        score=total_score,
        status=status_label,
        color=color,
        factor_breakdown=factor_items,
        positive_factors=positive_factors[:4],
        negative_factors=negative_factors[:4],
        summary_explanation=summary_explanation,
        month=target_month,
        year=target_year
    )
