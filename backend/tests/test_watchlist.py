from datetime import date, timedelta
import pytest
from app.services.price_tracker.service import mock_provider


def test_watchlist_crud_and_validation(client, auth_headers):
    """Test creating, listing, updating, and deleting watchlist items with URL validation."""
    # 1. Invalid URL rejection (SSRF protection / non-http schemes)
    invalid_resp = client.post("/api/watchlist", json={
        "product_name": "Internal Service",
        "product_url": "http://127.0.0.1:8000/secret",
        "target_price": 500.0
    }, headers=auth_headers)
    assert invalid_resp.status_code == 400
    assert "Invalid product URL" in invalid_resp.json()["detail"]

    # 2. Add valid product
    deadline = date.today() + timedelta(days=15)
    create_resp = client.post("/api/watchlist", json={
        "product_name": "Sony WH-1000XM5 Headphones",
        "product_url": "https://amazon.in/dp/mock-headphones",
        "target_price": 20000.0,
        "purchase_deadline": deadline.isoformat(),
        "notes": "Waiting for festive sale"
    }, headers=auth_headers)
    assert create_resp.status_code == 201
    item = create_resp.json()
    item_id = item["id"]
    assert item["product_name"] == "Sony WH-1000XM5 Headphones"
    assert item["store_source"] == "Amazon"
    assert item["target_price"] == 20000.0
    assert item["tracking_status"] in ("Watching", "Target Reached", "Tracking Unavailable")
    assert item["affordability"] is not None

    # 3. Update target price
    update_resp = client.put(f"/api/watchlist/{item_id}", json={
        "target_price": 22000.0,
        "notes": "Updated budget cap"
    }, headers=auth_headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["target_price"] == 22000.0

    # 4. Stop tracking
    stop_resp = client.post(f"/api/watchlist/{item_id}/stop-tracking", headers=auth_headers)
    assert stop_resp.status_code == 200
    assert stop_resp.json()["is_tracking_active"] is False
    assert stop_resp.json()["tracking_status"] == "Stopped"

    # 5. Mark as purchased
    purchased_resp = client.post(f"/api/watchlist/{item_id}/mark-purchased", headers=auth_headers)
    assert purchased_resp.status_code == 200
    assert purchased_resp.json()["tracking_status"] == "Purchased"

    # 6. Delete item
    del_resp = client.delete(f"/api/watchlist/{item_id}", headers=auth_headers)
    assert del_resp.status_code == 204


def test_watchlist_price_tracking_target_reached_and_price_drop(client, auth_headers):
    """Test deterministic price tracking, price drop alert, target reached alert, and price history."""
    url = "https://example.com/products/mock-keyboard"

    # Setup initial mock price of ₹2500
    mock_provider.set_mock_price("mock-keyboard", 2500.0)

    # 1. Create item with target price ₹2000
    create_resp = client.post("/api/watchlist", json={
        "product_name": "Mechanical Keyboard",
        "product_url": url,
        "target_price": 2000.0,
    }, headers=auth_headers)
    item_id = create_resp.json()["id"]
    assert create_resp.json()["current_price"] == 2500.0
    assert create_resp.json()["tracking_status"] == "Watching"

    # 2. Simulate price drop to ₹2200 (still above target ₹2000)
    mock_provider.set_mock_price("mock-keyboard", 2200.0)
    check1 = client.post(f"/api/watchlist/{item_id}/check-price", headers=auth_headers)
    assert check1.status_code == 200
    res1 = check1.json()
    assert res1["current_price"] == 2200.0
    assert res1["previous_price"] == 2500.0
    assert res1["tracking_status"] == "Price Dropped"
    assert "Price dropped" in res1["alert_triggered"]

    # 3. Simulate price drop to ₹1900 (target price reached!)
    mock_provider.set_mock_price("mock-keyboard", 1900.0)
    check2 = client.post(f"/api/watchlist/{item_id}/check-price", headers=auth_headers)
    assert check2.status_code == 200
    res2 = check2.json()
    assert res2["current_price"] == 1900.0
    assert res2["tracking_status"] == "Target Reached"
    assert "Target price reached" in res2["alert_triggered"]

    # 4. Check details & 30-day Price History
    detail_resp = client.get(f"/api/watchlist/{item_id}", headers=auth_headers)
    detail = detail_resp.json()
    assert detail["lowest_price"] == 1900.0
    assert detail["highest_price"] == 2500.0
    assert len(detail["price_history"]) >= 3
    assert detail["price_difference"] == -100.0  # 1900 - 2000

    # 5. Check in-app alerts include target reached alert
    alerts_resp = client.get("/api/analytics/alerts", headers=auth_headers)
    alerts = alerts_resp.json()
    target_alert = next((a for a in alerts if "Mechanical Keyboard" in a["title"] or "Mechanical Keyboard" in a["message"]), None)
    assert target_alert is not None

    # Clean up mock provider
    mock_provider.clear_mock_prices()


def test_watchlist_user_isolation(client, auth_headers):
    """Verify watchlist items are strictly isolated between authenticated users."""
    # User 1 creates product
    p1 = client.post("/api/watchlist", json={
        "product_name": "User 1 iPad",
        "product_url": "https://apple.com/mock-ipad",
        "target_price": 50000.0
    }, headers=auth_headers).json()

    # User 2 logs in
    client.post("/api/auth/register", json={
        "name": "Student Three",
        "email": "student3_watchlist@test.edu",
        "password": "Password123!",
        "living_situation": "Hostel",
        "monthly_allowance": 12000.0
    })
    login_resp = client.post("/api/auth/login", json={
        "email": "student3_watchlist@test.edu",
        "password": "Password123!"
    })
    u2_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # User 2 cannot see User 1's iPad
    u2_list = client.get("/api/watchlist", headers=u2_headers).json()
    assert not any(item["id"] == p1["id"] for item in u2_list)

    # User 2 cannot access or delete User 1's product
    get_denied = client.get(f"/api/watchlist/{p1['id']}", headers=u2_headers)
    assert get_denied.status_code == 404
    del_denied = client.delete(f"/api/watchlist/{p1['id']}", headers=u2_headers)
    assert del_denied.status_code == 404
