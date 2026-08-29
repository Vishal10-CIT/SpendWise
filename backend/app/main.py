from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.database.session import init_db
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application startup
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SpendWise — Smart College Student Finance Manager & Decision Support Platform API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware configuration
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(expenses_router, prefix=api_prefix)
app.include_router(income_router, prefix=api_prefix)
app.include_router(categories_router, prefix=api_prefix)
app.include_router(recurring_router, prefix=api_prefix)
app.include_router(budgets_router, prefix=api_prefix)
app.include_router(savings_router, prefix=api_prefix)
app.include_router(decision_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(csv_router, prefix=api_prefix)
app.include_router(health_router, prefix=api_prefix)
app.include_router(health_router)  # Also mount /health at root for Docker healthchecks


@app.get("/")
def root_endpoint():
    return {
        "message": "Welcome to SpendWise API",
        "docs": "/docs",
        "health": "/health",
        "version": settings.VERSION
    }
