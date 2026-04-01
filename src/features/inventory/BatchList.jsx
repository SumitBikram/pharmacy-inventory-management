import { format } from 'date-fns';
import { Chip, IconButton, Tooltip } from '@mui/material';
import { Edit } from '@mui/icons-material';
import DataTable from '../../components/shared/DataTable';
import { getExpiryStatus, formatMedicineName } from '../../lib/stockUtils';

export default function BatchList({ batches, loading, onEditPricing }) {
  const columns = [
    {
      field: 'medicine',
      headerName: 'Medicine',
      flex: 1.3,
      minWidth: 160,
      valueGetter: (value) => formatMedicineName(value?.name, value?.packing, value?.unit),
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
      valueFormatter: (value) => value != null ? `\u20B9${parseFloat(value).toFixed(2)}` : '\u2014',
    },
    {
      field: 'mrp',
      headerName: 'MRP',
      width: 100,
      valueFormatter: (value) => (value ? `\u20B9${parseFloat(value).toFixed(2)}` : '—'),
    },
    {
      field: 'supplier',
      headerName: 'Supplier',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (value) => value?.name || '—',
    },
    ...(onEditPricing
      ? [
          {
            field: 'actions',
            headerName: '',
            width: 50,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: ({ row }) => (
              <Tooltip title="Edit Prices">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPricing(row);
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            ),
          },
        ]
      : []),
  ];

  return <DataTable rows={batches} columns={columns} loading={loading} pageSize={25} />;
}
