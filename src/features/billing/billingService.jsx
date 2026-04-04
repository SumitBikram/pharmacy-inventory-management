import { supabase } from '../../lib/supabase';

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('billing', { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function searchMedicinesForBilling(search) {
  return invoke({ action: 'searchMedicines', search });
}

export async function searchMedicinesWithStock(search) {
  return invoke({ action: 'searchMedicinesWithStock', search });
}

export async function getAvailableBatches(medicineId) {
  return invoke({ action: 'getAvailableBatches', medicineId });
}

export async function getTotalAvailableStock(medicineId) {
  const batches = await getAvailableBatches(medicineId);
  return batches.reduce((sum, b) => sum + b.quantity, 0);
}

export async function createBill(bill, items, userId) {
  return invoke({ action: 'createBill', bill, items, userId });
}

export async function getBills({ startDate, endDate } = {}) {
  return invoke({ action: 'getBills', startDate, endDate });
}

export async function getBillDetails(billId) {
  return invoke({ action: 'getBillDetails', billId });
}
