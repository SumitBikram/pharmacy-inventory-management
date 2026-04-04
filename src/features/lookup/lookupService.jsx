import { supabase } from '../../lib/supabase';

export { searchMedicinesWithStock } from '../billing/billingService';

export async function getMedicineBatchDetails(medicineId) {
  const { data, error } = await supabase.functions.invoke('inventory', {
    body: { action: 'getMedicineBatchDetails', medicineId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
