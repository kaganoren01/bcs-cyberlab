import { useState } from 'react';

const TOKEN_KEY = 'bcs_auth_token';
const EMAIL_KEY = 'bcs_auth_email';

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeJWT(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
}

export function useAuth() {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    return isTokenValid(t) ? t : null;
  });
  const [email, setEmail] = useState(() =>
    isTokenValid(localStorage.getItem(TOKEN_KEY))
      ? localStorage.getItem(EMAIL_KEY)
      : null
  );

  function login(newToken, newEmail) {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(EMAIL_KEY, newEmail);
    setToken(newToken);
    setEmail(newEmail);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken(null);
    setEmail(null);
  }

  return { isAuthenticated: !!token, email, login, logout };
}
