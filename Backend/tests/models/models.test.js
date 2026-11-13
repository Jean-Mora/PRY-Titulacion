/**
 * Pruebas de los 5 modelos: reglas de negocio que viven en el esquema e índices.
 */
const mongoose = require('mongoose');
const { User, Category, Product, Movement, Quotation } = require('../../src/models');
const { canTransition } = require('../../src/modules/quotations/quotations.model');
const { useTestDB } = require('../helpers/db');

useTestDB();

const oid = () => new mongoose.Types.ObjectId();

describe('User', () => {
  test('email único, en minúsculas; toJSON oculta passwordHash', async () => {
    const u = await User.create({ name: 'Ana', email: 'ANA@x.test', passwordHash: 'h', role: 'admin' });
    expect(u.email).toBe('ana@x.test');
    expect(u.toJSON().passwordHash).toBeUndefined();
    await expect(User.create({ name: 'Otra', email: 'ana@x.test', passwordHash: 'h', role: 'vendedor' })).rejects.toMatchObject({
      code: 11000,
    });
  });

  test('rol fuera de admin/vendedor es inválido', async () => {
    await expect(User.create({ name: 'X', email: 'x@x.test', passwordHash: 'h', role: 'jefe' })).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  test('passwordHash no se devuelve por defecto', async () => {
    await User.create({ name: 'Ana', email: 'a@x.test', passwordHash: 'secreto', role: 'admin' });
    expect((await User.findOne({ email: 'a@x.test' })).passwordHash).toBeUndefined();
  });
});

describe('Category', () => {
  test('genera slug sin tildes y es único', async () => {
    const c = await Category.create({ name: 'Útiles Escolares Ñandú' });
    expect(c.slug).toBe('utiles-escolares-nandu');
    await expect(Category.create({ name: 'Útiles escolares ñandú' })).rejects.toMatchObject({ code: 11000 });
  });
});

describe('Product', () => {
  const base = () => ({ sku: 'cua-100', name: 'Cuaderno 100 hojas', categoryId: oid(), price: 1.5 });

  test('sin variantes crea la variante "Única" con el SKU del producto', async () => {
    const p = await Product.create(base());
    expect(p.sku).toBe('CUA-100');
    expect(p.slug).toBe('cuaderno-100-hojas-cua-100');
    expect(p.variants).toHaveLength(1);
    expect(p.variants[0]).toMatchObject({ sku: 'CUA-100', stock: 0 });
    expect(p.variants[0].label).toBe('Única');
  });

  test('el stock del producto es la suma de sus variantes y no se guarda', async () => {
    const p = await Product.create({
      ...base(),
      variants: [
        { sku: 'CUA-100-AZ', color: 'Azul', stock: 5 },
        { sku: 'CUA-100-RO', color: 'Rojo', size: 'A4', stock: 7 },
      ],
    });
    expect(p.stock).toBe(12);
    expect(p.variants[1].label).toBe('Rojo · A4');
    const raw = await Product.collection.findOne({ _id: p._id });
    expect(raw.stock).toBeUndefined();
  });

  test('una variante no puede tener stock negativo ni decimal', async () => {
    await expect(Product.create({ ...base(), variants: [{ sku: 'A', stock: -1 }] })).rejects.toThrow(/negativo/);
    await expect(Product.create({ ...base(), variants: [{ sku: 'A', stock: 1.5 }] })).rejects.toThrow(/entero/);
  });

  test('sku de producto único', async () => {
    await Product.create(base());
    await expect(Product.create({ ...base(), name: 'Otro nombre' })).rejects.toMatchObject({ code: 11000 });
  });

  test('tiene los índices de la arquitectura', async () => {
    const indexes = await Product.collection.indexes();
    const keys = indexes.map((i) => Object.keys(i.key).join('+'));
    expect(keys).toEqual(expect.arrayContaining(['categoryId', '_fts+_ftsx', 'variants.sku', 'sku', 'slug']));
  });
});

describe('Movement', () => {
  const base = () => ({ productId: oid(), variantId: oid(), userId: oid(), stockAfter: 10 });

  test('acepta combinaciones válidas de tipo y motivo', async () => {
    await expect(Movement.create({ ...base(), type: 'entrada', reason: 'compra', quantity: 10 })).resolves.toBeTruthy();
    await expect(Movement.create({ ...base(), type: 'salida', reason: 'cotizacion', quantity: 2 })).resolves.toBeTruthy();
    await expect(Movement.create({ ...base(), type: 'ajuste', reason: 'conteo', quantity: -3 })).resolves.toBeTruthy();
  });

  test('rechaza un motivo que no corresponde al tipo', async () => {
    await expect(Movement.create({ ...base(), type: 'entrada', reason: 'venta', quantity: 1 })).rejects.toThrow(/no corresponde/);
  });

  test('entrada/salida exigen cantidad positiva; ajuste distinto de 0', async () => {
    await expect(Movement.create({ ...base(), type: 'salida', reason: 'venta', quantity: -1 })).rejects.toThrow(/mayor que 0/);
    await expect(Movement.create({ ...base(), type: 'ajuste', reason: 'conteo', quantity: 0 })).rejects.toThrow(/0 unidades/);
  });

  test('stockAfter nunca negativo; no tiene updatedAt', async () => {
    await expect(Movement.create({ ...base(), type: 'salida', reason: 'venta', quantity: 1, stockAfter: -1 })).rejects.toThrow();
    const m = await Movement.create({ ...base(), type: 'entrada', reason: 'compra', quantity: 1 });
    expect(m.createdAt).toBeInstanceOf(Date);
    expect(m.updatedAt).toBeUndefined();
  });

  test('índice productId + variantId + createdAt', async () => {
    const keys = (await Movement.collection.indexes()).map((i) => Object.keys(i.key).join('+'));
    expect(keys).toContain('productId+variantId+createdAt');
  });
});

describe('Quotation', () => {
  const base = () => ({
    code: 'cot-000001',
    customer: { name: 'María', phone: '0991234567' },
    items: [
      { productId: oid(), variantId: oid(), name: 'Lápiz', price: 0.35, quantity: 3 },
      { productId: oid(), variantId: oid(), name: 'Cuaderno', price: 1.1, quantity: 2 },
    ],
  });

  test('calcula el total sin errores de redondeo y registra el estado inicial', async () => {
    const q = await Quotation.create(base());
    expect(q.total).toBe(3.25);
    expect(q.status).toBe('recibida');
    expect(q.code).toBe('COT-000001');
    expect(q.history).toHaveLength(1);
    expect(q.history[0].status).toBe('recibida');
  });

  test('necesita al menos un ítem', async () => {
    await expect(Quotation.create({ ...base(), items: [] })).rejects.toThrow(/al menos un ítem/);
  });

  test.each([
    ['recibida', 'confirmada', true],
    ['recibida', 'cancelada', true],
    ['confirmada', 'vendida', true],
    ['confirmada', 'cancelada', true],
    ['recibida', 'vendida', false],
    ['vendida', 'cancelada', false],
    ['cancelada', 'recibida', false],
  ])('transición %s → %s: %s', (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });

  test('índice status + createdAt', async () => {
    const keys = (await Quotation.collection.indexes()).map((i) => Object.keys(i.key).join('+'));
    expect(keys).toContain('status+createdAt');
  });
});
