from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database.session import get_db
from app.models.user import User
from app.models.recurring_expense import RecurringExpense
from app.models.category import Category
from app.schemas.recurring import (
    RecurringExpenseCreate,
    RecurringExpenseUpdate,
    RecurringExpenseResponse,
    UpcomingPayment
)
from app.services.auth_service import get_current_user
from app.services.finance_service import get_monthly_recurring_allocation

router = APIRouter(prefix="/recurring-expenses", tags=["Recurring Expenses"])


@router.get("", response_model=List[RecurringExpenseResponse])
def list_recurring_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all recurring subscriptions and commitments with amortized monthly allocation."""
    items = db.query(RecurringExpense).options(joinedload(RecurringExpense.category)).filter(
        RecurringExpense.user_id == current_user.id
    ).order_by(RecurringExpense.next_payment_date).all()

    results = []
    for item in items:
        monthly_alloc = get_monthly_recurring_allocation(item.amount, item.frequency)
        resp_item = RecurringExpenseResponse(
            id=item.id,
            user_id=item.user_id,
            category_id=item.category_id,
            name=item.name,
            amount=item.amount,
            frequency=item.frequency,
            next_payment_date=item.next_payment_date,
            is_active=item.is_active,
            notes=item.notes,
            created_at=item.created_at,
            monthly_allocation=monthly_alloc,
            category=item.category
        )
        results.append(resp_item)

    return results


@router.get("/upcoming", response_model=List[UpcomingPayment])
def list_upcoming_payments(
    days_ahead: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve recurring commitments coming due in the next X days with countdown."""
    today = date.today()
    cutoff = today + timedelta(days=days_ahead)

    items = db.query(RecurringExpense).options(joinedload(RecurringExpense.category)).filter(
        RecurringExpense.user_id == current_user.id,
        RecurringExpense.is_active == True,
        RecurringExpense.next_payment_date <= cutoff
    ).order_by(RecurringExpense.next_payment_date).all()

    upcoming: List[UpcomingPayment] = []
    for item in items:
        days_diff = (item.next_payment_date - today).days
        if days_diff < 0:
            status_text = "Overdue"
        elif days_diff <= 5:
            status_text = "Due Soon"
        else:
            status_text = "Upcoming"

        upcoming.append(UpcomingPayment(
            id=item.id,
            name=item.name,
            amount=item.amount,
            category_name=item.category.name if item.category else "General",
            category_color=item.category.color if item.category else "#6366F1",
            category_icon=item.category.icon if item.category else "repeat",
            frequency=item.frequency,
            next_payment_date=item.next_payment_date,
            days_until_due=days_diff,
            status=status_text
        ))

    return upcoming


@router.post("", response_model=RecurringExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_expense(
    rec_in: RecurringExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new recurring expense or subscription."""
    category = db.query(Category).filter(
        Category.id == rec_in.category_id,
        (Category.user_id == current_user.id) | (Category.user_id == None)
    ).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category.")

    new_rec = RecurringExpense(
        user_id=current_user.id,
        category_id=rec_in.category_id,
        name=rec_in.name.strip(),
        amount=rec_in.amount,
        frequency=rec_in.frequency,
        next_payment_date=rec_in.next_payment_date,
        is_active=rec_in.is_active,
        notes=rec_in.notes.strip() if rec_in.notes else None,
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)

    monthly_alloc = get_monthly_recurring_allocation(new_rec.amount, new_rec.frequency)
    return RecurringExpenseResponse(
        id=new_rec.id,
        user_id=new_rec.user_id,
        category_id=new_rec.category_id,
        name=new_rec.name,
        amount=new_rec.amount,
        frequency=new_rec.frequency,
        next_payment_date=new_rec.next_payment_date,
        is_active=new_rec.is_active,
        notes=new_rec.notes,
        created_at=new_rec.created_at,
        monthly_allocation=monthly_alloc,
        category=category
    )


@router.put("/{rec_id}", response_model=RecurringExpenseResponse)
def update_recurring_expense(
    rec_id: int,
    rec_in: RecurringExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update recurring expense parameters."""
    item = db.query(RecurringExpense).filter(
        RecurringExpense.id == rec_id,
        RecurringExpense.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recurring expense not found.")

    if rec_in.category_id is not None:
        category = db.query(Category).filter(
            Category.id == rec_in.category_id,
            (Category.user_id == current_user.id) | (Category.user_id == None)
        ).first()
        if not category:
            raise HTTPException(status_code=400, detail="Invalid category.")
        item.category_id = rec_in.category_id

    if rec_in.name is not None:
        item.name = rec_in.name.strip()
    if rec_in.amount is not None:
        item.amount = rec_in.amount
    if rec_in.frequency is not None:
        item.frequency = rec_in.frequency
    if rec_in.next_payment_date is not None:
        item.next_payment_date = rec_in.next_payment_date
    if rec_in.is_active is not None:
        item.is_active = rec_in.is_active
    if rec_in.notes is not None:
        item.notes = rec_in.notes.strip()

    db.commit()
    db.refresh(item)

    monthly_alloc = get_monthly_recurring_allocation(item.amount, item.frequency)
    return RecurringExpenseResponse(
        id=item.id,
        user_id=item.user_id,
        category_id=item.category_id,
        name=item.name,
        amount=item.amount,
        frequency=item.frequency,
        next_payment_date=item.next_payment_date,
        is_active=item.is_active,
        notes=item.notes,
        created_at=item.created_at,
        monthly_allocation=monthly_alloc,
        category=item.category
    )


@router.delete("/{rec_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_expense(
    rec_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a recurring expense."""
    item = db.query(RecurringExpense).filter(
        RecurringExpense.id == rec_id,
        RecurringExpense.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recurring expense not found.")

    db.delete(item)
    db.commit()
    return None
