import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import DataTable from '../../components/shared/DataTable';
import { getDailySalesReport } from './reportService';

const paymentColors = { cash: 'success', card: 'primary', upi: 'secondary', credit: 'warning' };

export default function SalesReport() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const result = await getDailySalesReport(new Date(date));
        setBills(result.bills);
        setSummary(result.summary);
      } catch {
        setBills([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [date]);

  const columns = [
    {
      field: 'bill_no',
      headerName: 'Bill #',
      width: 80,
      renderCell: ({ value }) => <Typography fontWeight={600}>#{value}</Typography>,
    },
    {
      field: 'created_at',
      headerName: 'Time',
      width: 100,
      valueFormatter: (v) => format(new Date(v), 'hh:mm a'),
    },
    { field: 'customer_name', headerName: 'Customer', flex: 0.8, valueFormatter: (v) => v || 'Walk-in' },
    {
      field: 'total',
      headerName: 'Total',
      width: 110,
      renderCell: ({ value }) => (
        <Typography fontWeight={600}>{'\u20B9'}{parseFloat(value).toFixed(2)}</Typography>
      ),
    },
    {
      field: 'payment_method',
      headerName: 'Payment',
      width: 100,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={paymentColors[value] || 'default'} variant="outlined" sx={{ textTransform: 'capitalize' }} />
      ),
    },
    {
      field: 'created_by_user',
      headerName: 'Billed By',
      flex: 0.6,
      valueGetter: (value) => value?.full_name || '—',
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          type="date"
          label="Select Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Total Sales</Typography>
                <Typography variant="h5" fontWeight={700} color="primary">
                  {'\u20B9'}{summary.totalSales.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Bills</Typography>
                <Typography variant="h5" fontWeight={700}>{summary.billCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Discount Given</Typography>
                <Typography variant="h5" fontWeight={700} color="error">
                  {'\u20B9'}{summary.totalDiscount.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Payment Split</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {Object.entries(summary.byPayment).map(([method, data]) => (
                    <Chip
                      key={method}
                      label={`${method}: \u20B9${data.total.toFixed(0)}`}
                      size="small"
                      color={paymentColors[method] || 'default'}
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <DataTable rows={bills} columns={columns} loading={loading} />
    </Box>
  );
}
