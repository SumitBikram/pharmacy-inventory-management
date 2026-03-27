import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

export default function DataTable({
  rows,
  columns,
  loading = false,
  pageSize = 10,
  onRowClick,
  ...props
}) {
  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        initialState={{
          pagination: { paginationModel: { pageSize } },
        }}
        pageSizeOptions={[5, 10, 25, 50]}
        onRowClick={onRowClick}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          border: 'none',
          backgroundColor: 'background.paper',
          borderRadius: 2,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#F5F5F5',
            fontWeight: 700,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
            cursor: onRowClick ? 'pointer' : 'default',
          },
        }}
        {...props}
      />
    </Box>
  );
}
