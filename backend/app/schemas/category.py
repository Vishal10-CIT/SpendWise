from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    group: str = Field("Other", max_length=50)
    icon: str = Field("tag", max_length=50)
    color: str = Field("#4F46E5", max_length=30)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=80)
    group: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    is_default: bool
    created_at: datetime


class CategoryGroupedResponse(BaseModel):
    group: str
    categories: List[CategoryResponse]
