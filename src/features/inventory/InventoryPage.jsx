import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import BatchList from './BatchList';
import BatchPricingDialog from './BatchPricingDialog';
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

const VALID_SECTIONS = ['batches', 'summary', 'purchases', 'add-stock'];

const SECTION_TITLES = {
  batches: { title: 'Stock Batches', subtitle: 'View and manage stock batches' },
  summary: { title: 'Stock Summary', subtitle: 'Medicine-wise stock overview' },
  purchases: { title: 'Purchase History', subtitle: 'View past purchase entries' },
  'add-stock': { title: 'Stock Batches', subtitle: 'View and manage stock batches' },
};

export default function InventoryPage() {
  const { canManageStock } = useRoleAccess();
  const { user } = useAuthStore();
  const { section } = useParams();
  const navigate = useNavigate();

  // Derive the active data tab from the URL section
  const tab = section === 'add-stock' ? 'batches' : section;

  const [batches, setBatches] = useState([]);
  const [stockSummary, setStockSummary] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showEmpty, setShowEmpty] = useState(false);
  const [formOpen, setFormOpen] = useState(section === 'add-stock');
  const [pricingBatch, setPricingBatch] = useState(null);
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

  // Sync formOpen with URL section
  useEffect(() => {
    setFormOpen(section === 'add-stock');
  }, [section]);

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
      } catch {
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
      navigate('/inventory/batches');
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
    {
      field: 'medicine_name',
      headerName: 'Medicine',
      flex: 1.3,
      minWidth: 160,
      valueGetter: (_, row) => {
        if (!row.packing) return row.medicine_name;
        return `${row.medicine_name} (${row.packing}${row.unit ? ' ' + row.unit : ''})`;
      },
    },
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

  // Redirect invalid sections
  if (!VALID_SECTIONS.includes(section)) {
    return <Navigate to="/inventory/summary" replace />;
  }

  const { title, subtitle } = SECTION_TITLES[section] || SECTION_TITLES.batches;

  return (
    <Box>
      <PageHeader
        title={title}
        subtitle={subtitle}
        {...(section === 'summary' && canManageStock
          ? { actionLabel: 'Add Stock', onAction: () => navigate('/inventory/add-stock') }
          : {})}
      />

      {/* Stock Batches content (also shown for add-stock) */}
      {tab === 'batches' && (
        <>
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
          <BatchList
            batches={batches}
            loading={loading}
            onEditPricing={canManageStock ? (batch) => setPricingBatch(batch) : undefined}
          />
        </>
      )}

      {/* Stock Summary content */}
      {tab === 'summary' && (
        <DataTable
          rows={stockSummary}
          columns={summaryColumns}
          loading={loading}
          getRowId={(row) => row.medicine_id}
          pageSize={25}
        />
      )}

      {/* Purchase History content */}
      {tab === 'purchases' && (
        <DataTable rows={purchases} columns={purchaseColumns} loading={loading} />
      )}

      <BatchPricingDialog
        open={!!pricingBatch}
        batch={pricingBatch}
        onClose={() => setPricingBatch(null)}
        onSaved={() => {
          setPricingBatch(null);
          showSnackbar('Batch pricing updated');
          fetchData();
        }}
      />

      <StockEntryForm
        open={formOpen}
        onClose={() => navigate('/inventory/summary')}
        onSave={handleSavePurchase}
        suppliers={suppliers}
        medicines={medicines}
        onMedicineAdded={async () => {
          try {
            const medsData = await getMedicines();
            setMedicines(medsData);
          } catch {
            // non-blocking
          }
        }}
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
