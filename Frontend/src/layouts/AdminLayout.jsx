import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';
import { menuForRole } from '../routes/adminRoutes.js';
import { ROLE_LABELS } from '../utils/roles.js';
import Button from '../components/Button.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

/**
 * Estructura del panel de administración: menú lateral según el rol del
 * usuario (en móvil se abre como cajón) y barra superior con la sesión.
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = menuForRole(user.role);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const nav = (
    <nav aria-label="Menú del panel" className="flex flex-col gap-1 p-3">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path ? `/admin/${item.path}` : '/admin'}
          end={item.end}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? 'bg-brand-50 dark:bg-brand-950 text-brand-800 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Menú lateral fijo en escritorio */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-5">
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">
            JF
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100">Panel Jean-Fabri</span>
        </div>
        {nav}
      </aside>

      {/* Cajón en móvil */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-64 bg-white dark:bg-slate-900 shadow-xl">
            <div className="flex h-16 items-center border-b border-slate-200 dark:border-slate-800 px-5 font-bold text-slate-900 dark:text-slate-100">Panel Jean-Fabri</div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4">
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name ?? user.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
