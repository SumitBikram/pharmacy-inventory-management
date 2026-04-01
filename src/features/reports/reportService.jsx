import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';

export async function getDashboardStats() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const [
    { count: totalMedicines },
    { data: todayBills },
    { data: lowStock },
    { data: expiringSoon },
  ] = await Promise.all([
    supabase.from('medicines').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('bills')
      .select('total')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`),
    supabase.from('low_stock_medicines').select('medicine_id'),
    supabase.from('expiring_soon_batches').select('id'),
  ]);

  const todaySales = todayBills?.reduce((sum, b) => sum + parseFloat(b.total), 0) || 0;

  return {
    totalMedicines: totalMedicines || 0,
    todaySales,
    todayBillCount: todayBills?.length || 0,
    lowStockCount: lowStock?.length || 0,
    expiringSoonCount: expiringSoon?.length || 0,
  };
}

export async function getDailySalesReport(date) {
  const dayStart = format(startOfDay(date), "yyyy-MM-dd'T'HH:mm:ss");
  const dayEnd = format(endOfDay(date), "yyyy-MM-dd'T'HH:mm:ss");

  const { data, error } = await supabase
    .from('bills')
    .select('*, created_by_user:users(full_name)')
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const summary = {
    totalSales: data.reduce((sum, b) => sum + parseFloat(b.total), 0),
    totalDiscount: data.reduce((sum, b) => sum + parseFloat(b.discount || 0), 0),
    billCount: data.length,
    byPayment: {},
  };

  data.forEach((bill) => {
    const method = bill.payment_method;
    if (!summary.byPayment[method]) {
      summary.byPayment[method] = { count: 0, total: 0 };
    }
    summary.byPayment[method].count += 1;
    summary.byPayment[method].total += parseFloat(bill.total);
  });

  return { bills: data, summary };
}

export async function getMonthlySalesData(monthsBack = 6) {
  const months = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const start = format(startOfMonth(date), "yyyy-MM-dd'T'HH:mm:ss");
    const end = format(endOfMonth(date), "yyyy-MM-dd'T'HH:mm:ss");
    months.push({ label: format(date, 'MMM yyyy'), start, end });
  }

  const results = await Promise.all(
    months.map(async (m) => {
      const { data } = await supabase
        .from('bills')
        .select('total')
        .gte('created_at', m.start)
        .lte('created_at', m.end);
      const total = data?.reduce((sum, b) => sum + parseFloat(b.total), 0) || 0;
      const count = data?.length || 0;
      return { month: m.label, total, count };
    }),
  );

  return results;
}

export async function getStockReport() {
  const { data, error } = await supabase
    .from('medicine_stock_summary')
    .select('*')
    .order('total_stock', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getExpiryReport() {
  const { data, error } = await supabase
    .from('stock_batches')
    .select('*, medicine:medicines(id, name, generic_name, packing, unit, manufacturer)')
    .gt('quantity', 0)
    .order('expiry_date', { ascending: true });
  if (error) throw error;
  return data;
}
