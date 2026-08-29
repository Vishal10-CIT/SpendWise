from datetime import date


def test_create_and_list_expense(client, auth_headers):
    # Fetch categories
    cat_res = client.get("/api/categories", headers=auth_headers)
    assert cat_res.status_code == 200
    categories = cat_res.json()
    assert len(categories) > 0
    cat_id = categories[0]["id"]

    # Create expense
    exp_res = client.post("/api/expenses", headers=auth_headers, json={
        "category_id": cat_id,
        "amount": 250.0,
        "description": "Lunch at canteen",
        "date": str(date.today()),
        "payment_method": "UPI",
        "expense_type": "Variable",
    })
    assert exp_res.status_code == 201
    exp_data = exp_res.json()
    assert exp_data["amount"] == 250.0
    exp_id = exp_data["id"]

    # List expenses
    list_res = client.get("/api/expenses", headers=auth_headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] == 1
    assert list_data["total_amount"] == 250.0
    assert list_data["items"][0]["id"] == exp_id

    # Quick expense
    quick_res = client.post("/api/expenses/quick", headers=auth_headers, json={
        "category_id": cat_id,
        "amount": 100.0,
        "description": "Quick Tea & Snack"
    })
    assert quick_res.status_code == 201
    assert quick_res.json()["amount"] == 100.0

    # Delete expense
    del_res = client.delete(f"/api/expenses/{exp_id}", headers=auth_headers)
    assert del_res.status_code == 204

    # Verify deleted
    verify_res = client.get(f"/api/expenses/{exp_id}", headers=auth_headers)
    assert verify_res.status_code == 404


def test_negative_expense_amount_rejected(client, auth_headers):
    cat_res = client.get("/api/categories", headers=auth_headers)
    cat_id = cat_res.json()[0]["id"]

    res = client.post("/api/expenses", headers=auth_headers, json={
        "category_id": cat_id,
        "amount": -500.0,
        "date": str(date.today()),
        "payment_method": "Cash",
        "expense_type": "Variable",
    })
    assert res.status_code == 422  # Pydantic validation error
