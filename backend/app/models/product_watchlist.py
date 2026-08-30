from sqlalchemy import Column, Integer, String, Float, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base


class ProductWatchlist(Base):
    __tablename__ = "product_watchlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_name = Column(String(200), nullable=False)
    product_url = Column(String(1000), nullable=False)
    store_source = Column(String(100), default="Generic Store", nullable=False)
    target_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=True)
    lowest_price = Column(Float, nullable=True)
    highest_price = Column(Float, nullable=True)
    purchase_deadline = Column(Date, nullable=True)
    tracking_status = Column(String(50), default="Watching", nullable=False)  # Watching, Target Reached, Price Dropped, Deadline Approaching, Tracking Unavailable, Purchased, Stopped
    is_tracking_active = Column(Boolean, default=True, nullable=False)
    last_checked_at = Column(DateTime, nullable=True)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="watchlist_items")
    price_history = relationship(
        "ProductPriceHistory",
        back_populates="watchlist_item",
        cascade="all, delete-orphan",
        order_by="desc(ProductPriceHistory.checked_at)"
    )
