import csv
import io
import re
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.expense import Expense
from app.models.category import Category
from app.schemas.csv_import import (
    CSVPreviewResponse,
    CSVPreviewRow,
    ColumnMapping,
    CSVImportValidationReport,
    CSVImportRowError,
    CSVImportRequest,
    CSVImportResult,
)


def parse_flexible_date(date_str: str) -> Optional[date]:
    """Parse various common date formats present in bank/UPI statements."""
    if not date_str:
        return None
    
    clean_str = str(date_str).strip()
    # Remove any timestamp portion
    clean_str = clean_str.split(" ")[0].split("T")[0]

    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%m/%d/%Y",
        "%d.%m.%Y",
        "%d-%b-%Y",
        "%d-%B-%Y",
        "%Y/%m/%d",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(clean_str, fmt).date()
        except ValueError:
            continue
    return None


def parse_flexible_amount(amount_str: Any) -> Optional[float]:
    """Parse currency amounts with commas, symbols, or debit notations."""
    if amount_str is None:
        return None
    if isinstance(amount_str, (int, float)):
        return float(amount_str) if float(amount_str) > 0 else None

    # Clean characters
    cleaned = str(amount_str).replace("₹", "").replace("$", "").replace(",", "").strip()
    # Handle negative / debit notation like (150.00) or -150
    cleaned = re.sub(r"[^\d.]", "", cleaned)
    try:
        val = float(cleaned)
        return val if val > 0 else None
    except ValueError:
        return None


def preview_csv_content(file_bytes: bytes) -> CSVPreviewResponse:
    """Preview uploaded CSV content and suggest column mappings."""
    text_stream = io.StringIO(file_bytes.decode("utf-8", errors="replace"))
    reader = csv.DictReader(text_stream)

    headers = [h.strip() for h in (reader.fieldnames or []) if h]
    
    sample_rows: List[CSVPreviewRow] = []
    total_rows = 0

    for i, row in enumerate(reader):
        total_rows += 1
        if i < 8:
            clean_row = {k.strip(): v.strip() if isinstance(v, str) else v for k, v in row.items() if k}
            sample_rows.append(CSVPreviewRow(row_index=i + 1, data=clean_row))

    # Auto-detect mappings based on header names
    suggested_mapping: Dict[str, Optional[str]] = {
        "amount_column": None,
        "date_column": None,
        "description_column": None,
        "category_column": None,
        "payment_method_column": None,
    }

    for h in headers:
        lower_h = h.lower()
        if not suggested_mapping["amount_column"] and any(k in lower_h for k in ["amount", "debit", "withdrawal", "price", "cost", "sum"]):
            suggested_mapping["amount_column"] = h
        elif not suggested_mapping["date_column"] and any(k in lower_h for k in ["date", "txn_date", "time", "day"]):
            suggested_mapping["date_column"] = h
        elif not suggested_mapping["description_column"] and any(k in lower_h for k in ["desc", "narration", "particulars", "detail", "title", "remarks", "name"]):
            suggested_mapping["description_column"] = h
        elif not suggested_mapping["category_column"] and any(k in lower_h for k in ["category", "group", "tag"]):
            suggested_mapping["category_column"] = h
        elif not suggested_mapping["payment_method_column"] and any(k in lower_h for k in ["method", "mode", "channel", "type"]):
            suggested_mapping["payment_method_column"] = h

    return CSVPreviewResponse(
        headers=headers,
        sample_rows=sample_rows,
        total_rows=total_rows,
        suggested_mapping=suggested_mapping
    )


def validate_csv_mapping(
    raw_data: List[Dict[str, Any]],
    mapping: ColumnMapping
) -> CSVImportValidationReport:
    """Validate mapped rows prior to database persistence."""
    errors: List[CSVImportRowError] = []
    valid_count = 0
    total_sum = 0.0

    for idx, row in enumerate(raw_data):
        row_num = idx + 1
        raw_amount = row.get(mapping.amount_column)
        raw_date = row.get(mapping.date_column)

        parsed_amount = parse_flexible_amount(raw_amount)
        if parsed_amount is None:
            errors.append(CSVImportRowError(
                row_index=row_num,
                field="Amount",
                message=f"Invalid or zero amount '{raw_amount}'",
                raw_value=str(raw_amount)
            ))
            continue

        parsed_date = parse_flexible_date(raw_date)
        if parsed_date is None:
            errors.append(CSVImportRowError(
                row_index=row_num,
                field="Date",
                message=f"Could not parse date '{raw_date}'",
                raw_value=str(raw_date)
            ))
            continue

        valid_count += 1
        total_sum += parsed_amount

    return CSVImportValidationReport(
        valid_rows_count=valid_count,
        invalid_rows_count=len(errors),
        total_amount_sum=round(total_sum, 2),
        errors=errors[:20],  # Return up to first 20 errors
        is_valid_to_import=valid_count > 0
    )


def execute_csv_import(
    db: Session,
    user_id: int,
    request_in: CSVImportRequest
) -> CSVImportResult:
    """Batch insert validated expense rows into database."""
    mapping = request_in.mapping
    expenses_to_add: List[Expense] = []
    skipped = 0
    total_amount = 0.0

    # Build category name lookup for user
    categories = db.query(Category).filter(
        (Category.user_id == user_id) | (Category.user_id == None)
    ).all()
    cat_lookup = {c.name.lower(): c.id for c in categories}

    for row in request_in.raw_data:
        amount = parse_flexible_amount(row.get(mapping.amount_column))
        txn_date = parse_flexible_date(row.get(mapping.date_column))

        if amount is None or txn_date is None:
            skipped += 1
            continue

        description = ""
        if mapping.description_column and row.get(mapping.description_column):
            description = str(row.get(mapping.description_column)).strip()[:255]

        # Determine category
        category_id = request_in.default_category_id
        if mapping.category_column and row.get(mapping.category_column):
            raw_cat_name = str(row.get(mapping.category_column)).strip().lower()
            if raw_cat_name in cat_lookup:
                category_id = cat_lookup[raw_cat_name]

        # Determine payment method
        payment_method = request_in.default_payment_method
        if mapping.payment_method_column and row.get(mapping.payment_method_column):
            raw_pm = str(row.get(mapping.payment_method_column)).strip().upper()
            if "UPI" in raw_pm:
                payment_method = "UPI"
            elif "CARD" in raw_pm or "DEBIT" in raw_pm or "CREDIT" in raw_pm:
                payment_method = "Card"
            elif "NET" in raw_pm or "NEFT" in raw_pm or "IMPS" in raw_pm or "TRANSFER" in raw_pm:
                payment_method = "NetBanking"
            elif "CASH" in raw_pm:
                payment_method = "Cash"

        expense = Expense(
            user_id=user_id,
            category_id=category_id,
            amount=amount,
            description=description if description else "Imported Expense",
            date=txn_date,
            payment_method=payment_method,
            expense_type=request_in.default_expense_type,
        )
        expenses_to_add.append(expense)
        total_amount += amount

    db.add_all(expenses_to_add)
    db.commit()

    return CSVImportResult(
        imported_count=len(expenses_to_add),
        skipped_count=skipped,
        total_amount=round(total_amount, 2),
        message=f"Successfully imported {len(expenses_to_add)} expense transactions (₹{total_amount:,.2f})."
    )
