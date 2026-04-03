import { useState, useEffect, useRef } from 'react';
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
import { Add, Delete, UploadFile, Download, AddCircleOutline } from '@mui/icons-material';
import parseExcelItems from './parseExcelItems';
import downloadPurchaseTemplate from './downloadPurchaseTemplate';
import MedicineForm from '../medicines/MedicineForm';
import { createMedicine, getCategories } from '../medicines/medicineService';
import { format, addMonths } from 'date-fns';

const emptyItem = () => ({
  key: Date.now(),
  medicine_id: '',
  medicine_name: '',
  hsn_code: '',
  packing: '',
  batch_no: '',
  expiry_date: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
  quantity: '',
  old_mrp: '',
  mrp: '',
  purchase_price: '',
  discount: 0,
  schedule_percent: 0,
  gst_percent: 0,
});

// Sticky column total widths (content + padding on both sides)
// Each cell has 8px horizontal padding (left + right), so total = content + 16px
const CELL_PAD = 16;
const STICKY_COLS = [
  { key: 'qty', width: 55 + CELL_PAD },
  { key: 'packing', width: 60 + CELL_PAD },
  { key: 'medicine', width: 180 + CELL_PAD },
  { key: 'hsn', width: 60 + CELL_PAD },
  { key: 'batchNo', width: 110 + CELL_PAD },
];

const STICKY_MAP = {};
let cumulativeLeft = 0;
for (const col of STICKY_COLS) {
  STICKY_MAP[col.key] = { width: col.width, left: cumulativeLeft };
  cumulativeLeft += col.width;
}

const makeStickyLeft = (key) => ({
  position: 'sticky',
  left: STICKY_MAP[key].left,
  zIndex: 2,
  backgroundColor: 'white',
  width: STICKY_MAP[key].width,
  minWidth: STICKY_MAP[key].width,
  maxWidth: STICKY_MAP[key].width,
  boxSizing: 'border-box',
});

const stickyRightSx = {
  position: 'sticky',
  right: 0,
  zIndex: 2,
  backgroundColor: 'white',
};

const RequiredMark = () => <span style={{ color: '#d32f2f' }}>*</span>;

function calculateLineAmount(item) {
  const qty = parseFloat(item.quantity) || 0;
  const rate = parseFloat(item.purchase_price) || 0;
  const discount = parseFloat(item.discount) || 0;
  const gst = parseFloat(item.gst_percent) || 0;
  return qty * rate * (1 - discount / 100) * (1 + gst / 100);
}

export default function StockEntryForm({ open, onClose, onSave, suppliers, medicines, onMedicineAdded, loading }) {
  const [form, setForm] = useState({
    supplier_id: '',
    invoice_no: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });
  const [items, setItems] = useState([emptyItem()]);
  const [error, setError] = useState('');
  const [importWarnings, setImportWarnings] = useState([]);
  const fileInputRef = useRef(null);

  // Add-medicine dialog state
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [addMedIndex, setAddMedIndex] = useState(null);
  const [addMedPrefill, setAddMedPrefill] = useState(null);
  const [addMedLoading, setAddMedLoading] = useState(false);
  const [categories, setCategories] = useState([]);

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
      setImportWarnings([]);
    }
  }, [open]);

  // Load categories when add-medicine dialog opens
  useEffect(() => {
    if (addMedOpen && categories.length === 0) {
      getCategories().then(setCategories).catch(() => {});
    }
  }, [addMedOpen, categories.length]);

  const handleAddMedicineOpen = (index, inputValue) => {
    setAddMedIndex(index);
    setAddMedPrefill({ name: inputValue || '' });
    setAddMedOpen(true);
  };

  const handleAddMedicineSave = async (medicineData) => {
    setAddMedLoading(true);
    try {
      const newMed = await createMedicine(medicineData);
      // Auto-select the new medicine in the row
      setItems((prev) => {
        const updated = [...prev];
        updated[addMedIndex] = {
          ...updated[addMedIndex],
          medicine_id: newMed.id,
          medicine_name: newMed.name,
          hsn_code: newMed.hsn_code || '',
          packing: newMed.packing || '',
        };
        return updated;
      });
      // Notify parent to refresh medicines list
      onMedicineAdded?.();
      setAddMedOpen(false);
    } finally {
      setAddMedLoading(false);
    }
  };

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
    setItems((prev) => {
      const updated = [...prev];
      if (medicine) {
        updated[index] = {
          ...updated[index],
          medicine_id: medicine.id,
          medicine_name: medicine.name,
          hsn_code: medicine.hsn_code || '',
          packing: medicine.packing || '',
        };
      } else {
        updated[index] = {
          ...updated[index],
          medicine_id: '',
          medicine_name: '',
          hsn_code: '',
          packing: '',
        };
      }
      return updated;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { items: parsed, warnings } = await parseExcelItems(file, medicines);
      if (parsed.length === 0) {
        setError('No valid rows found in the Excel file');
        return;
      }
      setItems(parsed);
      setImportWarnings(warnings);
      setError('');
    } catch (err) {
      setError(err.message);
    }
    // Reset file input so the same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateLineAmount(item), 0);
  };

  // Items that have data but no medicine_id (unmatched imports)
  const unmatchedItems = items.filter((item) => !item.medicine_id && (item.medicine_name || item.batch_no || item.quantity));
  const hasUnmatched = unmatchedItems.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.supplier_id) {
      setError('Please select a supplier');
      return;
    }

    if (hasUnmatched) {
      setError('Some items have unmatched medicines. Add them to the database before saving.');
      return;
    }

    const validItems = items.filter((item) => item.medicine_id && item.batch_no && item.quantity);
    if (validItems.length === 0) {
      setError('Add at least one item with medicine, batch number and quantity');
      return;
    }

    for (const item of validItems) {
      if (!item.purchase_price) {
        setError('All items must have purchase price (rate)');
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
      selling_price: null,
      mrp: item.mrp ? parseFloat(item.mrp) : null,
      packing: item.packing || null,
      discount: parseFloat(item.discount) || 0,
      schedule_percent: parseFloat(item.schedule_percent) || 0,
      gst_percent: parseFloat(item.gst_percent) || 0,
      old_mrp: item.old_mrp ? parseFloat(item.old_mrp) : null,
    }));

    try {
      await onSave(entryData, itemsData);
    } catch (err) {
      setError(err.message);
    }
  };

  const headCellSx = {
    fontWeight: 600,
    whiteSpace: 'nowrap',
    fontSize: '0.7rem',
    padding: '6px 8px',
    textAlign: 'center',
  };

  const bodyCellSx = {
    padding: '4px 8px',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
  };

  const inputSx = {
    '& .MuiInputBase-input': { fontSize: '0.75rem', padding: '6px 8px', whiteSpace: 'nowrap' },
    '& .MuiInputBase-root': { fontSize: '0.75rem' },
    minWidth: 60,
  };

  const narrowInputSx = {
    ...inputSx,
    minWidth: 50,
    maxWidth: 55,
    '& .MuiInputBase-input': { ...inputSx['& .MuiInputBase-input'], textAlign: 'center' },
  };

  const narrowLeftInputSx = {
    ...narrowInputSx,
    '& .MuiInputBase-input': { ...narrowInputSx['& .MuiInputBase-input'], textAlign: 'left' },
  };

  const priceInputSx = {
    ...inputSx,
    minWidth: 50,
    maxWidth: 70,
    '& .MuiInputBase-input': { ...inputSx['& .MuiInputBase-input'], textAlign: 'right' },
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
                size="small"
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
                size="small"
                label="Invoice No."
                name="invoice_no"
                value={form.invoice_no}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={fileInputRef}
                onChange={handleExcelImport}
                style={{ display: 'none' }}
              />
              <Button
                size="small"
                startIcon={<Download />}
                onClick={downloadPurchaseTemplate}
              >
                Template
              </Button>
              <Button
                size="small"
                startIcon={<UploadFile />}
                onClick={() => fileInputRef.current?.click()}
              >
                Import Excel
              </Button>
              <Button size="small" startIcon={<Add />} onClick={addItem}>
                Add Row
              </Button>
            </Box>
          </Box>

          {importWarnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 1 }} onClose={() => setImportWarnings([])}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                {importWarnings.length} medicine(s) not matched:
              </Typography>
              {importWarnings.map((w, i) => (
                <Typography key={i} variant="caption" display="block">
                  {w}
                </Typography>
              ))}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', pb: 1.5 }}>
            <Table size="small" sx={{ width: 'max-content', minWidth: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headCellSx, ...makeStickyLeft('qty'), zIndex: 3 }}>
                    Qty <RequiredMark />
                  </TableCell>
                  <TableCell sx={{ ...headCellSx, ...makeStickyLeft('packing'), zIndex: 3 }}>
                    Packing
                  </TableCell>
                  <TableCell sx={{ ...headCellSx, ...makeStickyLeft('medicine'), zIndex: 3 }}>
                    Medicine <RequiredMark />
                  </TableCell>
                  <TableCell sx={{ ...headCellSx, ...makeStickyLeft('hsn'), zIndex: 3 }}>
                    HSN
                  </TableCell>
                  <TableCell sx={{ ...headCellSx, ...makeStickyLeft('batchNo'), zIndex: 3 }}>
                    Batch No. <RequiredMark />
                  </TableCell>
                  <TableCell sx={headCellSx}>
                    Expiry <RequiredMark />
                  </TableCell>
                  <TableCell sx={headCellSx}>Old MRP</TableCell>
                  <TableCell sx={headCellSx}>MRP</TableCell>
                  <TableCell sx={headCellSx}>
                    Rate <RequiredMark />
                  </TableCell>
                  <TableCell sx={headCellSx}>Disc%</TableCell>
                  <TableCell sx={headCellSx}>Sch%</TableCell>
                  <TableCell sx={headCellSx}>GST%</TableCell>
                  <TableCell sx={headCellSx}>Amount</TableCell>
                  <TableCell
                    sx={{ ...headCellSx, ...stickyRightSx, zIndex: 3 }}
                  ></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.key}>
                    {/* Qty - sticky */}
                    <TableCell sx={{ ...bodyCellSx, ...makeStickyLeft('qty') }}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        slotProps={{ htmlInput: { min: 1 } }}
                        sx={narrowInputSx}
                      />
                    </TableCell>
                    {/* Packing - sticky */}
                    <TableCell sx={{ ...bodyCellSx, ...makeStickyLeft('packing') }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={item.packing}
                        onChange={(e) => handleItemChange(index, 'packing', e.target.value)}
                        placeholder="e.g. 10s"
                        sx={narrowLeftInputSx}
                      />
                    </TableCell>
                    {/* Medicine - sticky */}
                    <TableCell sx={{ ...bodyCellSx, ...makeStickyLeft('medicine') }}>
                      {item.medicine_name && !item.medicine_id ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography
                            variant="caption"
                            sx={{ color: 'error.main', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            noWrap
                            title={item.medicine_name}
                          >
                            {item.medicine_name}
                          </Typography>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleAddMedicineOpen(index, item.medicine_name)}
                            title="Add this medicine"
                          >
                            <AddCircleOutline fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Autocomplete
                          size="small"
                          options={medicines}
                          getOptionLabel={(opt) => {
                            if (!opt.name) return '';
                            if (!opt.packing) return opt.name;
                            return `${opt.name} (${opt.packing}${opt.unit ? ' ' + opt.unit : ''})`;
                          }}
                          value={medicines.find((m) => m.id === item.medicine_id) || null}
                          onChange={(_, val) => handleMedicineSelect(index, val)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Search medicine"
                              sx={inputSx}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val.id}
                          noOptionsText={
                            <Button
                              size="small"
                              startIcon={<AddCircleOutline />}
                              onClick={() => handleAddMedicineOpen(index, '')}
                              sx={{ textTransform: 'none' }}
                            >
                              Add new medicine
                            </Button>
                          }
                        />
                      )}
                    </TableCell>
                    {/* HSN - sticky, read-only */}
                    <TableCell sx={{ ...bodyCellSx, ...makeStickyLeft('hsn') }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={item.hsn_code}
                        slotProps={{ input: { readOnly: true } }}
                        sx={{
                          ...narrowInputSx,
                          '& .MuiInputBase-root': { backgroundColor: '#f5f5f5' },
                        }}
                      />
                    </TableCell>
                    {/* Batch No - sticky */}
                    <TableCell sx={{ ...bodyCellSx, ...makeStickyLeft('batchNo') }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={item.batch_no}
                        onChange={(e) => handleItemChange(index, 'batch_no', e.target.value)}
                        sx={inputSx}
                      />
                    </TableCell>
                    {/* Expiry Date */}
                    <TableCell sx={bodyCellSx}>
                      <TextField
                        size="small"
                        fullWidth
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)}
                        sx={inputSx}
                      />
                    </TableCell>
                    {/* Old MRP */}
                    <TableCell sx={bodyCellSx}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={item.old_mrp}
                        onChange={(e) => handleItemChange(index, 'old_mrp', e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                        sx={priceInputSx}
                      />
                    </TableCell>
                    {/* MRP */}
                    <TableCell sx={bodyCellSx}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={item.mrp}
                        onChange={(e) => handleItemChange(index, 'mrp', e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                        sx={priceInputSx}
                      />
                    </TableCell>
                    {/* Rate (purchase_price) */}
                    <TableCell sx={bodyCellSx}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={item.purchase_price}
                        onChange={(e) => handleItemChange(index, 'purchase_price', e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                        sx={priceInputSx}
                      />
                    </TableCell>
                    {/* Discount % */}
                    <TableCell sx={bodyCellSx}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                        slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                        sx={narrowInputSx}
                      />
                    </TableCell>
                    {/* Schedule % */}
                    <TableCell sx={bodyCellSx}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={item.schedule_percent}
                        onChange={(e) =>
                          handleItemChange(index, 'schedule_percent', e.target.value)
                        }
                        slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                        sx={narrowInputSx}
                      />
                    </TableCell>
                    {/* GST % */}
                    <TableCell sx={bodyCellSx}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={item.gst_percent}
                        onChange={(e) => handleItemChange(index, 'gst_percent', e.target.value)}
                        slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
                        sx={narrowInputSx}
                      />
                    </TableCell>
                    {/* Amount */}
                    <TableCell sx={{ ...bodyCellSx, textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={600} fontSize="0.75rem" noWrap>
                        {calculateLineAmount(item).toFixed(2)}
                      </Typography>
                    </TableCell>
                    {/* Delete - sticky right */}
                    <TableCell sx={{ ...bodyCellSx, ...stickyRightSx }}>
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
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
          {hasUnmatched && (
            <Typography variant="caption" color="error" sx={{ flex: 1 }}>
              {unmatchedItems.length} medicine(s) not in database — add them before saving
            </Typography>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || hasUnmatched}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            Save Purchase Entry
          </Button>
        </DialogActions>
      </form>

      <MedicineForm
        open={addMedOpen}
        onClose={() => setAddMedOpen(false)}
        onSave={handleAddMedicineSave}
        prefill={addMedPrefill}
        categories={categories}
        loading={addMedLoading}
      />
    </Dialog>
  );
}
