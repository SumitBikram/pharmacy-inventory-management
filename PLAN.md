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
├── seed_suppliers.sql             # Sample suppliers
└── functions/
    └── create-user/
        └── index.ts               # Edge Function for user creation
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

---

## Current Status

**Phase:** ALL PHASES COMPLETE (1-11)
**Status:** Production-ready
