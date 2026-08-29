from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date as dt_date, datetime as dt_datetime


class IncomeBase(BaseModel):
    source: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0.0)
    date: dt_date
    recurring: bool = False
    description: Optional[str] = Field(None, max_length=255)


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(BaseModel):
    source: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0.0)
    date: Optional[dt_date] = None
    recurring: Optional[bool] = None
    description: Optional[str] = Field(None, max_length=255)


class IncomeResponse(IncomeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: dt_datetime


class MonthlyIncomeSummary(BaseModel):
    month: int
    year: int
    total_income: float
    allowance: float
    other_sources: float
    items: List[IncomeResponse]
