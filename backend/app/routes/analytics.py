from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, desc
from app.database.session import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.income import Income
from app.models.category import Category
from app.schemas.analytics import (
    DashboardSummary,
    SafeSpendingLimits,
    CategorySpendBreakdown,
    MonthlyTrendItem,
    FixedVsVariableBreakdown,
    DailySpendItem,
    PaymentMethodBreakdown,
    AlertItem
)
from app.schemas.decision_support import (
    SpendingPaceResponse,
    BudgetHealthScoreResponse
)
from app.services.auth_service import get_current_user
from app.services.finance_service import calculate_user_financial_profile
from app.services.spending_pace_service import calculate_spending_pace
from app.services.budget_health_service import calculate_budget_health_score
from app.services.alert_service import generate_user_spending_alerts

router = APIRouter(prefix="/analytics", tags=["Analytics & Health"])


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve top-level KPI metrics for the student dashboard."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    profile = calculate_user_financial_profile(db, current_user.id, target_month, target_year)
    health = calculate_budget_health_score(db, current_user.id, target_month, target_year)

    safe_limits = SafeSpendingLimits(
        safe_weekly_spending=profile["safe_weekly_spending"],
        safe_daily_spending=profile["safe_daily_spending"],
        remaining_days_in_month=profile["days_remaining"]
    )

    return DashboardSummary(
        user_name=profile["user_name"],
        college_name=profile["college_name"],
        living_situation=profile["living_situation"],
        month=target_month,
        year=target_year,
        monthly_income=profile["total_income"],
        total_spent=profile["total_spent"],
        remaining_balance=profile["remaining_liquid_balance"],
        total_savings=profile["total_current_savings"],
        planned_recurring_allocation=profile["planned_recurring_monthly"],
        flexible_spending=profile["remaining_flexible_spending"],
        safe_limits=safe_limits,
        fixed_expenses_total=profile["fixed_spent"],
        variable_expenses_total=profile["variable_spent"],
        budget_health_score=health.score,
        budget_health_status=health.status,
    )


@router.get("/spending-pace", response_model=SpendingPaceResponse)
def get_spending_pace(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Feature 2: Retrieve real-time Spending Pace and Burn Rate Intelligence."""
    return calculate_spending_pace(db, current_user.id, month, year)


@router.get("/budget-health", response_model=BudgetHealthScoreResponse)
def get_budget_health(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Feature 4: Retrieve explainable SpendWise Budget Health Score (0-100)."""
    return calculate_budget_health_score(db, current_user.id, month, year)


@router.get("/categories", response_model=List[CategorySpendBreakdown])
def get_category_spending_breakdown(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Category spending breakdown for donut / pie charts."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        extract("month", Expense.date) == target_month,
        extract("year", Expense.date) == target_year
    ).all()

    total_amount = sum(e.amount for e in expenses)
    if total_amount == 0.0:
        return []

    cat_map = {}
    for e in expenses:
        if e.category_id not in cat_map:
            cat_map[e.category_id] = {"amount": 0.0, "count": 0, "cat": e.category}
        cat_map[e.category_id]["amount"] += e.amount
        cat_map[e.category_id]["count"] += 1

    results = []
    for cat_id, data in sorted(cat_map.items(), key=lambda x: x[1]["amount"], reverse=True):
        cat = data["cat"]
        amount = data["amount"]
        pct = round((amount / total_amount) * 100, 1)
        results.append(CategorySpendBreakdown(
            category_id=cat_id,
            category_name=cat.name if cat else "Uncategorized",
            category_group=cat.group if cat else "Other",
            color=cat.color if cat else "#6366F1",
            icon=cat.icon if cat else "tag",
            total_amount=round(amount, 2),
            percentage=pct,
            transaction_count=data["count"]
        ))

    return results


@router.get("/monthly-trends", response_model=List[MonthlyTrendItem])
def get_monthly_trends(
    months_count: int = Query(6, ge=2, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Monthly Income vs Expense comparison for the last N months."""
    today = date.today()
    results: List[MonthlyTrendItem] = []

    for i in range(months_count - 1, -1, -1):
        # Calculate past month and year
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1

        incomes = db.query(Income).filter(
            Income.user_id == current_user.id,
            extract("month", Income.date) == m,
            extract("year", Income.date) == y
        ).all()
        inc_total = sum(item.amount for item in incomes)
        if inc_total == 0.0 and current_user.monthly_allowance > 0:
            inc_total = current_user.monthly_allowance

        expenses = db.query(Expense).filter(
            Expense.user_id == current_user.id,
            extract("month", Expense.date) == m,
            extract("year", Expense.date) == y
        ).all()
        exp_total = sum(item.amount for item in expenses)

        month_label = date(y, m, 1).strftime("%b %Y")
        results.append(MonthlyTrendItem(
            label=month_label,
            month=m,
            year=y,
            income=round(inc_total, 2),
            expenses=round(exp_total, 2),
            net_savings=round(inc_total - exp_total, 2)
        ))

    return results


@router.get("/fixed-vs-variable", response_model=FixedVsVariableBreakdown)
def get_fixed_vs_variable(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Breakdown of fixed vs variable spending."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        extract("month", Expense.date) == target_month,
        extract("year", Expense.date) == target_year
    ).all()

    fixed = sum(e.amount for e in expenses if e.expense_type == "Fixed")
    variable = sum(e.amount for e in expenses if e.expense_type == "Variable")
    total = fixed + variable

    fixed_pct = round((fixed / total) * 100, 1) if total > 0 else 0.0
    variable_pct = round((variable / total) * 100, 1) if total > 0 else 0.0

    return FixedVsVariableBreakdown(
        fixed_amount=round(fixed, 2),
        variable_amount=round(variable, 2),
        fixed_percentage=fixed_pct,
        variable_percentage=variable_pct
    )


@router.get("/daily", response_model=List[DailySpendItem])
def get_daily_spending(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Daily spending distribution for the target month."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        extract("month", Expense.date) == target_month,
        extract("year", Expense.date) == target_year
    ).order_by(Expense.date).all()

    daily_map = {}
    for e in expenses:
        if e.date not in daily_map:
            daily_map[e.date] = {"amount": 0.0, "count": 0}
        daily_map[e.date]["amount"] += e.amount
        daily_map[e.date]["count"] += 1

    return [
        DailySpendItem(
            date=d,
            day_label=d.strftime("%a %d"),
            amount=round(info["amount"], 2),
            transaction_count=info["count"]
        )
        for d, info in sorted(daily_map.items())
    ]


@router.get("/payment-methods", response_model=List[PaymentMethodBreakdown])
def get_payment_method_breakdown(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Breakdown of spending by payment channel (UPI, Cash, Card, NetBanking)."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        extract("month", Expense.date) == target_month,
        extract("year", Expense.date) == target_year
    ).all()

    total = sum(e.amount for e in expenses)
    pm_map = {}
    for e in expenses:
        pm = e.payment_method or "UPI"
        if pm not in pm_map:
            pm_map[pm] = {"amount": 0.0, "count": 0}
        pm_map[pm]["amount"] += e.amount
        pm_map[pm]["count"] += 1

    return [
        PaymentMethodBreakdown(
            method=m,
            amount=round(info["amount"], 2),
            percentage=round((info["amount"] / total) * 100, 1) if total > 0 else 0.0,
            count=info["count"]
        )
        for m, info in sorted(pm_map.items(), key=lambda x: x[1]["amount"], reverse=True)
    ]


@router.get("/alerts", response_model=List[AlertItem])
def get_spending_alerts(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve rule-based actionable spending alerts calculated from real user data."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    return generate_user_spending_alerts(db, current_user.id, target_month, target_year)
