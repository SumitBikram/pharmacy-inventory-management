-- Make selling_price nullable in stock_batches and purchase_items
-- This allows purchase entries to be saved without a selling price,
-- which can be set later by the user.

ALTER TABLE public.stock_batches ALTER COLUMN selling_price DROP NOT NULL;
ALTER TABLE public.purchase_items ALTER COLUMN selling_price DROP NOT NULL;

-- Update FIFO function to handle null selling_price with fallback to MRP
CREATE OR REPLACE FUNCTION public.deduct_stock_fifo(
  p_medicine_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE(batch_id UUID, batch_no TEXT, qty_deducted INTEGER, unit_price NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  remaining INTEGER := p_quantity;
  batch RECORD;
BEGIN
  FOR batch IN
    SELECT sb.id, sb.batch_no, sb.quantity, sb.selling_price, sb.mrp
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
      UPDATE public.stock_batches SET quantity = quantity - remaining WHERE id = batch.id;
      batch_id := batch.id;
      batch_no := batch.batch_no;
      qty_deducted := remaining;
      unit_price := COALESCE(batch.selling_price, batch.mrp, 0);
      remaining := 0;
      RETURN NEXT;
    ELSE
      UPDATE public.stock_batches SET quantity = 0 WHERE id = batch.id;
      batch_id := batch.id;
      batch_no := batch.batch_no;
      qty_deducted := batch.quantity;
      unit_price := COALESCE(batch.selling_price, batch.mrp, 0);
      remaining := remaining - batch.quantity;
      RETURN NEXT;
    END IF;
  END LOOP;

  IF remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient stock for medicine %. Short by % units.', p_medicine_id, remaining;
  END IF;
END;
$$;
