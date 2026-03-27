import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import { Edit, PersonOff, PersonAdd } from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import UserForm from './UserForm';
import {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
} from './userService';
import useAuthStore from '../auth/authStore';

const roleColors = { admin: 'error', accountant: 'primary', salesman: 'success' };

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await getUsers());
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (formData) => {
    console.log('[UsersPage] handleSave called with:', formData);
    console.log('[UsersPage] editingUser:', editingUser);
    setSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        showSnackbar('User updated');
      } else {
        console.log('[UsersPage] Calling createUser...');
        const result = await createUser(formData);
        console.log('[UsersPage] createUser result:', result);
        showSnackbar('User created successfully');
      }
      setFormOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      console.error('[UsersPage] handleSave error:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    try {
      if (toggleTarget.is_active) {
        await deactivateUser(toggleTarget.id);
        showSnackbar('User deactivated');
      } else {
        await activateUser(toggleTarget.id);
        showSnackbar('User activated');
      }
      setToggleTarget(null);
      fetchData();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const columns = [
    {
      field: 'full_name',
      headerName: 'Name',
      flex: 1.2,
      minWidth: 150,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.2,
      minWidth: 200,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          color={roleColors[value] || 'default'}
          variant="outlined"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      flex: 0.8,
      minWidth: 130,
      valueFormatter: (v) => v || '—',
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      renderCell: ({ value }) => (
        <Chip
          label={value ? 'Active' : 'Inactive'}
          size="small"
          color={value ? 'success' : 'default'}
          variant={value ? 'outlined' : 'filled'}
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 130,
      valueFormatter: (v) => format(new Date(v), 'dd MMM yyyy'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => {
        const isSelf = row.id === currentUser?.id;
        return (
          <Box>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => { setEditingUser(row); setFormOpen(true); }}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            {!isSelf && (
              <Tooltip title={row.is_active ? 'Deactivate' : 'Activate'}>
                <IconButton
                  size="small"
                  color={row.is_active ? 'error' : 'success'}
                  onClick={() => setToggleTarget(row)}
                >
                  {row.is_active ? <PersonOff fontSize="small" /> : <PersonAdd fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle="Manage staff accounts and roles"
        actionLabel="Add User"
        onAction={() => { setEditingUser(null); setFormOpen(true); }}
      />

      <DataTable rows={users} columns={columns} loading={loading} />

      <UserForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingUser(null); }}
        onSave={handleSave}
        user={editingUser}
        loading={saving}
      />

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.is_active ? 'Deactivate User' : 'Activate User'}
        message={
          toggleTarget?.is_active
            ? `Deactivate "${toggleTarget?.full_name}"? They will no longer be able to log in.`
            : `Activate "${toggleTarget?.full_name}"? They will be able to log in again.`
        }
        confirmText={toggleTarget?.is_active ? 'Deactivate' : 'Activate'}
        severity={toggleTarget?.is_active ? 'error' : 'info'}
        onConfirm={handleToggleActive}
        onCancel={() => setToggleTarget(null)}
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
