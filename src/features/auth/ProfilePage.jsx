import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Chip,
  Divider,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Edit, Save, Cancel, Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import useAuthStore from './authStore';
import { updateUser } from '../users/userService';
import { supabase } from '../../lib/supabase';

const roleConfig = {
  admin: { color: 'error', label: 'Admin' },
  accountant: { color: 'primary', label: 'Accountant' },
  salesman: { color: 'success', label: 'Salesman' },
};

export default function ProfilePage() {
  const { user, profile, fetchProfile, logout } = useAuthStore();
  const navigate = useNavigate();

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordConfirmOpen, setPasswordConfirmOpen] = useState(false);

  // Feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleStartEdit = () => {
    setForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    });
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!form.full_name.trim()) {
      showSnackbar('Full name is required', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      await updateUser(user.id, {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
      });
      const updated = await fetchProfile(user.id);
      useAuthStore.setState({ profile: updated });
      setEditing(false);
      showSnackbar('Profile updated successfully');
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (!passwordForm.new_password || passwordForm.new_password.length < 6) {
      showSnackbar('Password must be at least 6 characters', 'error');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }
    setPasswordConfirmOpen(true);
  };

  const handlePasswordConfirm = async () => {
    setPasswordConfirmOpen(false);
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password,
      });
      if (error) throw error;
      await logout();
      navigate('/login');
    } catch (err) {
      showSnackbar(err.message, 'error');
      setSavingPassword(false);
    }
  };

  return (
    <Box>
      <PageHeader title="My Profile" subtitle="View and manage your account" />

      <Grid container spacing={3}>
        {/* Profile Details */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Profile Details</Typography>
                {!editing ? (
                  <Button startIcon={<Edit />} size="small" onClick={handleStartEdit}>
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<Cancel />}
                      size="small"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      startIcon={<Save />}
                      size="small"
                      variant="contained"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? 'Saving...' : 'Save'}
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={editing ? form.full_name : profile?.full_name || ''}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    disabled={!editing}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user?.email || ''}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={editing ? form.phone : profile?.phone || ''}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    disabled={!editing}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={roleConfig[profile?.role]?.label || profile?.role || '—'}
                    disabled
                    helperText="Role is managed by admin"
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Chip
                              label={roleConfig[profile?.role]?.label || profile?.role || '—'}
                              color={roleConfig[profile?.role]?.color || 'default'}
                              size="small"
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Lock color="action" />
                <Typography variant="h6">Change Password</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, new_password: e.target.value }))
                  }
                  helperText="Minimum 6 characters"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            size="small"
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }))
                  }
                  error={
                    passwordForm.confirm_password.length > 0 &&
                    passwordForm.new_password !== passwordForm.confirm_password
                  }
                  helperText={
                    passwordForm.confirm_password.length > 0 &&
                    passwordForm.new_password !== passwordForm.confirm_password
                      ? 'Passwords do not match'
                      : ''
                  }
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handlePasswordSubmit}
                  disabled={savingPassword || !passwordForm.new_password}
                >
                  {savingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Password change confirmation */}
      <ConfirmDialog
        open={passwordConfirmOpen}
        title="Change Password"
        message="Are you sure you want to change your password? You will be signed out and need to log in again with your new password."
        confirmText="Ok"
        severity="warning"
        onConfirm={handlePasswordConfirm}
        onCancel={() => setPasswordConfirmOpen(false)}
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
