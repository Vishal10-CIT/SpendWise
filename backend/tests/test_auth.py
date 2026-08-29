from app.models.user import User
from app.models.expense import Expense
from app.core.security import verify_password


def test_register_and_login_success(client):
    # Register
    res = client.post("/api/auth/register", json={
        "name": "Sarah Student",
        "email": "sarah@college.edu",
        "password": "secretPassword123",
        "college_name": "MIT College",
        "living_situation": "Hostel",
        "monthly_allowance": 10000.0,
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "sarah@college.edu"
    assert data["user"]["living_situation"] == "Hostel"

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": "sarah@college.edu",
        "password": "secretPassword123",
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()


def test_full_register_login_logout_login_again_lifecycle(client, db_session):
    """
    CRITICAL REGRESSION TEST:
    1. Register user
    2. Verify user exists in database with secure password hash
    3. Login with credentials
    4. Access protected endpoints and create financial data
    5. Logout
    6. Verify user and financial records still exist in database unchanged
    7. Login AGAIN with exact same credentials
    8. Verify login succeeds and generates valid new JWT
    9. Access protected endpoint and verify financial data is still intact
    """
    email = "lifecycle.student@college.edu"
    password = "StudentSecurePass123!"

    # 1. Register user
    reg_res = client.post("/api/auth/register", json={
        "name": "Lifecycle Student",
        "email": email,
        "password": password,
        "college_name": "Apex Engineering College",
        "living_situation": "Hostel",
        "monthly_allowance": 12000.0,
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    user_id = reg_data["user"]["id"]

    # 2. Verify user exists in database
    db_user = db_session.query(User).filter(User.id == user_id).first()
    assert db_user is not None
    assert db_user.email == "lifecycle.student@college.edu"
    initial_hash = db_user.password_hash
    assert verify_password(password, initial_hash) is True

    # 3. Login with correct email/password (First Login)
    login_res_1 = client.post("/api/auth/login", json={
        "email": email,
        "password": password,
    })
    assert login_res_1.status_code == 200
    token_1 = login_res_1.json()["access_token"]
    headers_1 = {"Authorization": f"Bearer {token_1}"}

    # 4. Access protected endpoint & create financial record
    me_res = client.get("/api/auth/me", headers=headers_1)
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Lifecycle Student"

    # Get categories to create an expense
    cat_res = client.get("/api/categories", headers=headers_1)
    assert cat_res.status_code == 200
    categories = cat_res.json()
    assert len(categories) > 0
    cat_id = categories[0]["id"]

    exp_res = client.post("/api/expenses", headers=headers_1, json={
        "category_id": cat_id,
        "amount": 350.0,
        "description": "Textbooks for Semester",
        "date": "2026-08-25",
        "payment_method": "UPI",
        "expense_type": "Variable"
    })
    assert exp_res.status_code == 201
    created_expense_id = exp_res.json()["id"]

    # 5. Logout
    logout_res = client.post("/api/auth/logout", headers=headers_1)
    assert logout_res.status_code == 200
    assert logout_res.json()["message"] == "Logged out successfully"

    # 6. Verify user and financial data STILL EXIST in database after logout
    db_session.expire_all()
    user_after_logout = db_session.query(User).filter(User.id == user_id).first()
    assert user_after_logout is not None, "User MUST NOT be deleted upon logout!"
    assert user_after_logout.password_hash == initial_hash, "Password hash MUST NOT change upon logout!"

    expense_after_logout = db_session.query(Expense).filter(Expense.id == created_expense_id).first()
    assert expense_after_logout is not None, "Financial data MUST NOT be deleted upon logout!"
    assert expense_after_logout.amount == 350.0

    # 7 & 8. Login AGAIN with the exact same credentials
    login_res_2 = client.post("/api/auth/login", json={
        "email": email,
        "password": password,
    })
    assert login_res_2.status_code == 200, "Login after logout with same credentials MUST succeed!"
    token_2 = login_res_2.json()["access_token"]
    assert token_2 is not None
    headers_2 = {"Authorization": f"Bearer {token_2}"}

    # 9 & 10. Access protected endpoint and verify financial data is still intact
    exp_list_res = client.get("/api/expenses", headers=headers_2)
    assert exp_list_res.status_code == 200
    expenses = exp_list_res.json()["items"]
    assert any(exp["id"] == created_expense_id and exp["amount"] == 350.0 for exp in expenses)


def test_email_case_insensitivity_and_normalization(client):
    """Verify that email normalization handles mixed casing and whitespace consistently."""
    reg_payload = {
        "name": "Case Test Student",
        "email": "  Student.Case@COLLEGE.Edu  ",
        "password": "mySecurePassword123",
        "living_situation": "Hostel",
        "monthly_allowance": 8000.0,
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    assert reg_res.json()["user"]["email"] == "student.case@college.edu"

    # Login with exact lowercase
    login_1 = client.post("/api/auth/login", json={
        "email": "student.case@college.edu",
        "password": "mySecurePassword123",
    })
    assert login_1.status_code == 200

    # Login with uppercase
    login_2 = client.post("/api/auth/login", json={
        "email": "STUDENT.CASE@COLLEGE.EDU",
        "password": "mySecurePassword123",
    })
    assert login_2.status_code == 200

    # Login with whitespace and mixed case
    login_3 = client.post("/api/auth/login", json={
        "email": "  StUdEnT.cAsE@cOlLeGe.EdU  ",
        "password": "mySecurePassword123",
    })
    assert login_3.status_code == 200

    # Reject duplicate registration with different case
    dup_res = client.post("/api/auth/register", json={
        "name": "Duplicate Student",
        "email": "student.case@COLLEGE.edu",
        "password": "anotherPassword123",
        "living_situation": "PG",
        "monthly_allowance": 5000.0,
    })
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]


def test_register_duplicate_email(client):
    user_payload = {
        "name": "User 1",
        "email": "duplicate@college.edu",
        "password": "password123",
        "living_situation": "PG",
        "monthly_allowance": 5000.0,
    }
    client.post("/api/auth/register", json=user_payload)
    dup_res = client.post("/api/auth/register", json=user_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]


def test_login_invalid_password(client):
    client.post("/api/auth/register", json={
        "name": "User",
        "email": "user@college.edu",
        "password": "validPassword123",
        "living_situation": "Home",
        "monthly_allowance": 0.0,
    })
    res = client.post("/api/auth/login", json={
        "email": "user@college.edu",
        "password": "wrongPassword",
    })
    assert res.status_code == 401
    assert "Incorrect email or password" in res.json()["detail"]


def test_login_unknown_email(client):
    res = client.post("/api/auth/login", json={
        "email": "nonexistent.student@college.edu",
        "password": "anyPassword123",
    })
    assert res.status_code == 401
    assert "Incorrect email or password" in res.json()["detail"]


def test_current_user_profile(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Alex Student"
    assert data["email"] == "alex@college.edu"


def test_unauthorized_access_denied(client):
    res = client.get("/api/expenses")
    assert res.status_code == 401


def test_profile_update_without_password_keeps_login_working(client, auth_headers, db_session):
    """Verify that updating name/living situation without password maintains login capability."""
    # Update profile with empty/null password
    update_res = client.put("/api/auth/profile", headers=auth_headers, json={
        "name": "Alex Updated",
        "college_name": "New College",
        "living_situation": "PG",
        "monthly_allowance": 15000.0
    })
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Alex Updated"

    # User should still be able to log in with the original password
    login_res = client.post("/api/auth/login", json={
        "email": "alex@college.edu",
        "password": "strongPassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

