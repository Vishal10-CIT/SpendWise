from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.reminders import ReminderItemResponse
from app.services.auth_service import get_current_user
from app.services.renewal_service import get_user_reminders

router = APIRouter(prefix="/reminders", tags=["Reminders Center"])


@router.get("", response_model=List[ReminderItemResponse])
def list_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all recurring payment reminders for the current student,
    sorted with the nearest upcoming renewals first.
    """
    return get_user_reminders(db, current_user.id)


@router.get("/upcoming", response_model=List[ReminderItemResponse])
def list_upcoming_reminders(
    days_ahead: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get upcoming payment reminders within the next X days (default 30 days)
    for dashboard widgets and quick reminder cards.
    """
    return get_user_reminders(db, current_user.id, days_ahead=days_ahead)
