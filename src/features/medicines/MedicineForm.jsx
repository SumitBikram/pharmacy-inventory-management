import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from '@mui/material';

export default function MedicineForm({
  open,
  onClose,
  onSave,
  medicine,
  prefill,
  categories,
  loading,
}) {
  const [form, setForm] = useState({
    name: '',
    generic_name: '',
    category_id: '',
    manufacturer: '',
    composition: '',
    hsn_code: '',
    packing: '',
    unit: 'pcs',
    prescription_required: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (medicine) {
      setForm({
        name: medicine.name || '',
        generic_name: medicine.generic_name || '',
        category_id: medicine.category_id || '',
        manufacturer: medicine.manufacturer || '',
        composition: medicine.composition || '',
        hsn_code: medicine.hsn_code || '',
        packing: medicine.packing || '',
        unit: medicine.unit || 'pcs',
        prescription_required: medicine.prescription_required || false,
      });
    } else {
      setForm({
        name: prefill?.name || '',
        generic_name: '',
        category_id: '',
        manufacturer: '',
        composition: '',
        hsn_code: '',
        packing: '',
        unit: 'pcs',
        prescription_required: false,
      });
    }
    setError('');
  }, [medicine, prefill, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Medicine name is required');
      return;
    }

    const payload = {
      ...form,
      category_id: form.category_id || null,
    };

    try {
      await onSave(payload);
    } catch (err) {
      setError(err.message);
    }
  };

  const isEdit = Boolean(medicine);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                label="Medicine Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoFocus
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Generic Name"
                name="generic_name"
                value={form.generic_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Category"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
              >
                <MenuItem value="">None</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Manufacturer"
                name="manufacturer"
                value={form.manufacturer}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="HSN Code"
                name="hsn_code"
                value={form.hsn_code}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Packing"
                name="packing"
                value={form.packing}
                onChange={handleChange}
                placeholder="e.g. 10s, 15gm, 100ml"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Composition"
                name="composition"
                value={form.composition}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
              >
                <MenuItem value="pcs">Pieces</MenuItem>
                <MenuItem value="strip">Strips</MenuItem>
                <MenuItem value="bottle">Bottles</MenuItem>
                <MenuItem value="box">Boxes</MenuItem>
                <MenuItem value="tube">Tubes</MenuItem>
                <MenuItem value="ml">ML</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.prescription_required}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, prescription_required: e.target.checked }))
                    }
                  />
                }
                label="Prescription Required"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            {isEdit ? 'Update' : 'Add Medicine'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
