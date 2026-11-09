import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

/** Acceso a la sesión: { user, status, isAuthenticated, login, logout }. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
