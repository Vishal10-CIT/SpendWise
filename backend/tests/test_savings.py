from datetime import date, timedelta


def test_savings_goal_progress_and_deposit(client, auth_headers):
    today = date.today()
    future_date = today + timedelta(days=90)  # ~3 months

    # Create savings goal for laptop
    res = client.post("/api/savings-goals", headers=auth_headers, json={
        "name": "New Coding Laptop",
        "target_amount": 30000.0,
        "current_amount": 6000.0,
        "target_date": str(future_date),
        "description": "MacBook / ThinkPad for semester"
    })
    assert res.status_code == 201
    goal = res.json()
    assert goal["progress_percentage"] == 20.0
    assert goal["remaining_amount"] == 24000.0
    assert goal["recommended_monthly_saving"] > 0.0
    goal_id = goal["id"]

    # Deposit ₹4,000 into savings goal
    dep_res = client.post(f"/api/savings-goals/{goal_id}/deposit", headers=auth_headers, json={
        "amount": 4000.0
    })
    assert dep_res.status_code == 200
    updated_goal = dep_res.json()
    assert updated_goal["current_amount"] == 10000.0
    assert updated_goal["remaining_amount"] == 20000.0
    assert updated_goal["progress_percentage"] == round((10000.0 / 30000.0) * 100, 1)
