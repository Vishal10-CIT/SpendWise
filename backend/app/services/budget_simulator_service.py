from datetime import date
from typing import List
from sqlalchemy.orm import Session
from app.schemas.decision_support import (
    BudgetSimulatorRequest,
    BudgetSimulatorResponse,
    SimulatorState,
    SimulatorDelta
)
from app.services.finance_service import (
    calculate_user_financial_profile,
    get_monthly_recurring_allocation
)


def run_budget_simulation(
    db: Session,
    user_id: int,
    request_in: BudgetSimulatorRequest
) -> BudgetSimulatorResponse:
    """
    Run a hypothetical What-If budget scenario without persisting any changes to the database.
    """
    today = date.today()
    profile = calculate_user_financial_profile(db, user_id, today.month, today.year)

    amount = request_in.amount
    days_remaining = profile["days_remaining"]

    # 1. Current State
    current_state = SimulatorState(
        monthly_income=profile["total_income"],
        total_spent=profile["total_spent"],
        planned_recurring=profile["planned_recurring_monthly"],
        savings_allocation=profile["total_monthly_savings_target"],
        flexible_spending=profile["remaining_flexible_spending"],
        safe_weekly_spending=profile["safe_weekly_spending"],
        safe_daily_spending=profile["safe_daily_spending"],
        remaining_balance=profile["remaining_liquid_balance"],
    )

    # 2. Simulated State
    sim_income = current_state.monthly_income
    sim_spent = current_state.total_spent
    sim_recurring = current_state.planned_recurring
    sim_savings = current_state.savings_allocation

    if request_in.is_recurring:
        recurring_freq = request_in.recurring_frequency or "Monthly"
        sim_monthly_add = get_monthly_recurring_allocation(amount, recurring_freq)
        sim_recurring = round(sim_recurring + sim_monthly_add, 2)
    else:
        sim_spent = round(sim_spent + amount, 2)

    sim_flexible = round(sim_income - sim_recurring - sim_savings - sim_spent, 2)
    sim_liquid_bal = round(sim_income - sim_spent, 2)

    effective_sim_flex = max(0.0, sim_flexible)
    sim_safe_weekly = round(effective_sim_flex / 4.33, 2)
    sim_safe_daily = round(effective_sim_flex / days_remaining, 2)

    simulated_state = SimulatorState(
        monthly_income=sim_income,
        total_spent=sim_spent,
        planned_recurring=sim_recurring,
        savings_allocation=sim_savings,
        flexible_spending=sim_flexible,
        safe_weekly_spending=sim_safe_weekly,
        safe_daily_spending=sim_safe_daily,
        remaining_balance=sim_liquid_bal,
    )

    # 3. Deltas
    flex_change = round(sim_flexible - current_state.flexible_spending, 2)
    weekly_change = round(sim_safe_weekly - current_state.safe_weekly_spending, 2)
    daily_change = round(sim_safe_daily - current_state.safe_daily_spending, 2)
    savings_impact = round(abs(min(0.0, sim_flexible)), 2)

    deltas = SimulatorDelta(
        flexible_spending_change=flex_change,
        safe_weekly_change=weekly_change,
        safe_daily_change=daily_change,
        savings_impact=savings_impact
    )

    # 4. Generate recommendations & goal impacts
    recommendations: List[str] = []
    goal_impacts: List[str] = []

    if sim_flexible < 0:
        recommendations.append(
            f"⚠️ This scenario would cause a monthly flexible deficit of ₹{abs(sim_flexible):,.2f}."
        )
        recommendations.append(
            "Consider finding a cheaper alternative or offsetting this cost by reducing other categories."
        )
    elif sim_flexible < current_state.flexible_spending * 0.3:
        recommendations.append(
            f"Notice: Your weekly safe spending limit will drop by ₹{abs(weekly_change):,.2f} (from ₹{current_state.safe_weekly_spending:,.2f} to ₹{sim_safe_weekly:,.2f})."
        )
    else:
        recommendations.append(
            f"✅ You can comfortably absorb this ₹{amount:,.2f} scenario while keeping ₹{sim_safe_weekly:,.2f}/week safe spending capacity."
        )

    # Check goal impacts
    for goal in profile["savings_goals"]:
        rem_goal = max(0.0, goal.target_amount - goal.current_amount)
        if rem_goal > 0:
            if sim_flexible < 0:
                goal_impacts.append(
                    f"Target '{goal.name}' (₹{goal.current_amount:.0f}/₹{goal.target_amount:.0f}) may be delayed due to reduced savings allocation."
                )
            else:
                goal_impacts.append(
                    f"Target '{goal.name}' remains on track with current savings trajectory."
                )

    explanation = (
        f"Simulating '{request_in.scenario_name}' of ₹{amount:,.2f}"
        + (f" ({request_in.recurring_frequency} recurring)" if request_in.is_recurring else " (one-time)")
        + f" adjusts your available flexible spending by ₹{flex_change:,.2f}."
    )

    return BudgetSimulatorResponse(
        scenario_name=request_in.scenario_name,
        amount=amount,
        is_recurring=request_in.is_recurring,
        recurring_frequency=request_in.recurring_frequency if request_in.is_recurring else None,
        current_state=current_state,
        simulated_state=simulated_state,
        deltas=deltas,
        explanation=explanation,
        recommendations=recommendations,
        goal_impacts=goal_impacts
    )
