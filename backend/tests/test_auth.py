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


def test_current_user_profile(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Alex Student"
    assert data["email"] == "alex@college.edu"


def test_unauthorized_access_denied(client):
    res = client.get("/api/expenses")
    assert res.status_code == 401
