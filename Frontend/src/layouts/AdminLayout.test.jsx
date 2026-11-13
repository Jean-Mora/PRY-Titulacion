import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import AdminLayout from './AdminLayout.jsx';
import { setToken } from '../api/http.js';
import { jsonResponse, mockFetch, renderWithProviders } from '../test/utils.jsx';

afterEach(() => vi.unstubAllGlobals());

async function renderAs(role) {
  setToken('t');
  mockFetch({ 'GET /api/auth/me': () => jsonResponse({ user: { name: 'Prueba', role } }) });
  const { default: ProtectedRoute } = await import('../routes/ProtectedRoute.jsx');
  renderWithProviders(
    <Routes>
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<p>Inicio</p>} />
      </Route>
    </Routes>,
    { route: '/admin' },
  );
  await screen.findByText('Inicio');
  return within(screen.getAllByRole('navigation', { name: 'Menú del panel' })[0]);
}

describe('AdminLayout', () => {
  it('el administrador ve todas las secciones', async () => {
    const menu = await renderAs('admin');
    for (const label of ['Panel', 'Venta rápida', 'Productos', 'Categorías', 'Inventario', 'Reportes', 'Usuarios']) {
      expect(menu.getByRole('link', { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it('el vendedor solo ve sus secciones', async () => {
    const menu = await renderAs('vendedor');
    expect(menu.getByRole('link', { name: /Venta rápida/ })).toBeInTheDocument();
    expect(menu.getByRole('link', { name: /Cotizaciones/ })).toBeInTheDocument();
    expect(menu.queryByRole('link', { name: /Usuarios/ })).not.toBeInTheDocument();
    expect(menu.queryByRole('link', { name: /Reportes/ })).not.toBeInTheDocument();
    expect(menu.queryByRole('link', { name: /Categorías/ })).not.toBeInTheDocument();
  });
});
