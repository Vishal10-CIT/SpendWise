from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.savings_goal import SavingsGoal
from app.schemas.savings import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalDeposit,
    SavingsGoalResponse
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/savings-goals", tags=["Savings Goals"])


def format_savings_goal(goal: SavingsGoal) -> SavingsGoalResponse:
    today = date.today()
    remaining = max(0.0, goal.target_amount - goal.current_amount)
    pct = round((goal.current_amount / goal.target_amount) * 100, 1) if goal.target_amount > 0 else 100.0

    days_remaining = None
    recommended_monthly = 0.0
    if remaining > 0:
        if goal.target_date and goal.target_date > today:
            days_remaining = (goal.target_date - today).days
            months_left = max(1, (goal.target_date.year - today.year) * 12 + (goal.target_date.month - today.month))
            recommended_monthly = round(remaining / months_left, 2)
        else:
            recommended_monthly = round(remaining / 6.0, 2)  # 6-month default recommendation

    return SavingsGoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
        description=goal.description,
        created_at=goal.created_at,
        progress_percentage=pct,
        remaining_amount=round(remaining, 2),
        recommended_monthly_saving=recommended_monthly,
        days_remaining=days_remaining,
        is_completed=goal.current_amount >= goal.target_amount
    )


@router.get("", response_model=List[SavingsGoalResponse])
def list_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all student savings goals with progress and recommended savings rates."""
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).order_by(SavingsGoal.created_at).all()
    return [format_savings_goal(g) for g in goals]


@router.post("", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_savings_goal(
    goal_in: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new savings goal (e.g. Laptop, Trip, Phone, Emergency fund)."""
    new_goal = SavingsGoal(
        user_id=current_user.id,
        name=goal_in.name.strip(),
        target_amount=goal_in.target_amount,
        current_amount=goal_in.current_amount,
        target_date=goal_in.target_date,
        description=goal_in.description.strip() if goal_in.description else None,
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return format_savings_goal(new_goal)


@router.post("/{goal_id}/deposit", response_model=SavingsGoalResponse)
def deposit_to_savings_goal(
    goal_id: int,
    deposit_in: SavingsGoalDeposit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add saved money to an active savings goal."""
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    goal.current_amount = round(goal.current_amount + deposit_in.amount, 2)
    db.commit()
    db.refresh(goal)
    return format_savings_goal(goal)


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update_savings_goal(
    goal_id: int,
    goal_in: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update savings goal details."""
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    if goal_in.name is not None:
        goal.name = goal_in.name.strip()
    if goal_in.target_amount is not None:
        goal.target_amount = goal_in.target_amount
    if goal_in.current_amount is not None:
        goal.current_amount = goal_in.current_amount
    if goal_in.target_date is not None:
        goal.target_date = goal_in.target_date
    if goal_in.description is not None:
        goal.description = goal_in.description.strip()

    db.commit()
    db.refresh(goal)
    return format_savings_goal(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a savings goal."""
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    db.delete(goal)
    db.commit()
    return None
