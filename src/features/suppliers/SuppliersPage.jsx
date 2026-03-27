import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import { Search, Edit, Delete, Phone, Email } from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import SupplierForm from './SupplierForm';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from './supplierService';
import useRoleAccess from '../../hooks/useRoleAccess';

export default function SuppliersPage() {
  const { canManageSuppliers } = useRoleAccess();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSuppliers({ search });
      setSuppliers(data);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
        showSnackbar('Supplier updated successfully');
      } else {
        await createSupplier(formData);
        showSnackbar('Supplier added successfully');
      }
      setFormOpen(false);
      setEditingSupplier(null);
      fetchData();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSupplier(deleteTarget.id);
      showSnackbar('Supplier deactivated');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Supplier Name',
      flex: 1.2,
      minWidth: 160,
    },
    {
      field: 'contact_person',
      headerName: 'Contact Person',
      flex: 1,
      minWidth: 140,
      valueFormatter: (value) => value || '—',
    },
    {
      field: 'phone',
      headerName: 'Phone',
      flex: 0.8,
      minWidth: 130,
      renderCell: ({ value }) =>
        value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Phone fontSize="small" color="action" />
            {value}
          </Box>
        ) : '—',
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 180,
      renderCell: ({ value }) =>
        value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Email fontSize="small" color="action" />
            {value}
          </Box>
        ) : '—',
    },
    {
      field: 'gst_no',
      headerName: 'GST No.',
      flex: 0.8,
      minWidth: 140,
      valueFormatter: (value) => value || '—',
    },
    ...(canManageSuppliers
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
        title="Suppliers"
        subtitle="Manage your supplier directory"
        actionLabel={canManageSuppliers ? 'Add Supplier' : undefined}
        onAction={() => {
          setEditingSupplier(null);
          setFormOpen(true);
        }}
      />

      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
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
      </Box>

      <DataTable rows={suppliers} columns={columns} loading={loading} />

      <SupplierForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingSupplier(null);
        }}
        onSave={handleSave}
        supplier={editingSupplier}
        loading={saving}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Deactivate Supplier"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"? Existing purchase records will be preserved.`}
        confirmText="Deactivate"
        severity="warning"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

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
