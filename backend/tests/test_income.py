from datetime import date


def test_income_crud_and_summary(client, auth_headers):
    # Create income
    today = date.today()
    res = client.post("/api/income", headers=auth_headers, json={
        "source": "Freelance Web Project",
        "amount": 4000.0,
        "date": str(today),
        "recurring": False,
        "description": "Landing page design for client"
    })
    assert res.status_code == 201
    inc_data = res.json()
    assert inc_data["amount"] == 4000.0
    inc_id = inc_data["id"]

    # Monthly summary
    summary_res = client.get(f"/api/income/monthly-summary?month={today.month}&year={today.year}", headers=auth_headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_income"] >= 4000.0

    # Delete income
    del_res = client.delete(f"/api/income/{inc_id}", headers=auth_headers)
    assert del_res.status_code == 204
