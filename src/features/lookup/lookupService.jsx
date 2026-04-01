import { supabase } from '../../lib/supabase';

export { searchMedicinesWithStock } from '../billing/billingService';

export async function getMedicineBatchDetails(medicineId) {
  const { data, error } = await supabase
    .from('stock_batches')
    .select('id, batch_no, expiry_date, quantity, selling_price, mrp, supplier:suppliers(name)')
    .eq('medicine_id', medicineId)
    .gt('quantity', 0)
    .order('expiry_date', { ascending: true });
  if (error) throw error;
  return data;
}
