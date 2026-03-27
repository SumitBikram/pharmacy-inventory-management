import { supabase } from '../../lib/supabase';

export async function getMedicines({ search = '', categoryId = '', activeOnly = true } = {}) {
  let query = supabase.from('medicines').select('*, category:categories(id, name)').order('name');

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,generic_name.ilike.%${search}%,manufacturer.ilike.%${search}%`,
    );
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getMedicine(id) {
  const { data, error } = await supabase
    .from('medicines')
    .select('*, category:categories(id, name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createMedicine(medicine) {
  const { data, error } = await supabase
    .from('medicines')
    .insert(medicine)
    .select('*, category:categories(id, name)')
    .single();
  if (error) throw error;
  return data;
}

export async function updateMedicine(id, updates) {
  const { data, error } = await supabase
    .from('medicines')
    .update(updates)
    .eq('id', id)
    .select('*, category:categories(id, name)')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMedicine(id) {
  const { error } = await supabase.from('medicines').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

// --- Categories ---

export async function getCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function createCategory(category) {
  const { data, error } = await supabase.from('categories').insert(category).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, updates) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
