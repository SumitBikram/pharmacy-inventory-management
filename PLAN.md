# Pharmacy Inventory Management - Implementation Plan

## Tech Stack
- **Frontend:** React 19 (Vite)
- **Backend:** Supabase (Auth, Database, RLS, Edge Functions)
- **State Management:** Zustand
- **UI Library:** Material UI (MUI) v7
- **Routing:** React Router v7
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Date Handling:** date-fns

## Folder Structure

```
src/
├── App.jsx                        # Root component with router
├── index.jsx                      # Entry point
├── index.css                      # Global styles (Nunito font)
├── app/
│   └── theme.jsx                  # MUI theme configuration
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.jsx    # Sidebar + topbar layout shell
│   │   ├── Sidebar.jsx            # Collapsible sidebar with role-based menu
│   │   └── Topbar.jsx             # App bar with user menu
│   └── shared/
│       ├── DataTable.jsx          # Reusable MUI DataGrid wrapper
│       ├── ConfirmDialog.jsx      # Confirm action modal
│       ├── ErrorBoundary.jsx      # Global error boundary
│       ├── EmptyState.jsx         # Empty state placeholder
│       ├── LoadingScreen.jsx      # Full-page loading spinner
│       ├── NotFoundPage.jsx       # 404 page
│       ├── PageHeader.jsx         # Page title + actions bar
│       └── StatusChip.jsx         # Status badges
├── features/
│   ├── auth/
│   │   ├── LoginPage.jsx          # Login form
│   │   ├── AuthGuard.jsx          # Route protection by role
│   │   └── authStore.jsx          # Zustand auth store
│   ├── medicines/
│   │   ├── MedicinesPage.jsx      # Medicine list with search/filter
│   │   ├── MedicineForm.jsx       # Add/edit medicine dialog
│   │   ├── CategoryManager.jsx    # Inline category CRUD
│   │   └── medicineService.jsx    # Supabase queries
│   ├── inventory/
│   │   ├── InventoryPage.jsx      # 3-tab view: Batches, Summary, Purchases
│   │   ├── StockEntryForm.jsx     # Multi-item purchase entry
│   │   ├── BatchList.jsx          # Batch table with expiry status
│   │   └── inventoryService.jsx   # Supabase queries
│   ├── billing/
│   │   ├── BillingPage.jsx        # POS interface + bill history
│   │   ├── BillItemRow.jsx        # Per-item row with autocomplete
│   │   ├── BillSummary.jsx        # Totals, discount, payment
│   │   ├── BillHistory.jsx        # Date-filtered bill list
│   │   ├── BillDetailDialog.jsx   # Full bill breakdown
│   │   └── billingService.jsx     # FIFO logic via DB function
│   ├── suppliers/
│   │   ├── SuppliersPage.jsx      # Supplier list with search
│   │   ├── SupplierForm.jsx       # Add/edit supplier dialog
│   │   └── supplierService.jsx    # Supabase queries
│   ├── users/
│   │   ├── UsersPage.jsx          # User management (admin only)
│   │   ├── UserForm.jsx           # Add/edit user dialog
│   │   └── userService.jsx        # Edge Function + Supabase queries
│   ├── alerts/
│   │   ├── AlertsPage.jsx         # Low stock, expiring, expired tabs
│   │   └── alertService.jsx       # Alert queries + settings
│   └── reports/
│       ├── DashboardPage.jsx      # Summary cards + charts
│       ├── SalesReport.jsx        # Daily sales with date picker
│       ├── StockReport.jsx        # Medicine stock summary
│       ├── ExpiryReport.jsx       # All batches by expiry
│       ├── ReportsPage.jsx        # 3-tab reports container
│       └── reportService.jsx      # Report queries
├── lib/
│   ├── supabase.jsx               # Supabase client init
│   ├── constants.jsx              # Roles, payment methods, drawer width
│   └── validations.jsx            # Zod schemas
└── hooks/
    └── useRoleAccess.jsx          # Role-based permission helpers

supabase/
├── schema.sql                     # Full database schema with RLS
├── fix_rls_policies.sql           # RLS fix using get_my_role()
├── seed.sql                       # Categories + sample medicines
└── seed_suppliers.sql             # Sample suppliers
# Edge Functions (9 total) are deployed on Supabase Dashboard, not stored locally.
# See Phase 12 below for the full API reference.
```

## Database Schema (Supabase/PostgreSQL)

### Tables
1. **users** — extends Supabase auth.users (role: admin/accountant/salesman)
2. **categories** — medicine categories
3. **medicines** — master medicine catalog
4. **suppliers** — supplier directory
5. **stock_batches** — batch-level inventory (core of the system)
6. **purchase_entries** — purchase records linking supplier to batches
7. **purchase_items** — line items in a purchase
8. **bills** — sales transactions
9. **bill_items** — line items in a bill (links to batch for FIFO)
10. **settings** — app config (alert thresholds, pharmacy info)

### Key Design Decisions
- **Batch-centric:** Stock is always tracked at the batch level (batch_no + expiry)
- **FIFO billing:** Auto-select batches with earliest expiry first via `deduct_stock_fifo()` DB function
- **Stock deduction:** Atomic — happens at bill creation inside a SECURITY DEFINER function
- **RLS:** All tables have row-level security via `get_my_role()` helper (avoids recursion)
- **Soft deletes:** Medicines, suppliers, users use `is_active` flag instead of hard delete

### Role Access Matrix

| Feature | Admin | Accountant | Salesman |
|---------|-------|------------|----------|
| Dashboard | Full stats + charts | Stock-focused | Sales-focused |
| Medicines | Full CRUD | View only | View only |
| Inventory | Full access | Full access | Hidden |
| Billing | Full access | Hidden | Full access |
| Suppliers | Full CRUD | Hidden | Hidden |
| Alerts | All + settings | All (no settings) | All (no settings) |
| Reports | All reports | All reports | Hidden |
| Users | Full CRUD | Hidden | Hidden |

### Routes
```
/login              → LoginPage (public)
/dashboard          → DashboardPage (role-aware)
/medicines          → MedicinesPage
/inventory          → InventoryPage (admin + accountant)
/billing            → BillingPage (admin + salesman)
/suppliers          → SuppliersPage (admin)
/users              → UsersPage (admin)
/alerts             → AlertsPage
/reports            → ReportsPage (admin + accountant)
/                   → redirects to /dashboard
/*                  → 404 NotFoundPage
```

---

## Implementation Phases

### Phase 1: Foundation ✅
- [x] Install dependencies (MUI, Zustand, React Router, Supabase, etc.)
- [x] Set up folder structure
- [x] Configure Supabase client
- [x] Create MUI theme (Nunito font, teal primary)
- [x] Set up routing skeleton
- [x] Create DashboardLayout (collapsible sidebar + topbar)
- [x] Create shared components (DataTable, PageHeader, ConfirmDialog, StatusChip)
- [x] Migrate from CRA to Vite

### Phase 2: Authentication & Users ✅
- [x] Supabase Auth setup (email/password)
- [x] Login page with branding
- [x] Auth store (Zustand) with initialize, login, logout
- [x] AuthGuard component (role-based route protection)
- [x] useRoleAccess hook for granular permission checks
- [x] Users table + RLS policies (SQL)
- [x] Topbar integrated with real auth store

### Phase 3: Database Schema ✅
- [x] Full SQL migration script (supabase/schema.sql)
- [x] All 10 tables with indexes and constraints
- [x] RLS policies using get_my_role() SECURITY DEFINER function
- [x] FIFO stock deduction DB function (deduct_stock_fifo)
- [x] Helper views (medicine_stock_summary, low_stock, expiring_soon)
- [x] Auto-update triggers for updated_at
- [x] Seed scripts (categories, medicines, suppliers)

### Phase 4: Medicine & Category Management ✅
- [x] Medicine CRUD service
- [x] Medicines list with DataTable, debounced search, category filter
- [x] Medicine add/edit dialog with color-coded category chips
- [x] Category manager dialog (inline CRUD)
- [x] Role-based actions (edit/delete only for admin)
- [x] Soft-delete with confirmation dialog

### Phase 5: Supplier Management ✅
- [x] Supplier CRUD service
- [x] Suppliers list with DataTable, search
- [x] Supplier add/edit dialog (name, contact, phone, email, GST, address)
- [x] Role-based actions (admin only)
- [x] Soft-delete with confirmation

### Phase 6: Inventory & Stock ✅
- [x] Inventory page with 3 tabs: Stock Batches, Stock Summary, Purchase History
- [x] BatchList with expiry status chips (Expired/Expiring Soon/OK)
- [x] Purchase entry form (multi-item, supplier, invoice, medicine autocomplete)
- [x] Batch upsert on purchase (adds to existing batch or creates new)
- [x] Search + show/hide empty batches toggle

### Phase 7: Billing (POS) ✅
- [x] POS-style billing page (2-tab: New Bill + Bill History)
- [x] Medicine search with live autocomplete
- [x] Auto FIFO batch selection via deduct_stock_fifo DB function
- [x] Available stock shown per item, over-stock validation
- [x] BillSummary with customer info, payment method, discount, live totals
- [x] Bill history with date range filter + detail dialog

### Phase 8: Alerts & Monitoring ✅
- [x] Alerts page with 3 tabs + summary cards
- [x] Low stock, expiring soon, expired batches
- [x] Days-left calculation with color-coded display
- [x] Configurable thresholds (admin-only Settings tab)

### Phase 9: Reports & Dashboard ✅
- [x] Dashboard with role-aware summary cards + Recharts bar/line charts
- [x] Daily sales report with date picker, payment split
- [x] Stock report + Expiry report
- [x] Reports page with 3 tabs

### Phase 10: Polish & Hardening ✅
- [x] ErrorBoundary wrapping entire app
- [x] LoadingScreen, EmptyState, NotFoundPage (404)
- [x] Zod validation schemas
- [x] Role-based sidebar visibility
- [x] Industry-standard routing (/dashboard, /login, 404 catch-all)

### Phase 11: User Management & Role-Based Dashboard ✅
- [x] Supabase Edge Function (create-user) for secure user creation
- [x] Users list page with role chips, status badges
- [x] Add/edit user forms
- [x] Activate/deactivate users (prevent self-deactivation)
- [x] Role-based dashboard cards and sidebar menu

### Phase 12: API Security — Edge Function Proxies ✅

- [x] Identified security concern: browser DevTools exposing Supabase project ID, table names, query structure, and anon key
- [x] Created `medicines` Edge Function — server-side CRUD proxy (list/get/create/update/soft-delete)
- [x] Created `categories` Edge Function — server-side CRUD proxy (list/create/update/delete)
- [x] Created `suppliers` Edge Function — server-side CRUD proxy (list/get/create/update/soft-delete)
- [x] Created `inventory` Edge Function — stock batches, purchase entries, batch pricing, lookup
- [x] Created `billing` Edge Function — medicine search, FIFO billing, bill history/details
- [x] Created `alerts` Edge Function — low stock, expiring/expired batches, settings
- [x] Created `reports` Edge Function — dashboard stats, daily/monthly sales, charts, stock/expiry reports
- [x] Created `users` Edge Function — user list, update, activate/deactivate, profile fetch
- [x] Updated all service files to use `supabase.functions.invoke()` instead of direct queries
- [x] Updated `authStore.jsx` fetchProfile to use `users` Edge Function
- [x] Each Edge Function: authenticates caller via JWT, uses `service_role` key server-side, returns JSON
- [x] Browser now shows `POST /functions/v1/<name>` instead of `GET /rest/v1/<table>?select=...`
- [x] Deploy via Supabase Dashboard (Edge Functions > Deploy a new function) with "Verify JWT" OFF

#### Edge Function API Reference

**`medicines`** — `POST /functions/v1/medicines`

| Action   | Body                                                    | Description                          |
| -------- | ------------------------------------------------------- | ------------------------------------ |
| `list`   | `{ action: "list", search?, categoryId?, activeOnly? }` | List medicines with optional filters |
| `get`    | `{ action: "get", id }`                                 | Get single medicine by ID            |
| `create` | `{ action: "create", medicine }`                        | Create a new medicine                |
| `update` | `{ action: "update", id, updates }`                     | Update a medicine                    |
| `delete` | `{ action: "delete", id }`                              | Soft-delete (sets is_active: false)  |

**`categories`** — `POST /functions/v1/categories`

| Action   | Body                                | Description           |
| -------- | ----------------------------------- | --------------------- |
| `list`   | `{ action: "list" }`               | List all categories   |
| `create` | `{ action: "create", category }`   | Create a new category |
| `update` | `{ action: "update", id, updates }`| Update a category     |
| `delete` | `{ action: "delete", id }`         | Delete a category     |

**`suppliers`** — `POST /functions/v1/suppliers`

| Action   | Body                                          | Description                          |
| -------- | --------------------------------------------- | ------------------------------------ |
| `list`   | `{ action: "list", search?, activeOnly? }`    | List suppliers with optional filters |
| `get`    | `{ action: "get", id }`                       | Get single supplier by ID            |
| `create` | `{ action: "create", supplier }`              | Create a new supplier                |
| `update` | `{ action: "update", id, updates }`           | Update a supplier                    |
| `delete` | `{ action: "delete", id }`                    | Soft-delete (sets is_active: false)  |

**`inventory`** — `POST /functions/v1/inventory`

| Action                  | Body                                                         | Description                        |
| ----------------------- | ------------------------------------------------------------ | ---------------------------------- |
| `getStockBatches`       | `{ action: "getStockBatches", search?, medicineId?, showEmpty? }` | List stock batches with filters    |
| `getStockSummary`       | `{ action: "getStockSummary" }`                              | Aggregated stock per medicine      |
| `updateBatchQuantity`   | `{ action: "updateBatchQuantity", batchId, newQuantity }`    | Update batch quantity              |
| `updateBatchPricing`    | `{ action: "updateBatchPricing", batchId, selling_price, mrp }` | Update batch pricing            |
| `getPurchaseEntries`    | `{ action: "getPurchaseEntries" }`                           | List all purchase entries          |
| `getPurchaseEntry`      | `{ action: "getPurchaseEntry", id }`                         | Get purchase entry with items      |
| `createPurchaseEntry`   | `{ action: "createPurchaseEntry", entry, items }`            | Create purchase + upsert batches   |
| `getMedicineBatchDetails` | `{ action: "getMedicineBatchDetails", medicineId }`        | Batch details for medicine lookup  |

**`billing`** — `POST /functions/v1/billing`

| Action                    | Body                                                   | Description                     |
| ------------------------- | ------------------------------------------------------ | ------------------------------- |
| `searchMedicines`         | `{ action: "searchMedicines", search }`                | Search active medicines         |
| `searchMedicinesWithStock`| `{ action: "searchMedicinesWithStock", search }`       | Search medicines with stock > 0 |
| `getAvailableBatches`     | `{ action: "getAvailableBatches", medicineId }`        | Non-expired batches for billing |
| `createBill`              | `{ action: "createBill", bill, items, userId }`        | Create bill with FIFO deduction |
| `getBills`                | `{ action: "getBills", startDate?, endDate? }`         | List bills with date range      |
| `getBillDetails`          | `{ action: "getBillDetails", billId }`                 | Full bill with items and batches|

**`alerts`** — `POST /functions/v1/alerts`

| Action          | Body                                        | Description                  |
| --------------- | ------------------------------------------- | ---------------------------- |
| `getLowStock`   | `{ action: "getLowStock" }`                 | Low stock medicines          |
| `getExpiringSoon`| `{ action: "getExpiringSoon" }`            | Batches expiring soon        |
| `getExpired`    | `{ action: "getExpired" }`                  | Already expired batches      |
| `getSettings`   | `{ action: "getSettings" }`                | Alert threshold settings     |
| `updateSetting` | `{ action: "updateSetting", key, value }`  | Update a threshold setting   |

**`reports`** — `POST /functions/v1/reports`

| Action              | Body                                                  | Description                    |
| ------------------- | ----------------------------------------------------- | ------------------------------ |
| `getDashboardStats` | `{ action: "getDashboardStats", today }`              | Summary cards for dashboard    |
| `getDailySales`     | `{ action: "getDailySales", dayStart, dayEnd }`       | Bills for a specific day       |
| `getMonthlySales`   | `{ action: "getMonthlySales", months }`               | Monthly sales aggregation      |
| `getChartData`      | `{ action: "getChartData", buckets }`                 | Flexible chart data by buckets |
| `getStockReport`    | `{ action: "getStockReport" }`                        | Stock summary report           |
| `getExpiryReport`   | `{ action: "getExpiryReport" }`                       | All batches by expiry date     |

**`users`** — `POST /functions/v1/users`

| Action         | Body                                       | Description               |
| -------------- | ------------------------------------------ | ------------------------- |
| `list`         | `{ action: "list" }`                       | List all users            |
| `update`       | `{ action: "update", id, updates }`        | Update user profile       |
| `deactivate`   | `{ action: "deactivate", id }`             | Deactivate a user         |
| `activate`     | `{ action: "activate", id }`               | Activate a user           |
| `fetchProfile` | `{ action: "fetchProfile", userId }`       | Get user profile by ID    |

---

## Current Status

**Phase:** ALL PHASES COMPLETE (1-12)
**Status:** Production-ready
