from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class CSVPreviewRow(BaseModel):
    row_index: int
    data: Dict[str, Any]


class CSVPreviewResponse(BaseModel):
    headers: List[str]
    sample_rows: List[CSVPreviewRow]
    total_rows: int
    suggested_mapping: Dict[str, Optional[str]]


class ColumnMapping(BaseModel):
    amount_column: str
    date_column: str
    description_column: Optional[str] = None
    category_column: Optional[str] = None
    payment_method_column: Optional[str] = None


class CSVImportRowError(BaseModel):
    row_index: int
    field: str
    message: str
    raw_value: Optional[str] = None


class CSVImportValidationReport(BaseModel):
    valid_rows_count: int
    invalid_rows_count: int
    total_amount_sum: float
    errors: List[CSVImportRowError]
    is_valid_to_import: bool


class CSVImportRequest(BaseModel):
    mapping: ColumnMapping
    default_category_id: int
    default_payment_method: str = "UPI"
    default_expense_type: str = "Variable"
    raw_data: List[Dict[str, Any]]


class CSVImportResult(BaseModel):
    imported_count: int
    skipped_count: int
    total_amount: float
    message: str
