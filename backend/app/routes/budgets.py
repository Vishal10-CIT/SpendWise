from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract
from app.database.session import get_db
from app.models.user import User
from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    CategoryBudgetProgress,
    MonthlyBudgetOverview
)
from app.services.auth_service import get_current_user
from app.services.category_service import get_user_categories

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("", response_model=List[BudgetResponse])
def list_budgets(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List set budget records for current student user."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    return db.query(Budget).options(joinedload(Budget.category)).filter(
        Budget.user_id == current_user.id,
        Budget.month == target_month,
        Budget.year == target_year
    ).all()


@router.get("/progress", response_model=MonthlyBudgetOverview)
def get_budget_progress(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve detailed category budget progress with warning threshold states."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    # Fetch configured budgets for user
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == target_month,
        Budget.year == target_year
    ).all()

    # Expenses in this month
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        extract("month", Expense.date) == target_month,
        extract("year", Expense.date) == target_year
    ).all()

    # Sum spending by category
    spent_by_category = {}
    total_spent = 0.0
    for exp in expenses:
        spent_by_category[exp.category_id] = spent_by_category.get(exp.category_id, 0.0) + exp.amount
        total_spent += exp.amount

    progress_items: List[CategoryBudgetProgress] = []
    total_budgeted = 0.0

    # Map existing budgets
    budgeted_cat_ids = set()
    for b in budgets:
        if b.category_id:
            budgeted_cat_ids.add(b.category_id)
            cat = db.query(Category).filter(Category.id == b.category_id).first()
            cat_spent = spent_by_category.get(b.category_id, 0.0)
            remaining = b.amount - cat_spent
            pct = round((cat_spent / b.amount) * 100, 1) if b.amount > 0 else 0.0

            if pct > 100.0:
                cat_status = "Exceeded"
            elif pct >= 90.0:
                cat_status = "Near Limit"
            elif pct >= 70.0:
                cat_status = "Approaching Limit"
            else:
                cat_status = "Normal"

            progress_items.append(CategoryBudgetProgress(
                id=b.id,
                category_id=b.category_id,
                category_name=cat.name if cat else "Category",
                category_group=cat.group if cat else "Other",
                category_icon=cat.icon if cat else "tag",
                category_color=cat.color if cat else "#6366F1",
                budgeted_amount=b.amount,
                spent_amount=round(cat_spent, 2),
                remaining_amount=round(remaining, 2),
                percentage_used=pct,
                status=cat_status,
                is_overall=False
            ))
            total_budgeted += b.amount
        else:
            # Overall monthly budget
            total_budgeted = max(total_budgeted, b.amount)

    # Calculate overall stats
    overall_remaining = total_budgeted - total_spent
    overall_pct = round((total_spent / total_budgeted) * 100, 1) if total_budgeted > 0 else 0.0

    if overall_pct > 100.0:
        overall_status = "Exceeded"
    elif overall_pct >= 90.0:
        overall_status = "Near Limit"
    elif overall_pct >= 70.0:
        overall_status = "Approaching Limit"
    else:
        overall_status = "Normal"

    return MonthlyBudgetOverview(
        month=target_month,
        year=target_year,
        total_budgeted=round(total_budgeted, 2),
        total_spent=round(total_spent, 2),
        remaining_budget=round(overall_remaining, 2),
        percentage_used=overall_pct,
        status=overall_status,
        category_progress=progress_items
    )


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def set_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create or update a category or overall budget for the month."""
    if budget_in.category_id:
        category = db.query(Category).filter(
            Category.id == budget_in.category_id,
            (Category.user_id == current_user.id) | (Category.user_id == None)
        ).first()
        if not category:
            raise HTTPException(status_code=400, detail="Invalid category.")

    # Check if budget already exists for this slot; if so, update amount
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == budget_in.category_id,
        Budget.month == budget_in.month,
        Budget.year == budget_in.year
    ).first()

    if existing:
        existing.amount = budget_in.amount
        db.commit()
        db.refresh(existing)
        return existing

    new_budget = Budget(
        user_id=current_user.id,
        category_id=budget_in.category_id,
        amount=budget_in.amount,
        month=budget_in.month,
        year=budget_in.year,
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget_in: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update existing budget limit."""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found.")

    budget.amount = budget_in.amount
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a budget."""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found.")

    db.delete(budget)
    db.commit()
    return None
