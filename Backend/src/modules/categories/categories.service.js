/**
 * Lógica de negocio de categorías. No conoce req ni res.
 */
const AppError = require('../../utils/AppError');
const Category = require('./categories.model');
const Product = require('../products/products.model');

const DUPLICATE_KEY = 11000;

function rethrowDuplicate(err) {
  if (err.code === DUPLICATE_KEY) {
    throw AppError.conflict('Ya existe una categoría con ese nombre o slug.', 'CATEGORY_TAKEN');
  }
  throw err;
}

/**
 * Lista completa, ordenada por nombre. Las categorías son pocas (decenas),
 * así que no se pagina. Incluye cuántos productos tiene cada una.
 */
async function list() {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$categoryId', count: { $sum: 1 } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.count]));
  return categories.map((c) => ({ ...c, productCount: byId.get(String(c._id)) ?? 0 }));
}

async function getById(id) {
  const category = await Category.findById(id);
  if (!category) throw AppError.notFound('Categoría no encontrada.', 'CATEGORY_NOT_FOUND');
  return category;
}

async function create(data) {
  try {
    return await Category.create(data);
  } catch (err) {
    return rethrowDuplicate(err);
  }
}

async function update(id, changes) {
  const category = await getById(id);
  Object.assign(category, changes);
  try {
    return await category.save();
  } catch (err) {
    return rethrowDuplicate(err);
  }
}

/** No se borra una categoría con productos: primero hay que moverlos. */
async function remove(id) {
  const category = await getById(id);
  const inUse = await Product.countDocuments({ categoryId: category._id });
  if (inUse > 0) {
    throw AppError.conflict(
      `No se puede eliminar: la categoría tiene ${inUse} producto${inUse === 1 ? '' : 's'}. Muévelos a otra categoría primero.`,
      'CATEGORY_IN_USE',
    );
  }
  await category.deleteOne();
}

module.exports = { list, getById, create, update, remove };
