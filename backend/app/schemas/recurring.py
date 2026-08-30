from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Union
from datetime import date, datetime
import json
from app.schemas.category import CategoryResponse


class RecurringExpenseBase(BaseModel):
    category_id: int
    name: str = Field(..., min_length=1, max_length=120)
    amount: float = Field(..., gt=0.0)
    frequency: str = Field("Monthly", pattern="^(Weekly|Monthly|Quarterly|Semi-Annually|Every 6 months|Annually|Yearly)$")
    next_payment_date: date
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reminder_days: Optional[List[int]] = Field(default_factory=lambda: [7, 3, 1, 0])
    is_active: bool = True
    notes: Optional[str] = Field(None, max_length=255)


class RecurringExpenseCreate(RecurringExpenseBase):
    pass


class RecurringExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    amount: Optional[float] = Field(None, gt=0.0)
    frequency: Optional[str] = Field(None, pattern="^(Weekly|Monthly|Quarterly|Semi-Annually|Every 6 months|Annually|Yearly)$")
    next_payment_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reminder_days: Optional[List[int]] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=255)


class RecurringExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    category_id: int
    name: str
    amount: float
    frequency: str
    next_payment_date: date
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reminder_days: List[int] = Field(default_factory=list)
    last_paid_date: Optional[date] = None
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime
    monthly_allocation: float
    category: Optional[CategoryResponse] = None

    @field_validator("reminder_days", mode="before")
    def parse_reminder_days(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [int(x) for x in parsed]
            except Exception:
                return [int(x.strip()) for x in v.split(",") if x.strip().isdigit()]
        elif isinstance(v, (list, tuple)):
            return [int(x) for x in v]
        return [7, 3, 1, 0]


class UpcomingPayment(BaseModel):
    id: int
    name: str
    amount: float
    category_name: str
    category_color: str
    category_icon: str
    frequency: str
    next_payment_date: date
    days_until_due: int
    status: str
    reminder_days: List[int] = Field(default_factory=lambda: [7, 3, 1, 0])
