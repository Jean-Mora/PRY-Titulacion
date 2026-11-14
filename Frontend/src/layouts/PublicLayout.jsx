import { Link, Outlet } from 'react-router';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Icon from '../components/Icon.jsx';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

/** Logo de la marca: iniciales sobre azul con una esquina amarilla (lápiz). */
export function BrandMark({ className = 'h-9 w-9 text-lg' }) {
  return (
    <span aria-hidden="true" className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-brand-700 font-heading font-bold text-white ${className}`}>
      JF
      <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rotate-45 bg-accent-400" />
    </span>
  );
}

/**
 * Estructura del catálogo público: encabezado con buscador y pie con WhatsApp.
 * El buscador queda maquetado; su lógica (debounce + filtros en la URL)
 * llega en el incremento 4.
 */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="skip-link">Saltar al contenido</a>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-lg">
            <BrandMark />
            <span className="leading-tight">
              <span className="block font-heading text-base font-bold text-slate-900 dark:text-slate-100">Jean-Fabri</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Papelería y bazar</span>
            </span>
          </Link>

          <form role="search" className="order-last w-full sm:order-none sm:flex-1" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="catalog-search" className="sr-only">
              Buscar productos
            </label>
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="catalog-search"
                type="search"
                placeholder="Buscar cuadernos, esferos, marcas…"
                className="h-11 w-full rounded-full border border-slate-300 bg-slate-50 pl-10 pr-4 text-sm transition-colors duration-150 placeholder:text-slate-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-brand-900"
              />
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
            <ThemeToggle />
            <Link
              to="/admin"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-300"
            >
              <Icon name="lock" className="h-4 w-4" />
              Ingresar
            </Link>
          </div>
        </div>
      </header>

      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
          <div className="flex items-start gap-2.5">
            <BrandMark className="h-8 w-8 text-sm" />
            <p className="leading-relaxed">
              © {new Date().getFullYear()} Papelería Jean-Fabri
              <span className="block text-xs text-slate-500">Útiles escolares, oficina, arte y bazar · Quito, Ecuador</span>
            </p>
          </div>
          {WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-green-600 px-5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-green-700"
            >
              <Icon name="whatsapp" className="h-5 w-5" />
              Escríbenos por WhatsApp
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
