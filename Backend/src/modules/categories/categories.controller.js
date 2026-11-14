/**
 * Controlador de categorías.
 */
const categoriesService = require('./categories.service');

async function list(_req, res) {
  res.json({ items: await categoriesService.list() });
}

async function create(req, res) {
  res.status(201).json({ category: await categoriesService.create(req.validated.body) });
}

async function update(req, res) {
  res.json({ category: await categoriesService.update(req.validated.params.id, req.validated.body) });
}

async function remove(req, res) {
  await categoriesService.remove(req.validated.params.id);
  res.status(204).end();
}

module.exports = { list, create, update, remove };
