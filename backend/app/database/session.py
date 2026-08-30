import time
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import OperationalError
from app.core.config import settings

logger = logging.getLogger(__name__)


def build_engine(db_url: str):
    """Build SQLAlchemy engine supporting both SQLite and PostgreSQL."""
    if db_url.startswith("sqlite"):
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
        )
    return create_engine(
        db_url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=300,
    )


engine = build_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that provides a SQLAlchemy session per request."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db(max_retries: int = 2, retry_interval: int = 1):
    """Create all database tables on application startup with fallback to SQLite if PostgreSQL is unreachable."""
    global engine, SessionLocal

    # Import all models to ensure they are registered on Base.metadata
    import app.models.user  # noqa: F401
    import app.models.category  # noqa: F401
    import app.models.income  # noqa: F401
    import app.models.expense  # noqa: F401
    import app.models.recurring_expense  # noqa: F401
    import app.models.budget  # noqa: F401
    import app.models.savings_goal  # noqa: F401
    import app.models.product_watchlist  # noqa: F401
    import app.models.product_price_history  # noqa: F401

    if settings.DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
        logger.info("SQLite database initialized successfully.")
        return

    # Try connecting to PostgreSQL
    connected = False
    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("PostgreSQL database tables initialized successfully.")
            connected = True
            break
        except OperationalError as e:
            logger.warning(
                f"PostgreSQL connection attempt {attempt}/{max_retries} failed: {e}"
            )
            if attempt < max_retries:
                time.sleep(retry_interval)

    if not connected:
        logger.warning(
            "Could not connect to PostgreSQL. Falling back to local SQLite database (spendwise.db)."
        )
        sqlite_url = "sqlite:///./spendwise.db"
        engine = build_engine(sqlite_url)
        SessionLocal.configure(bind=engine)
        Base.metadata.create_all(bind=engine)
        logger.info("SQLite fallback database initialized successfully.")
