import Icon from './Icon.jsx';

/** Mensaje para pantallas sin datos, sin permiso o aún no construidas. */
export default function EmptyState({ icon = 'box', title, description, action }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center animate-fade-in">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-900">
        <Icon name={icon} className="h-8 w-8" strokeWidth={1.5} />
      </span>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {description && <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
