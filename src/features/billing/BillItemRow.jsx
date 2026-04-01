import { useState, useEffect } from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Typography,
  Autocomplete,
  CircularProgress,
  Box,
  Chip,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { format } from 'date-fns';
import { searchMedicinesWithStock, getAvailableBatches } from './billingService';
import { formatMedicineName } from '../../lib/stockUtils';

export default function BillItemRow({ item, index, onUpdate, onRemove, canRemove }) {
  const [searchText, setSearchText] = useState('');
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [availableStock, setAvailableStock] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [batches, setBatches] = useState([]);

  // Search medicines as user types (only those with stock)
  useEffect(() => {
    if (searchText.length < 2) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchMedicinesWithStock(searchText);
        setOptions(results);
      } catch {
        setOptions([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchText]);

  // When medicine is selected, fetch available batches for stock info
  useEffect(() => {
    if (!item.medicine_id) {
      setAvailableStock(0);
      setUnitPrice(0);
      setBatches([]);
      return;
    }
    async function fetchBatches() {
      try {
        const batchData = await getAvailableBatches(item.medicine_id);
        const totalQty = batchData.reduce((sum, b) => sum + b.quantity, 0);
        // FIFO: price from earliest-expiry batch
        const price = batchData.length > 0 ? parseFloat(batchData[0].selling_price || batchData[0].mrp || 0) : 0;
        setAvailableStock(totalQty);
        setUnitPrice(price);
        setBatches(batchData);
        onUpdate(index, { unit_price: price });
      } catch {
        setAvailableStock(0);
        setBatches([]);
      }
    }
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.medicine_id]);

  const handleMedicineSelect = (_, value) => {
    if (value) {
      onUpdate(index, {
        medicine_id: value.id,
        medicine_name: value.name,
        generic_name: value.generic_name || '',
      });
    } else {
      onUpdate(index, {
        medicine_id: '',
        medicine_name: '',
        generic_name: '',
        quantity: '',
        unit_price: 0,
      });
    }
  };

  const handleQtyChange = (e) => {
    const qty = e.target.value;
    onUpdate(index, { quantity: qty });
  };

  const qty = parseInt(item.quantity, 10) || 0;
  const effectivePrice = item.unit_price || unitPrice;
  const lineTotal = qty * effectivePrice;
  const isOverStock = qty > availableStock && item.medicine_id;
  const isZeroPrice = item.medicine_id && effectivePrice === 0;

  return (
    <TableRow>
      <TableCell sx={{ minWidth: 280 }}>
        <Autocomplete
          size="small"
          options={options}
          getOptionLabel={(opt) =>
            typeof opt === 'string'
              ? opt
              : `${formatMedicineName(opt.name, opt.packing, opt.unit)}${opt.generic_name ? ` (${opt.generic_name})` : ''}`
          }
          value={
            item.medicine_id
              ? { id: item.medicine_id, name: item.medicine_name, generic_name: item.generic_name }
              : null
          }
          onChange={handleMedicineSelect}
          onInputChange={(_, val) => setSearchText(val)}
          loading={searching}
          filterOptions={(x) => x}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search medicine..."
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searching ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
        {item.medicine_id && batches.length > 0 && (
          <Box sx={{ mt: 0.5, pl: 0.5 }}>
            {batches.map((b, i) => (
              <Box
                key={b.id}
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  alignItems: 'center',
                  py: 0.25,
                  ...(i === 0 && {
                    bgcolor: 'success.lighter',
                    borderRadius: 0.5,
                    px: 0.5,
                  }),
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {b.batch_no} | Exp: {format(new Date(b.expiry_date), 'MMM yyyy')} | Qty: {b.quantity} | ₹{parseFloat(b.selling_price || b.mrp || 0).toFixed(2)}
                </Typography>
                {i === 0 && (
                  <Chip label="Sell First" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
              </Box>
            ))}
          </Box>
        )}
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2" color={availableStock <= 0 ? 'error' : 'text.secondary'}>
          {item.medicine_id ? availableStock : '—'}
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 90 }}>
        <TextField
          size="small"
          fullWidth
          type="number"
          value={item.quantity}
          onChange={handleQtyChange}
          error={isOverStock}
          helperText={isOverStock ? 'Exceeds stock' : ''}
          slotProps={{ htmlInput: { min: 1 } }}
          disabled={!item.medicine_id}
        />
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">
          {effectivePrice
            ? `\u20B9${effectivePrice.toFixed(2)}`
            : '—'}
        </Typography>
        {isZeroPrice && (
          <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
            No selling price set
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={600}>
          {lineTotal > 0 ? `\u20B9${lineTotal.toFixed(2)}` : '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <IconButton
          size="small"
          color="error"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
        >
          <Delete fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
