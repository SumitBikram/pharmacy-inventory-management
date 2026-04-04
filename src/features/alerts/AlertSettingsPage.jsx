import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import PageHeader from '../../components/shared/PageHeader';
import { getAlertSettings, updateAlertSetting } from './alertService';

export default function AlertSettingsPage() {
  const [settings, setSettings] = useState({ low_stock_threshold: 20, expiry_warning_days: 90 });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    getAlertSettings().then((data) => setSettings((prev) => ({ ...prev, ...data })));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateAlertSetting('low_stock_threshold', settings.low_stock_threshold),
        updateAlertSetting('expiry_warning_days', settings.expiry_warning_days),
      ]);
      setSnackbar({ open: true, message: 'Alert settings updated', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Alert Settings" subtitle="Configure alert thresholds" />
      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alert Thresholds
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              type="number"
              label="Low Stock Threshold (units)"
              value={settings.low_stock_threshold}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  low_stock_threshold: parseInt(e.target.value, 10) || 0,
                }))
              }
              helperText="Medicines with stock at or below this number will trigger a low stock alert"
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <TextField
              type="number"
              label="Expiry Warning (days before expiry)"
              value={settings.expiry_warning_days}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  expiry_warning_days: parseInt(e.target.value, 10) || 0,
                }))
              }
              helperText="Batches expiring within this many days will trigger an alert"
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{ alignSelf: 'flex-start' }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </CardContent>
      </Card>

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
