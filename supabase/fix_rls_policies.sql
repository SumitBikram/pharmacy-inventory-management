-- ============================================
-- FIX: RLS infinite recursion on users table
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create helper function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Fix USERS table policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

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

-- 3. Fix CATEGORIES policies
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.get_my_role() = 'admin');

-- 4. Fix MEDICINES policies
DROP POLICY IF EXISTS "Admins can manage medicines" ON public.medicines;
CREATE POLICY "Admins can manage medicines"
  ON public.medicines FOR ALL
  USING (public.get_my_role() = 'admin');

-- 5. Fix SUPPLIERS policies
DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;
CREATE POLICY "Admins can manage suppliers"
  ON public.suppliers FOR ALL
  USING (public.get_my_role() = 'admin');

-- 6. Fix STOCK BATCHES policies
DROP POLICY IF EXISTS "Admin and Accountant can manage stock" ON public.stock_batches;
CREATE POLICY "Admin and Accountant can manage stock"
  ON public.stock_batches FOR ALL
  USING (public.get_my_role() IN ('admin', 'accountant'));

-- 7. Fix PURCHASE ENTRIES policies
DROP POLICY IF EXISTS "Admin and Accountant can manage purchases" ON public.purchase_entries;
CREATE POLICY "Admin and Accountant can manage purchases"
  ON public.purchase_entries FOR ALL
  USING (public.get_my_role() IN ('admin', 'accountant'));

-- 8. Fix PURCHASE ITEMS policies
DROP POLICY IF EXISTS "Admin and Accountant can manage purchase items" ON public.purchase_items;
CREATE POLICY "Admin and Accountant can manage purchase items"
  ON public.purchase_items FOR ALL
  USING (public.get_my_role() IN ('admin', 'accountant'));

-- 9. Fix BILLS policies
DROP POLICY IF EXISTS "Admin and Salesman can create bills" ON public.bills;
CREATE POLICY "Admin and Salesman can create bills"
  ON public.bills FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin', 'salesman'));

-- 10. Fix BILL ITEMS policies
DROP POLICY IF EXISTS "Admin and Salesman can create bill items" ON public.bill_items;
CREATE POLICY "Admin and Salesman can create bill items"
  ON public.bill_items FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin', 'salesman'));

-- 11. Fix SETTINGS policies
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings"
  ON public.settings FOR ALL
  USING (public.get_my_role() = 'admin');
