import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  Box,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { format, addMonths } from 'date-fns';

const emptyItem = () => ({
  key: Date.now(),
  medicine_id: '',
  medicine_name: '',
  batch_no: '',
  expiry_date: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
  quantity: '',
  purchase_price: '',
  selling_price: '',
  mrp: '',
});

export default function StockEntryForm({ open, onClose, onSave, suppliers, medicines, loading }) {
  const [form, setForm] = useState({
    supplier_id: '',
    invoice_no: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });
  const [items, setItems] = useState([emptyItem()]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        supplier_id: '',
        invoice_no: '',
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      });
      setItems([emptyItem()]);
      setError('');
    }
  }, [open]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleMedicineSelect = (index, medicine) => {
    if (medicine) {
      handleItemChange(index, 'medicine_id', medicine.id);
      handleItemChange(index, 'medicine_name', medicine.name);
    } else {
      handleItemChange(index, 'medicine_id', '');
      handleItemChange(index, 'medicine_name', '');
    }
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.purchase_price) || 0;
      return sum + qty * price;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.supplier_id) {
      setError('Please select a supplier');
      return;
    }

    const validItems = items.filter((item) => item.medicine_id && item.batch_no && item.quantity);
    if (validItems.length === 0) {
      setError('Add at least one item with medicine, batch number and quantity');
      return;
    }

    for (const item of validItems) {
      if (!item.purchase_price || !item.selling_price) {
        setError('All items must have purchase price and selling price');
        return;
      }
    }

    const entryData = {
      ...form,
      total_amount: calculateTotal(),
    };

    const itemsData = validItems.map((item) => ({
      medicine_id: item.medicine_id,
      batch_no: item.batch_no,
      expiry_date: item.expiry_date,
      quantity: parseInt(item.quantity, 10),
      purchase_price: parseFloat(item.purchase_price),
      selling_price: parseFloat(item.selling_price),
      mrp: item.mrp ? parseFloat(item.mrp) : null,
    }));

    try {
      await onSave(entryData, itemsData);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>New Purchase Entry</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Header fields */}
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                required
                select
                label="Supplier"
                name="supplier_id"
                value={form.supplier_id}
                onChange={handleFormChange}
              >
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Invoice No."
                name="invoice_no"
                value={form.invoice_no}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Invoice Date"
                name="invoice_date"
                value={form.invoice_date}
                onChange={handleFormChange}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* Items table */}
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Items
            </Typography>
            <Button size="small" startIcon={<Add />} onClick={addItem}>
              Add Row
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200 }}>Medicine *</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Batch No. *</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Expiry Date</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Qty *</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Purchase Price *</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Selling Price *</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>MRP</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Line Total</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.key}>
                    <TableCell>
                      <Autocomplete
                        size="small"
                        options={medicines}
                        getOptionLabel={(opt) => opt.name || ''}
                        value={medicines.find((m) => m.id === item.medicine_id) || null}
                        onChange={(_, val) => handleMedicineSelect(index, val)}
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Search medicine" />
                        )}
                        isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={item.batch_no}
                        onChange={(e) => handleItemChange(index, 'batch_no', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        slotProps={{ htmlInput: { min: 1 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={item.purchase_price}
                        onChange={(e) => handleItemChange(index, 'purchase_price', e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={item.selling_price}
                        onChange={(e) => handleItemChange(index, 'selling_price', e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={item.mrp}
                        onChange={(e) => handleItemChange(index, 'mrp', e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {(
                          (parseFloat(item.quantity) || 0) * (parseFloat(item.purchase_price) || 0)
                        ).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Total + Notes */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
            <TextField
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              multiline
              rows={2}
              sx={{ flex: 1 }}
            />
            <Box sx={{ textAlign: 'right', minWidth: 180, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Amount
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary">
                {'\u20B9'}
                {calculateTotal().toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            Save Purchase Entry
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
