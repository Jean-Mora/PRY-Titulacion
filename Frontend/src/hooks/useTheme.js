import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';

/** Acceso al tema (claro/oscuro). Debe usarse dentro de <ThemeProvider>. */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  return ctx;
}
