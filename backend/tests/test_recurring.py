from datetime import date, timedelta


def test_recurring_expense_monthly_amortization(client, auth_headers):
    today = date.today()
    cat_res = client.get("/api/categories", headers=auth_headers)
    cat_id = cat_res.json()[0]["id"]

    # 1. Semi-Annually (₹3,000 every 6 months => ₹500/mo)
    rec1 = client.post("/api/recurring-expenses", headers=auth_headers, json={
        "category_id": cat_id,
        "name": "Hostel Semester Fee",
        "amount": 3000.0,
        "frequency": "Semi-Annually",
        "next_payment_date": str(today + timedelta(days=20)),
        "is_active": True
    })
    assert rec1.status_code == 201
    assert rec1.json()["monthly_allocation"] == 500.0

    # 2. Monthly (₹199 / mo)
    rec2 = client.post("/api/recurring-expenses", headers=auth_headers, json={
        "category_id": cat_id,
        "name": "Spotify Premium",
        "amount": 199.0,
        "frequency": "Monthly",
        "next_payment_date": str(today + timedelta(days=5)),
        "is_active": True
    })
    assert rec2.status_code == 201
    assert rec2.json()["monthly_allocation"] == 199.0

    # 3. Check upcoming payments
    upcoming_res = client.get("/api/recurring-expenses/upcoming", headers=auth_headers)
    assert upcoming_res.status_code == 200
    upcoming = upcoming_res.json()
    assert len(upcoming) >= 2
