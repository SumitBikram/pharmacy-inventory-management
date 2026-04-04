import { supabase } from '../../lib/supabase';
import {
  getLowStockMedicines,
  getExpiringSoonBatches,
  getExpiredBatches,
} from '../alerts/alertService';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
} from 'date-fns';

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('reports', { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getDashboardStats() {
  const today = format(new Date(), 'yyyy-MM-dd');
  return invoke({ action: 'getDashboardStats', today });
}

export async function getDailySalesReport(date) {
  const dayStart = format(startOfDay(date), "yyyy-MM-dd'T'HH:mm:ss");
  const dayEnd = format(endOfDay(date), "yyyy-MM-dd'T'HH:mm:ss");

  const data = await invoke({ action: 'getDailySales', dayStart, dayEnd });

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

  return invoke({ action: 'getMonthlySales', months });
}

const bucketConfigs = {
  day: {
    interval: eachDayOfInterval,
    start: startOfDay,
    end: endOfDay,
    labelFormat: 'dd MMM',
  },
  week: {
    interval: eachWeekOfInterval,
    start: startOfWeek,
    end: endOfWeek,
    labelFormat: 'dd MMM',
  },
  month: {
    interval: eachMonthOfInterval,
    start: startOfMonth,
    end: endOfMonth,
    labelFormat: 'MMM yyyy',
  },
  year: {
    interval: eachYearOfInterval,
    start: startOfYear,
    end: endOfYear,
    labelFormat: 'yyyy',
  },
};

export async function getChartData(granularity, startDate, endDate) {
  const config = bucketConfigs[granularity];
  if (!config) throw new Error(`Invalid granularity: ${granularity}`);

  const buckets = config.interval({ start: startDate, end: endDate }).map((date) => ({
    label: format(date, config.labelFormat),
    start: format(config.start(date), "yyyy-MM-dd'T'HH:mm:ss"),
    end: format(config.end(date), "yyyy-MM-dd'T'HH:mm:ss"),
  }));

  return invoke({ action: 'getChartData', buckets });
}

export async function getStockReport() {
  return invoke({ action: 'getStockReport' });
}

export async function getExpiryReport() {
  return invoke({ action: 'getExpiryReport' });
}

export async function getDashboardAlerts() {
  const [lowStock, expiringSoon, expired] = await Promise.all([
    getLowStockMedicines(),
    getExpiringSoonBatches(),
    getExpiredBatches(),
  ]);
  return { lowStock, expiringSoon, expired };
}
