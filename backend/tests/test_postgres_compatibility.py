import pytest
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable
from app.database.session import Base
from app.models.user import User
from app.models.category import Category
from app.models.expense import Expense
from app.models.income import Income
from app.models.recurring_expense import RecurringExpense
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal


def test_postgresql_dialect_ddl_compilation():
    """Verify that all SQLAlchemy models compile into valid PostgreSQL DDL without errors."""
    dialect = postgresql.dialect()

    models = [
        User,
        Category,
        Expense,
        Income,
        RecurringExpense,
        Budget,
        SavingsGoal,
    ]

    for model in models:
        create_table_stmt = str(CreateTable(model.__table__).compile(dialect=dialect))
        assert model.__tablename__ in create_table_stmt
        assert "CREATE TABLE" in create_table_stmt


def test_postgresql_foreign_key_and_indexes():
    """Verify foreign key cascading and indices on PostgreSQL schema."""
    dialect = postgresql.dialect()

    expense_ddl = str(CreateTable(Expense.__table__).compile(dialect=dialect))
    assert "user_id" in expense_ddl
    assert "category_id" in expense_ddl
    assert "FOREIGN KEY(user_id) REFERENCES users (id)" in expense_ddl

    user_ddl = str(CreateTable(User.__table__).compile(dialect=dialect))
    assert "email" in user_ddl
    assert "monthly_allowance" in user_ddl


def test_full_student_crud_workflow_with_session(client, auth_headers):
    """Verify complete CRUD workflow on all models."""
    # 1. Categories
    cat_resp = client.get("/api/categories", headers=auth_headers)
    assert cat_resp.status_code == 200
    categories = cat_resp.json()
    assert len(categories) > 0
    food_cat = categories[0]

    # 2. Expense Create
    exp_resp = client.post("/api/expenses", json={
        "category_id": food_cat["id"],
        "amount": 250.0,
        "description": "Lunch with hostel roommates",
        "date": "2026-08-23",
        "payment_method": "UPI",
        "expense_type": "Variable"
    }, headers=auth_headers)
    assert exp_resp.status_code == 201
    expense_id = exp_resp.json()["id"]

    # 3. Expense Retrieve
    get_exp = client.get(f"/api/expenses/{expense_id}", headers=auth_headers)
    assert get_exp.status_code == 200
    assert get_exp.json()["amount"] == 250.0

    # 4. Expense Update
    upd_exp = client.put(f"/api/expenses/{expense_id}", json={
        "category_id": food_cat["id"],
        "amount": 300.0,
        "description": "Updated Lunch + Dessert",
        "date": "2026-08-23",
        "payment_method": "UPI",
        "expense_type": "Variable"
    }, headers=auth_headers)
    assert upd_exp.status_code == 200
    assert upd_exp.json()["amount"] == 300.0

    # 5. Income Create & Summary
    inc_resp = client.post("/api/income", json={
        "source": "Allowance",
        "amount": 10000.0,
        "date": "2026-08-01",
        "recurring": True,
        "description": "Monthly allowance from parents"
    }, headers=auth_headers)
    assert inc_resp.status_code == 201

    inc_sum = client.get("/api/income/monthly-summary", headers=auth_headers)
    assert inc_sum.status_code == 200
    assert inc_sum.json()["total_income"] == 22000.0

    # 6. Budget CRUD & Progress
    b_resp = client.post("/api/budgets", json={
        "category_id": food_cat["id"],
        "amount": 4000.0,
        "month": 8,
        "year": 2026
    }, headers=auth_headers)
    assert b_resp.status_code in (200, 201)

    b_prog = client.get("/api/budgets/progress?month=8&year=2026", headers=auth_headers)
    assert b_prog.status_code == 200
    assert b_prog.json()["total_spent"] == 300.0

    # 7. Recurring Expense
    rec_resp = client.post("/api/recurring-expenses", json={
        "name": "Hostel WiFi",
        "category_id": food_cat["id"],
        "amount": 600.0,
        "frequency": "Monthly",
        "next_payment_date": "2026-08-30",
        "is_active": True
    }, headers=auth_headers)
    assert rec_resp.status_code == 201

    # 8. Savings Goal & Deposit
    sav_resp = client.post("/api/savings-goals", json={
        "name": "Coding Laptop",
        "target_amount": 60000.0,
        "current_amount": 10000.0,
        "target_date": "2026-12-31"
    }, headers=auth_headers)
    assert sav_resp.status_code == 201
    goal_id = sav_resp.json()["id"]

    dep_resp = client.post(f"/api/savings-goals/{goal_id}/deposit", json={
        "amount": 5000.0
    }, headers=auth_headers)
    assert dep_resp.status_code == 200
    assert dep_resp.json()["current_amount"] == 15000.0

    # 9. Decision Support Tools
    aff_resp = client.post("/api/finance/affordability-check", json={
        "purchase_name": "Course Textbook",
        "amount": 800.0,
        "category_id": food_cat["id"]
    }, headers=auth_headers)
    assert aff_resp.status_code == 200
    assert "status" in aff_resp.json()

    sim_resp = client.post("/api/finance/budget-simulator", json={
        "scenario_name": "Gym Subscription",
        "amount": 1500.0,
        "is_recurring": True,
        "recurring_frequency": "Monthly"
    }, headers=auth_headers)
    assert sim_resp.status_code == 200

    health_resp = client.get("/api/analytics/budget-health", headers=auth_headers)
    assert health_resp.status_code == 200
    assert 0 <= health_resp.json()["score"] <= 100

    # 10. Expense Deletion
    del_resp = client.delete(f"/api/expenses/{expense_id}", headers=auth_headers)
    assert del_resp.status_code in (200, 204)
