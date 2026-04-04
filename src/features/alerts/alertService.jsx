import { supabase } from '../../lib/supabase';

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('alerts', { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getLowStockMedicines() {
  return invoke({ action: 'getLowStock' });
}

export async function getExpiringSoonBatches() {
  return invoke({ action: 'getExpiringSoon' });
}

export async function getExpiredBatches() {
  return invoke({ action: 'getExpired' });
}

export async function getAlertSettings() {
  return invoke({ action: 'getSettings' });
}

export async function updateAlertSetting(key, value) {
  return invoke({ action: 'updateSetting', key, value });
}
