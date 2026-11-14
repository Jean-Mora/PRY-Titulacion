import Button from './Button.jsx';

/** Paginación simple con anterior/siguiente para los listados { page, pages, total }. */
export default function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) {
    return total !== undefined ? <p className="text-sm text-slate-500 dark:text-slate-400">{total} resultado{total === 1 ? '' : 's'}</p> : null;
  }
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Página {page} de {pages} · {total} resultado{total === 1 ? '' : 's'}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Siguiente →
        </Button>
      </div>
    </nav>
  );
}
