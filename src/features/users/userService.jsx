import { supabase } from '../../lib/supabase';

async function invoke(fnName, body) {
  const { data, error } = await supabase.functions.invoke(fnName, { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getUsers() {
  return invoke('users', { action: 'list' });
}

export async function createUser({ email, password, full_name, role, phone }) {
  const data = await invoke('create-user', { email, password, full_name, role, phone });
  return data.user;
}

export async function updateUser(id, updates) {
  return invoke('users', { action: 'update', id, updates });
}

export async function deactivateUser(id) {
  return invoke('users', { action: 'deactivate', id });
}

export async function activateUser(id) {
  return invoke('users', { action: 'activate', id });
}
