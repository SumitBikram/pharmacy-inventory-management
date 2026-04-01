import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import { searchMedicinesWithStock, getMedicineBatchDetails } from './lookupService';
import { getMedicine } from '../medicines/medicineService';
import { getExpiryStatus, formatMedicineName } from '../../lib/stockUtils';
import LookupEmptyState from './LookupEmptyState';

export default function MedicineLookupPage() {
  const [searchText, setSearchText] = useState('');
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicineInfo, setMedicineInfo] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Auto-focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Search medicines as user types
  useEffect(() => {
    if (searchText.length < 3) {
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
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // When medicine is selected, fetch details and batches
  useEffect(() => {
    if (!selectedMedicine) {
      setMedicineInfo(null);
      setBatches([]);
      return;
    }
    async function fetchDetails() {
      setLoading(true);
      try {
        const [info, batchData] = await Promise.all([
          getMedicine(selectedMedicine.id),
          getMedicineBatchDetails(selectedMedicine.id),
        ]);
        setMedicineInfo(info);
        setBatches(batchData);
      } catch {
        setMedicineInfo(null);
        setBatches([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [selectedMedicine]);

  const handleMedicineSelect = (_, value) => {
    setSelectedMedicine(value);
  };

  const today = new Date();
  const availableStock = batches
    .filter((b) => new Date(b.expiry_date) > today)
    .reduce((sum, b) => sum + b.quantity, 0);

  // Find the first non-expired batch index for FIFO highlight
  const firstValidIndex = batches.findIndex((b) => new Date(b.expiry_date) > today);

  const columns = [
    {
      field: 'batch_no',
      headerName: 'Batch No.',
      flex: 0.8,
      minWidth: 110,
    },
    {
      field: 'expiry_date',
      headerName: 'Expiry Date',
      flex: 0.8,
      minWidth: 140,
      renderCell: ({ value }) => {
        const status = getExpiryStatus(value);
        return (
          <>
            {format(new Date(value), 'dd MMM yyyy')}{' '}
            <Chip label={status.label} color={status.color} size="small" sx={{ ml: 0.5 }} />
          </>
        );
      },
    },
    {
      field: 'days_left',
      headerName: 'Days Left',
      width: 100,
      valueGetter: (_, row) => differenceInDays(new Date(row.expiry_date), today),
      renderCell: ({ value }) => (
        <Typography
          variant="body2"
          fontWeight={600}
          color={value < 0 ? 'error.main' : value <= 30 ? 'error.main' : value <= 90 ? 'warning.main' : 'success.main'}
        >
          {value < 0 ? `${Math.abs(value)}d overdue` : `${value}d`}
        </Typography>
      ),
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 80,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          color={value === 0 ? 'error' : value <= 20 ? 'warning' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'selling_price',
      headerName: 'Selling Price',
      width: 120,
      valueFormatter: (v) => v != null ? `\u20B9${parseFloat(v).toFixed(2)}` : '\u2014',
    },
    {
      field: 'mrp',
      headerName: 'MRP',
      width: 100,
      valueFormatter: (v) => (v ? `\u20B9${parseFloat(v).toFixed(2)}` : '—'),
    },
    {
      field: 'supplier',
      headerName: 'Supplier',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (value) => value?.name || '—',
    },
    {
      field: 'fifo',
      headerName: '',
      width: 90,
      sortable: false,
      renderCell: ({ row }) => {
        const idx = batches.findIndex((b) => b.id === row.id);
        if (idx === firstValidIndex && firstValidIndex >= 0) {
          return <Chip label="Sell First" size="small" color="success" sx={{ fontSize: '0.7rem' }} />;
        }
        return null;
      },
    },
  ];

  return (
    <Box>
      <PageHeader title="Medicine Lookup" subtitle="Search for any medicine to check stock and batch details" />

      <Box sx={{ width: '100%', maxWidth: 650, mx: 'auto', mb: 3 }}>
        <Autocomplete
          size="small"
          options={options}
          getOptionLabel={(opt) =>
            typeof opt === 'string'
              ? opt
              : `${formatMedicineName(opt.name, opt.packing, opt.unit)}${opt.generic_name ? ` (${opt.generic_name})` : ''}`
          }
          value={selectedMedicine}
          onChange={handleMedicineSelect}
          onInputChange={(_, val) => setSearchText(val)}
          loading={searching}
          filterOptions={(x) => x}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={searchInputRef}
              placeholder="Type medicine name to search..."
              slotProps={{
                input: {
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
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
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!selectedMedicine && !loading && (
        <Box sx={{ mt: 10 }}>
          <LookupEmptyState />
        </Box>
      )}

      {medicineInfo && !loading && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {formatMedicineName(medicineInfo.name, medicineInfo.packing, medicineInfo.unit)}
                  </Typography>
                  {medicineInfo.generic_name && (
                    <Typography variant="body2" color="text.secondary">
                      Generic: {medicineInfo.generic_name}
                    </Typography>
                  )}
                  {medicineInfo.manufacturer && (
                    <Typography variant="body2" color="text.secondary">
                      Manufacturer: {medicineInfo.manufacturer}
                    </Typography>
                  )}
                  {medicineInfo.category?.name && (
                    <Typography variant="body2" color="text.secondary">
                      Category: {medicineInfo.category.name}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { sm: 'right' } }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Available Stock
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    color={availableStock === 0 ? 'error.main' : availableStock <= 20 ? 'warning.main' : 'success.main'}
                  >
                    {availableStock}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    across {batches.filter((b) => new Date(b.expiry_date) > today).length} active batch(es)
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Typography variant="h6" sx={{ mb: 1 }}>
            Batch Details
          </Typography>
          <DataTable
            rows={batches}
            columns={columns}
            loading={false}
            pageSize={25}
            getRowClassName={({ row }) => {
              const idx = batches.findIndex((b) => b.id === row.id);
              if (idx === firstValidIndex && firstValidIndex >= 0) return 'fifo-highlight';
              return '';
            }}
            sx={{
              '& .fifo-highlight': {
                bgcolor: 'success.lighter',
              },
            }}
          />
        </>
      )}
    </Box>
  );
}
