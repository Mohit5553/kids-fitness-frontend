import { Navigate, Outlet } from 'react-router-dom';
import { getUser } from '../utils/auth.js';

export function RequireAuth() {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function RequireAdmin() {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
