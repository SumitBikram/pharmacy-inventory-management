import { supabase } from '../../lib/supabase';

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('suppliers', { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getSuppliers({ search = '', activeOnly = true } = {}) {
  return invoke({ action: 'list', search, activeOnly });
}

export async function getSupplier(id) {
  return invoke({ action: 'get', id });
}

export async function createSupplier(supplier) {
  return invoke({ action: 'create', supplier });
}

export async function updateSupplier(id, updates) {
  return invoke({ action: 'update', id, updates });
}

export async function deleteSupplier(id) {
  return invoke({ action: 'delete', id });
}
