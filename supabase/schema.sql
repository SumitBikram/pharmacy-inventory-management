-- ============================================
-- PharmaSuite Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Helper function to get current user's role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1. USERS (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'accountant', 'salesman')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.users FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (public.get_my_role() = 'admin');

-- 2. CATEGORIES
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read categories"
  ON public.categories FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.get_my_role() = 'admin');

-- 3. MEDICINES
-- ============================================
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  manufacturer TEXT,
  composition TEXT,
  hsn_code TEXT,
  unit TEXT DEFAULT 'pcs',
  prescription_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_medicines_name ON public.medicines(name);
CREATE INDEX idx_medicines_category ON public.medicines(category_id);

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read medicines"
  ON public.medicines FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage medicines"
  ON public.medicines FOR ALL
  USING (public.get_my_role() = 'admin');

-- 4. SUPPLIERS
-- ============================================
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gst_no TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read suppliers"
  ON public.suppliers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage suppliers"
  ON public.suppliers FOR ALL
  USING (public.get_my_role() = 'admin');

-- 5. STOCK BATCHES (core inventory table)
-- ============================================
CREATE TABLE public.stock_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  batch_no TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  purchase_price NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  mrp NUMERIC(10,2),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  purchase_entry_id UUID, -- linked after purchase_entries table is created
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(medicine_id, batch_no)
);

CREATE INDEX idx_stock_batches_medicine ON public.stock_batches(medicine_id);
CREATE INDEX idx_stock_batches_expiry ON public.stock_batches(expiry_date);
CREATE INDEX idx_stock_batches_quantity ON public.stock_batches(quantity);

ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stock"
  ON public.stock_batches FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Accountant can manage stock"
  ON public.stock_batches FOR ALL
  USING (public.get_my_role() IN ('admin', 'accountant'));

-- 6. PURCHASE ENTRIES
-- ============================================
CREATE TABLE public.purchase_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  invoice_no TEXT,
  invoice_date DATE,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stock_batches
  ADD CONSTRAINT fk_stock_batches_purchase
  FOREIGN KEY (purchase_entry_id) REFERENCES public.purchase_entries(id) ON DELETE SET NULL;

ALTER TABLE public.purchase_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read purchases"
  ON public.purchase_entries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Accountant can manage purchases"
  ON public.purchase_entries FOR ALL
  USING (public.get_my_role() IN ('admin', 'accountant'));

-- 7. PURCHASE ITEMS
-- ============================================
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_entry_id UUID NOT NULL REFERENCES public.purchase_entries(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  batch_no TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  purchase_price NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  mrp NUMERIC(10,2)
);

ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read purchase items"
  ON public.purchase_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Accountant can manage purchase items"
  ON public.purchase_items FOR ALL
  USING (public.get_my_role() IN ('admin', 'accountant'));

-- 8. BILLS
-- ============================================
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no SERIAL,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'credit')),
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bills_created_at ON public.bills(created_at);
CREATE INDEX idx_bills_bill_no ON public.bills(bill_no);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bills"
  ON public.bills FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Salesman can create bills"
  ON public.bills FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin', 'salesman'));

-- 9. BILL ITEMS
-- ============================================
CREATE TABLE public.bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES public.stock_batches(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);

ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bill items"
  ON public.bill_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin and Salesman can create bill items"
  ON public.bill_items FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin', 'salesman'));

-- 10. SETTINGS
-- ============================================
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings"
  ON public.settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage settings"
  ON public.settings FOR ALL
  USING (public.get_my_role() = 'admin');

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
  ('low_stock_threshold', '20'),
  ('expiry_warning_days', '90'),
  ('pharmacy_name', '"PharmaSuite"'),
  ('pharmacy_address', '""'),
  ('pharmacy_phone', '""'),
  ('gst_no', '""');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_stock_batches_updated_at
  BEFORE UPDATE ON public.stock_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FIFO BILLING FUNCTION
-- Deducts stock from batches with earliest expiry first
-- Returns the batch allocations used
-- ============================================
CREATE OR REPLACE FUNCTION deduct_stock_fifo(
  p_medicine_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE(batch_id UUID, batch_no TEXT, qty_deducted INTEGER, unit_price NUMERIC) AS $$
DECLARE
  remaining INTEGER := p_quantity;
  batch RECORD;
BEGIN
  FOR batch IN
    SELECT sb.id, sb.batch_no, sb.quantity, sb.selling_price
    FROM public.stock_batches sb
    WHERE sb.medicine_id = p_medicine_id
      AND sb.quantity > 0
      AND sb.expiry_date > CURRENT_DATE
    ORDER BY sb.expiry_date ASC, sb.created_at ASC
    FOR UPDATE
  LOOP
    IF remaining <= 0 THEN
      EXIT;
    END IF;

    IF batch.quantity >= remaining THEN
      -- This batch can fulfill the rest
      UPDATE public.stock_batches SET quantity = quantity - remaining WHERE id = batch.id;
      batch_id := batch.id;
      batch_no := batch.batch_no;
      qty_deducted := remaining;
      unit_price := batch.selling_price;
      remaining := 0;
      RETURN NEXT;
    ELSE
      -- Take all from this batch, continue to next
      UPDATE public.stock_batches SET quantity = 0 WHERE id = batch.id;
      batch_id := batch.id;
      batch_no := batch.batch_no;
      qty_deducted := batch.quantity;
      unit_price := batch.selling_price;
      remaining := remaining - batch.quantity;
      RETURN NEXT;
    END IF;
  END LOOP;

  IF remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient stock for medicine %. Short by % units.', p_medicine_id, remaining;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER VIEWS
-- ============================================

-- Medicine stock summary (total quantity across batches)
CREATE OR REPLACE VIEW public.medicine_stock_summary AS
SELECT
  m.id AS medicine_id,
  m.name AS medicine_name,
  m.generic_name,
  c.name AS category_name,
  m.manufacturer,
  COALESCE(SUM(sb.quantity), 0) AS total_stock,
  MIN(sb.expiry_date) FILTER (WHERE sb.quantity > 0) AS earliest_expiry,
  COUNT(sb.id) FILTER (WHERE sb.quantity > 0) AS active_batches
FROM public.medicines m
LEFT JOIN public.categories c ON c.id = m.category_id
LEFT JOIN public.stock_batches sb ON sb.medicine_id = m.id
GROUP BY m.id, m.name, m.generic_name, c.name, m.manufacturer;

-- Low stock alert view
CREATE OR REPLACE VIEW public.low_stock_medicines AS
SELECT *
FROM public.medicine_stock_summary
WHERE total_stock <= (
  SELECT (value::TEXT)::INTEGER FROM public.settings WHERE key = 'low_stock_threshold'
);

-- Expiring soon batches view
CREATE OR REPLACE VIEW public.expiring_soon_batches AS
SELECT
  sb.*,
  m.name AS medicine_name,
  m.generic_name
FROM public.stock_batches sb
JOIN public.medicines m ON m.id = sb.medicine_id
WHERE sb.quantity > 0
  AND sb.expiry_date <= CURRENT_DATE + (
    (SELECT (value::TEXT)::INTEGER FROM public.settings WHERE key = 'expiry_warning_days') || ' days'
  )::INTERVAL
ORDER BY sb.expiry_date ASC;
