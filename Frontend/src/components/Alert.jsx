const TONES = {
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300',
  success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300',
  info: 'border-brand-100 bg-brand-50 text-brand-800 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-300',
};

/** Mensaje en línea. Los errores usan role="alert" para que el lector de pantalla los anuncie. */
export default function Alert({ tone = 'error', children, className = '' }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2.5 text-sm ${TONES[tone]} ${className}`}>
      {children}
    </div>
  );
}
