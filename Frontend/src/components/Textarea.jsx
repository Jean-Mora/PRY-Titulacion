import { useId } from 'react';

/** Área de texto con etiqueta y error accesibles (mismo estilo que Input). */
export default function Textarea({ label, error, hint, id, className = '', rows = 3, ...props }) {
  const autoId = useId();
  const areaId = id ?? autoId;
  const describedBy = error ? `${areaId}-error` : hint ? `${areaId}-hint` : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={areaId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-brand-600 focus:ring-brand-100 dark:border-slate-700 dark:focus:ring-brand-900'
        }`}
        {...props}
      />
      {error ? (
        <p id={`${areaId}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${areaId}-hint`} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
