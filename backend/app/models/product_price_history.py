from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base


class ProductPriceHistory(Base):
    __tablename__ = "product_price_history"

    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("product_watchlist.id", ondelete="CASCADE"), nullable=False, index=True)
    price = Column(Float, nullable=False)
    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    watchlist_item = relationship("ProductWatchlist", back_populates="price_history")
