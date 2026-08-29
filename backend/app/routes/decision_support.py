from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.decision_support import (
    AffordabilityCheckRequest,
    AffordabilityCheckResponse,
    BudgetSimulatorRequest,
    BudgetSimulatorResponse
)
from app.services.auth_service import get_current_user
from app.services.affordability_service import check_affordability
from app.services.budget_simulator_service import run_budget_simulation

router = APIRouter(prefix="/finance", tags=["Decision Support Tools"])


@router.post("/affordability-check", response_model=AffordabilityCheckResponse)
def evaluate_affordability(
    request_in: AffordabilityCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    "Can I Afford This?" decision tool.
    Calculates deterministic affordability verdict (Affordable, Caution, Not Recommended)
    based on the student's real live financial profile.
    """
    return check_affordability(db, current_user.id, request_in)


@router.post("/budget-simulator", response_model=BudgetSimulatorResponse)
def simulate_scenario(
    request_in: BudgetSimulatorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    What-If Budget Simulator.
    Simulates a hypothetical spending or recurring expense scenario
    and computes side-by-side financial impacts WITHOUT modifying the database.
    """
    return run_budget_simulation(db, current_user.id, request_in)
