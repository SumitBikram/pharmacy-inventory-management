# Pharmacy Inventory Management - Implementation Plan

## Tech Stack
- **Frontend:** React 19 (CRA)
- **Backend:** Supabase (Auth, Database, RLS)
- **State Management:** Zustand
- **UI Library:** Material UI (MUI) v6
- **Routing:** React Router v7
- **Forms:** React Hook Form + Zod validation
- **Date Handling:** date-fns

## Target Folder Structure

```
src/
├── app/
│   ├── App.js                    # Root component with router
│   └── theme.js                  # MUI theme configuration
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.js    # Sidebar + topbar layout shell
│   │   ├── Sidebar.js
│   │   └── Topbar.js
│   └── shared/
│       ├── DataTable.js          # Reusable MUI DataGrid wrapper
│       ├── FormDialog.js         # Reusable form modal
│       ├── ConfirmDialog.js      # Confirm action modal
│       ├── StatusChip.js         # Status badges
│       └── PageHeader.js         # Page title + actions bar
├── features/
│   ├── auth/
│   │   ├── LoginPage.js
│   │   ├── AuthGuard.js          # Route protection by role
│   │   ├── useAuth.js            # Auth hook (wraps store)
│   │   └── authStore.js          # Zustand auth store
│   ├── medicines/
│   │   ├── MedicinesPage.js
│   │   ├── MedicineForm.js
│   │   └── medicineService.js
│   ├── inventory/
│   │   ├── InventoryPage.js
│   │   ├── StockEntryForm.js
│   │   ├── BatchList.js
│   │   └── inventoryService.js
│   ├── billing/
│   │   ├── BillingPage.js        # POS interface
│   │   ├── BillItemRow.js
│   │   ├── BillSummary.js
│   │   ├── BillHistory.js
│   │   └── billingService.js     # FIFO logic
│   ├── suppliers/
│   │   ├── SuppliersPage.js
│   │   ├── SupplierForm.js
│   │   └── supplierService.js
│   ├── alerts/
│   │   ├── AlertsPage.js
│   │   └── alertService.js
│   └── reports/
│       ├── DashboardPage.js      # Main dashboard with charts
│       ├── SalesReport.js
│       ├── StockReport.js
│       ├── ExpiryReport.js
│       └── reportService.js
├── lib/
│   ├── supabase.js               # Supabase client init
│   └── constants.js              # App-wide constants
├── hooks/
│   └── useRoleAccess.js          # Role-based UI helpers
└── index.js
```

## Database Schema (Supabase/PostgreSQL)

### Tables

1. **users** — extends Supabase auth.users
2. **medicines** — master medicine catalog
3. **categories** — medicine categories
4. **suppliers** — supplier directory
5. **stock_batches** — batch-level inventory (core of the system)
6. **purchase_entries** — purchase records linking supplier → batches
7. **purchase_items** — line items in a purchase
8. **bills** — sales transactions
9. **bill_items** — line items in a bill (links to batch for FIFO)
10. **settings** — app config (alert thresholds, pharmacy info)

### Key Design Decisions
- **Batch-centric:** Stock is always tracked at the batch level (batch_no + expiry)
- **FIFO billing:** When billing, auto-select batches with earliest expiry first
- **Stock deduction:** Happens at bill creation via a Supabase DB function (atomic)
- **RLS:** Row-level security policies based on user role

---

## Implementation Phases

### Phase 1: Foundation ✅
- [x] Install dependencies (MUI, Zustand, React Router, Supabase, etc.)
- [x] Set up folder structure
- [x] Configure Supabase client
- [x] Create MUI theme
- [x] Set up routing skeleton
- [x] Create DashboardLayout (sidebar + topbar)
- [x] Create shared components (DataTable, PageHeader, ConfirmDialog, StatusChip)
- [x] Create placeholder pages for all modules
- [x] Verify build compiles

### Phase 2: Authentication & Users ✅
- [x] Supabase Auth setup (email/password)
- [x] Login page with email/password form
- [x] Auth store (Zustand) with initialize, login, logout
- [x] AuthGuard component (role-based route protection)
- [x] useRoleAccess hook for granular permission checks
- [x] Users table + RLS policies (SQL)
- [x] Topbar integrated with real auth store

### Phase 3: Database Schema ✅
- [x] Full SQL migration script (supabase/schema.sql)
- [x] Categories table
- [x] Medicines table with indexes
- [x] Suppliers table
- [x] Stock batches table (batch_no, expiry, qty, prices)
- [x] Purchase entries + items tables
- [x] Bills + bill items tables
- [x] Settings table with defaults
- [x] RLS policies for all tables (role-based)
- [x] FIFO stock deduction DB function (deduct_stock_fifo)
- [x] Helper views (medicine_stock_summary, low_stock, expiring_soon)
- [x] Auto-update triggers for updated_at
- [x] Seed script with sample categories

### Phase 4: Medicine & Category Management ✅
- [x] Medicine CRUD service (medicineService.js)
- [x] Medicines list page with DataTable, search, category filter
- [x] Medicine add/edit dialog form
- [x] Category manager dialog (inline CRUD)
- [x] Debounced search + category dropdown filter
- [x] Role-based actions (edit/delete only for admin)
- [x] Soft-delete (deactivate) with confirmation dialog
- [x] Snackbar notifications for success/error

### Phase 5: Supplier Management ✅
- [x] Supplier CRUD service (supplierService.js)
- [x] Suppliers list page with DataTable, search
- [x] Supplier add/edit dialog form (name, contact, phone, email, GST, address)
- [x] Role-based actions (admin only)
- [x] Soft-delete with confirmation

### Phase 6: Inventory & Stock ✅
- [x] Inventory service (getStockBatches, getMedicineStockSummary, createPurchaseEntry)
- [x] Inventory page with 3 tabs: Stock Batches, Stock Summary, Purchase History
- [x] BatchList component with expiry status chips (Expired/Expiring Soon/OK)
- [x] Purchase entry form (multi-item, supplier, invoice, medicine autocomplete)
- [x] Batch upsert on purchase (adds to existing batch or creates new)
- [x] Batches linked to suppliers and purchase entries
- [x] Search + show/hide empty batches toggle

### Phase 7: Billing (POS) ✅
- [x] Billing service — createBill calls DB FIFO function, getBills, getBillDetails
- [x] POS-style billing page (2-tab: New Bill + Bill History)
- [x] Medicine search with live autocomplete (debounced)
- [x] Auto FIFO batch selection via deduct_stock_fifo DB function
- [x] Available stock shown per item, over-stock validation
- [x] BillSummary — customer info, payment method, discount, live totals
- [x] Bill creation with atomic FIFO stock deduction
- [x] Bill history with date range filter
- [x] Bill detail dialog (items, batches, expiry, totals)

### Phase 8: Alerts & Monitoring ✅
- [x] Alert service (low stock, expiring soon, expired batches)
- [x] Alerts page with 3 tabs: Low Stock, Expiring Soon, Expired
- [x] Summary cards (low stock count, expiring soon count, expired count)
- [x] Days-left calculation with color-coded display
- [x] Configurable thresholds (admin-only Settings tab)

### Phase 9: Reports & Dashboard ✅
- [x] Report service (dashboard stats, daily sales, monthly data, stock, expiry)
- [x] Dashboard page with live stats (5 summary cards) + Recharts bar/line charts
- [x] Daily sales report with date picker, summary cards, payment split
- [x] Stock report (medicine stock summary table)
- [x] Expiry report (all batches sorted by expiry, stock value calculation)
- [x] Reports page with 3 tabs: Daily Sales, Stock, Expiry

### Phase 10: Polish & Hardening ✅
- [x] ErrorBoundary component wrapping entire app
- [x] LoadingScreen and EmptyState reusable components
- [x] Zod validation schemas (medicine, supplier, purchase item, bill item)
- [x] Role-based sidebar visibility (menu items hidden per role)
- [x] .gitignore updated for .env files
- [x] Final build verification (compiles clean)

### Phase 11: User Management & Role-Based Dashboard ✅
- [x] Supabase Edge Function (create-user) for secure user creation via service_role
- [x] User service (CRUD + activate/deactivate)
- [x] Users list page with DataTable (name, email, role, status, actions)
- [x] Add user form (email, password, name, role, phone) — calls Edge Function
- [x] Edit user (name, role, phone)
- [x] Activate/deactivate users (prevent self-deactivation)
- [x] Role-based dashboard cards (admin=all, accountant=stock, salesman=sales)
- [x] Role-based sidebar menu visibility (Users menu admin-only, Inventory hidden from salesman)
- [x] Tightened route guards (billing=admin+salesman, suppliers+users=admin, reports=admin+accountant)

---

## Current Status

**Phase:** ALL PHASES COMPLETE (1-11)
**Status:** Production-ready — deploy Edge Function and connect Supabase
