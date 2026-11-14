import { Link, useParams } from 'react-router';
import { listCategories } from '../../api/categories.js';
import { useFetch } from '../../hooks/useFetch.js';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

const HIGHLIGHTS = [
  { icon: 'check', title: 'Stock en vivo', text: 'Consulta la disponibilidad real antes de venir.' },
  { icon: 'tag', title: 'Precio unitario y por docena', text: 'Para padres de familia, docentes y oficinas.' },
  { icon: 'whatsapp', title: 'Cotiza tu lista por WhatsApp', text: 'Arma tu lista de útiles y te la cotizamos.' },
];

/**
 * Catálogo público (/ y /categoria/:slug).
 * Incremento 2: portada con presentación de la papelería y sus categorías.
 * Incremento 4: cuadrícula de productos, búsqueda con debounce, filtros en la URL y stock en vivo.
 */
export default function CatalogPage() {
  const { slug } = useParams();
  const { data: categories } = useFetch((signal) => listCategories({ signal }), []);
  const list = categories ?? [];

  if (slug) {
    const current = list.find((c) => c.slug === slug);
    return (
      <EmptyState
        icon="folder"
        title={current ? current.name : 'Categoría'}
        description="Los productos de esta categoría, con precios y stock en vivo, estarán disponibles muy pronto."
        action={
          <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-700 hover:underline dark:text-brand-400">
            <Icon name="arrowLeft" className="h-4 w-4" />
            Volver al inicio
          </Link>
        }
      />
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Portada */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-700 px-6 py-10 text-white sm:px-10 sm:py-14 dark:bg-brand-900">
        <div aria-hidden="true" className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent-400/20" />
        <div aria-hidden="true" className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-300">
            <Icon name="sparkles" className="h-3.5 w-3.5" />
            Temporada escolar
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Todo para la escuela y la oficina, en un solo lugar</h1>
          <p className="mt-3 text-base leading-relaxed text-brand-100 sm:text-lg">
            Cuadernos, escritura, arte, archivo y bazar con precios accesibles. Consulta el catálogo y la disponibilidad sin salir de casa.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#categorias"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 font-semibold text-brand-800 shadow-sm transition-colors duration-150 hover:bg-brand-50"
            >
              Ver categorías
              <Icon name="arrowRight" className="h-4 w-4" />
            </a>
            {WHATSAPP_NUMBER && (
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-green-600 px-5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-green-700"
              >
                <Icon name="whatsapp" className="h-5 w-5" />
                Cotizar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {HIGHLIGHTS.map((h) => (
          <li key={h.title} className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300">
              <Icon name={h.icon} className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{h.title}</p>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{h.text}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Categorías */}
      <section id="categorias" aria-labelledby="categorias-title" className="mt-10 scroll-mt-24">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="categorias-title" className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-100">Categorías</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Explora por tipo de artículo.</p>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            El catálogo se está preparando. Muy pronto podrás ver todos los productos aquí.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((c) => (
              <li key={c._id}>
                <Link
                  to={`/categoria/${c.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-400 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-brand-600"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors duration-150 group-hover:bg-brand-700 group-hover:text-white dark:bg-brand-950 dark:text-brand-300">
                    <Icon name="folder" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-900 dark:text-slate-100">{c.name}</span>
                    {c.productCount > 0 && (
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                        {c.productCount} producto{c.productCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
