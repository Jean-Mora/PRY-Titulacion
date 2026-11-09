import { Link, Outlet } from 'react-router';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

/**
 * Estructura del catálogo público: encabezado con buscador y pie con WhatsApp.
 * El buscador queda maquetado; su lógica (debounce + filtros en la URL)
 * llega en el incremento 4.
 */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-lg font-bold text-white">
              JF
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold text-slate-900">Jean-Fabri</span>
              <span className="block text-xs text-slate-500">Papelería y bazar</span>
            </span>
          </Link>

          <form role="search" className="order-last w-full sm:order-none sm:flex-1" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="catalog-search" className="sr-only">
              Buscar productos
            </label>
            <input
              id="catalog-search"
              type="search"
              placeholder="Buscar cuadernos, esferos, marcas…"
              className="w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </form>

          <Link to="/admin" className="ml-auto shrink-0 text-sm font-medium text-slate-600 hover:text-brand-700 sm:ml-0">
            Ingresar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Papelería Jean-Fabri · Útiles escolares, oficina, arte y bazar.</p>
          {WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start rounded-full bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
            >
              Escríbenos por WhatsApp
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
