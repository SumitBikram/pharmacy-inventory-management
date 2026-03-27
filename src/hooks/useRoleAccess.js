import useAuthStore from '../features/auth/authStore';
import { ROLES } from '../lib/constants';

export default function useRoleAccess() {
  const { profile } = useAuthStore();
  const role = profile?.role;

  return {
    role,
    isAdmin: role === ROLES.ADMIN,
    isAccountant: role === ROLES.ACCOUNTANT,
    isSalesman: role === ROLES.SALESMAN,
    canManageMedicines: role === ROLES.ADMIN,
    canManageSuppliers: role === ROLES.ADMIN,
    canManageStock: [ROLES.ADMIN, ROLES.ACCOUNTANT].includes(role),
    canBill: [ROLES.ADMIN, ROLES.SALESMAN].includes(role),
    canViewReports: [ROLES.ADMIN, ROLES.ACCOUNTANT].includes(role),
  };
}
