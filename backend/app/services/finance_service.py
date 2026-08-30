import calendar
from datetime import date, datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from app.models.income import Income
from app.models.expense import Expense
from app.models.recurring_expense import RecurringExpense
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal
from app.models.user import User


def get_monthly_recurring_allocation(amount: float, frequency: str) -> float:
    """Calculate the monthly budget allocation for a given recurring frequency."""
    freq = (frequency or "Monthly").strip()
    if freq == "Weekly":
        return round(amount * (52.0 / 12.0), 2)  # ~4.333 weeks per month
    elif freq == "Monthly":
        return round(amount, 2)
    elif freq == "Quarterly":
        return round(amount / 3.0, 2)
    elif freq in ["Semi-Annually", "Every 6 months", "6 Months"]:
        return round(amount / 6.0, 2)
    elif freq in ["Annually", "Yearly"]:
        return round(amount / 12.0, 2)
    return round(amount, 2)


def get_days_in_month(month: int, year: int) -> int:
    """Return total number of days in a given month/year."""
    return calendar.monthrange(year, month)[1]


def get_month_progress(target_date: Optional[date] = None) -> Dict[str, Any]:
    """Calculate days elapsed, days remaining, and percentage of the month completed."""
    ref_date = target_date or date.today()
    total_days = get_days_in_month(ref_date.month, ref_date.year)
    days_elapsed = min(ref_date.day, total_days)
    days_remaining = max(1, total_days - days_elapsed + 1)
    time_elapsed_percentage = round((days_elapsed / total_days) * 100, 1)

    return {
        "total_days": total_days,
        "days_elapsed": days_elapsed,
        "days_remaining": days_remaining,
        "time_elapsed_percentage": time_elapsed_percentage,
    }


def calculate_user_financial_profile(
    db: Session,
    user_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None
) -> Dict[str, Any]:
    """
    Comprehensive financial calculation engine for student user.
    Calculates:
      - Monthly Income
      - Total Spent (Fixed vs Variable)
      - Planned Recurring Allocations (Amortized monthly)
      - Savings Goal Targets
      - Flexible Spending Capacity
      - Safe Weekly Spending = Remaining Flexible Spending / 4.33
      - Safe Daily Spending = Remaining Flexible Spending / Remaining Days in Month
    """
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    # 1. Total Income for the month
    income_records = db.query(Income).filter(
        Income.user_id == user_id,
        extract("month", Income.date) == target_month,
        extract("year", Income.date) == target_year
    ).all()
    
    total_income = sum(item.amount for item in income_records)
    
    # If no explicit income entries exist for this month but user has monthly_allowance configured, use that
    if total_income == 0.0 and user.monthly_allowance > 0:
        total_income = user.monthly_allowance

    # 2. Total Expenses for the month
    expense_records = db.query(Expense).filter(
        Expense.user_id == user_id,
        extract("month", Expense.date) == target_month,
        extract("year", Expense.date) == target_year
    ).all()

    total_spent = sum(item.amount for item in expense_records)
    fixed_spent = sum(item.amount for item in expense_records if item.expense_type == "Fixed")
    variable_spent = sum(item.amount for item in expense_records if item.expense_type == "Variable")

    # 3. Active Recurring Expenses (Monthly Planning Allocations)
    recurring_records = db.query(RecurringExpense).filter(
        RecurringExpense.user_id == user_id,
        RecurringExpense.is_active == True
    ).all()

    planned_recurring_monthly = sum(
        get_monthly_recurring_allocation(r.amount, r.frequency) for r in recurring_records
    )

    # 4. Savings Goals & Monthly Recommended Target
    savings_goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user_id
    ).all()

    total_current_savings = sum(g.current_amount for g in savings_goals)
    
    # Calculate recommended monthly savings across all uncompleted goals
    total_monthly_savings_target = 0.0
    for goal in savings_goals:
        remaining_goal_amount = max(0.0, goal.target_amount - goal.current_amount)
        if remaining_goal_amount > 0:
            if goal.target_date and goal.target_date > today:
                months_left = max(1, (goal.target_date.year - today.year) * 12 + (goal.target_date.month - today.month))
                total_monthly_savings_target += round(remaining_goal_amount / months_left, 2)
            else:
                # Default 6-month horizon if target date is unspecified
                total_monthly_savings_target += round(remaining_goal_amount / 6.0, 2)

    # 5. Core SpendWise Formula:
    # Monthly Income - Planned Recurring Allocations - Monthly Savings Target = Total Initial Flexible Budget
    # Remaining Flexible Spending = Total Initial Flexible Budget - Variable Spent
    total_flexible_budget = max(0.0, total_income - planned_recurring_monthly - total_monthly_savings_target)
    
    # Remaining flexible spending accounts for variable expenses logged this month
    remaining_flexible_spending = round(total_income - planned_recurring_monthly - total_monthly_savings_target - total_spent, 2)
    
    # Remaining real balance (liquid)
    remaining_liquid_balance = round(total_income - total_spent, 2)

    # 6. Safe Spending Limits
    month_progress = get_month_progress(today if (target_month == today.month and target_year == today.year) else None)
    days_remaining = month_progress["days_remaining"]

    effective_flexible_for_limits = max(0.0, remaining_flexible_spending)
    safe_weekly_spending = round(effective_flexible_for_limits / 4.33, 2)
    safe_daily_spending = round(effective_flexible_for_limits / days_remaining, 2)

    return {
        "user_name": user.name,
        "college_name": user.college_name,
        "living_situation": user.living_situation,
        "month": target_month,
        "year": target_year,
        "total_income": round(total_income, 2),
        "total_spent": round(total_spent, 2),
        "fixed_spent": round(fixed_spent, 2),
        "variable_spent": round(variable_spent, 2),
        "planned_recurring_monthly": round(planned_recurring_monthly, 2),
        "total_current_savings": round(total_current_savings, 2),
        "total_monthly_savings_target": round(total_monthly_savings_target, 2),
        "total_flexible_budget": round(total_flexible_budget, 2),
        "remaining_flexible_spending": remaining_flexible_spending,
        "remaining_liquid_balance": remaining_liquid_balance,
        "safe_weekly_spending": safe_weekly_spending,
        "safe_daily_spending": safe_daily_spending,
        "days_elapsed": month_progress["days_elapsed"],
        "days_remaining": days_remaining,
        "total_days_in_month": month_progress["total_days"],
        "time_elapsed_percentage": month_progress["time_elapsed_percentage"],
        "recurring_records": recurring_records,
        "savings_goals": savings_goals,
        "expense_records": expense_records,
    }
