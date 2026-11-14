/**
 * Controlador de productos.
 */
const productsService = require('./products.service');

async function list(req, res) {
  res.json(await productsService.list(req.validated.query));
}

async function getById(req, res) {
  res.json({ product: await productsService.getById(req.validated.params.id) });
}

async function create(req, res) {
  res.status(201).json({ product: await productsService.create(req.validated.body) });
}

async function update(req, res) {
  res.json({ product: await productsService.update(req.validated.params.id, req.validated.body) });
}

async function remove(req, res) {
  await productsService.remove(req.validated.params.id);
  res.status(204).end();
}

module.exports = { list, getById, create, update, remove };
