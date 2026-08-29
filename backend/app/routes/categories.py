from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.category import Category
from app.models.expense import Expense
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryGroupedResponse
)
from app.services.auth_service import get_current_user
from app.services.category_service import get_user_categories

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all categories available to current user."""
    return get_user_categories(db, current_user.id)


@router.get("/grouped", response_model=List[CategoryGroupedResponse])
def list_grouped_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve categories grouped by taxonomy."""
    categories = get_user_categories(db, current_user.id)
    grouped_dict = {}
    for cat in categories:
        if cat.group not in grouped_dict:
            grouped_dict[cat.group] = []
        grouped_dict[cat.group].append(CategoryResponse.model_validate(cat))

    return [
        CategoryGroupedResponse(group=group, categories=cats)
        for group, cats in grouped_dict.items()
    ]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new custom user category."""
    # Check duplicate category name for this user
    existing = db.query(Category).filter(
        Category.user_id == current_user.id,
        Category.name.ilike(cat_in.name.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A category with this name already exists.")

    new_cat = Category(
        user_id=current_user.id,
        name=cat_in.name.strip(),
        group=cat_in.group.strip() if cat_in.group else "Custom",
        icon=cat_in.icon or "tag",
        color=cat_in.color or "#6366F1",
        is_default=False,
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat


@router.put("/{cat_id}", response_model=CategoryResponse)
def update_category(
    cat_id: int,
    cat_in: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update custom category details."""
    category = db.query(Category).filter(
        Category.id == cat_id,
        Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found or cannot edit default system category.")

    if cat_in.name is not None:
        category.name = cat_in.name.strip()
    if cat_in.group is not None:
        category.group = cat_in.group.strip()
    if cat_in.icon is not None:
        category.icon = cat_in.icon
    if cat_in.color is not None:
        category.color = cat_in.color

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a custom category if not in use."""
    category = db.query(Category).filter(
        Category.id == cat_id,
        Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")

    # Check if category is used by expenses
    used_count = db.query(Expense).filter(Expense.category_id == cat_id).count()
    if used_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category because it is assigned to {used_count} expense record(s)."
        )

    db.delete(category)
    db.commit()
    return None
