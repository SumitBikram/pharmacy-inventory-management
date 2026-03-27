import { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
  WarningAmber,
  EventBusy,
  Settings,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import {
  getLowStockMedicines,
  getExpiringSoonBatches,
  getExpiredBatches,
  getAlertSettings,
  updateAlertSetting,
} from './alertService';
import useRoleAccess from '../../hooks/useRoleAccess';

export default function AlertsPage() {
  const { isAdmin } = useRoleAccess();
  const [tab, setTab] = useState('low-stock');
  const [lowStock, setLowStock] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [expired, setExpired] = useState([]);
  const [settings, setSettings] = useState({ low_stock_threshold: 20, expiry_warning_days: 90 });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [lowData, expiringData, expiredData, settingsData] = await Promise.all([
          getLowStockMedicines(),
          getExpiringSoonBatches(),
          getExpiredBatches(),
          getAlertSettings(),
        ]);
        setLowStock(lowData);
        setExpiringSoon(expiringData);
        setExpired(expiredData);
        setSettings((prev) => ({ ...prev, ...settingsData }));
      } catch (err) {
        showSnackbar(err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await Promise.all([
        updateAlertSetting('low_stock_threshold', settings.low_stock_threshold),
        updateAlertSetting('expiry_warning_days', settings.expiry_warning_days),
      ]);
      showSnackbar('Alert settings updated');
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const lowStockColumns = [
    { field: 'medicine_name', headerName: 'Medicine', flex: 1.3, minWidth: 160 },
    { field: 'generic_name', headerName: 'Generic Name', flex: 1, minWidth: 130, valueFormatter: (v) => v || '—' },
    { field: 'category_name', headerName: 'Category', flex: 0.7, minWidth: 100, valueFormatter: (v) => v || '—' },
    {
      field: 'total_stock',
      headerName: 'Stock',
      width: 100,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          color={value === 0 ? 'error' : 'warning'}
          variant="outlined"
        />
      ),
    },
    { field: 'active_batches', headerName: 'Batches', width: 80 },
  ];

  const expiryColumns = [
    {
      field: 'medicine_name',
      headerName: 'Medicine',
      flex: 1.3,
      minWidth: 160,
    },
    { field: 'batch_no', headerName: 'Batch', flex: 0.6, minWidth: 100 },
    {
      field: 'expiry_date',
      headerName: 'Expiry Date',
      width: 140,
      renderCell: ({ value }) => {
        const days = differenceInDays(new Date(value), new Date());
        const color = days < 0 ? 'error' : days <= 30 ? 'error' : 'warning';
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
      field: 'days_left',
      headerName: 'Days Left',
      width: 100,
      valueGetter: (_, row) => differenceInDays(new Date(row.expiry_date), new Date()),
      renderCell: ({ value }) => (
        <Typography
          variant="body2"
          fontWeight={600}
          color={value < 0 ? 'error.main' : value <= 30 ? 'error.main' : 'warning.main'}
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
      valueFormatter: (v) => `\u20B9${parseFloat(v).toFixed(2)}`,
    },
  ];

  return (
    <Box>
      <PageHeader title="Alerts" subtitle="Low stock and expiry warnings" />

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WarningAmber color="warning" fontSize="large" />
              <Box>
                <Typography variant="h4" fontWeight={700}>{lowStock.length}</Typography>
                <Typography variant="body2" color="text.secondary">Low Stock Items</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EventBusy color="error" fontSize="large" />
              <Box>
                <Typography variant="h4" fontWeight={700}>{expiringSoon.length}</Typography>
                <Typography variant="body2" color="text.secondary">Expiring Soon</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.dark' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EventBusy sx={{ color: 'error.dark' }} fontSize="large" />
              <Box>
                <Typography variant="h4" fontWeight={700}>{expired.length}</Typography>
                <Typography variant="body2" color="text.secondary">Expired Batches</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <TabList onChange={(_, v) => setTab(v)}>
            <Tab label={`Low Stock (${lowStock.length})`} value="low-stock" />
            <Tab label={`Expiring Soon (${expiringSoon.length})`} value="expiring" />
            <Tab label={`Expired (${expired.length})`} value="expired" />
            {isAdmin && <Tab icon={<Settings />} iconPosition="start" label="Settings" value="settings" />}
          </TabList>
        </Box>

        <TabPanel value="low-stock" sx={{ p: 0 }}>
          <DataTable
            rows={lowStock}
            columns={lowStockColumns}
            loading={loading}
            getRowId={(row) => row.medicine_id}
            pageSize={25}
          />
        </TabPanel>

        <TabPanel value="expiring" sx={{ p: 0 }}>
          <DataTable rows={expiringSoon} columns={expiryColumns} loading={loading} pageSize={25} />
        </TabPanel>

        <TabPanel value="expired" sx={{ p: 0 }}>
          <DataTable rows={expired} columns={expiryColumns} loading={loading} pageSize={25} />
        </TabPanel>

        {isAdmin && (
          <TabPanel value="settings" sx={{ p: 0 }}>
            <Card sx={{ maxWidth: 500 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Alert Thresholds</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                  <TextField
                    type="number"
                    label="Low Stock Threshold (units)"
                    value={settings.low_stock_threshold}
                    onChange={(e) => setSettings((s) => ({ ...s, low_stock_threshold: parseInt(e.target.value, 10) || 0 }))}
                    helperText="Medicines with stock at or below this number will trigger a low stock alert"
                    slotProps={{ htmlInput: { min: 1 } }}
                  />
                  <TextField
                    type="number"
                    label="Expiry Warning (days before expiry)"
                    value={settings.expiry_warning_days}
                    onChange={(e) => setSettings((s) => ({ ...s, expiry_warning_days: parseInt(e.target.value, 10) || 0 }))}
                    helperText="Batches expiring within this many days will trigger an alert"
                    slotProps={{ htmlInput: { min: 1 } }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
        )}
      </TabContext>

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
