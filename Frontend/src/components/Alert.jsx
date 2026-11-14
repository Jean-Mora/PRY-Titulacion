import Icon from './Icon.jsx';

const TONES = {
  error: {
    classes: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200',
    icon: 'warning',
  },
  success: {
    classes: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200',
    icon: 'check',
  },
  info: {
    classes: 'border-brand-100 bg-brand-50 text-brand-800 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-200',
    icon: 'info',
  },
};

/**
 * Mensaje en línea con ícono. Los errores usan role="alert" para que el
 * lector de pantalla los anuncie; el color nunca es la única señal.
 */
export default function Alert({ tone = 'error', children, className = '' }) {
  const t = TONES[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm animate-fade-in ${t.classes} ${className}`}>
      <Icon name={t.icon} className="mt-0.5 h-4 w-4" strokeWidth={2} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
