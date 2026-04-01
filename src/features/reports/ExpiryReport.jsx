import { useState, useEffect } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { format, differenceInDays } from 'date-fns';
import DataTable from '../../components/shared/DataTable';
import { getExpiryReport } from './reportService';
import { formatMedicineName } from '../../lib/stockUtils';

export default function ExpiryReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        setData(await getExpiryReport());
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const columns = [
    {
      field: 'medicine',
      headerName: 'Medicine',
      flex: 1.3,
      minWidth: 160,
      valueGetter: (value) => formatMedicineName(value?.name, value?.packing, value?.unit),
    },
    {
      field: 'manufacturer',
      headerName: 'Manufacturer',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (_, row) => row.medicine?.manufacturer || '—',
    },
    { field: 'batch_no', headerName: 'Batch', flex: 0.6, minWidth: 100 },
    {
      field: 'expiry_date',
      headerName: 'Expiry Date',
      width: 140,
      renderCell: ({ value }) => {
        const days = differenceInDays(new Date(value), new Date());
        const color =
          days < 0 ? 'error' : days <= 30 ? 'error' : days <= 90 ? 'warning' : 'success';
        return (
          <Chip
            label={format(new Date(value), 'dd MMM yyyy')}
            size="small"
            color={color}
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'days_remaining',
      headerName: 'Days Left',
      width: 110,
      valueGetter: (_, row) => differenceInDays(new Date(row.expiry_date), new Date()),
      renderCell: ({ value }) => (
        <Typography
          variant="body2"
          fontWeight={600}
          color={
            value < 0
              ? 'error.main'
              : value <= 30
                ? 'error.main'
                : value <= 90
                  ? 'warning.main'
                  : 'success.main'
          }
        >
          {value < 0 ? `${Math.abs(value)}d overdue` : `${value}d`}
        </Typography>
      ),
    },
    { field: 'quantity', headerName: 'Qty', width: 80 },
    {
      field: 'selling_price',
      headerName: 'Selling Price',
      width: 110,
      valueFormatter: (v) => v != null ? `\u20B9${parseFloat(v).toFixed(2)}` : '\u2014',
    },
    {
      field: 'stock_value',
      headerName: 'Stock Value',
      width: 120,
      valueGetter: (_, row) => row.selling_price != null ? row.quantity * parseFloat(row.selling_price) : null,
      valueFormatter: (v) => v != null ? `\u20B9${v.toFixed(2)}` : '\u2014',
    },
  ];

  return (
    <Box>
      <DataTable rows={data} columns={columns} loading={loading} pageSize={25} />
    </Box>
  );
}
