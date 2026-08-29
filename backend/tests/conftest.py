import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models.user  # noqa: F401
import app.models.category  # noqa: F401
import app.models.income  # noqa: F401
import app.models.expense  # noqa: F401
import app.models.recurring_expense  # noqa: F401
import app.models.budget  # noqa: F401
import app.models.savings_goal  # noqa: F401
from app.database.session import Base, get_db
from app.main import app

# Check if PostgreSQL test database is configured via environment
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    os.getenv("DATABASE_URL")
)

if TEST_DATABASE_URL and ("postgres" in TEST_DATABASE_URL):
    # Use PostgreSQL test connection
    engine = create_engine(
        TEST_DATABASE_URL,
        pool_pre_ping=True
    )
else:
    # Fallback to in-memory isolated engine for local unit tests without live server
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh tables for each test function."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Register and log in a standard test student user, returning authorization headers."""
    register_data = {
        "name": "Alex Student",
        "email": "alex@college.edu",
        "password": "strongPassword123",
        "college_name": "Apex University",
        "living_situation": "Hostel",
        "monthly_allowance": 12000.0,
    }
    client.post("/api/auth/register", json=register_data)

    login_resp = client.post("/api/auth/login", json={
        "email": "alex@college.edu",
        "password": "strongPassword123"
    })
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
