import { Navigate, Outlet } from 'react-router-dom';
import { getUser, getRoleSlug } from '../utils/auth.js';

export function RequireAuth({ children }) {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children || <Outlet />;
}

export const RequireTrainer = ({ children }) => {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'trainer') return <Navigate to="/dashboard" replace />;
  return children || <Outlet />;
};

export function RequireAdmin({ children }) {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Allow if superadmin OR admin OR has some permissions (Staff)
  const isStaff = user.role === 'superadmin' || user.role === 'admin' || (user.permissions && user.permissions.length > 0);
  
  if (!isStaff) {
    return <Navigate to="/dashboard" replace />;
  }
  return children || <Outlet />;
}

export function RequirePermission({ permission, children }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  
  const hasPerm = user.role === 'superadmin' || user.role === 'admin' || (user.permissions && user.permissions.includes(permission));
  
  if (!hasPerm) {
    return <Navigate to={`/${getRoleSlug(user.role)}`} replace />;
  }
  return children || <Outlet />;
}
