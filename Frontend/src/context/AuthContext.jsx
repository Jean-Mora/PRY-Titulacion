import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.js';
import { clearToken, getToken, onUnauthorized, setToken } from '../api/http.js';

/**
 * Estado global mínimo de la aplicación: la sesión.
 *
 * status:
 *   'loading'        → validando el token guardado con GET /api/auth/me
 *   'authenticated'  → hay usuario
 *   'anonymous'      → sin sesión
 */
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (getToken() ? 'loading' : 'anonymous'));

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus('anonymous');
  }, []);

  // Al recargar la página, recupera la sesión consultando /api/auth/me.
  useEffect(() => {
    if (!getToken()) return undefined;
    const controller = new AbortController();
    authApi
      .me({ signal: controller.signal })
      .then((u) => {
        setUser(u);
        setStatus('authenticated');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        // Token inválido o servidor caído: se pide iniciar sesión de nuevo.
        clearToken();
        setUser(null);
        setStatus('anonymous');
      });
    return () => controller.abort();
  }, []);

  // Cualquier 401 de la API (sesión vencida) cierra la sesión.
  useEffect(() => onUnauthorized(logout), [logout]);

  const login = useCallback(async (email, password) => {
    const { token, user: loggedUser } = await authApi.login(email, password);
    setToken(token);
    // Si el backend no devuelve el usuario en el login, se consulta /me.
    const u = loggedUser ?? (await authApi.me());
    setUser(u);
    setStatus('authenticated');
    return u;
  }, []);

  const value = useMemo(
    () => ({ user, status, isAuthenticated: status === 'authenticated', login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
