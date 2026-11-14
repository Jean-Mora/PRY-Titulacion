import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import { menuForRole } from '../../routes/adminRoutes.js';
import { ROLE_LABELS } from '../../utils/roles.js';

/**
 * Panel de inicio (/admin). En el incremento 1 muestra el saludo y los
 * accesos rápidos según el rol; las alertas de stock mínimo en vivo
 * (evento stock:low) y el resumen del día se agregan en el incremento 3.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const shortcuts = menuForRole(user.role).filter((s) => s.path !== '');

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hola, {user.name ?? user.email}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Sesión como <strong>{ROLE_LABELS[user.role] ?? user.role}</strong>. Elige una sección para empezar.
      </p>

      <section aria-labelledby="alerts-title" className="mt-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <h2 id="alerts-title" className="font-semibold text-slate-900 dark:text-slate-100">Alertas de stock mínimo</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Disponible en el incremento 3 (inventario en tiempo real).</p>
      </section>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Accesos rápidos</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shortcuts.map((s) => (
          <li key={s.path}>
            <Link
              to={`/admin/${s.path}`}
              className="flex h-full flex-col gap-2 rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 transition hover:ring-brand-500"
            >
              <span aria-hidden="true" className="text-2xl">{s.icon}</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
