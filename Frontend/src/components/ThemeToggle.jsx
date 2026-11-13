import { useTheme } from '../hooks/useTheme.js';

const LABELS = { system: 'Tema del sistema', light: 'Tema claro', dark: 'Tema oscuro' };
const NEXT = { system: 'claro', light: 'oscuro', dark: 'del sistema' };

const ICONS = {
  // Monitor
  system: <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v10H4zM9 19h6M12 15v4" />,
  // Sol
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  // Luna
  dark: <path strokeLinecap="round" strokeLinejoin="round" d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />,
};

/**
 * Botón de tema: cada clic pasa a la siguiente opción
 * (sistema → claro → oscuro). El ícono muestra la opción actual.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, cycleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`${LABELS[theme]}. Cambiar a tema ${NEXT[theme]}`}
      title={`${LABELS[theme]} (clic para cambiar a ${NEXT[theme]})`}
      className={`rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        {ICONS[theme]}
      </svg>
    </button>
  );
}
