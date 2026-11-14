import { http } from './http.js';

/**
 * Productos (panel). Incluyen costo, stock total (suma de variantes) y
 * la categoría poblada: { _id, sku, name, price, cost, stock, stockMin, tags,
 * active, categoryId, category: { name, slug }, variants: [{ _id, sku, color,
 * size, model, stock, label }] }.
 *
 *   GET    /api/products?page&limit&q&categoryId&active → { items, page, limit, total, pages }
 *   GET    /api/products/:id   → { product }
 *   POST   /api/products       → { product }
 *   PATCH  /api/products/:id   → { product }
 *   DELETE /api/products/:id   → 204
 */
export function listProducts(params = {}, opts) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const qs = query.toString();
  return http.get(`/api/products${qs ? `?${qs}` : ''}`, opts);
}

export async function getProduct(id, opts) {
  return (await http.get(`/api/products/${id}`, opts)).product;
}

export async function createProduct(body) {
  return (await http.post('/api/products', body)).product;
}

export async function updateProduct(id, body) {
  return (await http.patch(`/api/products/${id}`, body)).product;
}

export function deleteProduct(id) {
  return http.delete(`/api/products/${id}`);
}
