import math
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc
from app.database.session import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.category import Category
from app.schemas.expense import (
    ExpenseCreate,
    QuickExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    PaginatedExpenses
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("", response_model=PaginatedExpenses)
def list_expenses(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    expense_type: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    sort_by: str = Query("date"),
    sort_desc: bool = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve filtered, sorted, paginated expenses for authenticated student."""
    query = db.query(Expense).options(joinedload(Expense.category)).filter(Expense.user_id == current_user.id)

    # Filters
    if search:
        query = query.filter(Expense.description.ilike(f"%{search.strip()}%"))
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    if expense_type:
        query = query.filter(Expense.expense_type == expense_type)
    if payment_method:
        query = query.filter(Expense.payment_method == payment_method)

    # Calculate total matching count & sum
    total_items = query.count()
    all_matching = query.all()
    total_amount = sum(e.amount for e in all_matching)

    # Sorting
    sort_col = Expense.date
    if sort_by == "amount":
        sort_col = Expense.amount
    elif sort_by == "created_at":
        sort_col = Expense.created_at

    if sort_desc:
        query = query.order_by(desc(sort_col), desc(Expense.id))
    else:
        query = query.order_by(asc(sort_col), asc(Expense.id))

    # Pagination
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()
    total_pages = max(1, math.ceil(total_items / limit))

    return PaginatedExpenses(
        items=items,
        total=total_items,
        page=page,
        limit=limit,
        total_pages=total_pages,
        total_amount=round(total_amount, 2),
    )


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log a new expense."""
    # Verify category ownership
    category = db.query(Category).filter(
        Category.id == expense_in.category_id,
        (Category.user_id == current_user.id) | (Category.user_id == None)
    ).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category selected.")

    new_expense = Expense(
        user_id=current_user.id,
        category_id=expense_in.category_id,
        amount=expense_in.amount,
        description=expense_in.description.strip() if expense_in.description else "",
        date=expense_in.date,
        payment_method=expense_in.payment_method,
        expense_type=expense_in.expense_type,
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense


@router.post("/quick", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def quick_create_expense(
    quick_in: QuickExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ultra-fast 2-click expense logger with today's date default."""
    category = db.query(Category).filter(
        Category.id == quick_in.category_id,
        (Category.user_id == current_user.id) | (Category.user_id == None)
    ).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category selected.")

    new_expense = Expense(
        user_id=current_user.id,
        category_id=quick_in.category_id,
        amount=quick_in.amount,
        description=quick_in.description.strip() if quick_in.description else f"{category.name} Expense",
        date=date.today(),
        payment_method=quick_in.payment_method or "UPI",
        expense_type=quick_in.expense_type or "Variable",
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single expense details."""
    expense = db.query(Expense).options(joinedload(Expense.category)).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_in: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update existing expense record."""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")

    if expense_in.category_id is not None:
        category = db.query(Category).filter(
            Category.id == expense_in.category_id,
            (Category.user_id == current_user.id) | (Category.user_id == None)
        ).first()
        if not category:
            raise HTTPException(status_code=400, detail="Invalid category.")
        expense.category_id = expense_in.category_id

    if expense_in.amount is not None:
        expense.amount = expense_in.amount
    if expense_in.description is not None:
        expense.description = expense_in.description.strip()
    if expense_in.date is not None:
        expense.date = expense_in.date
    if expense_in.payment_method is not None:
        expense.payment_method = expense_in.payment_method
    if expense_in.expense_type is not None:
        expense.expense_type = expense_in.expense_type

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an expense record."""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")

    db.delete(expense)
    db.commit()
    return None
