import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Chip,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
} from '@mui/material';
import { Menu as MenuIcon, Person, Logout } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from '../../lib/constants';
import useAuthStore from '../../features/auth/authStore';
import ConfirmDialog from '../shared/ConfirmDialog';

const drawerTransition =
  'width 225ms cubic-bezier(0.4, 0, 0.2, 1), margin-left 225ms cubic-bezier(0.4, 0, 0.2, 1)';

export default function Topbar({ onMenuToggle, collapsed }) {
  const currentWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, logout } = useAuthStore();

  const firstName = profile?.full_name?.split(' ')[0] || '';

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogoutClick = () => {
    handleClose();
    setLogoutOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${currentWidth}px)` },
          ml: { md: `${currentWidth}px` },
          transition: { md: drawerTransition },
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={onMenuToggle} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {profile?.role && (
            <Chip
              label={profile.role}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mr: 2, textTransform: 'capitalize' }}
            />
          )}

          {firstName && (
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Hi, {firstName}
            </Typography>
          )}

          <IconButton onClick={handleMenu} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {firstName ? firstName[0].toUpperCase() : '?'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { minWidth: 200 } } }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {profile?.full_name || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem onClick={handleLogoutClick} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              Log Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <ConfirmDialog
        open={logoutOpen}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Yes, Log Out"
        severity="error"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutOpen(false)}
      />
    </>
  );
}
