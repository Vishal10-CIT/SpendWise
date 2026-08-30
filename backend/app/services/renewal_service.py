import calendar
import json
from datetime import date, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.recurring_expense import RecurringExpense
from app.schemas.recurring import RecurringExpenseResponse
from app.schemas.reminders import ReminderItemResponse, MarkRenewedResponse
from app.services.finance_service import get_monthly_recurring_allocation


def calculate_next_renewal_date(current_date: date, frequency: str) -> date:
    """
    Calculate the next payment / renewal date based on frequency.
    Handles month-end and leap-year edge cases cleanly.
    """
    freq = (frequency or "Monthly").strip()

    if freq == "Weekly":
        return current_date + timedelta(days=7)

    elif freq == "Monthly":
        new_year = current_date.year + (1 if current_date.month == 12 else 0)
        new_month = 1 if current_date.month == 12 else current_date.month + 1
        max_days = calendar.monthrange(new_year, new_month)[1]
        new_day = min(current_date.day, max_days)
        return date(new_year, new_month, new_day)

    elif freq == "Quarterly":
        total_months = current_date.month + 3
        new_year = current_date.year + (total_months - 1) // 12
        new_month = ((total_months - 1) % 12) + 1
        max_days = calendar.monthrange(new_year, new_month)[1]
        new_day = min(current_date.day, max_days)
        return date(new_year, new_month, new_day)

    elif freq in ["Semi-Annually", "Every 6 months", "6 Months"]:
        total_months = current_date.month + 6
        new_year = current_date.year + (total_months - 1) // 12
        new_month = ((total_months - 1) % 12) + 1
        max_days = calendar.monthrange(new_year, new_month)[1]
        new_day = min(current_date.day, max_days)
        return date(new_year, new_month, new_day)

    elif freq in ["Annually", "Yearly"]:
        new_year = current_date.year + 1
        new_month = current_date.month
        max_days = calendar.monthrange(new_year, new_month)[1]
        new_day = min(current_date.day, max_days)
        return date(new_year, new_month, new_day)

    # Default fallback to 1 month
    new_year = current_date.year + (1 if current_date.month == 12 else 0)
    new_month = 1 if current_date.month == 12 else current_date.month + 1
    max_days = calendar.monthrange(new_year, new_month)[1]
    return date(new_year, new_month, min(current_date.day, max_days))


def parse_reminder_days(reminder_val) -> List[int]:
    """Parse reminder offsets stored in DB to a list of ints."""
    if not reminder_val:
        return [7, 3, 1, 0]
    if isinstance(reminder_val, list):
        return [int(x) for x in reminder_val]
    if isinstance(reminder_val, str):
        try:
            parsed = json.loads(reminder_val)
            if isinstance(parsed, list):
                return [int(x) for x in parsed]
        except Exception:
            try:
                return [int(x.strip()) for x in reminder_val.split(",") if x.strip().isdigit()]
            except Exception:
                pass
    return [7, 3, 1, 0]


def format_scheduled_reminders(reminder_days: List[int]) -> List[str]:
    """Generate human-readable labels for selected reminder offsets."""
    labels = []
    for d in sorted(reminder_days, reverse=True):
        if d == 0:
            labels.append("On due date")
        elif d == 1:
            labels.append("1 day before")
        else:
            labels.append(f"{d} days before")
    return labels


def build_reminder_item(item: RecurringExpense, today: Optional[date] = None) -> ReminderItemResponse:
    """Build a rich ReminderItemResponse from a RecurringExpense entity."""
    current_today = today or date.today()
    days_diff = (item.next_payment_date - current_today).days
    reminder_offsets = parse_reminder_days(item.reminder_days)

    # Determine display status
    if days_diff < 0:
        status_text = "Overdue"
    elif days_diff == 0:
        status_text = "Due Today"
    elif days_diff <= 3:
        status_text = "Due Soon"
    elif days_diff <= 7:
        status_text = "Due Soon"
    else:
        status_text = "Upcoming"

    # If it was paid today, note renewed state
    if item.last_paid_date == current_today:
        status_text = "Renewed"

    # Determine active reminder trigger label
    active_label = None
    if days_diff in reminder_offsets:
        if days_diff == 0:
            active_label = "🔔 Due today"
        elif days_diff == 1:
            active_label = "🔔 Due tomorrow"
        else:
            active_label = f"🔔 Due in {days_diff} days"
    elif days_diff < 0:
        active_label = f"⚠️ Overdue by {abs(days_diff)} day{'s' if abs(days_diff) > 1 else ''}"
    elif days_diff == 1:
        active_label = "Due tomorrow"
    elif days_diff > 0:
        active_label = f"Due in {days_diff} days"

    return ReminderItemResponse(
        id=item.id,
        recurring_expense_id=item.id,
        name=item.name,
        amount=item.amount,
        category_name=item.category.name if item.category else "General",
        category_color=item.category.color if item.category else "#6366F1",
        category_icon=item.category.icon if item.category else "repeat",
        frequency=item.frequency,
        next_payment_date=item.next_payment_date,
        start_date=item.start_date,
        end_date=item.end_date,
        last_paid_date=item.last_paid_date,
        days_until_due=days_diff,
        status=status_text,
        reminder_days=reminder_offsets,
        scheduled_reminders=format_scheduled_reminders(reminder_offsets),
        active_reminder_label=active_label,
        is_active=item.is_active,
        notes=item.notes
    )


def get_user_reminders(
    db: Session,
    user_id: int,
    days_ahead: Optional[int] = None
) -> List[ReminderItemResponse]:
    """Retrieve all active recurring payment reminders for user, sorted nearest due first."""
    today = date.today()
    query = db.query(RecurringExpense).options(
        joinedload(RecurringExpense.category)
    ).filter(
        RecurringExpense.user_id == user_id,
        RecurringExpense.is_active == True
    )

    if days_ahead is not None:
        cutoff = today + timedelta(days=days_ahead)
        query = query.filter(RecurringExpense.next_payment_date <= cutoff)

    items = query.order_by(RecurringExpense.next_payment_date).all()
    return [build_reminder_item(item, today) for item in items]


def mark_recurring_paid_and_advance(
    db: Session,
    recurring_id: int,
    user_id: int
) -> MarkRenewedResponse:
    """
    Mark current cycle as completed / paid.
    Calculates next payment date, updates last_paid_date, and keeps the recurring payment active.
    """
    today = date.today()
    item = db.query(RecurringExpense).options(
        joinedload(RecurringExpense.category)
    ).filter(
        RecurringExpense.id == recurring_id,
        RecurringExpense.user_id == user_id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring expense not found.")

    prev_date = item.next_payment_date
    next_date = calculate_next_renewal_date(prev_date, item.frequency)

    # Check if next_date exceeds optional end_date
    if item.end_date and next_date > item.end_date:
        item.is_active = False

    item.last_paid_date = today
    item.next_payment_date = next_date

    db.commit()
    db.refresh(item)

    monthly_alloc = get_monthly_recurring_allocation(item.amount, item.frequency)
    rec_resp = RecurringExpenseResponse(
        id=item.id,
        user_id=item.user_id,
        category_id=item.category_id,
        name=item.name,
        amount=item.amount,
        frequency=item.frequency,
        next_payment_date=item.next_payment_date,
        start_date=item.start_date,
        end_date=item.end_date,
        reminder_days=parse_reminder_days(item.reminder_days),
        last_paid_date=item.last_paid_date,
        is_active=item.is_active,
        notes=item.notes,
        created_at=item.created_at,
        monthly_allocation=monthly_alloc,
        category=item.category
    )

    reminder_resp = build_reminder_item(item, today)

    return MarkRenewedResponse(
        message=f"Successfully marked '{item.name}' as paid. Next renewal scheduled for {next_date.strftime('%d %B %Y')}.",
        previous_payment_date=prev_date,
        next_payment_date=next_date,
        recurring_expense=rec_resp,
        reminder=reminder_resp
    )
