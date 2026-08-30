from pydantic import BaseModel, Field, ConfigDict, HttpUrl, field_validator
from typing import Optional, List
from datetime import date, datetime


class WatchlistItemCreate(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=200)
    product_url: str = Field(..., min_length=5, max_length=1000)
    target_price: float = Field(..., gt=0.0)
    store_source: Optional[str] = Field(None, max_length=100)
    purchase_deadline: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=255)


class WatchlistItemUpdate(BaseModel):
    product_name: Optional[str] = Field(None, min_length=1, max_length=200)
    product_url: Optional[str] = Field(None, min_length=5, max_length=1000)
    target_price: Optional[float] = Field(None, gt=0.0)
    store_source: Optional[str] = Field(None, max_length=100)
    purchase_deadline: Optional[date] = None
    is_tracking_active: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=255)


class PriceHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    watchlist_id: int
    price: float
    checked_at: datetime


class WatchlistAffordabilityInfo(BaseModel):
    status: str  # Affordable, Caution, Not Recommended
    status_badge: str
    current_flexible_spending: float
    target_price: float
    flexible_after_purchase: float
    explanation: str


class WatchlistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    product_name: str
    product_url: str
    store_source: str
    target_price: float
    current_price: Optional[float] = None
    lowest_price: Optional[float] = None
    highest_price: Optional[float] = None
    price_difference: Optional[float] = None
    price_change_recent: Optional[float] = None
    purchase_deadline: Optional[date] = None
    days_until_deadline: Optional[int] = None
    tracking_status: str
    is_tracking_active: bool
    last_checked_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    affordability: Optional[WatchlistAffordabilityInfo] = None
    price_history: List[PriceHistoryItem] = Field(default_factory=list)


class PriceCheckResult(BaseModel):
    watchlist_id: int
    product_name: str
    previous_price: Optional[float] = None
    current_price: Optional[float] = None
    target_price: float
    tracking_status: str
    message: str
    alert_triggered: Optional[str] = None
