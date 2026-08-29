from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.csv_import import (
    CSVPreviewResponse,
    ColumnMapping,
    CSVImportValidationReport,
    CSVImportRequest,
    CSVImportResult
)
from app.services.auth_service import get_current_user
from app.services.csv_service import (
    preview_csv_content,
    validate_csv_mapping,
    execute_csv_import
)

router = APIRouter(prefix="/csv", tags=["CSV Import"])


@router.post("/upload-preview", response_model=CSVPreviewResponse)
async def upload_csv_preview(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Step 1 & 2: Upload CSV and receive file headers, sample rows, and suggested column mapping."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid .csv file."
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded CSV file is empty."
        )

    return preview_csv_content(content)


@router.post("/validate-mapping", response_model=CSVImportValidationReport)
def validate_mapping(
    request_in: CSVImportRequest,
    current_user: User = Depends(get_current_user),
):
    """Step 3 & 4: Validate column mappings against rows and return errors report."""
    return validate_csv_mapping(request_in.raw_data, request_in.mapping)


@router.post("/confirm-import", response_model=CSVImportResult)
def confirm_import(
    request_in: CSVImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Step 5: Batch insert parsed transactions into user's expenses."""
    return execute_csv_import(db, current_user.id, request_in)
