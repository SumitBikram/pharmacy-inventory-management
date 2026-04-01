import { supabase } from '../../lib/supabase';

export async function searchMedicinesForBilling(search) {
  if (!search || search.length < 2) return [];

  const { data, error } = await supabase
    .from('medicines')
    .select('id, name, generic_name, packing, unit')
    .eq('is_active', true)
    .or(`name.ilike.%${search}%,generic_name.ilike.%${search}%`)
    .limit(10);
  if (error) throw error;
  return data;
}

export async function searchMedicinesWithStock(search) {
  if (!search || search.length < 2) return [];
  const today = new Date().toISOString().split('T')[0];

  // Get medicine IDs that have available (non-expired) stock
  const { data: stockData, error: stockError } = await supabase
    .from('stock_batches')
    .select('medicine_id')
    .gt('quantity', 0)
    .gt('expiry_date', today);
  if (stockError) throw stockError;

  const inStockIds = [...new Set(stockData.map((r) => r.medicine_id))];
  if (inStockIds.length === 0) return [];

  const { data, error } = await supabase
    .from('medicines')
    .select('id, name, generic_name, packing, unit')
    .eq('is_active', true)
    .in('id', inStockIds)
    .or(`name.ilike.%${search}%,generic_name.ilike.%${search}%`)
    .limit(10);
  if (error) throw error;
  return data;
}

export async function getAvailableBatches(medicineId) {
  const { data, error } = await supabase
    .from('stock_batches')
    .select('id, batch_no, expiry_date, quantity, selling_price, mrp')
    .eq('medicine_id', medicineId)
    .gt('quantity', 0)
    .gt('expiry_date', new Date().toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getTotalAvailableStock(medicineId) {
  const batches = await getAvailableBatches(medicineId);
  return batches.reduce((sum, b) => sum + b.quantity, 0);
}

export async function createBill(bill, items, userId) {
  // 1. Create bill record
  const { data: billRecord, error: billError } = await supabase
    .from('bills')
    .insert({
      customer_name: bill.customer_name || null,
      customer_phone: bill.customer_phone || null,
      subtotal: bill.subtotal,
      discount: bill.discount || 0,
      total: bill.total,
      payment_method: bill.payment_method,
      notes: bill.notes || null,
      created_by: userId,
    })
    .select()
    .single();
  if (billError) throw billError;

  // 2. For each item, call FIFO deduction and create bill_items
  for (const item of items) {
    const { data: allocations, error: fifoError } = await supabase.rpc('deduct_stock_fifo', {
      p_medicine_id: item.medicine_id,
      p_quantity: item.quantity,
    });
    if (fifoError) throw fifoError;

    // Create bill_items from FIFO allocations
    const billItems = allocations.map((alloc) => ({
      bill_id: billRecord.id,
      medicine_id: item.medicine_id,
      batch_id: alloc.batch_id,
      quantity: alloc.qty_deducted,
      unit_price: alloc.unit_price,
      total_price: alloc.qty_deducted * alloc.unit_price,
    }));

    const { error: itemsError } = await supabase.from('bill_items').insert(billItems);
    if (itemsError) throw itemsError;
  }

  return billRecord;
}

export async function getBills({ startDate, endDate } = {}) {
  let query = supabase
    .from('bills')
    .select('*, created_by_user:users(full_name)')
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', `${startDate}T00:00:00`);
  }
  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getBillDetails(billId) {
  const { data, error } = await supabase
    .from('bills')
    .select(
      `
      *,
      created_by_user:users(full_name),
      items:bill_items(
        *,
        medicine:medicines(id, name, generic_name, packing, unit),
        batch:stock_batches(batch_no, expiry_date)
      )
    `,
    )
    .eq('id', billId)
    .single();
  if (error) throw error;
  return data;
}
