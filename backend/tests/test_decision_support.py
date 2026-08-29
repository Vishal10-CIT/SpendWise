from datetime import date


def test_affordability_check_all_verdicts(client, auth_headers):
    # 1. Affordable small purchase
    res_small = client.post("/api/finance/affordability-check", headers=auth_headers, json={
        "purchase_name": "Course Notebook",
        "amount": 150.0
    })
    assert res_small.status_code == 200
    data_small = res_small.json()
    assert data_small["status"] == "Affordable"
    assert data_small["flexible_spending_after_purchase"] > 0

    # 2. Huge un-affordable purchase (Not Recommended)
    res_large = client.post("/api/finance/affordability-check", headers=auth_headers, json={
        "purchase_name": "Luxury Designer Jacket",
        "amount": 50000.0
    })
    assert res_large.status_code == 200
    data_large = res_large.json()
    assert data_large["status"] == "Not Recommended"
    assert data_large["savings_impact"] > 0


def test_spending_pace_calculation(client, auth_headers):
    res = client.get("/api/analytics/spending-pace", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "budget_usage_percentage" in data
    assert "time_elapsed_percentage" in data
    assert "status" in data
    assert "status_label" in data
    assert "explanation" in data


def test_budget_simulator_does_not_mutate_database(client, auth_headers):
    # Get current expenses count
    initial_exp = client.get("/api/expenses", headers=auth_headers).json()["total"]

    # Run Simulation
    sim_res = client.post("/api/finance/budget-simulator", headers=auth_headers, json={
        "scenario_name": "New Noise-Cancelling Headphones",
        "amount": 4500.0,
        "is_recurring": False
    })
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["deltas"]["flexible_spending_change"] == -4500.0
    assert len(sim_data["recommendations"]) > 0

    # Verify expenses count remains unchanged
    after_exp = client.get("/api/expenses", headers=auth_headers).json()["total"]
    assert after_exp == initial_exp


def test_budget_health_score_breakdown(client, auth_headers):
    res = client.get("/api/analytics/budget-health", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert 0 <= data["score"] <= 100
    assert data["status"] in ["Excellent", "Good", "Fair", "Needs Attention", "At Risk"]
    assert len(data["factor_breakdown"]) == 5
    assert len(data["positive_factors"]) > 0 or len(data["negative_factors"]) > 0
    assert "summary_explanation" in data
