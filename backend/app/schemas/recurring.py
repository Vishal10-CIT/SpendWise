from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from app.schemas.category import CategoryResponse


class RecurringExpenseBase(BaseModel):
    category_id: int
    name: str = Field(..., min_length=1, max_length=120)
    amount: float = Field(..., gt=0.0)
    frequency: str = Field("Monthly", pattern="^(Weekly|Monthly|Quarterly|Semi-Annually|Annually)$")
    next_payment_date: date
    is_active: bool = True
    notes: Optional[str] = Field(None, max_length=255)


class RecurringExpenseCreate(RecurringExpenseBase):
    pass


class RecurringExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    amount: Optional[float] = Field(None, gt=0.0)
    frequency: Optional[str] = Field(None, pattern="^(Weekly|Monthly|Quarterly|Semi-Annually|Annually)$")
    next_payment_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=255)


class RecurringExpenseResponse(RecurringExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    monthly_allocation: float
    category: Optional[CategoryResponse] = None


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
