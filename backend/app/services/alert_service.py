from datetime import date, timedelta
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.models.recurring_expense import RecurringExpense
from app.models.savings_goal import SavingsGoal
from app.models.product_watchlist import ProductWatchlist
from app.schemas.analytics import AlertItem
from app.services.finance_service import calculate_user_financial_profile
from app.services.renewal_service import parse_reminder_days


def generate_user_spending_alerts(
    db: Session,
    user_id: int,
    month: int,
    year: int
) -> List[AlertItem]:
    """
    Generate proactive, real-data-backed rule alerts for student finances.
    Includes budget thresholds, smart renewal reminders, and watchlist price alerts.
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

    # 2. Smart Recurring Payment & Renewal Reminders
    active_bills = db.query(RecurringExpense).filter(
        RecurringExpense.user_id == user_id,
        RecurringExpense.is_active == True,
    ).all()

    for bill in active_bills:
        days_left = (bill.next_payment_date - today).days
        user_offsets = parse_reminder_days(bill.reminder_days)

        if days_left < 0:
            alerts.append(AlertItem(
                id=f"recurring-overdue-{bill.id}",
                type="danger",
                title=f"Overdue Payment: {bill.name}",
                message=f"₹{bill.amount:,.0f} for {bill.name} was due on {bill.next_payment_date.strftime('%b %d')} ({abs(days_left)} days ago).",
                category="Reminders",
                action_url="/reminders"
            ))
        elif days_left == 0 and (0 in user_offsets or len(user_offsets) == 0):
            alerts.append(AlertItem(
                id=f"recurring-due-today-{bill.id}",
                type="warning",
                title=f"Due Today: {bill.name}",
                message=f"₹{bill.amount:,.0f} for {bill.name} is due today! Mark as renewed once paid.",
                category="Reminders",
                action_url="/reminders"
            ))
        elif days_left > 0 and days_left in user_offsets:
            due_str = "tomorrow" if days_left == 1 else f"in {days_left} days"
            alerts.append(AlertItem(
                id=f"recurring-due-soon-{bill.id}-{days_left}",
                type="info",
                title=f"Upcoming Renewal: {bill.name}",
                message=f"₹{bill.amount:,.0f} for {bill.name} is due {due_str} ({bill.next_payment_date.strftime('%b %d')}).",
                category="Reminders",
                action_url="/reminders"
            ))
        elif days_left > 0 and days_left <= 7 and not user_offsets:
            due_str = "tomorrow" if days_left == 1 else f"in {days_left} days"
            alerts.append(AlertItem(
                id=f"recurring-due-{bill.id}",
                type="info",
                title=f"Upcoming Bill: {bill.name}",
                message=f"₹{bill.amount:,.0f} for {bill.name} is due {due_str} ({bill.next_payment_date.strftime('%b %d')}).",
                category="Reminders",
                action_url="/reminders"
            ))

    # 3. Watchlist Target Price & Price Drop Alerts
    watchlist_items = db.query(ProductWatchlist).filter(
        ProductWatchlist.user_id == user_id,
        ProductWatchlist.is_tracking_active == True
    ).all()

    for item in watchlist_items:
        if item.tracking_status == "Target Reached" and item.current_price is not None:
            delta = round(item.target_price - item.current_price, 2)
            alerts.append(AlertItem(
                id=f"watchlist-target-{item.id}",
                type="success",
                title=f"🚨 Price Alert: {item.product_name}",
                message=f"Target reached! Current price ₹{item.current_price:,.0f} is ₹{delta:,.0f} below your ₹{item.target_price:,.0f} target.",
                category="Watchlist",
                action_url="/watchlist"
            ))
        elif item.tracking_status == "Price Dropped" and item.current_price is not None:
            alerts.append(AlertItem(
                id=f"watchlist-drop-{item.id}",
                type="info",
                title=f"📉 Price Drop: {item.product_name}",
                message=f"Price dropped to ₹{item.current_price:,.0f} (Target: ₹{item.target_price:,.0f}).",
                category="Watchlist",
                action_url="/watchlist"
            ))
        elif item.purchase_deadline:
            days_left = (item.purchase_deadline - today).days
            if 0 <= days_left <= 5 and (item.current_price is None or item.current_price > item.target_price):
                alerts.append(AlertItem(
                    id=f"watchlist-deadline-{item.id}",
                    type="warning",
                    title=f"Purchase Deadline Approaching: {item.product_name}",
                    message=f"Your purchase target date is in {days_left} days, but {item.product_name} has not reached your target price yet.",
                    category="Watchlist",
                    action_url="/watchlist"
                ))

    # 4. Check Safe Daily / Weekly Spending Thresholds
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

    # 5. Savings Goals Milestones
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

    # 6. Month-over-Month Spending Increase check
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
