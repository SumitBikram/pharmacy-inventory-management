import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Tab,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Search } from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import BatchList from './BatchList';
import StockEntryForm from './StockEntryForm';
import DataTable from '../../components/shared/DataTable';
import {
  getStockBatches,
  getMedicineStockSummary,
  getPurchaseEntries,
  createPurchaseEntry,
} from './inventoryService';
import { getMedicines } from '../medicines/medicineService';
import { getSuppliers } from '../suppliers/supplierService';
import useRoleAccess from '../../hooks/useRoleAccess';
import useAuthStore from '../auth/authStore';
import { format } from 'date-fns';

export default function InventoryPage() {
  const { canManageStock } = useRoleAccess();
  const { user } = useAuthStore();

  const [tab, setTab] = useState('batches');
  const [batches, setBatches] = useState([]);
  const [stockSummary, setStockSummary] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showEmpty, setShowEmpty] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'batches') {
        const data = await getStockBatches({ search, showEmpty });
        setBatches(data);
      } else if (tab === 'summary') {
        const data = await getMedicineStockSummary();
        setStockSummary(data);
      } else if (tab === 'purchases') {
        const data = await getPurchaseEntries();
        setPurchases(data);
      }
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [tab, search, showEmpty]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Load medicines and suppliers for purchase form
  useEffect(() => {
    async function loadFormData() {
      try {
        const [medsData, suppData] = await Promise.all([getMedicines(), getSuppliers()]);
        setMedicines(medsData);
        setSuppliers(suppData);
      } catch (err) {
        // non-blocking
      }
    }
    loadFormData();
  }, []);

  const handleSavePurchase = async (entry, items) => {
    if (!user?.id) {
      throw new Error(
        'You must be logged in to save a purchase entry. Please refresh and try again.',
      );
    }
    setSaving(true);
    try {
      await createPurchaseEntry({ ...entry, created_by: user.id }, items);
      showSnackbar('Purchase entry saved and stock updated');
      setFormOpen(false);
      fetchData();
    } catch (err) {
      if (err.message?.includes('row-level security') || err.code === '42501') {
        throw new Error(
          'Permission denied: your account role does not allow managing purchases. Contact an admin.',
          { cause: err },
        );
      }
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const summaryColumns = [
    { field: 'medicine_name', headerName: 'Medicine', flex: 1.3, minWidth: 160 },
    {
      field: 'generic_name',
      headerName: 'Generic Name',
      flex: 1,
      minWidth: 130,
      valueFormatter: (v) => v || '—',
    },
    {
      field: 'category_name',
      headerName: 'Category',
      flex: 0.7,
      minWidth: 110,
      valueFormatter: (v) => v || '—',
    },
    {
      field: 'manufacturer',
      headerName: 'Manufacturer',
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (v) => v || '—',
    },
    {
      field: 'total_stock',
      headerName: 'Total Stock',
      width: 110,
      renderCell: ({ value }) => {
        const color = value === 0 ? 'error' : value <= 20 ? 'warning' : 'success';
        return <Box sx={{ fontWeight: 700, color: `${color}.main` }}>{value}</Box>;
      },
    },
    { field: 'active_batches', headerName: 'Batches', width: 80 },
    {
      field: 'earliest_expiry',
      headerName: 'Nearest Expiry',
      width: 130,
      valueFormatter: (v) => (v ? format(new Date(v), 'dd MMM yyyy') : '—'),
    },
  ];

  const purchaseColumns = [
    {
      field: 'created_at',
      headerName: 'Date',
      width: 130,
      valueFormatter: (v) => format(new Date(v), 'dd MMM yyyy'),
    },
    {
      field: 'invoice_no',
      headerName: 'Invoice No.',
      flex: 0.6,
      minWidth: 110,
      valueFormatter: (v) => v || '—',
    },
    {
      field: 'supplier',
      headerName: 'Supplier',
      flex: 1,
      minWidth: 140,
      valueGetter: (value) => value?.name || '—',
    },
    {
      field: 'total_amount',
      headerName: 'Total Amount',
      width: 130,
      valueFormatter: (v) => `\u20B9${parseFloat(v).toFixed(2)}`,
    },
    {
      field: 'created_by_user',
      headerName: 'Created By',
      flex: 0.7,
      minWidth: 110,
      valueGetter: (value) => value?.full_name || '—',
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (v) => v || '—',
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Inventory"
        subtitle="Track stock batches and purchases"
        actionLabel={canManageStock ? 'Add Stock' : undefined}
        onAction={() => setFormOpen(true)}
      />

      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <TabList onChange={(_, v) => setTab(v)}>
            <Tab label="Stock Batches" value="batches" />
            <Tab label="Stock Summary" value="summary" />
            <Tab label="Purchase History" value="purchases" />
          </TabList>
        </Box>

        <TabPanel value="batches" sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 280 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showEmpty}
                  onChange={(e) => setShowEmpty(e.target.checked)}
                  size="small"
                />
              }
              label="Show empty batches"
            />
          </Box>
          <BatchList batches={batches} loading={loading} />
        </TabPanel>

        <TabPanel value="summary" sx={{ p: 0 }}>
          <DataTable
            rows={stockSummary}
            columns={summaryColumns}
            loading={loading}
            getRowId={(row) => row.medicine_id}
            pageSize={25}
          />
        </TabPanel>

        <TabPanel value="purchases" sx={{ p: 0 }}>
          <DataTable rows={purchases} columns={purchaseColumns} loading={loading} />
        </TabPanel>
      </TabContext>

      <StockEntryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSavePurchase}
        suppliers={suppliers}
        medicines={medicines}
        loading={saving}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
