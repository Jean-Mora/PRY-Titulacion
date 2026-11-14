import Spinner from './Spinner.jsx';

const VARIANTS = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 focus-visible:outline-brand-700',
  secondary:
    'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:outline-brand-700',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-brand-700',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

/** Botón de la interfaz. loading desactiva el botón y muestra un spinner. */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" label="Procesando" />}
      {children}
    </button>
  );
}
