from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.product_watchlist import ProductWatchlist
from app.schemas.watchlist import (
    WatchlistItemCreate,
    WatchlistItemUpdate,
    WatchlistItemResponse,
    PriceCheckResult,
)
from app.services.auth_service import get_current_user
from app.services.price_tracker.service import (
    list_user_watchlist,
    create_watchlist_item,
    update_watchlist_item,
    delete_watchlist_item,
    check_item_price,
    stop_tracking_item,
    mark_item_purchased,
    build_watchlist_response,
)

router = APIRouter(prefix="/watchlist", tags=["Purchase Watchlist"])


@router.get("", response_model=List[WatchlistItemResponse])
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all products in student's Purchase Watchlist with price metrics and affordability."""
    return list_user_watchlist(db, current_user.id)


@router.post("", response_model=WatchlistItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    item_in: WatchlistItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new product to Purchase Watchlist with target price and optional deadline."""
    return create_watchlist_item(db, current_user.id, item_in)


@router.get("/{watchlist_id}", response_model=WatchlistItemResponse)
def get_watchlist_item(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single product details with 30-day price observation history."""
    item = db.query(ProductWatchlist).filter(
        ProductWatchlist.id == watchlist_id,
        ProductWatchlist.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found.")
    return build_watchlist_response(item, db=db, include_history=True)


@router.put("/{watchlist_id}", response_model=WatchlistItemResponse)
def update_watchlist(
    watchlist_id: int,
    item_in: WatchlistItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update target price, purchase deadline, or product details."""
    return update_watchlist_item(db, watchlist_id, current_user.id, item_in)


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a product from Purchase Watchlist."""
    delete_watchlist_item(db, watchlist_id, current_user.id)
    return None


@router.post("/{watchlist_id}/check-price", response_model=PriceCheckResult)
def refresh_item_price(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Execute live price check for product and evaluate target/drop alerts."""
    return check_item_price(db, watchlist_id, current_user.id)


@router.post("/{watchlist_id}/stop-tracking", response_model=WatchlistItemResponse)
def pause_tracking(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stop active price checks for product."""
    return stop_tracking_item(db, watchlist_id, current_user.id)


@router.post("/{watchlist_id}/mark-purchased", response_model=WatchlistItemResponse)
def complete_purchase(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark product as purchased and archive tracking."""
    return mark_item_purchased(db, watchlist_id, current_user.id)
