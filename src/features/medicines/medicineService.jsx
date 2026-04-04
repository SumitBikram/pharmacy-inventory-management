import { supabase } from '../../lib/supabase';

// Helper: invoke an Edge Function and return the parsed response
async function invoke(fnName, body) {
  const { data, error } = await supabase.functions.invoke(fnName, { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// --- Medicines ---

export async function getMedicines({ search = '', categoryId = '', activeOnly = true } = {}) {
  return invoke('medicines', { action: 'list', search, categoryId, activeOnly });
}

export async function getMedicine(id) {
  return invoke('medicines', { action: 'get', id });
}

export async function createMedicine(medicine) {
  return invoke('medicines', { action: 'create', medicine });
}

export async function updateMedicine(id, updates) {
  return invoke('medicines', { action: 'update', id, updates });
}

export async function deleteMedicine(id) {
  return invoke('medicines', { action: 'delete', id });
}

// --- Categories ---

export async function getCategories() {
  return invoke('categories', { action: 'list' });
}

export async function createCategory(category) {
  return invoke('categories', { action: 'create', category });
}

export async function updateCategory(id, updates) {
  return invoke('categories', { action: 'update', id, updates });
}

export async function deleteCategory(id) {
  return invoke('categories', { action: 'delete', id });
}
