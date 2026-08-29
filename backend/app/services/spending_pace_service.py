from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from app.schemas.decision_support import SpendingPaceResponse
from app.services.finance_service import calculate_user_financial_profile


def calculate_spending_pace(
    db: Session,
    user_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None
) -> SpendingPaceResponse:
    """
    Evaluate spending pace / burn rate against elapsed calendar time in the month.
    """
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    profile = calculate_user_financial_profile(db, user_id, target_month, target_year)

    days_elapsed = profile["days_elapsed"]
    days_remaining = profile["days_remaining"]
    total_days = profile["total_days_in_month"]
    time_elapsed_pct = profile["time_elapsed_percentage"]

    total_flex_budget = profile["total_flexible_budget"]
    spent_amount = profile["variable_spent"] if profile["variable_spent"] > 0 else profile["total_spent"]

    if total_flex_budget > 0:
        budget_usage_pct = round((spent_amount / total_flex_budget) * 100, 1)
    else:
        budget_usage_pct = 100.0 if spent_amount > 0 else 0.0

    # Daily average spending rate
    spending_rate = round(spent_amount / max(1, days_elapsed), 2)
    expected_month_end = round(spending_rate * total_days, 2)

    # Determine status based on delta between budget usage and time elapsed
    diff = budget_usage_pct - time_elapsed_pct

    if diff > 20 or (budget_usage_pct > 90 and time_elapsed_pct < 80):
        status = "Critical"
        status_label = "⚠️ Spending significantly faster than planned"
        status_color = "rose"
        explanation = (
            f"You have used {budget_usage_pct:.0f}% of your flexible budget while only {time_elapsed_pct:.0f}% of the month has passed. "
            f"At this pace, your month-end spending is projected to reach ₹{expected_month_end:,.2f}."
        )
    elif diff > 5:
        status = "Fast"
        status_label = "⚠️ Spending faster than planned"
        status_color = "amber"
        explanation = (
            f"You've consumed {budget_usage_pct:.0f}% of your budget at {time_elapsed_pct:.0f}% through the month. "
            f"Your daily burn rate is ₹{spending_rate:,.2f}/day."
        )
    elif diff < -10:
        status = "Healthy"
        status_label = "🟢 Spending pace is healthy"
        status_color = "emerald"
        explanation = (
            f"Great job! You have used only {budget_usage_pct:.0f}% of your budget with {time_elapsed_pct:.0f}% of the month elapsed. "
            f"You have a comfortable buffer."
        )
    else:
        status = "On Track"
        status_label = "🟡 Spending pace is on track"
        status_color = "blue"
        explanation = (
            f"Your spending pace ({budget_usage_pct:.0f}%) is in line with the calendar month progress ({time_elapsed_pct:.0f}%)."
        )

    return SpendingPaceResponse(
        days_elapsed=days_elapsed,
        days_remaining=days_remaining,
        total_days_in_month=total_days,
        total_flexible_budget=total_flex_budget,
        spent_flexible_amount=round(spent_amount, 2),
        budget_usage_percentage=budget_usage_pct,
        time_elapsed_percentage=time_elapsed_pct,
        spending_rate=spending_rate,
        expected_month_end_spending=expected_month_end,
        status=status,
        status_label=status_label,
        status_color=status_color,
        explanation=explanation
    )
