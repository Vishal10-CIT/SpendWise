from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from app.schemas.recurring import RecurringExpenseResponse


class ReminderItemResponse(BaseModel):
    id: int
    recurring_expense_id: int
    name: str
    amount: float
    category_name: str
    category_color: str
    category_icon: str
    frequency: str
    next_payment_date: date
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    last_paid_date: Optional[date] = None
    days_until_due: int
    status: str  # "Due Today", "Due Soon", "Upcoming", "Overdue", "Renewed"
    reminder_days: List[int] = Field(default_factory=list)
    scheduled_reminders: List[str] = Field(default_factory=list)
    active_reminder_label: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


class MarkRenewedResponse(BaseModel):
    message: str
    previous_payment_date: date
    next_payment_date: date
    recurring_expense: RecurringExpenseResponse
    reminder: ReminderItemResponse
