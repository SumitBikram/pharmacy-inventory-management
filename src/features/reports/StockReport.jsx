import { useState, useEffect } from 'react';
import { Box, Chip } from '@mui/material';
import { format } from 'date-fns';
import DataTable from '../../components/shared/DataTable';
import { getStockReport } from './reportService';

export default function StockReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        setData(await getStockReport());
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const columns = [
    { field: 'medicine_name', headerName: 'Medicine', flex: 1.3, minWidth: 160 },
    { field: 'generic_name', headerName: 'Generic Name', flex: 1, minWidth: 130, valueFormatter: (v) => v || '—' },
    { field: 'category_name', headerName: 'Category', flex: 0.7, minWidth: 100, valueFormatter: (v) => v || '—' },
    { field: 'manufacturer', headerName: 'Manufacturer', flex: 0.8, minWidth: 120, valueFormatter: (v) => v || '—' },
    {
      field: 'total_stock',
      headerName: 'Total Stock',
      width: 110,
      renderCell: ({ value }) => {
        const color = value === 0 ? 'error' : value <= 20 ? 'warning' : 'success';
        return <Chip label={value} size="small" color={color} variant="outlined" />;
      },
    },
    { field: 'active_batches', headerName: 'Batches', width: 80 },
    {
      field: 'earliest_expiry',
      headerName: 'Nearest Expiry',
      width: 140,
      valueFormatter: (v) => v ? format(new Date(v), 'dd MMM yyyy') : '—',
    },
  ];

  return (
    <Box>
      <DataTable
        rows={data}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.medicine_id}
        pageSize={25}
      />
    </Box>
  );
}
