import { getUser } from '../utils/auth.js';

export function usePermissions() {
  const user = getUser();
  
  // Superadmins and Admins have all permissions implicitly
  const isAdminOrSuper = user?.role === 'superadmin' || user?.role === 'admin';
  const permissions = user?.permissions || [];

  const can = (permission) => {
    if (isAdminOrSuper) return true;
    return permissions.includes(permission);
  };

  return { can, user, isAdminOrSuper };
}
