from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.category import CategoryResponse


class BudgetBase(BaseModel):
    category_id: Optional[int] = None
    amount: float = Field(..., gt=0.0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2050)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: float = Field(..., gt=0.0)


class BudgetResponse(BudgetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    category: Optional[CategoryResponse] = None


class CategoryBudgetProgress(BaseModel):
    id: Optional[int] = None
    category_id: Optional[int] = None
    category_name: str
    category_group: str
    category_icon: str
    category_color: str
    budgeted_amount: float
    spent_amount: float
    remaining_amount: float
    percentage_used: float
    status: str
    is_overall: bool = False


class MonthlyBudgetOverview(BaseModel):
    month: int
    year: int
    total_budgeted: float
    total_spent: float
    remaining_budget: float
    percentage_used: float
    status: str
    category_progress: List[CategoryBudgetProgress]
