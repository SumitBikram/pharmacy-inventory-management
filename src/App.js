import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './app/theme';
import ErrorBoundary from './components/shared/ErrorBoundary';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthGuard from './features/auth/AuthGuard';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/reports/DashboardPage';
import MedicinesPage from './features/medicines/MedicinesPage';
import InventoryPage from './features/inventory/InventoryPage';
import BillingPage from './features/billing/BillingPage';
import SuppliersPage from './features/suppliers/SuppliersPage';
import AlertsPage from './features/alerts/AlertsPage';
import ReportsPage from './features/reports/ReportsPage';
import UsersPage from './features/users/UsersPage';
import useAuthStore from './features/auth/authStore';
import { ROLES } from './lib/constants';

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* All authenticated routes */}
            <Route element={<AuthGuard />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/medicines" element={<MedicinesPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/alerts" element={<AlertsPage />} />

                {/* Admin + Salesman */}
                <Route element={<AuthGuard allowedRoles={[ROLES.ADMIN, ROLES.SALESMAN]} />}>
                  <Route path="/billing" element={<BillingPage />} />
                </Route>

                {/* Admin only */}
                <Route element={<AuthGuard allowedRoles={[ROLES.ADMIN]} />}>
                  <Route path="/suppliers" element={<SuppliersPage />} />
                  <Route path="/users" element={<UsersPage />} />
                </Route>

                {/* Admin + Accountant */}
                <Route element={<AuthGuard allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]} />}>
                  <Route path="/reports" element={<ReportsPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
