import { useState, useEffect } from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Typography,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { searchMedicinesForBilling, getAvailableBatches } from './billingService';

export default function BillItemRow({ item, index, onUpdate, onRemove, canRemove }) {
  const [searchText, setSearchText] = useState('');
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [availableStock, setAvailableStock] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);

  // Search medicines as user types
  useEffect(() => {
    if (searchText.length < 2) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchMedicinesForBilling(searchText);
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
      return;
    }
    async function fetchBatches() {
      try {
        const batches = await getAvailableBatches(item.medicine_id);
        const totalQty = batches.reduce((sum, b) => sum + b.quantity, 0);
        // FIFO: price from earliest-expiry batch
        const price = batches.length > 0 ? parseFloat(batches[0].selling_price) : 0;
        setAvailableStock(totalQty);
        setUnitPrice(price);
        onUpdate(index, { unit_price: price });
      } catch {
        setAvailableStock(0);
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
  const lineTotal = qty * (item.unit_price || unitPrice);
  const isOverStock = qty > availableStock && item.medicine_id;

  return (
    <TableRow>
      <TableCell sx={{ minWidth: 250 }}>
        <Autocomplete
          size="small"
          options={options}
          getOptionLabel={(opt) =>
            typeof opt === 'string'
              ? opt
              : `${opt.name}${opt.generic_name ? ` (${opt.generic_name})` : ''}`
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
          {item.unit_price || unitPrice
            ? `\u20B9${(item.unit_price || unitPrice).toFixed(2)}`
            : '—'}
        </Typography>
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
