import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { updateBatchPricing } from './inventoryService';

export default function BatchPricingDialog({ open, batch, onClose, onSaved }) {
  const [sellingPrice, setSellingPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && batch) {
      setSellingPrice(batch.selling_price != null ? String(batch.selling_price) : '');
      setMrp(batch.mrp != null ? String(batch.mrp) : '');
      setError('');
    }
  }, [open, batch]);

  const handleSave = async () => {
    setError('');
    const sp = sellingPrice ? parseFloat(sellingPrice) : null;
    const m = mrp ? parseFloat(mrp) : null;

    if (sp != null && sp <= 0) {
      setError('Selling price must be positive');
      return;
    }
    if (m != null && m <= 0) {
      setError('MRP must be positive');
      return;
    }

    setSaving(true);
    try {
      await updateBatchPricing(batch.id, { selling_price: sp, mrp: m });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!batch) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Batch Pricing</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {batch.medicine?.name || 'Medicine'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Batch: {batch.batch_no} &middot; Expiry: {format(new Date(batch.expiry_date), 'dd MMM yyyy')} &middot; Qty: {batch.quantity}
        </Typography>

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Selling Price"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="MRP"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : null}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
