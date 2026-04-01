-- Migration: Add packing and unit fields to medicine-related views
-- Must DROP and recreate because adding columns changes view structure

-- Drop in dependency order (low_stock depends on medicine_stock_summary)
DROP VIEW IF EXISTS public.low_stock_medicines;
DROP VIEW IF EXISTS public.medicine_stock_summary;
DROP VIEW IF EXISTS public.expiring_soon_batches;

-- 1. Recreate medicine_stock_summary with packing and unit
CREATE VIEW public.medicine_stock_summary AS
SELECT
  m.id AS medicine_id,
  m.name AS medicine_name,
  m.generic_name,
  m.packing,
  m.unit,
  c.name AS category_name,
  m.manufacturer,
  COALESCE(SUM(sb.quantity), 0) AS total_stock,
  MIN(sb.expiry_date) FILTER (WHERE sb.quantity > 0) AS earliest_expiry,
  COUNT(sb.id) FILTER (WHERE sb.quantity > 0) AS active_batches
FROM public.medicines m
LEFT JOIN public.categories c ON c.id = m.category_id
LEFT JOIN public.stock_batches sb ON sb.medicine_id = m.id
GROUP BY m.id, m.name, m.generic_name, m.packing, m.unit, c.name, m.manufacturer;

-- 2. Recreate low_stock_medicines (depends on medicine_stock_summary)
CREATE VIEW public.low_stock_medicines AS
SELECT *
FROM public.medicine_stock_summary
WHERE total_stock <= (
  SELECT (value::TEXT)::INTEGER FROM public.settings WHERE key = 'low_stock_threshold'
);

-- 3. Recreate expiring_soon_batches with unit from medicines
-- Note: sb.* already includes packing from stock_batches, so only add m.unit
CREATE VIEW public.expiring_soon_batches AS
SELECT
  sb.*,
  m.name AS medicine_name,
  m.generic_name,
  m.unit
FROM public.stock_batches sb
JOIN public.medicines m ON m.id = sb.medicine_id
WHERE sb.quantity > 0
  AND sb.expiry_date <= CURRENT_DATE + (
    (SELECT (value::TEXT)::INTEGER FROM public.settings WHERE key = 'expiry_warning_days') || ' days'
  )::INTERVAL
ORDER BY sb.expiry_date ASC;
