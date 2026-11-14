import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import { menuForRole } from '../../routes/adminRoutes.js';
import { ROLE_LABELS } from '../../utils/roles.js';
import Icon from '../../components/Icon.jsx';

const DESCRIPTIONS = {
  venta: 'Registra ventas de mostrador.',
  cotizaciones: 'Arma presupuestos y envíalos por WhatsApp.',
  productos: 'Catálogo, variantes y precios.',
  'productos/importar': 'Carga masiva desde un archivo CSV.',
  categorias: 'Agrupa los productos del catálogo.',
  inventario: 'Entradas, salidas y ajustes de stock.',
  reportes: 'Más vendidos, sin movimiento y stock mínimo.',
  usuarios: 'Cuentas de administradores y vendedores.',
};

/**
 * Panel de inicio (/admin). En el incremento 1 muestra el saludo y los
 * accesos rápidos según el rol; las alertas de stock mínimo en vivo
 * (evento stock:low) y el resumen del día se agregan en el incremento 3.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const shortcuts = menuForRole(user.role).filter((s) => s.path !== '');
  const firstName = (user.name ?? user.email ?? '').split(/[\s@]/)[0];

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100">Hola, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Sesión como <strong className="font-semibold text-slate-800 dark:text-slate-200">{ROLE_LABELS[user.role] ?? user.role}</strong>. Elige una sección para empezar.
        </p>
      </header>

      <section
        aria-labelledby="alerts-title"
        className="mt-6 flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
          <Icon name="bell" className="h-5 w-5" />
        </span>
        <div>
          <h2 id="alerts-title" className="font-semibold text-slate-900 dark:text-slate-100">Alertas de stock mínimo</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Aquí aparecerán en vivo los productos que lleguen a su stock mínimo (incremento 3, inventario en tiempo real).
          </p>
        </div>
      </section>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Accesos rápidos</h2>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((s) => (
          <li key={s.path}>
            <Link
              to={`/admin/${s.path}`}
              className="group flex h-full items-start gap-3.5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-400 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-brand-600"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors duration-150 group-hover:bg-brand-700 group-hover:text-white dark:bg-brand-950 dark:text-brand-300">
                <Icon name={s.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-slate-900 dark:text-slate-100">{s.label}</span>
                <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{DESCRIPTIONS[s.path]}</span>
              </span>
              <Icon name="chevronRight" className="ml-auto mt-3 h-4 w-4 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand-600 dark:text-slate-600" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
