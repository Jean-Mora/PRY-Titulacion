/** Mensaje para pantallas sin datos, sin permiso o aún no construidas. */
export default function EmptyState({ icon = '📄', title, description, action }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <span aria-hidden="true" className="mb-4 text-5xl">
        {icon}
      </span>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
