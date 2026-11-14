import Button from './Button.jsx';
import Icon from './Icon.jsx';

/** Paginación simple con anterior/siguiente para los listados { page, pages, total }. */
export default function Pagination({ page, pages, total, onChange }) {
  const summary = total !== undefined ? `${total} resultado${total === 1 ? '' : 's'}` : '';
  if (!pages || pages <= 1) {
    return summary ? <p className="text-sm text-slate-500 dark:text-slate-400">{summary}</p> : null;
  }
  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Página <span className="font-semibold text-slate-700 dark:text-slate-200">{page}</span> de {pages} · {summary}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <Icon name="chevronLeft" className="h-4 w-4" />
          Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Siguiente
          <Icon name="chevronRight" className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
