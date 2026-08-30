from datetime import date, timedelta
import pytest
from app.services.renewal_service import (
    calculate_next_renewal_date,
    parse_reminder_days,
    format_scheduled_reminders,
)


def test_renewal_date_calculations():
    """Verify renewal calculation handles all frequencies and calendar edge cases."""
    # 1. Weekly
    d_week = date(2026, 10, 1)
    next_week = calculate_next_renewal_date(d_week, "Weekly")
    assert next_week == date(2026, 10, 8)

    # 2. Monthly regular
    d_month = date(2026, 10, 15)
    next_month = calculate_next_renewal_date(d_month, "Monthly")
    assert next_month == date(2026, 11, 15)

    # 3. Monthly year rollover (Dec -> Jan)
    d_dec = date(2026, 12, 10)
    next_jan = calculate_next_renewal_date(d_dec, "Monthly")
    assert next_jan == date(2027, 1, 10)

    # 4. Month-end clipping (Jan 31 -> Feb 28 in non-leap year)
    d_jan31 = date(2026, 1, 31)
    next_feb = calculate_next_renewal_date(d_jan31, "Monthly")
    assert next_feb == date(2026, 2, 28)

    # 5. Month-end in leap year (Jan 31 2028 -> Feb 29 2028)
    d_jan31_leap = date(2028, 1, 31)
    next_feb_leap = calculate_next_renewal_date(d_jan31_leap, "Monthly")
    assert next_feb_leap == date(2028, 2, 29)

    # 6. Quarterly (3 months)
    d_q = date(2026, 3, 31)
    next_q = calculate_next_renewal_date(d_q, "Quarterly")
    assert next_q == date(2026, 6, 30)

    # 7. Every 6 months / Semi-Annually (e.g. Gym Dec 15 -> Jun 15)
    d_semi = date(2026, 12, 15)
    next_semi = calculate_next_renewal_date(d_semi, "Every 6 months")
    assert next_semi == date(2027, 6, 15)

    # 8. Yearly (Oct 15 2026 -> Oct 15 2027)
    d_year = date(2026, 10, 15)
    next_year = calculate_next_renewal_date(d_year, "Yearly")
    assert next_year == date(2027, 10, 15)

    # 9. Yearly leap day clipping (Feb 29 2028 -> Feb 28 2029)
    d_leap_day = date(2028, 2, 29)
    next_non_leap = calculate_next_renewal_date(d_leap_day, "Yearly")
    assert next_non_leap == date(2029, 2, 28)


def test_reminder_offsets_and_labels():
    """Verify reminder offset parsing and formatting."""
    assert parse_reminder_days("[7, 3, 1, 0]") == [7, 3, 1, 0]
    assert parse_reminder_days("7, 3, 1, 0") == [7, 3, 1, 0]
    assert parse_reminder_days(None) == [7, 3, 1, 0]

    labels = format_scheduled_reminders([7, 3, 1, 0])
    assert "7 days before" in labels
    assert "3 days before" in labels
    assert "1 day before" in labels
    assert "On due date" in labels


def test_recurring_create_with_custom_reminders_and_mark_renewed(client, auth_headers):
    """Test creating a recurring expense with reminder offsets and marking it as renewed."""
    # 1. Get categories
    cat_resp = client.get("/api/categories", headers=auth_headers)
    cat_id = cat_resp.json()[0]["id"]

    # 2. Create 6-month gym membership due in 5 days
    due_date = date.today() + timedelta(days=5)
    payload = {
        "category_id": cat_id,
        "name": "Campus Gym Membership",
        "amount": 3000.0,
        "frequency": "Every 6 months",
        "next_payment_date": due_date.isoformat(),
        "reminder_days": [7, 3, 1, 0],
        "notes": "Semi-annual gym fee"
    }

    create_resp = client.post("/api/recurring-expenses", json=payload, headers=auth_headers)
    assert create_resp.status_code == 201
    data = create_resp.json()
    rec_id = data["id"]
    assert data["name"] == "Campus Gym Membership"
    assert data["frequency"] == "Every 6 months"
    assert data["monthly_allocation"] == 500.0  # 3000 / 6
    assert data["reminder_days"] == [7, 3, 1, 0]

    # 3. Check Reminders Center endpoint
    rem_resp = client.get("/api/reminders", headers=auth_headers)
    assert rem_resp.status_code == 200
    reminders = rem_resp.json()
    gym_rem = next((r for r in reminders if r["id"] == rec_id), None)
    assert gym_rem is not None
    assert gym_rem["days_until_due"] == 5
    assert gym_rem["status"] in ("Due Soon", "Upcoming")
    assert "On due date" in gym_rem["scheduled_reminders"]

    # 4. Mark as Renewed
    renew_resp = client.post(f"/api/recurring-expenses/{rec_id}/mark-renewed", headers=auth_headers)
    assert renew_resp.status_code == 200
    renew_data = renew_resp.json()
    assert "Successfully marked" in renew_data["message"]
    expected_next = calculate_next_renewal_date(due_date, "Every 6 months")
    assert renew_data["next_payment_date"] == expected_next.isoformat()

    # 5. Verify the recurring payment is still active and updated
    get_rec = client.get("/api/recurring-expenses", headers=auth_headers)
    active_gym = next(r for r in get_rec.json() if r["id"] == rec_id)
    assert active_gym["is_active"] is True
    assert active_gym["next_payment_date"] == expected_next.isoformat()
    assert active_gym["last_paid_date"] == date.today().isoformat()


def test_reminders_user_isolation(client, auth_headers):
    """Verify reminders are strictly isolated between authenticated users."""
    cat_resp = client.get("/api/categories", headers=auth_headers)
    cat_id = cat_resp.json()[0]["id"]

    # User 1 creates recurring bill
    client.post("/api/recurring-expenses", json={
        "category_id": cat_id,
        "name": "User 1 Wi-Fi",
        "amount": 799.0,
        "frequency": "Monthly",
        "next_payment_date": (date.today() + timedelta(days=2)).isoformat(),
        "reminder_days": [3, 1, 0]
    }, headers=auth_headers)

    # Register User 2
    client.post("/api/auth/register", json={
        "name": "Student Two",
        "email": "student2_reminders@test.edu",
        "password": "Password123!",
        "living_situation": "Hostel",
        "monthly_allowance": 8000.0
    })
    login_resp = client.post("/api/auth/login", json={
        "email": "student2_reminders@test.edu",
        "password": "Password123!"
    })
    user2_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # User 2 reminders should not see User 1's Wi-Fi
    u2_rems = client.get("/api/reminders", headers=user2_headers).json()
    assert not any(r["name"] == "User 1 Wi-Fi" for r in u2_rems)
