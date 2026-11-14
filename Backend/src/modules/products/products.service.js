/**
 * Lógica de negocio de productos y variantes. No conoce req ni res.
 *
 * Reglas:
 *  - El stock de las variantes nunca se modifica aquí (solo movements.service).
 *    Una variante nueva empieza en 0; al editar, las variantes existentes
 *    (enviadas con su _id) conservan su stock.
 *  - No se puede quitar una variante que todavía tiene stock.
 *  - Un SKU (de producto o de variante) no puede repetirse en otro producto.
 *  - Un producto con movimientos no se borra: se desactiva (active: false),
 *    para no romper el kárdex.
 */
const AppError = require('../../utils/AppError');
const { toSkip, buildPage } = require('../../utils/pagination');
const Product = require('./products.model');
const Category = require('../categories/categories.model');
const Movement = require('../movements/movements.model');

const DUPLICATE_KEY = 11000;
const CATEGORY_FIELDS = 'name slug';

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rethrowDuplicate(err) {
  if (err.code === DUPLICATE_KEY) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    const message = field === 'slug' ? 'Ya existe un producto con ese nombre y SKU.' : 'Ya existe un producto con ese SKU.';
    throw AppError.conflict(message, 'SKU_TAKEN');
  }
  throw err;
}

async function ensureCategory(categoryId) {
  if (!(await Category.exists({ _id: categoryId }))) {
    throw AppError.badRequest('La categoría no existe.', [{ field: 'body.categoryId', message: 'Categoría no encontrada' }], 'CATEGORY_NOT_FOUND');
  }
}

/** Revisa que los SKUs de variante no estén usados por OTRO producto. */
async function ensureVariantSkusFree(variants, productId) {
  const skus = variants.map((v) => v.sku);
  if (skus.length === 0) return;
  const filter = { $or: [{ 'variants.sku': { $in: skus } }, { sku: { $in: skus } }] };
  if (productId) filter._id = { $ne: productId };
  const clash = await Product.findOne(filter).select('sku name variants.sku').lean();
  if (clash) {
    const used = [clash.sku, ...clash.variants.map((v) => v.sku)].find((s) => skus.includes(s));
    throw AppError.conflict(`El SKU ${used} ya lo usa el producto "${clash.name}".`, 'SKU_TAKEN');
  }
}

/**
 * Combina las variantes enviadas con las actuales:
 *  - con _id: debe existir; actualiza color/talla/modelo/SKU y CONSERVA el stock.
 *  - sin _id: variante nueva con stock 0.
 *  - las que no se envían se eliminan, salvo que tengan stock.
 */
function mergeVariants(current, incoming) {
  const byId = new Map(current.map((v) => [String(v._id), v]));
  const kept = new Set();

  const merged = incoming.map((input) => {
    if (!input._id) return { sku: input.sku, color: input.color ?? '', size: input.size ?? '', model: input.model ?? '', stock: 0 };
    const existing = byId.get(input._id);
    if (!existing) {
      throw AppError.badRequest('Una de las variantes no pertenece a este producto.', undefined, 'VARIANT_NOT_FOUND');
    }
    kept.add(input._id);
    return {
      _id: existing._id,
      sku: input.sku,
      color: input.color ?? existing.color,
      size: input.size ?? existing.size,
      model: input.model ?? existing.model,
      stock: existing.stock,
    };
  });

  const removedWithStock = current.filter((v) => !kept.has(String(v._id)) && v.stock > 0);
  if (removedWithStock.length > 0) {
    const names = removedWithStock.map((v) => `${v.sku} (${v.stock} u.)`).join(', ');
    throw AppError.conflict(
      `No se puede quitar una variante con stock: ${names}. Primero registra un ajuste a 0.`,
      'VARIANT_HAS_STOCK',
    );
  }
  return merged;
}

async function list({ page, limit, q, categoryId, active }) {
  const filter = {};
  if (categoryId) filter.categoryId = categoryId;
  if (active !== undefined) filter.active = active;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { 'variants.sku': rx }];
  }

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ name: 1 }).skip(toSkip({ page, limit })).limit(limit).populate('category', CATEGORY_FIELDS),
    Product.countDocuments(filter),
  ]);
  return buildPage(items, total, { page, limit });
}

async function getById(id) {
  const product = await Product.findById(id).populate('category', CATEGORY_FIELDS);
  if (!product) throw AppError.notFound('Producto no encontrado.', 'PRODUCT_NOT_FOUND');
  return product;
}

async function create(data) {
  await ensureCategory(data.categoryId);
  const variants = (data.variants ?? []).map(({ _id, ...v }) => ({ ...v, stock: 0 }));
  await ensureVariantSkusFree([{ sku: data.sku }, ...variants], null);

  try {
    const product = await Product.create({ ...data, variants });
    return product.populate('category', CATEGORY_FIELDS);
  } catch (err) {
    return rethrowDuplicate(err);
  }
}

async function update(id, changes) {
  const product = await getById(id);
  const { variants, ...rest } = changes;

  if (rest.categoryId && String(rest.categoryId) !== String(product.categoryId)) await ensureCategory(rest.categoryId);

  const nextVariants = variants ? mergeVariants(product.variants, variants) : null;
  const skusToCheck = [...(nextVariants ?? []), ...(rest.sku ? [{ sku: rest.sku }] : [])];
  await ensureVariantSkusFree(skusToCheck, product._id);

  Object.assign(product, rest);
  if (nextVariants) product.variants = nextVariants;

  try {
    await product.save();
    return product.populate('category', CATEGORY_FIELDS);
  } catch (err) {
    return rethrowDuplicate(err);
  }
}

async function remove(id) {
  const product = await getById(id);
  if (await Movement.exists({ productId: product._id })) {
    throw AppError.conflict(
      'Este producto tiene movimientos en el kárdex y no se puede eliminar. Desactívalo para ocultarlo del catálogo.',
      'PRODUCT_HAS_MOVEMENTS',
    );
  }
  if (product.stock > 0) {
    throw AppError.conflict('No se puede eliminar un producto con stock. Desactívalo o registra un ajuste a 0.', 'PRODUCT_HAS_STOCK');
  }
  await product.deleteOne();
}

module.exports = { list, getById, create, update, remove };
