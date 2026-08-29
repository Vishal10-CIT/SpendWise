from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime


class SavingsGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    target_amount: float = Field(..., gt=0.0)
    current_amount: float = Field(0.0, ge=0.0)
    target_date: Optional[date] = None
    description: Optional[str] = Field(None, max_length=255)


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    target_amount: Optional[float] = Field(None, gt=0.0)
    current_amount: Optional[float] = Field(None, ge=0.0)
    target_date: Optional[date] = None
    description: Optional[str] = Field(None, max_length=255)


class SavingsGoalDeposit(BaseModel):
    amount: float = Field(..., gt=0.0, description="Deposit amount to add to savings goal")


class SavingsGoalResponse(SavingsGoalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    progress_percentage: float
    remaining_amount: float
    recommended_monthly_saving: float
    days_remaining: Optional[int] = None
    is_completed: bool
