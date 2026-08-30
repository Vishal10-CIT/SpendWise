from app.services.auth_service import register_user, authenticate_user, get_current_user
from app.services.category_service import seed_user_categories, get_user_categories
from app.services.finance_service import calculate_user_financial_profile, get_monthly_recurring_allocation
from app.services.affordability_service import check_affordability
from app.services.spending_pace_service import calculate_spending_pace
from app.services.budget_simulator_service import run_budget_simulation
from app.services.budget_health_service import calculate_budget_health_score
from app.services.alert_service import generate_user_spending_alerts
from app.services.csv_service import preview_csv_content, validate_csv_mapping, execute_csv_import
from app.services.renewal_service import (
    calculate_next_renewal_date,
    get_user_reminders,
    mark_recurring_paid_and_advance,
)
from app.services.price_tracker import (
    list_user_watchlist,
    create_watchlist_item,
    update_watchlist_item,
    delete_watchlist_item,
    check_item_price,
    stop_tracking_item,
    mark_item_purchased,
    evaluate_product_affordability,
)

__all__ = [
    "register_user",
    "authenticate_user",
    "get_current_user",
    "seed_user_categories",
    "get_user_categories",
    "calculate_user_financial_profile",
    "get_monthly_recurring_allocation",
    "check_affordability",
    "calculate_spending_pace",
    "run_budget_simulation",
    "calculate_budget_health_score",
    "generate_user_spending_alerts",
    "preview_csv_content",
    "validate_csv_mapping",
    "execute_csv_import",
    "calculate_next_renewal_date",
    "get_user_reminders",
    "mark_recurring_paid_and_advance",
    "list_user_watchlist",
    "create_watchlist_item",
    "update_watchlist_item",
    "delete_watchlist_item",
    "check_item_price",
    "stop_tracking_item",
    "mark_item_purchased",
    "evaluate_product_affordability",
]
