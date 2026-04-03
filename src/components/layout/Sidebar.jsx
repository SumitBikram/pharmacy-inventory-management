import { useState } from 'react';
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
  Collapse,
  Menu,
  MenuItem,
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
  KeyboardDoubleArrowLeftRounded as KeyboardDoubleArrowLeftRounded,
  KeyboardDoubleArrowRightRounded as KeyboardDoubleArrowRightRounded,
  Search as SearchIcon,
  Tune as AlertSettingsIcon,
  ExpandMoreRounded,
  ExpandLessRounded,
  ViewList as ViewListIcon,
  Summarize as SummarizeIcon,
  ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED, ROLES } from '../../lib/constants';
import useAuthStore from '../../features/auth/authStore';

const menuItems = [
  { text: 'Medicine Lookup', icon: <SearchIcon />, path: '/medicine-lookup' },
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Medicines', icon: <MedicineIcon />, path: '/medicines' },
  {
    text: 'Inventory',
    icon: <InventoryIcon />,
    roles: [ROLES.ADMIN, ROLES.ACCOUNTANT],
    children: [
      { text: 'Stock Summary', icon: <SummarizeIcon />, path: '/inventory/summary' },
      { text: 'Stock Batches', icon: <ViewListIcon />, path: '/inventory/batches' },
      { text: 'Purchase History', icon: <ReceiptLongIcon />, path: '/inventory/purchases' },
    ],
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
    text: 'Alert Settings',
    icon: <AlertSettingsIcon />,
    path: '/alert-settings',
    roles: [ROLES.ADMIN],
  },
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
  const [openMenus, setOpenMenus] = useState({});
  const [menuAnchor, setMenuAnchor] = useState(null); // for collapsed popover
  const [popoverChildren, setPopoverChildren] = useState([]);

  const visibleItems = menuItems.filter((item) => !item.roles || item.roles.includes(userRole));

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const toggleSubmenu = (text) => {
    setOpenMenus((prev) => ({ ...prev, [text]: !prev[text] }));
  };

  const handleCollapsedParentClick = (event, children) => {
    setMenuAnchor(event.currentTarget);
    setPopoverChildren(children);
  };

  const handlePopoverClose = () => {
    setMenuAnchor(null);
    setPopoverChildren([]);
  };

  const currentWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const selectedSx = {
    '&.Mui-selected': {
      backgroundColor: 'primary.main',
      color: 'white',
      '&:hover': { backgroundColor: 'primary.dark' },
      '& .MuiListItemIcon-root': { color: 'white' },
    },
  };

  const drawerContent = (isDesktop) => {
    const isCollapsed = isDesktop && collapsed;

    return (
      <>
        <Toolbar sx={{ px: isCollapsed ? '0 !important' : 2, justifyContent: 'center', minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              overflow: 'hidden',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Che Health Care"
              sx={{ height: 36, flexShrink: 0 }}
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
            // Item with children (submenu)
            if (item.children) {
              const isAnyChildActive = item.children.some(
                (c) => location.pathname === c.path,
              );
              const isOpen = openMenus[item.text] ?? isAnyChildActive;

              // Collapsed mode: show popover on click
              if (isCollapsed) {
                const parentButton = (
                  <ListItemButton
                    onClick={(e) => handleCollapsedParentClick(e, item.children)}
                    sx={{
                      borderRadius: 1,
                      justifyContent: 'center',
                      px: 1.5,
                      ...(isAnyChildActive && {
                        backgroundColor: 'action.selected',
                      }),
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
                      {item.icon}
                    </ListItemIcon>
                  </ListItemButton>
                );

                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <Tooltip title={item.text} placement="right" arrow>
                      {parentButton}
                    </Tooltip>
                  </ListItem>
                );
              }

              // Expanded mode: expand/collapse with Collapse
              return (
                <Box key={item.text}>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => toggleSubmenu(item.text)}
                      sx={{
                        borderRadius: 1,
                        px: 2,
                        ...(isAnyChildActive && {
                          backgroundColor: 'action.selected',
                        }),
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, justifyContent: 'center' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                      {isOpen ? <ExpandLessRounded /> : <ExpandMoreRounded />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List disablePadding>
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <ListItem key={child.text} disablePadding sx={{ mb: 0.25 }}>
                            <ListItemButton
                              onClick={() => handleNavigation(child.path)}
                              selected={isChildActive}
                              sx={{
                                borderRadius: 1,
                                pl: 4,
                                py: 0.5,
                                ...selectedSx,
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 32, justifyContent: 'center' }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    bgcolor: 'action.hover',
                                    '& .MuiSvgIcon-root': { fontSize: 16 },
                                  }}
                                >
                                  {child.icon}
                                </Box>
                              </ListItemIcon>
                              <ListItemText
                                primary={child.text}
                                primaryTypographyProps={{ fontSize: '0.875rem' }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                </Box>
              );
            }

            // Regular item (no children)
            const isActive = location.pathname === item.path;
            const button = (
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 1,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  px: isCollapsed ? 1.5 : 2,
                  ...selectedSx,
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
                {isCollapsed ? <KeyboardDoubleArrowRightRounded /> : <KeyboardDoubleArrowLeftRounded />}
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

      {/* Popover menu for collapsed sidebar submenu items */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {popoverChildren.map((child) => (
          <MenuItem
            key={child.text}
            selected={location.pathname === child.path}
            onClick={() => {
              handleNavigation(child.path);
              handlePopoverClose();
            }}
            sx={{ fontSize: '0.875rem', gap: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  bgcolor: 'action.hover',
                  '& .MuiSvgIcon-root': { fontSize: 16 },
                }}
              >
                {child.icon}
              </Box>
            </ListItemIcon>
            {child.text}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
