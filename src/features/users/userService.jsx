import { supabase } from '../../lib/supabase';

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createUser({ email, password, full_name, role, phone }) {
  console.log('[userService] createUser called with:', { email, full_name, role, phone });

  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { email, password, full_name, role, phone },
  });

  console.log('[userService] Edge Function response data:', data);
  console.log('[userService] Edge Function response error:', error);

  if (error) {
    throw new Error(error.message || 'Failed to create user');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.user;
}

export async function updateUser(id, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deactivateUser(id) {
  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

export async function activateUser(id) {
  const { error } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('id', id);
  if (error) throw error;
}
