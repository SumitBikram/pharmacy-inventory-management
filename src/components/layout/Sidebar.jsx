import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LocalPharmacy as MedicineIcon,
  Inventory as InventoryIcon,
  PointOfSale as BillingIcon,
  LocalShipping as SupplierIcon,
  NotificationsActive as AlertIcon,
  Assessment as ReportIcon,
  PeopleAlt as UsersIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED, ROLES } from '../../lib/constants';
import useAuthStore from '../../features/auth/authStore';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Medicines', icon: <MedicineIcon />, path: '/medicines' },
  { text: 'Medicine Lookup', icon: <SearchIcon />, path: '/medicine-lookup' },
  {
    text: 'Inventory',
    icon: <InventoryIcon />,
    path: '/inventory',
    roles: [ROLES.ADMIN, ROLES.ACCOUNTANT],
  },
  {
    text: 'Billing',
    icon: <BillingIcon />,
    path: '/billing',
    roles: [ROLES.ADMIN, ROLES.SALESMAN],
  },
  { text: 'Suppliers', icon: <SupplierIcon />, path: '/suppliers', roles: [ROLES.ADMIN] },
  { text: 'Alerts', icon: <AlertIcon />, path: '/alerts' },
  {
    text: 'Reports',
    icon: <ReportIcon />,
    path: '/reports',
    roles: [ROLES.ADMIN, ROLES.ACCOUNTANT],
  },
  { text: 'Users', icon: <UsersIcon />, path: '/users', roles: [ROLES.ADMIN] },
];

const drawerTransition = 'width 225ms cubic-bezier(0.4, 0, 0.2, 1)';

export default function Sidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const userRole = profile?.role;

  const visibleItems = menuItems.filter((item) => !item.roles || item.roles.includes(userRole));

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const currentWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const drawerContent = (isDesktop) => {
    const isCollapsed = isDesktop && collapsed;

    return (
      <>
        <Toolbar>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
              overflow: 'hidden',
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Che Health Care"
              sx={{ height: 32, flexShrink: 0 }}
            />
            {!isCollapsed && (
              <Typography variant="h6" color="primary" noWrap>
                Che Health Care
              </Typography>
            )}
          </Box>
        </Toolbar>
        <Divider />
        <List sx={{ px: isCollapsed ? 0.5 : 1, pt: 1, flexGrow: 1 }}>
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            const button = (
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 1,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  px: isCollapsed ? 1.5 : 2,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': { backgroundColor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: isCollapsed ? 0 : 40, justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && <ListItemText primary={item.text} />}
              </ListItemButton>
            );

            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                {isCollapsed ? (
                  <Tooltip title={item.text} placement="right" arrow>
                    {button}
                  </Tooltip>
                ) : (
                  button
                )}
              </ListItem>
            );
          })}
        </List>
        {isDesktop && (
          <>
            <Divider />
            <Box
              sx={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-end', p: 1 }}
            >
              <IconButton onClick={onToggleCollapse} size="small">
                {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Box>
          </>
        )}
      </>
    );
  };

  return (
    <Box
      component="nav"
      sx={{ width: { md: currentWidth }, flexShrink: { md: 0 }, transition: drawerTransition }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawerContent(false)}
      </Drawer>
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: currentWidth,
            transition: drawerTransition,
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent(true)}
      </Drawer>
    </Box>
  );
}
