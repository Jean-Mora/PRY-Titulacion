import Spinner from './Spinner.jsx';
import Icon from './Icon.jsx';

const VARIANTS = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-sm',
  secondary:
    'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
};

/* Altura mínima: 36 px en acciones de tabla, 44 px (objetivo táctil) en el resto. */
const SIZES = {
  sm: 'min-h-9 px-3 py-1.5 text-sm gap-1.5',
  md: 'min-h-11 px-4 py-2.5 text-sm gap-2',
  lg: 'min-h-12 px-5 py-3 text-base gap-2',
};

const ICON_SIZES = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-5 w-5' };

/**
 * Botón de la interfaz.
 * - loading desactiva el botón y muestra un spinner.
 * - icon = nombre de Icon, decorativo a la izquierda del texto.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? <Spinner size="sm" label="Procesando" /> : icon && <Icon name={icon} className={ICON_SIZES[size]} />}
      {children}
    </button>
  );
}
