import { supabase } from '../../lib/supabase';

export async function getLowStockMedicines() {
  const { data, error } = await supabase
    .from('low_stock_medicines')
    .select('*')
    .order('total_stock', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getExpiringSoonBatches() {
  const { data, error } = await supabase
    .from('expiring_soon_batches')
    .select('*')
    .order('expiry_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getExpiredBatches() {
  const { data, error } = await supabase
    .from('stock_batches')
    .select('*, medicine:medicines(id, name, generic_name)')
    .gt('quantity', 0)
    .lte('expiry_date', new Date().toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getAlertSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .in('key', ['low_stock_threshold', 'expiry_warning_days']);
  if (error) throw error;
  const settings = {};
  data.forEach((row) => {
    settings[row.key] = typeof row.value === 'string' ? parseInt(row.value, 10) : row.value;
  });
  return settings;
}

export async function updateAlertSetting(key, value) {
  const { error } = await supabase
    .from('settings')
    .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
    .eq('key', key);
  if (error) throw error;
}
