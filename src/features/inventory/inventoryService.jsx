import { supabase } from '../../lib/supabase';

// --- Stock Batches ---

export async function getStockBatches({ search = '', medicineId = '', showEmpty = false } = {}) {
  let query = supabase
    .from('stock_batches')
    .select('*, medicine:medicines(id, name, generic_name), supplier:suppliers(id, name)')
    .order('expiry_date', { ascending: true });

  if (!showEmpty) {
    query = query.gt('quantity', 0);
  }
  if (medicineId) {
    query = query.eq('medicine_id', medicineId);
  }
  if (search) {
    query = query.or(`batch_no.ilike.%${search}%,medicine.name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getMedicineStockSummary() {
  const { data, error } = await supabase
    .from('medicine_stock_summary')
    .select('*')
    .order('medicine_name');
  if (error) throw error;
  return data;
}

export async function updateBatchQuantity(batchId, newQuantity) {
  const { data, error } = await supabase
    .from('stock_batches')
    .update({ quantity: newQuantity })
    .eq('id', batchId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Purchase Entries ---

export async function getPurchaseEntries() {
  const { data, error } = await supabase
    .from('purchase_entries')
    .select('*, supplier:suppliers(id, name), created_by_user:users(full_name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPurchaseEntry(id) {
  const { data, error } = await supabase
    .from('purchase_entries')
    .select('*, supplier:suppliers(id, name), items:purchase_items(*, medicine:medicines(id, name))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createPurchaseEntry(entry, items) {
  // 1. Create purchase entry
  const { data: purchaseEntry, error: entryError } = await supabase
    .from('purchase_entries')
    .insert({
      supplier_id: entry.supplier_id,
      invoice_no: entry.invoice_no || null,
      invoice_date: entry.invoice_date || null,
      total_amount: entry.total_amount,
      notes: entry.notes || null,
      created_by: entry.created_by,
    })
    .select()
    .single();
  if (entryError) throw entryError;

  // 2. Create purchase items
  const purchaseItems = items.map((item) => ({
    purchase_entry_id: purchaseEntry.id,
    medicine_id: item.medicine_id,
    batch_no: item.batch_no,
    expiry_date: item.expiry_date,
    quantity: item.quantity,
    purchase_price: item.purchase_price,
    selling_price: item.selling_price,
    mrp: item.mrp || null,
  }));

  const { error: itemsError } = await supabase
    .from('purchase_items')
    .insert(purchaseItems);
  if (itemsError) throw itemsError;

  // 3. Upsert stock batches (add to existing batch or create new)
  for (const item of items) {
    // Check if batch already exists for this medicine
    const { data: existing, error: lookupError } = await supabase
      .from('stock_batches')
      .select('id, quantity')
      .eq('medicine_id', item.medicine_id)
      .eq('batch_no', item.batch_no)
      .maybeSingle();

    if (lookupError) {
      console.error('Stock batch lookup failed:', lookupError);
      throw new Error(`Failed to check existing stock for batch ${item.batch_no}: ${lookupError.message}`);
    }

    if (existing) {
      // Update existing batch quantity
      const { error: updateError } = await supabase
        .from('stock_batches')
        .update({
          quantity: existing.quantity + item.quantity,
          purchase_price: item.purchase_price,
          selling_price: item.selling_price,
          mrp: item.mrp || null,
          supplier_id: entry.supplier_id,
          purchase_entry_id: purchaseEntry.id,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Stock batch update failed:', updateError);
        throw new Error(`Failed to update stock batch for batch ${item.batch_no}: ${updateError.message}`);
      }
    } else {
      // Create new batch
      const { error: insertBatchError } = await supabase
        .from('stock_batches')
        .insert({
          medicine_id: item.medicine_id,
          batch_no: item.batch_no,
          expiry_date: item.expiry_date,
          quantity: item.quantity,
          purchase_price: item.purchase_price,
          selling_price: item.selling_price,
          mrp: item.mrp || null,
          supplier_id: entry.supplier_id,
          purchase_entry_id: purchaseEntry.id,
        });

      if (insertBatchError) {
        console.error('Stock batch insert failed:', insertBatchError);
        throw new Error(`Failed to create stock batch for batch ${item.batch_no}: ${insertBatchError.message}`);
      }
    }
  }

  return purchaseEntry;
}
