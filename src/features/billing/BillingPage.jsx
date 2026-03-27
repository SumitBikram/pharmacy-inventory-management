import { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Add, PointOfSale } from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import BillItemRow from './BillItemRow';
import BillSummary from './BillSummary';
import BillHistory from './BillHistory';
import { createBill } from './billingService';
import useAuthStore from '../auth/authStore';
import { PAYMENT_METHODS } from '../../lib/constants';

const emptyItem = () => ({
  key: Date.now() + Math.random(),
  medicine_id: '',
  medicine_name: '',
  generic_name: '',
  quantity: '',
  unit_price: 0,
});

export default function BillingPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('new');
  const [items, setItems] = useState([emptyItem()]);
  const [bill, setBill] = useState({
    customer_name: '',
    customer_phone: '',
    payment_method: PAYMENT_METHODS.CASH,
    discount: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleUpdateItem = (index, updates) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const subtotal = items.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10) || 0;
    const price = item.unit_price || 0;
    return sum + qty * price;
  }, 0);

  const discount = parseFloat(bill.discount) || 0;
  const total = Math.max(subtotal - discount, 0);

  const resetBill = () => {
    setItems([emptyItem()]);
    setBill({
      customer_name: '',
      customer_phone: '',
      payment_method: PAYMENT_METHODS.CASH,
      discount: '',
      notes: '',
    });
  };

  const handleCreateBill = async () => {
    // Validate
    const validItems = items.filter((item) => item.medicine_id && item.quantity);
    if (validItems.length === 0) {
      showSnackbar('Add at least one medicine with quantity', 'error');
      return;
    }

    for (const item of validItems) {
      if (parseInt(item.quantity, 10) <= 0) {
        showSnackbar('All items must have a valid quantity', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const billData = {
        customer_name: bill.customer_name,
        customer_phone: bill.customer_phone,
        subtotal,
        discount,
        total,
        payment_method: bill.payment_method,
        notes: bill.notes,
      };

      const itemsData = validItems.map((item) => ({
        medicine_id: item.medicine_id,
        quantity: parseInt(item.quantity, 10),
      }));

      const result = await createBill(billData, itemsData, user?.id);
      showSnackbar(`Bill #${result.bill_no} created successfully!`);
      resetBill();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Billing" subtitle="Create new bills and view history" />

      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <TabList onChange={(_, v) => setTab(v)}>
            <Tab icon={<PointOfSale />} iconPosition="start" label="New Bill" value="new" />
            <Tab label="Bill History" value="history" />
          </TabList>
        </Box>

        <TabPanel value="new" sx={{ p: 0 }}>
          <Grid container spacing={3}>
            {/* Items table */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell align="center">Stock</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell width={50}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <BillItemRow
                        key={item.key}
                        item={item}
                        index={index}
                        onUpdate={handleUpdateItem}
                        onRemove={handleRemoveItem}
                        canRemove={items.length > 1}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={addItem}
                sx={{ mt: 1 }}
              >
                Add Item
              </Button>
            </Grid>

            {/* Summary panel */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <BillSummary
                bill={bill}
                onUpdate={(updates) => setBill((prev) => ({ ...prev, ...updates }))}
                subtotal={subtotal}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCreateBill}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <PointOfSale />}
                sx={{ mt: 2 }}
              >
                {saving ? 'Creating Bill...' : `Create Bill \u2014 \u20B9${total.toFixed(2)}`}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={resetBill}
                sx={{ mt: 1 }}
                disabled={saving}
              >
                Clear / Reset
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value="history" sx={{ p: 0 }}>
          <BillHistory />
        </TabPanel>
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
