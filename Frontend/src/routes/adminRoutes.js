import { ROLES } from '../utils/roles.js';

const { ADMIN, VENDEDOR } = ROLES;

/**
 * Secciones del panel (/admin) según la tabla de rutas de la arquitectura.
 * Una sola fuente para: las rutas de App.jsx, el control de rol de
 * ProtectedRoute y el menú lateral de AdminLayout.
 *
 * icon = nombre de ícono de components/Icon.jsx.
 * increment = incremento del plan en que se construye la pantalla.
 * inMenu = false para rutas que no son una entrada del menú.
 */
export const ADMIN_SECTIONS = [
  { path: '', label: 'Panel', icon: 'home', roles: [ADMIN, VENDEDOR], increment: 1, end: true },
  { path: 'venta', label: 'Venta rápida', icon: 'receipt', roles: [ADMIN, VENDEDOR], increment: 3 },
  { path: 'cotizaciones', label: 'Cotizaciones', icon: 'chat', roles: [ADMIN, VENDEDOR], increment: 5 },
  { path: 'productos', label: 'Productos', icon: 'box', roles: [ADMIN, VENDEDOR], increment: 2, end: true },
  { path: 'productos/nuevo', label: 'Nuevo producto', icon: 'box', roles: [ADMIN], increment: 2, inMenu: false },
  { path: 'productos/:id', label: 'Editar producto', icon: 'box', roles: [ADMIN], increment: 2, inMenu: false },
  { path: 'productos/importar', label: 'Importar CSV', icon: 'upload', roles: [ADMIN], increment: 2 },
  { path: 'categorias', label: 'Categorías', icon: 'folder', roles: [ADMIN], increment: 2 },
  { path: 'inventario', label: 'Inventario', icon: 'chart', roles: [ADMIN], increment: 3 },
  { path: 'kardex/:id', label: 'Kárdex', icon: 'book', roles: [ADMIN, VENDEDOR], increment: 3, inMenu: false },
  { path: 'reportes', label: 'Reportes', icon: 'trending', roles: [ADMIN], increment: 6 },
  { path: 'usuarios', label: 'Usuarios', icon: 'users', roles: [ADMIN], increment: null }, // el plan no le asigna incremento aún
];

/** Entradas del menú lateral visibles para un rol. */
export function menuForRole(role) {
  return ADMIN_SECTIONS.filter((s) => s.inMenu !== false && s.roles.includes(role));
}
