const AUTH_TOKEN_KEY = "token";
const AUTH_USER_KEY = "user";

const getAuthStorage = () => {
  if (localStorage.getItem(AUTH_TOKEN_KEY)) return localStorage;
  if (sessionStorage.getItem(AUTH_TOKEN_KEY)) return sessionStorage;
  return localStorage;
};

export const getStoredToken = () => (
  localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || ""
).trim();

export const getStoredUserRaw = () => (
  localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY) || ""
);

export const getStoredUser = (fallback = {}) => {
  const raw = getStoredUserRaw();
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const setAuthSession = ({ token, user, remember = true }) => {
  const primaryStorage = remember ? localStorage : sessionStorage;
  const secondaryStorage = remember ? sessionStorage : localStorage;

  secondaryStorage.removeItem(AUTH_TOKEN_KEY);
  secondaryStorage.removeItem(AUTH_USER_KEY);

  primaryStorage.setItem(AUTH_TOKEN_KEY, token);
  primaryStorage.setItem(AUTH_USER_KEY, JSON.stringify(user || {}));
};

export const setStoredToken = (token) => {
  getAuthStorage().setItem(AUTH_TOKEN_KEY, token);
};

export const setStoredUser = (user) => {
  getAuthStorage().setItem(AUTH_USER_KEY, JSON.stringify(user || {}));
};

export const clearStoredUser = () => {
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
};
