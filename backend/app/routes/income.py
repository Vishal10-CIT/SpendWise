from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import extract, desc
from app.database.session import get_db
from app.models.user import User
from app.models.income import Income
from app.schemas.income import (
    IncomeCreate,
    IncomeUpdate,
    IncomeResponse,
    MonthlyIncomeSummary
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/income", tags=["Income"])


@router.get("", response_model=List[IncomeResponse])
def list_income(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all income entries for student, optionally filtered by month/year."""
    query = db.query(Income).filter(Income.user_id == current_user.id)
    if month:
        query = query.filter(extract("month", Income.date) == month)
    if year:
        query = query.filter(extract("year", Income.date) == year)

    return query.order_by(desc(Income.date), desc(Income.id)).all()


@router.get("/monthly-summary", response_model=MonthlyIncomeSummary)
def get_monthly_income_summary(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve monthly total income aggregated by source."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    incomes = db.query(Income).filter(
        Income.user_id == current_user.id,
        extract("month", Income.date) == target_month,
        extract("year", Income.date) == target_year
    ).order_by(desc(Income.date)).all()

    total_income = sum(i.amount for i in incomes)
    allowance = sum(i.amount for i in incomes if i.source == "Allowance")
    other_sources = total_income - allowance

    return MonthlyIncomeSummary(
        month=target_month,
        year=target_year,
        total_income=round(total_income, 2),
        allowance=round(allowance, 2),
        other_sources=round(other_sources, 2),
        items=incomes
    )


@router.post("", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    income_in: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a new income or allowance entry."""
    new_income = Income(
        user_id=current_user.id,
        source=income_in.source.strip(),
        amount=income_in.amount,
        date=income_in.date,
        recurring=income_in.recurring,
        description=income_in.description.strip() if income_in.description else "",
    )
    db.add(new_income)
    db.commit()
    db.refresh(new_income)
    return new_income


@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: int,
    income_in: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update income entry."""
    income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == current_user.id
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income entry not found.")

    if income_in.source is not None:
        income.source = income_in.source.strip()
    if income_in.amount is not None:
        income.amount = income_in.amount
    if income_in.date is not None:
        income.date = income_in.date
    if income_in.recurring is not None:
        income.recurring = income_in.recurring
    if income_in.description is not None:
        income.description = income_in.description.strip()

    db.commit()
    db.refresh(income)
    return income


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an income entry."""
    income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == current_user.id
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income entry not found.")

    db.delete(income)
    db.commit()
    return None
