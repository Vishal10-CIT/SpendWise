from datetime import date, timedelta
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.models.recurring_expense import RecurringExpense
from app.models.savings_goal import SavingsGoal
from app.schemas.analytics import AlertItem
from app.services.finance_service import calculate_user_financial_profile


def generate_user_spending_alerts(
    db: Session,
    user_id: int,
    month: int,
    year: int
) -> List[AlertItem]:
    """
    Generate proactive, real-data-backed rule alerts for student finances.
    No fake or static alerts.
    """
    today = date.today()
    profile = calculate_user_financial_profile(db, user_id, month, year)
    alerts: List[AlertItem] = []

    # 1. Check Category Budgets (80% and 100% thresholds)
    category_budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == month,
        Budget.year == year,
        Budget.category_id != None
    ).all()

    for budget in category_budgets:
        spent = sum(
            e.amount for e in profile["expense_records"] if e.category_id == budget.category_id
        )
        cat = db.query(Category).filter(Category.id == budget.category_id).first()
        cat_name = cat.name if cat else "Category"

        if spent > budget.amount:
            excess = spent - budget.amount
            alerts.append(AlertItem(
                id=f"budget-exceeded-{budget.id}",
                type="danger",
                title=f"{cat_name} Budget Exceeded",
                message=f"You have spent ₹{spent:,.0f}, exceeding your ₹{budget.amount:,.0f} limit by ₹{excess:,.0f}.",
                category="Budget",
                action_url="/budgets"
            ))
        elif spent >= (budget.amount * 0.80):
            pct = (spent / budget.amount) * 100
            alerts.append(AlertItem(
                id=f"budget-warning-{budget.id}",
                type="warning",
                title=f"{cat_name} Budget Near Limit",
                message=f"You have used {pct:.0f}% of your {cat_name} budget (₹{spent:,.0f} / ₹{budget.amount:,.0f}).",
                category="Budget",
                action_url="/budgets"
            ))

    # 2. Check Upcoming Recurring Payments (Due within next 7 days)
    upcoming_bills = db.query(RecurringExpense).filter(
        RecurringExpense.user_id == user_id,
        RecurringExpense.is_active == True,
        RecurringExpense.next_payment_date >= today,
        RecurringExpense.next_payment_date <= today + timedelta(days=7)
    ).all()

    for bill in upcoming_bills:
        days_left = (bill.next_payment_date - today).days
        due_str = "today" if days_left == 0 else f"in {days_left} day{'s' if days_left > 1 else ''}"
        alerts.append(AlertItem(
            id=f"recurring-due-{bill.id}",
            type="info",
            title=f"Upcoming Bill: {bill.name}",
            message=f"₹{bill.amount:,.0f} for {bill.name} is due {due_str} ({bill.next_payment_date.strftime('%b %d')}).",
            category="Recurring",
            action_url="/recurring"
        ))

    # 3. Check Safe Daily / Weekly Spending Thresholds
    if profile["remaining_flexible_spending"] <= 0 and profile["total_income"] > 0:
        alerts.append(AlertItem(
            id="flexible-deficit-warning",
            type="danger",
            title="Flexible Budget Exhausted",
            message="Your monthly flexible spending capacity is at zero. Pause non-essential purchases.",
            category="Spending",
            action_url="/decision-tools"
        ))
    elif profile["safe_daily_spending"] < 100.0 and profile["days_remaining"] > 5 and profile["total_income"] > 0:
        alerts.append(AlertItem(
            id="low-daily-limit",
            type="warning",
            title="Low Daily Spending Limit",
            message=f"Your safe daily spending is down to ₹{profile['safe_daily_spending']:.0f}/day for the remaining {profile['days_remaining']} days.",
            category="Spending",
            action_url="/decision-tools"
        ))

    # 4. Savings Goals Milestones
    for goal in profile["savings_goals"]:
        pct = (goal.current_amount / goal.target_amount) * 100 if goal.target_amount > 0 else 0
        if pct >= 100:
            alerts.append(AlertItem(
                id=f"goal-completed-{goal.id}",
                type="success",
                title=f"Savings Goal Reached! 🎉",
                message=f"Congratulations! You've achieved your target of ₹{goal.target_amount:,.0f} for '{goal.name}'.",
                category="Savings",
                action_url="/savings"
            ))
        elif pct >= 75:
            alerts.append(AlertItem(
                id=f"goal-near-{goal.id}",
                type="info",
                title=f"Goal Almost Complete",
                message=f"You are at {pct:.0f}% of your goal for '{goal.name}' (₹{goal.current_amount:,.0f} / ₹{goal.target_amount:,.0f}).",
                category="Savings",
                action_url="/savings"
            ))

    # 5. Month-over-Month Spending Increase check
    prev_month = 12 if month == 1 else month - 1
    prev_year = year - 1 if month == 1 else year

    curr_lifestyle_spent = sum(
        e.amount for e in profile["expense_records"]
        if e.category and e.category.group in ["Lifestyle", "Food"]
    )

    prev_expenses = db.query(Expense).filter(
        Expense.user_id == user_id,
        extract("month", Expense.date) == prev_month,
        extract("year", Expense.date) == prev_year
    ).all()
    prev_lifestyle_spent = sum(
        e.amount for e in prev_expenses
        if e.category and e.category.group in ["Lifestyle", "Food"]
    )

    if prev_lifestyle_spent > 500 and curr_lifestyle_spent > (prev_lifestyle_spent * 1.25):
        increase_pct = int(((curr_lifestyle_spent - prev_lifestyle_spent) / prev_lifestyle_spent) * 100)
        alerts.append(AlertItem(
            id="mom-spending-increase",
            type="warning",
            title="Lifestyle & Dining Spending Increase",
            message=f"Your Food & Lifestyle spending is {increase_pct}% higher compared to last month.",
            category="Analytics",
            action_url="/analytics"
        ))

    return alerts
