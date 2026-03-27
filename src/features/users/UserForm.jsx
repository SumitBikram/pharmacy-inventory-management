import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ROLES } from '../../lib/constants';

const roleOptions = [
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.ACCOUNTANT, label: 'Accountant' },
  { value: ROLES.SALESMAN, label: 'Salesman' },
];

export default function UserForm({ open, onClose, onSave, user, loading }) {
  const isEdit = Boolean(user);

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: ROLES.SALESMAN,
    phone: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || '',
        password: '',
        full_name: user.full_name || '',
        role: user.role || ROLES.SALESMAN,
        phone: user.phone || '',
      });
    } else {
      setForm({
        email: '',
        password: '',
        full_name: '',
        role: ROLES.SALESMAN,
        phone: '',
      });
    }
    setError('');
  }, [user, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    console.log('[UserForm] handleSubmit called');
    console.log('[UserForm] form state:', form);
    console.log('[UserForm] isEdit:', isEdit);
    setError('');

    if (!form.full_name.trim()) {
      console.log('[UserForm] Validation failed: full_name empty');
      setError('Full name is required');
      return;
    }

    if (!isEdit) {
      if (!form.email.trim()) {
        console.log('[UserForm] Validation failed: email empty');
        setError('Email is required');
        return;
      }
      if (!form.password || form.password.length < 6) {
        console.log('[UserForm] Validation failed: password too short');
        setError('Password must be at least 6 characters');
        return;
      }
    }

    console.log('[UserForm] Validation passed, calling onSave...');
    try {
      if (isEdit) {
        await onSave({ full_name: form.full_name, role: form.role, phone: form.phone });
      } else {
        await onSave(form);
      }
      console.log('[UserForm] onSave completed successfully');
    } catch (err) {
      console.error('[UserForm] onSave error:', err);
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                label="Full Name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                autoFocus
              />
            </Grid>
            {!isEdit && (
              <>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    required
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    required
                    label="Password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    helperText="Minimum 6 characters"
                  />
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Role"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                {roleOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            {isEdit ? 'Update' : 'Create User'}
          </Button>
        </DialogActions>
    </Dialog>
  );
}
