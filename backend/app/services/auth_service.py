from datetime import date, datetime
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from app.database.session import get_db
from app.core.security import get_password_hash, verify_password, decode_access_token
from app.models.user import User
from app.models.income import Income
from app.schemas.auth import UserRegister, UserUpdate
from app.services.category_service import seed_user_categories

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def register_user(db: Session, user_in: UserRegister) -> User:
    """Register a new student user, hash password, seed personalized categories, and set initial income."""
    normalized_email = user_in.email.strip().lower()
    
    # Check duplicate email using case-insensitive check
    existing_user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Create user
    new_user = User(
        name=user_in.name.strip(),
        email=normalized_email,
        password_hash=get_password_hash(user_in.password),
        college_name=user_in.college_name.strip() if user_in.college_name else None,
        living_situation=user_in.living_situation,
        monthly_allowance=user_in.monthly_allowance,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Seed default personalized categories
    seed_user_categories(db, new_user)

    # If student configured an initial monthly allowance, add it as this month's initial income
    if user_in.monthly_allowance > 0:
        initial_income = Income(
            user_id=new_user.id,
            source="Allowance",
            amount=user_in.monthly_allowance,
            date=date.today(),
            recurring=True,
            description="Initial monthly student allowance"
        )
        db.add(initial_income)
        db.commit()

    return new_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Verify user credentials and return user object if valid."""
    if not email or not password:
        return None
    normalized_email = email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """FastAPI dependency to extract and authenticate the current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception

    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None:
        raise credentials_exception
    return user


def update_user_profile(db: Session, user: User, update_in: UserUpdate) -> User:
    """Update profile attributes for authenticated user."""
    if update_in.name is not None:
        user.name = update_in.name.strip()
    if update_in.college_name is not None:
        user.college_name = update_in.college_name.strip() if update_in.college_name else None
    if update_in.living_situation is not None:
        user.living_situation = update_in.living_situation
    if update_in.monthly_allowance is not None:
        user.monthly_allowance = update_in.monthly_allowance
    if update_in.password:
        user.password_hash = get_password_hash(update_in.password)

    db.commit()
    db.refresh(user)
    return user
