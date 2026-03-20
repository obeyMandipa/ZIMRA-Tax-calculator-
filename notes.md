# PAYE Tax System – Feature Specification

## 1. Auth & Access

- **Login Page**
  - Simple email/username + password login.
  - On successful login, redirect user to the **Uploads Dashboard**.
  - Basic role support (e.g. `Admin`, `Viewer`) for future expansion.

---

## 2. Uploads Dashboard

- **Overview**
  - Landing page after login.
  - Shows summary cards:
    - Latest uploaded **Tax Tables** (year, currency, status).
    - Latest uploaded **Interbank Rates** (date, source, status).
  - Recent activity list (e.g. “Tax tables for 2025 uploaded by Admin at 10:35”).

- **Sections**
  - “Tax Tables” panel:
    - Button: **Upload Tax Tables (PDF)**.
    - Table/grid displaying currently active tax bands from the database.
    - Filters: `Year`, `Period` (Daily, Weekly, Monthly, etc.), `Currency`.
  - “Interbank Rates” panel:
    - Button: **Upload Interbank Rates**.
    - Table/grid displaying latest rates (base currency, date, rate).

---

## 3. Tax Tables Upload Flow

- **Upload Tax Tables (PDF)**
  - Frontend: file input restricted to `.pdf`.
  - On submit:
    1. Upload PDF to backend.
    2. Backend runs a **Python script** to:
       - Extract tables from PDF.
       - Convert tables into **JSON** with a consistent structure:
         - `year`,`period`, , `min`, `max`, `rate`, `deductable`.
       - Validate data (check missing bounds, numeric fields, etc.).
    3. Convert JSON into database rows and insert/update the **tax_bands** table.
    4. Return success/failure message for display on the dashboard.

- **Dashboard Display**
  - After successful upload:
    - Reload the “Tax Tables” panel with data from the database.
    - Allow pagination and sorting (by income bounds, period, rate).
    - Optional: Highlight newly added/updated rows.

---

## 4. Interbank Rates Upload Flow

- **Upload Interbank Rates**
  - Support CSV or Excel (`.csv`, `.xlsx`) uploads.
  - Expected columns (example):
    - `date`, `base_currency`, `target_currency`, `rate`.
  - Backend:
    1. Parse uploaded file.
    2. Validate dates and numeric rate fields.
    3. Insert/update rows in an `interbank_rates` table.
  - Dashboard:
    - Show latest rates with date and source.
    - Filter by `date` and `currency`.

---

## 5. Database & Data Model (High-Level)

- **tax_bands**
  - `id`, `year`, `currency`, `period`
  - `lower_bound`, `upper_bound`
  - `rate`, `deduction`
  - `created_at`, `updated_at`

- **interbank_rates**
  - `id`, `date`, `base_currency`, `target_currency`
  - `rate`
  - `created_at`, `updated_at`

- **users**
  - `id`, `name`, `email`, `password_hash`
  - `role`
  - `created_at`, `updated_at`

---

