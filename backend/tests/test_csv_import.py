import io


def test_csv_upload_preview_and_confirm_import(client, auth_headers):
    # Fetch user categories to get a default category id
    cats = client.get("/api/categories", headers=auth_headers).json()
    default_cat_id = cats[0]["id"]

    # Sample CSV file content
    csv_content = (
        "Date,Description,Amount,PaymentMode\n"
        "2026-08-10,College Canteen Lunch,120.00,UPI\n"
        "2026-08-11,Textbook Purchase,450.00,Card\n"
        "2026-08-12,Metro Card Recharge,200.00,UPI\n"
    )

    file_obj = io.BytesIO(csv_content.encode("utf-8"))
    upload_res = client.post(
        "/api/csv/upload-preview",
        headers=auth_headers,
        files={"file": ("transactions.csv", file_obj, "text/csv")}
    )
    assert upload_res.status_code == 200
    preview_data = upload_res.json()
    assert preview_data["total_rows"] == 3
    assert "Amount" in preview_data["headers"]

    # Confirm Import
    import_payload = {
        "mapping": {
            "amount_column": "Amount",
            "date_column": "Date",
            "description_column": "Description",
            "payment_method_column": "PaymentMode"
        },
        "default_category_id": default_cat_id,
        "default_payment_method": "UPI",
        "default_expense_type": "Variable",
        "raw_data": [
            {"Date": "2026-08-10", "Description": "College Canteen Lunch", "Amount": "120.00", "PaymentMode": "UPI"},
            {"Date": "2026-08-11", "Description": "Textbook Purchase", "Amount": "450.00", "PaymentMode": "Card"},
            {"Date": "2026-08-12", "Description": "Metro Card Recharge", "Amount": "200.00", "PaymentMode": "UPI"}
        ]
    }

    confirm_res = client.post("/api/csv/confirm-import", headers=auth_headers, json=import_payload)
    assert confirm_res.status_code == 200
    result = confirm_res.json()
    assert result["imported_count"] == 3
    assert result["total_amount"] == 770.0

    # Verify expenses are in database
    exp_res = client.get("/api/expenses", headers=auth_headers)
    assert exp_res.json()["total"] >= 3
