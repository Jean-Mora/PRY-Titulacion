import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';
import { menuForRole } from '../routes/adminRoutes.js';
import { ROLE_LABELS } from '../utils/roles.js';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { BrandMark } from './PublicLayout.jsx';

/** Iniciales del usuario para el avatar (p. ej. "Ana Pérez" → "AP"). */
function initials(user) {
  const source = user.name || user.email || '';
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Estructura del panel de administración: menú lateral según el rol del
 * usuario (en móvil se abre como cajón) y barra superior con la sesión.
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = menuForRole(user.role);

  // Al navegar se cierra el cajón; con Escape también.
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const nav = (
    <nav aria-label="Menú del panel" className="flex flex-col gap-0.5 p-3">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path ? `/admin/${item.path}` : '/admin'}
          end={item.end}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} className={`h-5 w-5 ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-slate-400 dark:text-slate-500'}`} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5 dark:border-slate-800">
      <BrandMark className="h-8 w-8 text-sm" />
      <span className="font-heading font-bold text-slate-900 dark:text-slate-100">Panel Jean-Fabri</span>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <a href="#contenido" className="skip-link">Saltar al contenido</a>

      {/* Menú lateral fijo en escritorio */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:block lg:h-screen dark:border-slate-800 dark:bg-slate-900">
        {brand}
        {nav}
      </aside>

      {/* Cajón en móvil */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] animate-fade-in" onClick={() => setMenuOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl animate-slide-in-left dark:bg-slate-900">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
              <span className="flex items-center gap-2.5 font-heading font-bold text-slate-900 dark:text-slate-100">
                <BrandMark className="h-8 w-8 text-sm" />
                Panel
              </span>
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setMenuOpen(false)}
                className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Icon name="close" className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition-colors duration-150 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <Icon name="menu" className="h-6 w-6" strokeWidth={2} />
          </button>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 dark:border-slate-800">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                {initials(user)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name ?? user.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[user.role] ?? user.role}</p>
              </div>
            </div>
            <Button variant="ghost" size="md" icon="logout" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión" className="!px-2.5">
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </header>

        <main id="contenido" className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
