import { http } from './http.js';

/**
 * Categorías.
 *   GET    /api/categories       → { items: [{ _id, name, slug, description, productCount }] }
 *   POST   /api/categories       → { category }
 *   PATCH  /api/categories/:id   → { category }
 *   DELETE /api/categories/:id   → 204 (409 si tiene productos)
 */
export async function listCategories(opts) {
  const data = await http.get('/api/categories', opts);
  return data.items;
}

export async function createCategory(body) {
  return (await http.post('/api/categories', body)).category;
}

export async function updateCategory(id, body) {
  return (await http.patch(`/api/categories/${id}`, body)).category;
}

export function deleteCategory(id) {
  return http.delete(`/api/categories/${id}`);
}
