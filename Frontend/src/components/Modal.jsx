import { useEffect, useId, useRef } from 'react';

/**
 * Ventana modal accesible: role="dialog", título enlazado, cierra con Escape
 * o clic en el fondo, enfoca el primer campo al abrir y devuelve el foco al
 * elemento que la abrió al cerrarse.
 */
export default function Modal({ open, title, onClose, children, footer, size = 'md' }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector('input, select, textarea, button:not([data-modal-close])');
    (first ?? panel)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" aria-label="Cerrar" tabIndex={-1} className="absolute inset-0 bg-slate-900/50 dark:bg-black/60" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full ${width} max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl ring-1 ring-slate-200 focus:outline-none sm:rounded-2xl dark:bg-slate-900 dark:ring-slate-800`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            type="button"
            data-modal-close
            aria-label="Cerrar ventana"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
