import { useId } from 'react';

/**
 * Lista desplegable con etiqueta y error accesibles.
 * options = [{ value, label }]; placeholder agrega una opción vacía al inicio.
 */
export default function Select({ label, error, hint, id, options = [], placeholder, className = '', ...props }) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-brand-600 focus:ring-brand-100 dark:border-slate-700 dark:focus:ring-brand-900'
        }`}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
