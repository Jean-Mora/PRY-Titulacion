const TONES = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  brand: 'bg-brand-50 text-brand-800 ring-brand-100 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-900',
  success: 'bg-green-50 text-green-800 ring-green-200 dark:bg-green-950/60 dark:text-green-300 dark:ring-green-900',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900',
  danger: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900',
};

/** Etiqueta pequeña de estado (Activo, Oferta, Stock bajo…). */
export default function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
