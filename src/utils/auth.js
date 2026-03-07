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
    locationId: payload?.locationId
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
