import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import { Search, Category, Edit, Delete } from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import MedicineForm from './MedicineForm';
import CategoryManager from './CategoryManager';
import {
  getMedicines,
  getCategories,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} from './medicineService';
import useRoleAccess from '../../hooks/useRoleAccess';
import { formatMedicineName } from '../../lib/stockUtils';

export default function MedicinesPage() {
  const { canManageMedicines } = useRoleAccess();

  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [medsData, catsData] = await Promise.all([
        getMedicines({ search, categoryId: categoryFilter }),
        getCategories(),
      ]);
      setMedicines(medsData);
      setCategories(catsData);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchData]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editingMedicine) {
        await updateMedicine(editingMedicine.id, formData);
        showSnackbar('Medicine updated successfully');
      } else {
        await createMedicine(formData);
        showSnackbar('Medicine added successfully');
      }
      setFormOpen(false);
      setEditingMedicine(null);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMedicine(deleteTarget.id);
      showSnackbar('Medicine deactivated');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const categoryColors = {
    Tablets: { bg: '#e3f2fd', color: '#1565c0' },
    Syrups: { bg: '#fce4ec', color: '#c62828' },
    Injections: { bg: '#e8f5e9', color: '#2e7d32' },
    Topical: { bg: '#fff3e0', color: '#e65100' },
    Drops: { bg: '#e0f7fa', color: '#00838f' },
    Inhalers: { bg: '#f3e5f5', color: '#7b1fa2' },
    Supplements: { bg: '#fff8e1', color: '#f9a825' },
    Surgical: { bg: '#efebe9', color: '#4e342e' },
  };

  const getCategoryColor = (name) => categoryColors[name] || { bg: '#f5f5f5', color: '#616161' };

  const columns = [
    {
      field: 'name',
      headerName: 'Medicine Name',
      flex: 1.5,
      minWidth: 180,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" fontWeight={600}>
            {formatMedicineName(row.name, row.packing, row.unit)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'generic_name',
      headerName: 'Generic Name',
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'category',
      headerName: 'Category',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (value) => value?.name || '—',
      renderCell: ({ value }) => {
        if (value === '—') return '—';
        const colors = getCategoryColor(value);
        return (
          <Chip
            label={value}
            size="small"
            sx={{
              backgroundColor: colors.bg,
              color: colors.color,
              fontWeight: 500,
              border: 'none',
            }}
          />
        );
      },
    },
    {
      field: 'manufacturer',
      headerName: 'Manufacturer',
      flex: 1,
      minWidth: 130,
      valueFormatter: (value) => value || '—',
    },
    {
      field: 'unit',
      headerName: 'Unit',
      width: 80,
    },
    {
      field: 'prescription_required',
      headerName: 'Rx',
      width: 70,
      renderCell: ({ value }) => (value ? <Chip label="Rx" size="small" color="warning" /> : '—'),
    },
    ...(canManageMedicines
      ? [
          {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: ({ row }) => (
              <Box>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(row)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Deactivate">
                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ),
          },
        ]
      : []),
  ];

  return (
    <Box>
      <PageHeader
        title="Medicines"
        subtitle="Manage your medicine catalog"
        actionLabel={canManageMedicines ? 'Add Medicine' : undefined}
        onAction={() => {
          setEditingMedicine(null);
          setFormOpen(true);
        }}
      />

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search medicines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          size="small"
          select
          label="Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ minWidth: 180 }}
          slotProps={{
            select: {
              renderValue: (selected) => {
                if (!selected) return 'All Categories';
                const cat = categories.find((c) => c.id === selected);
                if (!cat) return 'All Categories';
                const colors = getCategoryColor(cat.name);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 0.5,
                        backgroundColor: colors.color,
                        flexShrink: 0,
                      }}
                    />
                    {cat.name}
                  </Box>
                );
              },
            },
          }}
        >
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((cat) => {
            const colors = getCategoryColor(cat.name);
            return (
              <MenuItem
                key={cat.id}
                value={cat.id}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 0.5,
                    backgroundColor: colors.color,
                    flexShrink: 0,
                  }}
                />
                {cat.name}
              </MenuItem>
            );
          })}
        </TextField>
        {canManageMedicines && (
          <Tooltip title="Manage Categories">
            <IconButton onClick={() => setCategoryOpen(true)} color="primary">
              <Category />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <DataTable rows={medicines} columns={columns} loading={loading} />

      {/* Medicine Form Dialog */}
      <MedicineForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMedicine(null);
        }}
        onSave={handleSave}
        medicine={editingMedicine}
        categories={categories}
        loading={saving}
      />

      {/* Category Manager Dialog */}
      <CategoryManager
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        categories={categories}
        onRefresh={fetchData}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Deactivate Medicine"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"? It will no longer appear in the active list but existing stock and bills will be preserved.`}
        confirmText="Deactivate"
        severity="warning"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Snackbar */}
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
