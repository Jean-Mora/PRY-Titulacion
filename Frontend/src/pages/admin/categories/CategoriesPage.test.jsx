import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import CategoriesPage from './CategoriesPage.jsx';
import { setToken } from '../../../api/http.js';
import { jsonResponse, mockFetch, renderWithProviders } from '../../../test/utils.jsx';

afterEach(() => vi.unstubAllGlobals());

const ME = { 'GET /api/auth/me': () => jsonResponse({ user: { name: 'Admin', role: 'admin' } }) };

function renderPage(routes) {
  setToken('t');
  const fetch = mockFetch({ ...ME, ...routes });
  renderWithProviders(
    <Routes>
      <Route path="/admin/categorias" element={<CategoriesPage />} />
    </Routes>,
    { route: '/admin/categorias' },
  );
  return fetch;
}

const CATS = [
  { _id: 'c1', name: 'Arte', slug: 'arte', description: '', productCount: 0 },
  { _id: 'c2', name: 'Útiles', slug: 'utiles', description: 'Escolares', productCount: 3 },
];

describe('CategoriesPage', () => {
  it('lista las categorías con su número de productos', async () => {
    renderPage({ 'GET /api/categories': () => jsonResponse({ items: CATS }) });
    const row = (await screen.findByText('Útiles')).closest('tr');
    expect(within(row).getByText('3')).toBeInTheDocument();
    expect(within(row).getByText('/categoria/utiles')).toBeInTheDocument();
  });

  it('crea una categoría y recarga la lista', async () => {
    let items = [];
    const fetch = renderPage({
      'GET /api/categories': () => jsonResponse({ items }),
      'POST /api/categories': (_url, init) => {
        const body = JSON.parse(init.body);
        items = [{ _id: 'n1', slug: 'oficina', productCount: 0, ...body }];
        return jsonResponse({ category: items[0] }, 201);
      },
    });
    const user = userEvent.setup();

    await screen.findByText('Aún no hay categorías');
    await user.click(screen.getByRole('button', { name: 'Nueva categoría' }));
    const dialog = screen.getByRole('dialog', { name: 'Nueva categoría' });
    await user.type(within(dialog).getByLabelText('Nombre'), '  Oficina ');
    await user.click(within(dialog).getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('Categoría “Oficina” creada.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const post = fetch.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(post[1].body)).toEqual({ name: 'Oficina', description: '' });
    expect(await screen.findByText('/categoria/oficina')).toBeInTheDocument();
  });

  it('valida el nombre sin llamar a la API', async () => {
    const fetch = renderPage({ 'GET /api/categories': () => jsonResponse({ items: [] }) });
    const user = userEvent.setup();
    await screen.findByText('Aún no hay categorías');
    await user.click(screen.getByRole('button', { name: 'Nueva categoría' }));
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    expect(screen.getByText('El nombre debe tener al menos 2 caracteres.')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('muestra el error del backend al eliminar una categoría con productos', async () => {
    renderPage({
      'GET /api/categories': () => jsonResponse({ items: CATS }),
      'DELETE /api/categories/c2': () =>
        jsonResponse({ error: { code: 'CATEGORY_IN_USE', message: 'No se puede eliminar: la categoría tiene 3 productos.' } }, 409),
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Eliminar Útiles' }));
    const dialog = screen.getByRole('dialog', { name: 'Eliminar categoría' });
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('tiene 3 productos');
  });
});
