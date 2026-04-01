import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import { format } from 'date-fns';
import { getBillDetails } from './billingService';
import { formatMedicineName } from '../../lib/stockUtils';

export default function BillDetailDialog({ open, billId, onClose }) {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!billId || !open) return;
    async function load() {
      setLoading(true);
      try {
        const data = await getBillDetails(billId);
        setBill(data);
      } catch {
        setBill(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [billId, open]);

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  if (!bill) return null;

  const paymentLabel = { cash: 'Cash', card: 'Card', upi: 'UPI', credit: 'Credit' };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Bill #{bill.bill_no}
        <Typography variant="body2" color="text.secondary">
          {format(new Date(bill.created_at), 'dd MMM yyyy, hh:mm a')}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {/* Header info */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
          {bill.customer_name && (
            <Typography variant="body2">
              <strong>Customer:</strong> {bill.customer_name}
              {bill.customer_phone && ` (${bill.customer_phone})`}
            </Typography>
          )}
          <Typography variant="body2">
            <strong>Billed by:</strong> {bill.created_by_user?.full_name || '—'}
          </Typography>
          <Chip
            label={paymentLabel[bill.payment_method] || bill.payment_method}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Items table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Medicine</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Expiry</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bill.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {formatMedicineName(item.medicine?.name, item.medicine?.packing, item.medicine?.unit)}
                    {item.medicine?.generic_name && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {item.medicine.generic_name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{item.batch?.batch_no || '—'}</TableCell>
                  <TableCell>
                    {item.batch?.expiry_date
                      ? format(new Date(item.batch.expiry_date), 'MMM yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">
                    {'\u20B9'}
                    {parseFloat(item.unit_price).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {'\u20B9'}
                    {parseFloat(item.total_price).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Totals */}
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Typography variant="body2" color="text.secondary">
            Subtotal: {'\u20B9'}
            {parseFloat(bill.subtotal).toFixed(2)}
          </Typography>
          {parseFloat(bill.discount) > 0 && (
            <Typography variant="body2" color="error.main">
              Discount: -{'\u20B9'}
              {parseFloat(bill.discount).toFixed(2)}
            </Typography>
          )}
          <Divider sx={{ my: 1, ml: 'auto', width: 200 }} />
          <Typography variant="h6" fontWeight={700} color="primary">
            Total: {'\u20B9'}
            {parseFloat(bill.total).toFixed(2)}
          </Typography>
        </Box>

        {bill.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <strong>Notes:</strong> {bill.notes}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
