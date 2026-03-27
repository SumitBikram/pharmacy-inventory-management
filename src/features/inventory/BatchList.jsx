import { format, differenceInDays } from 'date-fns';
import { Chip } from '@mui/material';
import DataTable from '../../components/shared/DataTable';

function getExpiryStatus(expiryDate) {
  const days = differenceInDays(new Date(expiryDate), new Date());
  if (days < 0) return { label: 'Expired', color: 'error' };
  if (days <= 90) return { label: 'Expiring Soon', color: 'warning' };
  return { label: 'OK', color: 'success' };
}

export default function BatchList({ batches, loading }) {
  const columns = [
    {
      field: 'medicine',
      headerName: 'Medicine',
      flex: 1.3,
      minWidth: 160,
      valueGetter: (value) => value?.name || '—',
    },
    {
      field: 'batch_no',
      headerName: 'Batch No.',
      flex: 0.7,
      minWidth: 110,
    },
    {
      field: 'expiry_date',
      headerName: 'Expiry Date',
      flex: 0.8,
      minWidth: 130,
      renderCell: ({ value }) => {
        const status = getExpiryStatus(value);
        return (
          <>
            {format(new Date(value), 'dd MMM yyyy')}{' '}
            <Chip label={status.label} color={status.color} size="small" sx={{ ml: 0.5 }} />
          </>
        );
      },
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 80,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          color={value === 0 ? 'error' : value <= 20 ? 'warning' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'purchase_price',
      headerName: 'Purchase Price',
      width: 120,
      valueFormatter: (value) => `\u20B9${parseFloat(value).toFixed(2)}`,
    },
    {
      field: 'selling_price',
      headerName: 'Selling Price',
      width: 120,
      valueFormatter: (value) => `\u20B9${parseFloat(value).toFixed(2)}`,
    },
    {
      field: 'mrp',
      headerName: 'MRP',
      width: 100,
      valueFormatter: (value) => value ? `\u20B9${parseFloat(value).toFixed(2)}` : '—',
    },
    {
      field: 'supplier',
      headerName: 'Supplier',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (value) => value?.name || '—',
    },
  ];

  return <DataTable rows={batches} columns={columns} loading={loading} pageSize={25} />;
}
