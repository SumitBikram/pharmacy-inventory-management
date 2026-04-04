# Pharmacy Inventory Management

A single-tenant pharmacy inventory management admin panel built with React and Supabase. Designed for real-world pharmacy use cases with batch-level stock tracking, FIFO billing, and role-based access control.

## Features

- **Authentication & Roles** — Email/password login with 3 roles: Admin, Accountant, Salesman
- **Medicine Management** — Full catalog with categories, search, and filtering
- **Batch-Based Inventory** — Stock tracked per batch with expiry dates and supplier links
- **POS Billing** — Fast billing interface with FIFO auto-deduction (earliest expiry first)
- **Supplier Management** — Supplier directory linked to purchase entries
- **Alerts** — Low stock and expiry warnings with configurable thresholds
- **Reports** — Daily sales, stock summary, and expiry reports with charts
- **User Management** — Admin can create/manage staff accounts via secure Edge Function

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite |
| UI | Material UI v7 |
| State | Zustand |
| Routing | React Router v7 |
| Backend | Supabase (Auth, PostgreSQL, RLS, Edge Functions) |
| Charts | Recharts |
| Validation | Zod, React Hook Form |
| Date | date-fns |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/SumitBikram/pharmacy-inventory-management.git
cd pharmacy-inventory-management
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Find these in **Supabase Dashboard > Settings > API**.

### 3. Set up the database

Run the following SQL files in **Supabase Dashboard > SQL Editor** in order:

1. `supabase/schema.sql` — Creates all tables, RLS policies, functions, and views
2. `supabase/fix_rls_policies.sql` — Applies the `get_my_role()` fix for RLS recursion
3. `supabase/seed.sql` — Adds sample categories and medicines
4. `supabase/seed_suppliers.sql` — Adds sample suppliers

### 4. Create the first admin user

1. Go to **Supabase Dashboard > Authentication > Users > Add User**
2. Create a user with email and password, then confirm the email
3. Copy the user's UUID and run in SQL Editor:

```sql
INSERT INTO public.users (id, email, full_name, role)
VALUES ('YOUR-UUID', 'your-email@example.com', 'Your Name', 'admin');
```

### 5. Deploy Edge Functions

Edge Functions are deployed and managed directly via **Supabase Dashboard > Edge Functions**. The function code lives on Supabase's servers, not in this repository.

Ensure **"Verify JWT"** is **OFF** for all functions (auth is handled in function code).

| Function | Purpose |
| --- | --- |
| `create-user` | Secure user creation by admins (uses service role to create auth + profile) |
| `medicines` | Server-side CRUD proxy for medicines (list, get, create, update, soft-delete) |
| `categories` | Server-side CRUD proxy for categories (list, create, update, delete) |
| `suppliers` | Server-side CRUD proxy for suppliers (list, get, create, update, soft-delete) |
| `inventory` | Stock batches, purchase entries, batch pricing, and lookup queries |
| `billing` | Medicine search, FIFO billing, bill history and details |
| `alerts` | Low stock, expiring/expired batches, and alert settings |
| `reports` | Dashboard stats, daily/monthly sales, charts, stock and expiry reports |
| `users` | User list, update, activate/deactivate, and profile fetch |

These Edge Functions act as a server-side proxy — the browser only sees `POST /functions/v1/<name>`, hiding table names, query structure, and credentials from DevTools.

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and log in with your admin credentials.

## Database Schema

10 tables with row-level security:

| Table | Description |
| --- | --- |
| `users` | Staff accounts with roles (extends Supabase auth) |
| `categories` | Medicine categories |
| `medicines` | Medicine catalog |
| `suppliers` | Supplier directory |
| `stock_batches` | Batch-level inventory (core table) |
| `purchase_entries` | Purchase records |
| `purchase_items` | Line items per purchase |
| `bills` | Sales transactions |
| `bill_items` | Line items per bill (linked to batches) |
| `settings` | App configuration (alert thresholds, pharmacy info) |

Key DB objects:

- `get_my_role()` — SECURITY DEFINER function to avoid RLS recursion
- `deduct_stock_fifo()` — Atomic FIFO stock deduction for billing
- `medicine_stock_summary` — Aggregated stock view
- `low_stock_medicines` — Alert view for low stock
- `expiring_soon_batches` — Alert view for upcoming expiry

## Role-Based Access

| Feature | Admin | Accountant | Salesman |
| --- | --- | --- | --- |
| Dashboard | Full | Stock-focused | Sales-focused |
| Medicines | CRUD | View | View |
| Inventory | Full | Full | Hidden |
| Billing | Full | Hidden | Full |
| Suppliers | CRUD | Hidden | Hidden |
| Alerts | All + Settings | All | All |
| Reports | All | All | Hidden |
| Users | CRUD | Hidden | Hidden |

## Project Structure

```
src/
├── app/              # Theme configuration
├── components/
│   ├── layout/       # DashboardLayout, Sidebar, Topbar
│   └── shared/       # DataTable, PageHeader, ErrorBoundary, NotFoundPage, etc.
├── features/
│   ├── auth/         # Login, AuthGuard, authStore
│   ├── medicines/    # Medicine & category CRUD
│   ├── inventory/    # Stock batches, purchase entries
│   ├── billing/      # POS billing with FIFO
│   ├── suppliers/    # Supplier CRUD
│   ├── users/        # User management (admin)
│   ├── alerts/       # Low stock & expiry alerts
│   └── reports/      # Dashboard, sales, stock, expiry reports
├── hooks/            # useRoleAccess
└── lib/              # Supabase client, constants, validations

supabase/
├── schema.sql                # Database schema
├── fix_rls_policies.sql      # RLS recursion fix
├── seed.sql                  # Sample data
└── seed_suppliers.sql        # Sample suppliers
# Edge Functions are deployed on Supabase Dashboard (not stored locally)
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
