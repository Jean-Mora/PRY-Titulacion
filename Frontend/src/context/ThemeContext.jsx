import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Modo claro / oscuro.
 *
 * theme (preferencia del usuario):
 *   'system' → sigue al sistema operativo (valor por defecto)
 *   'light'  → siempre claro
 *   'dark'   → siempre oscuro
 * resolvedTheme: lo que se ve realmente ('light' | 'dark').
 *
 * La preferencia se guarda en localStorage (jf_theme) y se aplica como la
 * clase "dark" en <html>; Tailwind usa esa clase para las variantes dark:.
 * index.html aplica la misma lógica antes de cargar React.
 */
export const ThemeContext = createContext(null);

export const THEMES = ['system', 'light', 'dark'];
const STORAGE_KEY = 'jf_theme';
const QUERY = '(prefers-color-scheme: dark)';

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Si la preferencia es "system", reacciona cuando el sistema cambia de modo.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(QUERY);
    const onChange = (e) => setSystemDark(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next)) return;
    setThemeState(next);
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* sin almacenamiento: la preferencia dura lo que la pestaña */
    }
  }, []);

  /** Pasa a la siguiente opción: sistema → claro → oscuro → sistema. */
  const cycleTheme = useCallback(() => {
    setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]);
  }, [theme, setTheme]);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme, cycleTheme }), [theme, resolvedTheme, setTheme, cycleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
