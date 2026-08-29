from app.routes.auth import router as auth_router
from app.routes.expenses import router as expenses_router
from app.routes.income import router as income_router
from app.routes.categories import router as categories_router
from app.routes.recurring import router as recurring_router
from app.routes.budgets import router as budgets_router
from app.routes.savings import router as savings_router
from app.routes.decision_support import router as decision_router
from app.routes.analytics import router as analytics_router
from app.routes.csv_import import router as csv_router
from app.routes.health import router as health_router

__all__ = [
    "auth_router",
    "expenses_router",
    "income_router",
    "categories_router",
    "recurring_router",
    "budgets_router",
    "savings_router",
    "decision_router",
    "analytics_router",
    "csv_router",
    "health_router",
]
