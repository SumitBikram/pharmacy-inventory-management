import { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Chip, Typography } from '@mui/material';
import { format } from 'date-fns';
import DataTable from '../../components/shared/DataTable';
import BillDetailDialog from './BillDetailDialog';
import { getBills } from './billingService';

const paymentColors = { cash: 'success', card: 'primary', upi: 'secondary', credit: 'warning' };

export default function BillHistory() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBillId, setSelectedBillId] = useState(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBills({ startDate, endDate });
      setBills(data);
    } catch {
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const columns = [
    {
      field: 'bill_no',
      headerName: 'Bill #',
      width: 80,
      renderCell: ({ value }) => <Typography fontWeight={600}>#{value}</Typography>,
    },
    {
      field: 'created_at',
      headerName: 'Date & Time',
      width: 170,
      valueFormatter: (v) => format(new Date(v), 'dd MMM yyyy, hh:mm a'),
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (v) => v || 'Walk-in',
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 110,
      renderCell: ({ value }) => (
        <Typography fontWeight={600}>
          {'\u20B9'}
          {parseFloat(value).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'discount',
      headerName: 'Discount',
      width: 100,
      valueFormatter: (v) => (parseFloat(v) > 0 ? `\u20B9${parseFloat(v).toFixed(2)}` : '—'),
    },
    {
      field: 'payment_method',
      headerName: 'Payment',
      width: 100,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          color={paymentColors[value] || 'default'}
          variant="outlined"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'created_by_user',
      headerName: 'Billed By',
      flex: 0.6,
      minWidth: 100,
      valueGetter: (value) => value?.full_name || '—',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          type="date"
          label="From Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small"
          type="date"
          label="To Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <DataTable
        rows={bills}
        columns={columns}
        loading={loading}
        onRowClick={({ row }) => setSelectedBillId(row.id)}
      />

      <BillDetailDialog
        open={Boolean(selectedBillId)}
        billId={selectedBillId}
        onClose={() => setSelectedBillId(null)}
      />
    </Box>
  );
}
