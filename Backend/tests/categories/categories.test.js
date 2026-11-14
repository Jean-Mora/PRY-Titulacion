const request = require('supertest');
const { createApp } = require('../../src/app');
const { Category, Product } = require('../../src/models');
const { useTestDB } = require('../helpers/db');
const { loginAs } = require('../helpers/factories');

useTestDB();

const app = createApp({ loginRateLimit: 1000 });

describe('GET /api/categories (público)', () => {
  test('lista ordenada por nombre con el número de productos', async () => {
    const utiles = await Category.create({ name: 'Útiles escolares' });
    await Category.create({ name: 'Arte' });
    await Product.create({ sku: 'LAP-1', name: 'Lápiz', categoryId: utiles._id, price: 0.3 });

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body.items.map((c) => [c.name, c.productCount])).toEqual([
      ['Arte', 0],
      ['Útiles escolares', 1],
    ]);
    expect(res.body.items[1].slug).toBe('utiles-escolares');
  });
});

describe('POST /api/categories', () => {
  test('admin crea; el slug se genera del nombre', async () => {
    const { authHeader } = await loginAs('admin');
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', authHeader)
      .send({ name: '  Oficina y Papelería ', description: 'Carpetas, hojas, sobres' });
    expect(res.status).toBe(201);
    expect(res.body.category).toMatchObject({ name: 'Oficina y Papelería', slug: 'oficina-y-papeleria' });
  });

  test('sin sesión 401; vendedor 403', async () => {
    const { authHeader } = await loginAs('vendedor');
    expect((await request(app).post('/api/categories').send({ name: 'X' })).status).toBe(401);
    expect((await request(app).post('/api/categories').set('Authorization', authHeader).send({ name: 'Arte' })).status).toBe(403);
  });

  test('nombre repetido → 409; nombre corto o slug inválido → 400', async () => {
    const { authHeader } = await loginAs('admin');
    await Category.create({ name: 'Arte' });
    const dup = await request(app).post('/api/categories').set('Authorization', authHeader).send({ name: 'Arte' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CATEGORY_TAKEN');

    const bad = await request(app).post('/api/categories').set('Authorization', authHeader).send({ name: 'A', slug: 'Con Espacios' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.details.map((d) => d.field)).toEqual(expect.arrayContaining(['body.name', 'body.slug']));
  });
});

describe('PATCH /api/categories/:id', () => {
  test('cambia nombre y descripción; el slug se mantiene (enlaces estables)', async () => {
    const { authHeader } = await loginAs('admin');
    const cat = await Category.create({ name: 'Arte' });
    const res = await request(app)
      .patch(`/api/categories/${cat._id}`)
      .set('Authorization', authHeader)
      .send({ name: 'Arte y manualidades', description: 'Pinturas' });
    expect(res.status).toBe(200);
    expect(res.body.category).toMatchObject({ name: 'Arte y manualidades', slug: 'arte', description: 'Pinturas' });
  });

  test('id inexistente → 404', async () => {
    const { authHeader } = await loginAs('admin');
    const res = await request(app).patch('/api/categories/64b000000000000000000000').set('Authorization', authHeader).send({ name: 'Nuevo' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/categories/:id', () => {
  test('elimina una categoría vacía → 204', async () => {
    const { authHeader } = await loginAs('admin');
    const cat = await Category.create({ name: 'Bazar' });
    const res = await request(app).delete(`/api/categories/${cat._id}`).set('Authorization', authHeader);
    expect(res.status).toBe(204);
    expect(await Category.exists({ _id: cat._id })).toBeNull();
  });

  test('con productos → 409 CATEGORY_IN_USE', async () => {
    const { authHeader } = await loginAs('admin');
    const cat = await Category.create({ name: 'Bazar' });
    await Product.create({ sku: 'TAZ-1', name: 'Taza', categoryId: cat._id, price: 3 });
    const res = await request(app).delete(`/api/categories/${cat._id}`).set('Authorization', authHeader);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_IN_USE');
  });
});
