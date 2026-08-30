from sqlalchemy import Column, Integer, String, Float, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base


class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(String(30), default="Monthly", nullable=False)  # Weekly, Monthly, Quarterly, Semi-Annually / Every 6 months, Annually / Yearly
    next_payment_date = Column(Date, nullable=False, index=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    reminder_days = Column(String(100), default="[7, 3, 1, 0]", nullable=True)  # JSON array string e.g. "[7, 3, 1, 0]"
    last_paid_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="recurring_expenses")
    category = relationship("Category", back_populates="recurring_expenses")
