import { Box, TextField, MenuItem, Typography, Divider, Grid } from '@mui/material';
import { PAYMENT_METHODS } from '../../lib/constants';

const paymentOptions = [
  { value: PAYMENT_METHODS.CASH, label: 'Cash' },
  { value: PAYMENT_METHODS.CARD, label: 'Card' },
  { value: PAYMENT_METHODS.UPI, label: 'UPI' },
  { value: PAYMENT_METHODS.CREDIT, label: 'Credit' },
];

export default function BillSummary({ bill, onUpdate, subtotal }) {
  const discount = parseFloat(bill.discount) || 0;
  const total = Math.max(subtotal - discount, 0);

  return (
    <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Bill Summary
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Customer Name"
            value={bill.customer_name}
            onChange={(e) => onUpdate({ customer_name: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Customer Phone"
            value={bill.customer_phone}
            onChange={(e) => onUpdate({ customer_phone: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            select
            label="Payment Method"
            value={bill.payment_method}
            onChange={(e) => onUpdate({ payment_method: e.target.value })}
          >
            {paymentOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Discount (₹)"
            value={bill.discount}
            onChange={(e) => onUpdate({ discount: e.target.value })}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            size="small"
            label="Notes"
            value={bill.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          Subtotal
        </Typography>
        <Typography variant="body2">
          {'\u20B9'}
          {subtotal.toFixed(2)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          Discount
        </Typography>
        <Typography variant="body2" color="error.main">
          {discount > 0 ? `-\u20B9${discount.toFixed(2)}` : '\u20B90.00'}
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          Total
        </Typography>
        <Typography variant="h6" fontWeight={700} color="primary">
          {'\u20B9'}
          {total.toFixed(2)}
        </Typography>
      </Box>
    </Box>
  );
}
