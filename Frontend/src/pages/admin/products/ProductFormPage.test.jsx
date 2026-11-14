import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import ProductFormPage from './ProductFormPage.jsx';
import { setToken } from '../../../api/http.js';
import { jsonResponse, mockFetch, renderWithProviders } from '../../../test/utils.jsx';

afterEach(() => vi.unstubAllGlobals());

const PRODUCT = {
  _id: 'p1', sku: 'CUA-100', name: 'Cuaderno', categoryId: 'c1', price: 1.5, cost: 0.9, stockMin: 3,
  description: '', tags: [], active: true,
  variants: [
    { _id: 'v1', sku: 'CUA-100-AZ', color: 'Azul', size: '', model: '', stock: 7 },
    { _id: 'v2', sku: 'CUA-100-RO', color: 'Rojo', size: '', model: '', stock: 0 },
  ],
};

function renderForm(route, routes = {}) {
  setToken('t');
  const fetch = mockFetch({
    'GET /api/auth/me': () => jsonResponse({ user: { name: 'Admin', role: 'admin' } }),
    'GET /api/categories': () => jsonResponse({ items: [{ _id: 'c1', name: 'Útiles' }] }),
    ...routes,
  });
  renderWithProviders(
    <Routes>
      <Route path="/admin/productos" element={<p>Listado de productos</p>} />
      <Route path="/admin/productos/nuevo" element={<ProductFormPage />} />
      <Route path="/admin/productos/:id" element={<ProductFormPage />} />
    </Routes>,
    { route },
  );
  return fetch;
}

const bodyOf = (fetch, method) => JSON.parse(fetch.mock.calls.find(([, init]) => init?.method === method)[1].body);

describe('ProductFormPage', () => {
  it('valida los campos antes de enviar', async () => {
    const fetch = renderForm('/admin/productos/nuevo');
    const user = userEvent.setup();
    await screen.findByRole('option', { name: 'Útiles' });
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));
    expect(screen.getByText('El SKU debe tener al menos 2 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('Elige una categoría.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa un precio válido (ej. 1.50).')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('crea un producto con variantes; no envía stock', async () => {
    const fetch = renderForm('/admin/productos/nuevo', {
      'POST /api/products': (_u, init) => jsonResponse({ product: { _id: 'n', ...JSON.parse(init.body) } }, 201),
    });
    const user = userEvent.setup();
    await screen.findByRole('option', { name: 'Útiles' });

    await user.type(screen.getByLabelText('SKU'), 'esf-1');
    await user.type(screen.getByLabelText('Nombre'), 'Esfero azul');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'c1');
    await user.type(screen.getByLabelText('Precio de venta (USD)'), '0.45');
    await user.click(screen.getByRole('checkbox', { name: 'Nuevo' }));
    await user.click(screen.getByRole('button', { name: 'Agregar variante' }));
    await user.type(screen.getByLabelText('Color de la variante 1'), 'Azul');
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    expect(await screen.findByText('Listado de productos')).toBeInTheDocument();
    expect(bodyOf(fetch, 'POST')).toEqual({
      sku: 'ESF-1', name: 'Esfero azul', categoryId: 'c1', price: 0.45, cost: 0, stockMin: 0, description: '',
      tags: ['nuevo'], active: true,
      variants: [{ sku: 'ESF-1-1', color: 'Azul', size: '', model: '' }],
    });
  });

  it('edita: carga el producto, no deja quitar variantes con stock y conserva los _id', async () => {
    const fetch = renderForm('/admin/productos/p1', {
      'GET /api/products/p1': () => jsonResponse({ product: PRODUCT }),
      'PATCH /api/products/p1': (_u, init) => jsonResponse({ product: { ...PRODUCT, ...JSON.parse(init.body) } }),
    });
    const user = userEvent.setup();

    expect(await screen.findByDisplayValue('Cuaderno')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar variante 1' })).toBeDisabled(); // tiene 7 en stock
    await user.click(screen.getByRole('button', { name: 'Quitar variante 2' }));
    await user.clear(screen.getByLabelText('Precio de venta (USD)'));
    await user.type(screen.getByLabelText('Precio de venta (USD)'), '1.75');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Listado de productos')).toBeInTheDocument();
    const body = bodyOf(fetch, 'PATCH');
    expect(body.price).toBe(1.75);
    expect(body.variants).toEqual([{ _id: 'v1', sku: 'CUA-100-AZ', color: 'Azul', size: '', model: '' }]);
  });

  it('muestra el error del backend (SKU repetido) y se queda en el formulario', async () => {
    renderForm('/admin/productos/nuevo', {
      'POST /api/products': () => jsonResponse({ error: { code: 'SKU_TAKEN', message: 'Ya existe un producto con ese SKU.' } }, 409),
    });
    const user = userEvent.setup();
    await screen.findByRole('option', { name: 'Útiles' });
    await user.type(screen.getByLabelText('SKU'), 'CUA-100');
    await user.type(screen.getByLabelText('Nombre'), 'Otro');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'c1');
    await user.type(screen.getByLabelText('Precio de venta (USD)'), '1');
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un producto con ese SKU.');
    expect(screen.queryByText('Listado de productos')).not.toBeInTheDocument();
  });

  it('producto inexistente → mensaje y enlace de vuelta', async () => {
    renderForm('/admin/productos/zz', { 'GET /api/products/zz': () => jsonResponse({ error: { message: 'Producto no encontrado.' } }, 404) });
    expect(await screen.findByText('El producto no existe o fue eliminado.')).toBeInTheDocument();
  });
});
