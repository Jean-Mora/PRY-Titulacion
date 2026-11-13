const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-4' };

/** Indicador de carga. Con fullScreen ocupa toda la pantalla (carga inicial, lazy). */
export default function Spinner({ size = 'md', label = 'Cargando…', fullScreen = false }) {
  const spinner = (
    <span role="status" className="inline-flex items-center gap-3 text-slate-500 dark:text-slate-400">
      <span
        aria-hidden="true"
        className={`${SIZES[size]} animate-spin rounded-full border-brand-600 border-t-transparent`}
      />
      <span className={size === 'sm' ? 'sr-only' : 'text-sm'}>{label}</span>
    </span>
  );
  if (!fullScreen) return spinner;
  return <div className="flex min-h-screen items-center justify-center">{spinner}</div>;
}
