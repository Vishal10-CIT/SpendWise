from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import date
from app.models.budget import Budget
from app.models.expense import Expense
from app.models.category import Category
from app.schemas.decision_support import AffordabilityCheckRequest, AffordabilityCheckResponse
from app.services.finance_service import calculate_user_financial_profile


def check_affordability(
    db: Session,
    user_id: int,
    request_in: AffordabilityCheckRequest
) -> AffordabilityCheckResponse:
    """
    Deterministic affordability decision engine.
    Analyzes user's real financial profile to determine if a hypothetical purchase is safely affordable.
    """
    today = date.today()
    profile = calculate_user_financial_profile(db, user_id, today.month, today.year)

    amount = request_in.amount
    current_flexible = profile["remaining_flexible_spending"]
    flexible_after = round(current_flexible - amount, 2)
    days_remaining = profile["days_remaining"]
    total_flex_budget = profile["total_flexible_budget"]
    monthly_income = profile["total_income"]

    # Safe spending limit impacts
    current_safe_weekly = profile["safe_weekly_spending"]
    current_safe_daily = profile["safe_daily_spending"]

    safe_weekly_after = round(max(0.0, flexible_after) / 4.33, 2)
    safe_daily_after = round(max(0.0, flexible_after) / days_remaining, 2)

    # Category budget impact analysis
    category_impact_msg = None
    category_overbudget = False
    if request_in.category_id:
        category = db.query(Category).filter(Category.id == request_in.category_id).first()
        budget = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.category_id == request_in.category_id,
            Budget.month == today.month,
            Budget.year == today.year
        ).first()

        if category and budget:
            spent_in_category = sum(
                e.amount for e in profile["expense_records"] if e.category_id == request_in.category_id
            )
            cat_spent_after = spent_in_category + amount
            cat_budget_pct_after = round((cat_spent_after / budget.amount) * 100, 1)

            if cat_spent_after > budget.amount:
                category_overbudget = True
                category_impact_msg = (
                    f"Exceeds {category.name} budget: Spent ₹{cat_spent_after:.0f} / ₹{budget.amount:.0f} ({cat_budget_pct_after}%)"
                )
            else:
                category_impact_msg = (
                    f"{category.name} budget will be {cat_budget_pct_after}% used (₹{cat_spent_after:.0f} / ₹{budget.amount:.0f})"
                )

    # Calculate savings impact
    savings_impact = 0.0
    if flexible_after < 0:
        savings_impact = abs(flexible_after)

    # Determine status & generate deterministic explanation
    if flexible_after < 0 or (monthly_income > 0 and amount > (profile["remaining_liquid_balance"])):
        status = "Not Recommended"
        status_badge = "🔴 Not Recommended"
        deficit = abs(flexible_after) if flexible_after < 0 else (amount - profile["remaining_liquid_balance"])
        explanation = (
            f"This purchase of ₹{amount:,.2f} will push your flexible spending into a deficit of ₹{deficit:,.2f} "
            f"and would force you to dip into your savings target or upcoming recurring commitments."
        )
        recommendation = (
            f"Postpone buying '{request_in.purchase_name}' until next month or reduce variable spending by ₹{deficit:,.2f} first."
        )
    elif flexible_after < (total_flex_budget * 0.15) or category_overbudget or (current_safe_weekly > 0 and safe_weekly_after < current_safe_weekly * 0.4):
        status = "Caution"
        status_badge = "🟡 Caution"
        explanation = (
            f"You can afford this purchase, but it will leave you with a slim flexible spending buffer of ₹{flexible_after:,.2f}. "
            f"Your safe weekly spending will drop from ₹{current_safe_weekly:,.2f} down to ₹{safe_weekly_after:,.2f}."
        )
        if category_impact_msg:
            explanation += f" ({category_impact_msg})"
        recommendation = (
            f"If you buy '{request_in.purchase_name}', restrict other non-essential spending to under ₹{safe_daily_after:,.2f} per day."
        )
    else:
        status = "Affordable"
        status_badge = "🟢 Affordable"
        explanation = (
            f"You can comfortably afford '{request_in.purchase_name}' for ₹{amount:,.2f}. "
            f"You will maintain a healthy flexible cushion of ₹{flexible_after:,.2f} with ₹{safe_weekly_after:,.2f}/week remaining."
        )
        recommendation = (
            "This purchase fits safely within your monthly financial plan without impacting savings goals."
        )

    return AffordabilityCheckResponse(
        status=status,
        status_badge=status_badge,
        purchase_name=request_in.purchase_name,
        purchase_amount=amount,
        current_flexible_spending=current_flexible,
        flexible_spending_after_purchase=flexible_after,
        savings_impact=savings_impact,
        current_safe_weekly=current_safe_weekly,
        safe_weekly_after_purchase=safe_weekly_after,
        current_safe_daily=current_safe_daily,
        safe_daily_after_purchase=safe_daily_after,
        category_budget_impact=category_impact_msg,
        explanation=explanation,
        recommendation=recommendation
    )
