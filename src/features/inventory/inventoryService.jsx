import { supabase } from '../../lib/supabase';

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('inventory', { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// --- Stock Batches ---

export async function getStockBatches({ search = '', medicineId = '', showEmpty = false } = {}) {
  return invoke({ action: 'getStockBatches', search, medicineId, showEmpty });
}

export async function getMedicineStockSummary() {
  return invoke({ action: 'getStockSummary' });
}

export async function updateBatchQuantity(batchId, newQuantity) {
  return invoke({ action: 'updateBatchQuantity', batchId, newQuantity });
}

export async function updateBatchPricing(batchId, { selling_price, mrp }) {
  return invoke({ action: 'updateBatchPricing', batchId, selling_price, mrp });
}

// --- Purchase Entries ---

export async function getPurchaseEntries() {
  return invoke({ action: 'getPurchaseEntries' });
}

export async function getPurchaseEntry(id) {
  return invoke({ action: 'getPurchaseEntry', id });
}

export async function createPurchaseEntry(entry, items) {
  return invoke({ action: 'createPurchaseEntry', entry, items });
}
