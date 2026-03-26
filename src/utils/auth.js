const TOKEN_KEY = 'kfb_token';
const USER_KEY = 'kfb_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setAuth = (payload) => {
  if (payload?.token) {
    localStorage.setItem(TOKEN_KEY, payload.token);
  }
  const user = {
    _id: payload?._id,
    name: payload?.name,
    email: payload?.email,
    role: payload?.role,
    locationId: payload?.locationId,
    trainerId: payload?.trainerId,
    permissions: payload?.permissions
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getRoleSlug = (role) => {
  if (!role) return 'dashboard';
  const r = role.toLowerCase();
  if (r === 'parent' || r === 'customer') return 'dashboard';
  if (r === 'trainer') return 'trainer/dashboard';
  // Remove spaces and underscores for staff roles (e.g. "Store Manager" -> "storemanger")
  return r.replace(/[\s_]/g, '');
};
