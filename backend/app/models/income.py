from sqlalchemy import Column, Integer, String, Float, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source = Column(String(100), nullable=False)  # Allowance, Part-time, Scholarship, Freelance, Family, Other
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False, index=True)
    recurring = Column(Boolean, default=False, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="incomes")
