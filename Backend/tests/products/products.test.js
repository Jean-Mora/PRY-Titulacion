const mongoose = require('mongoose');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { Category, Product, Movement } = require('../../src/models');
const { useTestDB } = require('../helpers/db');
const { loginAs } = require('../helpers/factories');

useTestDB();

const app = createApp({ loginRateLimit: 1000 });

let category;
let admin;

beforeEach(async () => {
  category = await Category.create({ name: 'Útiles' });
  admin = (await loginAs('admin')).authHeader;
});

const base = (overrides = {}) => ({
  sku: 'cua-100',
  name: 'Cuaderno 100 hojas',
  categoryId: String(category._id),
  price: 1.5,
  cost: 0.9,
  ...overrides,
});

const createProduct = (body) => request(app).post('/api/products').set('Authorization', admin).send(body);

describe('POST /api/products', () => {
  test('crea con variante "Única" si no se envían variantes; incluye la categoría', async () => {
    const res = await createProduct(base({ tags: ['nuevo'], stockMin: 5 }));
    expect(res.status).toBe(201);
    expect(res.body.product).toMatchObject({
      sku: 'CUA-100',
      slug: 'cuaderno-100-hojas-cua-100',
      price: 1.5,
      cost: 0.9,
      stock: 0,
      tags: ['nuevo'],
      category: { name: 'Útiles', slug: 'utiles' },
    });
    expect(res.body.product.variants).toHaveLength(1);
    expect(res.body.product.variants[0]).toMatchObject({ sku: 'CUA-100', stock: 0, label: 'Única' });
  });

  test('crea con variantes; todas empiezan con stock 0', async () => {
    const res = await createProduct(
      base({ variants: [{ sku: 'cua-100-az', color: 'Azul' }, { sku: 'CUA-100-RO', color: 'Rojo', size: 'A4' }] }),
    );
    expect(res.status).toBe(201);
    expect(res.body.product.variants.map((v) => [v.sku, v.label, v.stock])).toEqual([
      ['CUA-100-AZ', 'Azul', 0],
      ['CUA-100-RO', 'Rojo · A4', 0],
    ]);
  });

  test('no acepta stock en la entrada (solo cambia por movimientos)', async () => {
    const res = await createProduct(base({ variants: [{ sku: 'A-1', stock: 50 }] }));
    expect(res.status).toBe(400);
  });

  test('validaciones: precio con 3 decimales, SKU inválido, categoría inexistente', async () => {
    const res = await createProduct(base({ price: 1.234, sku: 'con espacio' }));
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toEqual(expect.arrayContaining(['body.price', 'body.sku']));

    const noCat = await createProduct(base({ categoryId: '64b000000000000000000000' }));
    expect(noCat.status).toBe(400);
    expect(noCat.body.error.code).toBe('CATEGORY_NOT_FOUND');
  });

  test('SKU repetido (de producto o de variante en otro producto) → 409', async () => {
    await createProduct(base({ variants: [{ sku: 'CUA-100-AZ' }] }));
    const sameSku = await createProduct(base({ name: 'Otro' }));
    const sameVariant = await createProduct(base({ sku: 'OTRO-1', name: 'Otro', variants: [{ sku: 'cua-100-az' }] }));
    expect(sameSku.status).toBe(409);
    expect(sameVariant.status).toBe(409);
    expect(sameVariant.body.error.message).toContain('CUA-100-AZ');
  });

  test('SKUs de variante repetidos dentro del mismo producto → 400', async () => {
    const res = await createProduct(base({ variants: [{ sku: 'A-1' }, { sku: 'a-1' }] }));
    expect(res.status).toBe(400);
  });

  test('vendedor no puede crear → 403', async () => {
    const { authHeader } = await loginAs('vendedor');
    const res = await request(app).post('/api/products').set('Authorization', authHeader).send(base());
    expect(res.status).toBe(403);
  });
});

describe('GET /api/products', () => {
  beforeEach(async () => {
    const otra = await Category.create({ name: 'Arte' });
    await Product.create([
      { sku: 'LAP-1', name: 'Lápiz HB', categoryId: category._id, price: 0.3, variants: [{ sku: 'LAP-1', stock: 10 }] },
      { sku: 'BOR-1', name: 'Borrador', categoryId: category._id, price: 0.2, active: false },
      { sku: 'TEM-1', name: 'Témperas', categoryId: otra._id, price: 4, variants: [{ sku: 'TEM-1-6', stock: 3 }, { sku: 'TEM-1-12', stock: 2 }] },
    ]);
  });

  test('vendedor ve el listado con stock total, costo y categoría', async () => {
    const { authHeader } = await loginAs('vendedor');
    const res = await request(app).get('/api/products').set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items.map((p) => [p.name, p.stock])).toEqual([
      ['Borrador', 0],
      ['Lápiz HB', 10],
      ['Témperas', 5],
    ]);
    expect(res.body.items[2].category.name).toBe('Arte');
    expect(res.body.items[0]).toHaveProperty('cost');
  });

  test('busca por nombre o SKU de variante y filtra por categoría y estado', async () => {
    const byName = await request(app).get('/api/products?q=lápiz').set('Authorization', admin);
    expect(byName.body.items.map((p) => p.sku)).toEqual(['LAP-1']);

    const byVariant = await request(app).get('/api/products?q=tem-1-12').set('Authorization', admin);
    expect(byVariant.body.items.map((p) => p.sku)).toEqual(['TEM-1']);

    const byCat = await request(app).get(`/api/products?categoryId=${category._id}&active=true`).set('Authorization', admin);
    expect(byCat.body.items.map((p) => p.sku)).toEqual(['LAP-1']);
  });

  test('sin sesión → 401', async () => {
    expect((await request(app).get('/api/products')).status).toBe(401);
  });
});

describe('PATCH /api/products/:id', () => {
  let product;

  beforeEach(async () => {
    product = await Product.create({
      sku: 'CUA-100',
      name: 'Cuaderno',
      categoryId: category._id,
      price: 1.5,
      variants: [
        { sku: 'CUA-100-AZ', color: 'Azul', stock: 7 },
        { sku: 'CUA-100-RO', color: 'Rojo', stock: 0 },
      ],
    });
  });

  const patch = (body) => request(app).patch(`/api/products/${product._id}`).set('Authorization', admin).send(body);

  test('edita datos generales', async () => {
    const res = await patch({ name: 'Cuaderno universitario', price: 1.75, tags: ['oferta'], active: false });
    expect(res.status).toBe(200);
    expect(res.body.product).toMatchObject({ name: 'Cuaderno universitario', price: 1.75, tags: ['oferta'], active: false });
  });

  test('las variantes existentes conservan su stock; las nuevas empiezan en 0; las vacías se pueden quitar', async () => {
    const [azul] = product.variants;
    const res = await patch({
      variants: [
        { _id: String(azul._id), sku: 'CUA-100-AZ', color: 'Azul marino' },
        { sku: 'CUA-100-VE', color: 'Verde' },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.product.variants.map((v) => [v.sku, v.color, v.stock])).toEqual([
      ['CUA-100-AZ', 'Azul marino', 7],
      ['CUA-100-VE', 'Verde', 0],
    ]);
  });

  test('no se puede quitar una variante con stock → 409', async () => {
    const [, rojo] = product.variants;
    const res = await patch({ variants: [{ _id: String(rojo._id), sku: 'CUA-100-RO' }] });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('VARIANT_HAS_STOCK');
    expect(res.body.error.message).toContain('CUA-100-AZ');
  });

  test('una variante de otro producto → 400', async () => {
    const res = await patch({ variants: [{ _id: String(new mongoose.Types.ObjectId()), sku: 'X-1' }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VARIANT_NOT_FOUND');
  });

  test('cambiar a una categoría inexistente → 400', async () => {
    const res = await patch({ categoryId: '64b000000000000000000000' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/products/:id', () => {
  const del = (id) => request(app).delete(`/api/products/${id}`).set('Authorization', admin);

  test('elimina un producto sin stock ni movimientos → 204', async () => {
    const p = await Product.create({ sku: 'X-1', name: 'Clip', categoryId: category._id, price: 0.05 });
    expect((await del(p._id)).status).toBe(204);
    expect(await Product.exists({ _id: p._id })).toBeNull();
  });

  test('con stock → 409; con movimientos → 409', async () => {
    const withStock = await Product.create({ sku: 'X-2', name: 'Grapas', categoryId: category._id, price: 1, variants: [{ sku: 'X-2', stock: 4 }] });
    const res = await del(withStock._id);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PRODUCT_HAS_STOCK');

    const withMoves = await Product.create({ sku: 'X-3', name: 'Goma', categoryId: category._id, price: 1 });
    await Movement.create({
      type: 'entrada', reason: 'compra', productId: withMoves._id, variantId: withMoves.variants[0]._id,
      quantity: 1, stockAfter: 1, userId: new mongoose.Types.ObjectId(),
    });
    const res2 = await del(withMoves._id);
    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('PRODUCT_HAS_MOVEMENTS');
  });
});
