import logging
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.product_watchlist import ProductWatchlist
from app.models.product_price_history import ProductPriceHistory
from app.schemas.watchlist import (
    WatchlistItemCreate,
    WatchlistItemUpdate,
    WatchlistItemResponse,
    PriceHistoryItem,
    WatchlistAffordabilityInfo,
    PriceCheckResult,
)
from app.services.price_tracker.base import is_safe_url, detect_store_source, BasePriceProvider
from app.services.price_tracker.amazon_adapter import AmazonAdapter
from app.services.price_tracker.flipkart_adapter import FlipkartAdapter
from app.services.price_tracker.generic_adapter import GenericStoreAdapter
from app.services.price_tracker.mock_adapter import MockPriceProvider
from app.services.finance_service import calculate_user_financial_profile

logger = logging.getLogger(__name__)

# Global singleton mock provider for testing injection
mock_provider = MockPriceProvider()

# Registry of adapters in priority order
PROVIDERS: List[BasePriceProvider] = [
    mock_provider,
    AmazonAdapter(),
    FlipkartAdapter(),
    GenericStoreAdapter(),
]


def get_provider_for_url(url: str) -> BasePriceProvider:
    """Find the first matching provider for a given URL."""
    for provider in PROVIDERS:
        if provider.can_handle(url):
            return provider
    return GenericStoreAdapter()


def evaluate_product_affordability(
    db: Session,
    user_id: int,
    price_to_check: float,
) -> WatchlistAffordabilityInfo:
    """
    Reuses existing SpendWise financial profile and flexible spending logic
    to evaluate if the target/current product price is affordable for the student.
    """
    today = date.today()
    try:
        profile = calculate_user_financial_profile(db, user_id, today.month, today.year)
        curr_flexible = profile["remaining_flexible_spending"]
        flex_after = round(curr_flexible - price_to_check, 2)

        if flex_after >= (profile["total_flexible_budget"] * 0.15) and flex_after >= 0:
            status_label = "Affordable"
            badge = "🟢 Affordable"
            explanation = (
                f"Comfortably fits within your current flexible budget (₹{curr_flexible:,.2f}). "
                f"You will have ₹{flex_after:,.2f} remaining."
            )
        elif flex_after >= 0:
            status_label = "Caution"
            badge = "🟡 Caution"
            explanation = (
                f"You can afford this, but it will leave a tight flexible buffer of ₹{flex_after:,.2f}."
            )
        else:
            status_label = "Not Recommended"
            badge = "🔴 Not Recommended"
            deficit = abs(flex_after)
            explanation = (
                f"This purchase exceeds your current flexible spending capacity by ₹{deficit:,.2f} "
                f"(Current Flexible: ₹{curr_flexible:,.2f})."
            )

        return WatchlistAffordabilityInfo(
            status=status_label,
            status_badge=badge,
            current_flexible_spending=curr_flexible,
            target_price=price_to_check,
            flexible_after_purchase=flex_after,
            explanation=explanation,
        )
    except Exception as e:
        logger.warning(f"Error evaluating affordability for user {user_id}: {e}")
        return WatchlistAffordabilityInfo(
            status="Affordable",
            status_badge="🟢 Affordable",
            current_flexible_spending=0.0,
            target_price=price_to_check,
            flexible_after_purchase=0.0,
            explanation="Financial profile could not be loaded.",
        )


def build_watchlist_response(
    item: ProductWatchlist,
    db: Optional[Session] = None,
    include_history: bool = True
) -> WatchlistItemResponse:
    """Convert ProductWatchlist entity to comprehensive response with calculated fields."""
    today = date.today()

    # Price difference
    diff = None
    if item.current_price is not None:
        diff = round(item.current_price - item.target_price, 2)

    # Days until deadline
    days_left = None
    if item.purchase_deadline:
        days_left = (item.purchase_deadline - today).days

    # Price history list
    history_items: List[PriceHistoryItem] = []
    price_change_recent = None

    if include_history and item.price_history:
        # Sorted desc by checked_at
        sorted_history = sorted(item.price_history, key=lambda h: h.checked_at, reverse=True)
        history_items = [
            PriceHistoryItem(
                id=h.id,
                watchlist_id=h.watchlist_id,
                price=h.price,
                checked_at=h.checked_at,
            )
            for h in sorted_history[:30]
        ]
        if len(sorted_history) >= 2:
            price_change_recent = round(sorted_history[0].price - sorted_history[1].price, 2)

    # Affordability info
    affordability = None
    if db and item.user_id:
        price_to_eval = item.current_price if item.current_price is not None else item.target_price
        affordability = evaluate_product_affordability(db, item.user_id, price_to_eval)

    return WatchlistItemResponse(
        id=item.id,
        user_id=item.user_id,
        product_name=item.product_name,
        product_url=item.product_url,
        store_source=item.store_source,
        target_price=item.target_price,
        current_price=item.current_price,
        lowest_price=item.lowest_price,
        highest_price=item.highest_price,
        price_difference=diff,
        price_change_recent=price_change_recent,
        purchase_deadline=item.purchase_deadline,
        days_until_deadline=days_left,
        tracking_status=item.tracking_status,
        is_tracking_active=item.is_tracking_active,
        last_checked_at=item.last_checked_at,
        notes=item.notes,
        created_at=item.created_at,
        updated_at=item.updated_at,
        affordability=affordability,
        price_history=history_items,
    )


def list_user_watchlist(db: Session, user_id: int) -> List[WatchlistItemResponse]:
    """Retrieve all watchlist items for the authenticated user."""
    items = db.query(ProductWatchlist).options(
        joinedload(ProductWatchlist.price_history)
    ).filter(
        ProductWatchlist.user_id == user_id
    ).order_by(ProductWatchlist.created_at.desc()).all()

    return [build_watchlist_response(item, db=db, include_history=True) for item in items]


def create_watchlist_item(
    db: Session,
    user_id: int,
    item_in: WatchlistItemCreate
) -> WatchlistItemResponse:
    """Create a new product tracking item in the watchlist."""
    url = item_in.product_url.strip()
    if not is_safe_url(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product URL. Only safe HTTP/HTTPS store URLs are permitted."
        )

    store = item_in.store_source or detect_store_source(url)

    new_item = ProductWatchlist(
        user_id=user_id,
        product_name=item_in.product_name.strip(),
        product_url=url,
        store_source=store,
        target_price=item_in.target_price,
        purchase_deadline=item_in.purchase_deadline,
        notes=item_in.notes.strip() if item_in.notes else None,
        tracking_status="Watching",
        is_tracking_active=True,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # Initial price check
    check_item_price(db, new_item.id, user_id)
    db.refresh(new_item)

    return build_watchlist_response(new_item, db=db, include_history=True)


def update_watchlist_item(
    db: Session,
    watchlist_id: int,
    user_id: int,
    item_in: WatchlistItemUpdate
) -> WatchlistItemResponse:
    """Update user's tracked product attributes."""
    item = db.query(ProductWatchlist).filter(
        ProductWatchlist.id == watchlist_id,
        ProductWatchlist.user_id == user_id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found.")

    if item_in.product_name is not None:
        item.product_name = item_in.product_name.strip()

    if item_in.product_url is not None:
        url = item_in.product_url.strip()
        if not is_safe_url(url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid product URL. Only safe HTTP/HTTPS store URLs are permitted."
            )
        item.product_url = url
        if not item_in.store_source:
            item.store_source = detect_store_source(url)

    if item_in.store_source is not None:
        item.store_source = item_in.store_source.strip()

    if item_in.target_price is not None:
        item.target_price = item_in.target_price
        # Re-evaluate status against current price
        if item.current_price is not None:
            if item.current_price <= item.target_price:
                item.tracking_status = "Target Reached"
            elif item.tracking_status == "Target Reached":
                item.tracking_status = "Watching"

    if item_in.purchase_deadline is not None:
        item.purchase_deadline = item_in.purchase_deadline

    if item_in.is_tracking_active is not None:
        item.is_tracking_active = item_in.is_tracking_active
        if not item.is_tracking_active and item.tracking_status != "Purchased":
            item.tracking_status = "Stopped"

    if item_in.notes is not None:
        item.notes = item_in.notes.strip()

    db.commit()
    db.refresh(item)
    return build_watchlist_response(item, db=db, include_history=True)


def delete_watchlist_item(db: Session, watchlist_id: int, user_id: int) -> None:
    """Delete a watchlist item and its price history."""
    item = db.query(ProductWatchlist).filter(
        ProductWatchlist.id == watchlist_id,
        ProductWatchlist.user_id == user_id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found.")

    db.delete(item)
    db.commit()


def check_item_price(db: Session, watchlist_id: int, user_id: int) -> PriceCheckResult:
    """
    Execute price retrieval from permitted provider, compare with target,
    record observation, and update tracking status.
    """
    item = db.query(ProductWatchlist).filter(
        ProductWatchlist.id == watchlist_id,
        ProductWatchlist.user_id == user_id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found.")

    prev_price = item.current_price
    provider = get_provider_for_url(item.product_url)
    fetched_price = provider.fetch_price(item.product_url)

    now = datetime.utcnow()
    item.last_checked_at = now
    alert_msg = None
    today = date.today()

    if fetched_price is None:
        # Price could not be retrieved
        if item.current_price is None:
            item.tracking_status = "Tracking Unavailable"
        message = "Unable to retrieve the current price from store provider."
    else:
        fetched_price = round(fetched_price, 2)
        item.current_price = fetched_price

        # Update high/low
        if item.lowest_price is None or fetched_price < item.lowest_price:
            item.lowest_price = fetched_price
        if item.highest_price is None or fetched_price > item.highest_price:
            item.highest_price = fetched_price

        # Record history observation
        history = ProductPriceHistory(
            watchlist_id=item.id,
            price=fetched_price,
            checked_at=now
        )
        db.add(history)

        # Check status & alerts
        if fetched_price <= item.target_price:
            item.tracking_status = "Target Reached"
            delta = round(item.target_price - fetched_price, 2)
            alert_msg = f"Target price reached! ₹{fetched_price:,.2f} is ₹{delta:,.2f} below your ₹{item.target_price:,.2f} target."
            message = f"🎯 Target price reached for {item.product_name}!"
        elif prev_price is not None and fetched_price < prev_price:
            drop_amount = round(prev_price - fetched_price, 2)
            item.tracking_status = "Price Dropped"
            alert_msg = f"Price dropped by ₹{drop_amount:,.2f} (from ₹{prev_price:,.2f} to ₹{fetched_price:,.2f})."
            message = f"📉 Price dropped for {item.product_name} by ₹{drop_amount:,.2f}."
        elif item.purchase_deadline and (item.purchase_deadline - today).days <= 7 and (item.purchase_deadline - today).days >= 0:
            item.tracking_status = "Deadline Approaching"
            days_left = (item.purchase_deadline - today).days
            message = f"⚠️ Purchase deadline approaching ({days_left} days left). Current price: ₹{fetched_price:,.2f}."
        else:
            item.tracking_status = "Watching"
            message = f"Price updated: ₹{fetched_price:,.2f}."

    db.commit()
    db.refresh(item)

    return PriceCheckResult(
        watchlist_id=item.id,
        product_name=item.product_name,
        previous_price=prev_price,
        current_price=item.current_price,
        target_price=item.target_price,
        tracking_status=item.tracking_status,
        message=message,
        alert_triggered=alert_msg
    )


def stop_tracking_item(db: Session, watchlist_id: int, user_id: int) -> WatchlistItemResponse:
    """Pause tracking for a product."""
    item = db.query(ProductWatchlist).filter(
        ProductWatchlist.id == watchlist_id,
        ProductWatchlist.user_id == user_id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found.")

    item.is_tracking_active = False
    item.tracking_status = "Stopped"
    db.commit()
    db.refresh(item)
    return build_watchlist_response(item, db=db, include_history=True)


def mark_item_purchased(db: Session, watchlist_id: int, user_id: int) -> WatchlistItemResponse:
    """Mark item as purchased and archive from active price checking."""
    item = db.query(ProductWatchlist).filter(
        ProductWatchlist.id == watchlist_id,
        ProductWatchlist.user_id == user_id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found.")

    item.is_tracking_active = False
    item.tracking_status = "Purchased"
    db.commit()
    db.refresh(item)
    return build_watchlist_response(item, db=db, include_history=True)
