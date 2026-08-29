from datetime import date


def test_budget_creation_and_threshold_progress(client, auth_headers):
    today = date.today()
    cat_res = client.get("/api/categories", headers=auth_headers)
    cat_id = cat_res.json()[0]["id"]

    # Set Budget of 1000 for category
    b_res = client.post("/api/budgets", headers=auth_headers, json={
        "category_id": cat_id,
        "amount": 1000.0,
        "month": today.month,
        "year": today.year
    })
    assert b_res.status_code == 201

    # Log expense of 850 (85% - Approaching Limit)
    client.post("/api/expenses", headers=auth_headers, json={
        "category_id": cat_id,
        "amount": 850.0,
        "date": str(today),
        "payment_method": "UPI",
        "expense_type": "Variable"
    })

    # Check progress
    prog_res = client.get(f"/api/budgets/progress?month={today.month}&year={today.year}", headers=auth_headers)
    assert prog_res.status_code == 200
    prog_data = prog_res.json()
    assert prog_data["total_budgeted"] >= 1000.0
    cat_prog = [p for p in prog_data["category_progress"] if p["category_id"] == cat_id][0]
    assert cat_prog["spent_amount"] == 850.0
    assert cat_prog["percentage_used"] == 85.0
    assert cat_prog["status"] == "Approaching Limit"
