from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date as dt_date, datetime as dt_datetime
from app.schemas.category import CategoryResponse


class ExpenseBase(BaseModel):
    category_id: int
    amount: float = Field(..., gt=0.0, description="Expense amount must be strictly positive")
    description: Optional[str] = Field(None, max_length=255)
    date: dt_date
    payment_method: str = Field("UPI", pattern="^(UPI|Cash|Card|NetBanking|Other)$")
    expense_type: str = Field("Variable", pattern="^(Fixed|Variable)$")


class ExpenseCreate(ExpenseBase):
    pass


class QuickExpenseCreate(BaseModel):
    category_id: int
    amount: float = Field(..., gt=0.0)
    description: Optional[str] = Field(None, max_length=255)
    payment_method: Optional[str] = Field("UPI", pattern="^(UPI|Cash|Card|NetBanking|Other)$")
    expense_type: Optional[str] = Field("Variable", pattern="^(Fixed|Variable)$")


class ExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = Field(None, gt=0.0)
    description: Optional[str] = Field(None, max_length=255)
    date: Optional[dt_date] = None
    payment_method: Optional[str] = Field(None, pattern="^(UPI|Cash|Card|NetBanking|Other)$")
    expense_type: Optional[str] = Field(None, pattern="^(Fixed|Variable)$")


class ExpenseResponse(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: dt_datetime
    category: Optional[CategoryResponse] = None


class ExpenseFilterParams(BaseModel):
    search: Optional[str] = None
    category_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    expense_type: Optional[str] = None
    payment_method: Optional[str] = None
    sort_by: str = "date"
    sort_desc: bool = True
    page: int = 1
    limit: int = 20


class PaginatedExpenses(BaseModel):
    items: List[ExpenseResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    total_amount: float
