import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import ProductsPage from './ProductsPage.jsx';
import ProtectedRoute from '../../../routes/ProtectedRoute.jsx';
import { setToken } from '../../../api/http.js';
import { jsonResponse, mockFetch, renderWithProviders } from '../../../test/utils.jsx';

afterEach(() => vi.unstubAllGlobals());

const PRODUCTS = [
  {
    _id: 'p1', sku: 'LAP-1', name: 'Lápiz HB', price: 0.3, cost: 0.1, stock: 2, stockMin: 5, active: true, tags: ['oferta'],
    category: { name: 'Útiles' }, variants: [{ _id: 'v1', sku: 'LAP-1', stock: 2 }],
  },
  {
    _id: 'p2', sku: 'TEM-1', name: 'Témperas', price: 4, cost: 2.5, stock: 0, stockMin: 0, active: false, tags: [],
    category: { name: 'Arte' }, variants: [{ _id: 'v2', sku: 'TEM-1-6', stock: 0 }, { _id: 'v3', sku: 'TEM-1-12', stock: 0 }],
  },
];

function renderAs(role, extraRoutes = {}) {
  setToken('t');
  const fetch = mockFetch({
    'GET /api/auth/me': () => jsonResponse({ user: { name: 'X', role } }),
    'GET /api/categories': () => jsonResponse({ items: [{ _id: 'c1', name: 'Útiles' }] }),
    'GET /api/products': () => jsonResponse({ items: PRODUCTS, page: 1, limit: 20, total: 2, pages: 1 }),
    ...extraRoutes,
  });
  renderWithProviders(
    <Routes>
      <Route path="/admin/productos" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
    </Routes>,
    { route: '/admin/productos' },
  );
  return fetch;
}

describe('ProductsPage', () => {
  it('muestra precio, costo, estado y avisos de stock', async () => {
    renderAs('admin');
    const lapiz = (await screen.findByText('Lápiz HB')).closest('tr');
    expect(within(lapiz).getByText(/0,30/)).toBeInTheDocument();
    expect(within(lapiz).getByText('2 · bajo')).toBeInTheDocument();
    expect(within(lapiz).getByText('Oferta')).toBeInTheDocument();
    const temperas = screen.getByText('Témperas').closest('tr');
    expect(within(temperas).getByText('Agotado')).toBeInTheDocument();
    expect(within(temperas).getByText('Inactivo')).toBeInTheDocument();
    expect(within(temperas).getByText(/2 variantes/)).toBeInTheDocument();
  });

  it('el administrador ve crear, editar y eliminar', async () => {
    renderAs('admin');
    expect(await screen.findByRole('button', { name: 'Eliminar Lápiz HB' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+ Nuevo producto' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar Lápiz HB' })).toHaveAttribute('href', '/admin/productos/p1');
  });

  it('vendedor: sin botones de crear, editar ni eliminar', async () => {
    renderAs('vendedor');
    await screen.findByText('Lápiz HB');
    expect(screen.queryByRole('link', { name: '+ Nuevo producto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Eliminar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Editar/ })).not.toBeInTheDocument();
  });

  it('la búsqueda espera a que se deje de escribir y filtra en la API', async () => {
    const fetch = renderAs('admin');
    const user = userEvent.setup();
    await screen.findByText('Lápiz HB');
    await user.type(screen.getByLabelText('Buscar'), 'lap');
    await vi.waitFor(() => {
      const urls = fetch.mock.calls.map(([url]) => String(url)).filter((u) => u.startsWith('/api/products'));
      expect(urls.at(-1)).toContain('q=lap');
    });
    const searches = fetch.mock.calls.map(([url]) => String(url)).filter((u) => u.includes('q='));
    expect(searches).toHaveLength(1); // no una petición por tecla
  });

  it('confirma y elimina un producto', async () => {
    renderAs('admin', { 'DELETE /api/products/p2': () => Promise.resolve(new Response(null, { status: 204 })) });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Eliminar Témperas' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByText('Producto “Témperas” eliminado.')).toBeInTheDocument();
  });
});
