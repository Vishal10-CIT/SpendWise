from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(80), nullable=False)
    group = Column(String(50), nullable=False)  # College, Food, Transport, Lifestyle, Digital, Accommodation, Other, Custom
    icon = Column(String(50), default="tag", nullable=False)
    color = Column(String(30), default="#4F46E5", nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="categories")
    expenses = relationship("Expense", back_populates="category")
    budgets = relationship("Budget", back_populates="category")
    recurring_expenses = relationship("RecurringExpense", back_populates="category")
